import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import {
  FileMissingError,
  InvalidEncodingError,
  MalformedCsvError,
  RowCountExceededError,
} from '../../modules/users/csv-import.errors';
import { UserAlreadyExistsError } from '../../modules/users/users.errors';
import { DomainError } from './domain-error';
import { DomainExceptionFilter } from './domain-error.filter';

const mockResponse = () => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

const mockHost = (res: ReturnType<typeof mockResponse>): ArgumentsHost =>
  ({
    switchToHttp: () => ({ getResponse: () => res }),
  }) as unknown as ArgumentsHost;

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it.each([
    [new UserAlreadyExistsError('alice@example.com'), HttpStatus.CONFLICT, 'USER_ALREADY_EXISTS'],
    [new FileMissingError(), HttpStatus.BAD_REQUEST, 'FILE_MISSING'],
    [new MalformedCsvError(), HttpStatus.BAD_REQUEST, 'MALFORMED_CSV'],
    [new InvalidEncodingError(), HttpStatus.BAD_REQUEST, 'ENCODING_NOT_UTF8'],
    [new RowCountExceededError(1000), HttpStatus.PAYLOAD_TOO_LARGE, 'ROW_COUNT_EXCEEDED'],
  ])('maps %s to correct HTTP status and code', (error, expectedStatus, expectedCode) => {
    const res = mockResponse();
    filter.catch(error, mockHost(res));

    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: expectedStatus,
      code: expectedCode,
      message: error.message,
    });
  });

  it('falls back to 500 for an unmapped DomainError', () => {
    class UnknownError extends DomainError {
      constructor() {
        super('UNKNOWN', 'something went wrong');
      }
    }

    const res = mockResponse();
    filter.catch(new UnknownError(), mockHost(res));

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNKNOWN', statusCode: HttpStatus.INTERNAL_SERVER_ERROR }),
    );
  });
});
