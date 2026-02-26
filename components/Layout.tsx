import React, { ReactNode, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface LayoutProps {
  children?: ReactNode;
  title: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  const { profile } = useContext(AuthContext) || {};
  const [currentRole, setCurrentRole] = React.useState('crew');

  // CEK ROLE SETIAP KALI HALAMAN DIBUKA
  React.useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (profile?.role === 'admin' || savedProfile?.role === 'admin') {
      setCurrentRole('admin');
    } else {
      setCurrentRole('crew');
    }
  }, [profile]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/login');
  };

  return (
    <div className="min-h-screen bg-balista-background">
      <header className="bg-white shadow-md sticky top-0 z-[9999]">
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" className="w-10 h-10 rounded-full" alt="logo" />
            <span className="font-bold text-balista-primary uppercase">Balista Sushi & Tea</span>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <NavLink to="/" end className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-balista-accent' : ''}`}>
              Galeri Resep
            </NavLink>
            
            {/* PAKAI currentRole AGAR STABIL */}
            {currentRole === 'admin' && (
              <>
                <NavLink to="/admin" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-balista-accent' : ''}`}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/kategori" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-balista-accent' : ''}`}>
                  Kelola Kategori
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4 text-right">
             <div>
                <p className="text-xs font-bold text-gray-800 lowercase">{profile?.email || 'admin@balista.com'}</p>
                <p className={`text-[9px] font-black uppercase ${currentRole === 'admin' ? 'text-blue-600' : 'text-green-600'}`}>
                  {currentRole === 'admin' ? '(ADMIN OFFICE)' : '(CREW)'}
                </p>
             </div>
             <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold">KELUAR</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-6 text-balista-primary">{title}</h2>
        {children}
      </main>
    </div>
  );
};

export default Layout;