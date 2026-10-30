Dokumen spesifikasi rekayasa perangkat lunak untuk **Sistem Absensi Siswa Terpadu** berbasis **Laravel + Inertia.js / React + Tailwind CSS**:

---

## 1. Business Requirements Document (BRD)

### 1.1 Project Overview

Sistem Absensi Siswa Terpadu dirancang untuk mendigitalkan proses pencatatan kehadiran, mengotomatisasi pelaporan presensi secara *real-time*, memantau kedisiplinan (keterlambatan), serta menangani perubahan status kehadiran di tengah hari (pulang awal/sakit mendadak) secara transparan antarpemangku kepentingan sekolah.

### 1.2 Business Objectives

* Menghilangkan proses pencatatan kehadiran berbasis kertas yang rentan manipulasi dan lambat direkap.
* Memfasilitasi koordinasi cepat antara wali kelas dan guru piket dalam mengelola presensi harian.
* Memberikan transparansi data presensi kepada pihak manajemen (Kepala Sekolah) dan siswa/wali murid secara *real-time*.
* Menyediakan catatan audit (*log trail*) yang jelas untuk kasus keterlambatan dan izin kepulangan lebih awal.

### 1.3 User Personas & Access Scope

| Role | Deskripsi & Tanggung Jawab Utama | Cakupan Akses Presensi |
| --- | --- | --- |
| **Admin** | Administrator sistem (IT/Tata Usaha); kelola master data, akun, kalender akademik, dan konfigurasi sistem. | Semua kelas & seluruh modul konfigurasi. |
| **Kepala Sekolah** | Eksekutif/Pimpinan; memantau analitik kehadiran, tren kedisiplinan, dan laporan rekapitulasi berkala. | Mode *read-only* seluruh kelas, analitik, dan cetak laporan. |
| **Guru (Wali Kelas)** | Pendidik penanggung jawab kelas; mengisi presensi harian siswa binaan. | Terbatas pada rombel/kelas yang diampu. |
| **Guru Piket** | Petugas ketertiban harian; memantau pintu gerbang, input keterlambatan, dan mengabsen kelas jika wali kelas berhalangan. | Lintas seluruh rombel/kelas pada hari bertugas. |
| **Siswa** | Peserta didik; melihat rekapitulasi presensi pribadi, status keterlambatan, dan riwayat izin. | Terbatas pada data pribadi. |

---

