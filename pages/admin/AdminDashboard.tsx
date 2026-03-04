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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nama: '', kategori: 'Mentai Rice', foto_url: '', deskripsi: '', bahan: '', alat: '', langkah: '', potongan: ''
  });

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    const { data } = await supabase.from('resep').select('*').order('created_at', { ascending: false });
    setRecipes(data || []);
  };

  const addMeasure = (value: string) => {
    setFormData(prev => ({
      ...prev,
      bahan: prev.bahan ? `${prev.bahan.trim()} ${value} ` : `${value} `
    }));
  };

  const addNewLine = () => {
    setFormData(prev => ({ ...prev, bahan: prev.bahan.trim() + '\n' }));
  };

  const cleanFormat = (text: any) => {
    if (!text) return '';
    return String(text).replace(/[{}"]/g, '').split(';').map(t => t.trim().replace(/\|/g, ' ')).join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toast.loading("Menyinkronkan Format Menu...");
    
    try {
      const formatBahanStandard = (text: string) => {
        if (!text) return "";
        return text.split('\n').map(line => {
          const trimmed = line.trim();
          const match = trimmed.match(/(\d+)/);
          if (match && match.index !== undefined) {
            const nama = trimmed.substring(0, match.index).trim();
            const takaran = trimmed.substring(match.index).trim();
            return `${nama}|${takaran}`;
          }
          return trimmed;
        }).filter(i => i !== "").join(';');
      };

      const formatAlatStandard = (text: string) => {
        if (!text) return "";
        return text.split('\n').map(i => i.trim()).filter(i => i !== "").join(';');
      };

      const payload = {
        nama: formData.nama,
        foto_url: formData.foto_url,
        deskripsi: formData.deskripsi || 'SOP Standar Menu Balista',
        potongan: formData.potongan,
        bahan: formatBahanStandard(formData.bahan),
        alat: formatAlatStandard(formData.alat),
        langkah: formData.langkah ? formData.langkah.split('\n').map(i => i.trim()).filter(i => i !== "") : []
      };

      let savedData;
      if (editingRecipe) {
        const { data, error } = await supabase.from('resep').update(payload).eq('id', editingRecipe.id).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase.from('resep').insert([payload]).select().single();
        if (error) throw error;
        savedData = data;
      }

      // FUNGSI OTOMASI AI TETAP ADA [cite: 599, 682]
      if (savedData) {
        toast.loading(`✨ AI merapikan SOP ${savedData.nama}...`, { id: tid });
        const aiRes = await generateRecipeDetails(savedData);
        if (aiRes && aiRes.steps) {
          const shortSteps = aiRes.steps.slice(0, 6).map((s: string) => s.replace(/"/g, "'").trim());
          await supabase.from('resep').update({ deskripsi: aiRes.description, langkah: shortSteps }).eq('id', savedData.id);
        }
      }

      toast.success("Berhasil! Menu tersimpan", { id: tid });
      setIsModalOpen(false);
      fetchRecipes();
    } catch (err: any) {
      toast.error(`Gagal: ${err.message}`, { id: tid });
    }
  };

  // PERBAIKAN FITUR HAPUS MENU [cite: 589]
  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    const tid = toast.loading("Menghapus menu...");
    try {
      const { error } = await supabase.from('resep').delete().eq('id', recipeToDelete.id);
      if (error) throw error;
      
      toast.success("Menu Berhasil Dihapus", { id: tid });
      setIsDeleteOpen(false);
      setRecipeToDelete(null);
      fetchRecipes();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`, { id: tid });
    }
  };

  const handleStartAutomation = async () => {
    const targetRecipes = recipes.filter(r => selectedIds.includes(r.id));
    if (targetRecipes.length === 0) return toast.error("Pilih menu!");
    setIsConfirmOpen(false);
    setIsBulkLoading(true);
    for (let i = 0; i < targetRecipes.length; i++) {
      const recipe = targetRecipes[i];
      setCurrentProcessing(recipe.nama);
      setProgressIndex(i + 1);
      try {
        const res = await generateRecipeDetails(recipe);
        if (res && res.steps) {
          const shortSteps = res.steps.slice(0, 6).map((s: string) => s.replace(/"/g, "'").trim());
          await supabase.from('resep').update({ deskripsi: res.description, langkah: shortSteps }).eq('id', recipe.id);
        }
        await new Promise(res => setTimeout(res, 800)); 
      } catch (err) { console.error(err); }
    }
    setIsBulkLoading(false);
    setSelectedIds([]);
    toast.success("Otomasi Selesai!");
    fetchRecipes(); 
  };

 useEffect(() => { 
  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email?.toLowerCase() || "";
    
    // Jika bukan admin utama, tendang keluar ke halaman Crew
    if (userEmail !== 'tasya.officebalista@gmail.com') {
      toast.error("Akses Ditolak: Halaman khusus Admin Office");
      window.location.href = '/'; 
      return;
    }
    
    fetchRecipes(); 
  };

  checkAccess();
}, []);

  return (
    <Layout title="Admin Dashboard">
      <div className="p-8 text-left bg-[#fdf8f0] min-h-screen relative">
        <div className="flex justify-between items-center mb-10 bg-white p-10 rounded-[45px] shadow-sm border border-gray-100">
          <div>
            <h2 className="font-black text-3xl uppercase tracking-tighter text-gray-800 italic">Manajemen SOP</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Digital Recipe System</p>
          </div>
          <div className="flex gap-4">
            <button disabled={selectedIds.length === 0} onClick={() => setIsConfirmOpen(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black text-[11px] uppercase shadow-xl hover:scale-105 disabled:opacity-30 transition-all">✨ OTOMASI AI ({selectedIds.length})</button>
            <button onClick={() => { setEditingRecipe(null); setFormData({nama:'', kategori:'Mentai Rice', foto_url:'', deskripsi:'', bahan:'', alat:'', langkah:'', potongan:''}); setIsModalOpen(true); }} className="bg-[#d35400] text-white px-10 py-4 rounded-3xl font-black text-[11px] uppercase shadow-xl hover:scale-105 transition-all">+ TAMBAH MENU</button>
          </div>
        </div>

        <div className="bg-white rounded-[50px] shadow-sm overflow-hidden border border-gray-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-12 py-8 w-10 text-center">
                   <input type="checkbox" checked={selectedIds.length === recipes.length && recipes.length > 0} onChange={() => {
                    if (selectedIds.length === recipes.length) setSelectedIds([]);
                    else setSelectedIds(recipes.map(r => r.id));
                  }} className="w-6 h-6 rounded-md accent-[#d35400]" />
                </th>
                <th className="px-6 py-8 font-black uppercase tracking-tighter">Nama Menu</th>
                <th className="px-6 py-8 font-black uppercase tracking-tighter">Deskripsi</th>
                <th className="px-12 py-8 text-center font-black uppercase tracking-tighter">Status</th>
                <th className="px-12 py-8 text-right font-black uppercase tracking-tighter">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 font-bold hover:bg-gray-50/50 transition-all">
                  <td className="px-12 py-6 text-center">
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => setSelectedIds(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id])} className="w-6 h-6 rounded-md accent-[#d35400]" />
                  </td>
                  <td className="px-6 py-6 uppercase tracking-tighter text-gray-700 text-[15px]">{r.nama}</td>
                  <td className="px-6 py-6 text-gray-400 italic text-[11px] truncate max-w-[200px]">{r.deskripsi}</td>
                  <td className="px-12 py-6 text-center">
                    {(!r.langkah || r.langkah.length === 0) ? <span className="text-red-500 bg-red-50 px-5 py-2 rounded-full text-[9px] font-black uppercase italic tracking-widest">⚠️ Kosong</span> : <span className="text-green-600 bg-green-50 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">✅ Lengkap</span>}
                  </td>
                  <td className="px-12 py-6 text-right font-black">
                    <button onClick={() => { setEditingRecipe(r); setFormData({nama: r.nama, kategori: r.kategori, foto_url: r.foto_url || '', deskripsi: r.deskripsi || '', bahan: cleanFormat(r.bahan), alat: cleanFormat(r.alat), langkah: (r.langkah || []).join('\n'), potongan: r.potongan || ''}); setIsModalOpen(true); }} className="text-indigo-600 uppercase text-[10px] hover:underline mr-6">Edit</button>
                    <button onClick={() => { setRecipeToDelete(r); setIsDeleteOpen(true); }} className="text-red-500 uppercase text-[10px] hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL KONFIRMASI HAPUS */}
        {isDeleteOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[45px] p-12 max-w-md w-full shadow-2xl text-center border border-gray-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-gray-800 mb-2">Hapus Menu?</h3>
              <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed">Apakah Anda yakin ingin menghapus menu <span className="text-red-500">"{recipeToDelete?.nama}"</span>? Data yang dihapus tidak dapat dikembalikan.</p>
              <div className="flex gap-4">
                <button onClick={handleDeleteRecipe} className="flex-1 bg-red-500 text-white py-4 rounded-[25px] font-black uppercase text-[11px] shadow-lg hover:bg-red-600 transition-all">Ya, Hapus</button>
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-[25px] font-black uppercase text-[11px]">Batal</button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
            <div className="bg-white rounded-[55px] w-full max-w-4xl max-h-[95vh] overflow-y-auto p-12 shadow-2xl border border-gray-100">
              <h3 className="font-black text-2xl uppercase mb-8 tracking-tighter text-gray-800 italic">{editingRecipe ? 'Edit SOP Menu' : 'Tambah Menu Baru'}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Nama Menu</label>
                  <input required className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Potongan / Porsi</label>
                  <input required className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm" placeholder="Contoh: 8 potong" value={formData.potongan} onChange={e => setFormData({...formData, potongan: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Deskripsi Singkat Menu</label>
                  <textarea className="w-full p-5 bg-gray-50 rounded-[25px] h-20 outline-none font-bold text-xs resize-none" placeholder="Contoh: Menu lezat khas Balista Sushi & Tea..." value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex justify-between items-center px-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Bahan-Bahan (Gunakan tombol takaran)</label>
                      <button type="button" onClick={addNewLine} className="bg-gray-800 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all">⏎ Baris Baru</button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-5 bg-orange-50/50 rounded-[35px] border border-orange-100 shadow-inner">
                      <div className="flex flex-wrap gap-2 mb-3 w-full">
                        {['1', '2', '3', '5', '8', '10', '28', '30', '100', '150', '200'].map(num => (
                          <button key={num} type="button" onClick={() => addMeasure(num)} className="bg-white text-gray-700 px-3.5 py-2 rounded-lg text-[11px] font-black border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all">{num}</button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 w-full">
                        {['gr', 'ml', 'pcs', 'lembar', 'buah', 'stick', 'cup', 'sdt', 'sdm', 'potong'].map(unit => (
                          <button key={unit} type="button" onClick={() => addMeasure(unit)} className="bg-[#d35400] text-white px-3.5 py-2 rounded-lg text-[11px] font-black hover:bg-[#b34700] shadow-md uppercase transition-all">{unit}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea required className="w-full p-6 bg-gray-50 rounded-[35px] min-h-[140px] outline-none font-bold text-xs leading-relaxed" placeholder="Stroberi 10 Pcs..." value={formData.bahan} onChange={e => setFormData({...formData, bahan: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Link Foto Menu</label>
                  <input required className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm" value={formData.foto_url} onChange={e => setFormData({...formData, foto_url: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Alat (Per Baris)</label>
                  <textarea className="w-full p-5 bg-gray-50 rounded-[25px] min-h-[120px] outline-none font-bold text-xs" value={formData.alat} onChange={e => setFormData({...formData, alat: e.target.value})} />
                </div>
                <div className="col-span-2 flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[30px] font-black uppercase text-[12px] shadow-xl hover:bg-indigo-700 transition-all">SIMPAN & GENERATE AI</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-400 py-5 rounded-[30px] font-black uppercase text-[12px]">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;