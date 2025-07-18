import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User } from '../types';
import { mockUsers } from '../data/mockData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('interlub-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      const userWithLastLogin = { ...foundUser, lastLogin: new Date().toISOString() };
      setUser(userWithLastLogin);
      localStorage.setItem('interlub-user', JSON.stringify(userWithLastLogin));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('interlub-user');
  };

  const register = async (userData: Partial<User>, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || '',
      email: userData.email || '',
      department: userData.department || 'HR',
      role: 'student',
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    setUser(newUser);
    localStorage.setItem('interlub-user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userExists = mockUsers.some(u => u.email === email);
    return userExists;
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('interlub-user', JSON.stringify(updatedUser));
    setIsLoading(false);
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      resetPassword,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};