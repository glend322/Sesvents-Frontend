# LUNAR — Frontend

Landing page + aplikasi siswa LUNAR dalam **satu** app React + Vite. Backend ada di repo terpisah (`Sesvents-Backend-Model`).

| Rute | Halaman |
|---|---|
| `/` | Landing page (`src/landing/`) |
| `/login` | Masuk siswa (NIS) |
| `/chat`, `/video`, `/materi`, `/riwayat`, `/profil` | Aplikasi siswa (butuh login) |
| `/kiosk` | Mode kiosk kelas (tidak ada di menu) |

## Jalankan lokal

```bash
npm install
npm run dev      # http://localhost:5174
```

`/api` diproksikan ke backend lokal `http://127.0.0.1:8000` (jalankan backend dulu). Isi `.env` dari `.env.example`.

Cek sebelum push: `npm run typecheck` dan `npm run build`.

## Deploy (Vercel)

1. Import repo ini di Vercel (framework Vite terdeteksi, `vercel.json` sudah ada).
2. Di `vercel.json`, ganti `GANTI-DENGAN-URL-BACKEND` dengan domain backend.
3. Isi environment variable dari `.env.example` (`VITE_API_BASE_URL=/`, `VITE_DEVICE_ID`). Kosongkan `VITE_DEMO_NIS` / `VITE_DEMO_PASSWORD` untuk build publik.

## Struktur singkat

| Path | Isi |
|---|---|
| `src/` | Aplikasi siswa (auth, chat, video, kiosk, animasi isyarat) |
| `src/landing/` | Landing page (GSAP, dimuat lazy hanya di `/`) |
| `models/` | Model MediaPipe `.task` (harus sama dengan `ml/mp_models` di repo backend) |
| `scripts/` | `copy-mediapipe.mjs` (otomatis saat dev/build), sinkronisasi kosakata & animasi |
| `PRD.md`, `SYSTEM_DESIGN.md`, `ARCHITECTURE.md`, `decisions.md` | Dokumen produk, kontrak API, arsitektur, ADR (aturan kerja `AGENTS.md` ada di repo backend) |

> `.env` sudah di-ignore git. Jangan di-commit.
