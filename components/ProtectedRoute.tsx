import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const auth = useContext(AuthContext);

  if (!auth) return null;

  // JIKA STUCK DI SINI:
  if (auth.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 italic">Memverifikasi Sesi...</p>
      </div>
    );
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  const userRole = auth.profile?.role || 'crew';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;