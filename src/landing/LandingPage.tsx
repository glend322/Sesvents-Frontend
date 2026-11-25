import { useEffect } from 'react';
import { ScrollTrigger } from './lib/gsap';
import { Nav } from './components/landing/Nav';
import { Hero } from './components/landing/Hero';
import { FeatureStrip } from './components/landing/FeatureStrip';
import { Why } from './components/landing/Why';
import { Chatbot } from './components/landing/Chatbot';
import { HowItWorks } from './components/landing/HowItWorks';
import { Confidence } from './components/landing/Confidence';
import { ForEveryone } from './components/landing/ForEveryone';
import { Closing } from './components/landing/Closing';

/** Landing page publik LUNAR (rute "/"). */
export default function LandingPage() {
  useEffect(() => {
    // Scroll halus hanya di landing (anchor #konten, dsb.); halaman aplikasi tetap scroll biasa.
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) html.style.scrollBehavior = 'smooth';
    // Font memengaruhi tinggi teks → hitung ulang posisi ScrollTrigger setelah font siap.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  return (
    // Latar putih (body aplikasi berwarna tint).
    <div className="min-h-screen bg-white">
      <a
        href="#konten"
        className="sr-only z-[60] rounded-xl bg-brand-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten
      </a>
      <Nav />
      <main id="konten">
        <Hero />
        <FeatureStrip />
        <Why />
        <Chatbot />
        <HowItWorks />
        <Confidence />
        <ForEveryone />
        <Closing />
      </main>
    </div>
  );
}
