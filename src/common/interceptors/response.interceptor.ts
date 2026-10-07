import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';

// Placeholder for Paginated if it doesn't exist yet, to prevent TS errors.
class Paginated {
  items: any[];
  meta: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const decoratorMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((payload: any) => {
        let message = decoratorMessage || RESPONSE_MESSAGES.SUCCESS;

        // Extract message from standard payload if no decorator is present
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && !(payload instanceof Paginated)) {
          if ('message' in payload && typeof payload.message === 'string' && !('statusCode' in payload && payload.success === true)) {
            if (!decoratorMessage) {
              message = payload.message;
            }
            const { message: _, ...rest } = payload;
            payload = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        // Already built by ResponseService: stamp path, apply status, pass through
        if (payload && payload.success === true && 'statusCode' in payload) {
          res.status(payload.statusCode);
          return { ...payload, path: req.originalUrl };
        }

        const isPaginated = payload instanceof Paginated;
        return {
          success: true as const,
          statusCode: res.statusCode,
          message,
          data: isPaginated ? payload.items : (payload ?? null),
          ...(isPaginated && { meta: payload.meta }),
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        };
      }),
    );
  }
}
