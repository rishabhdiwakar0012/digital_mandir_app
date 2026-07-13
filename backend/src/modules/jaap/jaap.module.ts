import { Module } from '@nestjs/common';
import { JaapController, AdminJaapController } from './jaap.controller';
import { JaapService } from './jaap.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [JaapController, AdminJaapController],
  providers: [JaapService],
  exports: [JaapService],
})
export class JaapModule {}
