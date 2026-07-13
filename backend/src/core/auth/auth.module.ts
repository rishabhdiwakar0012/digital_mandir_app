import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
  Session,
  SessionSchema,
  Otp,
  OtpSchema,
} from '../../common/database/schemas';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsModule } from '../../modules/notifications/notifications.module';

/**
 * Auth Module
 * MongoDB Setup - MongooseModule.forFeature imports User, Session, and Otp models for AuthService
 */
@Module({
  imports: [
    PassportModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.accessExpiration');

        if (!secret) {
          throw new Error('JWT secret is not configured');
        }
        if (!expiresIn) {
          throw new Error('JWT access expiration is not configured');
        }

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
    // Import models for AuthService (User, Session, OTP)
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
