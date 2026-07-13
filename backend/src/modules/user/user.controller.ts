import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../core/auth';
import { CurrentUser } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes';
import {
  UpdateProfileSchema,
  UpdatePreferencesSchema,
  UpdateOnboardingStatusSchema,
  UpdateEmailSchema,
} from './schemas';

/**
 * User Controller
 *
 * Handles HTTP requests for user profile, preferences, and onboarding operations
 * All endpoints require JWT authentication
 *
 * Following SOLID Principles:
 * - Single Responsibility: Only handles HTTP layer for user operations
 * - Open/Closed: Extensible through decorators and guards
 * - Dependency Inversion: Depends on UserService interface
 */

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current user profile
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.userService.getUserProfile(userId);
    return {
      message: 'Profile retrieved successfully',
      profile,
    };
  }

  /**
   * Update user profile (firstName, lastName, avatar)
   */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto,
  ) {
    const profile = await this.userService.updateProfile(userId, dto);
    return {
      message: 'Profile updated successfully',
      profile,
    };
  }

  /**
   * Update user email with OTP
   */
  @Patch('email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user email with OTP' })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateEmail(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(UpdateEmailSchema)) dto,
  ) {
    const profile = await this.userService.updateEmail(
      userId,
      dto.email,
      dto.otp,
    );
    return {
      message: 'Email updated successfully',
      profile,
    };
  }

  /**
   * Get user preferences (language, theme, notifications)
   */
  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@CurrentUser('id') userId: string) {
    const preferences = await this.userService.getPreferences(userId);
    return {
      message: 'Preferences retrieved successfully',
      preferences,
    };
  }

  /**
   * Update user preferences
   * This is used by the language selector during onboarding
   */
  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user preferences',
    description:
      'Update language, theme, or notification settings. Used by onboarding flow to save language selection.',
  })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(UpdatePreferencesSchema)) dto,
  ) {
    const preferences = await this.userService.updatePreferences(userId, dto);
    return {
      message: 'Preferences updated successfully',
      preferences,
    };
  }

  /**
   * Get onboarding status
   */
  @Get('onboarding-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get onboarding completion status' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnboardingStatus(@CurrentUser('id') userId: string) {
    const status = await this.userService.getOnboardingStatus(userId);
    return {
      message: 'Onboarding status retrieved successfully',
      ...status,
    };
  }

  /**
   * Update onboarding status
   * Mark onboarding as complete or update current step
   */
  @Patch('onboarding-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update onboarding status',
    description:
      'Mark onboarding as complete or update the current step in the onboarding flow.',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateOnboardingStatus(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(UpdateOnboardingStatusSchema)) dto,
  ) {
    const status = await this.userService.updateOnboardingStatus(userId, dto);
    return {
      message: 'Onboarding status updated successfully',
      ...status,
    };
  }

  /**
   * Delete user account
   */
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.userService.deleteAccount(userId);
  }
}
