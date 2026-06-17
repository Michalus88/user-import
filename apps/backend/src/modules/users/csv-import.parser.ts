import { isEmail } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { ImportRowError } from '@shared/types';
import {
  IMPORT_ERROR_CODES,
  MalformedCsvError,
  RowCountExceededError,
} from './csv-import.errors';

const MAX_ROWS = 10_000;
const REQUIRED_HEADERS = ['username', 'email'] as const;

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
  const detectedHeaders: string[] = [];

  let records: Record<string, string>[];
  try {
    records = parse(buffer, {
      bom: true,
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
    }

    if (!email || !isEmail(email)) {
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
      });
      skippedInFileCount++;
      continue;
    }

    seenEmails.set(normalizedEmail, rowNumber);
    validRows.push({ username, email: normalizedEmail, rowNumber });
  }

  return { validRows, errors, skippedInFileCount, total: records.length };
}
