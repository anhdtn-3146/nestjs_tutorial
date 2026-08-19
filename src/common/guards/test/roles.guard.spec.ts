import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UserRole } from 'src/database/entities/user.entity';
import { RolesGuard } from '../roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const i18n = { t: jest.fn((key: string) => key) };
  const guard = new RolesGuard(
    reflector as unknown as Reflector,
    i18n as unknown as I18nService,
  );

  const contextWithRole = (role?: string) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
  });

  it('allows routes without required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextWithRole(UserRole.USER))).toBe(true);
  });

  it('allows a user with a required role', () => {
    expect(guard.canActivate(contextWithRole(UserRole.ADMIN))).toBe(true);
  });

  it.each([UserRole.USER, undefined])(
    'rejects a missing or insufficient role (%s)',
    (role) => {
      expect(() => guard.canActivate(contextWithRole(role))).toThrow(
        ForbiddenException,
      );
    },
  );
});
