// Auth utilities for token management and login

export const BASE_URL = 'https://ramik-backend.onrender.com';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const USER_KEY = 'auth_user';

// Types
export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  status: string;
  token: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      phoneNumber: string | null;
      address: string | null;
      role: "admin" | "user";
      emailVerified: boolean;
      region: {
        id: number;
        name: string;
      };
    };
    cartCount: number;
  };
};

export type User = LoginResponse['data']['user'];

// Login function
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  const data: LoginResponse = await res.json();
  
  // Store token and user data
  if (typeof window !== 'undefined') {
    // Calculate expiry time (1 day from now)
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  }
  
  return data;
}

// Get stored token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check if token is expired
  if (isTokenExpired()) {
    clearAuth();
    return null;
  }
  
  return localStorage.getItem(TOKEN_KEY);
}

// Check if token is expired
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;
  
  return Date.now() >= parseInt(expiryTime, 10);
}

// Get stored user
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

// Clear auth data
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = getToken();
  return token !== null && !isTokenExpired();
}

// Logout function
export function logout(): void {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
