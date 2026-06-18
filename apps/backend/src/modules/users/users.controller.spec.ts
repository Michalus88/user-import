import { UnprocessableEntityException } from '@nestjs/common';
import { User } from '@prisma/client';
import { IMPORT_ERROR_CODES, USERS_PAGE_SIZE } from '@shared/constants';
import { ImportResult } from '@shared/types';
import { FileMissingError } from './csv-import.errors';
import { CsvImportService } from './csv-import.service';
import { UsersController } from './users.controller';
import { UserListResult, UsersService } from './users.service';

const mockFile = (
  content = 'username,email\nalice,a@x.com',
): Express.Multer.File =>
  ({ buffer: Buffer.from(content, 'utf-8') }) as Express.Multer.File;

const fakeUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  createdAt: new Date(),
  ...overrides,
});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Pick<UsersService, 'create' | 'findAll'>>;
  let csvImport: jest.Mocked<Pick<CsvImportService, 'import'>>;

  beforeEach(() => {
    usersService = { create: jest.fn(), findAll: jest.fn() };
    csvImport = { import: jest.fn() };
    controller = new UsersController(
      usersService as unknown as UsersService,
      csvImport as unknown as CsvImportService,
    );
  });

  describe('create', () => {
    it('returns the created user', async () => {
      const user = fakeUser();
      usersService.create.mockResolvedValue(user);

      await expect(
        controller.create({ username: 'alice', email: 'alice@example.com' }),
      ).resolves.toEqual(user);
    });

    it('propagates errors thrown by UsersService', async () => {
      usersService.create.mockRejectedValue(new Error('db error'));

      await expect(
        controller.create({ username: 'alice', email: 'alice@example.com' }),
      ).rejects.toThrow('db error');
    });
  });

  describe('findAll', () => {
    it('returns the paginated user list', async () => {
      const result: UserListResult = {
        users: [fakeUser()],
        total: 1,
        page: 1,
        pageSize: USERS_PAGE_SIZE,
      };
      usersService.findAll.mockResolvedValue(result);

      await expect(controller.findAll({ page: 1 })).resolves.toEqual(result);
      expect(usersService.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('importCsv', () => {

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

  it('throws FILE_MISSING when no file is uploaded', async () => {
    await expect(
      controller.importCsv(undefined as unknown as Express.Multer.File),
    ).rejects.toBeInstanceOf(FileMissingError);

    await expect(
      controller.importCsv(undefined as unknown as Express.Multer.File),
    ).rejects.toMatchObject({ code: 'FILE_MISSING' });

    expect(csvImport.import).not.toHaveBeenCalled();
  });
  });
});
