import { api } from "../lib/api";
import type { LoginRequest } from "../types/auth";

interface LoginResponse {
  accessToken: string;
}

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/login", request);

    localStorage.setItem("access_token", data.accessToken);

    return data;
  },
};