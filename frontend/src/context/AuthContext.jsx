import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRegister, apiLogin, apiLogout, apiGetMe, setStoredToken, getStoredToken } from '../services/api';

const AuthContext = createContext();

export const DEMO_CREDENTIALS = [
  {
    role: 'student',
    label: 'Isolated Demo Account (Hackathon)',
    username: 'demo',
    password: 'demo123',
    details: 'Isolated demonstration student profile (is_demo = true)',
    targetUrl: '/student/dashboard'
  },
  {
    role: 'student',
    label: 'Student (Aarav Sharma)',
    username: 'student1',
    password: 'password123',
    details: 'Roll 14 (CS-014) • Visual impairment • Class 10',
    targetUrl: '/student/dashboard'
  },
  {
    role: 'student',
    label: 'Student (Priya Verma)',
    username: 'student2',
    password: 'password123',
    details: 'Roll 5 (CS-005) • High performer • Class 10',
    targetUrl: '/student/dashboard'
  },
  {
    role: 'student',
    label: 'New Student (Awaiting Onboarding)',
    username: 'newstudent',
    password: 'password123',
    details: 'Roll 38 (CS-038) • Incomplete profile • Triggers Onboarding Flow',
    targetUrl: '/student/onboarding'
  },
  {
    role: 'mentor',
    label: 'Mentor (Dr. Radhika Sen)',
    username: 'mentor1',
    password: 'password123',
    details: 'Assigned Cohort: Roll Numbers 1 to 20',
    targetUrl: '/mentor/dashboard'
  },
  {
    role: 'mentor',
    label: 'Mentor (Prof. Vikram Joshi)',
    username: 'mentor2',
    password: 'password123',
    details: 'Assigned Cohort: Roll Numbers 21 to 40',
    targetUrl: '/mentor/dashboard'
  },
  {
    role: 'parent',
    label: 'Parent (Sunita Sharma)',
    username: 'parent1',
    password: 'password123',
    details: 'Linked strictly to Child: Aarav Sharma (ID: 1)',
    targetUrl: '/parent/dashboard'
  },
  {
    role: 'administrator',
    label: 'Administrator (P. K. Verma)',
    username: 'admin1',
    password: 'password123',
    details: 'Scholarship & Aid Director (Zero academic/medical access)',
    targetUrl: '/admin/scholarships'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiGetMe();
        if (res.ok && res.data && res.data.authenticated) {
          setUser({
            id: res.data.user_id,
            username: res.data.username,
            role: res.data.role,
            profile: res.data.profile || {}
          });
        } else {
          // Token expired or invalid
          setStoredToken('');
          setUser(null);
          setToken('');
        }
      } catch (err) {
        setStoredToken('');
        setUser(null);
        setToken('');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const register = async (name, username, password, role = 'student') => {
    const res = await apiRegister(name, username, password, role);
    if (res.ok && res.data && res.data.token) {
      const sessionToken = res.data.token;
      const userData = res.data.user;
      setStoredToken(sessionToken);
      setToken(sessionToken);
      setUser(userData);
      return { success: true, user: userData, role: userData.role };
    }
    return { 
      success: false, 
      error: res.error || (res.data && res.data.error) || 'Registration failed' 
    };
  };

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    if (res.ok && res.data && res.data.token) {
      const sessionToken = res.data.token;
      const userData = res.data.user;
      setStoredToken(sessionToken);
      setToken(sessionToken);
      setUser(userData);
      return { success: true, user: userData, role: userData.role };
    }
    return { 
      success: false, 
      error: res.error || (res.data && res.data.error) || 'Invalid credentials' 
    };
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setStoredToken('');
      setToken('');
      setUser(null);
    }
  };

  const updateUserProfile = (newProfile) => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: { ...prev.profile, ...newProfile }
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        register,
        login,
        logout,
        updateUserProfile,
        DEMO_CREDENTIALS
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
