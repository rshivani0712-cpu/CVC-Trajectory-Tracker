import { UserProfile, UserRole } from '../types';
import { apiRequest } from './client';

export const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  trainee: {
    id: 'usr_trainee_01',
    name: 'Dr. M. Alexeev',
    role: 'trainee',
    title: 'Trainee • PGY-2',
    department: 'General Surgery & Critical Care',
    avatar: 'MA',
    sessionCount: 14,
    averageScore: 88,
  },
  instructor: {
    id: 'usr_instructor_01',
    name: 'Prof. S. Vance, MD, FACS',
    role: 'instructor',
    title: 'Instructor / Clinical Faculty',
    department: 'Surgical & Interventional Simulation Lab',
    avatar: 'SV',
    sessionCount: 142,
    averageScore: 84.6,
  },
  admin: {
    id: 'usr_admin_01',
    name: 'SysAdmin #BAY-02',
    role: 'admin',
    title: 'Biomedical Engineering & Hardware Ops',
    department: 'Simulation Infrastructure',
    avatar: 'BA',
  },
};

export interface AuthCredentials {
  username?: string;
  password?: string;
  role: UserRole;
  operatorId?: string;
  pin?: string;
}

// Canonical demo credentials as requested
export const DEMO_CREDENTIALS: Record<UserRole, { username: string; password: string; hint: string }> = {
  trainee: {
    username: 'trainee',
    password: 'trainee123',
    hint: 'Username: trainee | Password: trainee123',
  },
  instructor: {
    username: 'instructor',
    password: 'instructor123',
    hint: 'Username: instructor | Password: instructor123',
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    hint: 'Username: admin | Password: admin123',
  },
};

export async function loginUser(credentials: AuthCredentials): Promise<{ user: UserProfile; token: string }> {
  const { username = '', password = '', role } = credentials;
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Try external API if configured
  try {
    return await apiRequest<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch {
    // Simulate brief realistic verification delay
    await new Promise((resolve) => setTimeout(resolve, 450));

    // Role-specific credential validation
    let isValid = false;

    if (role === 'trainee') {
      isValid = (cleanUsername === 'trainee' || cleanUsername === 'trainee@surgicalsim.edu' || cleanUsername === 'alexeev' || cleanUsername === 'alexeev@surgicalsim.edu') &&
                (cleanPassword === 'trainee123' || cleanPassword === 'password123');
    } else if (role === 'instructor') {
      isValid = (cleanUsername === 'instructor' || cleanUsername === 'instructor@surgicalsim.edu' || cleanUsername === 'vance' || cleanUsername === 'vance.facs@surgicalsim.edu') &&
                (cleanPassword === 'instructor123' || cleanPassword === 'password123');
    } else if (role === 'admin') {
      isValid = (cleanUsername === 'admin' || cleanUsername === 'admin@surgicalsim.edu' || cleanUsername === 'biomed.admin@surgicalsim.edu') &&
                (cleanPassword === 'admin123' || cleanPassword === 'password123');
    }

    if (!isValid) {
      // Strictly do not reveal whether username or password was incorrect
      throw new Error('Invalid credentials. Please check your username and password.');
    }

    const user = DEFAULT_USERS[role];
    const mockToken = `cvc_jwt_${role}_${Date.now()}`;
    localStorage.setItem('cvc_auth_token', mockToken);
    localStorage.setItem('cvc_current_user', JSON.stringify(user));
    return { user, token: mockToken };
  }
}

export function getAuthenticatedUser(): UserProfile | null {
  const stored = localStorage.getItem('cvc_current_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function getCurrentUser(): UserProfile | null {
  return getAuthenticatedUser();
}

export function setCurrentUser(user: UserProfile) {
  localStorage.setItem('cvc_current_user', JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem('cvc_auth_token');
  localStorage.removeItem('cvc_current_user');
}
