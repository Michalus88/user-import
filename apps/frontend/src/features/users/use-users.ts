import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  ICreateUserRequest,
  IUser,
  IUserListResponse,
} from '@shared/types';
import { ApiError } from '@/lib/api-client';
import { createUser, fetchUsers } from './api';

export const USERS_QUERY_KEY = 'users';

export function useUsers(page: number) {
  return useQuery<IUserListResponse, ApiError>({
    queryKey: [USERS_QUERY_KEY, { page }],
    queryFn: ({ signal }) => fetchUsers(page, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUser(options?: {
  onSuccess?: (user: IUser) => void;
  onError?: (error: ApiError) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<IUser, ApiError, ICreateUserRequest>({
    mutationFn: createUser,
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      options?.onSuccess?.(user);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
