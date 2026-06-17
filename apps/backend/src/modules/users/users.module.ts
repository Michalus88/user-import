import { Module } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, CsvImportService, UsersRepository],
})
export class UsersModule {}
