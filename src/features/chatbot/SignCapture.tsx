import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Camera, Check, LoaderCircle, MessageSquare, Pause, RotateCcw, Sparkles, X } from 'lucide-react';
import { TigerMascot } from '@/components/mascot/TigerMascot';
import { Button } from '@/components/ui/button';
import type { CaptureEvent } from '@/features/sign-to-text/autoCapture';
import { useAutoCapture } from '@/features/sign-to-text/useAutoCapture';
import { useHandTracking } from '@/features/sign-to-text/useHandTracking';
import { useCamera } from '@/hooks/useCamera';
import { matchingService } from '@/services/matching.service';
import { cn } from '@/lib/utils';
import type { MatchResult } from '@/types/kiosk';

/**
 * "Pakai isyarat" (panduan ui/03): kamera muncul sebagai sheet di atas chat. Setiap isyarat yang
 * dikenali menjadi chip kata; kata-kata itu disusun jadi kalimat lalu dikirim seperti pesan biasa
 * ("Kirim N kata"), atau dipindah ke kolom ketik untuk ditambah ("Ketik juga").
 *
 * Pita keyakinan sama dengan kiosk (BE yang memutuskan):
 *  A. ≥ 85%   langsung jadi chip (bisa dihapus satu per satu)
 *  B. 60–84%  kamera dijeda, siswa memilih sendiri ("Maksudmu kata ini?")
 *  C. < 60%   tidak ada tebakan; maskot + dua jalan keluar yang sama jelasnya
 * Video kamera hanya diproses di memori.
 */
type Stage = { kind: 'capture' } | { kind: 'processing' } | { kind: 'confirm'; r: MatchResult } | { kind: 'unknown' } | { kind: 'error' };

export function SignCapture({
  onSend,
  onType,
  onClose,
  sending = false,
}: {
  /** Kirim kalimat dari isyarat sebagai pesan. true = terkirim (sheet ditutup pemanggil). */
  onSend: (text: string) => void;
  /** Pindahkan kata ke kolom ketik. */
  onType: (text: string) => void;
  onClose: () => void;
  sending?: boolean;
}) {
  const [stage, setStage] = useState<Stage>({ kind: 'capture' });
  const [words, setWords] = useState<{ id: number; text: string }[]>([]);
  const nextId = useRef(0);
  const cam = useCamera({ onFailure: () => undefined });
  const captureOn = stage.kind === 'capture' && cam.status === 'ready';
  const tracking = useHandTracking(cam.videoRef, captureOn);
  const req = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeRef2 = useRef(onClose);
  closeRef2.current = onClose;

  useEffect(() => {
    void cam.start();
    return () => cam.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape menutup; halaman di belakang tidak ikut tergulir.
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

  const accept = useCallback((text: string) => {
    setWords((w) => [...w, { id: ++nextId.current, text }]);
    setStage({ kind: 'capture' });
  }, []);

  const onCapture = useCallback(
    async (e: CaptureEvent) => {
      if (e.type !== 'stop') return;
      setStage({ kind: 'processing' });
      const id = ++req.current;
      try {
        const r = await matchingService.matchSign(e.frames, e.durationMs);
        if (id !== req.current) return;
        if (r.action === 'accepted' && r.phraseText) accept(r.phraseText);
        else if (r.action === 'confirmed' && r.phraseText) setStage({ kind: 'confirm', r });
        else setStage({ kind: 'unknown' });
      } catch {
        if (id === req.current) setStage({ kind: 'error' });
      }
    },
    [accept],
  );

  const capture = useAutoCapture(captureOn, onCapture);
  const again = () => {
    req.current++;
    capture.reset();
    setStage({ kind: 'capture' });
  };

  const phase = stage.kind === 'capture' ? capture.phase : null;
  const recording = phase === 'RECORDING';
  const camFailed = cam.status === 'denied' || cam.status === 'unavailable' || cam.status === 'ended';
  const sentence = words.map((w) => w.text).join(' ');
  const lost = stage.kind === 'unknown' || stage.kind === 'error';
  const confirm = stage.kind === 'confirm' ? stage.r : null;

  // Status selalu satu kalimat di bawah kamera.
  const status = camFailed
    ? 'Kamera tidak tersedia. Ketik pertanyaanmu saja, ya.'
    : cam.status !== 'ready'
      ? 'Menyalakan kamera…'
      : tracking.status === 'loading'
        ? 'Memuat pendeteksi tangan…'
        : tracking.status === 'error'
          ? 'Pendeteksi tangan gagal dimuat'
          : stage.kind === 'processing'
            ? 'Mengenali isyarat…'
            : recording
              ? 'Merekam… turunkan tangan bila selesai'
              : phase === 'HAND_DETECTED'
                ? 'Tangan terlihat, tahan sebentar…'
                : 'Angkat tangan, isyaratkan satu kata';

  const typeInstead = () => {
    onType(sentence);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-sheet-title"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:rounded-3xl"
      >
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[#d9d1c5] sm:hidden" />
        <header className="flex items-center gap-2 px-5 pb-3 pt-3">
          <h2 id="sign-sheet-title" className="text-lg font-bold text-ink">
            Pakai isyarat
          </h2>
          <span className="ml-auto rounded-md bg-cap-soft px-2 py-0.5 text-xs font-bold tracking-[0.06em] text-cap">BETA</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup kamera isyarat"
            className="grid size-10 place-items-center rounded-full text-ink hover:bg-sand"
          >
            <X className="size-6" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
          {/* Kamera tetap terpasang (stream tidak diputus) walau disembunyikan di keadaan C. */}
          <div
            className={cn(
              'relative shrink-0 overflow-hidden rounded-2xl bg-ink transition-[height] duration-300',
              lost ? 'hidden' : confirm ? 'h-40' : 'aspect-[13/12] max-h-[52dvh] w-full',
            )}
          >
            <video
              ref={cam.videoRef}
              muted
              playsInline
              className={cn(
                'absolute inset-0 size-full -scale-x-100 object-cover transition-opacity',
                cam.status === 'ready' ? (confirm ? 'opacity-35' : 'opacity-100') : 'opacity-0',
              )}
            />
            {cam.status !== 'ready' && (
              <div className="absolute inset-0 grid place-items-center text-white/60">
                {cam.status === 'starting' ? <LoaderCircle className="size-7 anim-spin" aria-hidden="true" /> : <Camera className="size-7" aria-hidden="true" />}
              </div>
            )}

            {!confirm && (
              <>
                <span aria-hidden="true" className="absolute left-4 top-4 size-7 border-l-[3px] border-t-[3px] border-white" />
                <span aria-hidden="true" className="absolute right-4 top-4 size-7 border-r-[3px] border-t-[3px] border-white" />
              </>
            )}

            <p className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-8 text-[0.9375rem] text-white" aria-live="polite">
              {confirm ? (
                <>
                  <Pause className="size-4" aria-hidden="true" /> Kamera dijeda
                </>
              ) : (
                <>
                  {recording ? (
                    <span className="size-2.5 shrink-0 rounded-full bg-rec anim-rec" aria-hidden="true" />
                  ) : stage.kind === 'processing' ? (
                    <LoaderCircle className="size-4 shrink-0 anim-spin" aria-hidden="true" />
                  ) : null}
                  {status}
                </>
              )}
            </p>
            {recording && (
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
                <motion.span
                  className="block h-full bg-tiger"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </span>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {confirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center py-8 text-center"
                aria-live="polite"
              >
                <p className="text-base text-ink-2">Maksudmu kata ini?</p>
                <p className="mt-2 text-[2.75rem] font-black leading-none text-ink">{confirm.phraseText}</p>
                <span className="mt-5 block h-2 w-48 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                  <span className="block h-full rounded-full bg-ragu" style={{ width: `${Math.round(confirm.confidence * 100)}%` }} />
                </span>
                <p className="mt-2 text-sm text-ink-2">LUNAR agak ragu ({Math.round(confirm.confidence * 100)}%)</p>
              </motion.div>
            ) : lost ? (
              <motion.div
                key="lost"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center"
                aria-live="polite"
              >
                <TigerMascot className="h-32 w-28" />
                <p className="mt-4 text-[1.5rem] font-black text-ink">
                  {stage.kind === 'error' ? 'Pengenal isyarat belum tersambung' : 'Isyarat belum dikenali'}
                </p>
                <p className="mt-2 max-w-xs text-base leading-relaxed text-ink-2">
                  {stage.kind === 'error'
                    ? 'Server belum bisa dihubungi. Coba sebentar lagi, atau ketik saja pertanyaanmu.'
                    : 'Coba sekali lagi dengan pelan, atau ketik saja pertanyaanmu.'}
                </p>
                <p className="mt-6 flex w-full items-start gap-3 rounded-2xl bg-cream px-4 py-3.5 text-left text-[0.9375rem] leading-snug text-ink">
                  <Sparkles className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  Tips: hadapkan tangan ke kamera dan pastikan ruangan terang.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!lost && (
            <ul className={cn('flex flex-wrap items-center gap-2 py-4', confirm && 'pt-0')} aria-label="Kata dari isyarat">
              <AnimatePresence initial={false}>
                {words.map((w) => (
                  <motion.li
                    key={w.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex h-10 items-center gap-1 rounded-[10px] bg-cap-soft pl-3 pr-1 text-base font-semibold text-cap"
                  >
                    {w.text}
                    <button
                      type="button"
                      onClick={() => setWords((all) => all.filter((x) => x.id !== w.id))}
                      aria-label={`Hapus kata ${w.text}`}
                      className="grid size-8 place-items-center rounded-lg hover:bg-white/60"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {!confirm && <li className="px-1 text-[0.9375rem] text-muted">{words.length ? '+ kata berikutnya…' : 'Kata yang dikenali muncul di sini'}</li>}
            </ul>
          )}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-line px-4 pb-4 pt-4">
          {confirm ? (
            <>
              <Button variant="outline" size="lg" onClick={again}>
                <RotateCcw /> Bukan, ulangi
              </Button>
              <Button size="lg" onClick={() => accept(confirm.phraseText!)}>
                <Check /> Ya, tambahkan
              </Button>
            </>
          ) : lost ? (
            <>
              <Button variant="outline" size="lg" onClick={typeInstead}>
                <MessageSquare /> Ketik saja
              </Button>
              <Button size="lg" onClick={again}>
                <RotateCcw /> Coba lagi
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" onClick={typeInstead}>
                Ketik juga
              </Button>
              <Button size="lg" disabled={!words.length || sending} onClick={() => onSend(sentence)}>
                {sending ? <LoaderCircle className="anim-spin" aria-hidden="true" /> : null}
                {words.length ? `Kirim ${words.length} kata` : 'Kirim'}
                {!sending && <ArrowUp aria-hidden="true" />}
              </Button>
            </>
          )}
        </footer>
      </motion.section>
    </div>,
    document.body,
  );
}
