import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
  CardThumbnail,
  HeroIllustration,
  materiItemById,
  type MateriItem,
} from '@/components/materi/MateriVisuals';
import { durationSec, materiById } from '@/data/materi';
import { useMateriStore, type Progress } from '@/state/materi.store';

const RECENT_LIMIT = 5;

function getProgressInfo(item: MateriItem, progressMap: Record<string, Progress>) {
  const m = materiById(item.videoId) ?? materiById(item.id);
  const p = progressMap[item.id] ?? progressMap[item.videoId];
  const totalSec = m ? durationSec(m) : 360;
  const sectionsCount = m ? m.sections.length : 4;

  if (p?.done) {
    return { pct: 1, remainingLabel: 'Selesai ditonton' };
  }
  const pct = p ? Math.min(0.95, Math.max(0.15, (p.section + 0.5) / sectionsCount)) : 0.35;
  const remainingMin = Math.max(1, Math.round(((1 - pct) * totalSec) / 60));
  return { pct, remainingLabel: `Sisa ${remainingMin} menit` };
}

/**
 * Halaman Materi Saya (/materi):
 * - Tanpa tab Semua / PDF / Disimpan.
 * - Seksi 1: TERAKHIR DITONTON (dibatasi 5 konten, tombol "Lihat semua >" untuk melihat seluruh riwayat konten yang ditonton).
 * - Seksi 2: KONTEN YANG DISIMPAN (berisi konten yang di-bookmark dari fitur Konten Pembelajaran).
 */
export default function MateriSayaPage() {
  const { profile } = useAuth();
  const store = useMateriStore(profile!.id);
  const navigate = useNavigate();
  const [showAllRecent, setShowAllRecent] = useState(false);

  // Seluruh riwayat konten yang pernah ditonton/dibuka
  const allRecentItems = useMemo(() => {
    const seen = new Set<string>();
    const list: { item: MateriItem; at: number }[] = [];
    for (const r of store.recent) {
      const item = materiItemById(r.id);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        list.push({ item, at: r.at });
      }
    }
    return list;
  }, [store.recent]);

  // Dibatasi 5 pada tampilan utama
  const recentPreview = useMemo(() => allRecentItems.slice(0, RECENT_LIMIT), [allRecentItems]);

  // Konten yang di-bookmark dari Konten Pembelajaran
  const savedItems = useMemo(() => {
    const seen = new Set<string>();
    const list: MateriItem[] = [];
    for (const id of store.saved) {
      const item = materiItemById(id);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    }
    return list;
  }, [store.saved]);

  // ---------- Tampilan "Lihat semua" untuk seluruh riwayat konten yang ditonton
  if (showAllRecent) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAllRecent(false)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[1.0625rem] font-extrabold tracking-[-0.02em] text-ink transition-colors hover:bg-white/70"
          >
            <ChevronLeft className="size-5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span>Semua Riwayat Tontonan</span>
          </button>
          <span className="ml-auto text-xs font-bold text-muted">{allRecentItems.length} konten</span>
        </header>

        {allRecentItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D1C5] bg-white/60 p-6 text-center text-sm text-muted">
            Belum ada riwayat konten yang ditonton.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {allRecentItems.map(({ item }) => {
              const { pct, remainingLabel } = getProgressInfo(item, store.progress);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/video/${item.videoId}`)}
                    className="group block w-full text-left"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                      <HeroIllustration kind={item.thumb} />
                      <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10">
                        <span className="block h-full rounded-r-full bg-tiger" style={{ width: `${pct * 100}%` }} />
                      </span>
                    </div>
                    <p className="mt-2 truncate text-[0.9375rem] font-extrabold text-ink group-hover:underline">
                      {item.title}
                    </p>
                    <p className="text-xs font-medium text-muted">
                      {remainingLabel} · {item.detailMeta}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // ---------- Tampilan utama Materi Saya (sesuai mockup)
  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header Materi Saya */}
      <div className="mb-6">
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-ink md:text-[2rem]">
          Materi Saya
        </h1>
        <p className="mt-1 text-[0.9375rem] text-muted">
          Konten yang terakhir kamu tonton dan konten yang kamu simpan.
        </p>
      </div>

      {/* ==================== TERAKHIR DITONTON (Maks 5 + Lihat semua) ==================== */}
      <section aria-labelledby="terakhir-ditonton-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="terakhir-ditonton-heading"
            className="text-[0.8125rem] font-extrabold uppercase tracking-[0.06em] text-ink"
          >
            TERAKHIR DITONTON
          </h2>
          <button
            type="button"
            onClick={() => setShowAllRecent(true)}
            className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[0.8125rem] font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            <span>Lihat semua</span>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        {recentPreview.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D1C5] bg-white/60 p-5 text-sm text-muted">
            Konten yang kamu tonton di{' '}
            <Link to="/video" className="font-bold text-tiger-ink hover:underline">
              Konten Pembelajaran
            </Link>{' '}
            akan muncul di sini.
          </div>
        ) : (
          <ul className="-mx-5 flex gap-3.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
            {recentPreview.map(({ item }) => {
              const { pct, remainingLabel } = getProgressInfo(item, store.progress);
              return (
                <li key={item.id} className="w-[10.75rem] shrink-0 sm:w-[12rem]">
                  <button
                    type="button"
                    onClick={() => navigate(`/video/${item.videoId}`)}
                    className="group block w-full text-left"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                      <HeroIllustration kind={item.thumb} />
                      <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10">
                        <span
                          className="block h-full rounded-r-full bg-tiger"
                          style={{ width: `${pct * 100}%` }}
                        />
                      </span>
                    </div>
                    <p className="mt-2 truncate text-[0.9375rem] font-extrabold leading-snug text-ink group-hover:underline">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] font-medium text-muted">{remainingLabel}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ==================== KONTEN YANG DISIMPAN ==================== */}
      <section aria-labelledby="konten-disimpan-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="konten-disimpan-heading"
            className="text-[0.8125rem] font-extrabold uppercase tracking-[0.06em] text-ink"
          >
            KONTEN YANG DISIMPAN
          </h2>
          <span className="text-[0.8125rem] font-medium text-muted">{savedItems.length} konten</span>
        </div>

        {savedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D1C5] bg-white/60 p-5 text-sm text-muted">
            Belum ada konten yang disimpan. Tekan ikon bookmark di{' '}
            <Link to="/video" className="font-bold text-tiger-ink hover:underline">
              Konten Pembelajaran
            </Link>{' '}
            untuk menyimpan materi favoritmu.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {savedItems.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3.5 py-3.5"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/video?detail=${item.id}`)}
                    className="group flex min-w-0 flex-1 items-center gap-3.5 text-left"
                  >
                    <CardThumbnail kind={item.thumb} className="h-12 w-14 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-extrabold text-ink group-hover:underline">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[0.8125rem] text-muted">
                        {item.detailMeta} · {item.cardMeta.split('·')[1]?.trim() ?? item.duration}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => store.toggleSaved(item.id)}
                    aria-label={`Hapus ${item.title} dari konten yang disimpan`}
                    title="Hapus dari simpanan"
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-tiger-ink transition-colors hover:bg-cream"
                  >
                    <Bookmark className="size-4" fill="currentColor" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}
