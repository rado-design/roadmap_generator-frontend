import { apiClient } from "../../../shared/lib/axios";

export interface CurrentUser {
  id: number;
  email: string;
  first_name: string | null;
  name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserProfileUpdate {
  first_name: string | null;
  name: string | null;
}

export type LearnerLanguage = "fr" | "en";
export type LearningStyle = "visual" | "reading" | "hands_on" | "audio_video" | "mixed";
export type LearningSpeed = "slow" | "normal" | "fast";
export type ExplanationTone = "encouraging" | "neutral" | "direct";
export type SessionLength = "short" | "medium" | "long";

export interface LearnerProfile {
  language: LearnerLanguage;
  learning_style: LearningStyle;
  learning_speed: LearningSpeed;
  tone: ExplanationTone;
  session_length: SessionLength | null;
  default_weekly_hours: number | null;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export async function getCurrentUser() {
  const response = await apiClient.get<CurrentUser>("api/v1/users/me");
  return response.data;
}

export async function updateCurrentUser(payload: UserProfileUpdate) {
  const response = await apiClient.patch<CurrentUser>("api/v1/users/me", payload);
  return response.data;
}

export async function getLearnerProfile() {
  const response = await apiClient.get<LearnerProfile>("api/v1/users/me/learner-profile");
  return response.data;
}

export async function updateLearnerProfile(payload: LearnerProfile) {
  const response = await apiClient.put<LearnerProfile>("api/v1/users/me/learner-profile", payload);
  return response.data;
}

export async function changePassword(payload: PasswordChange) {
  await apiClient.put("api/v1/users/me/password", payload);
}
