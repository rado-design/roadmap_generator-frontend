import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "../../../shared/types";
import {
  registerUser,
  type RegisterPayload,
  type RegisterResponse,
} from "../api/registerUser";

export function useRegisterMutation() {
  return useMutation<RegisterResponse, ApiError, RegisterPayload>({
    mutationFn: registerUser,
  });
}
