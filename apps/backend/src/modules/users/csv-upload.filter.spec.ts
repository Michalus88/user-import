import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import multer from 'multer';
import { MulterExceptionFilter } from './csv-upload.filter';

const mockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const mockHost = (res: ReturnType<typeof mockResponse>): ArgumentsHost =>
  ({
    switchToHttp: () => ({ getResponse: () => res }),
  }) as unknown as ArgumentsHost;

describe('MulterExceptionFilter', () => {
  const filter = new MulterExceptionFilter();

  it('maps LIMIT_FILE_SIZE to 413 with FILE_TOO_LARGE code', () => {
    const res = mockResponse();
    const error = new multer.MulterError('LIMIT_FILE_SIZE');

    filter.catch(error, mockHost(res));

    expect(res.status).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      code: 'FILE_TOO_LARGE',
      message: 'Uploaded file exceeds the size limit',
    });
  });

  it('maps other multer errors to 400 with UPLOAD_ERROR code', () => {
    const res = mockResponse();
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

    filter.catch(error, mockHost(res));

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'UPLOAD_ERROR',
      message: 'File upload failed',
    });
  });

  it('does not leak the underlying multer message to the client', () => {
    const res = mockResponse();
    const error = new multer.MulterError('LIMIT_FILE_SIZE');
    error.message = 'sensitive internal: /tmp/upload-XYZ exceeded 2097152';

    filter.catch(error, mockHost(res));

    const payload = res.json.mock.calls[0][0] as { message: string };
    expect(payload.message).not.toContain('sensitive internal');
    expect(payload.message).not.toContain('/tmp');
  });
});
