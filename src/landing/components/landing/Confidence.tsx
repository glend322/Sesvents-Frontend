import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap';
import { EASE } from '../../animations/tokens';
import { Icon } from '../ui/Icon';

type Tier = {
  range: string;
  value: number;
  title: string;
  desc: string;
  bar: string;
  mock: ReactNode;
};

const TIERS: Tier[] = [
  {
    range: '≥ 85%',
    value: 92,
    title: 'Langsung tampil.',
    desc: 'Teks langsung muncul, lalu dikirim ke chatbot.',
    bar: 'bg-ok',
    mock: (
      <div className="flex items-center justify-between rounded-2xl bg-white p-3.5">
        <span className="text-[15px] font-extrabold tracking-tight">Selamat pagi</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-ok-ink">
          <Icon name="check" className="size-3.5" /> Tampil
        </span>
      </div>
    ),
  },
  {
    range: '60–84%',
    value: 72,
    title: 'Dikonfirmasi dulu.',
    desc: 'Teks baru dikirim setelah pengguna menekan Konfirmasi.',
    bar: 'bg-brand-400',
    mock: (
      <div className="rounded-2xl bg-white p-3.5">
        <span className="text-[10.5px] font-bold text-muted">Kemungkinan maksud · 72%</span>
        <p className="mt-0.5 text-[15px] font-extrabold tracking-tight">“Bingung”</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10.5px] font-bold">
          <span className="flex items-center justify-center gap-1 rounded-lg bg-brand-600 py-2 text-white">
            <Icon name="check" className="size-3" /> Konfirmasi
          </span>
          <span className="flex items-center justify-center rounded-lg border border-line py-2 text-brand-800">Ulangi</span>
          <span className="flex items-center justify-center rounded-lg border border-line py-2 text-brand-800">Ketik</span>
        </div>
      </div>
    ),
  },
  {
    range: '< 60%',
    value: 40,
    title: 'Tidak menebak.',
    desc: 'LUNAR jujur bilang isyarat belum dikenali. Ulangi, atau ketik saja.',
    bar: 'bg-brand-200',
    mock: (
      <div className="rounded-2xl bg-white p-3.5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-brand-800">
          <Icon name="help" className="size-4 text-muted" /> Isyarat belum dikenali
        </p>
        <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-1.5 text-[10.5px] font-bold">
          <span className="js-retry-cta flex items-center justify-center gap-1 rounded-lg bg-brand-900 py-2 text-white">
            <Icon name="retry" className="size-3" /> Ulangi isyarat
          </span>
          <span className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-brand-800">
            <Icon name="keyboard" className="size-3" /> Ketik saja
          </span>
        </div>
      </div>
    ),
  },
];

const VOCAB_GROUPS = [
  { name: 'Sapaan', words: ['Halo', 'Apa kabar', 'Selamat pagi', 'Selamat siang', 'Terima kasih', 'Saya', 'Kamu'] },
  { name: 'Pertanyaan', words: ['Apa', 'Bagaimana', 'Berapa', 'Kapan', 'Cari'] },
  { name: 'Sehari-hari', words: ['Bingung', 'Baik', 'Belajar', 'Ingat', 'Teman', 'Hari', 'Rumah', 'Air', 'Tidur'] },
];

export function Confidence() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.js-tiers', start: 'top 75%', once: true } });
        tl.from('.js-tier', { y: 32, autoAlpha: 0, stagger: 0.12, duration: 0.6, ease: EASE.enter })
          .from('.js-meter', { scaleX: 0, stagger: 0.12, duration: 0.8, ease: EASE.enter }, 0.2)
          .fromTo('.js-retry-cta', { scale: 1 }, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1, ease: EASE.loop }, '-=0.1');
      });
    },
    { scope: root },
  );

  return (
    <section id="keyakinan" ref={root} className="py-14 md:py-26">
      <div className="wrap">
        <div className="max-w-[760px]">
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-brand-600">Akurasi & Keandalan AI</p>
          <h2 className="mt-2.5 text-[clamp(34px,8vw,68px)] font-extrabold leading-[0.96] tracking-[-0.06em]">
            Tidak yakin?
            <br />
            <span className="text-brand-600">Jangan menebak.</span>
          </h2>
          <p className="mt-4 max-w-[500px] text-[14.5px] leading-relaxed text-brand-800 md:text-[15px]">
            Salah paham membuat belajar tersendat. Setiap hasil pengenalan isyarat melewati ambang keyakinan yang ketat,
            dan pengguna selalu bebas beralih ke ketikan.
          </p>
        </div>

        <div className="js-tiers mt-8 grid gap-3 md:mt-12 md:grid-cols-3 md:gap-4">
          {TIERS.map((t) => (
            <article key={t.range} className="js-tier flex flex-col rounded-[24px] border border-brand-100 bg-brand-50 p-4 md:rounded-[26px] md:p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[26px] font-extrabold tracking-[-0.05em] md:text-[30px]">{t.range}</span>
                <span className="text-[11px] font-bold text-muted">keyakinan</span>
              </div>
              <div className="relative mt-2.5 h-2 rounded-full bg-white" aria-hidden="true">
                <span className={`js-meter block h-full origin-left rounded-full ${t.bar}`} style={{ width: `${t.value}%` }} />
                <span className="absolute left-[60%] top-[-3px] h-[14px] w-px bg-brand-200" />
                <span className="absolute left-[85%] top-[-3px] h-[14px] w-px bg-brand-200" />
              </div>
              <h3 className="mt-4 text-[19px] font-extrabold tracking-[-0.035em] md:mt-6 md:text-[22px]">{t.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-800">{t.desc}</p>
              <div className="mt-auto pt-4 md:pt-6" aria-hidden="true">
                {t.mock}
              </div>
            </article>
          ))}
        </div>

        {/* Kosakata BISINDO dilebur menjadi disclosure ringkas: hemat ruang scroll di HP & tetap bisa dicari lewat Find-in-page */}
        <details id="kosakata" className="group mt-5 overflow-hidden rounded-[24px] bg-brand-950 text-white md:mt-6 md:rounded-[26px]">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden md:px-6 md:py-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200">
                <Icon name="hand" className="size-4" />
              </span>
              <div>
                <span className="block text-[15px] font-extrabold tracking-[-0.02em]">Kosakata BISINDO terlatih</span>
                <span className="block text-[12px] text-brand-200">
                  Divalidasi khusus konteks belajar · Halo, Apa, Bagaimana, Belajar, Bingung, dll.
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-brand-100">
              <span className="group-open:hidden">Lihat kosakata</span>
              <span className="hidden group-open:inline">Tutup</span>
              <Icon name="arrowDown" className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </summary>
          <div className="grid gap-3 border-t border-white/10 px-5 pb-5 pt-4 md:grid-cols-3 md:px-6 md:pb-6">
            {VOCAB_GROUPS.map((g) => (
              <div key={g.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[13px] font-extrabold text-brand-200">{g.name}</p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {g.words.map((w) => (
                    <li key={w} className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] font-semibold text-brand-100">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
