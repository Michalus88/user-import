export interface ICreateUserRequest {
  username: string;
  email: string;
}

export interface IUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}
