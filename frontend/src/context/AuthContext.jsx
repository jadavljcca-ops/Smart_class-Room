import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.protocol + '//' + window.location.hostname + ':5000');
export const API_BASE_URL = `${BACKEND_URL}/api`;

// Fast in-memory client cache for instant 0ms responses across navigation
const clientCache = new Map();

export const clearClientCache = (filter = '') => {
  if (!filter) {
    clientCache.clear();
  } else {
    for (const key of clientCache.keys()) {
      if (key.includes(filter)) {
        clientCache.delete(key);
      }
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Prefetch helper for background data loading
  const prefetch = (endpoints = []) => {
    endpoints.forEach(ep => {
      authFetch(ep).catch(() => {});
    });
  };

  useEffect(() => {
    if (user && token) {
      // Background prefetch according to role for instant click-to-load
      if (user.role === 'admin') {
        const deptParam = user.adminRole === 'sub_admin' && user.department ? `?department=${user.department}` : '';
        prefetch([
          `/admin/stats${deptParam}`,
          '/admin/departments',
          `/admin/students${deptParam}`,
          `/admin/faculty${deptParam}`,
          '/admin/announcements',
          `/admin/requests${deptParam}`
        ]);
      } else if (user.role === 'faculty') {
        prefetch([
          '/faculty/notes',
          '/student/announcements',
          '/admin/departments'
        ]);
      } else if (user.role === 'student') {
        prefetch([
          '/student/notes',
          '/student/announcements'
        ]);
      }
    }
  }, [user?.role, user?.department, token]);

  useEffect(() => {
    if (token) {
      // Decode JWT token to check expiration (simple manual base64 decode to avoid dependencies)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
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

  const login = async (identifier, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
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
    clientCache.clear();
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
    clientCache.clear();
    return data.message;
  };

  // Helper fetch method with automatically injected Bearer token and fast 0ms client caching
  const authFetch = async (endpoint, options = {}) => {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const cacheKey = `${token || 'anon'}:${endpoint}`;

    // If it's a mutation (POST, PUT, DELETE, PATCH), invalidate client cache immediately
    if (!isGet) {
      clientCache.clear();
    }

    // Check client cache for instant 0ms response on GET queries
    if (isGet && !options.skipCache) {
      const cached = clientCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < 30000)) {
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

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

    // If successful GET, cache cloned data for fast subsequent loads
    if (isGet && response.ok && !endpoint.includes('/download') && !endpoint.includes('/notifications')) {
      try {
        const clone = response.clone();
        clone.json().then(data => {
          clientCache.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }).catch(() => {});
      } catch (e) {}
    }

    return response;
  };

  const updateProfile = async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Profile update failed.');
    }

    // If backend returns a new token (after name/password change), update it
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data.message;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, changePassword, authFetch, updateProfile, prefetch, clearCache: clearClientCache }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
