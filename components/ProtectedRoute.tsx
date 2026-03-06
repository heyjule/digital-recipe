import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth || auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fdf8f0]">
        <div className="w-10 h-10 border-4 border-[#d35400] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userEmail = auth.user.email?.toLowerCase() || "";
  const isOutletEmail = userEmail.startsWith('balista');

  // KUNCI UTAMA: Jika email 'balista...', paksa statusnya jadi 'crew'
  const effectiveRole = isOutletEmail ? 'crew' : (auth.profile?.role || 'crew');

  // PROTEKSI ADMIN: Jika rute butuh 'admin' tapi user adalah 'crew' (berdasarkan email)
  if (allowedRoles.includes('admin') && !allowedRoles.includes('crew') && effectiveRole === 'crew') {
    console.warn(`[SECURITY] Akses Admin Ditolak untuk Outlet: ${userEmail}`);
    return <Navigate to="/" replace />; // Lempar ke Galeri Resep
  }

  return <>{children}</>;
};

export default ProtectedRoute;