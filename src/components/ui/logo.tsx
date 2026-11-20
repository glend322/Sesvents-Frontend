import { Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tanda LUNAR versi panduan UI: kotak tinta dengan tangan oranye. Satu bentuk untuk latar putih
 * maupun banner oranye (kontras tetap tinggi di keduanya).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('grid size-8 shrink-0 place-items-center rounded-[10px] bg-ink text-tiger', className)}>
      <Hand className="size-[58%]" strokeWidth={2.2} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-[1.0625rem] font-black uppercase tracking-[0.08em] text-ink">LUNAR</span>
    </span>
  );
}
