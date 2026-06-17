export interface ImportRowError {
  row: number;
  field: 'username' | 'email' | 'row';
  code: string;
  message: string;
}

export interface ImportResult {
  inserted: number;
  skipped: number;
  total: number;
  errors: ImportRowError[];
}
