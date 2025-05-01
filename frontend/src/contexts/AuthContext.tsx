import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  followers_count: number;
  following_count: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token: string) => {
    try {
      // Set the authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user profile
      const res = await axios.get('/api/profile/');
      setUser(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading user:', err);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const res = await axios.post('/api/token/', { username, password });
      const { access, refresh } = res.data;
      
      // Save tokens
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Load user data
      await loadUser(access);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      await axios.post('/api/register/', { username, email, password });
      // After registration, log the user in
      await login(username, password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.username || 
                          err.response?.data?.email || 
                          err.response?.data?.password || 
                          'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};