import { Injectable } from '@nestjs/common';
import { ImportResult, ImportRowError } from '@shared/types';
import { parseCsv, ParsedRow } from './csv-import.parser';
import { IMPORT_ERROR_CODES } from './csv-import.errors';
import { UsersRepository } from './users.repository';

@Injectable()
export class CsvImportService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async import(buffer: Buffer): Promise<ImportResult> {
    const { validRows, errors, skippedInFileCount, total } = parseCsv(buffer);

    const { eligible, dbDuplicateErrors } =
      await this.partitionByDbDuplicates(validRows);

    const inserted =
      eligible.length > 0
        ? await this.usersRepository.createMany(
            eligible.map(({ username, email }) => ({ username, email })),
          )
        : 0;

    return {
      inserted,
      skipped: skippedInFileCount + dbDuplicateErrors.length,
      total,
      errors: [...errors, ...dbDuplicateErrors],
    };
  }

  private async partitionByDbDuplicates(
    rows: ParsedRow[],
  ): Promise<{ eligible: ParsedRow[]; dbDuplicateErrors: ImportRowError[] }> {
    if (rows.length === 0) {
      return { eligible: [], dbDuplicateErrors: [] };
    }

    const existingEmails = await this.usersRepository.findEmailsIn(
      rows.map((r) => r.email),
    );
    const existingEmailSet = new Set(existingEmails);

    const eligible: ParsedRow[] = [];
    const dbDuplicateErrors: ImportRowError[] = [];

    for (const row of rows) {
      if (existingEmailSet.has(row.email)) {
        dbDuplicateErrors.push({
          row: row.rowNumber,
          field: 'email',
          code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB,
          message: `Email ${row.email} already exists`,
        });
      } else {
        eligible.push(row);
      }
    }

    return { eligible, dbDuplicateErrors };
  }
}
