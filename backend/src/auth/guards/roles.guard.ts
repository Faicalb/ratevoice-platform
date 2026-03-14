import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    // 1. Super Admin Bypass (Check both flag and role)
    if (user.isAdmin) return true;
    if (user.roles?.some((userRole) => userRole.role.name === 'SUPER_ADMIN')) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    
    // user.roles is an array of UserRole objects
    // We need to check if any of the user's roles match the required roles
    return requiredRoles.some((role) => user.roles?.some((userRole) => userRole.role.name === role));
  }
}
