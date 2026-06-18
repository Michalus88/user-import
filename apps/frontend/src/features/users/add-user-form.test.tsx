import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddUserForm } from './add-user-form';
import * as useUsersModule from './use-users';

vi.mock('./use-users');
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockMutate = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof useUsersModule.useCreateUser>> = {}) {
  vi.mocked(useUsersModule.useCreateUser).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    ...overrides,
  } as ReturnType<typeof useUsersModule.useCreateUser>);
}

describe('AddUserForm', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockHook();
  });

  it('shows required errors when submitting empty form', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /dodaj użytkownika/i }));
    expect(screen.getByText('Nazwa jest wymagana')).toBeInTheDocument();
    expect(screen.getByText('E-mail jest wymagany')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows error for username shorter than 3 characters', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/nazwa użytkownika/i), 'ab');
    expect(
      screen.getByText('Nazwa musi mieć co najmniej 3 znaki'),
    ).toBeInTheDocument();
  });

  it('shows error for username with disallowed characters', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/nazwa użytkownika/i), '???');
    expect(
      screen.getByText('Nazwa może zawierać tylko litery, cyfry i spacje'),
    ).toBeInTheDocument();
  });

  it('shows error for malformed email', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), 'not-an-email');
    expect(screen.getByText('Podaj poprawny adres e-mail')).toBeInTheDocument();
  });

  it('accepts a username with Polish diacritics and digits', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/nazwa użytkownika/i), 'Łukasz 99');
    expect(
      screen.queryByText('Nazwa może zawierać tylko litery, cyfry i spacje'),
    ).not.toBeInTheDocument();
  });

  it('does not call mutate when form is invalid on submit', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/nazwa użytkownika/i), 'ab');
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), 'jan@example.com');
    await userEvent.click(screen.getByRole('button', { name: /dodaj użytkownika/i }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls mutate with trimmed values on valid submit', async () => {
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/nazwa użytkownika/i), '  Jan Kowalski  ');
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), '  jan@example.com  ');
    await userEvent.click(screen.getByRole('button', { name: /dodaj użytkownika/i }));
    expect(mockMutate).toHaveBeenCalledWith({
      username: 'Jan Kowalski',
      email: 'jan@example.com',
    });
  });

  it('does not call mutate while mutation is pending', async () => {
    mockHook({ isPending: true });
    render(<AddUserForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/nazwa użytkownika/i), 'Jan');
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), 'jan@example.com');
    await userEvent.click(screen.getByRole('button', { name: /dodaj użytkownika/i }));
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
