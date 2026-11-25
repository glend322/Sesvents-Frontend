/**
 * Tautan dari landing page ke aplikasi LUNAR.
 * Landing page dan aplikasi siswa sekarang satu app (satu domain), jadi cukup pakai path relatif.
 */
export function isValidAppUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  if (url.startsWith('/')) return true;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Halaman masuk pengguna. */
export const LOGIN_URL = '/login';

/** Halaman daftar akun baru (langsung membuka tab Buat Akun). */
export const REGISTER_URL = '/login?mode=register';

/** Halaman utama aplikasi setelah masuk. */
export const APP_URL = '/chat';

/** Halaman utama aplikasi siswa (butuh login). */
export const KIOSK_URL = '/chat';
