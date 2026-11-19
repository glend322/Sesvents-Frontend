// Salin aset MediaPipe ke public/mediapipe/ supaya app tidak butuh CDN/internet:
//   - wasm runtime dari node_modules/@mediapipe/tasks-vision/wasm
//   - model .task dari models/ (di-commit di repo ini). Isinya HARUS sama dengan ml/mp_models di repo
//     Backend + Modeling (model yang sama dengan training, lihat SYSTEM_DESIGN.md §9.3). Kalau model
//     di sana diganti, salin ulang file .task-nya ke folder models/ di sini.
// Dijalankan otomatis oleh `npm run dev` / `npm run build` (script predev/prebuild).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'mediapipe');
const wasmSrc = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const localModels = join(root, 'models');
const models = ['hand_landmarker.task', 'pose_landmarker_lite.task'];

if (!existsSync(wasmSrc)) {
  console.error('[mediapipe] node_modules/@mediapipe/tasks-vision belum ada. Jalankan npm install.');
  process.exit(1);
}
mkdirSync(join(out, 'models'), { recursive: true });
cpSync(wasmSrc, join(out, 'wasm'), { recursive: true });

for (const m of models) {
  const local = join(localModels, m);
  if (!existsSync(local)) {
    console.error(`[mediapipe] ${local} tidak ditemukan. Salin dari ml/mp_models/${m} (repo Backend + Modeling).`);
    process.exit(1);
  }
  cpSync(local, join(out, 'models', m));
}
console.log('[mediapipe] aset disalin ke public/mediapipe');
