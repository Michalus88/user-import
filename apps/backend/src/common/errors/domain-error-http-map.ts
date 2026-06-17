import { HttpStatus } from '@nestjs/common';
import { UserAlreadyExistsError } from '../../modules/users/users.errors';
import { DomainError } from './domain-error';

export const DOMAIN_ERROR_HTTP_MAP = new Map<new (...args: never[]) => DomainError, HttpStatus>([
  [UserAlreadyExistsError, HttpStatus.CONFLICT],
]);
