import { api } from "../lib/api";
import type { LoginRequest } from "../types/auth";

export const authService = {
  async login(request: LoginRequest): Promise<unknown> {
    const { data } = await api.post("/login", request);
    return data;
  },
};