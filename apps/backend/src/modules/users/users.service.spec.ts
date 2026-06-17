import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UserAlreadyExistsError } from './users.errors';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const mockRepo = (): jest.Mocked<UsersRepository> =>
  ({
    create: jest.fn(),
    findAll: jest.fn(),
  }) as unknown as jest.Mocked<UsersRepository>;

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    repo = mockRepo();
    service = new UsersService(repo);
  });

  describe('create', () => {
    const dto: CreateUserDto = { username: 'alice', email: 'alice@example.com' };

    it('returns the created user on success', async () => {
      const user = mockUser();
      repo.create.mockResolvedValue(user);

      const result = await service.create(dto);

      expect(result).toBe(user);
      expect(repo.create).toHaveBeenCalledWith(dto);
    });

    it('throws UserAlreadyExistsError on P2002', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '0',
      });
      repo.create.mockRejectedValue(p2002);

      await expect(service.create(dto)).rejects.toThrow(UserAlreadyExistsError);
    });

    it('re-throws unexpected errors', async () => {
      const unexpected = new Error('DB down');
      repo.create.mockRejectedValue(unexpected);

      await expect(service.create(dto)).rejects.toThrow('DB down');
    });
  });

  describe('findAll', () => {
    it('returns first page with correct metadata using default page', async () => {
      const users = [mockUser()];
      repo.findAll.mockResolvedValue({ users, total: 1 });

      const result = await service.findAll(1);

      expect(result).toEqual({ users, total: 1, page: 1, pageSize: 50 });
      expect(repo.findAll).toHaveBeenCalledWith(0, 50);
    });

    it('calculates correct skip for non-default page', async () => {
      const users = [mockUser({ id: 51 })];
      repo.findAll.mockResolvedValue({ users, total: 60 });

      const result = await service.findAll(2);

      expect(result).toEqual({ users, total: 60, page: 2, pageSize: 50 });
      expect(repo.findAll).toHaveBeenCalledWith(50, 50);
    });

    it('returns empty users array when page exceeds total', async () => {
      repo.findAll.mockResolvedValue({ users: [], total: 10 });

      const result = await service.findAll(5);

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(10);
      expect(result.page).toBe(5);
    });
  });
});
