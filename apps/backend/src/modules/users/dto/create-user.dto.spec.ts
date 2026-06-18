import { validate } from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@shared/constants';
import { CreateUserDto } from './create-user.dto';

const validDto = (): CreateUserDto =>
  Object.assign(new CreateUserDto(), {
    username: 'alice',
    email: 'alice@example.com',
  });

describe('CreateUserDto', () => {
  it('passes validation for valid input', async () => {
    const errors = await validate(validDto());
    expect(errors).toHaveLength(0);
  });

  it('fails when username is empty', async () => {
    const dto = validDto();
    dto.username = '';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  it('fails when username is shorter than minimum length', async () => {
    const dto = validDto();
    dto.username = 'ab'.slice(0, USERNAME_MIN_LENGTH - 1);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  it('fails when username exceeds maximum length', async () => {
    const dto = validDto();
    dto.username = 'a'.repeat(USERNAME_MAX_LENGTH + 1);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  it('fails when username contains disallowed characters', async () => {
    const dto = validDto();
    dto.username = 'alice@#!';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  it('fails when email is not a valid email', async () => {
    const dto = validDto();
    dto.email = 'not-an-email';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('fails when email is missing', async () => {
    const dto = Object.assign(new CreateUserDto(), { username: 'alice' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('fails when email exceeds maximum length', async () => {
    const dto = validDto();
    dto.email = 'a'.repeat(EMAIL_MAX_LENGTH - 9) + '@test.com';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});
