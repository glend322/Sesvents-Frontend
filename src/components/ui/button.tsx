import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'tiger' | 'dark' | 'outline' | 'outline-tiger' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  /** Aksi utama: hitam (panduan UI). Oranye penuh hanya untuk "Tanya" (variant tiger). */
  primary: 'bg-ink text-white hover:bg-brand-800 disabled:bg-[#d4cdc2] disabled:text-white disabled:opacity-100',
  tiger: 'bg-tiger text-ink hover:bg-[#e47c20]',
  dark: 'bg-ink text-white hover:bg-brand-800',
  outline: 'border-[1.5px] border-line bg-white text-ink hover:bg-sand',
  /** Aksi kecil di daftar (pola tombol "Add" ESB). */
  'outline-tiger': 'border-[1.5px] border-tiger-ink bg-white text-tiger-ink hover:bg-cream',
  ghost: 'text-brand-800 hover:bg-brand-50',
  soft: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
  /** Tindakan yang menghapus data (mis. hapus percakapan). */
  danger: 'bg-rec text-white hover:bg-[#ad2f28]',
};
const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded-[10px]',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-14 px-6 text-base gap-2.5 rounded-xl',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'inline-flex shrink-0 items-center justify-center font-bold transition-colors disabled:opacity-50 disabled:shadow-none [&_svg]:size-[1.1em] [&_svg]:shrink-0',
      VARIANT[variant],
      SIZE[size],
      className,
    )}
    {...props}
  />
));
Button.displayName = 'Button';
