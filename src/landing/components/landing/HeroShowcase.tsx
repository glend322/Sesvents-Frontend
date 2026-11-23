import { useEffect, useRef, useState } from 'react';
import { TigerMascot } from '@/components/mascot/TigerMascot';
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '../../lib/gsap';
import { EASE, TABLET } from '../../animations/tokens';
import { HandSkeleton } from '../ui/HandSkeleton';
import { Icon, type IconName } from '../ui/Icon';
import { LogoMark } from '../ui/Logo';

type ModeId = 'isyarat' | 'video' | 'pdf';

const MODES: {
  id: ModeId;
  label: string;
  icon: IconName;
  badgeText: string;
  badgeDot: string;
}[] = [
  {
    id: 'isyarat',
    label: 'Isyarat',
    icon: 'hand',
    badgeText: 'Tangan terbaca · 94%',
    badgeDot: 'bg-ok',
  },
  {
    id: 'video',
    label: 'Video',
    icon: 'play',
    badgeText: 'Tanya di 00:45 · Kondensasi',
    badgeDot: 'bg-brand-400',
  },
  {
    id: 'pdf',
    label: 'Materi PDF',
    icon: 'fileText',
    badgeText: 'Materi_IPA.pdf · Siap ditanya',
    badgeDot: 'bg-brand-600',
  },
];

const VIDEO_CAPTION = ['Uap', 'air', 'mendingin', 'menjadi', 'awan', 'di', 'langit.'] as const;
const AUTO_SWITCH_MS = 5800;

/**
 * Showcase interaktif di Hero (gabungan Demo 3-in-1 + Kartu Berlapis & Maskot Harimau LUNAR).
 * Pengunjung bisa klik 3 mode (Isyarat, Video, Materi PDF) atau membiarkannya berganti pelan.
 * Animasi loop di-pause saat keluar viewport dan menghormati prefers-reduced-motion.
 */
export function HeroShowcase() {
  const root = useRef<HTMLDivElement>(null);
  const [modeIdx, setModeIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [captionWord, setCaptionWord] = useState(4);

  const activeMode = MODES[modeIdx];

  // Auto-cycle antar 3 mode saat di viewport dan tidak sedang disentuh/hover.
  useEffect(() => {
    if (paused || !inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setModeIdx((i) => (i + 1) % MODES.length);
    }, AUTO_SWITCH_MS);
    return () => window.clearInterval(id);
  }, [paused, inView, modeIdx]);

  // Sorot kata aktif di caption saat mode Video aktif.
  useEffect(() => {
    if (activeMode.id !== 'video' || !inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setCaptionWord((w) => (w + 1) % VIDEO_CAPTION.length);
    }, 650);
    return () => window.clearInterval(id);
  }, [activeMode.id, inView]);

  // Animasi ambient float & deteksi viewport.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const loops: gsap.core.Animation[] = [
          gsap.to(q('.js-float-card'), {
            y: -7,
            duration: TABLET.floatHalf,
            yoyo: true,
            repeat: -1,
            ease: EASE.loop,
            stagger: 0.45,
            paused: true,
          }),
        ];

        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            setInView(self.isActive);
            loops.forEach((a) => (self.isActive ? a.play() : a.pause()));
          },
        });
        if (st.isActive) loops.forEach((a) => a.play());
      });
    },
    { scope: root },
  );

  // Animasi gerak tangan isyarat + transisi masuk konten setiap kali tab berubah.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          q('.js-stage-panel'),
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, ease: EASE.enter },
        );
        gsap.to(q('.js-hand-l'), {
          x: 5,
          y: -8,
          rotation: -9,
          duration: TABLET.signHalf,
          yoyo: true,
          repeat: -1,
          ease: EASE.loop,
        });
        gsap.to(q('.js-hand-r'), {
          x: -5,
          y: 6,
          rotation: 8,
          duration: TABLET.signHalf * 0.88,
          yoyo: true,
          repeat: -1,
          ease: EASE.loop,
        });
      });
    },
    { scope: root, dependencies: [activeMode.id] },
  );

  return (
    <div
      ref={root}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative mx-auto w-full max-w-[610px] pb-4 pt-6 sm:px-3 sm:pb-6 sm:pt-8"
    >
      {/* Kartu melayang kiri-atas: status kontekstual fitur aktif */}
      <div
        aria-hidden="true"
        className="js-float-card pointer-events-none absolute left-0 top-0 z-20 hidden items-center gap-2 rounded-2xl border border-brand-100 bg-white/95 px-3.5 py-2 text-[11.5px] font-bold text-brand-900 shadow-soft backdrop-blur sm:flex"
      >
        <span className={`size-2 rounded-full ${activeMode.badgeDot}`} />
        <span>{activeMode.badgeText}</span>
      </div>

      {/* Jendela aplikasi utama */}
      <div className="relative rounded-[28px] border border-brand-100/90 bg-white p-2 shadow-phone sm:rounded-[32px] sm:p-2.5">
        <div className="overflow-hidden rounded-[22px] border border-line/80 bg-sand sm:rounded-[24px]">
          {/* Header aplikasi + 3 tab interaktif */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-3 py-2.5 sm:px-4">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.12em] text-brand-900">
              <LogoMark className="size-5 sm:size-6" />
              LUNAR
            </span>

            <div
              role="tablist"
              aria-label="Pilih pratinjau fitur LUNAR"
              className="flex items-center gap-1 rounded-full bg-sand p-1"
            >
              {MODES.map((m, i) => {
                const on = i === modeIdx;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    id={`hero-tab-${m.id}`}
                    aria-selected={on}
                    aria-controls={`hero-panel-${m.id}`}
                    onClick={() => setModeIdx(i)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors sm:px-3 sm:text-[11.5px] ${
                      on
                        ? 'bg-brand-600 text-white shadow-[0_4px_12px_rgba(184,80,15,0.28)]'
                        : 'text-brand-800 hover:bg-white/80 hover:text-brand-900'
                    }`}
                  >
                    <Icon
                      name={m.icon}
                      className="size-3.5"
                      fill={m.icon === 'play' && on ? 'currentColor' : 'none'}
                    />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panggung visual (tinggi stabil agar tidak melompat saat pindah tab) */}
          <div
            role="tabpanel"
            id={`hero-panel-${activeMode.id}`}
            aria-labelledby={`hero-tab-${activeMode.id}`}
            className="min-h-[312px] p-3 sm:min-h-[326px] sm:p-4"
          >
            {activeMode.id === 'isyarat' && <SignModePanel />}
            {activeMode.id === 'video' && <VideoModePanel activeWord={captionWord} />}
            {activeMode.id === 'pdf' && <PdfModePanel />}
          </div>
        </div>
      </div>

      {/* Kartu melayang kiri-bawah: ringkasan format output ramah Tuli */}
      <div
        aria-hidden="true"
        className="js-float-card pointer-events-none absolute -bottom-1 left-2 z-20 hidden items-center gap-1.5 rounded-2xl border border-line bg-white/95 px-3 py-2 text-[11px] font-bold text-brand-800 shadow-soft backdrop-blur sm:flex"
      >
        <span className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-brand-600">
          <Icon name="hand" className="size-3" /> Isyarat
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-sand px-2 py-1">
          <Icon name="captions" className="size-3" /> Teks
        </span>
      </div>

      {/* Maskot Harimau LUNAR interaktif (ikut kursor, melambai, bereaksi saat diklik) */}
      <div className="absolute -bottom-5 right-0 z-20 hidden sm:block md:-right-5">
        <TigerMascot
          mood={activeMode.id === 'pdf' ? 'thinking' : 'idle'}
          className="h-[7.25rem] w-[6.25rem] drop-shadow-[0_12px_18px_rgba(31,27,22,0.16)] lg:h-[8.25rem] lg:w-[7rem]"
        />
      </div>
    </div>
  );
}

/** Mode 1: Kamera membaca isyarat BISINDO → jawaban AI dalam teks sederhana & isyarat. */
function SignModePanel() {
  return (
    <div className="js-stage-panel grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
      {/* Viewfinder kamera + 21 landmark tangan */}
      <div className="relative flex min-h-[268px] flex-col justify-between overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-100 via-brand-50 to-white p-3">
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand-900">
            <span className="anim-rec size-1.5 rounded-full bg-rec" />
            Kamera BISINDO
          </span>
          <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-extrabold text-ok-ink">94%</span>
        </div>

        {/* Bingkai kunci */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-4 text-brand-400/75">
          <span className="absolute left-0 top-6 size-4 rounded-tl-lg border-l-2 border-t-2 border-current" />
          <span className="absolute right-0 top-6 size-4 rounded-tr-lg border-r-2 border-t-2 border-current" />
          <span className="absolute bottom-11 left-0 size-4 rounded-bl-lg border-b-2 border-l-2 border-current" />
          <span className="absolute bottom-11 right-0 size-4 rounded-br-lg border-b-2 border-r-2 border-current" />
        </div>

        {/* Siluet + tangan landmark bergerak */}
        <div aria-hidden="true" className="relative my-auto h-[156px]">
          <svg viewBox="0 0 200 170" className="absolute inset-x-0 bottom-0 h-full w-full">
            <circle cx="100" cy="52" r="24" className="fill-brand-200/80" />
            <path d="M36 170c0-46 28-68 64-68s64 22 64 68Z" className="fill-brand-200/55" />
          </svg>
          <div className="js-hand-l absolute bottom-[10%] left-[12%] w-[34%] text-brand-600">
            <HandSkeleton className="w-full" />
          </div>
          <div className="js-hand-r absolute bottom-[16%] right-[12%] w-[31%] text-brand-600">
            <HandSkeleton className="w-full" mirrored />
          </div>
        </div>

        {/* Kata yang dikenali */}
        <div className="relative z-10 flex items-center justify-between rounded-xl bg-brand-900/90 px-3 py-2 text-white">
          <span className="text-[11px] font-extrabold">“Belajar”</span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-200">
            <Icon name="check" className="size-3 text-ok" strokeWidth={2.8} /> Terbaca
          </span>
        </div>
      </div>

      {/* Jawaban AI langsung di sampingnya */}
      <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-line bg-white p-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span className="text-[11.5px] font-extrabold text-brand-900">Tanya LUNAR</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-ok-ink">
            <span className="size-1.5 rounded-full bg-ok" /> Siap
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2.5">
          {/* Pertanyaan dari isyarat */}
          <div className="flex flex-col items-end self-end">
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[9.5px] font-bold text-brand-600">
              <Icon name="hand" className="size-2.5" /> via isyarat
            </span>
            <span className="rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-[12px] font-bold text-white">
              Belajar siklus air
            </span>
          </div>

          {/* Balasan teks sederhana + animasi isyarat */}
          <div className="flex gap-2.5 rounded-2xl rounded-tl-sm bg-sand p-2.5">
            <span
              aria-hidden="true"
              className="relative h-[74px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-brand-100 to-brand-50"
            >
              <svg viewBox="0 0 64 76" className="absolute inset-0 size-full">
                <circle cx="32" cy="24" r="11" className="fill-brand-200" />
                <path d="M10 76c0-22 10-33 22-33s22 11 22 33Z" className="fill-brand-600" />
              </svg>
              <span className="js-hand-l absolute bottom-1 left-1 w-[38%] text-brand-900">
                <HandSkeleton className="w-full" dotClassName="fill-brand-50" />
              </span>
              <span className="js-hand-r absolute bottom-1.5 right-1 w-[34%] text-brand-900">
                <HandSkeleton className="w-full" mirrored dotClassName="fill-brand-50" />
              </span>
            </span>
            <div className="min-w-0 text-[11.5px] leading-snug text-brand-900">
              <p className="font-semibold">
                Air menguap jadi awan, lalu turun sebagai hujan dan meresap ke tanah.
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-brand-600">
                <Icon name="play" className="size-2.5" fill="currentColor" /> Putar ulang isyarat
              </span>
            </div>
          </div>
        </div>

        {/* Kolom input mini */}
        <div className="flex items-center justify-between rounded-xl border border-line bg-sand/60 px-3 py-1.5 text-[11px] text-muted">
          <span>Ketik atau pakai isyarat…</span>
          <span className="grid size-6 place-items-center rounded-lg bg-brand-600 text-white">
            <Icon name="send" className="size-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Mode 2: Video pelajaran bercaption (kata aktif tersorot) + tanya tepat di menitnya. */
function VideoModePanel({ activeWord }: { activeWord: number }) {
  return (
    <div className="js-stage-panel grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
      {/* Pemutar video gaya gelap seperti VideoWatchPage */}
      <div className="relative flex min-h-[268px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-3 text-white">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">IPA · Siklus Air</span>
          <span className="rounded-full bg-tiger px-2 py-0.5 text-[9.5px] font-extrabold text-ink">BISINDO</span>
        </div>

        {/* Area peraga isyarat di dalam video */}
        <div aria-hidden="true" className="relative my-2 h-[126px]">
          <svg viewBox="0 0 220 130" className="absolute inset-x-0 bottom-0 h-full w-full">
            <circle cx="110" cy="40" r="20" className="fill-white/15" />
            <path d="M56 130c0-34 24-52 54-52s54 18 54 52Z" className="fill-brand-400/35" />
          </svg>
          <div className="js-hand-l absolute bottom-[6%] left-[22%] w-[22%] text-brand-200">
            <HandSkeleton className="w-full" dotClassName="fill-brand-950" />
          </div>
          <div className="js-hand-r absolute bottom-[10%] right-[22%] w-[20%] text-brand-200">
            <HandSkeleton className="w-full" mirrored dotClassName="fill-brand-950" />
          </div>
        </div>

        {/* Caption gaya YouTube dengan sorotan kata aktif */}
        <div className="space-y-2">
          <p className="rounded-xl bg-black/75 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-relaxed">
            {VIDEO_CAPTION.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className={`mx-[2px] inline-block rounded px-1 transition-colors ${
                  i === activeWord ? 'bg-sun font-extrabold text-ink' : 'text-white/90'
                }`}
              >
                {word}
              </span>
            ))}
          </p>

          {/* Progress bar bab + penanda kuning di menit yang ditanyakan */}
          <div className="relative flex h-1.5 items-center gap-1">
            <span className="h-full flex-1 overflow-hidden rounded-full bg-white/25">
              <span className="block h-full w-full bg-tiger" />
            </span>
            <span className="h-full flex-1 overflow-hidden rounded-full bg-white/25">
              <span className="block h-full w-[55%] bg-tiger" />
            </span>
            <span className="h-full flex-1 rounded-full bg-white/25" />
            <span
              aria-hidden="true"
              className="absolute left-[48%] top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sun ring-2 ring-brand-950"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-white/75">
            <span className="tabular-nums">00:45 / 02:10</span>
            <span>Bab 2 · Kondensasi</span>
          </div>
        </div>
      </div>

      {/* Chat samping yang terkunci pada detik video */}
      <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-line bg-white p-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[10px] font-extrabold text-tiger-ink">
            <Icon name="play" className="size-2.5" fill="currentColor" />
            00:45 · Kondensasi
          </span>

          <div className="mt-2.5 flex flex-col gap-2">
            <div className="self-end rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-[11.5px] font-bold text-white">
              Kenapa uap bisa jadi awan?
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-sand p-2.5 text-[11.5px] leading-snug text-brand-900">
              Karena udara di langit dingin, uap air berkumpul jadi titik air kecil dan membentuk awan.
            </div>
          </div>
        </div>

        <p className="rounded-xl bg-brand-50 px-2.5 py-1.5 text-[10px] font-semibold text-brand-800">
          Waktu video otomatis terlampir saat kamu bertanya.
        </p>
      </div>
    </div>
  );
}

/** Mode 3: Unggah materi PDF → ringkasan singkat + peragaan isyarat. */
function PdfModePanel() {
  return (
    <div className="js-stage-panel flex min-h-[268px] flex-col justify-between gap-3">
      {/* Kartu file PDF yang diunggah */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-cream/70 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-[10px] font-extrabold text-white">
            PDF
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-extrabold text-brand-900">Ringkasan_Siklus_Air.pdf</p>
            <p className="text-[10.5px] font-semibold text-brand-800">4 halaman · Teks terbaca</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-ok-ink">
          <Icon name="check" className="size-3" strokeWidth={2.6} /> Siap
        </span>
      </div>

      {/* Pertanyaan + jawaban ringkas & isyarat */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 rounded-2xl border border-line bg-white p-3">
        <div className="self-end rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2 text-[12px] font-bold text-white">
          Jelaskan isi halaman 2 dengan kalimat singkat
        </div>

        <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm bg-sand p-3">
          <span
            aria-hidden="true"
            className="relative h-[86px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-brand-100 to-brand-50"
          >
            <svg viewBox="0 0 72 86" className="absolute inset-0 size-full">
              <circle cx="36" cy="28" r="12" className="fill-brand-200" />
              <path d="M12 86c0-24 11-36 24-36s24 12 24 36Z" className="fill-brand-600" />
            </svg>
            <span className="js-hand-l absolute bottom-1 left-1 w-[38%] text-brand-900">
              <HandSkeleton className="w-full" dotClassName="fill-brand-50" />
            </span>
            <span className="js-hand-r absolute bottom-1.5 right-1 w-[34%] text-brand-900">
              <HandSkeleton className="w-full" mirrored dotClassName="fill-brand-50" />
            </span>
            <span className="absolute inset-x-1 top-1 rounded bg-white/90 py-0.5 text-center text-[7px] font-extrabold text-brand-800">
              BISINDO
            </span>
          </span>

          <ol className="grid gap-1.5 text-[11.5px] leading-snug text-brand-900">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-600 text-[9px] font-extrabold text-white">
                1
              </span>
              <span>Panas matahari membuat air laut menguap ke udara.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-600 text-[9px] font-extrabold text-white">
                2
              </span>
              <span>Uap air naik, mendingin, lalu berubah menjadi awan.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
