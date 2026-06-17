import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import multer from 'multer';

@Catch(multer.MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: multer.MulterError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, code, message } =
      exception.code === 'LIMIT_FILE_SIZE'
        ? {
            status: HttpStatus.PAYLOAD_TOO_LARGE,
            code: 'FILE_TOO_LARGE',
            message: 'Uploaded file exceeds the size limit',
          }
        : {
            status: HttpStatus.BAD_REQUEST,
            code: 'UPLOAD_ERROR',
            message: 'File upload failed',
          };

    response.status(status).json({ statusCode: status, code, message });
  }
}
