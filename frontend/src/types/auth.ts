export interface User {
  id: number;
  email: string;
  roles: string[];
  name?: string;
  wechatNickname?: string;
  phone?: string;
  avatar?: string;
  active?: boolean;
  allPermissions?: string[];
  highestRole?: string;
  highestRoleLevel?: number;
  createdAt?: string;
  updatedAt?: string;
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
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken?: string;
  };
}

export interface AuthConfig {
  tokenKey: string;
  userKey: string;
  refreshTokenKey?: string;
  loginPath: string;
  defaultRedirectPath: string;
}
