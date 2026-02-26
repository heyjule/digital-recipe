import React from 'react';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

interface CrewProps {
  crew: {
    nama: string;
    jabatan: string;
    foto_url: string;
    status: string;
  };
}

const CrewCard = ({ crew }: CrewProps) => {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 group hover:scale-105 transition-all duration-500">
      <div className="h-72 overflow-hidden relative">
        <img 
          src={getGoogleDriveImageUrl(crew.foto_url)} 
          alt={crew.nama}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
          onError={(e: any) => { e.currentTarget.src = "https://placehold.co/400x600?text=Balista+Staff" }}
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#cd5b19] shadow-sm">
            {crew.jabatan}
          </span>
        </div>
      </div>
      <div className="p-6 text-center">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter group-hover:text-[#cd5b19] transition-colors">
          {crew.nama}
        </h3>
        <div className="w-10 h-1 bg-orange-200 mx-auto mt-2 rounded-full"></div>
      </div>
    </div>
  );
};

export default CrewCard;