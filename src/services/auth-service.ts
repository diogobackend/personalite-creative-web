import { api } from "../lib/api";
import type { LoginRequest } from "../types/auth";

interface LoginResponse {
  accessToken: string;
}

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/login", request);

    console.log("Resposta real do login:", data);

    localStorage.setItem("access_token", data.accessToken);

    return data;
  },
};