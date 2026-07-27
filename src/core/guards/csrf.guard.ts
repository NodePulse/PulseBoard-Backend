import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

/**
 * CSRF Guard — validates the `x-csrf-token` header on state-changing requests.
 * Should be applied to POST/PUT/PATCH/DELETE endpoints that use cookie-based auth.
 *
 * The expected token is stored in Redis (keyed by userId) and generated via GET /auth/csrf-token.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Only validate on state-changing methods
    const method = request.method?.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const user = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('CSRF validation failed: no user context');
    }

    const csrfToken = request.headers['x-csrf-token'];
    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    const isValid = await this.authService.validateCsrfToken(user.sub, csrfToken);
    if (!isValid) {
      throw new ForbiddenException('CSRF token invalid or expired');
    }

    return true;
  }
}
