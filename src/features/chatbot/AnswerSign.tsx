import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Captions, CaptionsOff, Maximize2, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { SignCaption } from '@/components/ui/sign-caption';
import { SignerAvatar } from '@/components/ui/signer-avatar';
import { signWordsForText, SkeletonPlayer } from '@/features/skeleton-animation';
import { MAX_SIGNED_WORDS } from '@/features/skeleton-animation/sentence';
import { tokenizeWords } from '@/services/textMatch';
import { useSettings } from '@/state/SettingsContext';
import { cn } from '@/lib/utils';

/**
 * Isyarat untuk jawaban chatbot (ADR-051 D5, panduan ui/02). Kata kosakata memakai rekaman asli;
 * kata lain memakai gerakan penanda yang konsisten per kata.
 *
 *  - Kartu di bawah teks jawaban: "Putar isyarat" + jumlah kata. Ketuk → layar gelap penuh.
 *  - Jawaban baru dengan "putar otomatis" aktif diputar langsung di kartu (bisa diperbesar).
 *  - Layar penuh: kata yang sedang diisyaratkan disorot kuning, progres per kata, kecepatan,
 *    jeda/lanjut, putar ulang, dengarkan.
 *
 * Klip baru dibuat saat pertama diputar (bukan untuk semua pesan riwayat sekaligus).
 */
type Speech = { speaking: boolean; onSpeak: () => void };

export function AnswerSign({
  text,
  autoPlay,
  compact = false,
  speech,
}: {
  text: string;
  autoPlay: boolean;
  compact?: boolean;
  speech?: Speech;
}) {
  const settings = useSettings();
  const [inline, setInline] = useState(autoPlay);
  const [full, setFull] = useState(false);
  const [run, setRun] = useState(0);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  // Jumlah kata untuk kartu (murah: tanpa membuat klip).
  const count = useMemo(() => Math.min(MAX_SIGNED_WORDS, tokenizeWords(text).length), [text]);
  const words = useMemo(() => (inline || full ? signWordsForText(text) : []), [inline, full, text]);
  const clips = useMemo(() => words.map((w) => w.clip), [words]);
  const captionWords = useMemo(() => words.map((w) => w.text), [words]);

  if (count === 0) return null;

  const openFull = () => {
    setInline(false);
    setFull(true);
  };

  return (
    <>
      <div className={cn('relative mt-3 overflow-hidden rounded-2xl', inline ? 'bg-[#2a2520]' : 'bg-cap-soft')}>
        <div className={cn('relative w-full', compact ? 'aspect-[16/10]' : 'aspect-[16/9]')}>
          {inline && clips.length > 0 ? (
            <>
              <SkeletonPlayer
                clips={clips}
                run={run}
                speed={settings.signSpeed}
                onProgress={setProgress}
                onSegment={setActive}
                onDone={() => setInline(false)}
                className={cn('absolute inset-0 size-full p-2', compact ? 'pb-2' : 'pb-10')}
              />
              {settings.captions && !compact && <SignCaption words={captionWords} active={active} size={settings.captionSize} />}
              <div className="absolute right-2 top-2 flex gap-1">
                <IconBtn label="Perbesar isyarat" onClick={openFull}>
                  <Maximize2 />
                </IconBtn>
                <IconBtn label="Hentikan isyarat" onClick={() => setInline(false)}>
                  <Pause />
                </IconBtn>
              </div>
              <span className="absolute inset-x-0 bottom-0 h-1 bg-white/15" aria-hidden="true">
                <span className="block h-full bg-tiger transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
              </span>
            </>
          ) : (
            <button type="button" onClick={openFull} className="group absolute inset-0 text-left" aria-label={`Putar isyarat jawaban, ${count} kata`}>
              <SignerAvatar tone="brand" animated={false} className="absolute inset-x-[24%] bottom-0 top-[12%] transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="absolute bottom-3 left-3 flex h-10 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-sm font-bold text-white">
                <Play className="size-3.5" fill="currentColor" aria-hidden="true" /> Putar isyarat
              </span>
              <span className="absolute bottom-3.5 right-3 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-ink">{count} kata</span>
            </button>
          )}
        </div>
        {inline && compact && settings.captions && <SignCaption words={captionWords} active={active} size={settings.captionSize} inline />}
      </div>
      {/* Pembaca layar: teks lengkap tanpa perlu mengikuti animasi. */}
      <p className="sr-only">{text}</p>

      <AnimatePresence>
        {full && clips.length > 0 && (
          <SignPlayerFull
            key={`full-${run}`}
            clips={clips}
            words={captionWords}
            speech={speech}
            onClose={() => {
              setFull(false);
              setRun((r) => r + 1);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- layar penuh

const SPEEDS = [0.5, 0.75, 1] as const;
/** Kata per "halaman" caption besar di layar penuh. */
const PAGE = 6;
/** Di atas jumlah ini progres digambar sebagai satu bar, bukan per kata. */
const MAX_SEGMENTS = 24;

function SignPlayerFull({
  clips,
  words,
  speech,
  onClose,
}: {
  clips: ReturnType<typeof signWordsForText>[number]['clip'][];
  words: string[];
  speech?: Speech;
  onClose: () => void;
}) {
  const settings = useSettings();
  const [speed, setSpeed] = useState<number>(Math.min(1, settings.signSpeed));
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);
  // Posisi saat dijeda / kecepatan diganti, supaya lanjut dari titik yang sama.
  const resumeAt = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeRef2 = useRef(onClose);
  closeRef2.current = onClose;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef2.current();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // Sekali saat dibuka (onClose dari pemanggil bisa berganti tiap render).
  }, []);

  const restart = () => {
    resumeAt.current = 0;
    setProgress(0);
    setActive(0);
    setEnded(false);
    setPaused(false);
    setRun((r) => r + 1);
  };
  const togglePause = () => {
    if (ended) return restart();
    resumeAt.current = progress;
    setPaused((p) => !p);
  };
  const changeSpeed = (s: number) => {
    resumeAt.current = progress;
    setSpeed(s);
  };

  const start = Math.floor(Math.max(0, active) / PAGE) * PAGE;
  const shown = words.slice(start, start + PAGE);
  const segmented = words.length <= MAX_SEGMENTS;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Isyarat jawaban"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-ink pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white"
    >
      <header className="flex h-16 shrink-0 items-center justify-between px-3">
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup isyarat" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <X className="size-6" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <h2 className="text-base font-semibold">Isyarat jawaban</h2>
        <button
          type="button"
          onClick={() => settings.update({ captions: !settings.captions })}
          aria-pressed={settings.captions}
          aria-label={settings.captions ? 'Sembunyikan caption' : 'Tampilkan caption'}
          className="grid size-11 place-items-center rounded-full hover:bg-white/10"
        >
          {settings.captions ? <Captions className="size-6" strokeWidth={1.8} aria-hidden="true" /> : <CaptionsOff className="size-6" strokeWidth={1.8} aria-hidden="true" />}
        </button>
      </header>

      <div className="relative min-h-0 flex-1 bg-[#2a2520]">
        <SkeletonPlayer
          clips={clips}
          run={run}
          speed={speed}
          paused={paused}
          startProgress={resumeAt.current}
          onProgress={setProgress}
          onSegment={setActive}
          onDone={() => setEnded(true)}
          className="absolute inset-0 mx-auto size-full max-w-3xl p-4"
        />
      </div>

      <div className="mx-auto w-full max-w-xl shrink-0 px-6 pt-6">
        <p className={cn('min-h-[4.5rem] text-center text-[1.625rem] font-bold leading-snug sm:text-[1.875rem]', !settings.captions && 'invisible')} aria-hidden="true">
          {shown.map((w, i) => {
            const idx = start + i;
            return (
              <span key={`${idx}-${w}`}>
                <span className={cn('rounded-md px-1 transition-colors', idx === active ? 'bg-sun text-ink' : idx < active ? 'text-white' : 'text-white/40')}>{w}</span>
                {i < shown.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </p>

        {segmented ? (
          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {words.map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i < active ? 'bg-white' : i === active ? 'bg-sun' : 'bg-white/20')} />
            ))}
          </div>
        ) : (
          <span className="mt-5 block h-1 rounded-full bg-white/20" aria-hidden="true">
            <span className="block h-full rounded-full bg-sun" style={{ width: `${progress * 100}%` }} />
          </span>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={restart} aria-label="Putar ulang dari awal" className="grid size-14 place-items-center rounded-full border-[1.5px] border-white/30 hover:bg-white/10">
            <RotateCcw className="size-5" aria-hidden="true" />
          </button>
          <div role="group" aria-label="Kecepatan isyarat" className="flex rounded-xl border-[1.5px] border-white/30 p-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => changeSpeed(s)}
                aria-pressed={speed === s}
                className={cn('h-9 rounded-lg px-3 text-sm font-bold tabular-nums', speed === s ? 'bg-white text-ink' : 'text-white hover:bg-white/10')}
              >
                {s}×
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={togglePause}
            aria-label={ended ? 'Putar ulang' : paused ? 'Lanjutkan' : 'Jeda'}
            className="grid size-16 place-items-center rounded-full bg-tiger text-ink transition-colors hover:bg-[#e47c20]"
          >
            {ended ? <RotateCcw className="size-6" aria-hidden="true" /> : paused ? <Play className="size-6" fill="currentColor" aria-hidden="true" /> : <Pause className="size-6" fill="currentColor" aria-hidden="true" />}
          </button>
        </div>

        <div className="mb-6 mt-8 grid grid-cols-2 gap-3">
          {speech ? (
            <button type="button" onClick={speech.onSpeak} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white/10 text-base font-bold hover:bg-white/15">
              {speech.speaking ? <VolumeX className="size-5" aria-hidden="true" /> : <Volume2 className="size-5" aria-hidden="true" />}
              {speech.speaking ? 'Hentikan' : 'Dengarkan'}
            </button>
          ) : (
            <span />
          )}
          <p className="flex h-14 items-center justify-center rounded-xl bg-white/10 text-base font-bold tabular-nums" aria-live="polite">
            Kata {Math.min(words.length, active + 1)} dari {words.length}
          </p>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
