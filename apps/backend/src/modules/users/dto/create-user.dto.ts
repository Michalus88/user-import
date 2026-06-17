import { ICreateUserRequest } from '@shared/types';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { USERNAME_REGEX } from '@shared/constants';

export class CreateUserDto implements ICreateUserRequest {
  @IsString()
  @MinLength(3)
  @Matches(USERNAME_REGEX, {
    message: 'Username may only contain letters, digits and spaces',
  })
  username!: string;

  @IsEmail()
  email!: string;
}
