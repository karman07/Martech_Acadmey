import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/** Catches every unhandled exception so a 500 always gets logged server-side with its full
 * stack trace before responding — previously there was no global filter, so a raw 500 (as
 * opposed to a thrown HttpException) left no trace of what actually failed. Response shape
 * for existing HttpExceptions (4xx validation, auth, not-found, etc.) is unchanged. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('UnhandledException');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) {
        this.logger.error(exception.message, exception.stack);
      }
      response.status(status).json(exception.getResponse());
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unknown error',
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
