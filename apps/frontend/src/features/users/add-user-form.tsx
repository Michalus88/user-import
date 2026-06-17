import { useState, type FormEvent } from 'react';
import { Mail, User, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="add-user-email">Email</Label>
        <div className="relative h-[3.75rem]">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
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
              placeholder="jan.kowalski@example.com"
              className="pl-9"
              autoComplete="off"
              aria-describedby={emailError ? 'add-user-email-error' : undefined}
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
      <div className="space-y-1.5">
        <Label htmlFor="add-user-username">Username</Label>
        <div className="relative h-[3.75rem]">
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
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
              placeholder="jan.kowalski"
              className="pl-9"
              autoComplete="off"
              aria-describedby={
                usernameError ? 'add-user-username-error' : undefined
              }
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
      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending}
      >
        <UserPlus className="h-4 w-4" />
        Add User
      </Button>
    </form>
  );
}
