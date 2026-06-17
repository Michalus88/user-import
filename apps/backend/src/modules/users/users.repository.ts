import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: { username: string; email: string }): Promise<User> {
    return this.db.user.create({ data });
  }

  async findAll(skip: number, take: number): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.db.$transaction([
      this.db.user.findMany({ skip, take, orderBy: { id: 'asc' } }),
      this.db.user.count(),
    ]);
    return { users, total };
  }
}
