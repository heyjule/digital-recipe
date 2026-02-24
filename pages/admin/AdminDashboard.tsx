import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { mintaResepKeAI } from '../../services/aiResepBaru'; 
import type { Resep } from '../../types';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<Resep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const navigate = useNavigate();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resep')
      .select(`
        *,
        kategori:kategori_id (
          nama
        )
      `) 
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Gagal mengambil data:", error.message);
      toast.error("Gagal memuat data menu");
    }

    if (data) setRecipes(data as any[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleBulkGenerate = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmMsg = `AI akan menyusun resep DAN menebak kategori untuk ${selectedIds.size} menu. Lanjutkan?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    
    // --- LANGKAH 1: Ambil daftar kategori dari database ---
    const { data: dbKategori } = await supabase.from('kategori').select('id, nama');
    const stringKategori = dbKategori?.map(k => k.nama).join(", ") || "";

    const idsToProcess = Array.from(selectedIds);
    let successCount = 0;

    for (let i = 0; i < idsToProcess.length; i++) {
      const id = idsToProcess[i];
      try {
        const { data: recipe } = await supabase.from('resep').select('*').eq('id', id).single();
        
        if (recipe) {
          setBulkProgress(`🤖 Menganalisa & Mengkategori: ${recipe.nama}...`);
          
          // --- LANGKAH 2: Panggil AI dengan parameter tambahan stringKategori ---
          const res = await mintaResepKeAI(
            recipe.nama, 
            recipe.deskripsi || "", 
            recipe.bahan || "",
            recipe.alat || "",
            stringKategori // Mengirim daftar kategori ke AI
          );
          
          // --- LANGKAH 3: Cari ID kategori yang cocok dengan pilihan AI ---
          const kategoriFinal = dbKategori?.find(
            k => k.nama.toLowerCase() === res.kategori_disarankan?.toLowerCase()
          );

          // --- LANGKAH 4: Update resep & kategori_id sekaligus ---
          const { error: updateError } = await supabase
            .from('resep')
            .update({ 
              deskripsi: res.deskripsi || "", 
              langkah: Array.isArray(res.langkah) ? res.langkah : [],
              kategori_id: kategoriFinal ? kategoriFinal.id : recipe.kategori_id 
            })
            .eq('id', id);

          if (updateError) throw updateError;
          successCount++;
          
          if (i < idsToProcess.length - 1) {
            setBulkProgress(`⚡ Menyiapkan menu berikutnya... (${idsToProcess.length - (i+1)} tersisa)`);
            await delay(1500); 
          }
        }
      } catch (e: any) { 
        console.error(`Gagal pada ID ${id}:`, e);
      }
    }

    setIsBulkProcessing(false);
    setSelectedIds(new Set());
    toast.success(`Berhasil! ${successCount} Menu telah memiliki resep & kategori.`);
    fetchRecipes();
  };

  if (loading && !isBulkProcessing) return <Layout title="Admin"><div className="p-8 text-center">Memuat Data...</div></Layout>;

  return (
    <Layout title="Admin Dashboard">
      {isBulkProcessing && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col justify-center items-center text-white p-6 text-center backdrop-blur-md">
          <div className="relative mb-6">
             <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
             <div className="absolute inset-0 flex items-center justify-center font-black text-purple-400 text-xl">AI</div>
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight animate-pulse">{bulkProgress}</h2>
          <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
            AI sedang menyinkronkan data. Mohon tunggu sebentar.
          </p>
        </div>
      )}
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
         <div className="flex items-center gap-4">
            <h2 className="font-bold text-gray-700">Daftar Menu</h2>
            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkGenerate} 
                disabled={isBulkProcessing}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:shadow-purple-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>✨ Detailkan & Kategorikan ({selectedIds.size})</span>
              </button>
            )}
         </div>
         <Link to="/admin/resep/tambah" className="bg-balista-secondary text-white px-6 py-2 rounded-xl font-bold hover:brightness-110 transition-all">+ Tambah Menu Baru</Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs md:text-sm">
              <tr>
                <th className="p-5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    onChange={(e) => setSelectedIds(e.target.checked ? new Set(recipes.map(r => r.id)) : new Set())} 
                  />
                </th>
                <th className="p-5 font-bold uppercase text-gray-500 tracking-wider">Nama Menu</th>
                <th className="p-5 font-bold uppercase text-gray-500 tracking-wider">Status Resep</th>
                <th className="p-5 text-right font-bold uppercase text-gray-500 tracking-wider">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recipes.map(r => {
                const isComplete = Array.isArray(r.langkah) && r.langkah.length > 0;
                
                return (
                  <tr key={r.id} className="hover:bg-purple-50/30 transition-colors group">
                    <td className="p-5">
                      <input 
                        type="checkbox" 
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        checked={selectedIds.has(r.id)} 
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(r.id)) next.delete(r.id);
                          else next.add(r.id);
                          setSelectedIds(next);
                        }} 
                      />
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors leading-tight">
                        {r.nama}
                      </div>
                      <div className="mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                          r.kategori?.nama 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                          : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                          {r.kategori?.nama || 'Tanpa Kategori'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      {isComplete ? 
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Lengkap
                        </span> : 
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Butuh AI
                        </span>
                      }
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => navigate(`/admin/resep/edit/${r.id}`)} 
                        className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;