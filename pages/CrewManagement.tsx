import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import AddCrewModal from '../components/AddCrewModal';
import toast from 'react-hot-toast';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

const CrewManagement = () => {
  const [crews, setCrews] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: crewData } = await supabase.from('crews').select('*').order('created_at', { ascending: false });
      const { data: profileData } = await supabase.from('profiles').select('*');
      setCrews(crewData || []);
      setProfiles(profileData || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteCrew = async (id: string) => {
    if (window.confirm("Yakin ingin menghapus crew ini?")) {
      const { error } = await supabase.from('crews').delete().eq('id', id);
      if (error) toast.error("Gagal menghapus");
      else {
        toast.success("Crew dihapus");
        fetchData();
      }
    }
  };

  const toggleRole = async (profileId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'crew' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    if (error) toast.error("Gagal mengubah role");
    else {
      toast.success(`Role diubah menjadi ${newRole}`);
      fetchData();
    }
  };

  return (
    <Layout title="Manage Crew Balista">
      <div className="max-w-6xl mx-auto p-8 text-gray-800">
        <div className="mb-10">
          <h2 className="text-2xl font-black mb-6 uppercase italic">🔐 Akses Akun Login</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {profiles.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-3xl shadow-md border flex justify-between items-center">
                <div>
                  <p className="font-bold">{p.email}</p>
                  <p className="text-sm text-orange-600 font-black uppercase">{p.role}</p>
                </div>
                <button 
                  onClick={() => toggleRole(p.id, p.role)}
                  className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-500 hover:text-white transition-all"
                >
                  UBAH ROLE
                </button>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-10" />

        <h2 className="text-2xl font-black mb-6 uppercase italic">👥 Daftar Staff Pajangan</h2>
        <AddCrewModal onRefresh={fetchData} />

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-6 font-black uppercase text-xs">Staff</th>
                <th className="p-6 font-black uppercase text-xs text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {crews.map((crew) => (
                <tr key={crew.id}>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img 
                        src={getGoogleDriveImageUrl(crew.foto_url)} 
                        className="w-12 h-12 rounded-xl object-cover"
                        alt={crew.nama}
                        onError={(e: any) => { e.currentTarget.src = "https://placehold.co/100x100?text=Staff"; }}
                      />
                      <span className="font-bold">{crew.nama}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button onClick={() => deleteCrew(crew.id)} className="text-red-500 font-bold hover:underline">Hapus</button>
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

export default CrewManagement;