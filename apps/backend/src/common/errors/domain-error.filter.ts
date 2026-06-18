import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from './domain-error';
import { DOMAIN_ERROR_HTTP_MAP } from './domain-error-http-map';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const mapped = DOMAIN_ERROR_HTTP_MAP.get(
      exception.constructor as new (...args: never[]) => DomainError,
    );
    const status = mapped ?? HttpStatus.INTERNAL_SERVER_ERROR;

    if (mapped === undefined) {
      this.logger.error(
        `Unmapped DomainError ${exception.constructor.name} (${exception.code}): ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
