import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestTracker');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;

    this.logger.log(`[${className}] ---> [${handlerName}] | ${method} ${url}`);

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const timeTaken = Date.now() - now;
        this.logger.log(
          `[${className}] <--- [${handlerName}] | Finished in ${timeTaken}ms`,
        );
      }),
    );
  }
}
