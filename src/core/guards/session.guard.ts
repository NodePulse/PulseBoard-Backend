import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionCacheService } from '../../modules/session/session-cache.service';
import { RESPONSE_MESSAGES } from '../constants/messages';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionCacheService: SessionCacheService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const sessionId = request.cookies?.['pulseboard_session'];

    if (!sessionId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }

    const session = await this.sessionCacheService.get(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session revoked or inactive');
    }

    request.user = { sub: session.userId, sid: session.id };
    request.session = session;
    return true;
  }
}
