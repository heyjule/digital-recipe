import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import CrewCard from '../components/CrewCard';

const OurTeam = () => {
  const [crews, setCrews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrews = async () => {
      const { data } = await supabase
        .from('crews')
        .select('*')
        .eq('status', 'Aktif')
        .order('created_at', { ascending: true });
      
      setCrews(data || []);
      setLoading(false);
    };
    fetchCrews();
  }, []);

  return (
    <Layout title="Our Team - Balista">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">
            Meet Our <span className="text-[#cd5b19]">Team</span>
          </h1>
          <p className="text-gray-400 font-medium text-xl italic">"Dibalik setiap resep lezat, ada tim yang hebat."</p>
        </div>

        {loading ? (
          <div className="text-center py-20 animate-pulse font-bold text-gray-300">Memuat profil tim...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {crews.map((crew) => (
              <CrewCard key={crew.id} crew={crew} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OurTeam;