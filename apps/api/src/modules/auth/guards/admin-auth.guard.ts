import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard that ensures the authenticated user is an admin.
 * Must be used after JwtAuthGuard.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.type !== 'admin') {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        message: 'Admin access required',
      });
    }

    return true;
  }
}
