import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { RESPONSE_MESSAGES } from '../constants/messages';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR;
    let error = RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR.toUpperCase();
    let data: unknown = undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = typeof resObj.message === 'string' || Array.isArray(resObj.message)
          ? (resObj.message as string | string[])
          : exception.message;
        error = typeof resObj.error === 'string'
          ? resObj.error.toUpperCase()
          : exception.name.toUpperCase();
        data = resObj.data;
      } else {
        message = typeof res === 'string' ? res : exception.message;
        error = exception.name.toUpperCase();
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name.toUpperCase();
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error,
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
