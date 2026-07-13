import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import * as z from 'zod';

/**
 * Generic Zod validation pipe
 * Can be used for body, query, and params validation
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const result = this.schema.parse(value);
      return result;
    } catch (error: any) {
      if (error instanceof z.ZodError || error?.name === 'ZodError') {
        // Zod v4 uses `issues`; Zod v3 used `errors` (keep both for safety)
        const issues: any[] = error.issues ?? error.errors ?? [];
        const formattedErrors = issues.map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? ''),
          message: err.message,
          code: err.code,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }
}

/**
 * Factory function to create validation pipe with schema
 */
export const createZodValidationPipe = (schema: z.ZodSchema) => {
  return new ZodValidationPipe(schema);
};
