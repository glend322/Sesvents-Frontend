import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, Captions, CaptionsOff, Check, Copy, FileText, Hand, LoaderCircle, MapPin, Play, Plus, RotateCcw, Sparkles, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/ui/logo';
import { clock } from '@/data/materi';
import { useSettings } from '@/state/SettingsContext';
import { cn } from '@/lib/utils';
import { AnswerSign } from './AnswerSign';
import type { ChatDocument } from './chat.service';
import { SignCapture } from './SignCapture';
import type { ViewMessage } from './useChat';

/*
 * Bagian percakapan Tanya LUNAR (panduan ui/02 & ui/03): gelembung siswa hitam, jawaban LUNAR di
 * kartu putih + kartu isyarat + tombol Dengarkan/Caption, kolom tanya berbentuk pil
 * (+ PDF · teks · Isyarat · kirim).
 */

const time = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

// ---------------------------------------------------------------- teks jawaban

/** **tebal** → <strong>. Hanya itu; jawaban lain tampil apa adanya. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * Jawaban pendek & bernomor: baris "1. …" nomornya ditebalkan, "- …" jadi titik. Baris kosong =
 * jarak antar paragraf.
 */
export function AnswerText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  return (
    <div className={cn('flex flex-col gap-1 text-[0.9375rem] leading-relaxed text-ink', className)}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <span key={i} className="h-1.5" aria-hidden="true" />;
        const num = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (num)
          return (
            <p key={i}>
              <b className="font-bold">{num[1]}.</b> {inline(num[2])}
            </p>
          );
        const dot = line.match(/^\s*[-*•]\s+(.*)$/);
        if (dot)
          return (
            <p key={i} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{inline(dot[1])}</span>
            </p>
          );
        return <p key={i}>{inline(line.replace(/^#+\s*/, ''))}</p>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------- salin & sederhanakan

const copyCallbacks = new WeakMap<HTMLButtonElement, (ok: boolean) => void>();
let copyListenerReady = false;
let lastCopyAnnouncement = '';

function legacyCopy(text: string): boolean {
  const previousFocus = document.activeElement as HTMLElement | null;
  const field = Object.assign(document.createElement('textarea'), { value: text });
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}

async function runCopyCommand(button: HTMLButtonElement, target: HTMLElement) {
  const text = target.innerText.trim();
  if (!text) return;
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    try {
      ok = legacyCopy(text);
    } catch {
      ok = false;
    }
  }
  copyCallbacks.get(button)?.(ok);
}

function ensureCopyListener() {
  if (copyListenerReady || typeof window === 'undefined') return;
  copyListenerReady = true;
  if ('CommandEvent' in window) {
    document.addEventListener(
      'command',
      (e) => {
        const ev = e as Event & { command?: string; source?: Element | null };
        if (ev.command !== '--copy') return;
        const button = ev.source;
        const target = ev.target;
        if (button instanceof HTMLButtonElement && target instanceof HTMLElement) {
          void runCopyCommand(button, target);
        }
      },
      true,
    );
  } else {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      const el = event.target instanceof Element ? event.target.closest('button[command="--copy"]') : null;
      if (!(el instanceof HTMLButtonElement)) return;
      const targetId = el.getAttribute('commandfor');
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) void runCopyCommand(el, target);
    });
  }
}

/** Prompt tindak lanjut untuk tombol "Sederhanakan" agar jawaban lebih ringkas dan mudah dipahami. */
export function simplifyPrompt(content: string, latest: boolean): string {
  if (latest) return 'Tolong jelaskan lagi jawaban tadi dengan kalimat yang lebih sederhana dan contoh sehari-hari.';
  const plain = content.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const snippet = plain.length > 60 ? `${plain.slice(0, 60).trimEnd()}…` : plain;
  return `Tolong jelaskan bagian “${snippet}” dengan kalimat yang lebih sederhana dan contoh sehari-hari.`;
}

// ---------------------------------------------------------------- pesan

export function Bubble({
  m,
  autoPlay,
  busy = false,
  onSimplify,
  onRetry,
  onDiscard,
  onSeek,
  rewatch,
  compact = false,
}: {
  m: ViewMessage;
  autoPlay: boolean;
  busy?: boolean;
  onSimplify?: () => void;
  onRetry: () => void;
  onDiscard: () => void;
  /** Halaman video: klik chip waktu di pertanyaan → lompat ke detik itu. */
  onSeek?: (t: number) => void;
  /** Halaman video: tautan "Lihat lagi" di bawah jawaban. */
  rewatch?: { t: number; onClick: () => void } | null;
  /** Gelembung di kolom sempit (panel tanya samping video): caption di bawah animasi isyarat. */
  compact?: boolean;
}) {
  const settings = useSettings();
  const answerId = useId();

  if (m.role === 'user') {
    const t = m.videoTSec;
    return (
      <motion.li
        layout="position"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-w-[85%] flex-col items-end self-end"
      >
        {t != null && (
          <button
            type="button"
            onClick={() => onSeek?.(t)}
            disabled={!onSeek}
            className="mb-1 flex items-center gap-1 rounded-md bg-cream px-2 py-0.5 text-xs font-semibold text-tiger-ink enabled:hover:bg-brand-100"
            aria-label={`Ditanyakan di ${clock(t)}`}
          >
            <MapPin className="size-3" aria-hidden="true" /> {clock(t)}
          </button>
        )}
        <div className={cn('rounded-[20px] bg-ink px-5 py-3 text-white', m.status === 'sending' && 'opacity-75', m.status === 'failed' && 'bg-ink-2')}>
          {m.inputMode === 'sign' && (
            <span className="mb-0.5 flex items-center gap-1.5 text-[0.8125rem] text-white/75">
              <Hand className="size-3.5" aria-hidden="true" /> dari isyarat
            </span>
          )}
          <p className="whitespace-pre-wrap text-base leading-snug">{m.content}</p>
        </div>
        <span className="mt-1 px-1 text-xs text-muted">
          {m.status === 'sending' ? 'Mengirim…' : m.status === 'failed' ? <span className="text-rec">Belum terkirim</span> : time(m.createdAt)}
        </span>
        {m.status === 'failed' && (
          <span className="mt-1.5 flex gap-2">
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw /> Kirim ulang
            </Button>
            <Button size="sm" variant="ghost" onClick={onDiscard}>
              Hapus
            </Button>
          </span>
        )}
      </motion.li>
    );
  }

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex w-full flex-col self-start', compact ? 'max-w-full' : 'max-w-[34rem]')}
    >
      <span className="mb-2 flex items-center gap-2 text-[0.9375rem] font-bold tracking-[0.02em] text-ink">
        <LogoMark className="size-7 rounded-lg" /> LUNAR
      </span>
      <div id={answerId} className="rounded-[20px] border border-line bg-white px-5 py-4">
        <AnswerText text={m.content} />
      </div>
      <AnswerSign text={m.content} autoPlay={autoPlay} compact={compact} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyChip targetId={answerId} />
        {onSimplify && (
          <Chip onClick={onSimplify} disabled={busy}>
            <Sparkles aria-hidden="true" />
            Sederhanakan
          </Chip>
        )}
        <Chip onClick={() => settings.update({ captions: !settings.captions })} pressed={settings.captions} label={settings.captions ? 'Caption menyala' : 'Caption mati'}>
          {settings.captions ? <Captions aria-hidden="true" /> : <CaptionsOff aria-hidden="true" />}
          Caption
        </Chip>
        {rewatch && (
          <Chip onClick={rewatch.onClick}>
            <Play fill="currentColor" aria-hidden="true" /> Lihat lagi di {clock(rewatch.t)}
          </Chip>
        )}
        <span className="text-xs text-muted">{time(m.createdAt)}</span>
      </div>
    </motion.li>
  );
}

function CopyChip({ targetId }: { targetId: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [liveText, setLiveText] = useState('');

  useEffect(() => {
    ensureCopyListener();
    const btn = btnRef.current;
    if (!btn) return;
    copyCallbacks.set(btn, (ok) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      setStatus(ok ? 'copied' : 'failed');
      let msg = ok ? 'Jawaban disalin' : 'Gagal menyalin';
      if (msg === lastCopyAnnouncement) msg += '\u00A0';
      lastCopyAnnouncement = msg;
      setLiveText('');
      requestAnimationFrame(() => setLiveText(msg));
      timerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setLiveText('');
        timerRef.current = null;
      }, 2000);
    });
    return () => {
      copyCallbacks.delete(btn);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span className="inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        {...({ command: '--copy', commandfor: targetId } as Record<string, string>)}
        data-copied={status === 'copied' ? '' : undefined}
        data-failed={status === 'failed' ? '' : undefined}
        className={cn(
          'flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-[1.5px] bg-white px-4 py-2 text-[0.9375rem] font-semibold transition-colors [&_svg]:size-[1.15rem]',
          status === 'copied'
            ? 'border-ok-ink/30 bg-ok-soft text-ok-ink'
            : status === 'failed'
              ? 'border-rec/30 bg-rec-soft text-rec'
              : 'border-line text-ink hover:bg-sand',
        )}
      >
        {status === 'copied' ? <Check aria-hidden="true" /> : status === 'failed' ? <TriangleAlert aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {status === 'copied' ? 'Tersalin' : status === 'failed' ? 'Gagal salin' : 'Salin'}
      </button>
      <span role="status" className="sr-only">
        {liveText}
      </span>
    </span>
  );
}

function Chip({
  children,
  onClick,
  pressed,
  label,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={pressed}
      aria-label={label}
      aria-disabled={disabled || undefined}
      className="flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-4 py-2 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-sand aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-white [&_svg]:size-[1.15rem]"
    >
      {children}
    </button>
  );
}

export function Typing() {
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 self-start" role="status">
      <LogoMark className="size-7 rounded-lg" />
      <span className="text-[0.9375rem] text-ink-2">LUNAR sedang menulis jawaban</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.i
            key={i}
            className="block size-2 rounded-full bg-tiger"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
    </motion.li>
  );
}

export function ErrorNote({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-2 flex items-start gap-2.5 rounded-2xl bg-rec-soft px-4 py-3 text-sm text-[#9b2a23]"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{text}</span>
      <button type="button" onClick={onClose} aria-label="Tutup pesan" className="rounded-md p-0.5 hover:bg-white/60">
        <X className="size-4" aria-hidden="true" />
      </button>
    </motion.p>
  );
}

export function DocumentChips({ docs, uploading }: { docs: ChatDocument[]; uploading: boolean }) {
  if (!docs.length && !uploading) return null;
  return (
    <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Materi PDF di percakapan ini">
      {docs.map((d) => (
        <motion.li
          key={d.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-[16rem] items-center gap-1.5 rounded-[10px] border border-line bg-white py-1.5 pl-2 pr-3 text-xs font-semibold text-ink"
          title={`${d.filename} · ${d.pageCount} halaman`}
        >
          <FileText className="size-3.5 shrink-0 text-rec" aria-hidden="true" />
          <span className="truncate">{d.filename}</span>
          <span className="shrink-0 font-normal text-muted">· {d.pageCount} hlm</span>
        </motion.li>
      ))}
      {uploading && (
        <li className="flex items-center gap-1.5 rounded-[10px] bg-cream px-3 py-1.5 text-xs font-semibold text-ink" role="status">
          <LoaderCircle className="size-3.5 anim-spin" aria-hidden="true" /> Membaca PDF…
        </li>
      )}
    </ul>
  );
}

// ---------------------------------------------------------------- input

/** Tombol "Isyarat" (khusus isyarat = biru): melambai sekali saat muncul. */
function SignButton({ open, onToggle, wave, compact }: { open: boolean; onToggle: () => void; wave: boolean; compact?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      aria-label="Bertanya dengan isyarat"
      title="Tunjukkan isyarat ke kamera"
      whileHover="wiggle"
      whileTap={{ scale: 0.95 }}
      className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-cap-soft px-3.5 text-[0.9375rem] font-semibold text-cap transition-colors hover:bg-[#dbe7f8]"
    >
      <motion.span
        className="inline-flex origin-[70%_85%]"
        initial={reduced || !wave ? false : { rotate: 0 }}
        animate={reduced || !wave ? undefined : { rotate: [0, 22, -8, 18, -4, 0] }}
        transition={{ duration: 1.3, delay: 0.6, ease: 'easeInOut' }}
        variants={reduced ? undefined : { wiggle: { rotate: [0, 18, -10, 12, 0], transition: { duration: 0.6 } } }}
      >
        <Hand className="size-[1.15rem]" strokeWidth={1.8} aria-hidden="true" />
      </motion.span>
      {!compact && <span>Isyarat</span>}
    </motion.button>
  );
}

export function Composer({
  value,
  onChange,
  onSend,
  sending,
  uploading,
  onUpload,
  chip,
  placeholder = 'Tanya apa saja…',
  onTyping,
  waveOnMount = false,
  compact = false,
  autoFocus = false,
  inputRef: externalRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, mode: 'text' | 'sign') => Promise<boolean>;
  sending: boolean;
  uploading?: boolean;
  /** Ada = tombol + (unggah PDF) tampil. */
  onUpload?: (file: File) => void;
  /** Chip di atas kolom (mis. waktu video saat bertanya). */
  chip?: { label: string; onRemove: () => void } | null;
  placeholder?: string;
  /** true saat kolom fokus / sedang diketik (maskot melihat ke kolom; video berhenti). */
  onTyping?: (typing: boolean) => void;
  waveOnMount?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [usedSign, setUsedSign] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = externalRef ?? ownRef;
  const file = useRef<HTMLInputElement>(null);

  // textarea tumbuh mengikuti isi (maks ±6 baris); pil berubah jadi kotak bundar bila > 1 baris.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    setMultiline(!!value && el.scrollHeight > 52);
  }, [value, ref]);

  const submit = async () => {
    if (!value.trim() || sending) return;
    const ok = await onSend(value, usedSign ? 'sign' : 'text');
    if (ok) setUsedSign(false);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  /** "Kirim N kata" dari sheet isyarat: kalimat isyarat (+ ketikan yang sudah ada) dikirim langsung. */
  const sendSign = async (sentence: string) => {
    const text = value.trim() ? `${value.trimEnd()} ${sentence}` : sentence;
    const ok = await onSend(text, 'sign');
    if (ok) {
      setUsedSign(false);
      setSignOpen(false);
    }
  };
  /** "Ketik juga": kata isyarat dipindah ke kolom ketik untuk ditambah. */
  const typeSign = (sentence: string) => {
    if (sentence) {
      setUsedSign(true);
      onChange(value.trim() ? `${value.trimEnd()} ${sentence}` : sentence);
    }
    onTyping?.(true);
    window.setTimeout(() => ref.current?.focus(), 50);
  };

  return (
    <div>
      <AnimatePresence>
        {signOpen && <SignCapture onSend={(s) => void sendSign(s)} onType={typeSign} onClose={() => {
              setSignOpen(false);
              ref.current?.focus();
            }}
            sending={sending}
          />}
      </AnimatePresence>
      <AnimatePresence>
        {chip && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-1.5 ml-3 inline-flex items-center gap-1 rounded-md bg-cream py-0.5 pl-2 pr-1 text-xs font-semibold text-tiger-ink"
          >
            <MapPin className="size-3" aria-hidden="true" /> {chip.label}
            <button type="button" onClick={chip.onRemove} aria-label="Hapus penanda waktu" className="grid size-5 place-items-center rounded hover:bg-brand-100">
              <X className="size-3" aria-hidden="true" />
            </button>
          </motion.span>
        )}
      </AnimatePresence>
      {usedSign && value.trim() && (
        <p className="mb-1.5 ml-3 flex items-center gap-1 text-xs font-semibold text-cap">
          <Hand className="size-3.5" aria-hidden="true" /> Berisi kata dari isyarat
        </p>
      )}
      <form
        onSubmit={onSubmit}
        className={cn(
          'flex items-end gap-1.5 border-[1.5px] border-line bg-white p-1.5 transition-colors focus-within:border-ink',
          multiline ? 'rounded-[1.6rem]' : 'rounded-full',
        )}
      >
        {onUpload && (
          <>
            <input
              ref={file}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) onUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => file.current?.click()}
              disabled={uploading}
              aria-label="Tambah materi PDF"
              title="Tambah materi PDF (maks 10 halaman)"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-ink transition-colors hover:bg-line disabled:opacity-50"
            >
              {uploading ? <LoaderCircle className="size-5 anim-spin" aria-hidden="true" /> : <Plus className="size-5" strokeWidth={1.8} aria-hidden="true" />}
            </button>
          </>
        )}
        <label htmlFor="chat-input" className="sr-only">
          Tulis pertanyaan
        </label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={value}
          maxLength={1000}
          autoFocus={autoFocus}
          onFocus={() => onTyping?.(true)}
          onBlur={() => onTyping?.(!!value.trim())}
          onChange={(e) => {
            onChange(e.target.value);
            onTyping?.(true);
            if (!e.target.value.trim()) setUsedSign(false);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="block max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-ink placeholder:overflow-hidden placeholder:text-ellipsis placeholder:whitespace-nowrap placeholder:text-[#a39b90] focus:outline-none"
        />
        <SignButton open={signOpen} onToggle={() => setSignOpen((v) => !v)} wave={waveOnMount} compact={compact} />
        <button
          type="submit"
          disabled={!value.trim() || sending}
          aria-label="Kirim pertanyaan"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-brand-800 disabled:bg-[#cfc8bd]"
        >
          {sending ? <LoaderCircle className="size-5 anim-spin" aria-hidden="true" /> : <ArrowUp className="size-5" strokeWidth={2.2} aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}
