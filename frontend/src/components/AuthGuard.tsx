import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  role: 'admin' | 'guide';
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ role, children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (role === 'admin') {
      const token = sessionStorage.getItem('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      // Quick verification
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('adminToken');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // If offline or network error, fallback to token existence
          setIsAuthenticated(true);
        });
    } else if (role === 'guide') {
      const token = localStorage.getItem('guide_token') || localStorage.getItem('guideToken') || sessionStorage.getItem('guide_token') || sessionStorage.getItem('guideToken');
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [role]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex items-center justify-center font-mono text-xs">
        VERIFYING CREDENTIALS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/guide/login'} replace />;
  }

  return <>{children}</>;
};
