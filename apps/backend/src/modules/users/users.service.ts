import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UserAlreadyExistsError } from './users.errors';
import { UsersRepository } from './users.repository';

const PAGE_SIZE = 50;

export interface UserListResult {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.usersRepository.create(dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UserAlreadyExistsError(dto.email);
      }
      throw error;
    }
  }

  async findAll(page: number): Promise<UserListResult> {
    const skip = (page - 1) * PAGE_SIZE;
    const { users, total } = await this.usersRepository.findAll(
      skip,
      PAGE_SIZE,
    );
    return { users, total, page, pageSize: PAGE_SIZE };
  }
}
