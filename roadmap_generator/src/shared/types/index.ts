export type ID = string;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  generation_id?: string;
  limit?: number;
  used?: number;
  resets_at?: string | null;
  retry_after_seconds?: number;
  retryable?: boolean;
}
