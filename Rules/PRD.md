## 2. Product Requirements Document (PRD)

### 2.1 User Journeys & Scenarios

#### Skenario 1: Presensi Reguler Pagi (Wali Kelas)

1. Wali Kelas masuk ke sistem, memilih menu **Presensi Harian**.
2. Sistem otomatis menampilkan daftar siswa kelas yang diampunya untuk hari aktif dengan status *default* **Hadir**.
3. Wali Kelas mengubah status siswa yang tidak masuk (**Sakit**, **Izin**, **Alpa**).
4. Klik **Simpan Presensi**. Data tersimpan dengan status *Locked* (dapat dibuka kembali via otoritas Guru Piket/Admin jika ada revisi).

#### Skenario 2: Pencatatan Keterlambatan (Guru Piket)

1. Guru Piket berjaga di gerbang/meja piket dan membuka menu **Catat Keterlambatan**.
2. Guru Piket mencari nama/NIS siswa yang datang terlambat.
3. Guru Piket menginput jam tiba, alasan keterlambatan, dan sanksi/tindakan (opsional).
4. Sistem memperbarui status presensi siswa tersebut menjadi **Hadir (Terlambat)** dengan durasi keterlambatan tercatat otomatis berdasarkan ambang batas jam masuk.

#### Skenario 3: Absen Khusus (Izin Pulang Lebih Awal / Sakit di Sekolah)

1. Siswa yang paginya berstatus **Hadir** melapor ke Guru Piket karena sakit mendadak atau ada urusan mendesak.
2. Guru Piket membuka menu **Presensi Khusus / Izin Pulang Awal**.
3. Guru Piket memilih nama siswa, memilih kategori (`Izin Pulang Cepat` atau `Sakit`), memasukkan waktu keluar, keterangan/penjemput, serta mengunggah bukti/surat jalan jika ada.
4. Sistem memperbarui rekaman presensi hari itu tanpa menghapus status kehadiran paginya, melainkan menandainya dengan status komposit (misal: *Hadir - Pulang Awal: Sakit*). Notifikasi/status otomatis tertera di dashboard Wali Kelas.

### 2.2 Functional Requirements Matrix

* **FR-01 (Autentikasi & RBAC):** Multi-role authentication (Admin, Kepsek, Guru, Guru Piket, Siswa).
* **FR-02 (Manajemen Rombel & Jadwal Piket):** Penetapan wali kelas per rombel dan jadwal piket harian guru.
* **FR-03 (Batch Presensi Kelas):** Formulir pengisian kehadiran siswa secara massal per kelas dengan opsi status: *Hadir*, *Sakit*, *Izin*, *Alpa*.
* **FR-04 (Global Presensi Guru Piket):** Akses lintas kelas bagi Guru Piket aktif untuk melakukan entri kehadiran kelas yang wali kelasnya berhalangan.
* **FR-05 (Pelacak Keterlambatan):** Modul *quick-input* pencatatan keterlambatan dengan perhitungan otomatis menit keterlambatan terhadap *cut-off time*.
* **FR-06 (Presensi Khusus/Mid-Day Status):** Alur verifikasi pergantian status siswa di tengah hari (pulang lebih awal karena sakit/keperluan penting) disertai pencatatan timestamp dan alasan penjemputan.
* **FR-07 (Laporan & Ekspor):** Ekspor rekapitulasi mingguan/bulanan/semesteran ke format PDF dan Excel/CSV dengan filter per kelas, rentang tanggal, atau siswa tertentu.

---
