"use client";

import { useState, FormEvent, DragEvent, useRef } from "react";
import { Plus, Edit2, Trash2, X, UploadCloud, AlertCircle, Search, Building2, ImageIcon } from "lucide-react";
import { API_URL } from "@/lib/api";

type Facility = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  images?: string[];
  icon: string;
  sortOrder: number;
};

type FacilityManagerProps = {
  initialItems: Facility[];
};

export function FacilityManager({ initialItems }: FacilityManagerProps) {
  const [items, setItems] = useState<Facility[]>(initialItems || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  
  // Image states
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("");
    setSortOrder(items.length);
    setExistingImages([]);
    setNewFiles([]);
    setNewFilePreviews([]);
    setEditingItem(null);
    setError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: Facility) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setIcon(item.icon);
    setSortOrder(item.sortOrder);
    setExistingImages(item.images || (item.imageUrl ? [item.imageUrl] : []));
    setNewFiles([]);
    setNewFilePreviews([]);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleFilesAdded = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length > 0) {
      setNewFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setNewFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(e.target.files);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/uploads/images`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    if (!res.ok) throw new Error("Gagal mengunggah gambar");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload new files
      const uploadedUrls = await Promise.all(newFiles.map(file => uploadImage(file)));
      
      const combinedImages = [...existingImages, ...uploadedUrls];
      const finalImageUrl = combinedImages.length > 0 ? combinedImages[0] : "";

      const payload = {
        name,
        description,
        icon,
        sortOrder: Number(sortOrder),
        imageUrl: finalImageUrl,
        images: combinedImages,
      };

      const url = editingItem ? `${API_URL}/facilities/${editingItem.id}` : `${API_URL}/facilities`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");
      
      const responseData = await res.json();
      
      const savedItem = {
        ...payload,
        id: editingItem ? editingItem.id : responseData.id
      } as Facility;

      if (editingItem) {
        setItems(items.map(i => i.id === savedItem.id ? savedItem : i));
      } else {
        setItems([...items, savedItem]);
      }
      closeModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus fasilitas ini?")) return;
    try {
      const res = await fetch(`${API_URL}/facilities/${id}`, { 
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setItems(items.filter(i => i.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewFilePreviews(prev => {
      const toRemove = prev[index];
      if (toRemove.startsWith("blob:")) URL.revokeObjectURL(toRemove);
      return prev.filter((_, i) => i !== index);
    });
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[12px] border border-zinc-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari fasilitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rosebrand-500/20 focus:border-rosebrand-500 transition-all"
          />
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-full bg-rosebrand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rosebrand-700 shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Tambah Fasilitas
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map(item => {
          const coverImage = (item.images && item.images.length > 0) ? item.images[0] : item.imageUrl;
          const imageCount = item.images ? item.images.length : (item.imageUrl ? 1 : 0);
          
          return (
            <div key={item.id} className="group relative flex flex-col rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all hover:border-rosebrand-200 hover:shadow-md overflow-hidden">
              <div className="h-48 bg-zinc-100 relative overflow-hidden">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <Building2 size={48} />
                  </div>
                )}
                {imageCount > 1 && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                    <ImageIcon size={12} /> {imageCount} Foto
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(item)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-zinc-700 hover:text-rosebrand-600 shadow-sm">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-zinc-700 hover:text-red-600 shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-zinc-900 line-clamp-1">{item.name}</h3>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2 flex-1">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
              <h2 className="text-xl font-black text-zinc-800">
                {editingItem ? "Edit Fasilitas" : "Tambah Fasilitas"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-zinc-700">Nama Fasilitas</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 focus:border-rosebrand-500 focus:outline-none focus:ring-2 focus:ring-rosebrand-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-zinc-700">Deskripsi Lengkap</label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 focus:border-rosebrand-500 focus:outline-none focus:ring-2 focus:ring-rosebrand-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-zinc-700">Nama Ikon (Opsional)</label>
                      <input
                        type="text"
                        value={icon}
                        onChange={e => setIcon(e.target.value)}
                        placeholder="e.g. Monitor, Server"
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 focus:border-rosebrand-500 focus:outline-none focus:ring-2 focus:ring-rosebrand-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-zinc-700">Urutan Tampil</label>
                      <input
                        type="number"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 focus:border-rosebrand-500 focus:outline-none focus:ring-2 focus:ring-rosebrand-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-zinc-700">Foto Fasilitas (Bisa lebih dari 1)</label>
                  
                  {/* Photo Grid Preview */}
                  {(existingImages.length > 0 || newFilePreviews.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {existingImages.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative h-24 rounded-xl overflow-hidden border border-zinc-200 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Facility" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeExistingImage(idx)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {newFilePreviews.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative h-24 rounded-xl overflow-hidden border border-zinc-200 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="New Upload" className="w-full h-full object-cover opacity-70" />
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">Baru</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeNewImage(idx)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${isDragging ? 'border-rosebrand-500 bg-rosebrand-50' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'}`}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden" />
                    <div className="text-center p-4">
                      <UploadCloud className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-600">Klik / Tarik Gambar Ke Sini</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-zinc-100">
                <button type="button" onClick={closeModal} className="rounded-full px-5 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
                  Batal
                </button>
                <button disabled={loading} type="submit" className="rounded-full bg-rosebrand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rosebrand-700 disabled:opacity-70 shadow-md">
                  {loading ? "Menyimpan..." : "Simpan Fasilitas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
