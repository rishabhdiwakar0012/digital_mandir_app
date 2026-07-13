import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema, Otp, OtpSchema } from '../../common/database/schemas';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * User Module
 *
 * Feature module for user profile, preferences, and onboarding management
 *
 * Following SOLID Principles:
 * - Single Responsibility: Handles all user-related operations
 * - Open/Closed: Extensible through additional providers
 * - Dependency Inversion: Services depend on interfaces
 */

@Module({
  imports: [
    // Import User model for this module
    // TODO: MongoDB Setup - This will work once DatabaseModule is imported in AppModule
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export for use in other modules if needed
})
export class UserModule {}
