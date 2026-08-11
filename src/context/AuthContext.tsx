import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isPrincipal: boolean;
  isStaff: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerUser: (fullName: string, email: string, role: 'principal' | 'staff', password?: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string; email?: string; password?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const current = db.getCurrentUser();
      if (current) {
        const users = await db.getUsers();
        const updated = users.find(u => u.id === current.id);
        if (updated) {
          if (updated.status === 'inactive') {
            db.logout();
            setUser(null);
            return;
          }
          setUser(updated);
        } else {
          setUser(current);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const loggedUser = await db.loginWithGoogle();
      setUser(loggedUser);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedUser = await db.loginWithEmail(email, pass);
      setUser(loggedUser);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (fullName: string, email: string, role: 'principal' | 'staff', password?: string) => {
    setLoading(true);
    try {
      const loggedUser = await db.registerUser(fullName, email, role, password);
      setUser(loggedUser);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { full_name?: string; email?: string; password?: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      const updated = await db.updateUserProfile(user.id, updates);
      setUser(updated);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    db.logout();
    setUser(null);
  };

  const isPrincipal = user?.role === 'principal';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPrincipal,
        isStaff,
        loginWithGoogle,
        loginWithEmail,
        registerUser,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
