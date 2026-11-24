import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, History, LoaderCircle, MessageSquare, PlaySquare, Plus, Search, Settings, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Avatar } from '@/auth/components/Avatar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Logo } from '@/components/ui/logo';
import { APP } from '@/config/app.config';
import { chatService, type ChatSession } from '@/features/chatbot/chat.service';
import { DeleteChatDialog } from '@/features/chatbot/DeleteChatDialog';
import { sessionsStore, useSessions } from '@/features/chatbot/sessions.store';
import { cn } from '@/lib/utils';

/**
 * Kerangka aplikasi siswa (ADR-053). Desktop: sidebar kiri dengan tiga blok yang terpisah jelas,
 *  1. menu (Tanya LUNAR, Video Pelajaran, Materi Saya),
 *  2. percakapan terakhir (4) + "Lihat semua",
 *  3. kartu profil (→ Profil & pengaturan).
 * Layar kecil: bar atas + tab bawah. Kiosk tidak ada di menu (tetap bisa dibuka di /kiosk).
 */
export const NAV = [
  { to: '/chat', label: 'Tanya LUNAR', short: 'Tanya', icon: MessageSquare },
  { to: '/video', label: 'Konten Pembelajaran', short: 'Konten', icon: PlaySquare },
  { to: '/materi', label: 'Materi Saya', short: 'Materi', icon: BookOpen },
] as const;

/**
 * Bagian kerangka yang boleh disembunyikan halaman di layar kecil (panduan UI): beranda Tanya
 * memakai banner oranye sendiri (tanpa bar atas), percakapan memakai bar judul sendiri dan
 * tidak menampilkan tab bawah. Desktop (sidebar) tidak terpengaruh.
 */
export type ShellChrome = { mobileHeader: boolean; mobileNav: boolean };
const DEFAULT_CHROME: ShellChrome = { mobileHeader: true, mobileNav: true };
type ShellCtx = { setChrome: (c: ShellChrome) => void };

/** Dipanggil halaman untuk mengatur kerangka; kembali ke bawaan saat halaman ditutup. */
export function useShellChrome({ mobileHeader = true, mobileNav = true }: Partial<ShellChrome>) {
  const ctx = useOutletContext<ShellCtx | undefined>();
  const setChrome = ctx?.setChrome;
  useEffect(() => {
    if (!setChrome) return;
    setChrome({ mobileHeader, mobileNav });
    return () => setChrome(DEFAULT_CHROME);
  }, [setChrome, mobileHeader, mobileNav]);
}

const RECENT = 4;

export function AppShell() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sessions = useSessions();
  /**
   * Tanya LUNAR mengisi minimal satu layar supaya kolom tanya duduk di bawah walau percakapan
   * masih pendek. Gulirnya tetap milik halaman (bukan panel sendiri), jadi siswa memakai scrollbar
   * peramban seperti di halaman lain.
   */
  const fullHeight = location.pathname.startsWith('/chat');
  const [chrome, setChrome] = useState<ShellChrome>(DEFAULT_CHROME);
  const [outletCtx] = useState<ShellCtx>(() => ({ setChrome }));
  const section = '/' + (location.pathname.split('/')[1] ?? '');
  const activeChat = location.pathname.startsWith('/chat/') ? location.pathname.split('/')[2] : null;

  // Riwayat milik siswa ini saja; dimuat sekali per akun.
  useEffect(() => {
    sessionsStore.reset();
    void sessionsStore.refresh();
  }, [profile?.id]);

  const newChat = () => navigate('/chat');

  // ---------- hapus & cari percakapan dari sidebar
  const [confirm, setConfirm] = useState<ChatSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const chatSearchInputRef = useRef<HTMLInputElement>(null);
  // Tombol X yang membuka dialog, supaya fokus bisa dikembalikan saat dibatalkan.
  const trigger = useRef<HTMLButtonElement | null>(null);
  // Setelah terhapus, tombol X-nya ikut hilang: fokus dipindah ke "Chat baru" agar tidak lepas.
  const newChatBtn = useRef<HTMLButtonElement>(null);

  const askDelete = (s: ChatSession, el: HTMLButtonElement) => {
    trigger.current = el;
    setFailed(false);
    setConfirm(s);
  };
  const closeConfirm = () => {
    setConfirm(null);
    setFailed(false);
    trigger.current?.focus();
  };
  const doDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await chatService.remove(confirm.id);
      sessionsStore.drop(confirm.id);
      // Percakapan yang sedang dibuka ikut terhapus: mulai percakapan baru.
      if (activeChat === confirm.id) navigate('/chat', { replace: true });
      setConfirm(null);
      setFailed(false);
      trigger.current = null;
      newChatBtn.current?.focus();
    } catch {
      setFailed(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-sand lg:grid lg:grid-cols-[16rem_1fr]">
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white px-3.5 py-5 lg:flex">
        <a href={APP.landingUrl} aria-label="LUNAR, ke halaman utama" className="mb-5 w-fit rounded-xl px-2 transition-opacity hover:opacity-80">
          <Logo />
        </a>

        <button
          ref={newChatBtn}
          type="button"
          onClick={newChat}
          className="mb-3 flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-3.5 text-sm font-bold text-ink transition-colors hover:bg-sand"
        >
          <span className="grid size-6 place-items-center rounded-md bg-tiger text-ink">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          Chat baru
        </button>

        <nav aria-label="Menu utama" className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors',
                  isActive ? 'text-ink' : 'text-muted hover:bg-sand hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-cream" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                  )}
                  <n.icon className={cn('relative size-[1.15rem]', isActive && 'text-tiger-ink')} strokeWidth={1.8} aria-hidden="true" />
                  <span className="relative">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 min-h-0 flex-1 border-t border-line pt-4">
          <div className="mb-1.5 flex items-center justify-between pl-3.5 pr-1.5">
            <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] text-ink">Percakapan terakhir</p>
            <button
              type="button"
              onClick={() => {
                setChatSearchOpen((prev) => {
                  const next = !prev;
                  if (!next) setChatSearchQuery('');
                  else window.setTimeout(() => chatSearchInputRef.current?.focus(), 20);
                  return next;
                });
              }}
              aria-label="Cari judul percakapan"
              aria-expanded={chatSearchOpen}
              title="Cari judul percakapan"
              className={cn(
                'grid size-7 place-items-center rounded-lg transition-colors',
                chatSearchOpen ? 'bg-cream text-tiger-ink' : 'text-muted hover:bg-sand hover:text-ink',
              )}
            >
              <Search className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {chatSearchOpen && (
            <div className="mb-2 px-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  ref={chatSearchInputRef}
                  type="search"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setChatSearchOpen(false);
                      setChatSearchQuery('');
                    }
                  }}
                  placeholder="Cari judul chat…"
                  aria-label="Cari judul percakapan"
                  className="h-8 w-full rounded-xl border border-line bg-sand/60 pl-8 pr-3 text-xs text-ink placeholder:text-muted focus:border-brand-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {!sessions.loaded ? (
            <div className="flex flex-col gap-1.5 px-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-8 animate-pulse rounded-xl bg-tint" />
              ))}
            </div>
          ) : sessions.sessions.length === 0 ? (
            <p className="px-3.5 text-xs leading-relaxed text-muted">{sessions.error ? 'Tidak bisa terhubung ke server.' : 'Belum ada percakapan.'}</p>
          ) : (
            (() => {
              const needle = chatSearchQuery.trim().toLowerCase();
              const filteredSessions = needle
                ? sessions.sessions.filter((s) => s.title.toLowerCase().includes(needle))
                : sessions.sessions.slice(0, RECENT);
              if (filteredSessions.length === 0) {
                return <p className="px-3.5 py-1 text-xs text-muted">Judul tidak ditemukan.</p>;
              }
              return (
                <ul className="flex flex-col gap-0.5">
                  {filteredSessions.map((s) => (
                    <li key={s.id} className="group/chat relative">
                      <Link
                        to={`/chat/${s.id}`}
                        aria-current={s.id === activeChat ? 'page' : undefined}
                        className={cn(
                          'block truncate rounded-xl py-2 pl-3.5 pr-9 text-[0.8125rem] transition-colors',
                          s.id === activeChat ? 'bg-tint font-extrabold text-brand-900' : 'font-semibold text-brand-800 hover:bg-tint',
                        )}
                      >
                        {s.title}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => askDelete(s, e.currentTarget)}
                        aria-label={`Hapus percakapan ${s.title}`}
                        title="Hapus percakapan"
                        className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-brand-200 transition-colors hover:bg-rec-soft hover:text-rec focus-visible:text-rec group-hover/chat:text-muted"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()
          )}
          {sessions.sessions.length > 0 && (
            <NavLink
              to="/riwayat"
              className={({ isActive }) =>
                cn('mt-1 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold', isActive ? 'text-brand-900' : 'text-brand-600 hover:bg-tint')
              }
            >
              <History className="size-3.5" aria-hidden="true" /> Lihat semua
            </NavLink>
          )}
        </div>

        <NavLink
          to="/profil"
          className={({ isActive }) =>
            cn('mt-3 flex items-center gap-3 rounded-2xl border p-2.5 transition-colors', isActive ? 'border-brand-200 bg-brand-50' : 'border-line bg-white hover:bg-tint')
          }
          aria-label={`Profil ${profile?.name ?? ''}. Buka profil dan pengaturan.`}
        >
          <Avatar name={profile?.name?.split(' ')[0]} photoUrl={profile?.photoUrl} className="size-10" textClassName="text-sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-brand-900">{profile?.name}</span>
            <span className="block truncate text-xs text-muted">Pengguna</span>
          </span>
          <Settings className="size-4 shrink-0 text-muted" aria-hidden="true" />
        </NavLink>
      </aside>

      {/* ---------- Bar atas (mobile) ---------- */}
      <header
        className={cn(
          'sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden',
          !chrome.mobileHeader && 'hidden',
        )}
      >
        {/* flex: tanpa ini <a> tetap inline, logonya didudukkan di baseline teks dan tampak naik. */}
        <a href={APP.landingUrl} aria-label="LUNAR, ke halaman utama" className="flex items-center">
          <Logo />
        </a>
        <NavLink to="/profil" aria-label="Profil dan pengaturan">
          <Avatar name={profile?.name} photoUrl={profile?.photoUrl} className="size-9" textClassName="text-xs" />
        </NavLink>
      </header>

      {/* ---------- Isi ---------- */}
      <main
        id="konten"
        className={cn(
          'mx-auto w-full max-w-[84rem] px-5 pb-28 pt-5 md:px-8 md:pt-8 lg:pb-10',
          // Tanya: jarak diurus ChatPage (banner menempel ke tepi layar, kolom tanya ke bawah).
          fullHeight && 'flex flex-col px-0 pb-0 pt-0 md:px-0 md:pt-0 lg:min-h-dvh lg:px-8 lg:pb-0 lg:pt-6',
          fullHeight && (chrome.mobileHeader ? 'min-h-[calc(100dvh-3.5rem)]' : 'min-h-dvh'),
        )}
      >
        {/* Hanya animasi masuk (tanpa exit): <Outlet/> selalu merender rute baru, jadi exit akan berkedip. */}
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(fullHeight && 'flex flex-1 flex-col')}
        >
          <ErrorBoundary label="Halaman" resetKey={location.pathname}>
            <Suspense fallback={<PageLoading />}>
              <Outlet context={outletCtx} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </main>

      {/* ---------- Tab bawah (mobile) ---------- */}
      <nav
        aria-label="Menu utama"
        className={cn('fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden', !chrome.mobileNav && 'hidden')}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {[...NAV, { to: '/riwayat', label: 'Riwayat', short: 'Riwayat', icon: History }].map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                className={({ isActive }) =>
                  cn('relative flex h-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'font-bold text-ink' : 'font-medium text-muted')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative grid h-8 w-14 place-items-center">
                      {isActive && (
                        <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-cream" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                      )}
                      <n.icon className={cn('relative size-5', isActive && 'text-tiger-ink')} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="max-w-full truncate px-1">{n.short}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <DeleteChatDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        deleting={deleting}
        failed={failed}
        onCancel={closeConfirm}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
}

function PageLoading() {
  return (
    <div className="grid min-h-64 place-items-center" role="status" aria-live="polite">
      <span className="flex items-center gap-2 text-sm font-semibold text-muted">
        <LoaderCircle className="size-4 anim-spin" aria-hidden="true" /> Memuat…
      </span>
    </div>
  );
}
