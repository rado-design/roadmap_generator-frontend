import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "../../../shared/types";
import {
  resendOtp,
  type ResendOtpPayload,
  type ResendOtpResponse,
} from "../api/resendOtp";

export function useResendOtpMutation() {
  return useMutation<ResendOtpResponse, ApiError, ResendOtpPayload>({
    mutationFn: resendOtp,
  });
}
