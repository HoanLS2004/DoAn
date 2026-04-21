export interface User {
  userID: number;
  fullName: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  role: string;
  createdAt: string;
}
export interface UserCreateDTO {
  fullName: string;
  email: string;
  password?: string
  phone?: string;
  role: string;
}


export interface UserUpdateDTO {
  fullName: string;
  email: string;
  password?: string
  phone?: string;
  role: string;
}
