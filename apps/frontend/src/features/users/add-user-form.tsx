import { useState, type FormEvent } from 'react';
import { Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  EMAIL_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from '@shared/constants';
import { useCreateUser } from './use-users';
import { EMAIL_REGEX } from './utils';

const USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';

interface AddUserFormProps {
  onCreated: () => void;
}

function validateUsername(value: string): string | null {
  if (value.trim().length === 0) return null;
  if (value.trim().length < USERNAME_MIN_LENGTH) return 'Nazwa musi mieć co najmniej 3 znaki';
  if (value.trim().length > USERNAME_MAX_LENGTH) return `Nazwa może mieć maksymalnie ${USERNAME_MAX_LENGTH} znaków`;
  if (!USERNAME_REGEX.test(value.trim()))
    return 'Nazwa może zawierać tylko litery, cyfry i spacje';
  return null;
}

function validateEmail(value: string): string | null {
  if (value.trim().length === 0) return null;
  if (value.trim().length > EMAIL_MAX_LENGTH) return `E-mail może mieć maksymalnie ${EMAIL_MAX_LENGTH} znaków`;
  if (!EMAIL_REGEX.test(value.trim())) return 'Podaj poprawny adres e-mail';
  return null;
}

export function AddUserForm({ onCreated }: AddUserFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const isValid =
    trimmedUsername.length >= USERNAME_MIN_LENGTH &&
    trimmedUsername.length <= USERNAME_MAX_LENGTH &&
    trimmedEmail.length <= EMAIL_MAX_LENGTH &&
    EMAIL_REGEX.test(trimmedEmail);

  const mutation = useCreateUser({
    onSuccess: (user) => {
      toast.success(`Użytkownik "${user.username}" został dodany`);
      setEmail('');
      setUsername('');
      setUsernameError(null);
      setEmailError(null);
      onCreated();
    },
    onError: (error) => {
      if (error.code === USER_ALREADY_EXISTS) {
        toast.error(`E-mail ${trimmedEmail} już istnieje`);
        return;
      }
      if (error.status === 400) {
        toast.error(error.message || 'Błąd walidacji');
        return;
      }
      toast.error('Coś poszło nie tak');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uErr = validateUsername(trimmedUsername.length === 0 ? ' ' : username);
    const eErr = validateEmail(trimmedEmail.length === 0 ? ' ' : email);
    setUsernameError(
      trimmedUsername.length === 0 ? 'Nazwa jest wymagana' : uErr,
    );
    setEmailError(trimmedEmail.length === 0 ? 'E-mail jest wymagany' : eErr);
    if (!isValid || mutation.isPending) return;
    mutation.mutate({ username: trimmedUsername, email: trimmedEmail });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="add-user-email"
          className="text-[10px] font-bold uppercase tracking-[0.07em] text-subtle"
        >
          Adres e-mail *
        </label>
        <div className="relative h-[3.75rem]">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <input
              id="add-user-email"
              type="email"
              value={email}
              maxLength={EMAIL_MAX_LENGTH}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(validateEmail(e.target.value));
              }}
              onBlur={() => {
                if (trimmedEmail.length === 0) {
                  setEmailError('E-mail jest wymagany');
                } else {
                  setEmailError(validateEmail(email));
                }
              }}
              placeholder="jan@example.com"
              autoComplete="off"
              aria-describedby={emailError ? 'add-user-email-error' : undefined}
              className="w-full rounded-[10px] border border-border bg-background py-2.5 pl-[33px] pr-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            />
          </div>
          <p
            id="add-user-email-error"
            className="absolute bottom-0 left-0 text-xs text-red-500"
          >
            {emailError}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="add-user-username"
          className="text-[10px] font-bold uppercase tracking-[0.07em] text-subtle"
        >
          Nazwa użytkownika *
        </label>
        <div className="relative h-[3.75rem]">
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <input
              id="add-user-username"
              type="text"
              value={username}
              maxLength={USERNAME_MAX_LENGTH}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(validateUsername(e.target.value));
              }}
              onBlur={() => {
                if (trimmedUsername.length === 0) {
                  setUsernameError('Nazwa jest wymagana');
                } else {
                  setUsernameError(validateUsername(username));
                }
              }}
              placeholder="Jan Kowalski"
              autoComplete="off"
              aria-describedby={
                usernameError ? 'add-user-username-error' : undefined
              }
              className="w-full rounded-[10px] border border-border bg-background py-2.5 pl-[33px] pr-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            />
          </div>
          <p
            id="add-user-username-error"
            className="absolute bottom-0 left-0 text-xs text-red-500"
          >
            {usernameError}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-[11px] font-syne text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-base leading-none">+</span>
        Dodaj użytkownika
      </button>
    </form>
  );
}
