import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Logo } from '../ui/Logo';
import { Icon } from '../ui/Icon';
import { APP_URL, LOGIN_URL, REGISTER_URL, isValidAppUrl } from '../../config/links';

const LINKS = [
  { href: '#top', label: 'Beranda' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#chatbot', label: 'Chatbot' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#keyakinan', label: 'Akurasi AI' },
];

export function Nav() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="fixed left-1/2 top-3 z-50 w-[min(1160px,calc(100%-24px))] -translate-x-1/2">
      <div className="flex h-14 items-center justify-between rounded-2xl border border-line/90 bg-white/85 pl-4 pr-2 backdrop-blur-xl">
        <a href="#top" aria-label="LUNAR, kembali ke atas" className="flex items-center">
          <Logo />
        </a>
        <nav aria-label="Navigasi utama" className="hidden gap-6 text-[13px] font-semibold text-brand-600 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-brand-900">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated ? (
            <Link
              to={APP_URL}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-[12.5px] font-bold text-white shadow-[0_8px_20px_rgba(184,80,15,0.22)] transition-colors hover:bg-brand-800 sm:min-h-11 sm:px-5"
            >
              Buka Aplikasi
              <Icon name="arrowRight" className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to={REGISTER_URL}
                className="inline-flex min-h-10 items-center rounded-full px-3.5 py-2 text-[12.5px] font-bold text-brand-800 transition-colors hover:bg-brand-50 sm:min-h-11 sm:px-4"
              >
                Daftar
              </Link>
              <Link
                to={LOGIN_URL}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-[12.5px] font-bold text-white shadow-[0_8px_20px_rgba(184,80,15,0.22)] transition-colors hover:bg-brand-800 sm:min-h-11 sm:px-5"
              >
                Masuk
              </Link>
            </>
          )}
        </div>
      </div>
      <div role="status" aria-live="polite">
        {!isValidAppUrl(LOGIN_URL) && (
          <p className="mt-2 rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] font-semibold text-brand-900">
            Tujuan halaman masuk belum tersedia. Hubungi admin atau periksa pengaturan VITE_LOGIN_URL.
          </p>
        )}
      </div>
    </header>
  );
}
