import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as path from 'path';
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';

// Config
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  throttleConfig,
  redisConfig,
  fcmConfig,
  smsConfig,
  adminConfig,
  emailConfig,
  googleConfig,
  r2Config,
  validateEnv,
} from './config';

// Database
import { DatabaseModule } from './common/database';

// Common
import {
  TransformInterceptor,
  LoggingInterceptor,
} from './common/interceptors';
import { RolesGuard } from './common/guards';

// Core Modules
import { AuthModule, JwtAuthGuard } from './core/auth';

// Feature Modules
import { HealthModule } from './modules/health';
import { UsersModule } from './modules/users';
import { UserModule } from './modules/user';
import { ContentModule } from './modules/content';
import { JaapModule } from './modules/jaap';
import { NotificationsModule } from './modules/notifications';
import { AnalyticsModule } from './modules/analytics';
import { DevicesModule } from './modules/devices';
import { UploadModule } from './modules/upload';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        throttleConfig,
        redisConfig,
        fcmConfig,
        smsConfig,
        adminConfig,
        emailConfig,
        googleConfig,
        r2Config,
      ],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Internationalization
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Core Modules
    AuthModule,

    // Feature Modules
    HealthModule,
    UsersModule,
    UserModule,
    ContentModule,
    JaapModule,
    NotificationsModule,
    AnalyticsModule,
    DevicesModule,
    UploadModule,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
