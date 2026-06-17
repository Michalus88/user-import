import { ICreateUserRequest } from '@shared/types';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements ICreateUserRequest {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsEmail()
  email!: string;
}
