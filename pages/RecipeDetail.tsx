import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
// @ts-ignore
import { generateRecipeDetails } from '../services/aiResepBaru'; 
import toast from 'react-hot-toast';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State diinisialisasi sebagai null untuk memastikan transisi data bersih
  const [resep, setResep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fungsi utama pemanggilan data langsung dari Supabase
  const fetchDetail = async (targetId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resep')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;
      
      // Sinkronisasi: Data yang diset ke state adalah data yang sesuai ID di URL
      setResep(data);
    } catch (err) {
      toast.error("Menu tidak ditemukan");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setResep(null); // Reset state agar foto menu sebelumnya tidak "nyangkut"
      fetchDetail(id);
    }
  }, [id]); // Dependency [id] menjamin sinkronisasi saat user pindah menu

  // Konverter URL Foto: Mengambil data kolom foto_url dari Supabase
  const getDirectUrl = (url: string) => {
    if (!url || url.trim() === "") return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000';
    
    // Mencari ID unik Google Drive
    const driveRegex = /[-\w]{25,}/; 
    const match = url.match(driveRegex);
    const fileId = match ? match[0] : null;

    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  };

  const handleDetailkanAI = async () => {
    if (!resep) return;
    setIsAiLoading(true);
    const tid = toast.loading("AI sedang menyusun SOP Balista...");
    try {
      const res = await generateRecipeDetails({
        namaMenu: resep.nama,
        bahan: resep.bahan,
        alat: resep.alat
      });

      if (res && res.steps) {
        const joinedSteps = res.steps.join('|||');
        const { error } = await supabase
          .from('resep')
          .update({
            deskripsi: res.description,
            langkah: `{${joinedSteps}}` 
          })
          .eq('id', resep.id);

        if (!error) {
          toast.success("SOP Berhasil Diperbarui!", { id: tid });
          fetchDetail(resep.id);
        }
      }
    } catch (e) {
      toast.error("Gagal terhubung ke AI", { id: tid });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Logic pemisahan data string/array dari database
  const formatBahan = (val: any) => {
    if (!val) return [];
    const cleanStr = String(val).replace(/[{}"]/g, '');
    return cleanStr.split(';').map(item => {
      const parts = item.split('|');
      return { nama: parts[0]?.trim() || '', jumlah: parts[1]?.trim() || '', satuan: parts[2]?.trim() || '' };
    }).filter(item => item.nama !== "");
  };

  const formatAlat = (val: any) => {
    if (!val) return [];
    return String(val).replace(/[{}"]/g, '').split(/[;,]/).map(item => item.trim()).filter(item => item !== "");
  };

  if (loading || !resep) return (
    <div className="h-screen bg-[#fdf8f0] flex items-center justify-center font-black text-[#d35400] text-xl uppercase italic">
      Sinkronisasi Menu Balista...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdf8f0] pb-20 font-sans text-left">
      <nav className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <span className="font-black text-gray-800 tracking-tighter uppercase text-lg italic">Balista Sushi & Tea</span>
        <div className="flex gap-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-orange-500">Galeri Resep</Link>
          <Link to="/admin" className="hover:text-orange-500">Admin Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-4 text-left">
        {/* NAMA MENU - 100% SINKRON SUPABASE */}
        <h2 className="text-3xl font-black text-[#1a3a3a] mb-6 uppercase tracking-tighter">
          {resep.nama}
        </h2>

        <div className="bg-white rounded-[50px] shadow-lg overflow-hidden border border-gray-100">
          
          {/* FOTO MENU - 100% SINKRON SUPABASE */}
          <div className="relative h-[300px] md:h-[480px] p-5">
            <img 
              key={resep.id} // Key unik memaksa image refresh saat ID berubah
              src={getDirectUrl(resep.foto_url)} 
              className="w-full h-full object-cover rounded-[35px] bg-gray-50 shadow-inner" 
              alt={resep.nama}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000'; }}
            />
            <button onClick={() => navigate('/')} className="absolute top-10 left-10 bg-white/90 backdrop-blur px-5 py-2 rounded-xl text-[10px] font-black shadow-sm flex items-center gap-2">
              ← Kembali
            </button>
          </div>

          <div className="px-12 py-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-50 gap-6">
            <div className="w-full">
              <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tighter leading-none">{resep.nama}</h1>
              <p className="text-gray-400 italic text-sm mt-3">"{resep.deskripsi || 'SOP Menu Balista Sushi & Tea.'}"</p>
            </div>
            <button 
              onClick={handleDetailkanAI}
              disabled={isAiLoading}
              className="bg-[#6347f9] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAiLoading ? '⏳ PROSES...' : '✨ Detailkan AI'}
            </button>
          </div>

          {/* GRID BAHAN & ALAT */}
          <div className="px-12 grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
            <div className="bg-[#fffcf9] border border-[#ffeddb] rounded-[35px] p-10 shadow-sm">
              <h3 className="text-[#c25a00] font-black uppercase text-xs mb-8 tracking-widest italic">🥦 Bahan-Bahan</h3>
              <div className="space-y-4">
                {formatBahan(resep.bahan).map((item, i) => (
                  <div key={i} className="flex justify-between border-b border-orange-100/50 pb-2 text-[13px] font-bold text-gray-700 uppercase italic">
                    <span>{item.nama}</span>
                    <span className="text-[#d35400] font-black">{item.jumlah} {item.satuan}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#f7fbff] border border-[#e1f0ff] rounded-[35px] p-10 shadow-sm">
              <h3 className="text-[#0056b3] font-black uppercase text-xs mb-8 tracking-widest italic text-left">🔪 Alat Masak</h3>
              <div className="flex flex-wrap gap-3">
                {formatAlat(resep.alat).map((a, i) => (
                  <span key={i} className="bg-white border border-blue-100 px-5 py-3 rounded-2xl text-[11px] font-black text-blue-600 uppercase shadow-sm">{a}</span>
                ))}
              </div>
            </div>
          </div>

          {/* METODE PEMBUATAN */}
          <div className="px-12 pb-20">
            <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-800 mb-10 uppercase tracking-tighter text-left">Metode Pembuatan:</h3>
              <div className="space-y-8">
                {resep.langkah ? String(resep.langkah).replace(/[{}"]/g, '').split('|||').map((step, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-10 h-10 rounded-xl border-2 border-[#6347f9] text-[#6347f9] flex items-center justify-center font-black shrink-0 text-lg">
                      {i + 1}
                    </div>
                    <p className="font-bold text-gray-600 leading-relaxed text-[15px] pt-1 uppercase tracking-tight text-left">
                      {step}
                    </p>
                  </div>
                )) : <p className="text-gray-400 italic text-sm text-left">Langkah belum tersedia.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;