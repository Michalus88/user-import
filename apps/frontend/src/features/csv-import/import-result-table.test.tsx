import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ImportResult } from '@shared/types';
import { IMPORT_ERROR_CODES } from '@shared/constants';
import { ImportResultTable } from './import-result-table';
import { translateErrorCode } from './error-code-map';

const baseResult: ImportResult = {
  inserted: 5,
  skipped: 2,
  total: 7,
  errors: [],
};

describe('ImportResultTable', () => {
  it('renders summary counts', () => {
    render(<ImportResultTable result={baseResult} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Zapisane')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Pominięte')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Razem')).toBeInTheDocument();
  });

  it('does not render error table when errors are empty', () => {
    render(<ImportResultTable result={baseResult} />);
    expect(screen.queryByText(/błędy wierszy/i)).not.toBeInTheDocument();
  });

  it('renders error rows when errors are present', () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 3, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'Invalid email' },
        { row: 5, field: 'username', code: IMPORT_ERROR_CODES.USERNAME_REQUIRED, message: 'Required' },
      ],
    };
    render(<ImportResultTable result={result} />);
    expect(screen.getByText(/błędy wierszy/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('username')).toBeInTheDocument();
  });

  it('translates known error codes to Polish', () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 2, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'Invalid email' },
      ],
    };
    render(<ImportResultTable result={result} />);
    expect(
      screen.getByText(translateErrorCode(IMPORT_ERROR_CODES.EMAIL_INVALID)),
    ).toBeInTheDocument();
    expect(screen.queryByText(IMPORT_ERROR_CODES.EMAIL_INVALID)).not.toBeInTheDocument();
  });

  it('shows the original row for in-file duplicates', () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        {
          row: 7,
          field: 'email',
          code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_FILE,
          message: 'Duplicate email — first seen at row 3',
          relatedRow: 3,
        },
      ],
    };
    render(<ImportResultTable result={result} />);
    expect(screen.getByText(/\(w\. 3\)/)).toBeInTheDocument();
  });
});
