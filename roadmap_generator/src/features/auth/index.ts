export { AuthLayout } from "./components/AuthLayout";
export { AuthBrandHeader } from "./components/AuthBrandHeader";
export { AuthCard } from "./components/AuthCard";
export { SocialAuthButtons } from "./components/SocialAuthButtons";
export { RegisterForm } from "./components/RegisterForm";

export { SecurityTrustBanner } from "./components/SecurityTrustBanner";
export { OtpShieldBadge, maskEmail } from "./components/OtpShieldBadge";
export { OtpInputGroup } from "./components/OtpInputGroup";
export { OtpCountdownTimer } from "./components/OtpCountdownTimer";
export { OtpForm } from "./components/OtpForm";
export { SecurityTrustFootnote } from "./components/SecurityTrustFootnote";
export { SecuritySupportLink } from "./components/SecuritySupportLink";

export { registerUser, verifyOtp, resendOtp } from "./api";
export type {
  RegisterPayload,
  RegisterResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  ResendOtpPayload,
  ResendOtpResponse,
} from "./api";

export {
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "./hooks";

export { registerSchema } from "./schemas/registerSchema";
export type { RegisterFormValues } from "./schemas/registerSchema";
export { otpSchema } from "./schemas/otpSchema";
export type { OtpFormValues } from "./schemas/otpSchema";

