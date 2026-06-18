import { IMPORT_ERROR_CODES, type ImportErrorCode } from '@shared/constants';

interface ImportRowErrorBase {
  row: number;
  message: string;
}

export type ImportRowError =
  | (ImportRowErrorBase & {
      code: typeof IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE;
      field: 'email';
      relatedRow: number;
    })
  | (ImportRowErrorBase & {
      code: Exclude<
        ImportErrorCode,
        typeof IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE
      >;
      field: 'username' | 'email' | 'row';
    });

export interface ImportResult {
  inserted: number;
  skipped: number;
  total: number;
  errors: ImportRowError[];
}
