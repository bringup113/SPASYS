import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { buildApiUrl } from '../config/api';

interface User {
  id: string;
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查本地存储的登录状态
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    
    if (storedUser && storedLoginStatus === 'true') {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
        
        // 验证登录状态是否有效
        checkAuthStatus();
      } catch (error) {
        console.error('解析用户数据失败:', error);
        logout();
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const response = await fetch(buildApiUrl(`/auth/check?userId=${user.id}`));
      const data = await response.json();
      
      if (!data.success) {
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('验证登录状态失败:', error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 