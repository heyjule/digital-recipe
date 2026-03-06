import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        const userEmail = session.user.email?.toLowerCase() || "";

        // 1. Ambil data Profile dari Tabel
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        /**
         * 2. LOGIKA KRUSIAL: FORCE ROLE BERDASARKAN EMAIL
         * Jika email berawal 'balista', paksa role-nya jadi 'crew' 
         * walau di database tertulis 'admin'.
         */
        let finalProfile = profileData;
        if (userEmail.startsWith('balista')) {
          finalProfile = { ...profileData, role: 'crew' };
        } else if (userEmail === 'tasya.officebalista@gmail.com') {
          finalProfile = { ...profileData, role: 'admin' };
        }

        if (finalProfile) {
          setProfile(finalProfile);
          localStorage.setItem('userProfile', JSON.stringify(finalProfile));
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('userProfile');
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        initializeAuth();
      } else {
        setUser(null);
        setProfile(null);
        localStorage.clear();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {/* Jangan render children sebelum loading selesai untuk mencegah kedap-kedip */}
      {!loading ? children : (
        <div className="flex items-center justify-center h-screen bg-[#fdf8f0]">
          <div className="w-10 h-10 border-4 border-[#d35400] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};