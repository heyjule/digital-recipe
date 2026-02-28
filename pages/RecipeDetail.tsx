import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
// @ts-ignore
import { generateRecipeDetails } from '../services/aiResepBaru'; 
import toast from 'react-hot-toast';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resep, setResep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('resep')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setResep(data);
      } catch (err) {
        toast.error("Menu tidak ditemukan");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  /**
   * FIX LOGIKA FOTO: Disamakan persis dengan Home.tsx
   * Menggunakan format googleusercontent untuk render yang lebih stabil
   */
  const getImageUrl = (url: string) => {
    // Gunakan Unsplash sebagai fallback yang lebih stabil daripada via.placeholder
    const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000';
    
    if (!url || url === 'NULL' || url.trim() === "") {
      return fallbackImage;
    }

    const driveIdMatch = url.match(/(?:\/d\/|id=)([\w-]+)/);
    if (driveIdMatch && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
      const driveId = driveIdMatch[1];
      // FIX TYPO: Menggunakan template literal yang benar agar driveId terbaca
      return `https://lh3.googleusercontent.com/u/0/d/${driveId}`;
    }
    return url;
  };

  const handleDetailkanAI = async () => {
    if (!resep) return;
    setIsAiLoading(true);
    const tid = toast.loading("AI sedang menyusun SOP...");
    try {
      const res = await generateRecipeDetails(resep);
      if (res && res.steps) {
        const cleanSteps = res.steps.slice(0, 6).map((s: string) => s.replace(/"/g, "'").trim());
        const postgresArray = `{"${cleanSteps.join('","')}"}`;
        
        const { error } = await supabase
          .from('resep')
          .update({ deskripsi: res.description, langkah: postgresArray })
          .eq('id', resep.id);

        if (!error) {
          const { data } = await supabase.from('resep').select('*').eq('id', resep.id).single();
          setResep(data);
          toast.success("SOP AI Berhasil Diperbarui!", { id: tid });
        }
      }
    } catch (e) { 
      toast.error("Gagal sinkronisasi AI", { id: tid }); 
    } finally { 
      setIsAiLoading(false); 
    }
  };

  /**
   * PARSE BAHAN: Nama di Kiri, Takaran di Kanan
   */
  const parseBahanBersih = (val: any) => {
    if (!val) return [];
    let str = String(val).replace(/[\[\]{}"]/g, '');
    const items = str.split(/[;\n]/).map(i => i.trim()).filter(i => i !== "");
    
    return items.map(item => {
      if (item.includes('|')) {
        const parts = item.split('|').map(p => p.trim());
        const takaran = parts.slice(1).join(' ').replace(/nama:|jumlah:|satuan:|:/gi, '').trim();
        return { 
          nama: parts[0].replace(/nama:|jumlah:|satuan:|:/gi, '').trim(), 
          takaran: takaran 
        };
      }
      
      const match = item.match(/(\d+.*)/); 
      if (match && match.index !== undefined) {
        const namaBahan = item.substring(0, match.index).trim();
        const takaranLengkap = match[0].trim(); 
        return { 
          nama: namaBahan.replace(/nama:|jumlah:|satuan:|:/gi, '').trim(), 
          takaran: takaranLengkap 
        };
      }

      return { 
        nama: item.replace(/nama:|jumlah:|satuan:|:/gi, '').trim(), 
        takaran: "" 
      };
    });
  };

  const parseLangkahRapi = (val: any) => {
    if (!val) return [];
    let cleanStr = String(val).replace(/[{}'\[\]"]/g, '');
    const steps = cleanStr.split(',').map(s => s.trim()).filter(s => s.length > 5);
    return steps.slice(0, 6);
  };

  if (loading) return <div className="h-screen bg-[#fdf8f0] flex items-center justify-center font-black text-orange-600 animate-pulse uppercase text-xl italic text-left">Memuat SOP Balista...</div>;
  if (!resep) return null;

  return (
    <div className="min-h-screen bg-[#f3e5c9] pb-24 font-sans text-left">
      <nav className="bg-white/80 backdrop-blur-md px-10 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <span className="font-black text-gray-800 tracking-tighter uppercase text-lg italic cursor-pointer" onClick={() => navigate('/')}>Balista Sushi & Tea</span>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-[12px] font-bold text-gray-600 hover:text-orange-500">Galeri Resep</Link>
          <Link to="/admin" className="text-[12px] font-bold text-gray-600 hover:text-orange-500">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-[45px] shadow-xl overflow-hidden border border-gray-100">
          
          {/* FOTO MENU: SINKRON DENGAN GALERI */}
          <div className="relative h-[450px] m-4 rounded-[35px] overflow-hidden bg-gray-100 shadow-inner">
            <img 
              src={getImageUrl(resep.foto_url || resep.foto)} 
              alt={resep.nama} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                // Mencegah loop error jika link utama mati
                const target = e.target as HTMLImageElement;
                if (target.src !== 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000') {
                  target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000';
                }
              }}
            />
            <button onClick={() => navigate('/')} className="absolute top-6 left-6 bg-white/90 px-5 py-2 rounded-xl text-[11px] font-black shadow-md uppercase">← Kembali</button>
          </div>

          <div className="px-12 py-8 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="w-full text-left">
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4 italic uppercase">{resep.nama}</h1>
              {resep.potongan && (
                <div className="mb-4">
                  <span className="bg-orange-100 text-[#d35400] px-5 py-2 rounded-full font-black text-[11px] uppercase tracking-widest italic">
                    🍱 Porsi: {resep.potongan}
                  </span>
                </div>
              )}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-3xl">
                <p className="text-orange-900 italic text-sm font-bold leading-relaxed">"{resep.deskripsi || 'SOP Standar Menu Balista Sushi & Tea.'}"</p>
              </div>
            </div>
            <button onClick={handleDetailkanAI} disabled={isAiLoading} className="bg-[#6347f9] text-white px-8 py-4 rounded-full font-black text-[12px] uppercase shadow-lg hover:bg-indigo-700 transition-all shrink-0">
              {isAiLoading ? '⏳ PROSES...' : '✨ Detailkan AI'}
            </button>
          </div>

          <div className="px-12 grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
            <div className="bg-white border border-orange-100 rounded-[35px] p-10 shadow-sm text-left">
              <h3 className="text-[#d35400] font-black uppercase text-[13px] mb-8 italic tracking-widest">🥗 Bahan-Bahan</h3>
              <div className="space-y-5">
                {parseBahanBersih(resep.bahan).map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-orange-50 pb-4">
                    <span className="text-[15px] font-bold text-gray-700 capitalize">{item.nama}</span>
                    <span className="text-[13px] font-black text-[#d35400] uppercase text-right">{item.takaran}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-blue-100 rounded-[35px] p-10 text-center shadow-sm">
              <h3 className="text-[#004bb3] font-black uppercase text-[13px] mb-8 italic tracking-widest flex justify-center items-center gap-2 text-center">⚒️ Alat Masak</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {String(resep.alat || '').replace(/[\[\]{}"]/g, '').split(/[;,|]/).map((a, i) => (
                  <span key={i} className="bg-white border border-blue-200 px-6 py-3 rounded-2xl text-[11px] font-black text-blue-600 uppercase shadow-sm">
                    {a.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-12 pb-24 text-left">
            <div className="bg-[#fcfcfe] rounded-[45px] p-12 border border-gray-100 shadow-inner text-left">
              <h3 className="text-2xl font-black text-gray-800 mb-10 uppercase tracking-tighter italic text-left">Metode Pembuatan:</h3>
              <div className="space-y-8 text-left">
                {parseLangkahRapi(resep.langkah).map((step, i) => (
                  <div key={i} className="flex gap-8 items-start group text-left">
                    <div className="w-10 h-10 rounded-xl border-2 border-indigo-500 text-indigo-600 flex items-center justify-center font-black shrink-0 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <div className="pt-2 text-left">
                      <p className="font-bold text-gray-700 leading-relaxed text-[16px] text-left">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;