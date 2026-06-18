import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IMPORT_ERROR_CODES, type ImportErrorCode } from '@shared/constants';
import type { ImportResult, ImportRowError } from '@shared/types';
import { type ApiError } from '@/lib/api-client';
import { USERS_QUERY_KEY } from '@/features/users/use-users';
import { importCsv } from './api';

interface UseCsvImportOptions {
  onImported?: () => void;
}

interface CsvImportState {
  mutate: (file: File) => void;
  isPending: boolean;
  result: ImportResult | null;
  reset: () => void;
}

function isImportErrorCode(value: unknown): value is ImportErrorCode {
  return typeof value === 'string' && value in IMPORT_ERROR_CODES;
}

function isImportRowError(value: unknown): value is ImportRowError {
  if (typeof value !== 'object' || value === null) return false;
  if (!('row' in value) || !('field' in value) || !('code' in value) || !('message' in value)) {
    return false;
  }
  const { row, field, code, message } = value;
  if (
    typeof row !== 'number' ||
    (field !== 'username' && field !== 'email' && field !== 'row') ||
    !isImportErrorCode(code) ||
    typeof message !== 'string'
  ) {
    return false;
  }
  if (code === IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE) {
    return (
      'relatedRow' in value &&
      typeof (value as { relatedRow: unknown }).relatedRow === 'number' &&
      field === 'email'
    );
  }
  return true;
}

function extractImportResult(error: ApiError): ImportResult | null {
  const body = error.body;
  if (
    typeof body.inserted !== 'number' ||
    typeof body.skipped !== 'number' ||
    typeof body.total !== 'number' ||
    !Array.isArray(body.errors)
  ) {
    return null;
  }
  const errors: ImportRowError[] = [];
  for (const item of body.errors) {
    if (!isImportRowError(item)) return null;
    errors.push(item);
  }
  return {
    inserted: body.inserted,
    skipped: body.skipped,
    total: body.total,
    errors,
  };
}

export function useCsvImport(options?: UseCsvImportOptions): CsvImportState {
  const [result, setResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation<ImportResult, ApiError, File>({
    mutationFn: importCsv,
    onMutate: () => {
      setResult(null);
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.inserted > 0) {
        void queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
        options?.onImported?.();
      }
      toast.success(`Zaimportowano ${data.inserted} użytkowników. Pominięto: ${data.skipped}.`);
    },
    onError: (error) => {
      if (error.status === 422) {
        const structured = extractImportResult(error);
        if (structured) {
          setResult(structured);
          toast.error('Nie zaimportowano żadnych użytkowników. Sprawdź raport błędów.');
          return;
        }
      }
      if (error.status === 413) {
        toast.error(error.message ?? 'Plik jest za duży');
        return;
      }
      if (error.code === 'MALFORMED_CSV') {
        toast.error('Plik CSV musi zawierać kolumny "email" i "username"');
        return;
      }
      toast.error(error.message ?? 'Coś poszło nie tak');
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    result,
    reset: () => setResult(null),
  };
}
