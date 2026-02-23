export interface IUser {
  name: string;
  email: string;
  password: string;
  comparePassword(password: string): Promise<boolean>;
}
