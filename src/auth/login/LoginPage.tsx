import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleAlert, Clock, IdCard, Info, LoaderCircle, Lock, Wifi } from 'lucide-react';
import { TigerMascot } from '@/components/mascot/TigerMascot';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { APP } from '@/config/app.config';
import { cn } from '@/lib/utils';
import { AUTH } from '../auth.config';
import { readyAccounts, validateCredentialLengths } from '../auth.service';
import { useAuth } from '../AuthContext';
import { Field } from '../components/Field';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';

/**
 * Halaman masuk siswa (ADR-051 D2, panduan ui/01-login). Satu langkah, dua kolom: NIS + password
 * dari sekolah. Siswa yang sesinya masih valid langsung masuk tanpa melihat layar ini.
 *
 * Layar kecil: banner oranye + maskot di atas, form di "sheet" putih. Desktop: banner jadi panel
 * kiri, form di kanan. Tiga keadaan dari panduan:
 *  A. isi NIS        kolom aktif bergaris hitam tebal; kotak "Akun siap pakai" hanya di build demo
 *  B. salah password pesan ramah + sisa percobaan, kolom password merah
 *  C. terkunci       tombol jadi hitung mundur; error koneksi diletakkan terpisah di bawah
 */
const hintAccounts = readyAccounts;

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export function LoginPage() {
  const { login, isAuthenticated, loading, endedReason, clearEndedReason } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  /** Pesan salah NIS/password (kotak merah muda di atas form). */
  const [message, setMessage] = useState<ReactNode>(null);
  /** Server tak terjangkau (kotak terpisah di bawah). */
  const [netError, setNetError] = useState(false);
  const [fieldError, setFieldError] = useState<{ nis?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockLeft, setLockLeft] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const forgotRef = useRef<HTMLButtonElement>(null);

  const locked = lockLeft > 0;

  useEffect(() => {
    if (isAuthenticated) navigate(from || '/chat', { replace: true });
  }, [isAuthenticated, from, navigate]);

  useEffect(() => {
    if (!lockUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockLeft(left);
      if (left === 0) {
        setLockUntil(null);
        setAttempts(0);
        setMessage(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [lockUntil]);

  const onEdit = (setter: (v: string) => void, key: 'nis' | 'password') => (value: string) => {
    setter(value);
    if (!locked) setMessage(null);
    setNetError(false);
    setFieldError((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    if (endedReason) clearEndedReason();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked || submitting) return;

    const id = nis.trim();
    const pass = password;
    const missing: typeof fieldError = {};
    if (!id) missing.nis = 'Isi NIS-mu dulu, ya.';
    if (!pass.trim()) missing.password = 'Isi password-mu dulu, ya.';
    if (missing.nis || missing.password) {
      setFieldError(missing);
      return;
    }
    const tooLong = validateCredentialLengths(id, pass);
    if (tooLong) {
      setMessage(tooLong);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setNetError(false);
    const result = await login(id, pass);
    setSubmitting(false);

    if (result.ok) {
      navigate(from || '/chat', { replace: true });
      return;
    }

    if (result.reason === 'service-error') {
      setNetError(true);
      return;
    }

    setPassword('');
    const next = attempts + 1;
    setAttempts(next);
    if (next >= AUTH.maxAttempts) {
      setFieldError({});
      setLockUntil(Date.now() + AUTH.lockoutMs);
      return;
    }
    setFieldError({ password: 'Cek lagi huruf besar dan kecil.' });
    setMessage(
      <>
        NIS atau password belum cocok. Sisa <b className="font-bold">{AUTH.maxAttempts - next} kali</b> coba lagi.
      </>,
    );
  };

  // Sesi tersimpan sedang diperiksa / sudah login: jangan tampilkan form sama sekali.
  if (loading || isAuthenticated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-sand" role="status" aria-live="polite">
        <span className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 anim-spin" aria-hidden="true" /> Menyiapkan akunmu…
        </span>
      </div>
    );
  }

  const notice =
    endedReason === 'expired'
      ? 'Sesi sebelumnya berakhir. Masuk lagi, ya.'
      : endedReason === 'logout'
        ? 'Kamu sudah keluar. Sampai jumpa lagi!'
        : null;

  // Banner dipendekkan saat ada pesan, supaya pesan dan form tetap terlihat tanpa menggulir.
  const compact = !!message || locked || !!notice;

  return (
    <div className="flex min-h-dvh flex-col bg-white lg:grid lg:grid-cols-[1fr_1fr]">
      {/* ---------- Banner ---------- */}
      <section
        className={cn(
          'relative isolate overflow-hidden bg-tiger px-6 pt-8 lg:flex lg:flex-col lg:px-14 lg:pb-14 lg:pt-12',
          compact ? 'pb-12' : 'pb-20',
        )}
      >
        <a href={APP.landingUrl} aria-label="LUNAR, ke halaman utama" className="relative z-10 inline-flex rounded-xl">
          <Logo />
        </a>

        <div className="relative z-10 mt-8 max-w-[16rem] sm:max-w-sm lg:mt-auto lg:max-w-md">
          <h1 className="text-[1.625rem] font-black uppercase leading-[1.1] tracking-[0.01em] text-ink lg:text-[2.75rem]">
            {compact ? 'Masuk dulu, yuk' : 'Masuk untuk mulai belajar'}
          </h1>
          {!compact && <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">Pakai NIS dan password dari sekolahmu.</p>}
        </div>

        <TigerMascot
          className={cn(
            'absolute right-1 z-0 h-[10.5rem] w-[9rem] lg:bottom-auto lg:right-14 lg:top-28 lg:h-[19rem] lg:w-[16rem]',
            compact ? '-bottom-20' : '-bottom-10',
          )}
        />
      </section>

      {/* ---------- Form ---------- */}
      <section className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-3xl bg-white px-6 pb-6 pt-7 lg:mt-0 lg:items-center lg:justify-center lg:rounded-none lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-1 flex-col lg:max-w-[26rem] lg:flex-none"
        >
          <div aria-live="polite" role="status">
            {locked ? (
              <Alert tone="cream" icon={<Clock />}>
                Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.
              </Alert>
            ) : message ? (
              <Alert tone="error" icon={<CircleAlert />}>
                {message}
              </Alert>
            ) : notice ? (
              <Alert tone="cream" icon={<Info />}>
                {notice}
              </Alert>
            ) : null}
          </div>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Field
              label="NIS (Nomor Induk Siswa)"
              icon={<IdCard className="size-5" strokeWidth={1.8} />}
              value={nis}
              onChange={(e) => onEdit(setNis, 'nis')(e.target.value)}
              placeholder="Tulis NIS-mu"
              autoComplete="username"
              inputMode="numeric"
              spellCheck={false}
              error={fieldError.nis}
            />
            <Field
              label="Password"
              password
              icon={<Lock className="size-5" strokeWidth={1.8} />}
              value={password}
              onChange={(e) => onEdit(setPassword, 'password')(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              error={fieldError.password}
            />

            <Button type="submit" size="lg" disabled={submitting || locked} className="mt-1 w-full text-base">
              {locked ? (
                <span className="tabular-nums">Coba lagi dalam {mmss(lockLeft)}</span>
              ) : submitting ? (
                <>
                  <LoaderCircle className="anim-spin" aria-hidden="true" /> Memeriksa…
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            {!compact && (
              <button
                ref={forgotRef}
                type="button"
                onClick={() => setForgotOpen(true)}
                className="mx-auto rounded-lg px-2 py-1 text-[0.9375rem] font-semibold text-tiger-ink underline-offset-4 hover:underline"
              >
                Lupa password? Tanya wali kelas
              </button>
            )}
          </form>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            {netError && (
              <Alert tone="error" icon={<Wifi />} role="alert">
                Tidak bisa menghubungi server. Cek internet, lalu coba lagi.
              </Alert>
            )}

            {hintAccounts.length > 0 && !compact && !netError && (
              <div className="rounded-2xl border-[1.5px] border-dashed border-[#d9d1c5] px-4 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Akun siap pakai</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {hintAccounts.map((c) => (
                    <li key={c.nis} className="flex items-center justify-between gap-3">
                      <span className="text-[0.9375rem] font-semibold tabular-nums text-ink">{c.nis}</span>
                      <Button
                        variant="outline-tiger"
                        size="sm"
                        className="h-10 px-5 text-sm"
                        onClick={() => {
                          setNis(c.nis);
                          setPassword(c.password);
                          setMessage(null);
                          setNetError(false);
                          setFieldError({});
                        }}
                      >
                        Pakai
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <ForgotPasswordDialog
        open={forgotOpen}
        onClose={() => {
          setForgotOpen(false);
          forgotRef.current?.focus();
        }}
      />
    </div>
  );
}

function Alert({
  tone,
  icon,
  children,
  role,
}: {
  tone: 'error' | 'cream';
  icon: ReactNode;
  children: ReactNode;
  role?: 'alert';
}) {
  return (
    <motion.p
      role={role}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mb-5 flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[0.9375rem] leading-snug [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0',
        tone === 'error' ? 'bg-rec-soft text-[#9b2a23]' : 'bg-cream text-ink',
        role === 'alert' && 'mb-0',
      )}
    >
      <span aria-hidden="true" className="contents">
        {icon}
      </span>
      <span>{children}</span>
    </motion.p>
  );
}
