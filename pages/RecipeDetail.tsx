import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { getSupabaseErrorMessage } from '../services/errorUtils';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

// --- FUNGSI PEMBERSIH DATA (VERSI UPGRADE) ---
const parseDataCerdas = (data: any) => {
  if (!data) return [];

  // 1. Jika sudah Array, kembalikan langsung
  if (Array.isArray(data)) return data;

  // 2. Jika String (Tulisan)
  if (typeof data === 'string') {
    let text = data.trim();

    // Cek JSON lama (diawali kurung siku [ )
    if (text.startsWith('[')) {
      try { return JSON.parse(text); } catch (e) { console.error(e); }
    }

    // Cek Postgres Array (diawali kurung kurawal { )
    if (text.startsWith('{') && text.endsWith('}')) {
       text = text.slice(1, -1); // Buang kurung kurawal
    }

    // --- LOGIKA BARU UNTUK FORMAT "Adonan|1|porsi;Kani|2|pcs" ---
    if (text.includes(';')) {
        return text.split(';').map((item) => {
            const cleanItem = item.trim();
            // Jika ada garis tegak |, pisahkan jadi format cantik
            if (cleanItem.includes('|')) {
                const parts = cleanItem.split('|');
                // Format: "Nama | Jumlah | Satuan" -> Menjadi object biar rapi
                return {
                    nama: parts[0]?.trim(),
                    jumlah: parts[1]?.trim(),
                    satuan: parts[2]?.trim()
                };
            }
            return cleanItem;
        });
    }

    // Fallback: Pisah dengan koma jika tidak ada titik koma
    if (text.includes(',')) {
        return text.split(',').map((item) => item.trim());
    }

    return [text];
  }

  return [];
};

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('resep')
        .select(`*, kategori (nama)`)
        .eq('id', id)
        .single();

      if (error) {
        setError(getSupabaseErrorMessage(error, 'Resep tidak ditemukan.'));
      } else {
        setRecipe(data);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <Layout title="Detail Resep"><div className="text-center p-8">Memuat...</div></Layout>;
  if (error || !recipe) return <Layout title="Error"><div className="text-center text-red-500 p-4">Error: {error}</div></Layout>;

  // Parsing data
  const listBahan = parseDataCerdas(recipe.bahan);
  const listAlat = parseDataCerdas(recipe.alat);
  const listLangkah = parseDataCerdas(recipe.langkah);

  return (
    <Layout title={recipe.nama}>
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <img
          src={getGoogleDriveImageUrl(recipe.foto_url) || `https://picsum.photos/800/400?random=${recipe.id}`}
          alt={recipe.nama}
          className="w-full h-64 md:h-96 object-cover"
        />
        <div className="p-6 md:p-8">
          <p className="text-sm text-green-600 font-bold uppercase mb-1">{recipe.kategori?.nama || 'Umum'}</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{recipe.nama}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">{recipe.deskripsi}</p>

          {recipe.potongan && (
            <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-lg font-bold text-yellow-800">🥡 Penyajian: <span className="font-normal">{recipe.potongan}</span></p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* --- BAGIAN BAHAN --- */}
            <div>
              <h3 className="text-xl font-bold mb-4 border-b-2 border-green-500 pb-2">Bahan-bahan</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                {listBahan.length > 0 ? listBahan.map((item: any, index: number) => {
                    // Logika Tampilan: 
                    // 1. Jika Object hasil pecahan '|' (Format baru: {nama, jumlah, satuan})
                    if (item.nama && item.jumlah) {
                        return <li key={index}><b>{item.jumlah} {item.satuan}</b> {item.nama}</li>;
                    }
                    // 2. Jika Object JSON lama ({nama: "..."})
                    if (item.nama) {
                         return <li key={index}><b>{item.jumlah || ''} {item.satuan || ''}</b> {item.nama}</li>;
                    }
                    // 3. Jika Teks biasa
                    return <li key={index}>{item}</li>;
                }) : <p className="italic text-gray-500">Data bahan belum tersedia.</p>}
              </ul>
            </div>

            {/* --- BAGIAN ALAT --- */}
            <div>
              <h3 className="text-xl font-bold mb-4 border-b-2 border-green-500 pb-2">Alat</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                 {listAlat.length > 0 ? listAlat.map((item: any, index: number) => (
                    <li key={index}>{typeof item === 'object' ? item.nama : item}</li>
                 )) : <p className="italic text-gray-500">Data alat belum tersedia.</p>}
              </ul>
            </div>
          </div>
          
          {/* --- BAGIAN LANGKAH (ERROR HANDLING) --- */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 border-b-2 border-green-500 pb-2">Langkah-langkah</h3>
            {/* Cek apakah ada error API Key di dalam teks langkah */}
            {typeof recipe.langkah === 'string' && recipe.langkah.includes('API key was reported as leaked') ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="font-bold">⚠️ Gagal Memuat Langkah (Masalah API Key)</p>
                    <p className="text-sm mt-1">
                       API Key Google Gemini Anda telah diblokir karena terdeteksi bocor. 
                       Mohon buat API Key baru dan masukkan ke file <code>.env</code>.
                    </p>
                </div>
            ) : listLangkah.length > 0 ? (
                <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-200">
                    {listLangkah.map((step: any, index: number) => (
                        <li key={index}>{typeof step === 'object' ? JSON.stringify(step) : step}</li>
                    ))}
                </ol>
            ) : (
                <p className="text-gray-500 italic">Langkah-langkah belum tersedia.</p>
            )}
          </div>

        </div>
      </div>
      
      <div className="mt-8 text-center pb-8">
          <Link to="/" className="text-green-600 hover:underline text-lg">&larr; Kembali ke Daftar Menu</Link>
      </div>
    </Layout>
  );
};

export default RecipeDetail;