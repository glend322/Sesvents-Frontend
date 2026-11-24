import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap';
import { EASE } from '../../animations/tokens';
import { Icon, type IconName } from '../ui/Icon';
import { LOGIN_URL, isValidAppUrl } from '../../config/links';

const STEPS: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'sparkles',
    title: 'Daftar mandiri dalam hitungan detik',
    desc: 'Cukup buat akun dengan nama, email, nomor telepon, dan password.',
  },
  {
    icon: 'globe',
    title: 'Untuk teman Tuli & semua kalangan',
    desc: 'Cocok untuk pelajar yang ingin memahami materi pelajaran maupun siapa saja yang ingin belajar dengan dukungan bahasa isyarat BISINDO.',
  },
  {
    icon: 'lock',
    title: 'Ruang belajar pribadi yang aman',
    desc: 'Riwayat percakapan, materi PDF yang diunggah, dan progres video tersimpan di akunmu sendiri. Rekaman kamera tidak pernah disimpan.',
  },
];

export function ForEveryone() {
  const root = useRef<HTMLElement>(null);
  const loginOk = isValidAppUrl(LOGIN_URL);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true } });
        tl.from('.js-public-step', { y: 24, autoAlpha: 0, stagger: 0.12, duration: 0.55, ease: EASE.enter })
          .from('.js-public-card', { y: 30, rotation: 2, autoAlpha: 0, duration: 0.7, ease: EASE.enter }, 0.15)
          .from('.js-public-field', { x: -10, autoAlpha: 0, stagger: 0.1, duration: 0.4, ease: EASE.enter }, 0.5);
      });
    },
    { scope: root },
  );

  return (
    <section id="untuk-semua" ref={root} className="py-20 md:py-28">
      <div className="wrap">
        <div className="grid gap-10 overflow-hidden rounded-[32px] bg-brand-50 p-6 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-14 md:rounded-[40px] md:p-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-brand-600">
              <Icon name="users" className="size-3.5" />
              Terbuka untuk Semua
            </p>
            <h2 className="mt-4 text-[clamp(34px,6.4vw,58px)] font-extrabold leading-[0.98] tracking-[-0.055em]">
              Siapa pun bisa menggunakan,
              <br />
              <span className="text-brand-600">langsung mulai belajar.</span>
            </h2>
            <ol className="mt-8 grid gap-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="js-public-step flex gap-4">
                  <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-600">
                    <Icon name={s.icon} className="size-5" />
                    <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] font-extrabold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <h3 className="text-[16px] font-extrabold tracking-[-0.02em]">{s.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-brand-800">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Mock kartu masuk/daftar (dekoratif) + tautan masuk sungguhan di bawahnya */}
          <div>
            <div aria-hidden="true" className="js-public-card rounded-[26px] bg-white p-6 shadow-soft">
              <span className="text-[18px] font-extrabold tracking-[-0.03em]">Mulai Belajar</span>
              <span className="mt-1 block text-[12px] text-muted">Buat akun gratis atau masuk kapan saja.</span>
              <span className="js-public-field mt-5 block">
                <span className="text-[11px] font-bold text-brand-800">Email</span>
                <span className="mt-1 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[13px] font-semibold">
                  <Icon name="mail" className="size-4 shrink-0 text-brand-400" />
                  <span className="truncate">nadia.putri@gmail.com</span>
                </span>
              </span>
              <span className="js-public-field mt-3 block">
                <span className="text-[11px] font-bold text-brand-800">Password</span>
                <span className="mt-1 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[13px] tracking-[0.3em]">
                  <Icon name="lock" className="size-4 shrink-0 text-brand-400" /> ••••••••
                </span>
              </span>
              <span className="js-public-field mt-5 flex items-center justify-center rounded-xl bg-brand-600 py-3 text-[13px] font-bold text-white">
                Masuk / Daftar
              </span>
            </div>
            {loginOk && (
              <a
                href={LOGIN_URL}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-white px-5 py-3 text-[14px] font-bold text-brand-800 transition hover:bg-brand-100"
              >
                Buat akun atau masuk sekarang
                <Icon name="arrowRight" className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
