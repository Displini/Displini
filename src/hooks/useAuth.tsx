import { useState, useEffect, useMemo } from "react";

type User = { email: string };

const AUTH_KEY = 'displini_auth';
const USER_KEY = 'displini_user';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sync state with localStorage on mount
    const authStatus = localStorage.getItem(AUTH_KEY) === 'true';
    const savedUser = localStorage.getItem(USER_KEY);
    setIsAuthenticated(authStatus);
    setUser(savedUser ? JSON.parse(savedUser) : null);
  }, []);

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      // Store user and auth state
      const userData: User = { email };
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  return { user, isAuthenticated, isLoading, login, logout };
}

// Optional provider so existing code keeps working
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
