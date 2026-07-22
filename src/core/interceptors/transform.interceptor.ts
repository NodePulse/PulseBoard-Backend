import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
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
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;
    const message = this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) || RESPONSE_MESSAGES.SUCCESS;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        message,
        data,
      })),
    );
  }
}
