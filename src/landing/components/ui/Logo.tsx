type Props = { className?: string; tone?: 'light' | 'dark'; size?: 'sm' | 'md' };

/**
 * Tanda LUNAR: ikon tangan isyarat huruf L di dalam squircle oranye (/public/logo.png).
 */
export function LogoMark({ className = '' }: { className?: string; tone?: 'light' | 'dark' }) {
  return <img src="/logo.png?v=2" alt="" aria-hidden="true" className={`shrink-0 object-contain ${className}`} />;
}

export function Logo({ className = '', tone = 'light', size = 'md' }: Props) {
  const text = tone === 'light' ? 'text-brand-900' : 'text-white';
  const box = size === 'sm' ? 'size-7' : 'size-9';
  const type = size === 'sm' ? 'text-[10px]' : 'text-[15px]';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={box} tone={tone} />
      <span className={`font-extrabold leading-none tracking-[0.14em] ${type} ${text}`}>LUNAR</span>
    </span>
  );
}
