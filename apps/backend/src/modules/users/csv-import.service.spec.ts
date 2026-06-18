import { IMPORT_ERROR_CODES } from '@shared/constants';
import { CsvImportService } from './csv-import.service';
import {
  MalformedCsvError,
  RowCountExceededError,
} from './csv-import.errors';
import { UsersRepository } from './users.repository';

const csv = (content: string): Buffer => Buffer.from(content, 'utf-8');

const mockRepo = (): jest.Mocked<
  Pick<UsersRepository, 'findEmailsIn' | 'createMany'>
> => ({
  findEmailsIn: jest.fn(),
  createMany: jest.fn(),
});

describe('CsvImportService', () => {
  let service: CsvImportService;
  let repo: jest.Mocked<Pick<UsersRepository, 'findEmailsIn' | 'createMany'>>;

  beforeEach(() => {
    repo = mockRepo();
    service = new CsvImportService(repo as unknown as UsersRepository);
  });

  describe('full success', () => {
    it('inserts all valid rows when no DB duplicates exist', async () => {
      repo.findEmailsIn.mockResolvedValue([]);
      repo.createMany.mockResolvedValue(2);

      const result = await service.import(
        csv('username,email\nalice,alice@example.com\nbob,bob@example.com'),
      );

      expect(result).toEqual({ inserted: 2, skipped: 0, total: 2, errors: [] });
      expect(repo.createMany).toHaveBeenCalledWith([
        { username: 'alice', email: 'alice@example.com' },
        { username: 'bob', email: 'bob@example.com' },
      ]);
    });
  });

  describe('partial success', () => {
    it('skips DB-duplicate rows and inserts eligible ones', async () => {
      repo.findEmailsIn.mockResolvedValue(['alice@example.com']);
      repo.createMany.mockResolvedValue(1);

      const result = await service.import(
        csv('username,email\nalice,alice@example.com\nbob,bob@example.com'),
      );

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'email',
        code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB,
      });
    });

    it('aggregates in-file and DB duplicate counts in skipped', async () => {
      repo.findEmailsIn.mockResolvedValue(['bob@example.com']);
      repo.createMany.mockResolvedValue(1);

      const result = await service.import(
        csv(
          [
            'username,email',
            'alice,alice@example.com',
            'alice2,alice@example.com',
            'bob,bob@example.com',
          ].join('\n'),
        ),
      );

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(2);
      expect(result.total).toBe(3);
    });

    it('includes both validation errors and DB duplicate errors in errors array', async () => {
      repo.findEmailsIn.mockResolvedValue(['bob@example.com']);
      repo.createMany.mockResolvedValue(1);

      const result = await service.import(
        csv(
          [
            'username,email',
            'alice,alice@example.com',
            ',bad-email',
            'bob,bob@example.com',
          ].join('\n'),
        ),
      );

      expect(result.errors).toHaveLength(3);
    });
  });

  describe('zero inserts', () => {
    it('returns inserted=0 when all rows are DB duplicates', async () => {
      repo.findEmailsIn.mockResolvedValue(['alice@example.com']);
      repo.createMany.mockResolvedValue(0);

      const result = await service.import(
        csv('username,email\nalice,alice@example.com'),
      );

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1);
      expect(repo.createMany).not.toHaveBeenCalled();
    });

    it('returns inserted=0 when all rows fail validation', async () => {
      repo.findEmailsIn.mockResolvedValue([]);

      const result = await service.import(csv('username,email\n,bad-email'));

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(repo.createMany).not.toHaveBeenCalled();
    });

    it('returns inserted=0 for header-only CSV', async () => {
      repo.findEmailsIn.mockResolvedValue([]);

      const result = await service.import(csv('username,email'));

      expect(result).toEqual({ inserted: 0, skipped: 0, total: 0, errors: [] });
      expect(repo.createMany).not.toHaveBeenCalled();
    });
  });

  describe('error propagation', () => {
    it('propagates MalformedCsvError from parser', async () => {
      await expect(
        service.import(csv('email\nalice@example.com')),
      ).rejects.toThrow(MalformedCsvError);
    });

    it('propagates RowCountExceededError from parser', async () => {
      const rows = Array.from(
        { length: 10_001 },
        (_, i) => `u${i},u${i}@example.com`,
      );
      const content = ['username,email', ...rows].join('\n');
      await expect(service.import(csv(content))).rejects.toThrow(
        RowCountExceededError,
      );
    });
  });

  describe('no DB call for empty valid rows', () => {
    it('does not call findEmailsIn when parser returns no valid rows', async () => {
      const result = await service.import(csv('username,email\n,bad-email'));

      expect(repo.findEmailsIn).not.toHaveBeenCalled();
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('race condition (concurrent insert between preflight and createMany)', () => {
    it('does not re-query when createMany inserts every eligible row', async () => {
      repo.findEmailsIn.mockResolvedValue([]);
      repo.createMany.mockResolvedValue(2);

      await service.import(
        csv('username,email\nalice,alice@example.com\nbob,bob@example.com'),
      );

      expect(repo.findEmailsIn).toHaveBeenCalledTimes(1);
    });

    it('reports race losers as EMAIL_DUPLICATE_IN_DB on their original rows', async () => {
      repo.findEmailsIn
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(['bob@example.com']);
      repo.createMany.mockResolvedValue(1);

      const result = await service.import(
        csv('username,email\nalice,alice@example.com\nbob,bob@example.com'),
      );

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 3,
        field: 'email',
        code: IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB,
      });
      expect(repo.findEmailsIn).toHaveBeenCalledTimes(2);
    });

    it('reports every row as race loser when no inserts succeed under contention', async () => {
      repo.findEmailsIn
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(['alice@example.com', 'bob@example.com']);
      repo.createMany.mockResolvedValue(0);

      const result = await service.import(
        csv('username,email\nalice,alice@example.com\nbob,bob@example.com'),
      );

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((e) => e.code)).toEqual([
        IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB,
        IMPORT_ERROR_CODES.EMAIL_DUPLICATE_IN_DB,
      ]);
    });
  });
});
