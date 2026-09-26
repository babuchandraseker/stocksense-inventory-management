import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LoginCredentials } from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  sendSmsOtp: (phone: string) => Promise<{ success: boolean; message: string; isDevMode?: boolean; devCode?: string }>;
  verifySmsOtp: (phone: string, token: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'stocksense_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res && res.user) {
        setUser(res.user);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const sendSmsOtp = async (phone: string) => {
    return await authApi.sendOtp(phone);
  };

  const verifySmsOtp = async (phone: string, token: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, token);
      if (res && res.user) {
        setUser(res.user);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('stocksense_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        sendSmsOtp,
        verifySmsOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
