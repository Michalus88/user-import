import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';

export interface NewUser {
  username: string;
  email: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: { username: string; email: string }): Promise<User> {
    return this.db.user.create({ data });
  }

  async findAll(
    skip: number,
    take: number,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.db.$transaction([
      this.db.user.findMany({ skip, take, orderBy: { id: 'desc' } }),
      this.db.user.count(),
    ]);
    return { users, total };
  }

  async findEmailsIn(emails: string[]): Promise<string[]> {
    const users = await this.db.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    return users.map((u) => u.email);
  }

  async createMany(rows: NewUser[]): Promise<number> {
    const result = await this.db.user.createMany({ data: rows });
    return result.count;
  }
}
