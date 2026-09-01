export type ID = string;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
