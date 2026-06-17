import { validate } from 'class-validator';
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

  it('fails when username is missing', async () => {
    const dto = validDto();
    dto.username = '';
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
});
