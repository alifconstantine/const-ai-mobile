# Const AI Mobile 🤖⚡ (v3.1 - JARVIS & Neural Voice Edition)

> **Personal Life Assistant + On-Device Neural Voice + Autonomous Coding Agent + Personal JARVIS**

Const AI Mobile adalah platform AI Agent mandiri multi-fungsi di smartphone Anda. Menggabungkan asisten produktivitas harian, suara neural *on-device* berkecepatan tinggi (**Supertonic-3**), agen coding otonom, terminal Termux lokal di Android, dan orkestrasi tugas terjadwal 24/7 menggunakan backend reaktif **Convex** dan Web Control Center (**Next.js 16**).

---

## 🌟 4 Pilar Utama Produk

1. 🎙️ **Personal Life Assistant (JARVIS)**:
   - Chat interaktif & voice assistant harian.
   - Manajemen jadwal, ringkasan email harian, catatan pintar, dan integrasi kontak/kalender.
   - **Natural Language Settings**: Ganti model AI, persona suara, atau mode kerja langsung via chat (*"Const, ganti suara ke persona FRIDAY F1"*).
   - **Long-Term Memory**: Mengingat preferensi dan konteks pengguna secara permanen di Convex.

2. 🔊 **On-Device Neural Voice Engine (Supertonic-3)**:
   - **Zero API Cost & Zero Network Latency**: Model TTS 99M parameter berjalan 100% lokal di HP via ONNX Runtime (NNAPI di Android, CoreML di iOS).
   - **Studio Quality**: Output audio 44.1 kHz 16-bit WAV yang jernih dan responsif.
   - **Emotion & Expression Tags**: Mendukung ekspresi alami seperti `<laugh>`, `<breath>`, `<sigh>`.
   - **In-App On-Demand Downloader**: Installer APK tetap ringan (<50MB); file model (~250MB) diunduh sekali saat pengguna mengaktifkan Voice Mode.
   - **Custom Voice & Presets**: Dukungan 10 preset (M1–M5, F1–F5) serta import file `voice_style.json` kustom.

3. 💻 **Autonomous Coding & DevOps Agent**:
   - Menulis, mengedit, dan memvalidasi kode program secara otomatis.
   - **4 Mode Kerja Fleksibel**:
     1. **Plan Mode**: Membuat `implementation_plan.md` terlebih dahulu sebelum mengedit kode.
     2. **Ask Before Change**: Setiap perubahan file atau perintah terminal wajib persetujuan HITL di HP.
     3. **Edit Automatically**: AI langsung mengedit file dan menjalankan perintah aman secara otomatis.
     4. **Full Access (YOLO Mode)**: Eksekusi instan tanpa konfirmasi untuk otomatisasi penuh.
   - **Integrated Termux Terminal (Android)**: Tampilan terminal bawaan di dalam aplikasi yang bisa berjalan di latar belakang (*Android Foreground Service*).

4. ⏰ **Autonomous Scheduled Tasks**:
   - Menjalankan cron tasks di latar belakang 24/7 (didukung Convex Cron, MCP, dan Composio 1.000+ connectors).
   - Mengirim notifikasi push ringkasan berkala ke HP.

---

## 📱 Strategi Platform & Monorepo

- 🤖 **Android (MVP Utama)**: 100% Native Standalone di HP dengan Termux, On-Device ONNX Voice, file lokal, dan background services.
- 🍎 **iOS**: Berfungsi penuh sebagai Life Assistant (Chat, Supertonic CoreML Voice, Notes, Tasks, Cloud MCP). Untuk eksekusi terminal shell PC, terhubung ke Desktop Daemon via pairing QR Code.
- 🖥️ **Web Dashboard (Next.js 16)**: Control center untuk BYOK, galeri persona suara, saldo kredit OpenRouter (tanpa markup), MCP Hub, dan analitik biaya/token.
- 📦 **Monorepo (Turborepo + PNPM)**: `apps/mobile` (React Native Expo), `apps/web` (Next.js 16), dan `packages/backend` (Convex) dalam 1 repository.

---

## 📖 Dokumentasi Arsitektur Lengkap

Baca spesifikasi teknis lengkap, diagram alur, dan skema database Convex di:  
📄 **[`ARCHITECTURE.md`](file:///D:/code/platform/const-ai-mobile/ARCHITECTURE.md)**
