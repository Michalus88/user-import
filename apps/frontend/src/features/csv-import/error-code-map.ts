import { IMPORT_ERROR_CODES, type ImportErrorCode } from '@shared/constants';

const ERROR_CODE_MAP: Record<ImportErrorCode, string> = {
  [IMPORT_ERROR_CODES.USERNAME_REQUIRED]: 'Brak nazwy',
  [IMPORT_ERROR_CODES.USERNAME_INVALID]: 'Zła nazwa',
  [IMPORT_ERROR_CODES.EMAIL_INVALID]: 'Zły format',
  [IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE]: 'Duplikat w pliku',
  [IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB]: 'Już istnieje',
};

export function translateErrorCode(code: ImportErrorCode): string {
  return ERROR_CODE_MAP[code];
}
