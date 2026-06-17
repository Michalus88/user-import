import { DomainError } from '../../common/errors/domain-error';

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super('USER_ALREADY_EXISTS', `User with email ${email} already exists`);
  }
}
