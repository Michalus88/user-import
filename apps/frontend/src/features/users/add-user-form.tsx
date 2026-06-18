import { useState, type FormEvent } from 'react';
import { Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { USERNAME_REGEX } from '@shared/constants';
import { useCreateUser } from './use-users';
import { EMAIL_REGEX } from './utils';

const USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';

interface AddUserFormProps {
  onCreated: () => void;
}

function validateUsername(value: string): string | null {
  if (value.trim().length === 0) return null;
  if (value.trim().length < 3) return 'Username must be at least 3 characters';
  if (!USERNAME_REGEX.test(value.trim()))
    return 'Username may only contain letters, digits and spaces';
  return null;
}

function validateEmail(value: string): string | null {
  if (value.trim().length === 0) return null;
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
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
    trimmedUsername.length >= 3 && EMAIL_REGEX.test(trimmedEmail);

  const mutation = useCreateUser({
    onSuccess: (user) => {
      toast.success(`User "${user.username}" added successfully`);
      setEmail('');
      setUsername('');
      setUsernameError(null);
      setEmailError(null);
      onCreated();
    },
    onError: (error) => {
      if (error.code === USER_ALREADY_EXISTS) {
        toast.error(`Email ${trimmedEmail} already exists`);
        return;
      }
      if (error.status === 400) {
        toast.error(error.message || 'Validation error');
        return;
      }
      toast.error('Something went wrong');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uErr = validateUsername(trimmedUsername.length === 0 ? ' ' : username);
    const eErr = validateEmail(trimmedEmail.length === 0 ? ' ' : email);
    setUsernameError(
      trimmedUsername.length === 0 ? 'Username is required' : uErr,
    );
    setEmailError(trimmedEmail.length === 0 ? 'Email is required' : eErr);
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
          Email address *
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
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(validateEmail(e.target.value));
              }}
              onBlur={() => {
                if (trimmedEmail.length === 0) {
                  setEmailError('Email is required');
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
          Full name *
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
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(validateUsername(e.target.value));
              }}
              onBlur={() => {
                if (trimmedUsername.length === 0) {
                  setUsernameError('Username is required');
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
        Add User
      </button>
    </form>
  );
}
