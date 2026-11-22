import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
<<<<<<< HEAD
import { ArrowLeft, Check, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '../components/Field';

/**
 * Dialog "Lupa password?" untuk akun mandiri (B2C lewat email).
 * Pengguna memasukkan emailnya sendiri untuk menerima tautan atur ulang password.
 */
export function ForgotPasswordDialog({
  open,
  defaultEmail = '',
  onClose,
}: {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
=======
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService, isValidEmail } from '../auth.service';
import { Field } from '../components/Field';

export function ForgotPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
<<<<<<< HEAD
    setEmail(defaultEmail);
    setError(null);
    setSent(false);
=======
    setError(null);
    setSent(false);
    closeRef.current?.focus();
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, defaultEmail, onClose]);

  const onKeyDownTrap = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

<<<<<<< HEAD
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) {
      setError('Isi email kamu dulu, ya.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Format email belum sesuai (contoh: nadia.putri@gmail.com).');
      return;
    }
    setError(null);
    setSent(true);
=======
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!isValidEmail(cleaned)) {
      setError('Masukkan alamat email yang valid, ya.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await authService.forgotPassword(cleaned);
    setSubmitting(false);
    if (ok) setSent(true);
    else setError('Gagal menghubungi server. Coba lagi sebentar lagi.');
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 grid place-items-center bg-brand-950/45 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            aria-describedby="forgot-body"
            onKeyDown={onKeyDownTrap}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[30rem] rounded-[1.75rem] bg-white p-6 shadow-soft md:p-7"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
<<<<<<< HEAD
              {sent ? <Check className="size-5 text-ok" aria-hidden="true" /> : <KeyRound className="size-5" aria-hidden="true" />}
            </span>

            <h2 id="forgot-title" className="mt-4 text-[1.375rem] font-extrabold leading-tight tracking-[-0.03em] text-ink">
              {sent ? 'Cek email kamu, ya' : 'Atur ulang password'}
=======
              {sent ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <KeyRound className="size-5" aria-hidden="true" />}
            </span>

            <h2 id="forgot-title" className="mt-4 text-[1.375rem] font-extrabold leading-tight tracking-[-0.03em]">
              {sent ? 'Cek kotak masuk emailmu' : 'Lupa password?'}
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
            </h2>

            {sent ? (
              <div id="forgot-body" className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-muted">
                <p>
<<<<<<< HEAD
                  Kami sudah mengirimkan tautan untuk membuat password baru ke{' '}
                  <span className="font-bold text-ink">{email.trim()}</span>.
                </p>
                <p className="rounded-2xl bg-cream p-3.5 text-ink">
                  Buka kotak masuk atau folder spam di emailmu, lalu ikuti petunjuk untuk mengganti password akunmu.
                </p>
                <div className="mt-3 flex justify-end">
                  <Button ref={closeRef} variant="primary" size="md" onClick={onClose}>
                    <ArrowLeft aria-hidden="true" /> Kembali ke Masuk
=======
                  Jika email <span className="font-semibold text-ink">{email.trim()}</span> terdaftar di LUNAR, kami sudah mengirimkan
                  tautan untuk mengatur ulang password.
                </p>
                <div className="mt-4 flex justify-end">
                  <Button ref={closeRef} variant="primary" size="md" onClick={onClose}>
                    <ArrowLeft aria-hidden="true" /> Kembali ke halaman masuk
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
                  </Button>
                </div>
              </div>
            ) : (
<<<<<<< HEAD
              <form onSubmit={onSubmit} noValidate className="mt-2 flex flex-col gap-4">
                <p id="forgot-body" className="text-sm leading-relaxed text-muted">
                  Masukkan email yang terdaftar di akunmu. Kami akan mengirimkan tautan ke emailmu supaya kamu bisa membuat password baru sendiri.
                </p>

                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
=======
              <form id="forgot-body" onSubmit={onSubmit} noValidate className="mt-3 flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted">
                  Masukkan email akun LUNAR-mu. Kami akan mengirimkan tautan untuk membuat password baru.
                </p>
                <Field
                  label="Email"
                  icon={<Mail className="size-5" strokeWidth={1.8} />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
                  }}
                  placeholder="nadia.putri@gmail.com"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  error={error}
                />
<<<<<<< HEAD

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <Button ref={closeRef} type="button" variant="outline" size="md" onClick={onClose}>
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" size="md">
                    <Mail aria-hidden="true" /> Kirim tautan
=======
                <div className="mt-2 flex items-center justify-end gap-3">
                  <Button ref={closeRef} type="button" variant="outline" size="md" onClick={onClose}>
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" size="md" disabled={submitting}>
                    {submitting ? (
                      <>
                        <LoaderCircle className="anim-spin" aria-hidden="true" /> Mengirim…
                      </>
                    ) : (
                      'Kirim tautan'
                    )}
>>>>>>> 04b54306b72be52ce85c7be5b88f8de3b18a0e40
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
