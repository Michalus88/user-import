import type {
  ICreateUserRequest,
  IUser,
  IUserListResponse,
} from '@shared/types';
import { apiFetch } from '@/lib/api-client';

export function fetchUsers(
  page: number,
  signal?: AbortSignal,
): Promise<IUserListResponse> {
  const params = new URLSearchParams({ page: String(page) });
  return apiFetch<IUserListResponse>(`/users?${params.toString()}`, { signal });
}

export function createUser(body: ICreateUserRequest): Promise<IUser> {
  return apiFetch<IUser>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
