import { api } from "../lib/api";
import type { RegisterUserRequest } from "../types/user";

export const userService = {
  async register(request: RegisterUserRequest): Promise<void> {
    await api.post("/users", request);
  },
};