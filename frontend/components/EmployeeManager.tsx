"use client";

import { useState, FormEvent, DragEvent, useRef } from "react";
import { Plus, Edit2, Trash2, X, Users, UploadCloud, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";

type SocialLink = {
  label: string;
  value: string;
};

type Employee = {
  id: number;
  name: string;
  role: string;
  biography: string;
  imageUrl: string;
  socialLinks: SocialLink[];
  employmentPeriod: string;
  isActive: boolean;
  sortOrder: number;
};

export function EmployeeManager({ initialItems }: { initialItems: Employee[] }) {
  const [items, setItems] = useState<Employee[]>(initialItems);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Search, Filter, Pagination
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [biography, setBiography] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [socialLinksText, setSocialLinksText] = useState("");
  const [employmentPeriod, setEmploymentPeriod] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  
  const [notice, setNotice] = useState<{type: 'success'|'error', message: string} | null>(null);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.role.toLowerCase().includes(search.toLowerCase()))
    .filter(item => {
      if (filterActive === "active") return item.isActive;
      if (filterActive === "inactive") return !item.isActive;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function resetForm() {
    setId(null);
    setName("");
    setRole("");
    setBiography("");
    setImageUrl("");
    setImageFile(null);
    setSocialLinksText("");
    setEmploymentPeriod("");
    setIsActive(true);
    setSortOrder(0);
    setIsEditing(false);
    setNotice(null);
  }

  function handleEdit(item: Employee) {
    setId(item.id);
    setName(item.name);
    setRole(item.role);
    setBiography(item.biography);
    setImageUrl(item.imageUrl);
    setImageFile(null);
    setSocialLinksText((item.socialLinks || []).map(link => `${link.label}=${link.value}`).join('\n'));
    setEmploymentPeriod(item.employmentPeriod);
    setIsActive(item.isActive);
    setSortOrder(item.sortOrder);
    setIsEditing(true);
    setNotice(null);
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
      } else {
        setNotice({ type: 'error', message: 'Format file tidak didukung. Mohon unggah gambar.' });
      }
    }
  };

  async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
    const formData = new FormData();
    formData.append("image", file);
    
    const response = await fetch(`${API_URL}/uploads/images`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": getCookie("csrf_token")
      },
      body: formData,
    }).catch(() => null);
    
    if (response?.ok) {
      const data = await response.json();
      return { ok: true, url: data.url };
    }
    return { ok: false, message: "Gagal mengunggah foto" };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    
    let finalImageUrl = imageUrl;
    
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile);
      if (!uploadResult.ok) {
        setNotice({ type: "error", message: uploadResult.message });
        setLoading(false);
        return;
      }
      finalImageUrl = uploadResult.url;
    }
    
    const socialLinks = socialLinksText.split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('='))
      .map(line => {
        const [label, ...rest] = line.split('=');
        return { label: label.trim(), value: rest.join('=').trim() };
      });
      
    const payload = {
      name,
      role,
      biography,
      imageUrl: finalImageUrl,
      socialLinks,
      employmentPeriod: isActive ? "" : employmentPeriod,
      isActive,
      sortOrder: Number(sortOrder)
    };
    
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/employees/${id}` : `${API_URL}/employees`;
    
    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const responseData = await res.json();
        
        const finalItem = {
          ...payload,
          id: id || responseData.id
        } as Employee;
        
        if (id) {
          setItems(items.map(item => item.id === id ? finalItem : item));
        } else {
          setItems([...items, finalItem]);
        }
        resetForm();
      } else {
        const err = await res.json();
        setNotice({ type: "error", message: err.message || "Gagal menyimpan data" });
      }
    } catch (error) {
      setNotice({ type: "error", message: "Terjadi kesalahan jaringan" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(deleteId: number) {
    if (!confirm("Yakin ingin menghapus pegawai ini?")) return;
    
    try {
      const res = await fetch(`${API_URL}/employees/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      
      if (res.ok) {
        setItems(items.filter(item => item.id !== deleteId));
        
        // Handle pagination edge case when deleting last item on a page
        const newFilteredLength = items.filter(item => item.id !== deleteId).length;
        if (currentPage > 1 && newFilteredLength <= (currentPage - 1) * itemsPerPage) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        alert("Gagal menghapus pegawai");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan");
    }
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-xl font-black text-zinc-800">Daftar Pegawai</h2>
          <p className="text-sm text-zinc-500 mt-1">Total: {items.length} profil tercatat</p>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-rosebrand-500 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-rosebrand-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} />
          Tambah Pegawai
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau jabatan..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-rosebrand-500 focus:ring-2 focus:ring-rosebrand-500/20 outline-none transition bg-white"
          />
        </div>
        <select 
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value as any); setCurrentPage(1); }}
          className="px-4 py-3 rounded-xl border border-zinc-200 focus:border-rosebrand-500 outline-none transition bg-white font-medium text-zinc-700 cursor-pointer min-w-[200px]"
        >
          <option value="all">Semua Status</option>
          <option value="active">Pegawai Aktif</option>
          <option value="inactive">Purna Tugas / Tidak Aktif</option>
        </select>
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-8 relative overflow-hidden"
            >
              <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-5 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-zinc-900">{id ? "Edit Profil Pegawai" : "Tambah Pegawai Baru"}</h2>
                <button type="button" onClick={resetForm} className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 rounded-full hover:bg-zinc-100 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {notice && (
                  <div className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-sm font-bold ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p>{notice.message}</p>
                  </div>
                )}

                <form id="employeeForm" onSubmit={onSubmit} className="grid gap-6">
                  
                  {/* Photo Upload Drag & Drop */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-700">Foto Profil Pegawai</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                        isDragging ? "border-rosebrand-500 bg-rosebrand-50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300"
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                        }}
                      />
                      
                      <div className="shrink-0 relative w-24 h-24 rounded-full bg-white border border-zinc-200 shadow-sm overflow-hidden flex items-center justify-center">
                        {(imageFile || imageUrl) ? (
                          <img 
                            src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Users className="w-8 h-8 text-zinc-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-semibold text-zinc-700 flex items-center justify-center sm:justify-start gap-2">
                          <UploadCloud size={18} className="text-rosebrand-500" />
                          Pilih foto atau seret ke sini
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Format PNG, JPG, JPEG. Maksimal ukuran 2MB disarankan untuk performa terbaik.</p>
                        {imageFile && (
                          <p className="text-xs font-bold text-rosebrand-600 mt-2 truncate w-48 mx-auto sm:mx-0">{imageFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Nama Lengkap *
                      <input
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Cth: Dr. Budi Santoso, M.Pd"
                        className="rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 focus:ring-2 focus:ring-rosebrand-500/20 transition-all bg-white"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Jabatan / Peran *
                      <input
                        required
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder="Cth: Kepala Sekolah"
                        className="rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 focus:ring-2 focus:ring-rosebrand-500/20 transition-all bg-white"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Biografi Singkat
                    <textarea
                      value={biography}
                      onChange={e => setBiography(e.target.value)}
                      placeholder="Ceritakan pengalaman, motto, atau latar belakang singkat..."
                      rows={3}
                      className="rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 focus:ring-2 focus:ring-rosebrand-500/20 transition-all bg-white resize-none"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Sosial Media (Format: Label=URL, satu per baris)
                    <textarea
                      value={socialLinksText}
                      onChange={e => setSocialLinksText(e.target.value)}
                      placeholder="Instagram=https://instagram.com/budisantoso&#10;Linkedin=https://linkedin.com/in/budisantoso"
                      rows={3}
                      className="rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 focus:ring-2 focus:ring-rosebrand-500/20 transition-all bg-white font-mono text-xs"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                    <label className="flex items-center gap-3 text-sm font-bold text-zinc-800 cursor-pointer w-fit">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={e => setIsActive(e.target.checked)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-zinc-300 bg-white checked:border-rosebrand-500 checked:bg-rosebrand-500 transition-all"
                        />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      Status Pegawai Masih Aktif
                    </label>

                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Urutan Tampil (Makin kecil makin awal)
                      <input
                        type="number"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                        className="rounded-lg border border-zinc-200 px-4 py-2 outline-none focus:border-rosebrand-500"
                      />
                    </label>
                  </div>

                  <AnimatePresence>
                    {!isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-900 mt-2">
                          <label className="grid gap-2 text-sm font-bold">
                            Periode Kerja (Ditampilkan karena status Tidak Aktif)
                            <input
                              value={employmentPeriod}
                              onChange={e => setEmploymentPeriod(e.target.value)}
                              placeholder="Contoh: 2012 - 2026"
                              className="rounded-lg border border-orange-200 bg-white px-4 py-2 outline-none focus:border-orange-500 text-zinc-800"
                            />
                          </label>
                          <p className="text-xs text-orange-700 mt-2">Teks ini akan muncul di profil hitam putih untuk mengenang masa bakti mereka.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  form="employeeForm"
                  disabled={loading}
                  className="rounded-xl bg-rosebrand-500 px-8 py-2.5 text-sm font-bold text-white transition hover:bg-rosebrand-600 shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Menyimpan...
                    </>
                  ) : "Simpan Data"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {paginatedItems.map(item => (
          <div key={item.id} className="group flex flex-col sm:flex-row gap-4 items-center justify-between rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:border-rosebrand-200 hover:shadow-md">
            <div className="flex items-center gap-5 w-full">
              <div className="h-20 w-20 shrink-0 rounded-full bg-zinc-50 overflow-hidden border-2 border-zinc-100 group-hover:border-rosebrand-100 transition-colors">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className={`h-full w-full object-cover ${!item.isActive && 'grayscale'}`} />
                ) : (
                  <Users className="h-full w-full p-5 text-zinc-300" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 flex flex-wrap items-center gap-3">
                  {item.name}
                  {!item.isActive && <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full font-bold">Tidak Aktif</span>}
                  {item.isActive && <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold border border-emerald-100">Aktif</span>}
                </h3>
                <p className="text-sm font-medium text-rosebrand-600 mt-0.5">{item.role}</p>
                {item.employmentPeriod && (
                  <p className="text-xs font-semibold text-zinc-400 mt-2 bg-zinc-50 inline-block px-2 py-0.5 rounded">{item.employmentPeriod}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(item)} className="p-2.5 text-zinc-400 hover:text-rosebrand-600 transition bg-zinc-50 rounded-xl hover:bg-rosebrand-50 border border-transparent hover:border-rosebrand-100">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2.5 text-zinc-400 hover:text-red-600 transition bg-zinc-50 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 py-20 text-center flex flex-col items-center gap-4">
            <Search size={48} className="text-zinc-300" />
            <div>
              <h3 className="font-bold text-zinc-700">Data Tidak Ditemukan</h3>
              <p className="text-sm text-zinc-500 mt-1">Tidak ada profil pegawai yang cocok dengan kriteria pencarian/filter.</p>
            </div>
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-500 disabled:opacity-50 hover:bg-zinc-50 hover:text-rosebrand-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-5 py-2 rounded-xl bg-white border border-zinc-100 text-sm font-bold text-zinc-700 flex items-center shadow-sm">
            Halaman {currentPage} dari {totalPages}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-500 disabled:opacity-50 hover:bg-zinc-50 hover:text-rosebrand-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
