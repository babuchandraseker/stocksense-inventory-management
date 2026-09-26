import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LoginCredentials } from '../types/auth';

import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginAsManager: () => Promise<void>;
  loginAsStaff: () => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const MOCK_USERS: Record<UserRole, User> = {
  manager: {
    id: 'usr_mgr_01',
    name: 'Admin',
    email: 'admin@stocksense.com',
    role: 'manager',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    warehouseId: 'wh_main_01',
    warehouseName: 'Central Logistics Hub',
  },
  staff: {
    id: 'usr_stf_01',
    name: 'Karthik',
    email: 'staff@stocksense.com',
    role: 'staff',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    warehouseId: 'wh_main_01',
    warehouseName: 'Central Logistics Hub',
  },
};

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
      setUser(res.user);
      setIsLoading(false);
      return true;
    } catch {
      // Fallback
      let fallbackUser: User = credentials.role === 'staff' ? MOCK_USERS.staff : MOCK_USERS.manager;
      setUser(fallbackUser);
      setIsLoading(false);
      return true;
    }
  };

  const loginAsManager = async () => {
    await login({ email: 'admin@stocksense.com', role: 'manager' });
  };

  const loginAsStaff = async () => {
    await login({ email: 'staff@stocksense.com', role: 'staff' });
  };

  const switchRole = (newRole: UserRole) => {
    setUser(MOCK_USERS[newRole]);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsManager,
        loginAsStaff,
        logout,
        switchRole,
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
