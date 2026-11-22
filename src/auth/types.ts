/** Tipe bersama alur akun siswa (ADR-051 D2, ADR-056). */

export type SiswaProfile = {
  id: string;
  /** Email login siswa. */
  email: string;
  /** Nomor telepon siswa. */
  phone?: string;
  /** Opsional: Nomor Induk Siswa (jika akun sekolah). */
  nis?: string;
  name: string;
  /** Mis. "5A". */
  className?: string;
  grade?: number;
  /** Opsional: kode kelas dari sekolah (mis. "LNR-5A21"). */
  classCode?: string;
  school?: string;
  /** URL foto profil. Opsional; bila kosong/gagal dimuat, UI memakai avatar inisial. */
  photoUrl?: string;
};

/** Sesi login aktif. Disimpan di sisi klien agar bertahan saat pindah rute & reload. */
export type SiswaSession = {
  sessionId: string;
  profile: SiswaProfile;
  /** Epoch ms saat login. */
  loginAt: number;
  /** Epoch ms interaksi terakhir. Dasar perhitungan idle timeout. */
  lastActiveAt: number;
  /** Bearer token dari BE. */
  accessToken?: string;
  /** Dipakai untuk memperbarui token tanpa login ulang (ADR-052). */
  refreshToken?: string;
  /** Epoch ms saat accessToken kedaluwarsa. */
  expiresAt?: number;
};

export type Tokens = { accessToken: string; refreshToken: string; expiresAt: number };

export type LoginResult =
  | { ok: true; profile: SiswaProfile; tokens?: Tokens }
  | { ok: false; reason: 'invalid-credentials' | 'email-exists' | 'validation-error' | 'service-error'; message?: string };

/** Alasan sesi berakhir, dipakai halaman login untuk menampilkan pemberitahuan. */
export type SessionEndedReason = 'expired' | 'logout';
