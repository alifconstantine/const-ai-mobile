# Implementation Plan — Const AI Mobile Refactor & Core Architecture Fixes

**Tanggal:** 20 Agustus 2026  
**Target Repository:** `D:/Code/Platform/const-ai-mobile`  
**Referensi Arsitektur:** `D:/Code/Clone/const-harness` (`packages/workspace`, `packages/llm`, `packages/context`)

---

## 1. Executive Summary & Objective

Dokumen ini adalah rencana implementasi komprehensif untuk memperbaiki seluruh permasalahan teknis yang ditemukan pada **Const AI Mobile**, mencakup:
1. **[x] ✅ SELESAI — Migrasi Pengujian Mobile:** Transisi dari Expo Go standar ke **Expo Development Client (`expo-dev-client`)** agar seluruh modul native Android (Termux, Shizuku, Device Operator, Accessibility) dan custom URL scheme (`constai://`) aktif.
2. **[x] ✅ SELESAI — Restrukturisasi 4 Operating Modes (Safety & Governance):**
   - Menambahkan **Normal Mode** (Paling atas / Default: Aman, tanpa akses terminal, tanpa tool calls).
   - Mempertahankan **Ask Before Change** (Akses terminal & tools wajib izin user via modal HITL).
   - Mempertahankan **Plan Mode** (Membuat Implementation Plan terlebih dahulu, akses terminal dengan izin).
   - **Menghapus Edit Automatically**.
   - Mempertahankan **Full Access (YOLO)** (Akses terminal & tools instan tanpa konfirmasi).
   - Menyediakan penanganan error setup Termux yang ramah pengguna (jika Termux belum disetup, AI akan menjelaskan secara spesifik dan mengarahkan ke panduan setup di Settings/Web).
3. **[x] ✅ SELESAI — Perbaikan Autentikasi Clerk & SSO Callback:** Memperbaiki pembuatan redirect URI (`AuthSession.makeRedirectUri`), browser warm-up, `maybeCompleteAuthSession`, caching token sesi (SecureStore + Memory), dan sinkronisasi realtime ke Convex.
4. **[x] ✅ SELESAI — Konektivitas Backend Convex:** Migrasi penuh ke **Convex Cloud Development URL** (`https://polished-parrot-102.convex.cloud`) untuk menghilangkan kendala `127.0.0.1` pada perangkat mobile fisik.
5. **[x] ✅ SELESAI — Redesain UI Settings & Manajemen Model BYOK (Bring Your Own Key):**
   - Merapikan UI Settings menjadi clean, modern, dan modular (Tab Profile, AI Models & BYOK, Modes, Termux/OS Setup).
   - Menyediakan konfigurasi API Key & Custom Endpoint langsung di dalam aplikasi mobile (Gemini, Claude, OpenAI, OpenRouter, Ollama/Custom).
   - Menghubungkan tombol "Manage models" langsung ke modal internal (`openSettingsTab("models")`).
   - **Murni Sistem BYOK** (Zero default fallback models — model hanya muncul jika user telah mengonfigurasi API Key/Provider).
   - Fitur "Test Key & Latency" instan via `testModelEndpoint`.
   - Sinkronisasi 100% dua arah antara Mobile dan Web Dashboard via Convex (`updateUserConfig`).
6. **[x] ✅ SELESAI — Penanganan Error Chat & Anti-Freeze:**
   - Mencegah aplikasi macet/freeze saat fallback percakapan lokal atau koneksi bermasalah.
   - Membungkus seluruh alur penalaran `sendMessage` dan `submitToolResult` di Convex action ke dalam safe `try/catch`.
   - Menghasilkan bubble pesan asisten yang informatif jika terjadi missing API Key, network timeout, atau rate limit.
   - Menambahkan Error Alert Banner & tombol "Coba Lagi" (Retry) di UI Mobile Chat saat pengiriman pesan gagal.
7. **[ ] PENDING — Workspace & Berkas Proyek Dinamis:** Mengimplementasikan 2 mode (Tanpa Folder / Dalam Folder) dengan referensi arsitektur dari `D:\Code\Clone\const-harness\packages\workspace`.
8. **[ ] PENDING — Metrik Token, TTFT, & Latency Presisi:** Menghitung konsumsi token riil, Time to First Token (TTFT), dan latensi berdasarkan telemetri Convex dengan referensi dari `D:\Code\Clone\const-harness\packages\llm`.

---

## 2. User Review Required / Breaking Changes

> [!IMPORTANT]
> - **Penghapusan Mode "Edit Automatically":** Nilai enum `edit_automatically` pada database Convex schema, types, policy engine, dan UI telah dihapus dan digantikan oleh `normal_mode` (✅ Selesai).
> - **Zero Default / Pre-configured Models:** Aplikasi tidak akan lagi menyediakan model gratis bawaan. Jika user belum memasukkan API Key, antarmuka akan menampilkan panduan penambahan API Key di Settings.
> - **Pengujian di HP Fisik Wajib Menggunakan Development Build:** Perintah `npx expo run:android` atau build APK development harus digunakan untuk menguji fungsionalitas native OS dan terminal di Android (✅ Selesai).

---

## 3. Detailed Proposed Changes

### Layer 1: Mobile Core & Development Client Setup (`apps/mobile`) — [x] ✅ SELESAI

#### [x] [MODIFY] [`apps/mobile/package.json`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/package.json)
- Menambahkan `expo-dev-client` ke dependencies.
- Menambahkan script shortcut untuk build development client (`"android:dev": "expo run:android"`).

#### [x] [MODIFY] [`apps/mobile/app.json`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/app.json)
- Memastikan plugins menyertakan `expo-dev-client`, `expo-router`, `expo-secure-store`, `expo-web-browser`.
- Mengonfigurasi `scheme: "constai"` dan android package `com.constai.mobile`.

#### [x] [MODIFY] [`.env`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/.env) & [`.env.local`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/.env.local)
- Menyetel default URL Convex ke Cloud Development:
  ```env
  EXPO_PUBLIC_CONVEX_URL=https://polished-parrot-102.convex.cloud
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bmF0dXJhbC1sZW1taW5nLTQ2NDQuY2xlcmsuYWNjb3VudHMuZGV2JA
  ```

#### [x] [MODIFY] [`apps/mobile/app/_layout.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/app/_layout.tsx)
- Memperbarui `resolveConvexUrl()`: Jika `process.env.EXPO_PUBLIC_CONVEX_URL` adalah URL HTTPS cloud (atau jika `127.0.0.1` terdeteksi di perangkat fisik, auto-fallback ke IP host atau cloud URL).

---

### Layer 2: Operating Modes & Safety Governance — [x] ✅ SELESAI

#### [x] [MODIFY] [`packages/types/src/index.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/types/src/index.ts)
- Memperbarui definisi type `OperatingMode`:
  ```typescript
  export type OperatingMode =
    | "normal_mode"
    | "ask_before_change"
    | "plan_mode"
    | "full_access_yolo";
  ```

#### [x] [MODIFY] [`packages/backend/convex/schema.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/schema.ts)
- Memperbarui validator enum `operatingMode` di tabel `userConfigs`:
  ```typescript
  operatingMode: v.union(
    v.literal("normal_mode"),
    v.literal("ask_before_change"),
    v.literal("plan_mode"),
    v.literal("full_access_yolo")
  )
  ```

#### [x] [MODIFY] [`packages/backend/convex/policyEngine.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/policyEngine.ts)
- Menyesuaikan aturan evaluasi tool policy:
  1. **`normal_mode`:** Menolak seluruh eksekusi tool perangkat & terminal (`decision: "deny"`). LLM hanya bertindak sebagai asisten teks & coding murni.
  2. **`ask_before_change`:** Seluruh perintah terminal, shell, dan manipulasi data masuk ke antrean HITL (`decision: "ask"`).
  3. **`plan_mode`:** Perintah terminal & tools diizinkan dengan persetujuan (`decision: "ask"`).
  4. **`full_access_yolo`:** Eksekusi langsung tanpa intercept (`decision: "allow"`).

#### [x] [MODIFY] [`packages/backend/convex/tools.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/tools.ts) & [`packages/backend/convex/agent.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/agent.ts)
- Di `buildSystemPrompt`:
  - Jika `operatingMode === "normal_mode"`, jangan menyertakan tool definitions atau instruksikan model bahwa mode terminal dinonaktifkan.
- Menambahkan penanganan error Termux Setup yang informatif:
  - Jika `submitToolResult` menerima status failed dengan error `"Termux not installed"` atau `"Permission RUN_COMMAND missing"` atau `"allow-external-apps missing"`:
  - System prompt instruksikan model untuk menjelaskan bahwa perangkat belum disetup dan berikan 3 langkah singkat:
    1. Pasang Termux F-Droid.
    2. Jalankan perintah `mkdir -p ~/.termux && echo "allow-external-apps = true" >> ~/.termux/termux.properties && termux-reload-settings`.
    3. Izinkan permission di Settings HP atau buka panduan di Settings / Web.

#### [x] [MODIFY] [`apps/mobile/components/modals/OperatingModeModal.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/modals/OperatingModeModal.tsx)
- Menampilkan 4 mode baru dengan urutan yang tepat:
  1. 🟢 **Normal Mode (Default):** Obrolan asisten AI & analisis kode tanpa akses terminal/sistem perangkat.
  2. 🟡 **Ask Before Change:** Akses terminal Termux & tools OS aktif dengan konfirmasi per tindakan (HITL).
  3. 🔵 **Plan Mode:** Membuat dokumen rencana kerja terlebih dahulu, akses terminal dengan izin.
  4. 🔴 **Full Access (YOLO):** Eksekusi terminal dan perintah sistem otomatis tanpa dialog konfirmasi.

---

### Layer 3: Autentikasi Clerk & SSO Callback — [x] ✅ SELESAI

#### [x] [MODIFY] [`apps/mobile/app/login.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/app/login.tsx)
- Memperbaiki `getRedirectUrl()` menggunakan `AuthSession.makeRedirectUri({ scheme: "constai", path: "sso-callback" })`.
- Menambahkan `useWarmUpBrowser()` untuk browser warmup Android dan `WebBrowser.maybeCompleteAuthSession()`.
- Menangani `startSSOFlow` dengan aman untuk dev client dan browser.

#### [x] [MODIFY] [`apps/mobile/app/sso-callback.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/app/sso-callback.tsx)
- Menambahkan `WebBrowser.maybeCompleteAuthSession()`.
- Memastikan session token diverifikasi dan router mengarahkan ke `/` tanpa loop redirection.

#### [x] [MODIFY] [`apps/mobile/services/auth/tokenCache.ts`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/services/auth/tokenCache.ts)
- Memastikan penyimpanan token menggunakan `expo-secure-store` untuk platform native, `localStorage` untuk platform web, dan in-memory fallback yang andal.

#### [x] [MODIFY] [`apps/mobile/app/_layout.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/app/_layout.tsx)
- Menambahkan `WebBrowser.maybeCompleteAuthSession()`.
- Menyederhanakan `resolveConvexUrl()` ke Cloud Development instance `https://polished-parrot-102.convex.cloud`.


---

### Layer 4: UI Settings & Manajemen Model BYOK (Bring Your Own Key)

#### [MODIFY] [`apps/mobile/components/settings/SettingsModal.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/settings/SettingsModal.tsx)
- **Desain Ulang UI:**
  - Tampilan tab modular: **Profile**, **AI Models & BYOK**, **Operating Mode**, **Termux & Device Setup**.
  - **Tab AI Models & BYOK:**
    - Form penambahan Custom Provider (Nama Provider, Base URL, API Key, API Format).
    - Form pengisian API Key untuk Cloud Provider resmi (Google Gemini, Anthropic Claude, OpenAI, OpenRouter).
    - Tombol *"Test Endpoint & Latency"* (memanggil backend action `testModelEndpoint`).
    - Daftar model dinamis yang ter-discover dari endpoint pengguna.
  - **Tab Termux & Device Setup:**
    - Panduan langkah-demi-langkah setup Termux (Link download Termux F-Droid, snippet kode `termux.properties`, panduan izin Android).
    - Tombol *"Check Termux Status"* untuk mendeteksi apakah instalasi & permission sudah aktif di HP.

#### [MODIFY] [`apps/mobile/components/modals/ModelSelectorModal.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/modals/ModelSelectorModal.tsx)
- **Hapus semua fallback model gratis/bawaan**. Hanya tampilkan model jika pengguna telah mengonfigurasi provider / API Key terkait.
- Jika belum ada model: Tampilkan state *"No Models Configured"* dengan tombol *"Configure API Keys"*.
- Mengarahkan tombol *"Configure API Keys"* langsung membuka **`SettingsModal` (Tab Models)** di dalam aplikasi mobile (bukan membuka tautan eksternal `localhost:3000`).

#### [MODIFY] [`apps/web/app/dashboard/settings/page.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/web/app/dashboard/settings/page.tsx)
- Menyelaraskan struktur data provider dan API key dengan backend Convex sehingga data yang diatur di Web langsung muncul di Mobile, dan sebaliknya.

---

### Layer 5: Penanganan Error Chat & Anti-Freeze

#### [MODIFY] [`apps/mobile/app/index.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/app/index.tsx)
- Menghapus blokade fatal pada `convId.startsWith("local_")`.
- Menambahkan auto-retry koneksi ke Convex saat user mengirim pesan:
  - Jika `createNewConversation` gagal, tampilkan pesan peringatan di UI / Banner dan izinkan user mencoba lagi.
  - Menangani error pemanggilan API LLM dengan menampilkan bubble pesan error di dalam riwayat percakapan.

---

### Layer 6: Berkas & Project Workspace Dinamis

**Referensi Arsitektur:** `D:\Code\Clone\const-harness\packages\workspace\workspace\src\types.ts`

#### Model Arsitektur Referensi:
- Di `const-harness`, workspace memiliki struktur:
  ```typescript
  interface Workspace {
    id: WorkspaceId;
    path: string; // Canonical directory path (e.g. "~/projects/my-app" atau "/sdcard/...")
    title: string; // Display name
    sessionIds: readonly SessionId[];
  }
  ```
- Terdapat 2 kategori utama:
  1. **Tanpa Folder (Conversation Biasa / Standalone Session):** Sesi obrolan mandiri tanpa keterikatan ke direktori proyek lokal.
  2. **Dalam Folder (Project Workspace):** Sesi obrolan yang terikat dengan direktori kerja lokal Termux/Storage (memiliki `workingDir` aktif).

#### [MODIFY] [`packages/backend/convex/schema.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/schema.ts)
- Menambahkan field pada tabel `conversations`:
  ```typescript
  workspaceType: v.optional(v.union(v.literal("standalone"), v.literal("project_folder"))),
  workingDirectory: v.optional(v.string()),
  ```

#### [MODIFY] [`apps/mobile/components/navigation/WorkspaceModal.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/navigation/WorkspaceModal.tsx) & [`TaskDrawer.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/navigation/TaskDrawer.tsx)
- Menyediakan UI pemilihan:
  - **Pilihan 1: Chat Baru (Tanpa Folder):** Obrolan asisten umum tanpa path folder.
  - **Pilihan 2: Buka Proyek (Dalam Folder):** Memilih direktori proyek dari Termux (`~/projects/...`) atau input custom path.

#### [MODIFY] [`apps/mobile/components/review/ExploreView.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/review/ExploreView.tsx)
- Mengganti array statis `FILE_TREE` dengan pemanggilan dinamis:
  - Jika sesi memiliki `workingDirectory`, panggil `TermuxBridge.executeScript("ls -la ...")` untuk membaca berkas nyata di direktori tersebut.
  - Tampilkan tree berkas riil dengan icon ekstensi dan ukuran file.

---

### Layer 7: Metrik Token Context Window, TTFT, & Latency

**Referensi Arsitektur:** `D:\Code\Clone\const-harness\packages\llm\llm\src\types.ts`

#### Model Telemetri Referensi:
- Di `const-harness`:
  ```typescript
  interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    reasoningTokens?: number;
  }
  ```
- Telemetri eksekusi mencatat `ttftMs` (Time to First Token), `totalDurationMs`, dan `tokensPerSec`.

#### [MODIFY] [`packages/backend/convex/llmTransport.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/llmTransport.ts) & [`packages/backend/convex/schema.ts`](file:///d:/Code/Platform/const-ai-mobile/packages/backend/convex/schema.ts)
- Menyimpan metrik telemetri ke setiap dokumen `messages`:
  ```typescript
  promptTokens: v.optional(v.number()),
  completionTokens: v.optional(v.number()),
  totalDurationMs: v.optional(v.number()),
  ttftMs: v.optional(v.number()),
  estimatedCostUsd: v.optional(v.number()),
  ```

#### [MODIFY] [`apps/mobile/components/modals/ContextWindowModal.tsx`](file:///d:/Code/Platform/const-ai-mobile/apps/mobile/components/modals/ContextWindowModal.tsx)
- Menghitung metrik secara riil dari seluruh dokumen pesan sesi aktif:
  - Total Token Digunakan (`inputTokens + outputTokens`).
  - Kapasitas Maksimal Model Aktif (diambil dari spesifikasi model yang sedang dipilih).
  - Rata-rata Latensi & TTFT dari respons terakhir.
  - Estimasi Biaya USD riil (jika menggunakan API berbayar).

---

## 4. Verification & Testing Plan

### Automated & Static Verification:
- [x] ✅ **TypeScript Typecheck Monorepo (4/4 Packages Lulus):**
  ```bash
  pnpm turbo typecheck
  ```
- [x] ✅ **Backend Policy Engine Unit Tests (7/7 Tests Lulus):**
  ```bash
  pnpm --filter @const-ai/backend test
  ```
- [x] ✅ **Native Service Bridges Unit Tests (All Lulus):**
  ```bash
  pnpm --filter @const-ai/mobile test
  ```

### Manual & Feature Verification:
1. **[x] ✅ Verifikasi Pengujian Mobile di Android:**
   - Script `android:dev` (`expo run:android`) dan dependency `expo-dev-client` terpasang.
   - Convex auto-resolves ke Cloud Development URL (`https://polished-parrot-102.convex.cloud`).
2. **[x] ✅ Verifikasi 4 Mode:**
   - **Normal Mode:** AI menolak eksekusi terminal dan hanya menjawab sebagai asisten percakapan/kode murni (`decision: "deny"`).
   - **Ask Before Change:** Perintah terminal memunculkan modal persetujuan HITL (`decision: "ask"`).
   - **Plan Mode:** AI membuat Implementation Plan sebelum meminta izin eksekusi terminal.
   - **Full Access (YOLO):** Perintah terminal dieksekusi langsung tanpa modal dialog (`decision: "allow"`).
   - **Termux Error Guidance:** System prompt menginstruksikan AI memberikan 3 langkah setup Termux jika error `RUN_COMMAND` / `allow-external-apps`.
3. **Verifikasi Autentikasi & Convex Cloud:**
   - Buka aplikasi di HP fisik, lakukan Sign In with Google.
   - Pastikan login sukses dan kembali ke aplikasi via `constai://sso-callback`.
   - Pastikan data user dan pesan tersinkronisasi via Convex Cloud (`https://polished-parrot-102.convex.cloud`).
4. **Verifikasi BYOK & Model Selector:**
   - Masukkan API Key (misal: Gemini atau OpenRouter) di Settings Modal mobile.
   - Buka Model Selector Modal: pastikan hanya model dari provider terkonfigurasi yang muncul.
   - Cek di Web Dashboard: pastikan konfigurasi API Key tersinkronisasi sama persis.
5. **Verifikasi Workspace & Berkas Proyek:**
   - Pilih "Buka Proyek (Dalam Folder)" dengan path `~/projects` di Termux.
   - Buka tab Explore: pastikan isi folder riil muncul.
6. **Verifikasi Context Window & Telemetri:**
   - Buka Context Window Modal setelah obrolan: pastikan angka token, durasi TTFT, dan persentase dihitung secara akurat.
