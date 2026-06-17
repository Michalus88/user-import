import { ICreateUserRequest } from '@shared/types';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto implements ICreateUserRequest {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;
}
