import { Module } from '@nestjs/common';
import {
  AdminContentController,
  PublicContentController,
} from './content.controller';
import { ContentService } from './content.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [AdminContentController, PublicContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
