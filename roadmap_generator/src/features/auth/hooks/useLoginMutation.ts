import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "../../../shared/types";
import {
  loginUser,
  type LoginPayload,
  type LoginResponse,
} from "../api/loginUser";

export function useLoginMutation() {
  return useMutation<LoginResponse, ApiError, LoginPayload>({
    mutationFn: loginUser,
  });
}
