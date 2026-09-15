import { apiClient } from "../../../shared/lib/axios";

export interface ResendOtpPayload {
  email: string;
}

export interface ResendOtpResponse {
  message: string;
}

export async function resendOtp(
  payload: ResendOtpPayload,
): Promise<ResendOtpResponse> {
  const { data } = await apiClient.post<ResendOtpResponse>(
    "api/v1/auth/resend-otp",
    payload,
  );
  return data;
}
