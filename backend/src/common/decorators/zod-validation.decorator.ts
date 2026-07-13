import { applyDecorators, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes';

/**
 * Decorator to apply Zod validation to a route
 * @example @ZodValidation(CreateUserSchema)
 */
export const ZodValidation = (schema: ZodSchema) => {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
};
