// Ganti isi AuthContext.tsx dengan logika ini
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek cadangan di localStorage dulu agar langsung muncul (Instan)
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setLoading(false);
    }

    // 2. Cek sesi asli dari Supabase
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setProfile(data);
          // Kunci data ke localStorage
          localStorage.setItem('userProfile', JSON.stringify(data));
        }
      }
      setLoading(false);
    };

    getUserProfile();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};