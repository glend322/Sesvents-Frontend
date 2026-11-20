import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  /** Ikon penanda di sisi kiri dalam field. */
  icon: ReactNode;
  /** Field password mendapat tombol perlihatkan/sembunyikan karakter. */
  password?: boolean;
  /** Pesan kesalahan khusus field ini. */
  error?: string | null;
};

/**
 * Field form dengan label terkait, ikon penanda di kiri, dan (untuk password)
 * tombol perlihatkan/sembunyikan karakter (Requirement 3).
 *
 * Label selalu berupa elemen <label> yang terhubung ke input lewat id, jadi
 * pembaca layar membacakannya saat field menerima fokus.
 */
export function Field({ label, icon, password = false, error, className, ...rest }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 grid -translate-y-1/2 place-items-center text-muted" aria-hidden="true">
          {icon}
        </span>

        <input
          id={id}
          type={password && !visible ? 'password' : 'text'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-14 w-full rounded-xl border-[1.5px] bg-white pl-12 text-base text-ink placeholder:text-[#a39b90] transition-shadow',
            // Kolom aktif: garis hitam tebal + bayangan krem tipis (bukan glow berwarna).
            'focus:border-2 focus:border-ink focus:shadow-[0_0_0_4px_var(--color-cream)] focus:outline-none',
            password ? 'pr-12' : 'pr-4',
            error ? 'border-rec focus:border-rec' : 'border-line',
            className,
          )}
          {...rest}
        />

        {password && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Sembunyikan password' : 'Perlihatkan password'}
            aria-pressed={visible}
            className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-[10px] text-muted transition-colors hover:bg-sand hover:text-ink"
          >
            {visible ? <EyeOff className="size-[1.1rem]" aria-hidden="true" /> : <Eye className="size-[1.1rem]" aria-hidden="true" />}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-sm text-rec">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
