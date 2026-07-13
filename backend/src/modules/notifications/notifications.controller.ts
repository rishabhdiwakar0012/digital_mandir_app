import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes';
import { CreateNotificationSchema } from './schemas/notifications.schema';

@ApiTags('Admin - Notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@Roles('admin', 'super_admin')
export class NotificationsController {
  constructor(
    private readonly notifService: NotificationsService,
    private readonly fcmService: FcmService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create and send a notification' })
  async createAndSend(
    @Body(new ZodValidationPipe(CreateNotificationSchema)) data: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.notifService.createAndSend(data, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notifService.findAll({ page: +page, limit: +limit });
  }

  @Get('fcm-status')
  @ApiOperation({ summary: 'Check Firebase Cloud Messaging initialization status' })
  async fcmStatus() {
    return {
      firebaseInitialized: this.fcmService.initialized,
      message: this.fcmService.initialized
        ? '✅ Firebase Admin SDK is initialized and ready to send push notifications'
        : '❌ Firebase Admin SDK is NOT initialized. Check that firebase-google.json exists and is valid.',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification detail with delivery stats' })
  async findById(@Param('id') id: string) {
    return this.notifService.findById(id);
  }
}
