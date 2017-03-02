export interface AuthResponse {
  access_token: string;
  scope: string;
  id_token: string;
  state: string;
  token_type: string;
  expires_in: string;
  issued_at: number;
  error_description: string;
  error: string;
}
