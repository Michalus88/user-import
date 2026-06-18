import { DomainError } from '../../common/errors/domain-error';

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
