import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleAlert, Clock, Hash, Info, LoaderCircle, Lock, Mail, User, Wifi } from 'lucide-react';
import { TigerMascot } from '@/components/mascot/TigerMascot';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { APP } from '@/config/app.config';
import { cn } from '@/lib/utils';
import { AUTH } from '../auth.config';
import { isValidEmail, readyAccounts, validateCredentialLengths } from '../auth.service';
import { useAuth } from '../AuthContext';
import { Field } from '../components/Field';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';

type AuthMode = 'login' | 'register' | 'onboarding';

const hintAccounts = readyAccounts;
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const GRADES = [4, 5, 6] as const;

export function LoginPage() {
  const { login, register, updateProfile, profile, isAuthenticated, loading, endedReason, clearEndedReason } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState<number>(5);
  const [classCode, setClassCode] = useState('');
  const [message, setMessage] = useState<ReactNode>(null);
  const [netError, setNetError] = useState(false);
  const [fieldError, setFieldError] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockLeft, setLockLeft] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const forgotRef = useRef<HTMLButtonElement>(null);

  const locked = lockLeft > 0;

  useEffect(() => {
    // Jangan redirect otomatis jika baru selesai daftar dan sedang di Langkah 2 (onboarding).
    if (isAuthenticated && mode !== 'onboarding') {
      navigate(from || '/chat', { replace: true });
    }
  }, [isAuthenticated, mode, from, navigate]);

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

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setMessage(null);
    setNetError(false);
    setFieldError({});
    if (endedReason) clearEndedReason();
  };

  const onEdit = (setter: (v: string) => void, key: 'fullName' | 'email' | 'password') => (value: string) => {
    setter(value);
    if (!locked) setMessage(null);
    setNetError(false);
    setFieldError((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    if (endedReason) clearEndedReason();
  };

  const onSubmitLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (locked || submitting) return;

    const cleanEmail = email.trim().toLowerCase();
    const pass = password;
    const missing: typeof fieldError = {};
    if (!cleanEmail) missing.email = 'Isi email-mu dulu, ya.';
    else if (!isValidEmail(cleanEmail)) missing.email = 'Format email belum benar (contoh: nama@gmail.com).';
    if (!pass.trim()) missing.password = 'Isi password-mu dulu, ya.';
    if (missing.email || missing.password) {
      setFieldError(missing);
      return;
    }
    const tooLong = validateCredentialLengths(cleanEmail, pass);
    if (tooLong) {
      setMessage(tooLong);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setNetError(false);
    const result = await login(cleanEmail, pass);
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
    setFieldError({ password: 'Cek lagi email dan huruf besar/kecil password.' });
    setMessage(
      <>
        Email atau password belum cocok. Sisa <b className="font-bold">{AUTH.maxAttempts - next} kali</b> coba lagi.
      </>,
    );
  };

  const onSubmitRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const pass = password;
    const missing: typeof fieldError = {};
    if (!cleanName) missing.fullName = 'Isi nama panggilanmu dulu, ya.';
    if (!cleanEmail) missing.email = 'Isi email-mu dulu, ya.';
    else if (!isValidEmail(cleanEmail)) missing.email = 'Format email belum benar (contoh: nama@gmail.com).';
    if (pass.length < AUTH.minPasswordLength) {
      missing.password = `Password minimal ${AUTH.minPasswordLength} huruf atau angka.`;
    }
    if (missing.fullName || missing.email || missing.password) {
      setFieldError(missing);
      return;
    }
    const tooLong = validateCredentialLengths(cleanEmail, pass);
    if (tooLong) {
      setMessage(tooLong);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setNetError(false);
    const result = await register(cleanName, cleanEmail, pass);
    setSubmitting(false);

    if (result.ok) {
      setMode('onboarding');
      return;
    }
    if (result.reason === 'email-exists') {
      setFieldError({ email: 'Email ini sudah terdaftar. Coba masuk saja, ya.' });
      return;
    }
    if (result.reason === 'validation-error') {
      setMessage('Password terlalu lemah atau data belum valid. Coba kombinasikan huruf dan angka.');
      return;
    }
    setNetError(true);
  };

  const onFinishOnboarding = async (skipCode: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    setNetError(false);
    const ok = await updateProfile({
      grade,
      classCode: skipCode ? null : classCode.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      navigate(from || '/chat', { replace: true });
    } else {
      // Tetap izinkan masuk agar onboarding tidak memblokir siswa belajar.
      navigate(from || '/chat', { replace: true });
    }
  };

  if (loading || (isAuthenticated && mode !== 'onboarding')) {
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

  const compact = !!message || locked || !!notice;
  const firstName = (profile?.name || fullName || 'Teman').trim().split(/\s+/)[0];

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
            {mode === 'register'
              ? 'Buat akun, yuk'
              : mode === 'onboarding'
                ? `Sedikit lagi, ${firstName}!`
                : compact
                  ? 'Masuk dulu, yuk'
                  : 'Masuk untuk mulai belajar'}
          </h1>
          {!compact && (
            <p className="mt-3 text-base leading-relaxed text-ink lg:text-lg">
              {mode === 'register'
                ? 'Daftar pakai email supaya bisa langsung belajar di LUNAR.'
                : mode === 'onboarding'
                  ? 'Biar materinya pas buat kamu.'
                  : 'Pakai email dan password akun LUNAR kamu.'}
            </p>
          )}
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
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-1 flex-col lg:max-w-[26rem] lg:flex-none"
        >
          <div aria-live="polite" role="status">
            {locked && mode === 'login' ? (
              <Alert tone="cream" icon={<Clock />}>
                Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.
              </Alert>
            ) : message ? (
              <Alert tone="error" icon={<CircleAlert />}>
                {message}
              </Alert>
            ) : notice && mode === 'login' ? (
              <Alert tone="cream" icon={<Info />}>
                {notice}
              </Alert>
            ) : null}
          </div>

          {mode === 'login' && (
            <form onSubmit={onSubmitLogin} noValidate className="flex flex-col gap-5">
              <Field
                label="Email"
                icon={<Mail className="size-5" strokeWidth={1.8} />}
                value={email}
                onChange={(e) => onEdit(setEmail, 'email')(e.target.value)}
                placeholder="nadia.putri@gmail.com"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                error={fieldError.email}
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

              <div className="flex flex-col items-center gap-1.5 pt-1 text-[0.9375rem]">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="rounded-lg px-2 py-1 font-semibold text-tiger-ink underline-offset-4 hover:underline"
                >
                  Belum punya akun? Daftar
                </button>
                <button
                  ref={forgotRef}
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="rounded-lg px-2 py-0.5 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Lupa password?
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={onSubmitRegister} noValidate className="flex flex-col gap-4">
              <Field
                label="Nama panggilan"
                icon={<User className="size-5" strokeWidth={1.8} />}
                value={fullName}
                onChange={(e) => onEdit(setFullName, 'fullName')(e.target.value)}
                placeholder="Nadia"
                autoComplete="name"
                error={fieldError.fullName}
              />
              <Field
                label="Email"
                icon={<Mail className="size-5" strokeWidth={1.8} />}
                value={email}
                onChange={(e) => onEdit(setEmail, 'email')(e.target.value)}
                placeholder="nadia.putri@gmail.com"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                error={fieldError.email}
              />
              <Field
                label="Password"
                password
                icon={<Lock className="size-5" strokeWidth={1.8} />}
                value={password}
                onChange={(e) => onEdit(setPassword, 'password')(e.target.value)}
                placeholder="Minimal 8 huruf atau angka"
                autoComplete="new-password"
                error={fieldError.password}
              />

              <p className="rounded-2xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink">
                Untuk anak di bawah 13 tahun, minta <b>orang tua atau guru</b> membantu membuat akun.
              </p>

              <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full text-base">
                {submitting ? (
                  <>
                    <LoaderCircle className="anim-spin" aria-hidden="true" /> Mendaftarkan…
                  </>
                ) : (
                  'Daftar'
                )}
              </Button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mx-auto rounded-lg px-2 py-1 text-[0.9375rem] font-semibold text-tiger-ink underline-offset-4 hover:underline"
              >
                Sudah punya akun? Masuk
              </button>
            </form>
          )}

          {mode === 'onboarding' && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-tiger-ink">Langkah 2 dari 2</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-tiger" />
              </div>

              <div>
                <p className="mb-2.5 text-[0.9375rem] font-semibold text-ink">Kamu kelas berapa?</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={cn(
                        'h-12 rounded-xl border-[1.5px] text-sm font-bold transition-colors',
                        grade === g ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink/40',
                      )}
                    >
                      SD {g}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Kode kelas dari sekolah (opsional)"
                icon={<Hash className="size-5" strokeWidth={1.8} />}
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Contoh: LNR-5A21"
                spellCheck={false}
              />

              <p className="rounded-2xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
                Punya kode dari guru? Isi supaya gurumu bisa melihat progres belajarmu. Tidak punya? Lewati saja.
              </p>

              <Button
                type="button"
                size="lg"
                disabled={submitting}
                onClick={() => void onFinishOnboarding(false)}
                className="w-full text-base"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="anim-spin" aria-hidden="true" /> Menyimpan…
                  </>
                ) : (
                  'Mulai belajar'
                )}
              </Button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void onFinishOnboarding(true)}
                className="mx-auto rounded-lg px-2 py-1 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Lewati kode kelas
              </button>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-8">
            {netError && (
              <Alert tone="error" icon={<Wifi />} role="alert">
                Tidak bisa menghubungi server. Cek internet, lalu coba lagi.
              </Alert>
            )}

            {mode === 'login' && hintAccounts.length > 0 && !compact && !netError && (
              <div className="rounded-2xl border-[1.5px] border-dashed border-[#d9d1c5] px-4 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Akun siap pakai</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {hintAccounts.map((c) => (
                    <li key={c.email} className="flex items-center justify-between gap-3">
                      <span className="truncate text-[0.9375rem] font-semibold text-ink">{c.email}</span>
                      <Button
                        variant="outline-tiger"
                        size="sm"
                        className="h-10 px-5 text-sm"
                        onClick={() => {
                          setEmail(c.email);
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
