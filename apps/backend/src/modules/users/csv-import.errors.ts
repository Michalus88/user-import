import { DomainError } from '../../common/errors/domain-error';

export const IMPORT_ERROR_CODES = {
  USERNAME_REQUIRED: 'USERNAME_REQUIRED',
  EMAIL_INVALID: 'EMAIL_INVALID',
  EMAIL_DUPLICATE_IN_FILE: 'EMAIL_DUPLICATE_IN_FILE',
  EMAIL_DUPLICATE_IN_DB: 'EMAIL_DUPLICATE_IN_DB',
} as const;

export type ImportErrorCode =
  (typeof IMPORT_ERROR_CODES)[keyof typeof IMPORT_ERROR_CODES];

export class MalformedCsvError extends DomainError {
  constructor() {
    super('MALFORMED_CSV', 'CSV file is malformed or missing required headers');
  }
}

export class InvalidEncodingError extends DomainError {
  constructor() {
    super('ENCODING_NOT_UTF8', 'CSV file must be encoded as UTF-8');
  }
}

export class RowCountExceededError extends DomainError {
  constructor(max: number) {
    super('ROW_COUNT_EXCEEDED', `Row count exceeds the limit of ${max}`);
  }
}
