import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const BACKEND_URL = window.location.protocol + '//' + window.location.hostname + ':5000';
export const API_BASE_URL = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Decode JWT token to check expiration (simple manual base64 decode to avoid dependencies)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          logout();
        } else {
          setUser({
            id: payload.id,
            email: payload.email,
            role: payload.role,
            adminRole: payload.adminRole,
            fullName: payload.fullName,
            department: payload.department,
            semester: payload.semester,
            enrollmentNumber: payload.enrollmentNumber,
            employeeId: payload.employeeId
          });
        }
      } catch (err) {
        console.error('Invalid token format:', err);
        logout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (registerData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed.');
    }
    return data.message; // Returns the success approval instruction message
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Password update failed.');
    }
    return data.message;
  };

  // Helper fetch method with automatically injected Bearer token
  const authFetch = async (endpoint, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    // Do not set Content-Type header if body is FormData (e.g. file upload)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      // Token might be expired or invalid
      logout();
      throw new Error('Session expired or unauthorized. Please log in again.');
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, changePassword, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
