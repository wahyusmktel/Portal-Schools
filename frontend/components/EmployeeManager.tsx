"use client";

import { useState, FormEvent, DragEvent, useRef } from "react";
import { 
  Plus, Edit2, Trash2, X, Users, UploadCloud, AlertCircle, Search, 
  ChevronLeft, ChevronRight, FileSpreadsheet, Download, CheckCircle2, 
  RefreshCw, FileText
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

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

type ParsedEmployeeRow = {
  name: string;
  role: string;
  gender: "L" | "P";
  biography: string;
  imageUrl: string;
  socialLinks: SocialLink[];
  employmentPeriod: string;
  isActive: boolean;
  sortOrder: number;
  isValid: boolean;
  errorReason?: string;
};

const DEFAULT_MALE_AVATAR = "/images/avatars/avatar-male.svg";
const DEFAULT_FEMALE_AVATAR = "/images/avatars/avatar-female.svg";

function detectGender(name: string, role: string, genderStr?: string): "L" | "P" {
  if (genderStr) {
    const trimmed = genderStr.trim().toLowerCase();
    if (["p", "perempuan", "wanita", "female", "w", "f"].includes(trimmed)) {
      return "P";
    }
    if (["l", "laki-laki", "pria", "male", "m"].includes(trimmed)) {
      return "L";
    }
  }

  const nameLower = name.toLowerCase();
  const roleLower = role.toLowerCase();

  // Pattern detection for Indonesian names & roles
  if (
    /\b(ibu|bu|siti|sri|ayu|dewi|putri|nur|novi|fitri|indah|anisa|perempuan|wanita|diah|ratna|mira|titi|linda|lilis|nita)\b/.test(nameLower) ||
    roleLower.includes("wanita") ||
    roleLower.includes("perempuan")
  ) {
    return "P";
  }

  return "L";
}

function getDefaultAvatar(gender: "L" | "P"): string {
  return gender === "P" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR;
}

export function EmployeeManager({ initialItems }: { initialItems: Employee[] }) {
  const [items, setItems] = useState<Employee[]>(initialItems || []);
  const [isEditing, setIsEditing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Search, Filter, Pagination
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Single Form State
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState<"L" | "P">("L");
  const [biography, setBiography] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [socialLinksText, setSocialLinksText] = useState("");
  const [employmentPeriod, setEmploymentPeriod] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  
  const [notice, setNotice] = useState<{type: 'success'|'error', message: string} | null>(null);

  // Excel Import States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEmployeeRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [isImportDragging, setIsImportDragging] = useState(false);

  // Drag and Drop State for single photo
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

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
    setGender("L");
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

  function resetImportState() {
    setImportFile(null);
    setParsedData([]);
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
    setIsImportModalOpen(false);
  }

  function handleEdit(item: Employee) {
    setId(item.id);
    setName(item.name);
    setRole(item.role);
    const g = detectGender(item.name, item.role);
    setGender(g);
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

  // Excel Drag & Drop Handlers
  const handleExcelDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsImportDragging(true);
  };

  const handleExcelDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsImportDragging(false);
  };

  const handleExcelDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsImportDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setImportFile(file);
        parseExcelFile(file);
      } else {
        alert('Mohon unggah berkas Excel (.xlsx, .xls) atau CSV.');
      }
    }
  };

  function parseExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const parsed: ParsedEmployeeRow[] = json.map((row, idx) => {
          const findVal = (keys: string[]) => {
            for (const key of keys) {
              const foundKey = Object.keys(row).find(
                k => k.trim().toLowerCase() === key.toLowerCase()
              );
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== "") {
                return String(row[foundKey]).trim();
              }
            }
            return "";
          };

          const rowName = findVal(["nama lengkap*", "nama lengkap", "nama", "name"]);
          const rowRole = findVal(["jabatan*", "jabatan", "peran", "role"]);
          const genderVal = findVal(["jenis kelamin (l/p)", "jenis kelamin", "gender", "jk"]);
          const bio = findVal(["biografi", "bio", "biography"]);
          let imgUrl = findVal(["foto profil url (opsional)", "foto profil", "foto", "image url", "image"]);
          const statusVal = findVal(["status (aktif/tidak aktif)", "status", "is active", "aktif"]);
          const period = findVal(["periode kerja (jika tidak aktif)", "periode kerja", "periode", "employment period"]);
          const socialVal = findVal(["sosial media (format: label=url)", "sosial media (format: instagram=url)", "sosial media", "social links", "social"]);

          const rowGender = detectGender(rowName, rowRole, genderVal);

          // Assign default gender avatar if profile picture is empty
          if (!imgUrl) {
            imgUrl = getDefaultAvatar(rowGender);
          }

          const isRowActive = statusVal === "" ? true : !["tidak aktif", "nonaktif", "false", "0", "purna", "inactive"].includes(statusVal.toLowerCase());

          const socialLinks: SocialLink[] = socialVal
            ? socialVal.split(/[\n,;]+/).map(s => {
                const [lbl, ...val] = s.split("=");
                return { label: (lbl || "Social").trim(), value: val.join("=").trim() };
              }).filter(s => s.value !== "")
            : [];

          const isValid = Boolean(rowName && rowRole);
          const errorReason = !rowName ? "Nama wajib diisi" : !rowRole ? "Jabatan wajib diisi" : undefined;

          return {
            name: rowName,
            role: rowRole,
            gender: rowGender,
            biography: bio,
            imageUrl: imgUrl,
            socialLinks,
            employmentPeriod: isRowActive ? "" : period,
            isActive: isRowActive,
            sortOrder: idx + 1,
            isValid,
            errorReason
          };
        });

        setParsedData(parsed);
        setImportResult(null);
      } catch (err) {
        alert("Gagal membaca berkas Excel. Pastikan format file sesuai.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadTemplate() {
    const headers = [
      [
        "Nama Lengkap*", 
        "Jabatan*", 
        "Jenis Kelamin (L/P)", 
        "Biografi", 
        "Foto Profil URL (Opsional)", 
        "Status (Aktif/Tidak Aktif)", 
        "Periode Kerja (Jika Tidak Aktif)", 
        "Sosial Media (Format: Label=URL)"
      ],
      [
        "Dr. Budi Santoso, M.Pd", 
        "Kepala Sekolah", 
        "L", 
        "Kepala Sekolah SMK Telkom yang berdedikasi.", 
        "", 
        "Aktif", 
        "", 
        "Instagram=https://instagram.com/budisantoso"
      ],
      [
        "Siti Rahmawati, S.Pd", 
        "Guru Matematika", 
        "P", 
        "Guru Matematika berprestasi.", 
        "", 
        "Aktif", 
        "", 
        "Instagram=https://instagram.com/sitirahma"
      ],
      [
        "Drs. Ahmad Hidayat", 
        "Guru Bahasa Indonesia", 
        "L", 
        "Guru senior pengampu mata pelajaran Bahasa Indonesia.", 
        "", 
        "Tidak Aktif", 
        "2010 - 2024", 
        "Email=mailto:ahmad@smktelkom.sch.id"
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(headers);
    
    // Set column widths for convenience
    ws['!cols'] = [
      { wch: 25 }, // Nama Lengkap
      { wch: 22 }, // Jabatan
      { wch: 20 }, // Jenis Kelamin
      { wch: 40 }, // Biografi
      { wch: 30 }, // Foto Profil URL
      { wch: 22 }, // Status
      { wch: 25 }, // Periode Kerja
      { wch: 40 }  // Sosial Media
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Pegawai");
    XLSX.writeFile(wb, "Template_Import_Pegawai_SMK_Telkom.xlsx");
  }

  async function processImport() {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportProgress(0);
    let successCount = 0;
    let failedCount = 0;
    const newItems: Employee[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const payload = {
        name: row.name,
        role: row.role,
        biography: row.biography,
        imageUrl: row.imageUrl,
        socialLinks: row.socialLinks,
        employmentPeriod: row.employmentPeriod,
        isActive: row.isActive,
        sortOrder: Number(row.sortOrder)
      };

      try {
        const res = await fetch(`${API_URL}/employees`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const resData = await res.json();
          successCount++;
          newItems.push({
            ...payload,
            id: resData.id
          } as Employee);
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }

    setImporting(false);
    setImportResult({ success: successCount, failed: failedCount });
  }

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

    // Default gender avatar assignment if no custom image was provided or uploaded
    if (!finalImageUrl) {
      const selectedGender = gender || detectGender(name, role);
      finalImageUrl = getDefaultAvatar(selectedGender);
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
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-xl font-black text-zinc-800">Daftar Pegawai</h2>
          <p className="text-sm text-zinc-500 mt-1">Total: {items.length} profil tercatat</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileSpreadsheet size={18} />
            Import Excel
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-rosebrand-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-rosebrand-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={18} />
            Tambah Pegawai
          </button>
        </div>
      </div>

      {/* Search & Filter */}
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

      {/* Excel Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl my-8 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-5 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">Import Data Pegawai dari Excel</h2>
                    <p className="text-xs text-zinc-500">Tambahkan banyak data pegawai sekaligus dengan format file spreadsheet.</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={resetImportState} 
                  disabled={importing}
                  className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 rounded-full hover:bg-zinc-100 transition disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 grid gap-6">
                {/* Template Download Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <FileText className="text-emerald-600 shrink-0" size={24} />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Belum punya format Excel yang sesuai?</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Unduh berkas contoh template Excel untuk diisi data pegawai sekolah Anda.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    <Download size={14} />
                    Unduh Template Excel
                  </button>
                </div>

                {/* Upload File Zone */}
                {!importFile ? (
                  <div 
                    onDragOver={handleExcelDragOver}
                    onDragLeave={handleExcelDragLeave}
                    onDrop={handleExcelDrop}
                    onClick={() => excelInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                      isImportDragging ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      className="hidden" 
                      ref={excelInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImportFile(file);
                          parseExcelFile(file);
                        }
                      }}
                    />
                    <div className="p-4 rounded-full bg-white shadow-sm border border-zinc-100 text-emerald-600 mb-3">
                      <UploadCloud size={32} />
                    </div>
                    <p className="text-sm font-bold text-zinc-800">Klik untuk memilih file atau seret file ke sini</p>
                    <p className="text-xs text-zinc-500 mt-1">Mendukung file berformat .XLSX, .XLS, atau .CSV</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {/* Selected File Info */}
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="flex items-center gap-3 truncate">
                        <FileSpreadsheet className="text-emerald-600 shrink-0" size={24} />
                        <div className="truncate">
                          <p className="text-sm font-bold text-zinc-800 truncate">{importFile.name}</p>
                          <p className="text-xs text-zinc-500">{(importFile.size / 1024).toFixed(1)} KB • {parsedData.length} baris terdeteksi</p>
                        </div>
                      </div>
                      {!importing && !importResult && (
                        <button
                          onClick={() => { setImportFile(null); setParsedData([]); }}
                          className="px-3 py-1.5 text-xs font-bold text-rosebrand-600 hover:bg-rosebrand-50 rounded-lg transition"
                        >
                          Ganti File
                        </button>
                      )}
                    </div>

                    {/* Progress Bar when importing */}
                    {importing && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-2">
                          <span>Mengimpor data pegawai ke database...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-600 transition-all duration-300 rounded-full" 
                            style={{ width: `${importProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Import Result Notification */}
                    {importResult && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Proses Import Selesai!</p>
                          <p className="text-xs text-emerald-700 mt-1">
                            Berhasil menambahkan <strong>{importResult.success}</strong> pegawai baru. 
                            {importResult.failed > 0 && ` (Gagal: ${importResult.failed} pegawai)`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                          Pratinjau Data ({parsedData.filter(r => r.isValid).length} Valid dari {parsedData.length} Baris)
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          *Foto kosong otomatis diberikan avatar default pria/wanita
                        </span>
                      </div>
                      
                      <div className="max-h-[350px] overflow-y-auto overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-100/70 text-zinc-700 font-bold border-b border-zinc-200 sticky top-0">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">Avatar</th>
                              <th className="p-3">Nama Lengkap</th>
                              <th className="p-3">Jabatan</th>
                              <th className="p-3">Gender</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Validasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {parsedData.map((row, idx) => (
                              <tr key={idx} className={row.isValid ? "hover:bg-zinc-50/80" : "bg-red-50/40"}>
                                <td className="p-3 font-mono text-zinc-400">{idx + 1}</td>
                                <td className="p-3">
                                  <img 
                                    src={row.imageUrl} 
                                    alt="Avatar" 
                                    className="w-8 h-8 rounded-full object-cover border border-zinc-200 bg-white"
                                  />
                                </td>
                                <td className="p-3 font-bold text-zinc-800">{row.name || <span className="text-red-500 italic">(Kosong)</span>}</td>
                                <td className="p-3 text-zinc-600">{row.role || <span className="text-red-500 italic">(Kosong)</span>}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.gender === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {row.gender === 'P' ? 'Wanita (P)' : 'Pria (L)'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-700'}`}>
                                    {row.isActive ? 'Aktif' : 'Purna'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {row.isValid ? (
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Valid
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-bold flex items-center gap-1">
                                      <AlertCircle size={12} /> {row.errorReason}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button 
                  type="button" 
                  onClick={resetImportState}
                  disabled={importing}
                  className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {importResult ? "Tutup" : "Batal"}
                </button>
                
                {parsedData.length > 0 && !importResult && (
                  <button 
                    type="button" 
                    onClick={processImport}
                    disabled={importing || parsedData.filter(r => r.isValid).length === 0}
                    className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        Mulai Import ({parsedData.filter(r => r.isValid).length} Pegawai)
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single Employee Form Modal */}
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
                          <img 
                            src={getDefaultAvatar(gender)} 
                            alt="Default Avatar" 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-semibold text-zinc-700 flex items-center justify-center sm:justify-start gap-2">
                          <UploadCloud size={18} className="text-rosebrand-500" />
                          Pilih foto atau seret ke sini
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Jika dikosongkan, avatar default {gender === 'P' ? 'wanita' : 'pria'} akan digunakan secara otomatis.</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Jenis Kelamin (Untuk Avatar Default)
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value as "L" | "P")}
                        className="rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 focus:ring-2 focus:ring-rosebrand-500/20 transition-all bg-white font-medium cursor-pointer"
                      >
                        <option value="L">Laki-laki (Pria)</option>
                        <option value="P">Perempuan (Wanita)</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Urutan Tampil (Makin kecil makin awal)
                      <input
                        type="number"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                        className="rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 transition-all bg-white"
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

                  <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-100">
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

      {/* Main List Table */}
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
