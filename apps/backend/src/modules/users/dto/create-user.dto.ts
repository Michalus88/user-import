import { ICreateUserRequest } from '@shared/types';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from '@shared/constants';

export class CreateUserDto implements ICreateUserRequest {
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  @Matches(USERNAME_REGEX, {
    message: 'Username may only contain letters, digits and spaces',
  })
  username!: string;

  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;
}
