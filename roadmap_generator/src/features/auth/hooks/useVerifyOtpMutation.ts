import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "../../../shared/types";
import {
  verifyOtp,
  type VerifyOtpPayload,
  type VerifyOtpResponse,
} from "../api/verifyOtp";

export function useVerifyOtpMutation() {
  return useMutation<VerifyOtpResponse, ApiError, VerifyOtpPayload>({
    mutationFn: verifyOtp,
  });
}
