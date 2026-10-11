import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  role?: 'admin' | 'guide';
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ role = 'admin', children }) => {
  // Synchronous check: Check token immediately without blocking or loading screens
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (role === 'admin') {
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
      return Boolean(token);
    }
    if (role === 'guide') {
      const token = localStorage.getItem('guide_token') || localStorage.getItem('guideToken') || sessionStorage.getItem('guide_token') || sessionStorage.getItem('guideToken');
      return Boolean(token);
    }
    return false;
  });

  useEffect(() => {
    if (role === 'admin') {
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Background token check
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            sessionStorage.removeItem('adminToken');
            localStorage.removeItem('adminToken');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // Keep authenticated if network temporary glitch
        });
    }
  }, [role]);

  if (!isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/guide/login'} replace />;
  }

  return <>{children}</>;
};
