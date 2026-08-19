import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { AccessTokenPayload } from 'src/modules/auth/auth.types';

type AuthenticatedRequest = Request & { user?: AccessTokenPayload };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (
      !request.user?.role ||
      !requiredRoles.includes(request.user.role as UserRole)
    ) {
      throw new ForbiddenException(
        this.i18n.t('common.auth.insufficientRole'),
      );
    }

    return true;
  }
}
