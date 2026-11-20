/**
 * Pertanyaan cepat di beranda Tanya LUNAR ("Coba tanya ini"). Tampil sebagai daftar, bukan kartu
 * ber-ikon. `tag` = penanda kecil di kiri, warnanya mengikuti mapel (IPA biru, Matematika oranye,
 * umum kuning, latihan hijau).
 */
export type PromptTone = 'ipa' | 'mtk' | 'umum' | 'latihan';

export const QUICK_PROMPTS: readonly { text: string; hint: string; tag: string; tone: PromptTone }[] = [
  { text: 'Jelaskan siklus air', hint: 'Ilmu Pengetahuan Alam', tag: 'IPA', tone: 'ipa' },
  { text: 'Apa itu pecahan?', hint: 'Matematika', tag: '½', tone: 'mtk' },
  { text: 'Kenapa langit berwarna biru?', hint: 'Pengetahuan umum', tag: '✱', tone: 'umum' },
  { text: 'Bantu aku latihan perkalian', hint: 'Latihan', tag: '×', tone: 'latihan' },
];
