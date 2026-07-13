import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to set required roles for a route
 * @example @Roles('admin', 'moderator')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
