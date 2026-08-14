# Const AI Mobile

> Platform Asisten Cerdas Mandiri, Mesin Suara Neural On-Device, dan Agen Pengembang Otonom

Const AI Mobile adalah platform multi-fungsi yang menggabungkan asisten produktivitas cerdas, mesin Text-to-Speech (TTS) neural lokal berkecepatan tinggi berbasis ONNX Runtime, agen coding otonom dengan integrasi terminal shell lokal (Android Termux), serta orkestrasi otomasi terjadwal 24/7 menggunakan backend reaktif Convex dan Web Control Center berbasis Next.js.

---

## Pilar Arsitektur Sistem

### 1. Personal Productivity Assistant
- Antarmuka percakapan interaktif multimodal (teks dan suara).
- Manajemen jadwal, ringkasan berkala, pencatatan otomatis, dan integrasi kalender/kontak.
- **Natural Language Settings**: Konfigurasi parameter sistem (seperti pemilihan model bahasa, persona suara, atau mode eksekusi) dapat diperbarui secara dinamis langsung melalui percakapan.
- **Long-Term Memory**: Penyimpanan konteks dan preferensi pengguna secara persisten pada basis data reaktif Convex.

### 2. On-Device Neural Voice Engine (Supertonic-3)
- **Zero API Cost & Zero Network Latency**: Model TTS 99M parameter berjalan sepenuhnya secara lokal di perangkat menggunakan ONNX Runtime (akselerasi NNAPI pada Android dan CoreML pada iOS).
- **Kualitas Audio Tinggi**: Menghasilkan sinyal audio 44.1 kHz 16-bit PCM/WAV dengan latensi inferensi rendah.
- **Emotion & Expression Tags**: Mendukung sintesis ekspresi natural melalui tag percakapan seperti `<laugh>`, `<breath>`, `<sigh>`.
- **On-Demand Asset Manager**: Ukuran distribusi aplikasi tetap ramping (<50 MB); aset model (~250 MB) diunduh sesuai kebutuhan pengguna dengan verifikasi integritas checksum SHA-256.
- **Dukungan Preset & Custom Style**: Menyediakan 10 profil suara bawaan serta kemampuan mengimpor konfigurasi embedding bobot suara kustom berbasis JSON.

### 3. Autonomous Coding & Execution Engine
- Menganalisis repositori, memodifikasi berkas kode, dan memvalidasi hasil build secara otomatis.
- **4 Mode Kebijakan Eksekusi (Operating Modes)**:
  1. **Plan Mode**: Memproduksi dokumen perencanaan teknis (`implementation_plan.md`) sebelum melakukan modifikasi kode.
  2. **Ask Before Change (Strict HITL)**: Setiap modifikasi berkas atau eksekusi perintah terminal memerlukan persetujuan eksplisit pengguna melalui modal Human-In-The-Loop.
  3. **Edit Automatically**: Modifikasi berkas dan perintah aman dieksekusi secara otomatis, hanya meminta konfirmasi untuk operasi berisiko tinggi.
  4. **Full Access (Autonomous)**: Eksekusi otomatis penuh tanpa konfirmasi manual untuk tugas terotomasi.
- **Integrated Terminal & Background Service**: Antarmuka terminal interaktif bawaan yang didukung oleh Android Foreground Service dan wakelock manager untuk memastikan tugas kompilasi atau proses shell tetap berjalan di latar belakang.

### 4. Autonomous Scheduled Tasks & Connectors
- Menjalankan tugas terjadwal (Cron) di latar belakang secara kontinu menggunakan Convex Cron dan integrasi Model Context Protocol (MCP) serta Composio.
- Mengirimkan ringkasan status berkala melalui sistem notifikasi push ke perangkat mobile.

---

## Struktur Monorepo

Proyek ini dikelola menggunakan arsitektur monorepo berbasis Turborepo dan PNPM Workspaces:

```text
const-ai-mobile/
├── apps/
│   ├── mobile/              # React Native Expo (Android Standalone & iOS Companion)
│   └── web/                 # Next.js 15 Web Control Center (Tailwind CSS & Shadcn UI)
│
├── packages/
│   ├── backend/             # Convex Real-Time Hub & Database Schema
│   └── types/               # Definisi tipe TypeScript bersama
│
├── pnpm-workspace.yaml      # Konfigurasi workspace PNPM
├── turbo.json               # Konfigurasi pipeline build Turborepo
└── package.json             # Root package script
```

---

## Memulai Pengembangan

### Prasyarat
- Node.js (v20+)
- PNPM (v10+)

### Instalasi Dependensi
```bash
pnpm install
```

### Menjalankan Lingkungan Pengembangan
```bash
# Menjalankan seluruh stack secara paralel
pnpm dev

# Menjalankan aplikasi tertentu
pnpm dev:web        # Menjalankan Next.js Web Dashboard (Port 3000)
pnpm dev:mobile     # Menjalankan Expo Mobile Bundler
pnpm dev:backend    # Menjalankan Convex Real-Time Backend
```

### Validasi Kode
```bash
pnpm typecheck      # Menjalankan validasi TypeScript di seluruh package
pnpm build          # Membangun bundle produksi
```

---

## Dokumentasi Teknis

Spesifikasi mendalam mengenai arsitektur sistem, alur data audio, diagram interaksi komponen, dan skema basis data lengkap tersedia pada berkas [ARCHITECTURE.md](file:///d:/Code/Platform/const-ai-mobile/ARCHITECTURE.md).
