// Centralized API client that automatically adds authentication token

import { BASE_URL, getToken, isTokenExpired, logout } from './auth';

type RequestOptions = RequestInit & {
  skipAuth?: boolean; // For endpoints that don't require auth
};

// Custom fetch wrapper that adds token and handles errors
export async function apiClient(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;
  
  // Check token expiry before making request
  if (!skipAuth && isTokenExpired()) {
    logout();
    throw new Error('Token expired. Please login again.');
  }
  
  // Get token if auth is required
  const token = skipAuth ? null : getToken();
  
  // Build headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add authorization header if token exists
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: requestHeaders,
  });
  
  // Handle 401 Unauthorized - token might be invalid
  if (response.status === 401 && !skipAuth) {
    logout();
    throw new Error('Unauthorized. Please login again.');
  }
  
  return response;
}

// Helper function to parse JSON response
export async function apiClientJson<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await apiClient(endpoint, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}
