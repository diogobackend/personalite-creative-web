export interface RegisterUserRequest {
  name: string;
  email: string;
  login: string;
  password: string;
  phone: string | null;
  address: string | null;
  cpf: string | null;
  rg: string | null;
  birthDate: string | null;
}