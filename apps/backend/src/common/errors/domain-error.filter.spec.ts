import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { UserAlreadyExistsError } from '../../modules/users/users.errors';
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

  beforeEach(() => {
    filter = new DomainExceptionFilter();
  });

  it('maps UserAlreadyExistsError to 409 with USER_ALREADY_EXISTS code and metadata', () => {
    const res = mockResponse();
    const host = mockHost(res);
    const error = new UserAlreadyExistsError('alice@example.com');

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      code: 'USER_ALREADY_EXISTS',
      message: error.message,
    });
  });
});
