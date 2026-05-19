import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('userSession');
    if (storedUser) {
      try {
        let parsedUser = JSON.parse(storedUser);
        // Fallback for previous mock data with name instead of nama
        if (parsedUser && !parsedUser.nama && (parsedUser as any).name) {
          parsedUser.nama = (parsedUser as any).name;
        }
        return parsedUser;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Keep sync in case of multiple tabs (optional but good)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('userSession');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userSession', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userSession');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
