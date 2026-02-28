import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';

const Home = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resep')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error("Gagal memuat resep:", err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url || url === 'NULL' || url.trim() === "") {
      return 'https://via.placeholder.com/500x400?text=Balista+Menu';
    }
    const driveIdMatch = url.match(/(?:\/d\/|id=)([\w-]+)/);
    if (driveIdMatch && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
      return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
    }
    return url;
  };

  // DAFTAR KATEGORI SESUAI GAMBAR ANDA
  const categories = [
    'Semua', 
    'Mentai Rice', 
    'Minuman', 
    'Ramen', 
    'Sushi Reguler', 
    'Takoyaki & Okonomiyaki'
  ];

  /** * LOGIKA FILTER PINTAR
   * Mengonversi teks ke huruf kecil & menghapus spasi agar pencocokan 100% akurat
   */
  const filteredRecipes = filter === 'Semua' 
    ? recipes 
    : recipes.filter(r => {
        const kategoriDb = (r.kategori || '').toLowerCase().trim();
        const filterAktif = filter.toLowerCase().trim();
        return kategoriDb === filterAktif;
      });

  return (
    <Layout title="Galeri Resep Balista">
      <div className="pb-24 text-left">
        
        {/* Navigasi Filter Kategori */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                filter === cat 
                ? 'bg-[#d35400] text-white shadow-lg shadow-orange-200 scale-105' 
                : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Menampilkan Menu */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-[400px] bg-white rounded-[45px] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((resep) => (
                <Link 
                  to={`/resep/${resep.id}`} 
                  key={resep.id}
                  className="group bg-white rounded-[45px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-gray-50 flex flex-col h-full"
                >
                  <div className="relative h-[240px] overflow-hidden m-4 rounded-[35px] bg-gray-100">
                    <img 
                      src={getImageUrl(resep.foto_url || resep.foto)} 
                      alt={resep.nama}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-[#d35400] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        {resep.kategori || 'MENU'}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 pt-2 flex-grow flex flex-col">
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-3 leading-tight group-hover:text-[#d35400]">
                      {resep.nama}
                    </h3>
                    <p className="text-gray-400 text-[12px] font-bold leading-relaxed italic mb-8 line-clamp-2">
                      {resep.deskripsi || 'SOP Menu Balista Sushi & Tea.'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Resep Balista</span>
                      <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-tighter transition-all group-hover:gap-3">
                        Buka Resep 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              /* State Jika Kategori Masih Kosong */
              <div className="col-span-full py-24 text-center bg-white/50 rounded-[50px] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] mb-4">
                  Kategori "{filter}" Masih Kosong
                </p>
                <button 
                  onClick={() => setFilter('Semua')}
                  className="bg-[#d35400] text-white px-8 py-3 rounded-2xl font-bold text-[10px] uppercase shadow-lg shadow-orange-100"
                >
                  Lihat Semua Menu
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;