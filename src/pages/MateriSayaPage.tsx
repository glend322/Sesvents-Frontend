import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignJustify, Check, ChevronLeft, Pencil, Play } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Avatar } from '@/auth/components/Avatar';
import { useShellChrome } from '@/layout/AppShell';
import { cn } from '@/lib/utils';

type SourceTab = 'lunar' | 'komunitas';
type SubjectCategory = 'IPA' | 'Matematika' | 'Bahasa Indonesia' | 'Bahasa Inggris' | 'IPS' | 'Lainnya';
type SubjectFilter = 'Semua' | SubjectCategory;
type ThumbKind =
  | 'siklus-air'
  | 'bangun-datar'
  | 'bagian-tumbuhan'
  | 'pecahan'
  | 'tata-surya'
  | 'persentase'
  | 'perkenalan-diri'
  | 'kalimat-tanya'
  | 'simple-present'
  | 'sapaan-inggris'
  | 'alat-transportasi'
  | 'pancasila'
  | 'warna'
  | 'kebersihan-diri';

type ContentItem = {
  kind: 'video' | 'summary' | 'quiz';
  label: string;
  meta: string;
};

type MateriItem = {
  id: string;
  videoId: string;
  title: string;
  isNew?: boolean;
  subject: SubjectCategory;
  cardMeta: string;
  detailMeta: string;
  duration: string;
  reviewedAt: string;
  sourceBook: string;
  thumb: ThumbKind;
  contents: ContentItem[];
  askPrompt: string;
};

const FILTERS: readonly SubjectFilter[] = ['Semua', 'IPA', 'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS', 'Lainnya'];

const MATERI_ITEMS: readonly MateriItem[] = [
  {
    id: 'siklus-air',
    videoId: 'siklus-air',
    title: 'Siklus Air',
    isNew: true,
    subject: 'IPA',
    cardMeta: 'IPA · Video + rangkuman + 5 soal',
    detailMeta: 'IPA · Kelas 5 · Bab 3',
    duration: '06:24',
    reviewedAt: '18 Nov 2026',
    sourceBook: 'Disusun dari Buku IPAS Kelas 5 Kemendikbud.',
    thumb: 'siklus-air',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '06:24' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '5 soal' },
    ],
    askPrompt: 'Jelaskan siklus air dengan sederhana',
  },
  {
    id: 'bangun-datar',
    videoId: 'bangun-datar',
    title: 'Bangun Datar',
    subject: 'Matematika',
    cardMeta: 'Matematika · Video + 8 soal',
    detailMeta: 'Matematika · Kelas 5 · Bab 2',
    duration: '08:12',
    reviewedAt: '15 Nov 2026',
    sourceBook: 'Disusun dari Buku Matematika Kelas 5 Kemendikbud.',
    thumb: 'bangun-datar',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '08:12' },
      { kind: 'quiz', label: 'Latihan soal', meta: '8 soal' },
    ],
    askPrompt: 'Apa bedanya persegi dan persegi panjang?',
  },
  {
    id: 'bagian-tumbuhan',
    videoId: 'bagian-tumbuhan',
    title: 'Bagian Tumbuhan',
    subject: 'IPA',
    cardMeta: 'IPA · Video + rangkuman',
    detailMeta: 'IPA · Kelas 5 · Bab 1',
    duration: '06:10',
    reviewedAt: '12 Nov 2026',
    sourceBook: 'Disusun dari Buku IPAS Kelas 5 Kemendikbud.',
    thumb: 'bagian-tumbuhan',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '06:10' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
    ],
    askPrompt: 'Apa tugas akar pada tumbuhan?',
  },
  {
    id: 'pecahan-senilai',
    videoId: 'pecahan',
    title: 'Pecahan Senilai',
    subject: 'Matematika',
    cardMeta: 'Matematika · Video + 6 soal',
    detailMeta: 'Matematika · Kelas 5 · Bab 4',
    duration: '07:20',
    reviewedAt: '10 Nov 2026',
    sourceBook: 'Disusun dari Buku Matematika Kelas 5 Kemendikbud.',
    thumb: 'pecahan',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '07:20' },
      { kind: 'quiz', label: 'Latihan soal', meta: '6 soal' },
    ],
    askPrompt: 'Apa itu pecahan senilai?',
  },
  {
    id: 'tata-surya',
    videoId: 'tata-surya',
    title: 'Tata Surya',
    subject: 'IPA',
    cardMeta: 'IPA · Video + rangkuman + 5 soal',
    detailMeta: 'IPA · Kelas 5 · Bab 5',
    duration: '05:18',
    reviewedAt: '14 Nov 2026',
    sourceBook: 'Disusun dari Buku IPAS Kelas 5 Kemendikbud.',
    thumb: 'tata-surya',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '05:18' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '5 soal' },
    ],
    askPrompt: 'Sebutkan planet di tata surya',
  },
  {
    id: 'persentase',
    videoId: 'persentase',
    title: 'Mengenal Persentase',
    subject: 'Matematika',
    cardMeta: 'Matematika · Video + rangkuman + 5 soal',
    detailMeta: 'Matematika · Kelas 5 · Bab 6',
    duration: '07:05',
    reviewedAt: '09 Nov 2026',
    sourceBook: 'Disusun dari Buku Matematika Kelas 5 Kemendikbud.',
    thumb: 'persentase',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '07:05' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '5 soal' },
    ],
    askPrompt: 'Apa itu persentase?',
  },
  {
    id: 'perkenalan-diri',
    videoId: 'perkenalan-diri',
    title: 'Perkenalan Diri',
    isNew: true,
    subject: 'Bahasa Indonesia',
    cardMeta: 'Bahasa Indonesia · Video + rangkuman + 4 soal',
    detailMeta: 'Bahasa Indonesia · Kelas 5 · Bab 1',
    duration: '07:36',
    reviewedAt: '17 Nov 2026',
    sourceBook: 'Disusun dari Buku Bahasa Indonesia Kelas 5 Kemendikbud.',
    thumb: 'perkenalan-diri',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '07:36' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '4 soal' },
    ],
    askPrompt: 'Bantu aku membuat kalimat perkenalan diri',
  },
  {
    id: 'kalimat-tanya',
    videoId: 'perkenalan-diri',
    title: 'Kalimat Tanya dan Berita',
    subject: 'Bahasa Indonesia',
    cardMeta: 'Bahasa Indonesia · Video + rangkuman',
    detailMeta: 'Bahasa Indonesia · Kelas 5 · Bab 2',
    duration: '06:15',
    reviewedAt: '11 Nov 2026',
    sourceBook: 'Disusun dari Buku Bahasa Indonesia Kelas 5 Kemendikbud.',
    thumb: 'kalimat-tanya',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '06:15' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '3 mnt' },
    ],
    askPrompt: 'Apa perbedaan kalimat tanya dan kalimat berita?',
  },
  {
    id: 'simple-present',
    videoId: 'simple-present',
    title: 'Simple Present Tense',
    isNew: true,
    subject: 'Bahasa Inggris',
    cardMeta: 'Bahasa Inggris · Video + rangkuman + 6 soal',
    detailMeta: 'Bahasa Inggris · Kelas 5 · Bab 3',
    duration: '09:42',
    reviewedAt: '16 Nov 2026',
    sourceBook: 'Disusun dari Buku English for Nusantara Kemendikbud.',
    thumb: 'simple-present',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '09:42' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '3 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '6 soal' },
    ],
    askPrompt: 'Beri contoh kalimat simple present tense',
  },
  {
    id: 'sapaan-inggris',
    videoId: 'sapaan-inggris',
    title: 'Menyapa dan Berkenalan',
    subject: 'Bahasa Inggris',
    cardMeta: 'Bahasa Inggris · Video + 5 soal',
    detailMeta: 'Bahasa Inggris · Kelas 5 · Bab 1',
    duration: '05:05',
    reviewedAt: '08 Nov 2026',
    sourceBook: 'Disusun dari Buku English for Nusantara Kemendikbud.',
    thumb: 'sapaan-inggris',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '05:05' },
      { kind: 'quiz', label: 'Latihan soal', meta: '5 soal' },
    ],
    askPrompt: 'Bagaimana cara menyapa dalam bahasa Inggris?',
  },
  {
    id: 'alat-transportasi',
    videoId: 'alat-transportasi',
    title: 'Alat Transportasi',
    isNew: true,
    subject: 'IPS',
    cardMeta: 'IPS · Video + rangkuman + 5 soal',
    detailMeta: 'IPS · Kelas 5 · Bab 2',
    duration: '06:57',
    reviewedAt: '16 Nov 2026',
    sourceBook: 'Disusun dari Buku IPAS Kelas 5 Kemendikbud.',
    thumb: 'alat-transportasi',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '06:57' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '5 soal' },
    ],
    askPrompt: 'Apa saja contoh alat transportasi darat?',
  },
  {
    id: 'pancasila',
    videoId: 'pancasila',
    title: 'Mengenal Pancasila',
    subject: 'IPS',
    cardMeta: 'IPS · Video + rangkuman',
    detailMeta: 'IPS · Kelas 5 · Bab 1',
    duration: '05:40',
    reviewedAt: '07 Nov 2026',
    sourceBook: 'Disusun dari Buku Pendidikan Pancasila Kelas 5 Kemendikbud.',
    thumb: 'pancasila',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '05:40' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
    ],
    askPrompt: 'Apa saja lima sila Pancasila?',
  },
  {
    id: 'warna',
    videoId: 'warna',
    title: 'Mengenal Warna',
    isNew: true,
    subject: 'Lainnya',
    cardMeta: 'Lainnya · Video + rangkuman + 4 soal',
    detailMeta: 'Seni Rupa · Kelas 5 · Bab 1',
    duration: '04:40',
    reviewedAt: '15 Nov 2026',
    sourceBook: 'Disusun dari Buku Seni Rupa SD/MI Kemendikbud.',
    thumb: 'warna',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '04:40' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
      { kind: 'quiz', label: 'Latihan soal', meta: '4 soal' },
    ],
    askPrompt: 'Benda apa saja yang berwarna hijau?',
  },
  {
    id: 'kebersihan-diri',
    videoId: 'warna',
    title: 'Kebersihan dan Kesehatan Diri',
    subject: 'Lainnya',
    cardMeta: 'Lainnya · Video + rangkuman',
    detailMeta: 'PJOK · Kelas 5 · Bab 2',
    duration: '05:25',
    reviewedAt: '06 Nov 2026',
    sourceBook: 'Disusun dari Buku PJOK Kelas 5 Kemendikbud.',
    thumb: 'kebersihan-diri',
    contents: [
      { kind: 'video', label: 'Video + caption isyarat', meta: '05:25' },
      { kind: 'summary', label: 'Rangkuman bahasa sederhana', meta: '2 mnt' },
    ],
    askPrompt: 'Bagaimana cara menjaga kebersihan dan kesehatan diri?',
  },
];

/**
 * Halaman Materi (02 · F6 MATERI — Konten LUNAR & Komunitas):
 *  A. Tab Konten LUNAR   filter mapel (bisa digeser horizontal), daftar materi Kelas 5 · Minggu Ini dengan badge "Tim LUNAR" & label "BARU".
 *  B. Tab Komunitas      teaser fitur komunitas dengan maskot, info tinjauan Tim LUNAR, dan dua tombol aksi.
 *  C. Detail materi      preview video, info bab, kartu hijau sumber & tanggal tinjauan, daftar isi materi, tombol Tanya LUNAR.
 */
export default function MateriSayaPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<SourceTab>('lunar');
  const [filter, setFilter] = useState<SubjectFilter>('Semua');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);
  const [contributorNotified, setContributorNotified] = useState(false);

  const selected = MATERI_ITEMS.find((m) => m.id === selectedId) ?? null;

  // Sembunyikan header default mobile supaya bar atas mengikuti desain ("Materi" + avatar NA, atau "< Detail materi").
  useShellChrome({ mobileHeader: false, mobileNav: !selected });

  const filtered = MATERI_ITEMS.filter((m) => filter === 'Semua' || m.subject === filter);

  // ---------- C. Detail materi
  if (selected) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        {/* Bar atas Detail materi */}
        <header className="-mx-5 -mt-5 mb-5 flex h-14 items-center border-b border-line bg-white px-3 md:-mx-8 md:-mt-8 md:px-6 lg:mx-0 lg:mt-0 lg:rounded-2xl lg:border lg:px-4">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[1.0625rem] font-extrabold tracking-[-0.02em] text-ink transition-colors hover:bg-sand"
          >
            <ChevronLeft className="size-5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span>Detail materi</span>
          </button>
        </header>

        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Preview video */}
          <button
            type="button"
            onClick={() => navigate(`/video/${selected.videoId}`)}
            aria-label={`Putar video ${selected.title}, durasi ${selected.duration}`}
            className="group relative block aspect-[16/9.2] w-full overflow-hidden rounded-[20px] text-left focus-visible:outline-3 focus-visible:outline-ink"
          >
            <HeroIllustration kind={selected.thumb} />
            <span className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-[#2B2623]/90 text-white shadow-soft transition-transform duration-200 group-hover:scale-105">
              <Play className="size-5 translate-x-0.5" fill="currentColor" aria-hidden="true" />
            </span>
            <span className="absolute bottom-3 right-3 rounded-lg bg-ink/90 px-2.5 py-1 text-xs font-extrabold tabular-nums text-white">
              {selected.duration}
            </span>
          </button>

          {/* Judul & info bab */}
          <h1 className="mt-4 text-[1.625rem] font-extrabold leading-tight tracking-[-0.03em] text-ink">{selected.title}</h1>
          <p className="mt-1 text-[0.875rem] font-medium text-ink-2">{selected.detailMeta}</p>

          {/* Kotak hijau sumber & tanggal tinjauan */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-ok-soft px-4 py-3.5 text-ok-ink">
            <GreenCheckIcon className="mt-0.5 size-5 shrink-0" />
            <div className="text-[0.8125rem] leading-relaxed">
              <p>
                <strong className="font-extrabold">Konten LUNAR</strong> · ditinjau {selected.reviewedAt}
              </p>
              <p>{selected.sourceBook}</p>
            </div>
          </div>

          {/* ISI MATERI */}
          <section className="mt-6" aria-labelledby="isi-materi-heading">
            <h2 id="isi-materi-heading" className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-ink">
              ISI MATERI
            </h2>
            <ul className="mt-2 divide-y divide-line border-b border-line">
              {selected.contents.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.kind === 'video') navigate(`/video/${selected.videoId}`);
                      else navigate('/chat', { state: { prompt: selected.askPrompt, autoSend: false } });
                    }}
                    className="flex w-full items-center gap-3.5 py-3.5 text-left transition-colors hover:bg-white/60"
                  >
                    <span className="grid size-5 shrink-0 place-items-center text-ink" aria-hidden="true">
                      {item.kind === 'video' && <Play className="size-3.5 translate-x-px" fill="currentColor" />}
                      {item.kind === 'summary' && <AlignJustify className="size-4" strokeWidth={2.2} />}
                      {item.kind === 'quiz' && <Pencil className="size-3.5" strokeWidth={2.2} />}
                    </span>
                    <span className="min-w-0 flex-1 text-[0.9375rem] font-bold text-ink">{item.label}</span>
                    <span className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-ink-2">{item.meta}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA Tanya LUNAR */}
          <button
            type="button"
            onClick={() => navigate('/chat', { state: { prompt: selected.askPrompt, autoSend: false } })}
            className="mt-6 flex h-13 w-full items-center justify-center rounded-2xl bg-ink px-6 text-[0.9375rem] font-extrabold text-white transition-colors hover:bg-brand-800"
          >
            Tanya LUNAR soal materi ini
          </button>
        </motion.div>
      </div>
    );
  }

  // ---------- A & B. Daftar Materi (Konten LUNAR / Komunitas)
  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Bar atas: judul Materi + avatar biru */}
      <header className="-mx-5 -mt-5 mb-4 flex items-center justify-between border-b border-line bg-white px-5 py-3.5 md:-mx-8 md:-mt-8 md:px-8 lg:mx-0 lg:mt-0 lg:mb-5 lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0">
        <h1 className="text-[1.625rem] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[1.875rem]">Materi</h1>
        <NavLink to="/profil" aria-label="Profil dan pengaturan" className="lg:hidden">
          <Avatar name={profile?.name ?? 'Nadia'} photoUrl={profile?.photoUrl} className="size-9 bg-cap text-white" textClassName="text-xs font-extrabold" />
        </NavLink>
      </header>

      {/* Tab sumber materi: Konten LUNAR | Komunitas SEGERA */}
      <div
        role="tablist"
        aria-label="Sumber materi"
        className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EAE4DA] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'lunar'}
          onClick={() => setTab('lunar')}
          className={cn(
            'flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs transition-all sm:gap-2 sm:px-3.5 sm:text-[0.875rem]',
            tab === 'lunar'
              ? 'bg-white font-extrabold text-ink shadow-[0_1px_3px_rgba(31,27,22,0.08)]'
              : 'font-bold text-ink-2 hover:text-ink',
          )}
        >
          <GreenCheckIcon className="size-3.5 shrink-0 sm:size-4" />
          <span>Konten LUNAR</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'komunitas'}
          onClick={() => setTab('komunitas')}
          className={cn(
            'flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs transition-all sm:gap-2 sm:px-3.5 sm:text-[0.875rem]',
            tab === 'komunitas'
              ? 'bg-white font-extrabold text-ink shadow-[0_1px_3px_rgba(31,27,22,0.08)]'
              : 'font-bold text-ink-2 hover:text-ink',
          )}
        >
          <span>Komunitas</span>
          <span className="rounded-md bg-[#F8D978] px-1.5 py-0.5 text-[0.5625rem] font-extrabold uppercase leading-none tracking-[0.04em] text-[#7A5200] sm:text-[0.625rem]">
            SEGERA
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'lunar' ? (
          <motion.div
            key="tab-lunar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {/* Filter mata pelajaran (bisa di-scroll horizontal) */}
            <div
              role="radiogroup"
              aria-label="Filter mata pelajaran"
              className="-mx-5 mt-3.5 flex gap-2 overflow-x-auto px-5 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
            >
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[0.8125rem] transition-colors',
                      active
                        ? 'border-ink bg-ink font-extrabold text-white'
                        : 'border-[#D8D1C5] bg-white font-bold text-ink hover:bg-white/70',
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Label seksi */}
            <h2 className="mt-4 mb-1 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-ink">
              KELAS 5 · MINGGU INI
            </h2>

            {/* Daftar kartu materi */}
            <ul className="divide-y divide-line">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="group flex w-full items-start gap-3.5 py-3.5 text-left transition-colors hover:bg-white/40"
                  >
                    <CardThumbnail kind={item.thumb} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-[1rem] font-extrabold leading-snug text-ink group-hover:underline">
                          {item.title}
                        </span>
                        {item.isNew && (
                          <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.04em] text-tiger-ink">
                            BARU
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-2">{item.cardMeta}</p>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 text-[0.75rem] font-extrabold text-ok-ink">
                        <GreenCheckIcon className="size-3.5 shrink-0" />
                        <span>Tim LUNAR</span>
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            key="tab-komunitas"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mx-auto flex max-w-sm flex-col items-center pt-8 pb-4 text-center"
          >
            <TigerHeadAvatar className="size-28" />

            <h2 className="mt-5 text-[1.375rem] font-extrabold leading-[1.22] tracking-[-0.025em] text-ink">
              Materi dari Komunitas
              <br />
              segera hadir
            </h2>

            <p className="mt-2.5 max-w-[19rem] text-[0.875rem] leading-relaxed text-ink-2">
              Nanti guru, tutor les, dan kakak pengajar yang terverifikasi bisa berbagi materi di sini.
            </p>

            {/* Kotak info tinjauan Tim LUNAR */}
            <div className="mt-5 flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-[#CFC8BD] bg-white/75 px-4 py-3 text-left">
              <BlueShieldIcon className="size-5 shrink-0" />
              <p className="text-[0.8125rem] leading-snug text-ink">
                Semua materi komunitas tetap <strong className="font-extrabold">ditinjau Tim LUNAR</strong> sebelum tampil.
              </p>
            </div>

            {/* Tombol aksi */}
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setNotified(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-[0.9375rem] font-extrabold text-white transition-colors hover:bg-brand-800"
              >
                {notified ? (
                  <>
                    <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                    <span>Siap, kamu akan dikabari!</span>
                  </>
                ) : (
                  'Kabari aku kalau sudah ada'
                )}
              </button>

              <button
                type="button"
                onClick={() => setContributorNotified(true)}
                className="flex h-12 w-full items-center justify-center rounded-2xl border-[1.5px] border-tiger-ink bg-transparent px-5 text-[0.9375rem] font-extrabold text-tiger-ink transition-colors hover:bg-cream"
              >
                {contributorNotified ? 'Pendaftaran pengajar segera dibuka' : 'Aku pengajar, mau berbagi'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------- Ikon & Ilustrasi

function GreenCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#23824A" />
      <path d="M6.3 10.2 L8.9 12.8 L13.8 7.5" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BlueShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5 L4.5 5.8 V11.6 C4.5 16.8 7.7 21.3 12 22.8 C16.3 21.3 19.5 16.8 19.5 11.6 V5.8 L12 2.5 Z"
        fill="#66A3EA"
      />
      <path
        d="M12 2.5 V22.8 C16.3 21.3 19.5 16.8 19.5 11.6 V5.8 L12 2.5 Z"
        fill="#3978CE"
      />
    </svg>
  );
}

/** Thumbnail kartu daftar materi (84×68). */
function CardThumbnail({ kind }: { kind: ThumbKind }) {
  if (kind === 'siklus-air') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#CEE5F6]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <circle cx="66" cy="19" r="8" fill="#F5C542" />
          <path d="M0 51 Q38 38 84 52 L84 68 L0 68 Z" fill="#2B67C2" />
        </svg>
      </div>
    );
  }
  if (kind === 'bangun-datar') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#FCE7A8]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="13" y="21" width="24" height="24" fill="none" stroke="#1F1B16" strokeWidth="2.8" />
          <polygon points="60,19 74,46 46,46" fill="#E8772E" />
        </svg>
      </div>
    );
  }
  if (kind === 'bagian-tumbuhan') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#DCEFE2]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="39" y="16" width="5" height="40" rx="2" fill="#23824A" />
          <ellipse cx="32" cy="28" rx="9" ry="5" fill="#23824A" />
          <path d="M0 55 Q42 52 84 55 L84 68 L0 68 Z" fill="#6E4E3C" />
        </svg>
      </div>
    );
  }
  if (kind === 'tata-surya') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#1D2747]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <circle cx="0" cy="34" r="21" fill="#F5C542" />
          <circle cx="48" cy="30" r="9" fill="#3B7DD8" />
          <circle cx="69" cy="20" r="4.5" fill="#E8772E" />
          <circle cx="32" cy="14" r="1.3" fill="#FFFFFF" />
          <circle cx="64" cy="48" r="1.3" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }
  if (kind === 'persentase') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#FCE7A8]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <circle cx="29" cy="24" r="7" fill="none" stroke="#1F1B16" strokeWidth="3.2" />
          <circle cx="55" cy="44" r="7" fill="none" stroke="#E8772E" strokeWidth="3.2" />
          <line x1="25" y1="49" x2="59" y2="19" stroke="#1F1B16" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (kind === 'perkenalan-diri') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#FDE4DF]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="10" y="12" width="38" height="20" rx="7" fill="#FFFFFF" />
          <text x="29" y="25" textAnchor="middle" fill="#1F1B16" fontSize="9.5" fontWeight="800">
            Halo!
          </text>
          <rect x="34" y="36" width="40" height="20" rx="7" fill="#E8772E" />
          <circle cx="46" cy="46" r="2" fill="#FFFFFF" />
          <circle cx="54" cy="46" r="2" fill="#FFFFFF" />
          <circle cx="62" cy="46" r="2" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }
  if (kind === 'kalimat-tanya') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#FDE4DF]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="12" y="15" width="34" height="36" rx="7" fill="#FFFFFF" />
          <text x="29" y="40" textAnchor="middle" fill="#E8772E" fontSize="22" fontWeight="900">
            ?
          </text>
          <rect x="52" y="21" width="20" height="24" rx="5" fill="#1F1B16" />
          <text x="62" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="900">
            !
          </text>
        </svg>
      </div>
    );
  }
  if (kind === 'simple-present') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#DCEFE2]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="11" y="14" width="62" height="40" rx="7" fill="#23824A" />
          <text x="42" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
            I study
          </text>
        </svg>
      </div>
    );
  }
  if (kind === 'sapaan-inggris') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#DCEFE2]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="10" y="14" width="40" height="21" rx="8" fill="#23824A" />
          <text x="30" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800">
            Hello!
          </text>
          <rect x="34" y="37" width="40" height="19" rx="7" fill="#FFFFFF" />
          <text x="54" y="50" textAnchor="middle" fill="#1B6A3B" fontSize="9" fontWeight="800">
            Hi!
          </text>
        </svg>
      </div>
    );
  }
  if (kind === 'alat-transportasi') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#EAE6DC]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="14" y="22" width="56" height="26" rx="7" fill="#E8772E" />
          <rect x="20" y="27" width="12" height="10" rx="2.5" fill="#FFF6EA" />
          <rect x="36" y="27" width="12" height="10" rx="2.5" fill="#FFF6EA" />
          <rect x="52" y="27" width="12" height="10" rx="2.5" fill="#FFF6EA" />
          <circle cx="26" cy="50" r="6" fill="#1F1B16" />
          <circle cx="58" cy="50" r="6" fill="#1F1B16" />
        </svg>
      </div>
    );
  }
  if (kind === 'pancasila') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#FDE4DF]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <path d="M42 13 L23 20 V34 C23 46 31 54 42 58 C53 54 61 46 61 34 V20 L42 13 Z" fill="#1F1B16" />
          <polygon points="42,23 45,31 53,31 47,36 49,44 42,39 35,44 37,36 31,31 39,31" fill="#F5C542" />
        </svg>
      </div>
    );
  }
  if (kind === 'warna') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#F3E8FA]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <circle cx="26" cy="36" r="10" fill="#E5484D" />
          <circle cx="42" cy="24" r="10" fill="#F5C542" />
          <circle cx="58" cy="36" r="10" fill="#23824A" />
        </svg>
      </div>
    );
  }
  if (kind === 'kebersihan-diri') {
    return (
      <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#D8EFF8]" aria-hidden="true">
        <svg viewBox="0 0 84 68" className="size-full">
          <rect x="29" y="18" width="26" height="32" rx="8" fill="#FFFFFF" stroke="#2B67C2" strokeWidth="2.5" />
          <path d="M42 26 V42 M34 34 H50" stroke="#23824A" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="relative h-[4.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-2xl bg-[#FCE5CC]" aria-hidden="true">
      <svg viewBox="0 0 84 68" className="size-full">
        {/* Lingkaran 4 kuadran pecahan */}
        <path d="M42 34 L21 34 A21 21 0 0 1 42 13 Z" fill="#F5C542" />
        <path d="M42 34 L42 13 A21 21 0 0 1 63 34 Z" fill="#FFF6E5" />
        <path d="M42 34 L21 34 A21 21 0 0 0 42 55 Z" fill="#E8772E" />
        <path d="M42 34 L63 34 A21 21 0 0 1 42 55 Z" fill="#E5A93B" />
        <line x1="21" y1="34" x2="63" y2="34" stroke="#FCE5CC" strokeWidth="1.5" />
        <line x1="42" y1="13" x2="42" y2="55" stroke="#FCE5CC" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/** Ilustrasi hero di halaman Detail materi. */
function HeroIllustration({ kind }: { kind: ThumbKind }) {
  if (kind === 'siklus-air') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="none" className="size-full bg-[#CEE5F6]" aria-hidden="true">
        <rect x="40" y="40" width="76" height="28" rx="14" fill="#FFFFFF" />
        <circle cx="290" cy="52" r="21" fill="#F5C542" />
        <path d="M0 142 Q165 112 340 146 L340 190 L0 190 Z" fill="#2B67C2" />
      </svg>
    );
  }
  if (kind === 'bangun-datar') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#FCE7A8]" aria-hidden="true">
        <rect x="64" y="55" width="80" height="80" fill="none" stroke="#1F1B16" strokeWidth="8" />
        <polygon points="236,50 284,136 188,136" fill="#E8772E" />
      </svg>
    );
  }
  if (kind === 'bagian-tumbuhan') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#DCEFE2]" aria-hidden="true">
        <rect x="162" y="42" width="16" height="115" rx="6" fill="#23824A" />
        <ellipse cx="138" cy="80" rx="28" ry="16" fill="#23824A" />
        <path d="M0 152 Q170 144 340 152 L340 190 L0 190 Z" fill="#6E4E3C" />
      </svg>
    );
  }
  if (kind === 'tata-surya') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#1D2747]" aria-hidden="true">
        <circle cx="0" cy="95" r="65" fill="#F5C542" />
        <circle cx="170" cy="86" r="28" fill="#3B7DD8" />
        <circle cx="265" cy="58" r="15" fill="#E8772E" />
        <circle cx="115" cy="36" r="3" fill="#FFFFFF" />
        <circle cx="240" cy="140" r="3" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === 'persentase') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#FCE7A8]" aria-hidden="true">
        <circle cx="125" cy="65" r="22" fill="none" stroke="#1F1B16" strokeWidth="10" />
        <circle cx="215" cy="125" r="22" fill="none" stroke="#E8772E" strokeWidth="10" />
        <line x1="115" y1="138" x2="225" y2="52" stroke="#1F1B16" strokeWidth="10" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'perkenalan-diri' || kind === 'kalimat-tanya') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#FDE4DF]" aria-hidden="true">
        <rect x="44" y="34" width="130" height="54" rx="18" fill="#FFFFFF" />
        <text x="109" y="68" textAnchor="middle" fill="#1F1B16" fontSize="24" fontWeight="800">
          Halo!
        </text>
        <rect x="155" y="102" width="142" height="54" rx="18" fill="#E8772E" />
        <text x="226" y="135" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800">
          Apa kabar?
        </text>
      </svg>
    );
  }
  if (kind === 'simple-present' || kind === 'sapaan-inggris') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#DCEFE2]" aria-hidden="true">
        <rect x="55" y="38" width="230" height="114" rx="18" fill="#23824A" />
        <text x="170" y="104" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="800">
          I study
        </text>
      </svg>
    );
  }
  if (kind === 'alat-transportasi') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#EAE6DC]" aria-hidden="true">
        <rect x="70" y="55" width="200" height="82" rx="20" fill="#E8772E" />
        <rect x="92" y="72" width="40" height="32" rx="7" fill="#FFF6EA" />
        <rect x="150" y="72" width="40" height="32" rx="7" fill="#FFF6EA" />
        <rect x="208" y="72" width="40" height="32" rx="7" fill="#FFF6EA" />
        <circle cx="115" cy="142" r="18" fill="#1F1B16" />
        <circle cx="225" cy="142" r="18" fill="#1F1B16" />
      </svg>
    );
  }
  if (kind === 'pancasila') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#FDE4DF]" aria-hidden="true">
        <path d="M170 30 L114 50 V94 C114 130 138 154 170 164 C202 154 226 130 226 94 V50 L170 30 Z" fill="#1F1B16" />
        <polygon points="170,62 179,86 204,86 184,101 191,126 170,111 149,126 156,101 136,86 161,86" fill="#F5C542" />
      </svg>
    );
  }
  if (kind === 'warna') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#F3E8FA]" aria-hidden="true">
        <circle cx="110" cy="105" r="34" fill="#E5484D" />
        <circle cx="170" cy="70" r="34" fill="#F5C542" />
        <circle cx="230" cy="105" r="34" fill="#23824A" />
      </svg>
    );
  }
  if (kind === 'kebersihan-diri') {
    return (
      <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#D8EFF8]" aria-hidden="true">
        <rect x="122" y="45" width="96" height="100" rx="22" fill="#FFFFFF" stroke="#2B67C2" strokeWidth="7" />
        <path d="M170 68 V122 M143 95 H197" stroke="#23824A" strokeWidth="13" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" className="size-full bg-[#FCE5CC]" aria-hidden="true">
      <path d="M170 95 L110 95 A60 60 0 0 1 170 35 Z" fill="#F5C542" />
      <path d="M170 95 L170 35 A60 60 0 0 1 230 95 Z" fill="#FFF6E5" />
      <path d="M170 95 L110 95 A60 60 0 0 0 170 155 Z" fill="#E8772E" />
      <path d="M170 95 L230 95 A60 60 0 0 1 170 155 Z" fill="#E5A93B" />
      <line x1="110" y1="95" x2="230" y2="95" stroke="#FCE5CC" strokeWidth="4" />
      <line x1="170" y1="35" x2="170" y2="155" stroke="#FCE5CC" strokeWidth="4" />
    </svg>
  );
}

/** Kepala maskot harimau bertopi biru untuk layar teaser Tab Komunitas. */
function TigerHeadAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
      {/* Telinga */}
      <circle cx="36" cy="48" r="18" fill="#F28A2E" />
      <circle cx="124" cy="48" r="18" fill="#F28A2E" />
      <circle cx="36" cy="48" r="9.5" fill="#F4B6A8" />
      <circle cx="124" cy="48" r="9.5" fill="#F4B6A8" />

      {/* Kepala */}
      <ellipse cx="80" cy="82" rx="54" ry="44" fill="#F28A2E" />

      {/* Topi biru */}
      <circle cx="80" cy="18" r="4.5" fill="#2E6BC6" />
      <path d="M40 46 C46 20, 114 20, 120 46 Z" fill="#3B7DD8" />
      <path d="M36 45 Q80 38 134 47 Q108 52 36 45 Z" fill="#285EA8" />

      {/* Belang dahi */}
      <path d="M72 49 L75 59 M80 48 V59 M88 49 L85 59" stroke="#3A2416" strokeWidth="3.8" strokeLinecap="round" />

      {/* Belang pipi kiri & kanan */}
      <path d="M27 76 H41 M27 87 H41 M119 76 H133 M119 87 H133" stroke="#3A2416" strokeWidth="4.2" strokeLinecap="round" />

      {/* Mata */}
      <circle cx="57" cy="76" r="5" fill="#231810" />
      <circle cx="103" cy="76" r="5" fill="#231810" />
      <circle cx="55.5" cy="74.5" r="1.5" fill="#FFFFFF" />
      <circle cx="101.5" cy="74.5" r="1.5" fill="#FFFFFF" />

      {/* Moncong krem */}
      <ellipse cx="80" cy="99" rx="23" ry="15" fill="#FFF6EA" />
      <polygon points="73,90 87,90 80,97" fill="#9E472A" />
      <path d="M80 97 V102 M80 102 Q74 107 69 102 M80 102 Q86 107 91 102" fill="none" stroke="#3A2416" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
