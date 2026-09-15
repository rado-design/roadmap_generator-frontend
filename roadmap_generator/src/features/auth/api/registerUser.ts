import { apiClient } from "../../../shared/lib/axios";

/** Payload envoyé à POST /auth/register (voir app/schemas/user.py::UserRegister) */
export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  first_name?: string;
}

/** Réponse de POST /auth/register (voir app/schemas/user.py::RegisterResponse) */
export interface RegisterResponse {
  message: string;
  email: string;
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    "api/v1/auth/register",
    payload,
  );
  return data;
}
