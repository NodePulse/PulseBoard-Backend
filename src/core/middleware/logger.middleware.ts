import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';

    const originalSend = res.send;
    res.send = function (body: unknown): Response {
      res.locals.body = body;
      return originalSend.call(this, body);
    };

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      let message = '';
      const body = res.locals.body as unknown;

      if (body) {
        try {
          const parsedBody: unknown =
            typeof body === 'string' ? JSON.parse(body) : body;

          if (
            typeof parsedBody === 'object' &&
            parsedBody !== null &&
            'message' in parsedBody
          ) {
            message = String((parsedBody as Record<string, unknown>).message);
          }
        } catch {
          // Ignore JSON parse errors
        }
      }

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} ${message}`,
      );
    });

    next();
  }
}
