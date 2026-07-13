import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard } from './guards';
import { Public, CurrentUser, ZodValidation } from '../../common/decorators';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  AdminLoginSchema,
  SendEmailOtpSchema,
  VerifyEmailOtpSchema,
  GoogleAuthSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SendAdminOtpSchema,
  VerifyAdminOtpSchema,
} from './schemas';
import type {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  SendOtpDto,
  VerifyOtpDto,
  AdminLoginDto,
  SendEmailOtpDto,
  VerifyEmailOtpDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendAdminOtpDto,
  VerifyAdminOtpDto,
} from './schemas';
import { ZodValidationPipe } from '../../common/pipes';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController implements OnModuleInit {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return 'invalid-email';
    const [name, domain] = email.split('@');
    if (!name || !domain) return 'invalid-email';
    if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  async onModuleInit() {
    await this.authService.seedAdmin();
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body(new ZodValidationPipe(RegisterSchema)) registerDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'Registration successful',
      user,
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: any) {
    const result = await this.authService.login(req.user);
    return {
      message: 'Login successful',
      ...result,
    };
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body(new ZodValidationPipe(SendOtpSchema)) dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login/register' })
  @ApiResponse({ status: 200, description: 'OTP verified, user authenticated' })
  async verifyOtp(
    @Body(new ZodValidationPipe(VerifyOtpSchema)) dto: VerifyOtpDto,
  ) {
    const result = await this.authService.verifyOtp(dto.phone, dto.otp);
    return {
      message: result.isNewUser
        ? 'Registration successful'
        : 'Login successful',
      ...result,
    };
  }

  // ─── Email OTP Endpoints ─────────────────────────────────────

  @Public()
  @Post('send-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email address' })
  @ApiResponse({ status: 200, description: 'OTP sent to email successfully' })
  async sendEmailOtp(
    @Body(new ZodValidationPipe(SendEmailOtpSchema)) dto: SendEmailOtpDto,
  ) {
    this.logger.log(
      `sendEmailOtp:request email=${this.maskEmail(dto.email?.toLowerCase())} purpose=${dto.purpose || 'register'}`,
    );
    return this.authService.sendEmailOtp(dto.email, dto.purpose, dto.language);
  }

  @Public()
  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP and login/register' })
  @ApiResponse({
    status: 200,
    description: 'Email OTP verified, user authenticated',
  })
  async verifyEmailOtp(
    @Body(new ZodValidationPipe(VerifyEmailOtpSchema)) dto: VerifyEmailOtpDto,
  ) {
    this.logger.log(
      `verifyEmailOtp:request email=${this.maskEmail(dto.email?.toLowerCase())} otpLength=${dto.otp?.length || 0}`,
    );
    const result = await this.authService.verifyEmailOtp(dto.email, dto.otp);
    this.logger.log(
      `verifyEmailOtp:response email=${this.maskEmail(dto.email?.toLowerCase())} isNewUser=${result.isNewUser}`,
    );
    return {
      message: result.isNewUser
        ? 'Registration successful'
        : 'Login successful',
      ...result,
    };
  }

  // ─── Google OAuth Endpoint ───────────────────────────────────

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Google' })
  @ApiResponse({ status: 200, description: 'Google authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleAuth(
    @Body(new ZodValidationPipe(GoogleAuthSchema)) dto: GoogleAuthDto,
  ) {
    const result = await this.authService.googleAuth(dto.idToken);
    return {
      message: result.isNewUser
        ? 'Registration successful'
        : 'Login successful',
      ...result,
    };
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or not admin' })
  async adminLogin(
    @Body(new ZodValidationPipe(AdminLoginSchema)) dto: AdminLoginDto,
  ) {
    const result = await this.authService.adminLogin(dto.email, dto.password);
    return {
      message: 'Admin login successful',
      ...result,
    };
  }

  // ─── Admin OTP Endpoints ─────────────────────────────────────

  @Public()
  @Post('admin/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to admin email for login' })
  @ApiResponse({ status: 200, description: 'OTP sent to admin email' })
  @ApiResponse({ status: 401, description: 'Not an admin' })
  async sendAdminOtp(
    @Body(new ZodValidationPipe(SendAdminOtpSchema)) dto: SendAdminOtpDto,
  ) {
    this.logger.log(
      `sendAdminOtp:request email=${this.maskEmail(dto.email?.toLowerCase())}`,
    );
    return this.authService.sendAdminOtp(dto.email);
  }

  @Public()
  @Post('admin/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify admin OTP and login' })
  @ApiResponse({
    status: 200,
    description: 'Admin OTP verified, login successful',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyAdminOtp(
    @Body(new ZodValidationPipe(VerifyAdminOtpSchema)) dto: VerifyAdminOtpDto,
  ) {
    this.logger.log(
      `verifyAdminOtp:request email=${this.maskEmail(dto.email?.toLowerCase())}`,
    );
    const result = await this.authService.verifyAdminOtp(dto.email, dto.otp);
    return {
      message: 'Admin login successful',
      ...result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body(new ZodValidationPipe(RefreshTokenSchema)) dto) {
    const tokens = await this.authService.refreshToken(dto.refreshToken);
    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return {
      message: 'Logout successful',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) dto,
  ) {
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return {
      message: 'Password changed successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  async me(@CurrentUser('id') userId: string) {
    const user = await this.authService.getUserById(userId);
    return { user };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto,
  ) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'If an account exists with this email, a password reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(dto.token, dto.password);
    return {
      message: 'Password reset successfully',
    };
  }
}
