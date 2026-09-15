import { apiClient } from "../../../shared/lib/axios";

export interface VerifyOtpPayload {
  email: string;
  otp_code: string;
}

export interface VerifyOtpResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export async function verifyOtp(
  payload: VerifyOtpPayload,
): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>(
    "api/v1/auth/verify-otp",
    payload,
  );
  return data;
}
