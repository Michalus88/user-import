import { isUtf8 } from 'node:buffer';
import { isEmail } from 'class-validator';
import { parse } from 'csv-parse/sync';
import {
  EMAIL_MAX_LENGTH,
  IMPORT_ERROR_CODES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from '@shared/constants';
import { ImportRowError } from '@shared/types';
import {
  InvalidEncodingError,
  MalformedCsvError,
  RowCountExceededError,
} from './csv-import.errors';

const MAX_ROWS = 10_000;
const REQUIRED_HEADERS = ['username', 'email'] as const;
const CANDIDATE_DELIMITERS = [',', ';', '\t'] as const;
const DEFAULT_DELIMITER = ',';

function sniffDelimiter(buffer: Buffer): string {
  const firstLine = buffer.toString('utf-8').split(/\r?\n/, 1)[0] ?? '';
  let best = { delimiter: DEFAULT_DELIMITER, count: 0 };
  for (const delimiter of CANDIDATE_DELIMITERS) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > best.count) {
      best = { delimiter, count };
    }
  }
  return best.delimiter;
}

export interface ParsedRow {
  username: string;
  email: string;
  rowNumber: number;
}

export interface ParseResult {
  validRows: ParsedRow[];
  errors: ImportRowError[];
  skippedInFileCount: number;
  total: number;
}

export function parseCsv(buffer: Buffer): ParseResult {
  if (!isUtf8(buffer)) {
    throw new InvalidEncodingError();
  }

  const detectedHeaders: string[] = [];

  const delimiter = sniffDelimiter(buffer);

  let records: Record<string, string>[];
  try {
    records = parse(buffer, {
      bom: true,
      delimiter,
      columns: (headers: string[]) => {
        detectedHeaders.push(...headers);
        return headers;
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch {
    throw new MalformedCsvError();
  }

  for (const required of REQUIRED_HEADERS) {
    if (!detectedHeaders.includes(required)) {
      throw new MalformedCsvError();
    }
  }

  if (records.length > MAX_ROWS) {
    throw new RowCountExceededError(MAX_ROWS);
  }

  const errors: ImportRowError[] = [];
  const validRows: ParsedRow[] = [];
  const seenEmails = new Map<string, number>();
  let skippedInFileCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNumber = i + 2;
    const username = record['username'] ?? '';
    const email = record['email'] ?? '';
    const rowErrors: ImportRowError[] = [];

    if (!username.trim()) {
      rowErrors.push({
        row: rowNumber,
        field: 'username',
        code: IMPORT_ERROR_CODES.USERNAME_REQUIRED,
        message: 'Username is required',
      });
    } else if (
      username.trim().length < USERNAME_MIN_LENGTH ||
      username.trim().length > USERNAME_MAX_LENGTH ||
      !USERNAME_REGEX.test(username.trim())
    ) {
      rowErrors.push({
        row: rowNumber,
        field: 'username',
        code: IMPORT_ERROR_CODES.USERNAME_INVALID,
        message: `Username must be 3–${USERNAME_MAX_LENGTH} characters and contain only letters, digits and spaces`,
      });
    }

    if (!email || email.length > EMAIL_MAX_LENGTH || !isEmail(email)) {
      rowErrors.push({
        row: rowNumber,
        field: 'email',
        code: IMPORT_ERROR_CODES.EMAIL_INVALID,
        message: 'Email must be a valid email address',
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    const normalizedEmail = email.toLowerCase();
    const firstSeenAt = seenEmails.get(normalizedEmail);

    if (firstSeenAt !== undefined) {
      errors.push({
        row: rowNumber,
        field: 'email',
        code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE,
        message: `Duplicate email — first seen at row ${firstSeenAt}`,
        relatedRow: firstSeenAt,
      });
      skippedInFileCount++;
      continue;
    }

    seenEmails.set(normalizedEmail, rowNumber);
    validRows.push({ username, email: normalizedEmail, rowNumber });
  }

  return { validRows, errors, skippedInFileCount, total: records.length };
}
