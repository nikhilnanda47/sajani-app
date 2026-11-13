import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

/**
 * Guard that checks if the admin user has the required role.
 * Must be used after JwtAuthGuard + AdminAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles specified = any admin can access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException({
        code: 'AUTH_ROLE_REQUIRED',
        message: `Required role: ${requiredRoles.join(' or ')}`,
      });
    }

    // Owner role has access to everything
    if (user.role === 'owner') {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        code: 'AUTH_ROLE_REQUIRED',
        message: `Required role: ${requiredRoles.join(' or ')}`,
      });
    }

    return true;
  }
}
