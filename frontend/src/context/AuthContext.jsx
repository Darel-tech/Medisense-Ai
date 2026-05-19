import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Axios HTTP client defaults
  axios.defaults.baseURL = 'http://localhost:3000/api';

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('medisense_token');
        const storedUser = localStorage.getItem('medisense_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Configure Authorization headers globally for all subsequent Axios calls
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error('Error reloading authentication state: ', err);
        // Clear corrupt storage
        localStorage.removeItem('medisense_token');
        localStorage.removeItem('medisense_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (jwtToken, userData) => {
    localStorage.setItem('medisense_token', jwtToken);
    localStorage.setItem('medisense_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
  };

  const logout = () => {
    localStorage.removeItem('medisense_token');
    localStorage.removeItem('medisense_user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider context wrapper.');
  }
  return context;
};
