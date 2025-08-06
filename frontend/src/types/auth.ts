export interface User {
  id: number;
  email: string;
  roles: string[];
  name?: string;
  avatar?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  captcha?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthConfig {
  tokenKey: string;
  userKey: string;
  refreshTokenKey?: string;
  loginPath: string;
  defaultRedirectPath: string;
}
