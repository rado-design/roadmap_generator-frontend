import { apiClient } from "../../../shared/lib/axios";

/** Payload envoyé à POST /auth/login */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Réponse de POST /auth/login */
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "api/v1/auth/login",
    payload,
  );
  return data;
}
