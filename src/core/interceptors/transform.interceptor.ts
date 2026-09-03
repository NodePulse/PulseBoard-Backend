import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../constants/messages';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<unknown>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<unknown>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;
    const decoratorMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data: unknown) => {
        let message = decoratorMessage || RESPONSE_MESSAGES.SUCCESS;
        let finalData: unknown = data;

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const dataObj = data as Record<string, unknown>;
          if ('message' in dataObj && typeof dataObj.message === 'string') {
            if (!decoratorMessage) {
              message = dataObj.message;
            }
            const { message: _, ...rest } = dataObj;
            finalData = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        return {
          success: true,
          statusCode,
          message,
          data: finalData,
        };
      }),
    );
  }
}
