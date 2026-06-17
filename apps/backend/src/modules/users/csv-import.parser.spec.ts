import { parseCsv } from './csv-import.parser';
import {
  IMPORT_ERROR_CODES,
  InvalidEncodingError,
  MalformedCsvError,
  RowCountExceededError,
} from './csv-import.errors';

const csv = (content: string): Buffer => Buffer.from(content, 'utf-8');

describe('parseCsv', () => {
  describe('header validation', () => {
    it('throws MalformedCsvError when username column is missing', () => {
      expect(() => parseCsv(csv('email\nalice@example.com'))).toThrow(
        MalformedCsvError,
      );
    });

    it('throws MalformedCsvError when email column is missing', () => {
      expect(() => parseCsv(csv('username\nalice'))).toThrow(MalformedCsvError);
    });

    it('throws MalformedCsvError on invalid CSV syntax', () => {
      expect(() => parseCsv(csv('username,email\n"unclosed'))).toThrow(
        MalformedCsvError,
      );
    });

    it('throws MalformedCsvError on empty buffer', () => {
      expect(() => parseCsv(csv(''))).toThrow(MalformedCsvError);
    });

    it('accepts headers in any order', () => {
      const result = parseCsv(csv('email,username\nbob@example.com,bob'));
      expect(result.validRows[0]).toMatchObject({
        username: 'bob',
        email: 'bob@example.com',
      });
    });
  });

  describe('row count limit', () => {
    it('throws RowCountExceededError when data rows exceed 10 000', () => {
      const rows = Array.from(
        { length: 10_001 },
        (_, i) => `user${i},user${i}@example.com`,
      );
      const content = ['username,email', ...rows].join('\n');
      expect(() => parseCsv(csv(content))).toThrow(RowCountExceededError);
    });

    it('accepts exactly 10 000 data rows', () => {
      const rows = Array.from(
        { length: 10_000 },
        (_, i) => `user${i},user${i}@example.com`,
      );
      const content = ['username,email', ...rows].join('\n');
      const result = parseCsv(csv(content));
      expect(result.total).toBe(10_000);
    });
  });

  describe('valid rows', () => {
    it('returns valid rows with correct rowNumber (1-based with header offset)', () => {
      const result = parseCsv(csv('username,email\nalice,alice@example.com'));
      expect(result.validRows).toEqual([
        { username: 'alice', email: 'alice@example.com', rowNumber: 2 },
      ]);
      expect(result.errors).toHaveLength(0);
      expect(result.total).toBe(1);
    });

    it('returns multiple valid rows', () => {
      const result = parseCsv(
        csv('username,email\nalice,alice@example.com\nbob,bob@example.com'),
      );
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('returns empty validRows and no errors for header-only file', () => {
      const result = parseCsv(csv('username,email'));
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('normalizes email to lowercase', () => {
      const result = parseCsv(csv('username,email\nalice,Alice@EXAMPLE.COM'));
      expect(result.validRows[0].email).toBe('alice@example.com');
    });

    it('ignores extra columns beyond required ones', () => {
      const result = parseCsv(
        csv('username,email,role\nalice,alice@example.com,admin'),
      );
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('username validation', () => {
    it('reports USERNAME_REQUIRED for empty username', () => {
      const result = parseCsv(csv('username,email\n,alice@example.com'));
      expect(result.errors).toEqual([
        expect.objectContaining({
          row: 2,
          field: 'username',
          code: IMPORT_ERROR_CODES.USERNAME_REQUIRED,
        }),
      ]);
      expect(result.validRows).toHaveLength(0);
    });

    it('reports USERNAME_REQUIRED for whitespace-only username', () => {
      const result = parseCsv(csv('username,email\n   ,alice@example.com'));
      expect(result.errors[0].code).toBe(IMPORT_ERROR_CODES.USERNAME_REQUIRED);
    });

    it('reports USERNAME_INVALID for username shorter than 3 characters', () => {
      const result = parseCsv(csv('username,email\nab,alice@example.com'));
      expect(result.errors).toEqual([
        expect.objectContaining({
          row: 2,
          field: 'username',
          code: IMPORT_ERROR_CODES.USERNAME_INVALID,
        }),
      ]);
      expect(result.validRows).toHaveLength(0);
    });

    it('accepts username with exactly 3 characters', () => {
      const result = parseCsv(csv('username,email\nabc,alice@example.com'));
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts username starting with uppercase letter', () => {
      const result = parseCsv(csv('username,email\nŁukasz,lukasz@example.com'));
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].username).toBe('Łukasz');
    });

    it('accepts username with spaces', () => {
      const result = parseCsv(csv('username,email\nJan Kowalski,jan@example.com'));
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].username).toBe('Jan Kowalski');
    });

    it('accepts username with special characters', () => {
      const result = parseCsv(
        csv('username,email\njan.kowalski_01,jan@example.com'),
      );
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts username consisting entirely of digits', () => {
      const result = parseCsv(csv('username,email\n123456,jan@example.com'));
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('email validation', () => {
    it('reports EMAIL_INVALID for missing email', () => {
      const result = parseCsv(csv('username,email\nalice,'));
      expect(result.errors).toEqual([
        expect.objectContaining({
          row: 2,
          field: 'email',
          code: IMPORT_ERROR_CODES.EMAIL_INVALID,
        }),
      ]);
    });

    it('reports EMAIL_INVALID for malformed email', () => {
      const result = parseCsv(csv('username,email\nalice,not-an-email'));
      expect(result.errors[0].code).toBe(IMPORT_ERROR_CODES.EMAIL_INVALID);
    });
  });

  describe('multiple field errors on same row', () => {
    it('reports both USERNAME_REQUIRED and EMAIL_INVALID for a row with both issues', () => {
      const result = parseCsv(csv('username,email\n,not-an-email'));
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe(IMPORT_ERROR_CODES.USERNAME_REQUIRED);
      expect(result.errors[1].code).toBe(IMPORT_ERROR_CODES.EMAIL_INVALID);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[1].row).toBe(2);
    });
  });

  describe('in-file duplicate detection', () => {
    it('accepts the first occurrence and rejects subsequent duplicates', () => {
      const result = parseCsv(
        csv(
          'username,email\nalice,alice@example.com\nalice2,alice@example.com',
        ),
      );
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].rowNumber).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 3,
        field: 'email',
        code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE,
      });
      expect(result.skippedInFileCount).toBe(1);
    });

    it('detects duplicates case-insensitively', () => {
      const result = parseCsv(
        csv(
          'username,email\nalice,Alice@Example.COM\nalice2,alice@example.com',
        ),
      );
      expect(result.validRows).toHaveLength(1);
      expect(result.errors[0].code).toBe(
        IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE,
      );
    });

    it('increments skippedInFileCount for each in-file duplicate', () => {
      const result = parseCsv(
        csv(
          'username,email\nali,a@example.com\nbob,a@example.com\ncat,a@example.com',
        ),
      );
      expect(result.skippedInFileCount).toBe(2);
    });
  });

  describe('encoding and line endings', () => {
    it('rejects non-UTF-8 buffer with InvalidEncodingError', () => {
      const win1250Bytes = Buffer.from([
        0x75,
        0x73,
        0x65,
        0x72,
        0x6e,
        0x61,
        0x6d,
        0x65,
        0x2c,
        0x65,
        0x6d,
        0x61,
        0x69,
        0x6c,
        0x0a,
        0xa3,
        0x75,
        0x6b,
        0x61,
        0x73,
        0x7a,
        0x2c,
        0x6c,
        0x40,
        0x78,
        0x2e,
        0x63,
        0x6f,
        0x6d,
      ]);
      expect(() => parseCsv(win1250Bytes)).toThrow(InvalidEncodingError);
    });

    it('accepts a valid UTF-8 buffer with multibyte characters', () => {
      const result = parseCsv(csv('username,email\nŁukasz,lukasz@example.com'));
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].username).toBe('Łukasz');
    });

    it('strips UTF-8 BOM from Excel-on-Windows CSV exports', () => {
      const result = parseCsv(
        csv('﻿username,email\nalice,alice@example.com'),
      );
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts CRLF line endings', () => {
      const result = parseCsv(
        csv('username,email\r\nalice,alice@example.com\r\nbob,bob@example.com'),
      );
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('preserves commas inside quoted username fields', () => {
      const result = parseCsv(
        csv('username,email\n"Doe, John",john@example.com'),
      );
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].username).toBe('Doe, John');
    });
  });

  describe('delimiter detection', () => {
    it('accepts semicolon-separated CSV (localized Excel export)', () => {
      const result = parseCsv(csv('username;email\nalice;alice@example.com'));
      expect(result.validRows).toEqual([
        { username: 'alice', email: 'alice@example.com', rowNumber: 2 },
      ]);
    });

    it('accepts tab-separated values', () => {
      const result = parseCsv(csv('username\temail\nalice\talice@example.com'));
      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('falls back to comma when no candidate delimiter is present in header', () => {
      expect(() => parseCsv(csv('usernameemail\nalicealice'))).toThrow(
        MalformedCsvError,
      );
    });

    it('picks the dominant delimiter when multiple candidates appear', () => {
      const result = parseCsv(
        csv('username;email\n"Doe, John";john@example.com'),
      );
      expect(result.validRows[0].username).toBe('Doe, John');
    });
  });

  describe('malformed row shapes', () => {
    it('treats a row shorter than headers as missing fields (EMAIL_INVALID)', () => {
      const result = parseCsv(csv('username,email\nalice'));
      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0].code).toBe(IMPORT_ERROR_CODES.EMAIL_INVALID);
      expect(result.errors[0].row).toBe(2);
    });
  });

  describe('mixed rows', () => {
    it('separates valid rows from invalid ones correctly', () => {
      const result = parseCsv(
        csv(
          [
            'username,email',
            'alice,alice@example.com',
            ',bad-email',
            'bob,bob@example.com',
          ].join('\n'),
        ),
      );
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.total).toBe(3);
    });
  });
});
