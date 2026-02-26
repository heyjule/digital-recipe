import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase.from('resep').select('*').order('nama');
      setRecipes(data || []);
    };
    fetchRecipes();
  }, []);

  const getDirectUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/400x300?text=Balista+Menu';
    if (url.includes('drive.google.com')) {
      const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
      return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
    }
    return url;
  };

  return (
    <Layout title="Galeri Resep Balista">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((r) => (
          <div key={r.id} className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="relative h-64 overflow-hidden">
              <img 
                src={getDirectUrl(r.foto_url)} 
                alt={r.nama} 
                className="w-full h-full object-cover group-hover:scale-110 transition-duration-500"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Foto+Menu')}
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-black uppercase text-[#d35400]">
                {r.kategori}
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-black uppercase mb-4 tracking-tighter">{r.nama}</h3>
              
              <div className="mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Bahan Utama:</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(r.bahan) ? r.bahan : []).map((item: string, i: number) => (
                    <span key={i} className="text-[11px] bg-orange-50 text-[#d35400] px-3 py-1 rounded-lg font-bold">
                      {String(item).replace(/[\[\]"']/g, '')}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => navigate(`/resep/${r.id}`)}
                className="w-full py-4 bg-gray-50 rounded-2xl text-[11px] font-black uppercase hover:bg-orange-100 hover:text-[#d35400] transition-all"
              >
                Lihat Detail Resep
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Home;