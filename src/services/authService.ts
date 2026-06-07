import type {
  AuthenticationRequest,
  RegisterRequest,
  AuthenticationResponse,
} from '../models/types';
import api from './api';

/**
 * Standard Base64URL decoding for JWT tokens in browser environments.
 */
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT payload', e);
    return null;
  }
}

/**
 * POST /api/v1/auth/authenticate
 * Exchanges credentials for a JWT and extracts claims.
 */
export async function login(request: AuthenticationRequest): Promise<AuthenticationResponse & { user: { userId: number; name: string; email: string; role: string } }> {
  try {
    const response = await api.post<AuthenticationResponse>('/api/v1/auth/authenticate', request);
    const data = response.data;

    if (!data.token) {
      throw new Error('No token returned from server');
    }

    // Extract claims
    const claims = decodeJwt(data.token);
    if (!claims) {
      throw new Error('Failed to parse authentication token');
    }

    return {
      token: data.token,
      message: data.message || 'Login successful',
      user: {
        userId: claims.userId || 0,
        name: claims.name || 'User',
        email: claims.sub || request.email,
        role: claims.role || 'PATIENT',
      },
    };
  } catch (err: any) {
    let errorMessage = 'Invalid email or password';
    if (err.response && err.response.data) {
      errorMessage = err.response.data.message || err.response.data.error || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }
    throw new Error(errorMessage);
  }
}

/**
 * POST /api/v1/auth/register
 * Sends registration request to the backend.
 */
export async function register(request: RegisterRequest): Promise<AuthenticationResponse> {
  try {
    const response = await api.post<AuthenticationResponse>('/api/v1/auth/register', request);
    return response.data;
  } catch (err: any) {
    let errorMessage = 'Registration failed';
    if (err.response && err.response.data) {
      errorMessage = err.response.data.message || err.response.data.error || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }
    throw new Error(errorMessage);
  }
}
