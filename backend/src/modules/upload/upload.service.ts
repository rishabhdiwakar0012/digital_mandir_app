import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import 'multer';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('r2.accountId');
    const accessKeyId = this.configService.get<string>('r2.accessKeyId');
    const secretAccessKey =
      this.configService.get<string>('r2.secretAccessKey');

    this.bucketName = this.configService.get<string>('r2.bucketName') || 'dm-1';
    this.publicUrl =
      this.configService.get<string>('r2.publicUrl') ||
      `https://${accountId}.r2.cloudflarestorage.com/${this.bucketName}`;

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
      requestHandler: {
        httpHandlerOptions: {
          socketTimeout: 30000, // 30 second socket timeout to prevent hanging
          connectionTimeout: 10000, // 10 second connection timeout
        },
      } as any, // S3Client doesn't expose httpHandlerOptions in types, but SDK accepts it
    });

    this.logger.log(
      `R2 configured — bucket: ${this.bucketName}, endpoint: https://${accountId}.r2.cloudflarestorage.com`,
    );
  }

  /**
   * Upload a file to Cloudflare R2
   */
  async upload(file: Express.Multer.File): Promise<{
    url: string;
    key: string;
    originalName: string;
    size: number;
    mimetype: string;
  }> {
    // Validate R2 credentials early
    const hasValidCredentials = 
      this.s3.config?.credentials !== undefined &&
      !String(this.s3.config.credentials).includes('your-');

    if (!hasValidCredentials) {
      this.logger.error(
        '❌ R2 credentials not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env',
      );
      throw new Error(
        'R2 upload not configured. Admin must set R2 credentials in backend .env: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY',
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    const key = `${randomUUID()}${ext}`;

    this.logger.log(
      `Uploading ${file.originalname} (${file.size} bytes, ${file.mimetype}) as ${key}`,
    );

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const url = `${this.publicUrl}/${key}`;
      this.logger.log(`✅ Upload complete: ${url}`);

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ R2 upload failed: ${errorMsg}`);

      // Provide helpful error messages
      if (errorMsg.includes('InvalidAccessKeyId') || errorMsg.includes('InvalidSecretAccessKey')) {
        throw new Error('R2 credentials invalid. Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env');
      }
      if (errorMsg.includes('NoSuchBucket')) {
        throw new Error(`R2 bucket not found: ${this.bucketName}. Check R2_BUCKET_NAME in .env`);
      }
      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
        throw new Error('R2 service unreachable. Check R2_ACCOUNT_ID and internet connection.');
      }

      throw new Error(`R2 upload failed: ${errorMsg}`);
    }
  }

  /**
   * Delete a file from Cloudflare R2
   */
  async delete(key: string): Promise<void> {
    this.logger.log(`Deleting ${key} from R2`);

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    this.logger.log(`Deleted ${key}`);
  }
}
