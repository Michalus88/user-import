import { Injectable } from '@nestjs/common';
import { IMPORT_ERROR_CODES } from '@shared/constants';
import { ImportResult, ImportRowError } from '@shared/types';
import { parseCsv, ParsedRow } from './csv-import.parser';
import { UsersRepository } from './users.repository';

@Injectable()
export class CsvImportService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async import(buffer: Buffer): Promise<ImportResult> {
    const { validRows, errors, skippedInFileCount, total } = parseCsv(buffer);

    const { eligible, dbDuplicateErrors } =
      await this.partitionByDbDuplicates(validRows);

    let inserted = 0;
    let raceConditionErrors: ImportRowError[] = [];

    if (eligible.length > 0) {
      inserted = await this.usersRepository.createMany(
        eligible.map(({ username, email }) => ({ username, email })),
      );

      if (inserted < eligible.length) {
        raceConditionErrors = await this.reconcileRaceLosers(eligible);
      }
    }

    return {
      inserted,
      skipped:
        skippedInFileCount +
        dbDuplicateErrors.length +
        raceConditionErrors.length,
      total,
      errors: [...errors, ...dbDuplicateErrors, ...raceConditionErrors],
    };
  }

  private async reconcileRaceLosers(
    eligible: ParsedRow[],
  ): Promise<ImportRowError[]> {
    const nowExistingEmails = await this.usersRepository.findEmailsIn(
      eligible.map((row) => row.email),
    );
    const nowExistingSet = new Set(nowExistingEmails);

    return eligible
      .filter((row) => nowExistingSet.has(row.email))
      .map((row) => ({
        row: row.rowNumber,
        field: 'email',
        code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB,
        message: `Email ${row.email} already exists`,
      }));
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
