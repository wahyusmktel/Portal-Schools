"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  Send,
  Upload,
  CreditCard,
  FileText,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  School,
  MapPin,
  Users,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  FileCheck,
  Info,
  Calendar,
  Phone,
  Mail,
  Award,
  AlertCircle,
  X
} from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { downloadSpmbCardPdf, printSpmbCardPdf } from "@/lib/spmb-card";
import type { Major, SpmbRegistration } from "@/types/content";

type Props = {
  majors: Major[];
  academicYear: string;
};

// 38 Provinsi Indonesia
const PROVINCES_LIST = [
  { id: "11", name: "Aceh" },
  { id: "12", name: "Sumatera Utara" },
  { id: "13", name: "Sumatera Barat" },
  { id: "14", name: "Riau" },
  { id: "15", name: "Jambi" },
  { id: "16", name: "Sumatera Selatan" },
  { id: "17", name: "Bengkulu" },
  { id: "18", name: "Lampung" },
  { id: "19", name: "Kepulauan Bangka Belitung" },
  { id: "21", name: "Kepulauan Riau" },
  { id: "31", name: "DKI Jakarta" },
  { id: "32", name: "Jawa Barat" },
  { id: "33", name: "Jawa Tengah" },
  { id: "34", name: "DI Yogyakarta" },
  { id: "35", name: "Jawa Timur" },
  { id: "36", name: "Banten" },
  { id: "51", name: "Bali" },
  { id: "52", name: "Nusa Tenggara Barat" },
  { id: "53", name: "Nusa Tenggara Timur" },
  { id: "61", name: "Kalimantan Barat" },
  { id: "62", name: "Kalimantan Tengah" },
  { id: "63", name: "Kalimantan Selatan" },
  { id: "64", name: "Kalimantan Timur" },
  { id: "65", name: "Kalimantan Utara" },
  { id: "71", name: "Sulawesi Utara" },
  { id: "72", name: "Sulawesi Tengah" },
  { id: "73", name: "Sulawesi Selatan" },
  { id: "74", name: "Sulawesi Tenggara" },
  { id: "75", name: "Gorontalo" },
  { id: "76", name: "Sulawesi Barat" },
  { id: "81", name: "Maluku" },
  { id: "82", name: "Maluku Utara" },
  { id: "91", name: "Papua Barat" },
  { id: "92", name: "Papua" },
  { id: "93", name: "Papua Selatan" },
  { id: "94", name: "Papua Tengah" },
  { id: "95", name: "Papua Pegunungan" },
  { id: "96", name: "Papua Barat Daya" }
];

// Offline fallback Kabupaten/Kota di Lampung
const LAMPUNG_REGENCIES = [
  "Kabupaten Lampung Selatan",
  "Kota Bandar Lampung",
  "Kabupaten Lampung Tengah",
  "Kabupaten Lampung Timur",
  "Kabupaten Lampung Utara",
  "Kabupaten Pesawaran",
  "Kota Metro",
  "Kabupaten Pringsewu",
  "Kabupaten Tanggamus",
  "Kabupaten Tulang Bawang",
  "Kabupaten Tulang Bawang Barat",
  "Kabupaten Way Kanan",
  "Kabupaten Lampung Barat",
  "Kabupaten Pesisir Barat",
  "Kabupaten Mesuji"
];

const RELIGIONS = [
  "Islam",
  "Kristen Protestan",
  "Katolik",
  "Hindu",
  "Buddha",
  "Khonghucu"
];

const MINISTRY_OPTIONS = [
  "Kementrian Agama - Madrasah Tsanawiah (MTs)",
  "Kementrian Pendidikan - Sekolah Menengah Pertama (SMP)"
];

const MAJOR_OPTIONS = [
  "Teknik Komputer dan Jaringan (TKJ)",
  "Teknik Jaringan Akses Telekomunikasi (TJAT)",
  "Rekayasa Perangkat Lunak (RPL)",
  "Animasi"
];

const REGISTRATION_TRACKS = [
  "Reguler",
  "Tahfidz",
  "Organisasi",
  "Prestasi",
  "Influencer"
];

const PARENT_EDUCATIONS = [
  "SD",
  "SMP/Sederajat",
  "SMA/ SMK/Sederajat",
  "D1/D2/D3",
  "D4/S1",
  "S2",
  "S3"
];

const FATHER_OCCUPATIONS = [
  "Petani",
  "Pedagang",
  "Buruh",
  "PNS",
  "Polri",
  "TNI",
  "BUMN",
  "Wirawasta",
  "Karyawan Swasta"
];

const MOTHER_OCCUPATIONS = [
  "Ibu Rumah Tangga",
  "Petani",
  "Pedagang",
  "Buruh",
  "PNS",
  "Polri",
  "TNI",
  "BUMN",
  "Wirawasta",
  "Karyawan Swasta",
  "Tidak Bekerja"
];

const INFO_SOURCES = [
  "Sosial Media (Instagram / TikTok / Facebook)",
  "Website Resmi SMK Telkom Lampung",
  "Guru SMP / Guru BK",
  "Teman / Sahabat",
  "Keluarga / Orang Tua",
  "Alumni / Kakak Tingkat",
  "Brosur / Spanduk / Baliho",
  "Event Kunjungan Sekolah",
  "Lainnya"
];

const BATCH_OPTIONS = ["INDEN", "BATCH 1", "BATCH 2", "BATCH 3"];

const SUPPLEMENTARY_DOC_TYPES = [
  "Surat Keterangan Sehat",
  "Surat Pernyataan Pembayaran",
  "Kartu Pelajar / Surat Keterangan Siswa Aktif",
  "Sertifikat Pendukung / Prestasi",
  "Lainnya"
];

type MenuTab = "pendaftaran" | "konfirmasi" | "rincian" | "upload-berkas";

const DRAFT_STORAGE_KEY = "spmb_form_draft_v3";

type ToastItem = {
  id: string;
  type: "error" | "success" | "info" | "warning";
  title?: string;
  message: string;
};

export function SpmbRegistrationForm({ majors, academicYear }: Props) {
  const [activeMenu, setActiveMenu] = useState<MenuTab>("pendaftaran");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [registered, setRegistered] = useState<SpmbRegistration | null>(null);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  function showToast(type: "error" | "success" | "info" | "warning", message: string, title?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      type,
      title: title || (type === "error" ? "Mohon Periksa Kembali:" : type === "success" ? "Berhasil!" : "Informasi"),
      message
    };

    setToasts((prev) => [...prev.slice(-3), newToast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Form State
  const initialForm = useMemo(
    () => ({
      // Step 1: Kelas & Biodata Siswa
      classGrade: "Kelas 9 SMP/Sederajat (Tahun Pelajaran 2027/2028)",
      fullName: "",
      nik: "",
      nisn: "",
      gender: "Laki-laki",
      religion: "Islam",
      birthDate: "",
      whatsappNumber: "",
      email: "",

      // Step 2: Alamat Tempat Tinggal
      province: "Lampung",
      provinceId: "18",
      city: "Kabupaten Lampung Selatan",
      cityId: "",
      district: "",
      currentAddress: "",

      // Step 3: Informasi Akademik
      previousSchool: "",
      previousSchoolAddress: "",
      schoolType: "Negeri",
      ministry: "Kementrian Pendidikan - Sekolah Menengah Pertama (SMP)",
      selectedMajorName: "Teknik Komputer dan Jaringan (TKJ)",
      registrationTrack: "Reguler",

      // Step 4: Data Orang Tua (Ayah)
      fatherName: "",
      fatherEducation: "SMA/ SMK/Sederajat",
      fatherOccupation: "Wiraswasta",
      fatherBirthDate: "",
      fatherPhone: "",

      // Step 5: Data Orang Tua (Ibu)
      motherName: "",
      motherEducation: "SMA/ SMK/Sederajat",
      motherOccupation: "Ibu Rumah Tangga",
      motherBirthDate: "",
      motherPhone: "",

      // Step 6: Dokumen & Informasi Tambahan
      studentCardFile: "",
      familyCardFile: "",
      birthCertificateFile: "",
      achievementCertificateFile: "",
      hasAchievement: "Tidak Ada",
      infoSource: "Sosial Media (Instagram / TikTok / Facebook)",
      affiliatorName: "-",
      reason: "",
      choicePriority: "Pilihan Utama",
      achievementsNote: ""
    }),
    []
  );

  const [form, setForm] = useState(initialForm);

  // Form Konfirmasi Pembayaran
  const [paymentForm, setPaymentForm] = useState({
    registrationNumber: "",
    studentName: "",
    batch: "INDEN",
    amount: "1500000",
    proofFile: ""
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form Upload Berkas Susulan
  const [docForm, setDocForm] = useState({
    registrationNumber: "",
    studentName: "",
    documentType: "Surat Keterangan Sehat",
    fileUrl: ""
  });
  const [docSuccess, setDocSuccess] = useState(false);

  // Dynamic Wilayah Cascading State
  const [regenciesList, setRegenciesList] = useState<Array<{ id: string; name: string }>>([]);
  const [districtsList, setDistrictsList] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Hydrate draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) {
          setForm((prev) => ({ ...prev, ...parsed.form }));
          if (parsed.step) setStep(parsed.step);
          if (parsed.activeMenu) setActiveMenu(parsed.activeMenu);
          setHasDraftNotice(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save form & step to LocalStorage
  useEffect(() => {
    if (registered) return;
    try {
      const dataToSave = { form, step, activeMenu };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // ignore
    }
  }, [form, step, activeMenu, registered]);

  // Fetch Regencies whenever Province changes
  useEffect(() => {
    const provId = form.provinceId || "18";
    let isMounted = true;
    setLoadingRegencies(true);

    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const list = data.map((item: any) => ({
            id: item.id,
            name: formatTitleCase(item.name)
          }));
          setRegenciesList(list);

          // If current selected city is not in the list, default to first
          const found = list.find((c) => c.name.toLowerCase() === form.city.toLowerCase());
          if (found) {
            setForm((f) => ({ ...f, cityId: found.id }));
          } else if (list.length > 0) {
            setForm((f) => ({ ...f, city: list[0].name, cityId: list[0].id }));
          }
        }
      })
      .catch(() => {
        // Fallback for Lampung if offline
        if (provId === "18") {
          const fallback = LAMPUNG_REGENCIES.map((name, i) => ({ id: `180${i + 1}`, name }));
          setRegenciesList(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingRegencies(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.provinceId]);

  // Fetch Districts whenever Regency/City changes
  useEffect(() => {
    if (!form.cityId) return;
    let isMounted = true;
    setLoadingDistricts(true);

    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${form.cityId}.json`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const list = data.map((item: any) => ({
            id: item.id,
            name: formatTitleCase(item.name)
          }));
          setDistrictsList(list);
          if (!list.some((d) => d.name.toLowerCase() === form.district.toLowerCase()) && list.length > 0) {
            setForm((f) => ({ ...f, district: list[0].name }));
          }
        }
      })
      .catch(() => {
        setDistrictsList([]);
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.cityId]);

  function formatTitleCase(str: string) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function handleResetForm() {
    if (window.confirm("Apakah Anda yakin ingin mengulang pengisian formulir dari awal? Data yang sudah Anda ketik akan dibersihkan.")) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setForm(initialForm);
      setStep(1);
      setHasDraftNotice(false);
      showToast("info", "Seluruh data formulir telah dibersihkan. Anda dapat mulai mengisi dari awal.", "Formulir Direset");
    }
  }

  // Upload handler to /api/v1/spmb/uploads
  async function handleFileUpload(file: File, fieldName: string, targetState: "registration" | "payment" | "doc") {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("warning", "Ukuran berkas melebihi batas maksimal 10MB. Silakan gunakan berkas yang lebih kecil.", "Ukuran Berkas Terlalu Besar");
      return;
    }

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/spmb/uploads`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Gagal mengunggah berkas. Pastikan format file berupa PDF atau gambar (JPG, PNG).");
      }

      const data = await response.json();
      const fileUrl = data.url;

      if (targetState === "registration") {
        setForm((prev) => ({ ...prev, [fieldName]: fileUrl }));
      } else if (targetState === "payment") {
        setPaymentForm((prev) => ({ ...prev, proofFile: fileUrl }));
      } else if (targetState === "doc") {
        setDocForm((prev) => ({ ...prev, fileUrl }));
      }
      showToast("success", "Berkas dokumen berhasil diunggah.", "Upload Berhasil");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat upload berkas.";
      showToast("error", errorMsg, "Gagal Upload Berkas");
    } finally {
      setUploadingField(null);
    }
  }

  // Next Step with Validation
  function handleNextStep() {
    if (step === 1) {
      if (!form.classGrade) {
        showToast("error", "Silakan pilih kelas / tahun pelajaran saat ini.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.fullName.trim()) {
        showToast("error", "Nama Lengkap calon siswa wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.nik.trim() || form.nik.trim().length < 16) {
        showToast("error", "NIK Calon Siswa wajib diisi lengkap 16 digit sesuai KK / KTP.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.nisn.trim() || form.nisn.trim().length < 10) {
        showToast("error", "NISN Calon Siswa wajib diisi lengkap 10 digit sesuai data rapor/ijazah.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.birthDate) {
        showToast("error", "Tanggal Lahir Siswa wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.whatsappNumber.trim()) {
        showToast("error", "Nomor Telepon/HP aktif (WhatsApp) wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.email.trim()) {
        showToast("error", "Alamat Email aktif wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
    }

    if (step === 2) {
      if (!form.province) {
        showToast("error", "Provinsi tempat tinggal wajib dipilih.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.city) {
        showToast("error", "Kabupaten / Kota tempat tinggal wajib dipilih.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.district) {
        showToast("error", "Kecamatan tempat tinggal wajib dipilih.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.currentAddress.trim()) {
        showToast("error", "Alamat lengkap tempat tinggal (Jalan, RT/RW, Dusun) wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
    }

    if (step === 3) {
      if (!form.previousSchool.trim()) {
        showToast("error", "Nama Asal Sekolah wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.previousSchoolAddress.trim()) {
        showToast("error", "Alamat lengkap sekolah asal wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.selectedMajorName) {
        showToast("error", "Silakan pilih jurusan yang diminati di SMK Telkom Lampung.", "Mohon Periksa Kembali:");
        return;
      }
    }

    if (step === 4) {
      if (!form.fatherName.trim()) {
        showToast("error", "Nama Lengkap Ayah / Wali wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.fatherBirthDate) {
        showToast("error", "Tanggal lahir Ayah / Wali wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.fatherPhone.trim()) {
        showToast("error", "Nomor telepon/HP aktif Ayah / Wali wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
    }

    if (step === 5) {
      if (!form.motherName.trim()) {
        showToast("error", "Nama Lengkap Ibu / Wali wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.motherBirthDate) {
        showToast("error", "Tanggal lahir Ibu / Wali wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
      if (!form.motherPhone.trim()) {
        showToast("error", "Nomor telepon/HP aktif Ibu / Wali wajib diisi.", "Mohon Periksa Kembali:");
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 6));
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function handlePrevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  // Submit Pendaftaran Baru
  async function handleSubmitRegistration(e: FormEvent) {
    e.preventDefault();

    if (!form.birthCertificateFile) {
      showToast("error", "Berkas Akta Kelahiran wajib diunggah (format PDF / Foto jelas).", "Mohon Periksa Kembali:");
      return;
    }
    if (!form.familyCardFile) {
      showToast("error", "Berkas Kartu Keluarga (KK) wajib diunggah (format PDF / Foto jelas).", "Mohon Periksa Kembali:");
      return;
    }
    if (!form.reason.trim()) {
      showToast("error", "Alasan memilih SMK Telkom Lampung wajib diisi.", "Mohon Periksa Kembali:");
      return;
    }

    setLoading(true);

    const matchedMajor = majors.find((m) => m.name.toLowerCase().includes(form.selectedMajorName.toLowerCase())) || majors[0];

    const payload = {
      classGrade: form.classGrade,
      fullName: form.fullName.trim(),
      nik: form.nik.trim(),
      nisn: form.nisn.trim(),
      gender: form.gender,
      religion: form.religion,
      birthDate: form.birthDate,
      whatsappNumber: form.whatsappNumber.trim(),
      email: form.email.trim(),
      province: form.province,
      city: form.city,
      district: form.district,
      currentAddress: form.currentAddress.trim(),
      previousSchool: form.previousSchool.trim(),
      previousSchoolAddress: form.previousSchoolAddress.trim(),
      schoolType: form.schoolType,
      ministry: form.ministry,
      selectedMajorId: matchedMajor?.id || 1,
      selectedMajorName: form.selectedMajorName,
      registrationTrack: form.registrationTrack,
      fatherName: form.fatherName.trim(),
      fatherEducation: form.fatherEducation,
      fatherOccupation: form.fatherOccupation,
      fatherBirthDate: form.fatherBirthDate,
      fatherPhone: form.fatherPhone.trim(),
      motherName: form.motherName.trim(),
      motherEducation: form.motherEducation,
      motherOccupation: form.motherOccupation,
      motherBirthDate: form.motherBirthDate,
      motherPhone: form.motherPhone.trim(),
      studentCardFile: form.studentCardFile,
      familyCardFile: form.familyCardFile,
      birthCertificateFile: form.birthCertificateFile,
      achievementCertificateFile: form.achievementCertificateFile,
      infoSource: form.infoSource,
      affiliatorName: form.affiliatorName.trim() || "-",
      reason: form.reason.trim(),
      choicePriority: form.choicePriority,
      achievementsNote: form.achievementsNote.trim(),
      academicYear: academicYear
    };

    try {
      const response = await fetch(`${API_URL}/spmb/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal mengirimkan formulir pendaftaran. Silakan periksa kembali data Anda.");
      }

      const result = await response.json();
      setRegistered(result);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      showToast("success", "Selamat! Pendaftaran siswa baru berhasil terkirim.", "Pendaftaran Sukses");
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran.";
      showToast("error", errorMsg, "Gagal Mengirim Pendaftaran");
    } finally {
      setLoading(false);
    }
  }

  // Submit Konfirmasi Pembayaran
  async function handleSubmitPayment(e: FormEvent) {
    e.preventDefault();

    if (!paymentForm.registrationNumber.trim() || !paymentForm.studentName.trim()) {
      showToast("error", "Nomor Pendaftaran dan Nama Lengkap Siswa wajib diisi.", "Mohon Periksa Kembali:");
      return;
    }
    if (!paymentForm.proofFile) {
      showToast("error", "Bukti transfer pembayaran wajib diunggah.", "Mohon Periksa Kembali:");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/spmb/payment-confirmations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: paymentForm.registrationNumber.trim(),
          studentName: paymentForm.studentName.trim(),
          batch: paymentForm.batch,
          amount: parseInt(paymentForm.amount, 10) || 0,
          proofFile: paymentForm.proofFile
        })
      });

      if (!res.ok) {
        throw new Error("Gagal mengirimkan konfirmasi pembayaran. Pastikan data sudah benar.");
      }

      setPaymentSuccess(true);
      showToast("success", "Bukti transfer pembayaran berhasil dikirim untuk diverifikasi panitia.", "Konfirmasi Terkirim");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast("error", errorMsg, "Gagal Mengirim Konfirmasi");
    } finally {
      setLoading(false);
    }
  }

  // Submit Upload Berkas Susulan
  async function handleSubmitDoc(e: FormEvent) {
    e.preventDefault();

    if (!docForm.registrationNumber.trim() || !docForm.studentName.trim()) {
      showToast("error", "Nomor Pendaftaran dan Nama Lengkap Siswa wajib diisi.", "Mohon Periksa Kembali:");
      return;
    }
    if (!docForm.fileUrl) {
      showToast("error", "Silakan pilih dan unggah file berkas pendukung Anda.", "Mohon Periksa Kembali:");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/spmb/supplementary-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: docForm.registrationNumber.trim(),
          studentName: docForm.studentName.trim(),
          documentType: docForm.documentType,
          fileUrl: docForm.fileUrl
        })
      });

      if (!res.ok) {
        throw new Error("Gagal mengunggah berkas pendukung.");
      }

      setDocSuccess(true);
      showToast("success", "Berkas pendukung susulan berhasil diunggah.", "Berkas Diterima");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast("error", errorMsg, "Gagal Mengunggah Berkas");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------
  // SUCCESS SCREEN (After Registration)
  // -------------------------------------------------------------
  if (registered) {
    return (
      <div className="rounded-[16px] border-2 border-emerald-500/20 bg-white p-6 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={46} />
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-emerald-600">Pendaftaran Berhasil</p>
          <h2 className="mt-1 text-2xl font-black text-zinc-950 sm:text-3xl">Selamat Bergabung di SMK Telkom Lampung!</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500 max-w-lg mx-auto">
            Data Anda telah tersimpan resmi di sistem SPMB kami. Simpan atau cetak kartu pendaftaran di bawah ini sebagai bukti pendaftaran resmi.
          </p>

          <div className="mt-6 inline-block rounded-[12px] border border-rosebrand-100 bg-rosebrand-50/70 px-6 py-4">
            <p className="text-xs font-bold text-zinc-500 uppercase">Nomor Registrasi Anda:</p>
            <p className="mt-1 text-2xl font-black text-rosebrand-600 sm:text-3xl tracking-wide">{registered.registrationNumber}</p>
            <p className="mt-1 text-xs font-medium text-zinc-600">Nama: <strong className="text-zinc-900">{registered.fullName}</strong> • Jurusan: <strong>{registered.selectedMajorName}</strong></p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => printSpmbCardPdf(registered)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-rosebrand-600 px-6 text-sm font-black text-white shadow-md transition-all hover:bg-rosebrand-700 active:scale-95"
            >
              <Printer size={18} />
              Cetak / Print Kartu
            </button>
            <button
              type="button"
              onClick={() => downloadSpmbCardPdf(registered)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-zinc-950 px-6 text-sm font-black text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95"
            >
              <Download size={18} />
              Download Kartu PDF
            </button>
          </div>

          <div className="mt-8 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={() => {
                setRegistered(null);
                setForm(initialForm);
                setStep(1);
                setActiveMenu("konfirmasi");
              }}
              className="text-xs font-black text-zinc-600 hover:text-rosebrand-600 hover:underline"
            >
              Sudah transfer biaya pendaftaran? Klik di sini untuk Konfirmasi Pembayaran &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectMenu = (menu: "pendaftaran" | "konfirmasi" | "rincian" | "upload-berkas") => {
    setActiveMenu(menu);
    setTimeout(() => {
      const el = document.getElementById(`section-${menu}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  // -------------------------------------------------------------
  // MAIN FORM COMPONENT
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Draft Notification Banner */}
      {hasDraftNotice && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-900">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-emerald-600 shrink-0" />
            <span>
              <strong>Draft Tersimpan Otomatis:</strong> Data isian Anda tetap tersimpan di perangkat ini meskipun halaman di-refresh.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-100 px-3 py-1.5 font-bold text-emerald-800 hover:bg-emerald-200 transition-colors"
          >
            <RotateCcw size={13} />
            Mulai dari Awal
          </button>
        </div>
      )}

      {/* 4 MENU UTAMA KARTU SELECTOR (Mobile Friendly & Jelas untuk Orang Minim Literasi) */}
      <section className="rounded-[16px] bg-white p-5 shadow-sm border border-zinc-200/80">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Pusat Layanan SPMB</p>
          <h2 className="text-lg font-black text-zinc-950 sm:text-xl">Pilih Keperluan Anda</h2>
          <p className="text-xs font-semibold text-zinc-500">
            Sentuh atau klik salah satu kartu di bawah ini sesuai yang ingin Anda lakukan:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Menu 1: Pendaftaran Baru */}
          <button
            type="button"
            onClick={() => handleSelectMenu("pendaftaran")}
            className={`group relative flex flex-col justify-between rounded-[12px] p-4 text-left transition-all ${
              activeMenu === "pendaftaran"
                ? "bg-rosebrand-600 text-white shadow-lg ring-2 ring-rosebrand-600 shadow-rosebrand-600/20"
                : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] ${
                  activeMenu === "pendaftaran" ? "bg-white/20 text-white" : "bg-rosebrand-100 text-rosebrand-700"
                }`}
              >
                <School size={22} />
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  activeMenu === "pendaftaran" ? "bg-white text-rosebrand-700" : "bg-rosebrand-50 text-rosebrand-700"
                }`}
              >
                Langkah 1
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-black">1. Daftar Siswa Baru</p>
              <p className={`mt-1 text-xs leading-relaxed ${activeMenu === "pendaftaran" ? "text-white/80" : "text-zinc-500"}`}>
                Isi biodata & formulir pendaftaran calon murid baru
              </p>
            </div>
          </button>

          {/* Menu 2: Konfirmasi Pembayaran */}
          <button
            type="button"
            onClick={() => handleSelectMenu("konfirmasi")}
            className={`group relative flex flex-col justify-between rounded-[12px] p-4 text-left transition-all ${
              activeMenu === "konfirmasi"
                ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-600 shadow-emerald-600/20"
                : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] ${
                  activeMenu === "konfirmasi" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <CreditCard size={22} />
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  activeMenu === "konfirmasi" ? "bg-white text-emerald-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                Langkah 2
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-black">2. Konfirmasi Bayar</p>
              <p className={`mt-1 text-xs leading-relaxed ${activeMenu === "konfirmasi" ? "text-white/80" : "text-zinc-500"}`}>
                Kirim foto bukti transfer biaya pendaftaran / gelombang
              </p>
            </div>
          </button>

          {/* Menu 3: Rincian Total Pembayaran */}
          <button
            type="button"
            onClick={() => handleSelectMenu("rincian")}
            className={`group relative flex flex-col justify-between rounded-[12px] p-4 text-left transition-all ${
              activeMenu === "rincian"
                ? "bg-sky-600 text-white shadow-lg ring-2 ring-sky-600 shadow-sky-600/20"
                : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] ${
                  activeMenu === "rincian" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-700"
                }`}
              >
                <HelpCircle size={22} />
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  activeMenu === "rincian" ? "bg-white text-sky-700" : "bg-sky-50 text-sky-700"
                }`}
              >
                Informasi
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-black">3. Rincian Biaya</p>
              <p className={`mt-1 text-xs leading-relaxed ${activeMenu === "rincian" ? "text-white/80" : "text-zinc-500"}`}>
                Cek panduan transparansi biaya sekolah & daftar ulang
              </p>
            </div>
          </button>

          {/* Menu 4: Upload Berkas Susulan */}
          <button
            type="button"
            onClick={() => handleSelectMenu("upload-berkas")}
            className={`group relative flex flex-col justify-between rounded-[12px] p-4 text-left transition-all ${
              activeMenu === "upload-berkas"
                ? "bg-amber-600 text-white shadow-lg ring-2 ring-amber-600 shadow-amber-600/20"
                : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] ${
                  activeMenu === "upload-berkas" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                <FileText size={22} />
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  activeMenu === "upload-berkas" ? "bg-white text-amber-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                Susulan
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-black">4. Berkas Susulan</p>
              <p className={`mt-1 text-xs leading-relaxed ${activeMenu === "upload-berkas" ? "text-white/80" : "text-zinc-500"}`}>
                Upload surat sehat, kartu pelajar, atau sertifikat susulan
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Interactive Floating Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-[12px] bg-white p-4 shadow-2xl ring-1 transition-all border-l-4 ${
              toast.type === "error"
                ? "border-rosebrand-600 ring-rose-200/70 shadow-rosebrand-600/15"
                : toast.type === "success"
                ? "border-emerald-600 ring-emerald-200/70 shadow-emerald-600/15"
                : toast.type === "warning"
                ? "border-amber-500 ring-amber-200/70 shadow-amber-500/15"
                : "border-sky-500 ring-sky-200/70 shadow-sky-500/15"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "error" && <AlertCircle size={20} className="text-rosebrand-600" />}
              {toast.type === "success" && <CheckCircle2 size={20} className="text-emerald-600" />}
              {toast.type === "warning" && <AlertCircle size={20} className="text-amber-500" />}
              {toast.type === "info" && <Info size={20} className="text-sky-600" />}
            </div>
            <div className="flex-1 pr-1">
              {toast.title && (
                <p
                  className={`text-xs font-black uppercase tracking-wider ${
                    toast.type === "error"
                      ? "text-rosebrand-700"
                      : toast.type === "success"
                      ? "text-emerald-800"
                      : toast.type === "warning"
                      ? "text-amber-800"
                      : "text-sky-800"
                  }`}
                >
                  {toast.title}
                </p>
              )}
              <p className="mt-0.5 text-xs font-semibold leading-relaxed text-zinc-700">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-[6px] p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 1. KONTEN TAB: PENDAFTARAN SISWA BARU (6 STEPS WIZARD) */}
      {/* ============================================================== */}
      {activeMenu === "pendaftaran" && (
        <div id="section-pendaftaran" className="scroll-mt-24 rounded-[16px] bg-white p-6 shadow-sm border border-zinc-200/80 sm:p-8">
          {/* Step Progress Bar Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-black text-rosebrand-700">
                  Langkah {step} dari 6
                </span>
                <h3 className="mt-2 text-xl font-black text-zinc-950 sm:text-2xl">
                  {step === 1 && "Pilihan Kelas & Data Diri Siswa"}
                  {step === 2 && "Alamat Lengkap Tempat Tinggal"}
                  {step === 3 && "Informasi Akademik & Jurusan"}
                  {step === 4 && "Data Lengkap Ayah Kandung / Wali"}
                  {step === 5 && "Data Lengkap Ibu Kandung / Wali"}
                  {step === 6 && "Dokumen Pendukung & Tambahan"}
                </h3>
              </div>
              <p className="text-right text-xs font-bold text-zinc-400">
                {Math.round((step / 6) * 100)}% Selesai
              </p>
            </div>

            {/* Visual Progress Line */}
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-rosebrand-600 transition-all duration-300 ease-out"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {/* ------------------------------------------------------------- */}
            {/* STEP 1: PILIHAN KELAS & BIODATA SISWA */}
            {/* ------------------------------------------------------------- */}
            {step === 1 && (
              <div className="space-y-6">
                {/* PILIHAN PERTAMA: KELAS */}
                <div className="rounded-[12px] border-2 border-rosebrand-500/20 bg-rosebrand-50/40 p-5">
                  <label className="block text-sm font-black text-zinc-900 sm:text-base">
                    Saat ini Siswa berada di kelas berapa? <span className="text-rosebrand-600">*</span>
                  </label>
                  <p className="mt-1 text-xs font-medium text-zinc-600">
                    Pilih jenjang kelas siswa saat ini saat mendaftar:
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        title: "Kelas 7 SMP/Sederajat",
                        year: "Tahun Pelajaran 2029/2030",
                        val: "Kelas 7 SMP/Sederajat (Tahun Pelajaran 2029/2030)"
                      },
                      {
                        title: "Kelas 8 SMP/Sederajat",
                        year: "Tahun Pelajaran 2028/2029",
                        val: "Kelas 8 SMP/Sederajat (Tahun Pelajaran 2028/2029)"
                      },
                      {
                        title: "Kelas 9 SMP/Sederajat",
                        year: "Tahun Pelajaran 2027/2028",
                        val: "Kelas 9 SMP/Sederajat (Tahun Pelajaran 2027/2028)"
                      }
                    ].map((k) => (
                      <button
                        key={k.val}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, classGrade: k.val }))}
                        className={`flex flex-col justify-center rounded-[10px] p-4 text-left transition-all border-2 ${
                          form.classGrade === k.val
                            ? "border-rosebrand-600 bg-white shadow-md ring-2 ring-rosebrand-600/20"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-zinc-950">{k.title}</span>
                          {form.classGrade === k.val ? (
                            <CheckCircle2 size={18} className="text-rosebrand-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-zinc-300" />
                          )}
                        </div>
                        <span className="mt-2 text-xs font-bold text-rosebrand-600">{k.year}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* BIODATA SISWA */}
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* 1. Nama Lengkap */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      1. Nama Lengkap Calon Siswa <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Contoh: Muhammad Rizki Pratama"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600 focus:ring-2 focus:ring-rosebrand-600/10"
                    />
                  </div>

                  {/* 2. NIK Calon Siswa */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      2. NIK Calon Siswa <span className="text-rosebrand-600">*</span>
                    </label>
                    <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
                      16 digit angka (Terdapat di Kartu Keluarga / KTP)
                    </p>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      value={form.nik}
                      onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })}
                      placeholder="Contoh: 1801042508080001"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600 focus:ring-2 focus:ring-rosebrand-600/10"
                    />
                  </div>

                  {/* 3. NISN */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      3. NISN Calon Siswa <span className="text-rosebrand-600">*</span>
                    </label>
                    <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
                      10 digit angka (Terdapat pada Ijazah / Rapor asal)
                    </p>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      value={form.nisn}
                      onChange={(e) => setForm({ ...form, nisn: e.target.value.replace(/\D/g, "") })}
                      placeholder="Contoh: 0081234567"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600 focus:ring-2 focus:ring-rosebrand-600/10"
                    />
                  </div>

                  {/* 4. Jenis Kelamin */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      4. Jenis Kelamin <span className="text-rosebrand-600">*</span>
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {["Laki-laki", "Perempuan"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm({ ...form, gender: g })}
                          className={`h-12 rounded-[10px] text-sm font-bold border ${
                            form.gender === g
                              ? "border-rosebrand-600 bg-rosebrand-50 text-rosebrand-700 ring-2 ring-rosebrand-600/20"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Agama */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      5. Agama <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.religion}
                      onChange={(e) => setForm({ ...form, religion: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {RELIGIONS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Tanggal Lahir Siswa */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      6. Tanggal Lahir Siswa <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 7. Nomor Telp/HP Aktif */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      7. Nomor WhatsApp / HP Siswa (Aktif) <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.whatsappNumber}
                      onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 8. Alamat Email Aktif */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      8. Alamat Email Aktif <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Contoh: namasiswa@gmail.com"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: ALAMAT TEMPAT TINGGAL (CASCADING DROPDOWNS) */}
            {/* ------------------------------------------------------------- */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-[10px] bg-zinc-50 p-4 border border-zinc-200 text-xs font-medium text-zinc-600 flex items-center gap-2.5">
                  <MapPin size={18} className="text-rosebrand-600 shrink-0" />
                  <span>
                    Pilih provinsi terlebih dahulu, kemudian daftar kabupaten/kota dan kecamatan akan otomatis menyesuaikan pilihan Anda.
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  {/* 1. Pilih Provinsi */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      1. Pilih Provinsi <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.provinceId}
                      onChange={(e) => {
                        const sel = PROVINCES_LIST.find((p) => p.id === e.target.value);
                        setForm({
                          ...form,
                          provinceId: e.target.value,
                          province: sel ? sel.name : "",
                          city: "",
                          cityId: "",
                          district: ""
                        });
                      }}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {PROVINCES_LIST.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Daftar Kabupaten / Kota */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      2. Kabupaten / Kota <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      disabled={loadingRegencies || regenciesList.length === 0}
                      value={form.cityId}
                      onChange={(e) => {
                        const sel = regenciesList.find((r) => r.id === e.target.value);
                        setForm({
                          ...form,
                          cityId: e.target.value,
                          city: sel ? sel.name : "",
                          district: ""
                        });
                      }}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600 disabled:bg-zinc-100 disabled:opacity-70"
                    >
                      {loadingRegencies ? (
                        <option>Memuat daftar kabupaten...</option>
                      ) : regenciesList.length > 0 ? (
                        regenciesList.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))
                      ) : (
                        <option value="">Pilih provinsi terlebih dahulu</option>
                      )}
                    </select>
                  </div>

                  {/* 3. Daftar Kecamatan */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      3. Kecamatan <span className="text-rosebrand-600">*</span>
                    </label>
                    {districtsList.length > 0 ? (
                      <select
                        disabled={loadingDistricts}
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600 disabled:bg-zinc-100"
                      >
                        {loadingDistricts ? (
                          <option>Memuat kecamatan...</option>
                        ) : (
                          districtsList.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        placeholder={loadingDistricts ? "Memuat..." : "Ketik nama kecamatan"}
                        className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                      />
                    )}
                  </div>

                  {/* 4. Alamat Lengkap */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      4. Alamat Lengkap Tempat Tinggal <span className="text-rosebrand-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={form.currentAddress}
                      onChange={(e) => setForm({ ...form, currentAddress: e.target.value })}
                      placeholder="Contoh: Jl. Raden Intan No. 12, RT 02 / RW 01, Dusun Suka Maju, Kelurahan Hajimena, Kode Pos 35362"
                      className="mt-2 w-full rounded-[10px] border border-zinc-300 p-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: INFORMASI AKADEMIK */}
            {/* ------------------------------------------------------------- */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* 1. Asal Sekolah */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      1. Asal Sekolah Calon Siswa <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.previousSchool}
                      onChange={(e) => setForm({ ...form, previousSchool: e.target.value })}
                      placeholder="Contoh: SMP Negeri 1 Natar / MTs Negeri 2 Bandar Lampung"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 2. Alamat Lengkap Sekolah */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      2. Alamat Lengkap Asal Sekolah <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.previousSchoolAddress}
                      onChange={(e) => setForm({ ...form, previousSchoolAddress: e.target.value })}
                      placeholder="Contoh: Jl. Lintas Sumatera Km. 20, Natar, Lampung Selatan"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 3. Jenis Sekolah */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      3. Jenis Sekolah <span className="text-rosebrand-600">*</span>
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {["Negeri", "Swasta"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, schoolType: t })}
                          className={`h-12 rounded-[10px] text-sm font-bold border ${
                            form.schoolType === t
                              ? "border-rosebrand-600 bg-rosebrand-50 text-rosebrand-700 ring-2 ring-rosebrand-600/20"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Naungan Kementrian */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      4. Naungan Kementrian <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.ministry}
                      onChange={(e) => setForm({ ...form, ministry: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {MINISTRY_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Jurusan yang dipilih di SMK Telkom Lampung */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      5. Jurusan yang Dipilih di SMK Telkom Lampung <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.selectedMajorName}
                      onChange={(e) => setForm({ ...form, selectedMajorName: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-rosebrand-600/40 bg-rosebrand-50/20 px-4 text-sm font-black text-rosebrand-900 outline-none focus:border-rosebrand-600"
                    >
                      {MAJOR_OPTIONS.map((major) => (
                        <option key={major} value={major}>
                          {major}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Jalur Pendaftaran */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      6. Jalur Pendaftaran <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.registrationTrack}
                      onChange={(e) => setForm({ ...form, registrationTrack: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {REGISTRATION_TRACKS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 4: DATA ORANG TUA (AYAH) */}
            {/* ------------------------------------------------------------- */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="rounded-[10px] bg-zinc-50 p-4 border border-zinc-200 text-xs font-medium text-zinc-600 flex items-center gap-2.5">
                  <Users size={18} className="text-rosebrand-600 shrink-0" />
                  <span>
                    Isi data identitas Ayah Kandung atau Wali murid yang bertanggung jawab atas calon siswa.
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* 1. Nama Lengkap Ayah/Wali */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      1. Nama Lengkap Ayah / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fatherName}
                      onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                      placeholder="Contoh: Bambang Hermanto"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 2. Pendidikan Terakhir */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      2. Pendidikan Terakhir Ayah / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.fatherEducation}
                      onChange={(e) => setForm({ ...form, fatherEducation: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {PARENT_EDUCATIONS.map((ed) => (
                        <option key={ed} value={ed}>
                          {ed}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Pekerjaan */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      3. Pekerjaan Ayah / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.fatherOccupation}
                      onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {FATHER_OCCUPATIONS.map((occ) => (
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Tanggal Lahir Ayah/Wali */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      4. Tanggal Lahir Ayah / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.fatherBirthDate}
                      onChange={(e) => setForm({ ...form, fatherBirthDate: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 5. Nomor Telepon Ayah/Wali */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      5. Nomor Telepon / HP Ayah (Aktif) <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.fatherPhone}
                      onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })}
                      placeholder="Contoh: 081298765432"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 5: DATA ORANG TUA (IBU) */}
            {/* ------------------------------------------------------------- */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="rounded-[10px] bg-zinc-50 p-4 border border-zinc-200 text-xs font-medium text-zinc-600 flex items-center gap-2.5">
                  <Users size={18} className="text-rosebrand-600 shrink-0" />
                  <span>
                    Isi data identitas Ibu Kandung atau Wali murid yang bertanggung jawab atas calon siswa.
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* 1. Nama Lengkap Ibu/Wali */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      1. Nama Lengkap Ibu / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.motherName}
                      onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                      placeholder="Contoh: Siti Rahmawati"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 2. Pendidikan Terakhir Ibu */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      2. Pendidikan Terakhir Ibu / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.motherEducation}
                      onChange={(e) => setForm({ ...form, motherEducation: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {PARENT_EDUCATIONS.map((ed) => (
                        <option key={ed} value={ed}>
                          {ed}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Pekerjaan Ibu */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      3. Pekerjaan Ibu / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.motherOccupation}
                      onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {MOTHER_OCCUPATIONS.map((occ) => (
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Tanggal Lahir Ibu/Wali */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      4. Tanggal Lahir Ibu / Wali <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.motherBirthDate}
                      onChange={(e) => setForm({ ...form, motherBirthDate: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 5. Nomor Telepon Ibu/Wali */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      5. Nomor Telepon / HP Ibu (Aktif) <span className="text-rosebrand-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.motherPhone}
                      onChange={(e) => setForm({ ...form, motherPhone: e.target.value })}
                      placeholder="Contoh: 085212345678"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 6: DOKUMEN PENDUKUNG & INFORMASI TAMBAHAN */}
            {/* ------------------------------------------------------------- */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* 1. Upload Kartu Pelajar (Opsional/Menyusul) */}
                  <div className="rounded-[12px] border border-zinc-200 bg-zinc-50/50 p-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-800">
                      1. Upload Kartu Pelajar / Surat Keterangan Siswa Aktif
                    </label>
                    <p className="mt-1 text-[11px] font-medium text-zinc-500">
                      *Boleh menyusul dan dikumpulkan saat melakukan ujian di sekolah jika belum ada.
                    </p>
                    <div className="mt-3">
                      <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-zinc-300 bg-white px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors">
                        {uploadingField === "studentCardFile" ? (
                          <Loader2 size={16} className="animate-spin text-rosebrand-600" />
                        ) : form.studentCardFile ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <Upload size={16} />
                        )}
                        <span>{form.studentCardFile ? "File Terunggah (Ganti)" : "Pilih Berkas dari HP / Laptop"}</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, "studentCardFile", "registration");
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 2. Mengetahui Sekolah Telkom Dari Mana */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      2. Mengetahui Sekolah Telkom Schools Dari Mana? <span className="text-rosebrand-600">*</span>
                    </label>
                    <select
                      value={form.infoSource}
                      onChange={(e) => setForm({ ...form, infoSource: e.target.value })}
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-rosebrand-600"
                    >
                      {INFO_SOURCES.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Nama Afiliator */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      3. Nama Afiliator (Perekomendasi) <span className="text-rosebrand-600">*</span>
                    </label>
                    <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
                      Nama yang memberikan referensi untuk memilih SMK Telkom Lampung, seperti nama Guru BK SMP, Keluarga, atau Kakak Tingkat (Ketik tanda minus &quot;-&quot; jika tidak ada).
                    </p>
                    <input
                      type="text"
                      required
                      value={form.affiliatorName}
                      onChange={(e) => setForm({ ...form, affiliatorName: e.target.value })}
                      placeholder="Contoh: Ibu Rina (Guru BK SMPN 1) / Kak Dimas (Alumni)"
                      className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 4. Alasan Memilih SMK Telkom */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      4. Alasan Memilih SMK Telkom Lampung <span className="text-rosebrand-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Contoh: Ingin menjadi programmer andal dan bekerja di industri teknologi nasional setelah lulus."
                      className="mt-2 w-full rounded-[10px] border border-zinc-300 p-4 text-sm font-semibold text-zinc-900 outline-none focus:border-rosebrand-600"
                    />
                  </div>

                  {/* 5. Pilihan Utama atau Kedua */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                      5. Apakah Calon Siswa Memilih SMK Telkom Lampung sebagai Pilihan Utama / Pilihan Kedua? <span className="text-rosebrand-600">*</span>
                    </label>
                    <div className="mt-3 space-y-2.5">
                      {[
                        { title: "Pilihan Utama", desc: "Prioritas utama saya adalah bersekolah di SMK Telkom Lampung" },
                        {
                          title: "Pilihan Kedua - Pilihan kedua  (Hanya Sebagai Batu Lompatan Menunggu Pengumuan Sekolah lain)",
                          desc: "Sebagai pilihan cadangan menunggu hasil pengumuman sekolah lain"
                        }
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => setForm({ ...form, choicePriority: item.title })}
                          className={`flex w-full items-start gap-3 rounded-[10px] p-3.5 text-left border transition-all ${
                            form.choicePriority === item.title
                              ? "border-rosebrand-600 bg-rosebrand-50/70 ring-2 ring-rosebrand-600/20"
                              : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <div
                            className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                              form.choicePriority === item.title ? "border-rosebrand-600 bg-rosebrand-600 text-white" : "border-zinc-300"
                            }`}
                          >
                            {form.choicePriority === item.title && <Check size={12} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900">{item.title}</p>
                            <p className="mt-0.5 text-[11px] font-medium text-zinc-500">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6 & 7: Prestasi Akademik dan Non-Akademik */}
                  <div className="sm:col-span-2 rounded-[12px] border border-zinc-200 bg-zinc-50/50 p-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-800">
                      6. Prestasi Akademik dan Non-Akademik (Jika Ada)
                    </label>
                    <div className="mt-2 flex gap-4">
                      {["Tidak Ada", "Ada Prestasi"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm({ ...form, hasAchievement: opt })}
                          className={`rounded-[8px] px-4 py-2 text-xs font-bold border transition-colors ${
                            form.hasAchievement === opt
                              ? "border-rosebrand-600 bg-rosebrand-600 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {form.hasAchievement === "Ada Prestasi" && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-zinc-200">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700">
                            Nama Prestasi / Juara yang Diraih
                          </label>
                          <input
                            type="text"
                            value={form.achievementsNote}
                            onChange={(e) => setForm({ ...form, achievementsNote: e.target.value })}
                            placeholder="Contoh: Juara 1 O2SN Silat Tingkat Kabupaten, Juara 2 Lomba Coding"
                            className="mt-1 h-11 w-full rounded-[8px] border border-zinc-300 px-3 text-xs font-semibold text-zinc-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700">
                            7. Silakan unggah sertifikat yang dimiliki (Jika Ada)
                          </label>
                          <p className="text-[11px] text-zinc-500">
                            *Gabungkan semua sertifikat menjadi satu file dalam bentuk PDF atau unggah foto sertifikat utama.
                          </p>
                          <div className="mt-2">
                            <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-zinc-300 bg-white px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
                              {uploadingField === "achievementCertificateFile" ? (
                                <Loader2 size={16} className="animate-spin text-rosebrand-600" />
                              ) : form.achievementCertificateFile ? (
                                <CheckCircle2 size={16} className="text-emerald-600" />
                              ) : (
                                <Upload size={16} />
                              )}
                              <span>{form.achievementCertificateFile ? "Sertifikat Terunggah (Ganti)" : "Upload Sertifikat (PDF / Foto)"}</span>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileUpload(f, "achievementCertificateFile", "registration");
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 8. Akta Kelahiran */}
                  <div className="rounded-[12px] border-2 border-zinc-200 bg-zinc-50/60 p-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-900">
                      8. Upload Akta Kelahiran Siswa <span className="text-rosebrand-600">*</span>
                    </label>
                    <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                      Format file PDF atau foto jelas (Maks. 10MB)
                    </p>
                    <div className="mt-3">
                      <label className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-xs font-black text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm">
                        {uploadingField === "birthCertificateFile" ? (
                          <Loader2 size={18} className="animate-spin text-rosebrand-600" />
                        ) : form.birthCertificateFile ? (
                          <CheckCircle2 size={18} className="text-emerald-600" />
                        ) : (
                          <Upload size={18} className="text-rosebrand-600" />
                        )}
                        <span>{form.birthCertificateFile ? "Akta Kelahiran Terunggah (Ganti)" : "Pilih Berkas Akta Kelahiran"}</span>
                        <input
                          type="file"
                          required={!form.birthCertificateFile}
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, "birthCertificateFile", "registration");
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 9. Kartu Keluarga */}
                  <div className="rounded-[12px] border-2 border-zinc-200 bg-zinc-50/60 p-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-900">
                      9. Upload Kartu Keluarga (KK) <span className="text-rosebrand-600">*</span>
                    </label>
                    <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                      Format file PDF atau foto jelas (Maks. 10MB)
                    </p>
                    <div className="mt-3">
                      <label className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-xs font-black text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm">
                        {uploadingField === "familyCardFile" ? (
                          <Loader2 size={18} className="animate-spin text-rosebrand-600" />
                        ) : form.familyCardFile ? (
                          <CheckCircle2 size={18} className="text-emerald-600" />
                        ) : (
                          <Upload size={18} className="text-rosebrand-600" />
                        )}
                        <span>{form.familyCardFile ? "Kartu Keluarga Terunggah (Ganti)" : "Pilih Berkas Kartu Keluarga"}</span>
                        <input
                          type="file"
                          required={!form.familyCardFile}
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, "familyCardFile", "registration");
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons: Previous / Next / Submit */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors active:scale-95"
                >
                  <ArrowLeft size={16} />
                  Kembali
                </button>
              ) : (
                <div />
              )}

              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-rosebrand-600 px-7 text-sm font-black text-white shadow-md transition-all hover:bg-rosebrand-700 active:scale-95"
                >
                  Lanjut ke Langkah Berikutnya
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitRegistration}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-8 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Memproses Pendaftaran...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Kirim Formulir Pendaftaran Sekarang
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. KONTEN TAB: KONFIRMASI PEMBAYARAN */}
      {/* ============================================================== */}
      {activeMenu === "konfirmasi" && (
        <div id="section-konfirmasi" className="scroll-mt-24 rounded-[16px] bg-white p-6 shadow-sm border border-zinc-200/80 sm:p-8">
          <div className="mb-6">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 uppercase tracking-wider">
              Langkah Konfirmasi
            </span>
            <h3 className="mt-2 text-xl font-black text-zinc-950 sm:text-2xl">Konfirmasi Pembayaran Biaya Masuk / SPMB</h3>
            <p className="mt-1 text-xs font-semibold text-zinc-500 leading-relaxed">
              Khusus bagi calon siswa yang telah melakukan transfer biaya pendaftaran. Silakan unggah bukti transfer di bawah ini agar diverifikasi panitia.
            </p>
          </div>

          {paymentSuccess ? (
            <div className="rounded-[12px] bg-emerald-50 p-6 text-center border border-emerald-200">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <h4 className="mt-3 text-lg font-black text-emerald-950">Bukti Pembayaran Berhasil Dikirim!</h4>
              <p className="mt-1 text-xs font-semibold text-emerald-800 max-w-md mx-auto">
                Terima kasih. Panitia SPMB SMK Telkom Lampung akan memverifikasi pembayaran Anda dalam waktu 1x24 jam.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPaymentSuccess(false);
                  setPaymentForm({
                    registrationNumber: "",
                    studentName: "",
                    batch: "INDEN",
                    amount: "1500000",
                    proofFile: ""
                  });
                }}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[8px] bg-emerald-700 px-5 text-xs font-black text-white hover:bg-emerald-800"
              >
                Kirim Konfirmasi Lainnya
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitPayment} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Nomor Pendaftaran Siswa <span className="text-rosebrand-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.registrationNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, registrationNumber: e.target.value })}
                    placeholder="Contoh: 10001 (5 digit)"
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Nama Lengkap Siswa <span className="text-rosebrand-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.studentName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, studentName: e.target.value })}
                    placeholder="Nama calon siswa"
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Pilihan Gelombang / Batch <span className="text-rosebrand-600">*</span>
                  </label>
                  <select
                    value={paymentForm.batch}
                    onChange={(e) => setPaymentForm({ ...paymentForm, batch: e.target.value })}
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-emerald-600"
                  >
                    {BATCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Nominal Transfer (Rp) <span className="text-rosebrand-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="Contoh: 1500000"
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Upload Foto / Scan Bukti Transfer <span className="text-rosebrand-600">*</span>
                  </label>
                  <p className="mt-0.5 text-[11px] text-zinc-500">Format JPG, PNG, atau PDF (Maks. 10MB)</p>
                  <div className="mt-2">
                    <label className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
                      {uploadingField === "paymentProof" ? (
                        <Loader2 size={16} className="animate-spin text-emerald-600" />
                      ) : paymentForm.proofFile ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <Upload size={16} />
                      )}
                      <span>{paymentForm.proofFile ? "Bukti Terunggah (Klik untuk Mengganti)" : "Pilih File Bukti Transfer dari HP / Laptop"}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, "paymentProof", "payment");
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-emerald-600 text-sm font-black text-white shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Kirim Konfirmasi Pembayaran
              </button>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. KONTEN TAB: RINCIAN TOTAL PEMBAYARAN */}
      {/* ============================================================== */}
      {activeMenu === "rincian" && (
        <div id="section-rincian" className="scroll-mt-24 rounded-[16px] bg-white p-6 shadow-sm border border-zinc-200/80 sm:p-8 space-y-6">
          <div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 uppercase tracking-wider">
              Transparansi Biaya
            </span>
            <h3 className="mt-2 text-xl font-black text-zinc-950 sm:text-2xl">Rincian Total Biaya Pendidikan</h3>
            <p className="mt-1 text-xs font-semibold text-zinc-500 leading-relaxed">
              Informasi lengkap komponen biaya daftar ulang, seragam, praktikum, dan SPP di SMK Telkom Lampung.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[12px] border border-zinc-200 bg-zinc-50/50 p-5">
              <span className="text-xs font-black text-rosebrand-600 uppercase">Jalur INDEN</span>
              <p className="mt-1 text-2xl font-black text-zinc-950">Potongan Terbesar</p>
              <p className="mt-2 text-xs font-semibold text-zinc-600 leading-relaxed">
                Khusus pendaftar awal dengan subsidi uang gedung spesial dan gratis biaya formulir pendaftaran.
              </p>
            </div>
            <div className="rounded-[12px] border border-zinc-200 bg-zinc-50/50 p-5">
              <span className="text-xs font-black text-sky-600 uppercase">BATCH 1 & 2</span>
              <p className="mt-1 text-2xl font-black text-zinc-950">Reguler Bergelombang</p>
              <p className="mt-2 text-xs font-semibold text-zinc-600 leading-relaxed">
                Biaya dapat diangsur sesuai dengan kesepakatan surat pernyataan pembayaran orang tua/wali.
              </p>
            </div>
            <div className="rounded-[12px] border border-zinc-200 bg-zinc-50/50 p-5">
              <span className="text-xs font-black text-emerald-600 uppercase">Jalur Prestasi</span>
              <p className="mt-1 text-2xl font-black text-zinc-950">Beasiswa Khusus</p>
              <p className="mt-2 text-xs font-semibold text-zinc-600 leading-relaxed">
                Bebas tes masuk dan keringanan biaya SPP bagi peraih juara olimpiade / kejuaraan minimal tingkat kabupaten.
              </p>
            </div>
          </div>

          <div className="rounded-[12px] border border-sky-200 bg-sky-50/60 p-5 text-xs text-sky-950 leading-relaxed">
            <p className="font-black text-sm text-sky-900">Butuh Konsultasi Biaya & Pembayaran?</p>
            <p className="mt-1">
              Hubungi bagian Informasi & Keuangan SPMB SMK Telkom Lampung melalui WhatsApp di <strong>0811-799-8800</strong> pada jam kerja (Senin - Sabtu 08.00 - 16.00 WIB).
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. KONTEN TAB: UPLOAD BERKAS SUSULAN */}
      {/* ============================================================== */}
      {activeMenu === "upload-berkas" && (
        <div id="section-upload-berkas" className="scroll-mt-24 rounded-[16px] bg-white p-6 shadow-sm border border-zinc-200/80 sm:p-8">
          <div className="mb-6">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 uppercase tracking-wider">
              Dokumen Susulan
            </span>
            <h3 className="mt-2 text-xl font-black text-zinc-950 sm:text-2xl">Upload Berkas Pendukung Susulan</h3>
            <p className="mt-1 text-xs font-semibold text-zinc-500 leading-relaxed">
              Jika ada berkas seperti Surat Keterangan Sehat, Surat Pernyataan, Kartu Pelajar, atau Sertifikat Prestasi yang belum sempat diunggah saat mendaftar, Anda dapat mengunggahnya di sini.
            </p>
          </div>

          {docSuccess ? (
            <div className="rounded-[12px] bg-emerald-50 p-6 text-center border border-emerald-200">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <h4 className="mt-3 text-lg font-black text-emerald-950">Berkas Berhasil Diunggah!</h4>
              <p className="mt-1 text-xs font-semibold text-emerald-800 max-w-md mx-auto">
                Berkas tambahan Anda telah berhasil diarsipkan ke dalam profil pendaftaran siswa.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDocSuccess(false);
                  setDocForm({
                    registrationNumber: "",
                    studentName: "",
                    documentType: "Surat Keterangan Sehat",
                    fileUrl: ""
                  });
                }}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[8px] bg-emerald-700 px-5 text-xs font-black text-white hover:bg-emerald-800"
              >
                Upload Berkas Lainnya
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitDoc} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Nomor Pendaftaran Siswa <span className="text-rosebrand-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.registrationNumber}
                    onChange={(e) => setDocForm({ ...docForm, registrationNumber: e.target.value })}
                    placeholder="Contoh: 10001 (5 digit)"
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Nama Lengkap Siswa <span className="text-rosebrand-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.studentName}
                    onChange={(e) => setDocForm({ ...docForm, studentName: e.target.value })}
                    placeholder="Nama calon siswa"
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-amber-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Jenis Berkas yang Diunggah <span className="text-rosebrand-600">*</span>
                  </label>
                  <select
                    value={docForm.documentType}
                    onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                    className="mt-2 h-12 w-full rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-800 outline-none focus:border-amber-600"
                  >
                    {SUPPLEMENTARY_DOC_TYPES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                    Pilih File Dokumen <span className="text-rosebrand-600">*</span>
                  </label>
                  <p className="mt-0.5 text-[11px] text-zinc-500">Format PDF, JPG, PNG (Maksimal 10MB)</p>
                  <div className="mt-2">
                    <label className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
                      {uploadingField === "docFile" ? (
                        <Loader2 size={16} className="animate-spin text-amber-600" />
                      ) : docForm.fileUrl ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <Upload size={16} />
                      )}
                      <span>{docForm.fileUrl ? "Dokumen Terunggah (Klik untuk Mengganti)" : "Pilih Dokumen dari HP / Laptop"}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, "docFile", "doc");
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-amber-600 text-sm font-black text-white shadow-md hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Upload Dokumen Susulan Sekarang
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
