import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BalistaLogo = () => (
    <div className="flex items-center justify-center space-x-3 mb-3">
        <img src="/logo.png" alt="Balista Logo" className="w-20 h-20 object-cover" />
    </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('Login must be used within an AuthProvider');
  }
  const { session, loading: authLoading } = authContext;

  // 1. LOGIKA REDIRECT OTOMATIS (Mencegah Kedap-kedip saat refresh)
  useEffect(() => {
    if (!authLoading && session) {
      const userEmail = session.user.email?.toLowerCase() || "";
      
      // Jika session sudah ada, arahkan berdasarkan email
      if (userEmail === 'tasya.officebalista@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [session, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        const userEmail = data.user.email?.toLowerCase() || "";
        
        // Ambil data profile dari database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }

        toast.success('Login Berhasil!');

        // 2. LOGIKA REDIRECT FINAL (MENGGUNAKAN REPLACE AGAR FRESH)
        if (userEmail === 'tasya.officebalista@gmail.com') {
          // HANYA email kantor yang masuk ke Admin Dashboard
          window.location.replace('/admin');
        } else if (userEmail.startsWith('balista')) {
          // SEMUA email outlet (balistasukajadi, balistaambon, dll) MASUK KE CREW
          window.location.replace('/'); 
        } else {
          // Email lain (default) masuk ke Crew
          window.location.replace('/');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Login Gagal');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen bg-balista-background">
        <div className="w-10 h-10 border-4 border-balista-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-500 italic">Memverifikasi Sesi Balista...</p>
      </div>
     );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-balista-background dark:bg-balista-primary p-4">
      <div className="max-w-md w-full bg-white dark:bg-balista-muted p-8 rounded-2xl shadow-2xl">
        <BalistaLogo />
        <h2 className="text-xl font-semibold text-center text-balista-primary dark:text-white mb-6 uppercase tracking-tight">Login Buku Resep</h2>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-balista-primary dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email Outlet
            </label>
            <input
              id="email"
              className="shadow-inner appearance-none border rounded-lg w-full py-2 px-3 text-balista-primary dark:text-gray-300 bg-gray-100 dark:bg-balista-primary leading-tight focus:outline-none focus:ring-2 focus:ring-balista-secondary"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="outlet@balista.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-balista-primary dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="shadow-inner appearance-none border rounded-lg w-full py-2 px-3 text-balista-primary dark:text-gray-300 bg-gray-100 dark:bg-balista-primary mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-balista-secondary"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******************"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              className="bg-balista-secondary hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full disabled:bg-opacity-50 transition-all duration-300 uppercase tracking-widest"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk ke Galeri'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;