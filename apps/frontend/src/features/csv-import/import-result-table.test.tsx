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
    expect(screen.getByText('Inserted')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('does not render error table when errors are empty', () => {
    render(<ImportResultTable result={baseResult} />);
    expect(screen.queryByText(/row errors/i)).not.toBeInTheDocument();
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
    expect(screen.getByText(/row errors/i)).toBeInTheDocument();
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

  it('falls back to the raw code when code is unknown', () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 1, field: 'row', code: 'UNKNOWN_CODE', message: 'unknown' },
      ],
    };
    render(<ImportResultTable result={result} />);
    expect(screen.getByText('UNKNOWN_CODE')).toBeInTheDocument();
  });
});
