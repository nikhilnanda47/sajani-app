import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which admin roles can access an endpoint.
 * Owner role always has access regardless of this decorator.
 *
 * Usage: @Roles('catalog_editor', 'fulfillment_operator')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
