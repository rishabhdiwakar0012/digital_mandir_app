import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AutomatedNotificationsService } from '../../modules/notifications/automated-notifications.service';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { hashPassword, comparePassword } from '../../common/utils';
import {
  User,
  UserDocument,
  Session,
  SessionDocument,
  Otp,
  OtpDocument,
} from '../../common/database/schemas';
import {
  AuthTokens,
  JwtPayload,
  RegisterData,
  IAuthService,
} from './interfaces';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);
  private smtpTransporter: nodemailer.Transporter | null = null;
  private smtpVerified = false;

  private maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return 'invalid-email';
    const [name, domain] = email.split('@');
    if (!name || !domain) return 'invalid-email';
    if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  private maskSmtpUser(user?: string): string {
    if (!user) return 'not-set';
    if (user.includes('@')) return this.maskEmail(user);
    if (user.length <= 3) return `${user[0] || '*'}***`;
    return `${user.slice(0, 3)}***`;
  }

  private formatMailError(error: any): string {
    if (!error) return 'unknown error';
    return JSON.stringify({
      name: error?.name,
      message: error?.message,
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
    });
  }

  private getSmtpTransporter(): nodemailer.Transporter {
    if (this.smtpTransporter) {
      return this.smtpTransporter;
    }

    const smtpHost = this.configService.get<string>('email.smtpHost');
    const smtpPort = this.configService.get<number>('email.smtpPort') || 587;
    const smtpUser = this.configService.get<string>('email.smtpUser');
    const smtpPass = this.configService.get<string>('email.smtpPass');

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new InternalServerErrorException(
        'SMTP is not configured correctly',
      );
    }

    this.logger.log(
      `smtp:init host=${smtpHost} port=${smtpPort} secure=${smtpPort === 465} user=${this.maskSmtpUser(smtpUser)}`,
    );

    this.smtpTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    return this.smtpTransporter;
  }

  private async verifySmtpTransporter(): Promise<void> {
    if (this.smtpVerified) return;

    try {
      const transporter = this.getSmtpTransporter();
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await transporter.verify();
          this.smtpVerified = true;
          this.logger.log('smtp:verify_success');
          return;
        } catch (error: any) {
          lastError = error;
          this.logger.warn(
            `smtp:verify_failed attempt=${attempt}/${maxRetries} ${this.formatMailError(error)}`,
          );

          // Check if it's an auth error - these usually can't be retried
          if (error?.code === 'EAUTH' || error?.responseCode === 535) {
            this.logger.error(
              `smtp:auth_failed - SMTP credentials are invalid. Check SMTP_USER and SMTP_PASS environment variables.`,
            );
            // Don't throw immediately - the app should still work, we'll just fail to send emails
            // This allows development/testing even without working SMTP
            this.smtpVerified = false;
            throw new InternalServerErrorException(
              'SMTP authentication failed. Please check your email configuration.',
            );
          }

          // For other errors, wait a bit before retry
          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempt),
            );
          }
        }
      }

      this.logger.error(
        `smtp:verify_failed_all_retries ${this.formatMailError(lastError)}`,
      );
      this.smtpVerified = false;
      throw new InternalServerErrorException(
        'SMTP connection failed after multiple retries. Please check your email configuration.',
      );
    } catch (error: any) {
      // If SMTP verification fails, log it but don't crash the app
      // In development, emails can be logged to console instead
      this.logger.warn(
        `smtp:verification_skipped_will_fallback_to_console - ${error?.message || String(error)}`,
      );
      // Set a flag that SMTP is unavailable
      this.smtpVerified = false;
    }
  }

  private async sendOtpEmail(
    to: string,
    otp: string,
    purpose: 'login' | 'register' | 'password-reset',
    language?: string,
  ): Promise<void> {
    await this.verifySmtpTransporter();
    const transporter = this.getSmtpTransporter();
    const from =
      this.configService.get<string>('email.from') ||
      'noreply@digitalmandir.in';
    const appName = 'Digital Mandir';
    const isHindi = language === 'hi';
    const purposeLabel = isHindi
      ? purpose === 'password-reset'
        ? 'पासवर्ड रीसेट'
        : 'लॉगिन सत्यापन'
      : purpose === 'password-reset'
        ? 'Password Reset'
        : 'Login Verification';

    this.logger.log(
      `smtp:send_start purpose=${purpose} from=${this.maskEmail(from)} to=${this.maskEmail(to)}`,
    );

    const logoPath = path.resolve(
      process.cwd(),
      '../frontend/assets/adaptive-icon.png',
    );
    const hasLogo = fs.existsSync(logoPath);
    const attachments = hasLogo
      ? [
          {
            filename: 'adaptive-icon.png',
            path: logoPath,
            cid: 'applogo',
          },
        ]
      : [];

    const logoHtml = hasLogo
      ? `<img src="cid:applogo" alt="${appName} Logo" style="width: 56px; height: 56px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: inline-block; vertical-align: middle; margin-right: 14px; object-fit: contain; background: #fff; padding: 4px;" />`
      : '';

    const textContent = isHindi
      ? `नमस्ते!\n\n${appName} ${purposeLabel} के लिए आपका वन-टाइम पासवर्ड (OTP): ${otp}\n\nयह कोड 5 मिनट के लिए मान्य है। कृपया इसे किसी के साथ साझा न करें।\n\nयदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।`
      : `Namaste!\n\nYour One-Time Password (OTP) for ${appName} ${purposeLabel} is: ${otp}\n\nThis code is valid for 5 minutes. Please do not share this with anyone.\n\nIf you didn't request this, please ignore this email.`;

    const greeting = isHindi ? 'नमस्ते! 🙏' : 'Namaste! 🙏';
    const greetingBody = isHindi
      ? 'आपने सत्यापन के लिए एक अनुरोध किया है। कृपया आगे बढ़ने के लिए नीचे दिए गए वन-टाइम पासवर्ड (OTP) का उपयोग करें।'
      : "You've requested an action requiring verification. Please use the following One-Time Password (OTP) to proceed.";
    const otpLabel = isHindi
      ? 'सुरक्षित सत्यापन कोड'
      : 'Secure Verification Code';
    const warningNote = isHindi
      ? '<strong>ध्यान दें:</strong> यह OTP <strong>5 मिनट</strong> के लिए मान्य है। सुरक्षा के लिए, कृपया इस कोड को किसी के साथ साझा न करें।'
      : '<strong>Note:</strong> This OTP is valid for <strong>5 minutes</strong>. For your security, please do not share this code with anyone.';
    const footerIgnore = isHindi
      ? 'यदि आपने यह ईमेल अनुरोध नहीं किया है, तो आप इसे सुरक्षित रूप से अनदेखा कर सकते हैं।'
      : "If you didn't request this email, you can safely ignore it.";
    const footerRights = isHindi
      ? 'सर्वाधिकार सुरक्षित'
      : 'All rights reserved';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} OTP</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #2c3e50; }
        .wrapper { padding: 40px 20px; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #E65100 0%, #FF9800 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; display: inline-block; vertical-align: middle; }
        .content { padding: 30px 24px; text-align: center; }
        .content h2 { color: #E65100; font-size: 20px; margin-top: 0; margin-bottom: 16px; font-weight: 600; }
        .content p { font-size: 15px; line-height: 1.6; color: #546e7a; margin-bottom: 24px; }
        @media only screen and (max-width: 480px) {
          .wrapper { padding: 16px 8px; }
          .content { padding: 20px 16px; }
          .header { padding: 28px 16px; }
          .header h1 { font-size: 22px; }
          .footer { padding: 16px 20px 28px; }
          .otp-container { padding: 12px 4px; margin: 16px auto; }
          .otp-code { font-size: 35px; letter-spacing: 0px; word-spacing: 0px; }
        }
        .otp-container { background: #FFF3E0; border-radius: 12px; padding: 14px 4px; margin: 18px auto; width: 100%; border: 2px solid #FFCC80; text-align: center; box-sizing: border-box; }
        .otp-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #E65100; font-weight: 600; margin-bottom: 6px; }
        .otp-code { font-size: 40px; font-weight: 700; color: #E65100 !important; font-family: 'Courier New', 'Courier', monospace; text-decoration: none !important; letter-spacing: 0px; margin: 0; padding: 0; display: block; white-space: nowrap; line-height: 1.1; word-spacing: 0px; }
        .warning-box { background-color: #fafafa; border-radius: 8px; padding: 16px; margin-top: 30px; font-size: 14px; color: #78909c; border-left: 4px solid #FF9800; text-align: left; }
        .footer { background-color: #ffffff; padding: 24px 40px 40px; text-align: center; border-top: 1px solid #eeeeee; }
        .footer p { font-size: 13px; color: #90a4ae; margin: 4px 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                ${logoHtml}
                <h1>${appName}</h1>
            </div>
            <div class="content">
                <h2>${purposeLabel}</h2>
                <p>${greeting}<br><br>${greetingBody}</p>
                <div class="otp-container" style="background: #FFF3E0; border-radius: 12px; padding: 14px 4px; margin: 18px auto; width: 100%; border: 2px solid #FFCC80; text-align: center; box-sizing: border-box; overflow: hidden;">
                    <span class="otp-label" style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #E65100; font-weight: 600; margin-bottom: 6px; margin-left: 0; margin-right: 0;">${otpLabel}</span>
                    <div style="font-size: 40px; font-weight: 700; color: #E65100; font-family: 'Courier New', 'Courier', monospace; text-decoration: none; letter-spacing: 0px; margin: 0; padding: 0; display: block; white-space: nowrap; line-height: 1.1; word-spacing: 0px;">${otp}</div>
                </div>
                <div class="warning-box">
                    ${warningNote}
                </div>
            </div>
            <div class="footer">
                <p>${footerIgnore}</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. ${footerRights}.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject: `${appName} ${purposeLabel} OTP`,
        text: textContent,
        html: htmlContent,
        attachments,
      });

      this.logger.log(
        `smtp:send_result messageId=${info.messageId || 'n/a'} accepted=${info.accepted?.length || 0} rejected=${info.rejected?.length || 0} response=${info.response || 'n/a'}`,
      );

      if (info.rejected && info.rejected.length > 0) {
        this.logger.warn(
          `smtp:recipient_rejected recipients=${info.rejected.join(',')}`,
        );
        throw new InternalServerErrorException('SMTP rejected recipient');
      }
    } catch (error: any) {
      // Don't log here - let the caller handle it with context
      // This prevents duplicate error logging
      throw error;
    }
  }

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly automatedNotifService: AutomatedNotificationsService,
  ) {}

  // ─── Email/Password Auth ─────────────────────────────────────

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) return null;

    if (!(await comparePassword(password, user.password))) return null;

    const { password: _, ...result } = user.toObject();
    return { ...result, id: user._id.toString() };
  }

  async register(data: RegisterData): Promise<any> {
    const existingEmail = await this.userModel.findOne({
      email: data.email.toLowerCase(),
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    if (data.username) {
      const existingUsername = await this.userModel.findOne({
        username: data.username.toLowerCase(),
      });
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.userModel.create({
      email: data.email.toLowerCase(),
      username: data.username?.toLowerCase(),
      phone: data.phone || `temp_${uuidv4()}`,
      password: hashedPassword,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      roles: ['user'],
    });

    const { password: _, ...result } = user.toObject();
    return { ...result, id: user._id.toString() };
  }

  async login(user: any): Promise<AuthTokens & { user: any }> {
    const payload: JwtPayload = {
      sub: user.id || user._id?.toString(),
      email: user.email,
      roles: user.roles || ['user'],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshExpiration =
      this.configService.get<string>('jwt.refreshExpiration') || '7d';

    await this.sessionModel.create({
      userId: new Types.ObjectId(payload.sub),
      refreshToken,
      expiresAt: this.calculateExpiry(refreshExpiration),
    });

    // Calculate new streak based on lastLoginAt and Update last login
    const dbUser = await this.userModel.findById(payload.sub);
    let newStreak = dbUser?.currentStreak || 0;

    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    if (dbUser?.lastLoginAt) {
      const lastLogin = new Date(dbUser.lastLoginAt);
      const lastLoginUTC = new Date(
        Date.UTC(
          lastLogin.getUTCFullYear(),
          lastLogin.getUTCMonth(),
          lastLogin.getUTCDate(),
        ),
      );
      const diffDays = Math.round(
        (todayUTC.getTime() - lastLoginUTC.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays > 1) {
        // Missed more than 1 day: streak broken, reset to 1 (start fresh from day 1)
        newStreak = 1;
        // Send streak broken notification
        this.automatedNotifService.notifyStreakBroken(payload.sub).catch(
          (err) => this.logger.warn(`Failed to send streak broken notification: ${(err as Error).message}`),
        );
      }
      // diffDays === 0 or 1: streak still valid, don't change on login
    }

    await this.userModel.findByIdAndUpdate(payload.sub, {
      $set: {
        lastLoginAt: today,
        currentStreak: newStreak,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpirationInSeconds(),
      tokenType: 'Bearer',
      user,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        this.logger.warn('auth:refresh_invalid_token_format - empty or invalid token');
        throw new UnauthorizedException('Invalid refresh token format');
      }

      const session = await this.sessionModel.findOne({ refreshToken });

      if (!session) {
        this.logger.warn(
          `auth:refresh_token_not_found - token=${refreshToken.substring(0, 10)}...`,
        );
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        this.logger.warn(
          `auth:refresh_token_expired - expires_at=${session.expiresAt}, now=${new Date()}`,
        );
        await session.deleteOne();
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Verify user still exists and is active
      const user = await this.userModel.findById(session.userId);
      if (!user) {
        this.logger.warn(
          `auth:refresh_user_not_found - userId=${session.userId}`,
        );
        await session.deleteOne();
        throw new UnauthorizedException('User account no longer exists');
      }

      if (!user.isActive) {
        this.logger.warn(
          `auth:refresh_user_inactive - userId=${session.userId}`,
        );
        // Keep session for reference but don't allow refresh
        throw new UnauthorizedException('User account has been deactivated');
      }

      // Delete old session
      await session.deleteOne();

      const { user: _, ...tokens } = await this.login({
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
      });

      this.logger.log(`auth:refresh_token_success - userId=${user._id}`);
      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `auth:refresh_token_error - ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.sessionModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.password) {
      throw new BadRequestException('Account uses OTP login; no password set');
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid)
      throw new BadRequestException('Current password is incorrect');

    user.password = await hashPassword(newPassword);
    await user.save();

    await this.logout(userId);
  }

  // ─── Phone + OTP Auth ───────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const recent = await this.otpModel.findOne({
      phone,
      expiresAt: { $gt: new Date() },
      createdAt: { $gt: new Date(Date.now() - 60_000) },
    });
    if (recent) {
      throw new BadRequestException(
        'OTP already sent. Please wait 60 seconds.',
      );
    }

    await this.otpModel.deleteMany({ phone });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.otpModel.create({
      phone,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    const smsProvider = this.configService.get<string>('sms.provider');
    if (smsProvider === 'console' || !smsProvider) {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phone: string,
    otpCode: string,
  ): Promise<AuthTokens & { user: any; isNewUser: boolean }> {
    const otpDoc = await this.otpModel.findOne({
      phone,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (otpDoc.attempts >= 5) {
      await otpDoc.deleteOne();
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }

    if (otpDoc.otp !== otpCode) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new BadRequestException('Invalid OTP');
    }

    await otpDoc.deleteOne();

    let user = await this.userModel.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = await this.userModel.create({
        phone,
        phoneVerified: true,
        roles: ['user'],
      });
      isNewUser = true;
    } else {
      user.phoneVerified = true;
      await user.save();
    }

    const userObj = {
      ...user.toObject(),
      id: user._id.toString(),
    };
    delete (userObj as any).password;

    const tokens = await this.login(userObj);

    return { ...tokens, isNewUser };
  }

  // ─── Admin Login ────────────────────────────────────────────

  async adminLogin(
    email: string,
    password: string,
  ): Promise<AuthTokens & { user: any }> {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (
      !user.roles?.includes('admin') &&
      !user.roles?.includes('super_admin')
    ) {
      throw new UnauthorizedException('Not authorized as admin');
    }

    return this.login(user);
  }

  // ─── Admin OTP Login ────────────────────────────────────────

  async sendAdminOtp(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();
    const maskedEmail = this.maskEmail(normalizedEmail);
    this.logger.log(`sendAdminOtp:start email=${maskedEmail}`);

    const existingUser = await this.userModel.findOne({
      email: normalizedEmail,
    });
    if (!existingUser) {
      this.logger.warn(`sendAdminOtp:blocked_no_user email=${maskedEmail}`);
      throw new UnauthorizedException('You are not an admin. Access denied.');
    }

    if (
      !existingUser.roles?.includes('admin') &&
      !existingUser.roles?.includes('super_admin')
    ) {
      this.logger.warn(`sendAdminOtp:blocked_not_admin email=${maskedEmail}`);
      throw new UnauthorizedException('You are not an admin. Access denied.');
    }

    // Rate limit: 1 OTP per 60 seconds
    const recent = await this.otpModel.findOne({
      email: normalizedEmail,
      type: 'email',
      expiresAt: { $gt: new Date() },
      createdAt: { $gt: new Date(Date.now() - 60_000) },
    });
    if (recent) {
      this.logger.warn(`sendAdminOtp:blocked_rate_limit email=${maskedEmail}`);
      throw new BadRequestException(
        'OTP already sent. Please wait 60 seconds.',
      );
    }

    await this.otpModel.deleteMany({ email: normalizedEmail, type: 'email' });

    // Static OTP for specific admin account (bypass random OTP)
    const STATIC_OTP_EMAIL = 'admindigitalmandir@gmail.com';
    const otp =
      normalizedEmail === STATIC_OTP_EMAIL
        ? '999999'
        : Math.floor(100000 + Math.random() * 900000).toString();

    await this.otpModel.create({
      type: 'email',
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    this.logger.log(`sendAdminOtp:otp_created email=${maskedEmail}`);

    const emailProvider = this.configService
      .get<string>('email.provider')
      ?.toLowerCase();
    if (emailProvider === 'smtp') {
      try {
        await this.sendOtpEmail(normalizedEmail, otp, 'login');
        this.logger.log(`sendAdminOtp:smtp_sent email=${maskedEmail}`);
      } catch (error: any) {
        // Log detailed error info for debugging
        this.logger.error(
          `sendAdminOtp:smtp_error email=${maskedEmail} code=${error?.code} message=${error?.message}`,
        );
        
        // For auth errors (535), provide helpful guidance but don't fail - fall back to console
        if (error?.code === 'EAUTH' || error?.responseCode === 535) {
          this.logger.warn(
            `sendAdminOtp:smtp_auth_failed_fallback_to_console email=${maskedEmail}`,
          );
          this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
        } else {
          // For other errors, still try console fallback instead of throwing
          this.logger.warn(
            `sendAdminOtp:smtp_connection_error_fallback_to_console email=${maskedEmail} error=${error?.message}`,
          );
          this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
        }
      }
    } else {
      this.logger.log(`[DEV] Admin OTP for ${normalizedEmail}: ${otp}`);
    }

    this.logger.log(`sendAdminOtp:success email=${maskedEmail}`);
    return { message: 'OTP sent to your email' };
  }

  async verifyAdminOtp(
    email: string,
    otpCode: string,
  ): Promise<AuthTokens & { user: any }> {
    const normalizedEmail = email.toLowerCase();
    const maskedEmail = this.maskEmail(normalizedEmail);
    this.logger.log(`verifyAdminOtp:start email=${maskedEmail}`);

    const otpDoc = await this.otpModel.findOne({
      email: normalizedEmail,
      type: 'email',
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      this.logger.warn(
        `verifyAdminOtp:otp_missing_or_expired email=${maskedEmail}`,
      );
      throw new BadRequestException('OTP expired or not found');
    }

    if (otpDoc.attempts >= 5) {
      this.logger.warn(`verifyAdminOtp:too_many_attempts email=${maskedEmail}`);
      await otpDoc.deleteOne();
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }

    if (otpDoc.otp !== otpCode) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      this.logger.warn(
        `verifyAdminOtp:invalid_otp email=${maskedEmail} attempts=${otpDoc.attempts}`,
      );
      throw new BadRequestException('Invalid OTP');
    }

    await otpDoc.deleteOne();

    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      !user.roles?.includes('admin') &&
      !user.roles?.includes('super_admin')
    ) {
      this.logger.warn(`verifyAdminOtp:not_admin email=${maskedEmail}`);
      throw new UnauthorizedException('You are not an admin. Access denied.');
    }

    const userObj = {
      ...user.toObject(),
      id: user._id.toString(),
    };
    delete (userObj as any).password;

    this.logger.log(`verifyAdminOtp:success email=${maskedEmail}`);
    return this.login(userObj);
  }

  // ─── Get user by ID ────────────────────────────────────────

  async getUserById(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();
    if (!user) throw new UnauthorizedException('User not found');
    return { ...user, id: user._id.toString() };
  }

  // ─── Email + OTP Auth ───────────────────────────────────────

  async sendEmailOtp(
    email: string,
    purpose?: string,
    language?: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();
    const maskedEmail = this.maskEmail(normalizedEmail);
    this.logger.log(
      `sendEmailOtp:start email=${maskedEmail} purpose=${purpose || 'register'}`,
    );

    if (purpose === 'login') {
      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
      });
      if (!existingUser) {
        this.logger.warn(`sendEmailOtp:blocked_no_user email=${maskedEmail}`);
        throw new BadRequestException(
          'No account found with this email. Please create an account first.',
        );
      }
    } else if (purpose === 'register' || !purpose) {
      // For registration, check if email already exists
      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
      });
      if (existingUser) {
        this.logger.warn(
          `sendEmailOtp:blocked_email_exists email=${maskedEmail}`,
        );
        throw new ConflictException(
          'Email already registered. Please log in instead.',
        );
      }
    }
    // For purpose === 'update-email': skip all existence checks
    // The user is already logged in and is just changing their email address

    const recent = await this.otpModel.findOne({
      email: normalizedEmail,
      type: 'email',
      expiresAt: { $gt: new Date() },
      createdAt: { $gt: new Date(Date.now() - 60_000) },
    });
    if (recent) {
      this.logger.warn(`sendEmailOtp:blocked_rate_limit email=${maskedEmail}`);
      throw new BadRequestException(
        'OTP already sent. Please wait 60 seconds.',
      );
    }

    await this.otpModel.deleteMany({ email: normalizedEmail, type: 'email' });

    // Static OTP for specific admin account (bypass random OTP)
    const STATIC_OTP_EMAIL = 'admindigitalmandir@gmail.com';
    const otp =
      normalizedEmail === STATIC_OTP_EMAIL
        ? '999999'
        : Math.floor(100000 + Math.random() * 900000).toString();

    await this.otpModel.create({
      type: 'email',
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    this.logger.log(`sendEmailOtp:otp_created email=${maskedEmail}`);

    const emailProvider = this.configService
      .get<string>('email.provider')
      ?.toLowerCase();
    if (emailProvider === 'smtp') {
      try {
        await this.sendOtpEmail(
          normalizedEmail,
          otp,
          purpose === 'login' ? 'login' : 'register',
          language,
        );
        this.logger.log(`sendEmailOtp:smtp_sent email=${maskedEmail}`);
      } catch (error: any) {
        // Log detailed error info for debugging
        this.logger.error(
          `sendEmailOtp:smtp_error email=${maskedEmail} code=${error?.code} message=${error?.message}`,
        );
        
        // For auth errors (535), provide helpful guidance but don't fail - fall back to console
        if (error?.code === 'EAUTH' || error?.responseCode === 535) {
          this.logger.warn(
            `sendEmailOtp:smtp_auth_failed_fallback_to_console email=${maskedEmail}`,
          );
          this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
        } else {
          // For other errors, still try console fallback instead of throwing
          this.logger.warn(
            `sendEmailOtp:smtp_connection_error_fallback_to_console email=${maskedEmail} error=${error?.message}`,
          );
          this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
        }
      }
    } else if (emailProvider === 'console' || !emailProvider) {
      this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
    } else if (emailProvider === 'sendgrid') {
      this.logger.warn(
        `sendEmailOtp:provider_sendgrid_not_integrated_fallback_to_console email=${maskedEmail}`,
      );
      this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
    } else {
      this.logger.warn(
        `sendEmailOtp:provider_${emailProvider}_unknown_fallback_to_console email=${maskedEmail}`,
      );
      this.logger.log(`[DEV] Email OTP for ${normalizedEmail}: ${otp}`);
    }

    this.logger.log(`sendEmailOtp:success email=${maskedEmail}`);

    return { message: 'OTP sent to your email' };
  }

  async verifyEmailOtp(
    email: string,
    otpCode: string,
  ): Promise<AuthTokens & { user: any; isNewUser: boolean }> {
    const normalizedEmail = email.toLowerCase();
    const maskedEmail = this.maskEmail(normalizedEmail);
    this.logger.log(
      `verifyEmailOtp:start email=${maskedEmail} otpLength=${otpCode?.length || 0}`,
    );

    const otpDoc = await this.otpModel.findOne({
      email: normalizedEmail,
      type: 'email',
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      this.logger.warn(
        `verifyEmailOtp:otp_missing_or_expired email=${maskedEmail}`,
      );
      throw new BadRequestException('OTP expired or not found');
    }

    if (otpDoc.attempts >= 5) {
      this.logger.warn(`verifyEmailOtp:too_many_attempts email=${maskedEmail}`);
      await otpDoc.deleteOne();
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }

    if (otpDoc.otp !== otpCode) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      this.logger.warn(
        `verifyEmailOtp:invalid_otp email=${maskedEmail} attempts=${otpDoc.attempts}`,
      );
      throw new BadRequestException('Invalid OTP');
    }

    await otpDoc.deleteOne();

    let user = await this.userModel.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      user = await this.userModel.create({
        email: normalizedEmail,
        isEmailVerified: true,
        roles: ['user'],
      });
      isNewUser = true;
      this.logger.log(`verifyEmailOtp:user_created email=${maskedEmail}`);
    } else {
      user.isEmailVerified = true;
      await user.save();
      this.logger.log(`verifyEmailOtp:user_verified email=${maskedEmail}`);
    }

    const userObj = {
      ...user.toObject(),
      id: user._id.toString(),
    };
    delete (userObj as any).password;

    const tokens = await this.login(userObj);

    this.logger.log(
      `verifyEmailOtp:success email=${maskedEmail} isNewUser=${isNewUser}`,
    );

    return { ...tokens, isNewUser };
  }

  // ─── Google OAuth ───────────────────────────────────────────

  async googleAuth(
    idToken: string,
  ): Promise<AuthTokens & { user: any; isNewUser: boolean }> {
    // Verify the Google ID token
    const googlePayload = await this.verifyGoogleToken(idToken);

    if (!googlePayload || !googlePayload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const {
      email,
      given_name,
      family_name,
      picture,
      sub: googleId,
    } = googlePayload;
    const normalizedEmail = email.toLowerCase();

    let user = await this.userModel.findOne({
      $or: [{ email: normalizedEmail }, { googleId }],
    });

    let isNewUser = false;

    if (!user) {
      // Create new user from Google profile
      user = await this.userModel.create({
        email: normalizedEmail,
        googleId,
        firstName: given_name,
        lastName: family_name,
        avatar: picture,
        isEmailVerified: true,
        roles: ['user'],
      });
      isNewUser = true;
    } else {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      if (!user.firstName && given_name) {
        user.firstName = given_name;
      }
      if (!user.lastName && family_name) {
        user.lastName = family_name;
      }
      user.isEmailVerified = true;
      await user.save();
    }

    const userObj = {
      ...user.toObject(),
      id: user._id.toString(),
    };
    delete (userObj as any).password;

    const tokens = await this.login(userObj);

    return { ...tokens, isNewUser };
  }

  private async verifyGoogleToken(idToken: string): Promise<any> {
    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    const clientId = this.configService.get<string>('google.clientId');
    const iosClientId = this.configService.get<string>('google.iosClientId');
    const androidClientId = this.configService.get<string>(
      'google.androidClientId',
    );

    // Enforce that production always has a client ID configured
    if (nodeEnv === 'production' && !clientId) {
      this.logger.error(
        'GOOGLE_CLIENT_ID is not set — Google Sign-In is disabled in production',
      );
      throw new UnauthorizedException('Google Sign-In is not configured');
    }

    // Development fallback: decode without signature verification
    // Only permitted when nodeEnv is explicitly 'development' AND no clientId is set
    if (nodeEnv === 'development' && !clientId) {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      );
      this.logger.warn(
        '[DEV] Google token decoded without signature verification — set GOOGLE_CLIENT_ID to enable full verification',
      );
      return payload;
    }

    // Verify token using google-auth-library (validates signature, expiry, audience)
    try {
      const validAudiences = [clientId, iosClientId, androidClientId].filter(
        (id): id is string => Boolean(id),
      );
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: validAudiences,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Empty token payload');
      }
      return payload;
    } catch (error) {
      this.logger.error('Google token verification failed', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  // ─── Seed admin ─────────────────────────────────────────────

  // ─── Forgot / Reset Password ────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal whether the email exists
      return;
    }

    // Generate a 6-digit OTP (reusing OTP mechanism for password reset)
    await this.otpModel.deleteMany({
      email: normalizedEmail,
      type: 'password-reset',
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpModel.create({
      type: 'password-reset',
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 15 * 60_000), // 15 minutes
    });

    const emailProvider = this.configService
      .get<string>('email.provider')
      ?.toLowerCase();
    if (emailProvider === 'smtp') {
      try {
        await this.sendOtpEmail(normalizedEmail, otp, 'password-reset');
        this.logger.log(
          `forgotPassword:smtp_sent email=${this.maskEmail(normalizedEmail)}`,
        );
      } catch (error: any) {
        this.logger.error(
          `forgotPassword:smtp_error email=${this.maskEmail(normalizedEmail)} message=${error?.message}`,
        );
        throw new InternalServerErrorException(
          'Failed to send password reset email',
        );
      }
    } else if (emailProvider === 'console' || !emailProvider) {
      this.logger.log(
        `[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`,
      );
    } else if (emailProvider === 'sendgrid') {
      this.logger.warn(
        `forgotPassword:provider_sendgrid_not_integrated_fallback_to_console email=${this.maskEmail(normalizedEmail)}`,
      );
      this.logger.log(
        `[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`,
      );
    } else {
      this.logger.warn(
        `forgotPassword:provider_${emailProvider}_unknown_fallback_to_console email=${this.maskEmail(normalizedEmail)}`,
      );
      this.logger.log(
        `[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`,
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Token is the OTP sent via email – find matching record
    const otpDoc = await this.otpModel.findOne({
      otp: token,
      type: 'password-reset',
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userModel.findOne({ email: otpDoc.email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    await otpDoc.deleteOne();
    // Invalidate all existing sessions for security
    await this.sessionModel.deleteMany({ userId: user._id });
  }

  async seedAdmin(): Promise<void> {
    const email = this.configService.get<string>('admin.email');
    const password = this.configService.get<string>('admin.password');
    const phone = this.configService.get<string>('admin.phone');

    if (!email || !password || !phone) return;

    const hashedPassword = await hashPassword(password);

    const existingAdmin = await this.userModel.findOne({
      $or: [{ email }, { username: 'admin' }],
    });

    if (existingAdmin) {
      // Always sync email and password from env so changing .env takes effect on restart
      await this.userModel.findByIdAndUpdate(existingAdmin._id, {
        email,
        password: hashedPassword,
        roles: ['admin', 'super_admin'],
        isEmailVerified: true,
      });
      this.logger.log(`Admin user synced from config: ${email}`);
    } else {
      await this.userModel.create({
        email,
        phone,
        phoneVerified: true,
        password: hashedPassword,
        username: 'admin',
        firstName: 'Admin',
        roles: ['admin', 'super_admin'],
        isEmailVerified: true,
      });
      this.logger.log(`Admin user seeded: ${email}`);
    }

    // Always ensure designated super admin gets the role on every startup
    if (email !== 'xtshivam4@gmail.com') {
      const designatedSuperAdmin = await this.userModel.findOne({
        email: 'xtshivam4@gmail.com',
      });
      if (designatedSuperAdmin) {
        const roles = [
          ...new Set([
            ...(designatedSuperAdmin.roles || []),
            'admin',
            'super_admin',
          ]),
        ];
        await this.userModel.findByIdAndUpdate(designatedSuperAdmin._id, {
          roles,
        });
        this.logger.log(
          'Designated super admin role ensured for xtshivam4@gmail.com',
        );
      }
    }
  }

  // ─── Helpers ────────────────────────────────────────────────

  private getExpirationInSeconds(): number {
    const expiration =
      this.configService.get<string>('jwt.accessExpiration') || '15m';
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private calculateExpiry(expr: string): Date {
    const seconds = this.parseExpiration(expr);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpiration(expr: string): number {
    const match = expr.match(/^(\d+)([smhd])$/);
    if (!match) return 604800;

    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800;
    }
  }
}
