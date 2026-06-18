import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

const DB_UNAVAILABLE_CODE = 'ECONNREFUSED';
const MISSING_TABLE_CODE = 'P2021';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`Database unavailable on ${request.method} ${request.url}`);
      return this.replyInternalError(response);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === MISSING_TABLE_CODE) {
        this.logger.error(
          `Database schema not migrated [P2021] on ${request.method} ${request.url} — run "pnpm db:migrate:deploy"`,
        );
        return this.replyInternalError(response);
      }
      const label =
        exception.code === DB_UNAVAILABLE_CODE
          ? 'Database unavailable'
          : 'Unhandled Prisma error';
      this.logger.error(`${label} [${exception.code}] on ${request.method} ${request.url}`);
      return this.replyInternalError(response);
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body }
            : body,
        );
      return;
    }

    this.replyInternalError(response);
  }

  private replyInternalError(response: Response): void {
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
}
