import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiErrorDetail,
  ApiMeta,
  ApiSuccessResponse,
} from '../interfaces/api-response.interface';

@Injectable()
export class ResponseService {
  // ---------- Success ----------

  success<T>(
    data: T,
    message = 'Success',
    statusCode: number = HttpStatus.OK,
    meta?: ApiMeta,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data: data ?? (null as T),
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
      path: '', // filled by ResponseInterceptor
    };
  }

  created<T>(data: T, message = 'Created successfully') {
    return this.success(data, message, HttpStatus.CREATED);
  }

  noContent(message = 'Deleted successfully') {
    return this.success(null as any, message, HttpStatus.OK);
  }

  paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success',
  ) {
    return this.success(items, message, HttpStatus.OK, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  // ---------- Errors (throw; AllExceptionsFilter formats) ----------

  badRequest(message = 'Bad request', errors?: ApiErrorDetail[]): never {
    throw new BadRequestException({ message, error: 'Bad Request', errors });
  }

  unauthorized(message = 'Unauthorized'): never {
    throw new UnauthorizedException({ message, error: 'Unauthorized' });
  }

  forbidden(message = 'Forbidden'): never {
    throw new ForbiddenException({ message, error: 'Forbidden' });
  }

  notFound(message = 'Resource not found'): never {
    throw new NotFoundException({ message, error: 'Not Found' });
  }

  conflict(message = 'Resource already exists'): never {
    throw new ConflictException({ message, error: 'Conflict' });
  }

  unprocessable(message = 'Unprocessable entity', errors?: ApiErrorDetail[]): never {
    throw new UnprocessableEntityException({
      message,
      error: 'Unprocessable Entity',
      errors,
    });
  }

  internal(message = 'Internal server error'): never {
    throw new InternalServerErrorException({
      message,
      error: 'Internal Server Error',
    });
  }

  error(
    statusCode: number,
    message: string,
    error = 'Error',
    errors?: ApiErrorDetail[],
  ): never {
    throw new HttpException({ message, error, errors }, statusCode);
  }
}
