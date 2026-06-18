import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ImportResult } from '@shared/types';
import { IMPORT_ERROR_CODES } from '@shared/constants';
import { CsvUploadPanel } from './csv-upload-panel';
import { translateErrorCode } from './error-code-map';
import * as useCsvImportModule from './use-csv-import';

vi.mock('./use-csv-import');

const mockMutate = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof useCsvImportModule.useCsvImport>> = {}) {
  vi.mocked(useCsvImportModule.useCsvImport).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    result: null,
    ...overrides,
  } as ReturnType<typeof useCsvImportModule.useCsvImport>);
}

const csvFile = () => new File(['username,email\n'], 'users.csv', { type: 'text/csv' });

describe('CsvUploadPanel', () => {
  beforeEach(() => {
    mockHook();
  });

  it('disables Import button when no file is selected', () => {
    render(<CsvUploadPanel onImported={vi.fn()} />);
    expect(screen.getByRole('button', { name: /import users/i })).toBeDisabled();
  });

  it('enables Import button after file is selected', async () => {
    render(<CsvUploadPanel onImported={vi.fn()} />);
    const input = screen.getByTestId('csv-file-input');
    await userEvent.upload(input, csvFile());
    expect(screen.getByRole('button', { name: /import users/i })).toBeEnabled();
  });

  it('shows filename and size after file selection', async () => {
    render(<CsvUploadPanel onImported={vi.fn()} />);
    const input = screen.getByTestId('csv-file-input');
    await userEvent.upload(input, csvFile());
    expect(screen.getByText('users.csv')).toBeInTheDocument();
  });

  it('removes file when remove button is clicked', async () => {
    render(<CsvUploadPanel onImported={vi.fn()} />);
    const input = screen.getByTestId('csv-file-input');
    await userEvent.upload(input, csvFile());
    await userEvent.click(screen.getByRole('button', { name: /remove file/i }));
    expect(screen.queryByText('users.csv')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import users/i })).toBeDisabled();
  });

  it('disables Import button and shows loading label while pending', async () => {
    mockHook({ isPending: true });
    render(<CsvUploadPanel onImported={vi.fn()} />);
    const input = screen.getByTestId('csv-file-input');
    await userEvent.upload(input, csvFile());
    expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled();
  });

  it('calls mutate with the selected file on Import click', async () => {
    render(<CsvUploadPanel onImported={vi.fn()} />);
    const input = screen.getByTestId('csv-file-input');
    const file = csvFile();
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /import users/i }));
    expect(mockMutate).toHaveBeenCalledWith(file);
  });

  it('shows result block on success', () => {
    const result: ImportResult = { inserted: 3, skipped: 1, total: 4, errors: [] };
    mockHook({ result });
    render(<CsvUploadPanel onImported={vi.fn()} />);
    expect(screen.getByText('Inserted')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows result block with error rows on partial success', () => {
    const result: ImportResult = {
      inserted: 1,
      skipped: 2,
      total: 3,
      errors: [{ row: 2, field: 'email', code: IMPORT_ERROR_CODES.EMAIL_INVALID, message: 'bad' }],
    };
    mockHook({ result });
    render(<CsvUploadPanel onImported={vi.fn()} />);
    expect(screen.getByText(/row errors/i)).toBeInTheDocument();
    expect(
      screen.getByText(translateErrorCode(IMPORT_ERROR_CODES.EMAIL_INVALID)),
    ).toBeInTheDocument();
  });

  it('shows result block with zero inserts on full failure (422)', () => {
    const result: ImportResult = {
      inserted: 0,
      skipped: 3,
      total: 3,
      errors: [{ row: 1, field: 'email', code: 'EMAIL_DUPLICATE_IN_DB', message: 'dup' }],
    };
    mockHook({ result });
    render(<CsvUploadPanel onImported={vi.fn()} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Inserted')).toBeInTheDocument();
  });
});
