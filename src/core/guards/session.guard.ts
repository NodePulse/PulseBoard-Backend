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
    const user = request.user;

    if (!user || !user.sid) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }

    const session = await this.sessionCacheService.get(user.sid);
    if (!session || session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session revoked or inactive');
    }

    request.session = session;
    return true;
  }
}
