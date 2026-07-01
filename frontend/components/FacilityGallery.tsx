"use client";

import { useState, useEffect } from "react";
import { Building2, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const iconMap: Record<string, React.ReactNode> = {
  Wifi: <Building2 className="w-8 h-8" />,
  Server: <Building2 className="w-8 h-8" />,
  Laptop: <Building2 className="w-8 h-8" />,
  MonitorPlay: <Building2 className="w-8 h-8" />,
  BookOpen: <Building2 className="w-8 h-8" />,
};

type Facility = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  images?: string[];
  icon: string;
};

export function FacilityGallery({ facilities, profile }: { facilities: Facility[], profile: any }) {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Auto-play for the modal carousel
  useEffect(() => {
    if (!selectedFacility) return;
    const images = selectedFacility.images && selectedFacility.images.length > 0 
      ? selectedFacility.images 
      : (selectedFacility.imageUrl ? [selectedFacility.imageUrl] : []);
    
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [selectedFacility, currentImageIdx]);

  const openModal = (f: Facility) => {
    setSelectedFacility(f);
    setCurrentImageIdx(0);
  };

  const closeModal = () => {
    setSelectedFacility(null);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedFacility) return;
    const images = selectedFacility.images && selectedFacility.images.length > 0 ? selectedFacility.images : [selectedFacility.imageUrl];
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedFacility) return;
    const images = selectedFacility.images && selectedFacility.images.length > 0 ? selectedFacility.images : [selectedFacility.imageUrl];
    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const modalImages = selectedFacility 
    ? (selectedFacility.images && selectedFacility.images.length > 0 ? selectedFacility.images : (selectedFacility.imageUrl ? [selectedFacility.imageUrl] : []))
    : [];

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      
      <main className="pt-28 pb-20 bg-white min-h-screen">
        <div className="container-page">
          <div className="text-center mb-20">
            <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600 mb-4 bg-rosebrand-50 px-5 py-2.5 rounded-full shadow-sm">
              <Building2 size={18} />
              Infrastruktur & Layanan
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 tracking-tight">
              Fasilitas Terkini
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto font-medium">
              Eksplorasi laboratorium canggih dan fasilitas modern yang kami sediakan untuk menunjang kompetensi standar industri bagi siswa-siswi.
            </p>
          </div>

          <div className="flex flex-col gap-16 md:gap-24 max-w-6xl mx-auto">
            {facilities.map((facility, idx) => {
              const coverImage = (facility.images && facility.images.length > 0) ? facility.images[0] : facility.imageUrl;
              const isEven = idx % 2 === 0;

              return (
                <div key={facility.id} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-10 md:gap-16 items-center group cursor-pointer`} onClick={() => openModal(facility)}>
                  
                  {/* Image Column */}
                  <div className="w-full md:w-1/2 relative">
                    <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-xl group-hover:shadow-2xl group-hover:shadow-rosebrand-500/20 transition-all duration-500">
                      {coverImage ? (
                        <>
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverImage} alt={facility.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                          <Building2 size={64} />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-rosebrand-600 shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-500 delay-100">
                          <Search className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Column */}
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <div className="w-14 h-14 bg-rosebrand-50 rounded-2xl flex items-center justify-center text-rosebrand-600 mb-6 group-hover:-rotate-12 transition-transform duration-500">
                      {iconMap[facility.icon] || <Building2 className="w-6 h-6" />}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 group-hover:text-rosebrand-600 transition-colors">
                      {facility.name}
                    </h2>
                    <p className="text-lg text-zinc-600 leading-relaxed">
                      {facility.description}
                    </p>
                    <div className="mt-8">
                      <span className="inline-flex items-center gap-2 font-bold text-rosebrand-600 border-b-2 border-transparent group-hover:border-rosebrand-600 pb-1 transition-all">
                        Lihat Detail <ChevronRight size={18} />
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer profile={profile} />

      {/* Detail Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-md p-4 sm:p-8" onClick={closeModal}>
          <div className="w-full max-w-6xl max-h-full flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full text-zinc-800 transition-colors shadow-sm">
              <X size={24} />
            </button>

            {/* Modal Image Carousel */}
            <div className="w-full md:w-3/5 bg-black relative flex items-center justify-center min-h-[300px] md:min-h-[600px] group/carousel">
              {modalImages.length > 0 ? (
                <>
                  <img src={modalImages[currentImageIdx]} alt={selectedFacility.name} className="w-full h-full object-contain max-h-[70vh] md:max-h-[85vh] transition-all duration-300" key={currentImageIdx} />
                  
                  {modalImages.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                        <ChevronRight size={24} />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {modalImages.map((_, i) => (
                          <button key={i} onClick={() => setCurrentImageIdx(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Building2 size={64} className="text-zinc-700" />
              )}
            </div>

            {/* Modal Content Info */}
            <div className="w-full md:w-2/5 p-8 md:p-12 overflow-y-auto flex flex-col justify-center bg-zinc-50">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rosebrand-600 mb-6 shadow-sm border border-zinc-100">
                {iconMap[selectedFacility.icon] || <Building2 className="w-8 h-8" />}
              </div>
              <h2 className="text-3xl font-black text-zinc-900 mb-4">{selectedFacility.name}</h2>
              <p className="text-lg text-zinc-600 leading-relaxed">
                {selectedFacility.description}
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
