<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        @page {
            margin: 12mm 10mm 15mm 10mm;
            size: A4 landscape;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            color: #1a1a1a;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-cell {
            width: 70px;
            text-align: center;
        }
        .logo-img {
            max-width: 60px;
            max-height: 60px;
        }
        .school-title {
            text-align: center;
        }
        .school-name {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            color: #111;
        }
        .school-subtitle {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            color: #111;
            letter-spacing: 0.5px;
        }
        .school-name {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 2px 0;
            color: #111;
        }
        .school-academic-year {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #333;
            margin: 0;
        }
        .divider-double {
            border-top: 2px solid #111;
            border-bottom: 1px solid #111;
            height: 2px;
            margin: 4px 0 8px 0;
        }
        .report-meta {
            width: 100%;
            margin-bottom: 8px;
            border-collapse: collapse;
            font-size: 9px;
        }
        .report-meta td {
            padding: 2px 4px;
        }
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 8px;
        }
        .matrix-table th, .matrix-table td {
            border: 1px solid #777;
            padding: 2px 1px;
            text-align: center;
        }
        .matrix-table th {
            background-color: #f1f3f5;
            font-weight: bold;
            color: #222;
        }
        .matrix-table td.name-col {
            text-align: left;
            padding-left: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 140px;
        }
        .matrix-table td.sunday {
            background-color: #f8f9fa;
            color: #aaa;
        }
        .status-h {
            color: #059669;
            font-weight: bold;
        }
        .status-s {
            color: #2563eb;
            font-weight: bold;
        }
        .status-i {
            color: #d97706;
            font-weight: bold;
        }
        .status-a {
            color: #dc2626;
            font-weight: bold;
        }
        .status-t {
            color: #9333ea;
            font-weight: bold;
        }
        .total-col {
            font-weight: bold;
            background-color: #fafafa;
        }
        .legend-box {
            margin-top: 8px;
            font-size: 8px;
            display: inline-block;
        }
        .legend-item {
            display: inline-block;
            margin-right: 12px;
        }
        .signature-table {
            width: 100%;
            margin-top: 14px;
            border-collapse: collapse;
            font-size: 9px;
        }
        .signature-table td {
            width: 50%;
            vertical-align: top;
            text-align: center;
        }
        .signature-space {
            height: 45px;
        }
    </style>
</head>
<body>

    <!-- KOP SURAT RESMI -->
    <table class="header-table">
        <tr>
            @if(!empty($logoBase64))
                <td class="logo-cell">
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo">
                </td>
            @endif
            <td class="school-title">
                <div class="school-subtitle">DAFTAR HADIR SISWA</div>
                <div class="school-name">{{ $school->name ?? 'SD DIGITAL INDONESIA' }}</div>
                <div class="school-academic-year">
                    TAHUN PELAJARAN {{ strtoupper($classroom->academic_year ?? (date('m') >= 7 ? date('Y') . '/' . (date('Y') + 1) : (date('Y') - 1) . '/' . date('Y'))) }}
                </div>
            </td>
        </tr>
    </table>

    <div class="divider-double"></div>

    <!-- JUDUL LAPORAN & METADATA -->
    <table class="report-meta">
        <tr>
            <td style="width: 60%;">
                <strong>LAPORAN PRESENSI SISWA {{ strtoupper($periodLabel) }}</strong><br>
                <span>Tahun Ajaran: {{ $classroom->academic_year ?? '-' }}</span>
            </td>
            <td style="width: 40%; text-align: right;">
                <span>Kelas: <strong>{{ $classroom->name ?? 'Semua Kelas' }}</strong></span><br>
                <span>Wali Kelas: <strong>{{ $classroom->homeroomTeacher->name ?? '-' }}</strong></span>
            </td>
        </tr>
    </table>

    <!-- TABEL MATRIKS PRESENSI -->
    <table class="matrix-table">
        <thead>
            <tr>
                <th rowspan="2" style="width: 22px;">No</th>
                <th rowspan="2" style="width: 65px;">NISN</th>
                <th rowspan="2" style="width: 45px;">NIS</th>
                <th rowspan="2" style="width: 130px;">Nama Siswa</th>
                <th rowspan="2" style="width: 20px;">L/P</th>
                @if(count($days) > 0)
                    <th colspan="{{ count($days) }}">Tanggal (Bulan: {{ $monthName }} {{ $year }})</th>
                @endif
                <th colspan="5">Rekapitulasi</th>
                <th rowspan="2" style="width: 32px;">%</th>
            </tr>
            <tr>
                @foreach($days as $day)
                    @php
                        $isRedDay = $day['is_holiday'] || $day['is_sunday'] || ($day['is_saturday'] ?? false);
                    @endphp
                    <th style="width: 14px; {{ $isRedDay ? 'background-color: #fee2e2; color: #dc2626;' : '' }}">
                        <div style="font-size: 8px; font-weight: bold;">{{ $day['day'] }}</div>
                        <div style="font-size: 7px; font-weight: bold; {{ $isRedDay ? 'color: #dc2626;' : 'color: #666;' }}">
                            {{ $day['day_initial'] ?? substr($day['day_name'] ?? '', 0, 1) }}
                        </div>
                    </th>
                @endforeach
                <th style="width: 20px; background-color: #dcfce7; color: #059669;">H</th>
                <th style="width: 20px; background-color: #dbeafe; color: #2563eb;">S</th>
                <th style="width: 20px; background-color: #fef3c7; color: #d97706;">I</th>
                <th style="width: 20px; background-color: #fee2e2; color: #dc2626;">A</th>
                <th style="width: 20px; background-color: #f3e8ff; color: #9333ea;">T</th>
            </tr>
        </thead>
        <tbody>
            @forelse($students as $idx => $student)
                <tr>
                    <td>{{ $idx + 1 }}</td>
                    <td style="font-family: monospace;">{{ $student['nisn'] }}</td>
                    <td style="font-family: monospace;">{{ $student['nis'] }}</td>
                    <td class="name-col">{{ $student['name'] }}</td>
                    <td>{{ $student['gender'] }}</td>

                    @if(count($days) > 0)
                        @foreach($days as $day)
                            @php
                                $dNumber = $day['day'];
                                $daily = $student['daily_attendances'][$dNumber] ?? null;
                                $code = $daily['code'] ?? ($day['is_sunday'] || ($day['is_saturday'] ?? false) ? '-' : '.');
                                $isRedDay = $day['is_holiday'] || $day['is_sunday'] || ($day['is_saturday'] ?? false);
                            @endphp
                            <td class="{{ $day['is_sunday'] || ($day['is_saturday'] ?? false) ? 'sunday' : '' }}"
                                style="{{ $isRedDay ? 'background-color: #fef2f2;' : '' }}">
                                @if($code === 'H')
                                    <span class="status-h">H</span>
                                @elseif($code === 'T')
                                    <span class="status-t">T</span>
                                @elseif($code === 'S')
                                    <span class="status-s">S</span>
                                @elseif($code === 'I')
                                    <span class="status-i">I</span>
                                @elseif($code === 'A')
                                    <span class="status-a">A</span>
                                @elseif($code === 'L' || $day['is_holiday'])
                                    <span style="color: #dc2626; font-weight: bold;">L</span>
                                @elseif($day['is_sunday'] || ($day['is_saturday'] ?? false))
                                    <span style="color: #ef4444;">-</span>
                                @else
                                    <span style="color: #ddd;">.</span>
                                @endif
                            </td>
                        @endforeach
                    @endif

                    <td class="total-col" style="color: #059669;">{{ $student['hadir'] }}</td>
                    <td class="total-col" style="color: #2563eb;">{{ $student['sakit'] }}</td>
                    <td class="total-col" style="color: #d97706;">{{ $student['izin'] }}</td>
                    <td class="total-col" style="color: #dc2626;">{{ $student['alpha'] }}</td>
                    <td class="total-col" style="color: #9333ea;">{{ $student['terlambat'] }}</td>
                    <td class="total-col">{{ $student['percentage'] }}%</td>
                </tr>
            @empty
                <tr>
                    <td colspan="{{ 6 + count($days) + 5 }}" style="padding: 15px; text-align: center; color: #888;">
                        Tidak ada data siswa atau presensi pada periode yang dipilih.
                    </td>
                </tr>
            @endforelse
        </tbody>
        @if(count($students) > 0 && count($days) > 0)
            <tfoot>
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td colspan="5" style="text-align: right; padding-right: 6px;">Total Hadir Harian:</td>
                    @foreach($days as $day)
                        @php
                            $dNumber = $day['day'];
                            $hCount = $dailyTotals[$dNumber]['hadir'] ?? 0;
                            $isRedDay = $day['is_holiday'] || $day['is_sunday'] || ($day['is_saturday'] ?? false);
                        @endphp
                        <td style="{{ $isRedDay ? 'background-color: #fee2e2; color: #dc2626;' : '' }}">
                            {{ $day['is_holiday'] ? 'L' : (($day['is_sunday'] || ($day['is_saturday'] ?? false)) ? '-' : ($hCount > 0 ? $hCount : '-')) }}
                        </td>
                    @endforeach
                    <td style="color: #059669;">{{ $summary['total_hadir'] }}</td>
                    <td style="color: #2563eb;">{{ $summary['total_sakit'] }}</td>
                    <td style="color: #d97706;">{{ $summary['total_izin'] }}</td>
                    <td style="color: #dc2626;">{{ $summary['total_alpha'] }}</td>
                    <td style="color: #9333ea;">{{ $summary['total_terlambat'] }}</td>
                    <td>-</td>
                </tr>
            </tfoot>
        @endif
    </table>

    <!-- KETERANGAN / LEGENDA -->
    <div class="legend-box" style="width: 100%; margin-top: 6px;">
        <strong>Keterangan Status:</strong>
        <span class="legend-item"><strong class="status-h">H</strong> = Hadir</span>
        <span class="legend-item"><strong class="status-t">T</strong> = Terlambat</span>
        <span class="legend-item"><strong class="status-s">S</strong> = Sakit</span>
        <span class="legend-item"><strong class="status-i">I</strong> = Izin</span>
        <span class="legend-item"><strong class="status-a">A</strong> = Alpha / Tanpa Keterangan</span>
        <span class="legend-item"><strong style="color: #dc2626;">L</strong> = Libur Resmi (Tidak Dihitung)</span>
        <span class="legend-item"><strong style="color: #dc2626;">-</strong> = Libur Akhir Pekan (Sabtu / Minggu)</span>
    </div>

    @if(!empty($periodHolidays) && count($periodHolidays) > 0)
        <!-- CATATAN HARI LIBUR KALENDER PENDIDIKAN (TULISAN MIRING) -->
        <div style="margin-top: 4px; font-size: 8px; color: #b91c1c;">
            <strong>Catatan Hari Libur Kalender Pendidikan:</strong>
            @foreach($periodHolidays as $h)
                <span style="font-style: italic; margin-right: 12px; display: inline-block;">
                    * {{ $h->formatted_dates }}: {{ $h->name }} ({{ $h->type_name }})@if($h->description) - {{ $h->description }}@endif
                </span>
            @endforeach
        </div>
    @endif

    <!-- KETERANGAN REKAPITULASI JUMLAH SISWA -->
    <div style="margin-top: 6px; font-size: 8.5px; border-top: 1px dashed #bbb; padding-top: 4px;">
        <span style="font-weight: bold; margin-right: 18px;">Jumlah Laki-laki = {{ $genderStats['male'] ?? 0 }}</span>
        <span style="font-weight: bold; margin-right: 18px;">Jumlah Perempuan = {{ $genderStats['female'] ?? 0 }}</span>
        <span style="font-weight: bold; color: #111;">Total = {{ $genderStats['total'] ?? 0 }}</span>
    </div>

    <!-- TANDA TANGAN PENGESAHAN -->
    <table class="signature-table">
        <tr>
            <td>
                Mengetahui,<br>
                Wali Kelas {{ $classroom->name ?? '' }}
                <div class="signature-space"></div>
                <strong>{{ $classroom->homeroomTeacher->name ?? '( .................................................. )' }}</strong><br>
                NIP. {{ $classroom->homeroomTeacher->nip ?? '-' }}
            </td>
            <td>
                {{ $school->city ?? 'Kota' }}, {{ $printedAt }}<br>
                Kepala Sekolah,
                <div class="signature-space"></div>
                <strong>{{ $school->principal_name ?? '( .................................................. )' }}</strong><br>
                NIP. {{ $school->principal_nip ?? '-' }}
            </td>
        </tr>
    </table>

</body>
</html>

