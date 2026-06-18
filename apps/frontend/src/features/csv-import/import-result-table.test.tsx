import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ImportResult, ImportRowError } from '@shared/types';
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

  it('does not render filter chips when only one error code is present', () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 2, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'bad' },
        { row: 3, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'bad' },
      ],
    };
    render(<ImportResultTable result={result} />);
    expect(
      screen.queryByRole('button', { name: /wszystkie/i }),
    ).not.toBeInTheDocument();
  });

  it('renders filter chips when multiple error codes are present', () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 2, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'bad' },
        { row: 3, field: 'username', code: IMPORT_ERROR_CODES.USERNAME_REQUIRED, message: 'req' },
      ],
    };
    render(<ImportResultTable result={result} />);
    expect(screen.getByRole('button', { name: /wszystkie/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: new RegExp(translateErrorCode(IMPORT_ERROR_CODES.EMAIL_INVALID), 'i'),
      }),
    ).toBeInTheDocument();
  });

  it('filters error rows when a chip is clicked', async () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 2, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'bad' },
        { row: 3, field: 'username', code: IMPORT_ERROR_CODES.USERNAME_REQUIRED, message: 'req' },
      ],
    };
    render(<ImportResultTable result={result} />);
    await userEvent.click(
      screen.getByRole('button', {
        name: new RegExp(translateErrorCode(IMPORT_ERROR_CODES.EMAIL_INVALID), 'i'),
      }),
    );
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.queryByText('username')).not.toBeInTheDocument();
  });

  it('toggles the chip off and shows all rows when clicked again', async () => {
    const result: ImportResult = {
      ...baseResult,
      errors: [
        { row: 2, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'bad' },
        { row: 3, field: 'username', code: IMPORT_ERROR_CODES.USERNAME_REQUIRED, message: 'req' },
      ],
    };
    render(<ImportResultTable result={result} />);
    const emailChip = screen.getByRole('button', {
      name: new RegExp(translateErrorCode(IMPORT_ERROR_CODES.EMAIL_INVALID), 'i'),
    });
    await userEvent.click(emailChip);
    await userEvent.click(emailChip);
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('username')).toBeInTheDocument();
  });

  it('paginates errors when there are more than 10', () => {
    const errors: ImportRowError[] = Array.from({ length: 12 }, (_, i) => ({
      row: i + 100,
      field: 'email',
      code: IMPORT_ERROR_CODES.EMAIL_INVALID,
      message: 'bad',
    }));
    render(<ImportResultTable result={{ ...baseResult, errors }} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('109')).toBeInTheDocument();
    expect(screen.queryByText('110')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('jumps to a target page via the goto input', async () => {
    const errors: ImportRowError[] = Array.from({ length: 12 }, (_, i) => ({
      row: i + 100,
      field: 'email',
      code: IMPORT_ERROR_CODES.EMAIL_INVALID,
      message: 'bad',
    }));
    render(<ImportResultTable result={{ ...baseResult, errors }} />);
    const gotoInput = screen.getByLabelText(/idź do strony/i);
    await userEvent.type(gotoInput, '2');
    await userEvent.click(screen.getByRole('button', { name: /^idź$/i }));
    expect(screen.getByText('110')).toBeInTheDocument();
    expect(screen.getByText('111')).toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
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
