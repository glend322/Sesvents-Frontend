import { cn } from '@/lib/utils';

/**
 * Tanda LUNAR: ikon tangan isyarat huruf L di dalam squircle oranye (/logo.png).
 */
export function LogoMark({ className }: { className?: string }) {
  return <img src="/logo.png" alt="" aria-hidden="true" className={cn('size-8 shrink-0 object-contain', className)} />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-[1.0625rem] font-black uppercase tracking-[0.08em] text-ink">LUNAR</span>
    </span>
  );
}
