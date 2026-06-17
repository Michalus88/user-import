import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UnprocessableEntityException,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { ImportResult } from '@shared/types';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { CsvImportService } from './csv-import.service';
import { MulterExceptionFilter } from './csv-upload.filter';
import { UserListResult, UsersService } from './users.service';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly csvImportService: CsvImportService,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListUsersDto): Promise<UserListResult> {
    return this.usersService.findAll(query.page);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException({
        code: 'FILE_MISSING',
        message: 'No CSV file uploaded',
      });
    }

    const result = await this.csvImportService.import(file.buffer);

    if (result.inserted === 0) {
      throw new UnprocessableEntityException(result);
    }

    return result;
  }
}
