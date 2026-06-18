import type { ImportResult } from '@shared/types';
import { apiFetch } from '@/lib/api-client';

export function importCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ImportResult>('/users/import', { method: 'POST', body: form });
}
