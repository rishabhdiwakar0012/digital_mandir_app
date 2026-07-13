import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes';
import {
  RegisterDeviceSchema,
  UpdateFcmTokenSchema,
} from './schemas/devices.schema';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register or update device info' })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(RegisterDeviceSchema)) data: any,
  ) {
    return this.devicesService.upsertDevice(userId, data, data.ip);
  }

  @Post('fcm-token')
  @ApiOperation({ summary: 'Update FCM token for a device' })
  async updateFcmToken(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(UpdateFcmTokenSchema))
    data: { deviceId: string; fcmToken: string },
  ) {
    return this.devicesService.updateFcmToken(
      userId,
      data.deviceId,
      data.fcmToken,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get current user devices' })
  async getMyDevices(@CurrentUser('id') userId: string) {
    return this.devicesService.getUserDevices(userId);
  }
}
