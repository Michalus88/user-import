import { HttpStatus } from '@nestjs/common';
import {
  FileMissingError,
  InvalidEncodingError,
  MalformedCsvError,
  RowCountExceededError,
} from '../../modules/users/csv-import.errors';
import { UserAlreadyExistsError } from '../../modules/users/users.errors';
import { DomainError } from './domain-error';

export const DOMAIN_ERROR_HTTP_MAP = new Map<
  new (...args: never[]) => DomainError,
  HttpStatus
>([
  [UserAlreadyExistsError, HttpStatus.CONFLICT],
  [FileMissingError, HttpStatus.BAD_REQUEST],
  [MalformedCsvError, HttpStatus.BAD_REQUEST],
  [InvalidEncodingError, HttpStatus.BAD_REQUEST],
  [RowCountExceededError, HttpStatus.PAYLOAD_TOO_LARGE],
]);
