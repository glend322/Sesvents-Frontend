import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap';
import { EASE } from '../../animations/tokens';
import { Icon, type IconName } from '../ui/Icon';

type Step = { icon: IconName; title: string; desc: string };

const STEPS: Step[] = [
  {
    icon: 'book',
    title: 'Pilih video atau unggah PDF',
    desc: 'Buka materi pelajaran berisyarat BISINDO, atau unggah dokumen PDF sendiri untuk dipelajari.',
  },
  {
    icon: 'hand',
    title: 'Tanya lewat ketikan atau isyarat',
    desc: 'Bingung di bagian tertentu? Ketik pertanyaanmu atau peragakan isyarat langsung ke kamera.',
  },
  {
    icon: 'sparkles',
    title: 'Pahami lewat teks & animasi BISINDO',
    desc: 'Jawaban tampil rapi sebagai teks bernomor, bisa disederhanakan satu klik, dan diperagakan ulang dalam isyarat.',
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('.js-step', {
          y: 24,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.55,
          ease: EASE.enter,
          scrollTrigger: { trigger: '.js-steps', start: 'top 78%', once: true },
        });
        gsap.fromTo(
          '.js-line-x',
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.js-steps', start: 'top 75%', end: 'bottom 45%', scrub: 0.5 } },
        );
        gsap.fromTo(
          '.js-line-y',
          { scaleY: 0 },
          { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.js-steps', start: 'top 70%', end: 'bottom 55%', scrub: 0.5 } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section id="cara-kerja" ref={root} className="bg-tint py-14 md:py-24">
      <div className="wrap">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-brand-600">Cara Kerja</p>
            <h2 className="mt-2.5 text-[clamp(34px,7vw,58px)] font-extrabold leading-[0.98] tracking-[-0.055em]">
              Tiga langkah sederhana
              <br />
              <span className="text-brand-600">untuk mulai paham.</span>
            </h2>
          </div>
          <p className="max-w-[340px] text-[14px] leading-relaxed text-brand-800">
            Setiap tahap memberi umpan balik visual yang jelas—warna, ikon, dan teks—tanpa mengandalkan suara.
          </p>
        </div>

        <ol className="js-steps relative mt-10 grid gap-6 md:mt-14 md:grid-cols-3 md:gap-8">
          <span aria-hidden="true" className="absolute bottom-6 left-[25px] top-6 w-px bg-brand-100 md:hidden">
            <span className="js-line-y block h-full w-full origin-top bg-brand-600" />
          </span>
          <span aria-hidden="true" className="absolute left-7 right-7 top-[25px] hidden h-px bg-brand-100 md:block">
            <span className="js-line-x block h-full w-full origin-left bg-brand-600" />
          </span>

          {STEPS.map((s, i) => (
            <li key={s.title} className="js-step relative flex gap-4 md:flex-col md:gap-4">
              <span className="relative grid size-[52px] shrink-0 place-items-center rounded-2xl border border-brand-100 bg-white text-brand-600">
                <Icon name={s.icon} className="size-5" />
              </span>
              <div>
                <span className="text-[11px] font-extrabold text-brand-400">0{i + 1}</span>
                <h3 className="mt-0.5 text-[18px] font-extrabold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
