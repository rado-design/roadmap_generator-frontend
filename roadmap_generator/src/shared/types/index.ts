export type ID = string;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  generation_id?: string;
  retryable?: boolean;
}
