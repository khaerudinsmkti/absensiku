# AbsensiKu Design System & UI Specification

Dokumentasi ini merangkum seluruh spesifikasi desain visual, design token, komponen antarmuka, dan arsitektur tata letak dari aplikasi **AbsensiKu SD (Sistem Absensi Siswa Digital)** untuk digunakan sebagai pedoman pengembangan frontend web/mobile.

---

## 1. Fondasi Visual & Design Tokens

### 1.1 Skema Warna (Color Palette)

Aplikasi mengusung tema cerah, bersahabat, dan energetik (*warm & modern school palette*) yang mengombinasikan oranye cerah, teal, ungu, serta palet semantik kehadiran.

#### Warna Merek & Aksen (Brand Colors)
| Token | Hex | Role / Penggunaan |
| :--- | :--- | :--- |
| `--primary` | `#FF6B35` | Warna utama, tombol aksi primer, active indicator |
| `--primary-dark` | `#E55A25` | State hover aksi utama |
| `--primary-light` | `#FFF0EB` | Background badge, soft card, ring hover |
| `--secondary` | `#4ECDC4` | Warna pendukung (teal cerah) |
| `--secondary-dark` | `#3DBDB4` | Teks chip, tombol alternatif |
| `--secondary-light`| `#E8FAF9` | Background chip kelas / data siswa |
| `--accent` | `#FFE66D` | Aksen kuning hangat, gradient sidebar/header |
| `--accent-dark` | `#F5D800` | State aktif aksen kuning |
| `--accent-light` | `#FFFBE6` | Background badge aksen |
| `--purple` | `#A78BFA` | Modul keterlambatan, avatar, chip perempuan |
| `--purple-dark` | `#7C3AED` | Aksen keterlambatan, chart late rank |
| `--purple-light` | `#EDE9FE` | Container background keterlambatan |
| `--pink` | `#F472B6` | Aksen tambahan |
| `--pink-light` | `#FCE7F3` | Background soft aksen pink |

#### Warna Semantik & Status Kehadiran
| Status | Token | Warna Dasar | Background Soft | Border / Teks |
| :--- | :--- | :--- | :--- | :--- |
| **Hadir (H)** | `--success` | `#10B981` | `#DCFCE7` | `#059669` |
| **Sakit (S)** | `--info` | `#3B82F6` | `#DBEAFE` | `#1D4ED8` |
| **Izin (I)** | `--warning` | `#F59E0B` | `#FEF3C7` | `#B45309` |
| **Alpha (A)** | `--danger` | `#EF4444` | `#FEE2E2` | `#DC2626` |
| **Terlambat** | `--purple-dark`| `#7C3AED` | `#EDE9FE` | `#6D28D9` |
| **Absen Khusus**| `--secondary-dark`| `#0D9488` | `#CCFBF1` | `#0F766E` |

#### Skala Netral (Grayscale)
* `--gray-50`: `#FAFAFA` (Card subtle background)
* `--gray-100`: `#F5F5F5` (Table divider, input default, tab pill background)
* `--gray-200`: `#E8E8E8` (Border standar card & input)
* `--gray-300`: `#D1D5DB` (Border sekunder, placeholder soft)
* `--gray-400`: `#9CA3AF` (Muted text, empty icon)
* `--gray-500`: `#6B7280` (Secondary text, label penjelasan)
* `--gray-600`: `#4B5563` (Body text sekunder)
* `--gray-700`: `#374151` (Label form input)
* `--gray-800`: `#1F2937` (Teks utama)
* `--gray-900`: `#111827` (Heading, judul tebal)

---

### 1.2 Surface & Gradients

* **Halaman Utama (Body Background):**
  ```css
  background: linear-gradient(135deg, #FFF8F5 0%, #F0FFFE 50%, #FFF8FF 100%);
  ```
* **Sidebar Gelap (Dark Sidebar):**
  ```css
  background: linear-gradient(180deg, #1A1033 0%, #2D1B69 60%, #1E3A5F 100%);
  ```
* **Login Hero Background:**
  ```css
  background: linear-gradient(135deg, #FF6B35 0%, #FFE66D 40%, #4ECDC4 100%);
  ```
* **Page Banner Gradient:**
  ```css
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C5A 50%, #F59E0B 100%);
  ```
* **Modal Backdrop:**
  ```css
  background: rgba(26, 16, 51, 0.45);
  backdrop-filter: blur(4px);
  ```

---

### 1.3 Tipografi & Iconography

* **Font Utama:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
* **Weight Hierarchy:**
  * `Light: 300`
  * `Regular: 400` (Body text tabel, deskripsi panjang)
  * `Medium: 500` (Nav item, label sekunder)
  * `Semi-Bold: 600` (Label form, tombol aksi)
  * `Bold: 700` (Card title, heading section, badge status)
  * `Extra-Bold: 800 / 900` (Nilai counter stat-card, persentase ring)
* **Icon Set:** Google `Material Symbols Outlined`
  * Standar ukuran: `14px` (inline chip), `18-20px` (nav & table action), `24-28px` (banner & stat card), `40px+` (empty state).

---

### 1.4 Ukuran & Radius (Border Radius Hierarchy)

* **Kontrol Kecil (Inputs, Badges, Chips):** `8px` – `12px`
* **Elemen Interaktif (Buttons, Icon Containers):** `12px` – `14px`
* **Kontainer Utama (Cards, Stat Boxes, Banner):** `18px`
* **Dialog & Modal Card:** `22px` – `28px`
* **Dimensi Navigasi:**
  * Lebar Sidebar: `270px` (Normal) | `76px` (Collapsed)
  * Tinggi Topbar: `68px` (Fixed/Sticky blur)

---

## 2. Spesifikasi Komponen (Component Specs)

### 2.1 Buttons (`.btn`)
Semua tombol memiliki base: font weight `600`, transisi `0.2s`, animasi hover sedikit terangkat (`transform: translateY(-1px)`).

| Varian | Style Background | Teks & Shadow |
| :--- | :--- | :--- |
| `btn-primary` | `linear-gradient(135deg, #FF6B35, #FF8C5A)` | Putih, Shadow: `0 4px 14px rgba(255,107,53,.35)` |
| `btn-success` | `linear-gradient(135deg, #10B981, #34D399)` | Putih, Shadow: `0 4px 12px rgba(16,185,129,.3)` |
| `btn-danger` | `linear-gradient(135deg, #EF4444, #F87171)` | Putih, Shadow: `0 4px 12px rgba(239,68,68,.3)` |
| `btn-warning` | `linear-gradient(135deg, #F59E0B, #FCD34D)` | Putih, Shadow: `0 4px 12px rgba(245,158,11,.3)` |
| `btn-info` | `linear-gradient(135deg, #3B82F6, #60A5FA)` | Putih, Shadow: `0 4px 12px rgba(59,130,246,.3)` |
| `btn-secondary` | `linear-gradient(135deg, #4ECDC4, #6EE7E2)` | Putih, Shadow: `0 4px 12px rgba(78,205,196,.3)` |
| `btn-ghost` | `transparent`, Border `2px solid #E8E8E8` | Teks: `#4B5563` (Hover: `#F5F5F5`) |
| `btn-outline` | `transparent`, Border `2px solid #FF6B35` | Teks: `#FF6B35` (Hover: `#FFF0EB`) |

---

### 2.2 Input & Form Controls
* **Input, Select, Textarea:**
  * Background: `#FFFFFF`
  * Border: `2px solid #E8E8E8`
  * Radius: `12px`
  * Padding: `11px 14px` (Standar) | `7px 10px` (Filter Bar / Compact)
  * **State Focus:** Border `#FF6B35`, Box-shadow `0 0 0 4px rgba(255,107,53,.12)`

---

### 2.3 Kartu Statistik (`.stat-card`)
Digunakan pada dashboard rekapitulasi data:
* **Container:** Background putih, Border `2px solid #E8E8E8`, Radius `18px`, Padding `20px`.
* **Hover:** `translateY(-2px)` dengan shadow lembut.
* **Icon Wrapper (`.stat-icon`):** Ukuran `52x52px`, Radius `14px`, warna gradient pastel sesuai tema data (misal: hijau untuk hadir, merah untuk alpha, oranye untuk terlambat).
* **Stat Value:** Ukuran teks `26px`, Weight `800`.
* **Stat Label:** Ukuran teks `12px`, Weight `500`, Color `#6B7280`.

---

### 2.4 Radio Button Presensi Kapsul (`.att-radio-group`)
Format selector kehadiran cepat untuk guru/piket tanpa dropdown:
* Elemen `<input type="radio">` disembunyikan.
* Label berwujud chip/kapsul dengan radius `10px` dan font weight `700`.
* **State Checked:**
  * **Hadir:** Background `#DCFCE7`, Border `#16A34A`, Text `#059669`
  * **Sakit:** Background `#DBEAFE`, Border `#2563EB`, Text `#1D4ED8`
  * **Izin:** Background `#FEF3C7`, Border `#D97706`, Text `#B45309`
  * **Alpha:** Background `#FEE2E2`, Border `#DC2626`, Text `#DC2626`
* **State Unchecked:** Background `#FAFAFA`, Border `#E8E8E8`, Text `#6B7280`

---

### 2.5 Data Table & Rekapitulasi Matriks
* **Table Header (`th`):**
  * Background: `linear-gradient(135deg, #FFF8F5, #FFF0EB)`
  * Border bawah: `2px solid #FFD4C2`
  * Typography: Teks uppercase, font size `12px`, weight `700`, color `#FF6B35`, letter-spacing `0.06em`.
* **Table Body (`td`):**
  * Border bawah: `1px solid #F5F5F5`
  * Alternate row (Zebra): `rgba(78, 205, 196, 0.03)`
  * Hover row: `linear-gradient(135deg, #FFF8F5, #F0FFFE)`
* **Sticky Columns (Pada Rekap Matriks Bulanan):** Kolom Nomor, NISN, dan Nama Siswa disematkan `position: sticky; left: 0; background: #fff` agar tabel horizontal scrollable tanpa kehilangan konteks siswa.

---

### 2.6 Visualisasi & Charts
1. **Stacked Progress Bar:** Bar tinggi `10px - 14px` dengan radius `8px` yang membagi segmen kehadiran (Hadir, Sakit, Izin, Alpha) secara proporsional dengan transisi lebar `0.5s`.
2. **Circular Ring Chart (`.pct-ring`):** SVG Circle 64x64px dengan ketebalan stroke `8px`. Menggunakan `stroke-dasharray` dinamis:
   * $\ge 80\%$ : `#10B981` (Baik)
   * $60\% - 79\%$ : `#F59E0B` (Cukup)
   * $< 60\%$ : `#EF4444` (Rendah)
3. **Skeleton Loading:** Menggunakan animasi shimmering gradien linear dari `#FFF0EB` ke `#FFD4C2` berdurasi `1.4s infinite`.

---

## 3. Tata Letak (Layout Structure)

```
+------------------------------------------------------------------+
| SIDEBAR (270px)          | TOPBAR (Height: 68px, Sticky Blur)    |
| - Logo & Nama Sekolah    +---------------------------------------+
| - Info Akun User Aktif   | MAIN CONTENT                          |
| - Menu Navigasi          | - Page Banner                         |
|   * Dashboard            | - Stats Grid (4 - 8 Cards)            |
|   * Absensi              | - Filter Bar                          |
|   * Keterlambatan        | - Table / Data Cards Container        |
|   * Absen Khusus         | - Pagination Controls                 |
|   * Laporan              |                                       |
|   * Master Data          |                                       |
| - Tombol Logout          |                                       |
+--------------------------+---------------------------------------+
```

### Breakpoints Responsif
* **Desktop ($> 768\text{px}$):** Sidebar permanen di kiri, konten utama memiliki margin-left `270px` (atau `76px` jika collapsed).
* **Tablet / Mobile ($\le 768\text{px}$):**
  * Sidebar berpindah ke mode drawer (`transform: translateX(-100%)`) dengan overlay backdrop.
  * Margin-left konten utama menjadi `0`.
  * Tombol hamburger muncul di topbar.
  * Form grid 2-kolom (`.form-row`) berubah menjadi 1-kolom.
  * Grid statistik beradaptasi menjadi 2-kolom atau 1-kolom.

---

## 4. Konfigurasi Tailwind CSS (Acuan Setup)

Bila Anda ingin mengadopsi design system ini ke proyek frontend modern berbasis Tailwind CSS, gunakan konfigurasi berikut:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B35',
          'primary-dark': '#E55A25',
          'primary-light': '#FFF0EB',
          secondary: '#4ECDC4',
          'secondary-dark': '#3DBDB4',
          'secondary-light': '#E8FAF9',
          accent: '#FFE66D',
          'accent-dark': '#F5D800',
          'accent-light': '#FFFBE6',
          purple: '#A78BFA',
          'purple-dark': '#7C3AED',
          'purple-light': '#EDE9FE',
        },
        sidebar: {
          start: '#1A1033',
          mid: '#2D1B69',
          end: '#1E3A5F',
        }
      },
      borderRadius: {
        'card': '18px',
        'modal': '22px',
        'box': '28px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 14px rgba(255, 107, 53, 0.35)',
        'modal': '0 24px 70px rgba(255, 107, 53, 0.18)',
      }
    },
  },
  plugins: [],
}
```