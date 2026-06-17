import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from './domain-error';
import { DOMAIN_ERROR_HTTP_MAP } from './domain-error-http-map';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      DOMAIN_ERROR_HTTP_MAP.get(
        exception.constructor as new (...args: never[]) => DomainError,
      ) ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
