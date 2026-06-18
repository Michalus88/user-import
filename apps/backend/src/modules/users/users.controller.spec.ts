import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IMPORT_ERROR_CODES } from '@shared/constants';
import { ImportResult } from '@shared/types';
import { CsvImportService } from './csv-import.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockFile = (
  content = 'username,email\nalice,a@x.com',
): Express.Multer.File =>
  ({ buffer: Buffer.from(content, 'utf-8') }) as Express.Multer.File;

describe('UsersController.importCsv', () => {
  let controller: UsersController;
  let csvImport: jest.Mocked<Pick<CsvImportService, 'import'>>;

  beforeEach(() => {
    csvImport = { import: jest.fn() };
    controller = new UsersController(
      {} as UsersService,
      csvImport as unknown as CsvImportService,
    );
  });

  it('returns the import result when at least one row was inserted', async () => {
    const result: ImportResult = {
      inserted: 2,
      skipped: 0,
      total: 2,
      errors: [],
    };
    csvImport.import.mockResolvedValue(result);

    await expect(controller.importCsv(mockFile())).resolves.toEqual(result);
  });

  it('returns the import result on partial success', async () => {
    const result: ImportResult = {
      inserted: 1,
      skipped: 1,
      total: 2,
      errors: [
        {
          row: 3,
          field: 'email',
          code: IMPORT_ERROR_CODES.EMAIL_INVALID,
          message: 'bad',
        },
      ],
    };
    csvImport.import.mockResolvedValue(result);

    await expect(controller.importCsv(mockFile())).resolves.toEqual(result);
  });

  it('throws 422 with the ImportResult body when nothing was inserted', async () => {
    const result: ImportResult = {
      inserted: 0,
      skipped: 1,
      total: 1,
      errors: [
        {
          row: 2,
          field: 'email',
          code: IMPORT_ERROR_CODES.EMAIL_INVALID,
          message: 'bad',
        },
      ],
    };
    csvImport.import.mockResolvedValue(result);

    await expect(controller.importCsv(mockFile())).rejects.toMatchObject({
      status: 422,
      response: result,
    });
  });

  it('preserves the ImportResult shape inside the 422 response body', async () => {
    const result: ImportResult = {
      inserted: 0,
      skipped: 0,
      total: 0,
      errors: [],
    };
    csvImport.import.mockResolvedValue(result);

    try {
      await controller.importCsv(mockFile());
      fail('expected UnprocessableEntityException');
    } catch (err) {
      expect(err).toBeInstanceOf(UnprocessableEntityException);
      expect((err as UnprocessableEntityException).getResponse()).toEqual(
        result,
      );
    }
  });

  it('throws 400 FILE_MISSING when no file is uploaded', async () => {
    await expect(
      controller.importCsv(undefined as unknown as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.importCsv(undefined as unknown as Express.Multer.File),
    ).rejects.toMatchObject({
      response: { code: 'FILE_MISSING', message: 'No CSV file uploaded' },
    });

    expect(csvImport.import).not.toHaveBeenCalled();
  });
});
