import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';
import { generateRecipeDetails } from '../services/geminiService';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('resep')
        .select(`*, kategori(nama)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      setRecipe(data);
    } catch (err) {
      console.error("Gagal fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI PARSE DATA DENGAN TAKARAN (Sesuai format Supabase: Nama|Jumlah|Satuan)
  const parseData = (data: any) => {
    if (!data || data === "NULL" || data === "") return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      // Jika data menggunakan pemisah ';'
      return data.split(';').map(item => {
        const parts = item.trim().split('|');
        if (parts.length >= 2) {
          return {
            nama: parts[0],
            jumlah: parts[1] || '',
            satuan: parts[2] || ''
          };
        }
        return { nama: parts[0], jumlah: '', satuan: '' };
      }).filter(i => i.nama !== "");
    }
    return [];
  };

 // Pastikan fungsi handleAIUpdate di dalam RecipeDetail.tsx terlihat seperti ini:

const handleAIUpdate = async () => {
  if (!recipe || !id) return;
  setIsProcessing(true);
  const toastId = toast.loading("Chef AI sedang mempelajari bahan & alat Anda...");

  try {
    const aiResult: any = await generateRecipeDetails(
      recipe.nama, 
      recipe.deskripsi || "", 
      recipe.bahan, 
      recipe.alat
    );

    if (aiResult?.error) throw new Error(aiResult.error);

    // Update ke Supabase
    const { error: updateError } = await supabase
      .from('resep')
      .update({ 
        langkah: aiResult.langkah, // Disimpan sebagai Array
        deskripsi: aiResult.deskripsi 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Update state lokal agar UI langsung berubah tanpa refresh
    setRecipe((prev: any) => ({
      ...prev,
      langkah: aiResult.langkah,
      deskripsi: aiResult.deskripsi
    }));

    toast.success("Resep berhasil disusun sesuai stok bahan!", { id: toastId });
  } catch (e: any) {
    console.error("Proses AI Gagal:", e.message);
    toast.error(`Gagal: ${e.message}`, { id: toastId });
  } finally {
    setIsProcessing(false);
  }
};

  if (loading) return <Layout title="Loading..."><div className="p-20 text-center animate-pulse text-gray-400 font-medium">Menyiapkan data resep...</div></Layout>;
  if (!recipe) return <Layout title="Error"><div className="p-20 text-center text-red-500">Menu tidak ditemukan.</div></Layout>;

  return (
    <Layout title={recipe.nama}>
      <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden mb-12 mt-6 border border-gray-100">
        <div className="h-[400px] relative">
          <img 
            src={getGoogleDriveImageUrl(recipe.foto_url || recipe.gambar_url)} 
            className="w-full h-full object-cover" 
            alt={recipe.nama} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <Link to="/" className="absolute top-6 left-6 bg-white/90 backdrop-blur px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-white transition-all">
            ← Kembali
          </Link>
          <div className="absolute bottom-8 left-10 text-white">
             <span className="bg-indigo-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
               {recipe.kategori?.nama || 'Menu'}
             </span>
             <h1 className="text-5xl font-black">{recipe.nama}</h1>
          </div>
        </div>

        <div className="p-10">
          <div className="flex justify-between items-start mb-10 gap-4">
            <div className="flex-1">
              <p className="text-xl italic text-gray-400 font-medium">"{recipe.deskripsi}"</p>
            </div>
            <button 
              onClick={handleAIUpdate} 
              disabled={isProcessing}
              className={`px-8 py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
              }`}
            >
              {isProcessing ? "⏳ Memproses..." : "✨ Detailkan AI"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* BAGIAN BAHAN DENGAN TAKARAN */}
            <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100 shadow-sm">
              <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center gap-2">🥬 Bahan Baku</h3>
              <div className="space-y-3">
                {parseData(recipe.bahan).map((b: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                    <div className="flex items-center gap-3 text-gray-700 font-medium">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      {b.nama}
                    </div>
                    {b.jumlah && (
                      <div className="text-orange-600 font-bold bg-orange-100/50 px-3 py-1 rounded-lg text-sm">
                        {b.jumlah} {b.satuan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* BAGIAN ALAT */}
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 shadow-sm">
              <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">🔪 Alat Kerja</h3>
              <div className="flex flex-wrap gap-3">
                {parseData(recipe.alat).map((a: any, i: number) => (
                  <span key={i} className="bg-white px-4 py-2 rounded-xl text-sm font-bold border border-blue-200 text-blue-700 shadow-sm">
                    {typeof a === 'object' ? a.nama : a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 shadow-inner">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">📋 Metode Pembuatan</h3>
            <div className="space-y-8">
              {recipe.langkah && recipe.langkah.length > 0 ? (
                recipe.langkah.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 font-black shadow-md border border-indigo-100 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed pt-2 font-medium">{step}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 font-medium bg-white">
                  Langkah belum tersedia. Klik tombol AI di atas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RecipeDetail;