import { useCallback, useSyncExternalStore } from 'react';
import type { SiswaProfile } from '@/auth/types';

/**
 * Nama panggilan opsional per akun di localStorage agar perubahan di Profil langsung tampil
 * serentak di header, sidebar, dan sapaan beranda tanpa mengubah nama lengkap dari server.
 */
const keyOf = (id: string) => `lunar.nickname.${id}`;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith('lunar.nickname.')) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function readNickname(id: string | undefined): string {
  if (!id) return '';
  try {
    return localStorage.getItem(keyOf(id))?.trim() ?? '';
  } catch {
    return '';
  }
}

export function writeNickname(id: string, value: string, fullName?: string) {
  const trimmed = value.trim();
  const next = trimmed && trimmed !== fullName?.trim() ? trimmed : '';
  try {
    if (next) localStorage.setItem(keyOf(id), next);
    else localStorage.removeItem(keyOf(id));
  } catch {
    // penyimpanan diblokir: abaikan
  }
  notify();
}

export function useDisplayName(profile: Pick<SiswaProfile, 'id' | 'name'> | null | undefined) {
  const id = profile?.id;
  const fullName = profile?.name ?? '';
  const nickname = useSyncExternalStore(
    subscribe,
    () => readNickname(id),
    () => '',
  );
  const setNickname = useCallback(
    (value: string) => {
      if (id) writeNickname(id, value, fullName);
    },
    [id, fullName],
  );
  const displayName = nickname || fullName;
  return { displayName, nickname, setNickname };
}
