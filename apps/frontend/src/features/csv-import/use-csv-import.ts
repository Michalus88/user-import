import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

function isImportRowError(value: unknown): value is ImportRowError {
  if (typeof value !== 'object' || value === null) return false;
  if (!('row' in value) || !('field' in value) || !('code' in value) || !('message' in value)) {
    return false;
  }
  const { row, field, code, message } = value;
  return (
    typeof row === 'number' &&
    (field === 'username' || field === 'email' || field === 'row') &&
    typeof code === 'string' &&
    typeof message === 'string'
  );
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
      toast.success(`Imported ${data.inserted} users. Skipped: ${data.skipped}.`);
    },
    onError: (error) => {
      if (error.status === 422) {
        const structured = extractImportResult(error);
        if (structured) {
          setResult(structured);
          toast.error('No users were imported. Check the error report.');
          return;
        }
      }
      if (error.status === 413) {
        toast.error(error.message ?? 'File is too large');
        return;
      }
      if (error.code === 'MALFORMED_CSV') {
        toast.error('CSV must have "email" and "username" columns');
        return;
      }
      toast.error(error.message ?? 'Something went wrong');
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    result,
    reset: () => setResult(null),
  };
}
