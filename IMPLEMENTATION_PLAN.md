# Granular Implementation Breakdown: Const AI Mobile

Berikut adalah rincian pemecahan implementasi **sangat mendetil (fitur per fitur, layar per layar, dan modul per modul)** layaknya membangun produk digital komprehensif dari nol:

---

## 🧱 BAGIAN 1: Fondasi Backend & Otak AI (`packages/backend` & `packages/types`)

### 1.1. Shared Types Module (`packages/types`)
- [x] Buat interface **`DeviceTools`**: Parameter untuk Kontak, Media/Foto, Junk Storage, App Management, dan Hardware.
- [x] Buat interface **`AccessibilityNode`**: Struktur elemen UI layar (`id`, `text`, `bounds`, `centerX`, `centerY`, `clickable`, `editable`).
- [x] Buat interface **`ShizukuPayload` & `TermuxPayload`**: Struktur data eksekusi perintah sistem dan CLI.
- [x] Buat interface **`HITLAction` & `OperatingMode`**: Status antrean persetujuan pengguna (`pending`, `approved`, `rejected`).

### 1.2. Database & Schema (`packages/backend/convex/schema.ts`)
- [x] Buat tabel `users` & `userConfigs` (API keys BYOK, active model, 4 operating modes, voice settings).
- [x] Buat tabel `devices` & `devicePairings` (Status online HP, status Shizuku, status Accessibility).
- [x] Buat tabel `conversations` & `messages` (Chat stream, tool calls, token usage & cost).
- [x] Buat tabel `pendingActions` (Antrean aksi sensitif yang menunggu persetujuan user).
- [x] Buat tabel `scheduledTasks` (Background Crons & MCP tasks).
- [x] Buat tabel `voiceStyles` & `memories` (Long-term preference RAG).

### 1.3. Agent Reasoning Engine (`packages/backend/convex/agent.ts`)
- [x] Buat fungsi pemanggil LLM (OpenRouter / Gemini / Claude / DeepSeek) dengan dukungan **Function Calling Tools**.
- [x] Buat **Tool Router**: Mengklasifikasikan apakah perintah user harus ke *Direct Native Bridge*, *Accessibility Loop*, *Shizuku*, atau *Termux*.
- [x] Buat **Natural Language Settings Resolver**: AI dapat mengubah mode, persona suara, atau batas budget langsung dari instruksi chat.

### 1.4. Policy Engine & Safety Guard (`packages/backend/convex/policyEngine.ts`)
- [x] Logika klasifikasi tingkat risiko aksi (🟢 Low, 🟡 Medium, 🔴 Critical).
- [x] Logika penahan aksi (*intercept*) ke tabel `pendingActions` jika user berada di *Plan Mode* atau *Ask-Before-Change Mode*.

---

## ⚙️ BAGIAN 2: Lapisan Native Android (Kotlin & System Bridges)

### 2.1. Modul Device Operator (`DeviceOperatorModule.kt`)
- [x] **Kontak:** Fungsi `getContacts()`, `searchContacts()`, `addContact()`, `deleteContact()` via `ContactsContract`.
- [x] **Foto & Galeri:** Fungsi `scanDuplicatePhotos()`, `scanScreenshots(days)`, `deletePhotos(ids)` via `MediaStore`.
- [x] **Pembersih File Sampah:** Fungsi `scanJunkStorage()` (mendeteksi file `.tmp`, installer `.apk` lama, sisa download) & `cleanJunkFiles()`.
- [x] **Aplikasi:** Fungsi `getInstalledApps()` dan `launchApp(packageName)` via `PackageManager`.
- [x] **Hardware:** Fungsi `toggleFlashlight()`, `setVolume()`, `getBatteryLevel()`.

### 2.2. Modul Shizuku Super Privileged (`ShizukuBridgeModule.kt`)
- [x] Inisialisasi koneksi Binder ke Shizuku Server (`rikka.shizuku:api`).
- [x] Fungsi **Akses Folder Terkunci**: Membaca dan menghapus cache tersembunyi di `/sdcard/Android/data` dan `/sdcard/Android/obb`.
- [x] Fungsi **Silent Uninstaller**: Menghapus atau membekukan aplikasi tanpa dialog konfirmasi OS (`pm uninstall <pkg>`).
- [x] Fungsi **Deep System Trimming**: Menjalankan `pm trim-caches` dan eksekusi perintah ADB Shell.

### 2.3. Layanan Accessibility Spatial Controller (`ConstAccessibilityService.kt`)
- [ ] Implementasi `AccessibilityService` untuk membaca seluruh tampilan UI aplikasi aktif.
- [ ] **Spatial Coordinate Parser**: Mengubah hierarki XML UI menjadi array elemen JSON dengan koordinat titik tengah `[center_x, center_y]`.
- [ ] **Gesture Dispatcher**: Fungsi native untuk simulasi `performTap(x, y)`, `performSwipe(startX, startY, endX, endY)`, `inputText(text)`, dan tombol navigasi `pressBack()`, `pressHome()`.

### 2.4. Modul Termux CLI Intent (`TermuxBridgeModule.kt`)
- [ ] Pengirim Explicit Intent ke `com.termux.app.RunCommandService` dengan permission `com.termux.permission.RUN_COMMAND`.
- [ ] Local Socket / Broadcast Receiver untuk streaming live output bash/git/python kembali ke UI.

---

## 📱 BAGIAN 3: Antarmuka Aplikasi Mobile (`apps/mobile`)

### 3.1. Layar Onboarding & Permission Wizard (`app/onboarding.tsx`)
- [ ] Tampilan pengenalan fitur Const AI.
- [ ] Wizard 1-klik untuk meminta izin: Kontak, Storage, dan Panduan buka Accessibility Settings.
- [ ] Kartu opsional aktivasi Shizuku (Panduan Wireless Debugging).

### 3.2. Layar Utama Chat & AI Stream (`app/(tabs)/index.tsx` & `app/chat/[id].tsx`)
- [ ] Tampilan list pesan chat (User & Assistant) dengan Markdown rendering.
- [ ] **Interactive Tool Cards**: Kartu animasi saat AI sedang scan file sampah, menghapus kontak, atau mengontrol layar.
- [ ] Input bar dengan tombol text, attachment, dan tombol Voice Hands-Free.

### 3.3. Komponen Modal Persetujuan Aksi / HITL Card (`components/hitl/ApprovalModal.tsx`)
- [ ] Modal pop-up real-time yang muncul saat ada aksi di tabel `pendingActions`.
- [ ] Menampilkan detail aksi (contoh: *"AI ingin menghapus 12 foto screenshot lama (150 MB)"*) dengan tombol **[Setujui]** dan **[Tolak]**.

### 3.4. Layar Device & Storage Cleaner (`app/(tabs)/device.tsx`)
- [ ] Gauge / Bar visual kapasitas penyimpanan internal HP.
- [ ] Status Badge Hak Akses (🟢 Accessibility Aktif, 🟢 Storage Aktif, 🟢/🟡 Shizuku Super Mode).
- [ ] Tombol **"Quick Scan & Clean"** file sampah satu klik.
- [ ] Tab Daftar Kontak & Daftar Aplikasi terpasang dengan pencarian cepat.

### 3.5. Layar In-App Terminal CLI (`app/(tabs)/terminal.tsx`)
- [ ] Terminal view bergaya konsol monospace gelap (menampilkan log eksekusi Termux / Shizuku).
- [ ] Command input manual untuk testing CLI lokal.

### 3.6. Layar Pengaturan & Persona Suara (`app/(tabs)/settings.tsx`)
- [ ] Pemilih Mode Kerja AI (Plan Mode, Ask-Before-Change, Standard, Full YOLO).
- [ ] Pemilih Model AI Aktif (Gemini 2.0 Flash, Claude 3.7 Sonnet, DeepSeek V3).
- [ ] Galeri Preset Suara Supertonic-3 (M1–M5, F1–F5) dengan tombol tes audio.
- [ ] In-App Voice Model Downloader (Download pack ~250MB dengan progress bar).

### 3.7. Service Audio On-Device (`services/voice/supertonicPlayer.ts`)
- [ ] Inisialisasi ONNX Runtime Mobile untuk memutar suara WAV 44.1kHz hasil sintesis lokal.
- [ ] Visualizer animasi gelombang suara saat AI berbicara.

---

## 🌐 BAGIAN 4: Dashboard Web Control Center (`apps/web`)

### 4.1. Halaman Login & Otentikasi (`apps/web/app/login/page.tsx`)
- [ ] Form login email / Google auth terhubung ke Convex.

### 4.2. Halaman Dashboard Utama (`apps/web/app/page.tsx`)
- [ ] Ringkasan perangkat yang terhubung (Status HP Android & Status Desktop Daemon PC).
- [ ] Statistik sesi chat dan aktivitas tugas harian.

### 4.3. Halaman BYOK API Key Manager (`apps/web/app/settings/keys/page.tsx`)
- [ ] Form input & enkripsi API Key kustom (OpenRouter, Gemini, Anthropic, OpenAI).

### 4.4. Halaman Voice Studio & Custom Styles (`apps/web/app/voice/page.tsx`)
- [ ] Audio preview preset suara.
- [ ] Drag-and-drop uploader untuk file kustom `voice_style.json`.

### 4.5. Halaman Scheduled Tasks & Crons (`apps/web/app/tasks/page.tsx`)
- [ ] Form pembuatan tugas terjadwal (Cron expression, prompt instruksi, attachment tool MCP/Composio).
- [ ] Switch On/Off dan log riwayat eksekusi background.

### 4.6. Halaman Usage & Token Analytics (`apps/web/app/analytics/page.tsx`)
- [ ] Grafik konsumsi token harian/bulanan (Recharts).
- [ ] Estimasi pengeluaran biaya USD ($) per model.

---

## 🔄 BAGIAN 5: Integrasi & Uji Coba End-to-End

- [ ] **Skenario 1 (Local Device Fast-Path):** Perintah *"Tolong scan file sampah di HP saya dan hapus kontak yang bernama Test"* dieksekusi instan via Native Module.
- [ ] **Skenario 2 (UI Automation Multi-Step):** Perintah *"Buka YouTube dan cari video jazz"* dieksekusi via Accessibility spatial loop.
- [ ] **Skenario 3 (Super-Privileged Shizuku):** Perintah *"Bersihkan cache tersembunyi di /Android/data"* dieksekusi via Shizuku tanpa root.
- [ ] **Skenario 4 (On-Device Voice):** Respon AI diucapkan langsung menggunakan Supertonic-3 ONNX secara lokal tanpa delay jaringan.
