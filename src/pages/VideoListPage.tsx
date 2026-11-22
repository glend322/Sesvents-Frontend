import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignJustify, Bookmark, Check, ChevronLeft, Pencil, Play } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Avatar } from '@/auth/components/Avatar';
import {
  BlueShieldIcon,
  CardThumbnail,
  GreenCheckIcon,
  HeroIllustration,
  MATERI_FILTERS,
  MATERI_ITEMS,
  TigerHeadAvatar,
  type SourceTab,
  type SubjectFilter,
} from '@/components/materi/MateriVisuals';
import { useShellChrome } from '@/layout/AppShell';
import { useMateriStore } from '@/state/materi.store';
import { cn } from '@/lib/utils';

/**
 * Halaman Konten Pembelajaran (/video):
 *  A. Tab Konten LUNAR   filter mapel (bisa digeser horizontal), daftar materi Kelas 5 · Minggu Ini dengan badge "Tim LUNAR", label "BARU", dan tombol Bookmark.
 *  B. Tab Komunitas      teaser fitur komunitas dengan maskot, info tinjauan Tim LUNAR, dan dua tombol aksi.
 *  C. Detail materi      preview video, tombol Bookmark, info bab, kartu hijau sumber & tanggal tinjauan, daftar isi materi, tombol Tanya LUNAR.
 */
export default function VideoListPage() {
  const { profile } = useAuth();
  const store = useMateriStore(profile!.id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<SourceTab>('lunar');
  const [filter, setFilter] = useState<SubjectFilter>('Semua');
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('detail'));
  const [notified, setNotified] = useState(false);
  const [contributorNotified, setContributorNotified] = useState(false);

  const selected = MATERI_ITEMS.find((m) => m.id === selectedId || m.videoId === selectedId) ?? null;

  useEffect(() => {
    const detailParam = searchParams.get('detail');
    if (detailParam) {
      setSelectedId(detailParam);
    }
  }, [searchParams]);

  // Saat siswa membuka Detail materi, catat ke riwayat "Terakhir ditonton".
  useEffect(() => {
    if (selected) {
      store.markOpened(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Sembunyikan header default mobile supaya bar atas mengikuti desain ("Konten Pembelajaran" + avatar, atau "< Detail materi").
  useShellChrome({ mobileHeader: false, mobileNav: !selected });

  const filtered = MATERI_ITEMS.filter((m) => filter === 'Semua' || m.subject === filter);

  const closeDetail = () => {
    setSelectedId(null);
    if (searchParams.has('detail')) {
      setSearchParams({}, { replace: true });
    }
  };

  // ---------- C. Detail materi
  if (selected) {
    const isSaved = store.isSaved(selected.id) || store.isSaved(selected.videoId);
    const toggleBookmark = () => {
      store.toggleSaved(selected.id);
    };

    return (
      <div className="mx-auto w-full max-w-2xl">
        {/* Bar atas Detail materi + Tombol Bookmark */}
        <header className="-mx-5 -mt-5 mb-5 flex h-14 items-center justify-between border-b border-line bg-white px-3 md:-mx-8 md:-mt-8 md:px-6 lg:mx-0 lg:mt-0 lg:rounded-2xl lg:border lg:px-4">
          <button
            type="button"
            onClick={closeDetail}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[1.0625rem] font-extrabold tracking-[-0.02em] text-ink transition-colors hover:bg-sand"
          >
            <ChevronLeft className="size-5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span>Detail materi</span>
          </button>

          <button
            type="button"
            onClick={toggleBookmark}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Hapus ${selected.title} dari konten yang disimpan` : `Simpan ${selected.title}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-colors',
              isSaved
                ? 'border-tiger-ink/30 bg-cream text-tiger-ink'
                : 'border-line bg-white text-ink hover:bg-sand',
            )}
          >
            <Bookmark className="size-4" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
            <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
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

  // ---------- A & B. Daftar Konten Pembelajaran (Konten LUNAR / Komunitas)
  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Bar atas: judul Konten Pembelajaran + avatar */}
      <header className="-mx-5 -mt-5 mb-4 flex items-center justify-between border-b border-line bg-white px-5 py-3.5 md:-mx-8 md:-mt-8 md:px-8 lg:mx-0 lg:mt-0 lg:mb-5 lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0">
        <h1 className="text-[1.625rem] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[1.875rem]">
          Konten Pembelajaran
        </h1>
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
              {MATERI_FILTERS.map((f) => {
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
              {filtered.map((item) => {
                const isSaved = store.isSaved(item.id) || store.isSaved(item.videoId);
                return (
                  <li key={item.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="group flex min-w-0 flex-1 items-start gap-3.5 py-3.5 text-left transition-colors hover:bg-white/40"
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

                    <button
                      type="button"
                      onClick={() => store.toggleSaved(item.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? `Hapus ${item.title} dari simpanan` : `Simpan ${item.title}`}
                      title={isSaved ? 'Tersimpan di Materi Saya' : 'Simpan ke Materi Saya'}
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-xl transition-colors',
                        isSaved
                          ? 'bg-cream text-tiger-ink'
                          : 'text-muted hover:bg-white hover:text-ink',
                      )}
                    >
                      <Bookmark className="size-5" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
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
