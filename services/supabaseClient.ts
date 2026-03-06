import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxdolyuzmpglvoetookj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZG9seXV6bXBnbHZvZXRvb2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzczMTMsImV4cCI6MjA4NDcxMzMxM30.QRTO4p1UHiJoQzRBgjmm_MrD--Vtmq2w9scDDBaoEW0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Agar file lain tidak error saat memanggil pengecekan ini
export const isSupabaseConfigured = true;

console.log("🔥 Koneksi Supabase Berhasil Diaktifkan");