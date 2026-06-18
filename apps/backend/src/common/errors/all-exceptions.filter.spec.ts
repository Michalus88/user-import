import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

const mockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const mockHost = (
  res: ReturnType<typeof mockResponse>,
  req: { method?: string; url?: string } = {},
): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ method: 'GET', url: '/test', ...req }),
    }),
  }) as unknown as ArgumentsHost;

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('maps a generic Error to HTTP 500 with a sanitized body', () => {
    const res = mockResponse();
    filter.catch(new Error('secret stack info'), mockHost(res));

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('does not leak the original error message or stack to the client', () => {
    const res = mockResponse();
    filter.catch(new Error('database connection string: postgres://...'), mockHost(res));

    const payload = res.json.mock.calls[0][0] as { message: string };
    expect(payload.message).toBe('Internal server error');
    expect(JSON.stringify(payload)).not.toContain('database connection string');
  });

  it('logs unhandled errors with method, url and stack', () => {
    const res = mockResponse();
    const error = new Error('boom');
    filter.catch(error, mockHost(res, { method: 'POST', url: '/api/users' }));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [message, stack] = errorSpy.mock.calls[0];
    expect(message).toContain('POST');
    expect(message).toContain('/api/users');
    expect(stack).toBe(error.stack);
  });

  it('passes HttpException through with its declared status and body', () => {
    const res = mockResponse();
    const exception = new BadRequestException({ code: 'BAD', message: 'bad input' });

    filter.catch(exception, mockHost(res));

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({ code: 'BAD', message: 'bad input' });
  });

  it('does not log when HttpException status is 4xx', () => {
    const res = mockResponse();
    filter.catch(new BadRequestException('nope'), mockHost(res));

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs when HttpException status is 5xx', () => {
    const res = mockResponse();
    filter.catch(new InternalServerErrorException('downstream down'), mockHost(res));

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('wraps a string HttpException body into a statusCode envelope', () => {
    const res = mockResponse();
    filter.catch(new BadRequestException('plain string body'), mockHost(res));

    // BadRequestException with a string yields { statusCode, message, error } from Nest internals;
    // when getResponse() returns an object, it is forwarded unchanged.
    const body = res.json.mock.calls[0][0] as object;
    expect(body).toMatchObject({ statusCode: HttpStatus.BAD_REQUEST });
  });
});
