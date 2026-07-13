import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import 'multer';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
];

const ALL_ALLOWED = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const logger = new Logger('UploadController');

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  private readonly logger = logger;

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a file (image or audio) to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        try {
          if (!file || !file.mimetype) {
            cb(new Error('Invalid file'), false);
            return;
          }

          if (ALL_ALLOWED.includes(file.mimetype)) {
            cb(null, true);
          } else {
            const error = new Error(
              `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}, ${ALLOWED_AUDIO_TYPES.join(', ')}`,
            );
            logger.warn(`File rejected: ${error.message}`);
            cb(error, false);
          }
        } catch (error) {
          logger.error(
            `Error in fileFilter: ${error instanceof Error ? error.message : String(error)}`,
          );
          cb(new Error('File validation failed'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        this.logger.warn('Upload request received with no file');
        throw new BadRequestException('No file provided');
      }

      this.logger.log(
        `Uploading to R2: ${file.originalname} (${file.size} bytes, ${file.mimetype})`,
      );

      const result = await this.uploadService.upload(file);

      this.logger.log(`File uploaded to R2: ${result.url}`);

      return {
        filename: result.key,
        originalName: result.originalName,
        size: result.size,
        mimetype: result.mimetype,
        url: result.url,
      };
    } catch (error) {
      this.logger.error(
        `Error in uploadFile: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
