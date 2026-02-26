import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';
// @ts-ignore
import { generateRecipeDetails } from '../../services/aiResepBaru'; 
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    nama: '', bahan: '', alat: '', langkah: '', foto_url: '', kategori: 'Sushi', deskripsi: ''
  });

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    const { data } = await supabase.from('resep').select('*').order('created_at', { ascending: false });
    setRecipes(data || []);
  };

  const formatToPostgresArray = (arr: any) => {
    if (!Array.isArray(arr) || arr.length === 0) return '{}';
    const cleaned = arr.map(val => String(val).replace(/[{}"]/g, '').trim());
    return `{${cleaned.join('|||')}}`;
  };

  const cleanTextForDisplay = (text: any) => {
    if (!text) return '';
    const raw = String(text).replace(/[{}"]/g, '');
    const separator = raw.includes('|||') ? '|||' : ',';
    return raw.split(separator).map(t => t.trim()).filter(t => t !== "").join('\n');
  };

  const handleBulkGenerateAI = async () => {
    // FILTER: Mencari menu yang butuh AI (Langkah kosong atau berantakan/pendek)
    const incomplete = recipes.filter(r => 
      !r.langkah || String(r.langkah) === '{}' || String(r.langkah).length < 100 
    );
    
    if (incomplete.length === 0) return toast.success("Semua SOP sudah rapi! ✨");

    if (!window.confirm(`Gunakan AI untuk menyelaraskan ${incomplete.length} menu?`)) return;

    setIsBulkLoading(true);
    const tid = toast.loading("AI sedang menyusun langkah pembuatan...");

    for (let i = 0; i < incomplete.length; i++) {
      const recipe = incomplete[i];
      try {
        const res = await generateRecipeDetails(recipe);
        if (res?.error === "rate_limit") {
          await new Promise(r => setTimeout(r, 15000));
          i--; continue;
        }
        if (res && res.steps) {
          const payload = {
            deskripsi: res.description || '',
            langkah: formatToPostgresArray(res.steps)
          };
          await supabase.from('resep').update(payload).eq('id', recipe.id);
        }
        await new Promise(r => setTimeout(r, 6000)); // Delay aman
        toast.loading(`Berhasil: ${i + 1}/${incomplete.length}`, { id: tid });
      } catch (e) { console.error(e); }
    }
    setIsBulkLoading(false);
    toast.success("Otomasi Selesai! ✨", { id: tid });
    fetchRecipes();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      bahan: formData.bahan.split('\n').filter(i => i.trim()).join(';'),
      alat: formData.alat.split('\n').filter(i => i.trim()).join(';'),
      langkah: formatToPostgresArray(formData.langkah.split('\n').filter(i => i.trim()))
    };
    await supabase.from('resep').update(payload).eq('id', editingRecipe.id);
    setIsModalOpen(false);
    fetchRecipes();
    toast.success("Data berhasil disimpan!");
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="p-8 text-left">
        <div className="flex justify-between items-center mb-10 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div>
            <h2 className="font-black text-2xl uppercase tracking-tighter text-gray-800">SOP Management</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic tracking-widest">Digital Automation System</p>
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => handleBulkGenerateAI()} 
              className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50 transition-all active:scale-95"
            >
              ✨ OTOMASI SEMUA
            </button>
            <button onClick={() => { setEditingRecipe(null); setIsModalOpen(true); }} className="bg-[#d35400] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">+ TAMBAH</button>
          </div>
        </div>
        {/* TABEL DATA */}
        <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-gray-50">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-10 py-6">Nama Produk</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 font-bold hover:bg-orange-50/20 transition-all">
                  <td className="px-10 py-5 uppercase text-sm tracking-tighter">{r.nama}</td>
                  <td className="px-10 py-5 text-center">
                    {(String(r.langkah).length < 100 || String(r.langkah) === '{}') ? 
                      <span className="text-red-400 text-[9px] font-black bg-red-50 px-4 py-1 rounded-full uppercase">⚠️ Butuh AI</span> : 
                      <span className="text-green-500 text-[9px] font-black bg-green-50 px-4 py-1 rounded-full uppercase">✅ Rapi</span>
                    }
                  </td>
                  <td className="px-10 py-5 text-right">
                    <button onClick={() => { 
                      setEditingRecipe(r); 
                      setFormData({ ...r, bahan: cleanTextForDisplay(r.bahan), alat: cleanTextForDisplay(r.alat), langkah: cleanTextForDisplay(r.langkah), deskripsi: r.deskripsi || '' }); 
                      setIsModalOpen(true); 
                    }} className="text-blue-600 text-[10px] font-black uppercase hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;