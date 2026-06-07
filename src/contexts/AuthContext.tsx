import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, UserRole, PatientResponseDto } from '../models/types';
import { getMyProfile } from '../services/patientService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  patientProfile: PatientResponseDto | null;
  hasPatientProfile: boolean | null; // null: loading, true: exists, false: missing
  loginUser: (user: AuthUser) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  refreshPatientProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'clinic_flow_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientResponseDto | null>(null);
  const [hasPatientProfile, setHasPatientProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientProfile = async (currentUser: AuthUser | null) => {
    if (!currentUser || currentUser.role !== 'PATIENT') {
      setPatientProfile(null);
      setHasPatientProfile(null);
      return;
    }
    try {
      const profile = await getMyProfile();
      if (profile) {
        setPatientProfile(profile);
        setHasPatientProfile(true);
      } else {
        setPatientProfile(null);
        setHasPatientProfile(false);
      }
    } catch (err) {
      console.error('Failed to load patient profile in AuthContext', err);
      setPatientProfile(null);
      setHasPatientProfile(false);
    }
  };

  useEffect(() => {
    // Restore session from localStorage
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
          await fetchPatientProfile(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const loginUser = async (authUser: AuthUser) => {
    setIsLoading(true);
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    await fetchPatientProfile(authUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setPatientProfile(null);
    setHasPatientProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const refreshPatientProfile = async () => {
    await fetchPatientProfile(user);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        patientProfile, 
        hasPatientProfile, 
        loginUser, 
        logout, 
        hasRole,
        refreshPatientProfile 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

