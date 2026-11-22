import { APP } from '@/config/app.config';
import { AUTH } from './auth.config';
import type { LoginResult, SiswaProfile } from './types';

/**
 * Auth service siswa (ADR-056): login & daftar mandiri memakai Email + Nomor Telepon + Password lewat Backend.
 */
export interface AuthService {
  login(email: string, password: string): Promise<LoginResult>;
  register(fullName: string, email: string, password: string, phone: string): Promise<LoginResult>;
  completeProfile(accessToken: string, data: { grade?: number; classCode?: string | null; fullName?: string; phone?: string }): Promise<SiswaProfile | null>;
  forgotPassword(email: string): Promise<boolean>;
  logout(accessToken?: string): Promise<void>;
  refresh(refreshToken: string): Promise<LoginResult | { ok: false; reason: 'invalid' }>;
}

/**
 * Akun siap pakai untuk demo/evaluasi yang ditampilkan di bawah form login.
 */
const demoEmail = (import.meta.env.VITE_DEMO_EMAIL || 'demo@lunar.app').trim();
const demoPassword = (import.meta.env.VITE_DEMO_PASSWORD || 'LunarDemo2026!').trim();
export const readyAccounts = demoEmail && demoPassword ? [{ email: demoEmail, password: demoPassword }] : [];

// ---------------------------------------------------------------- HTTP

type ApiStudent = {
  id: string;
  email?: string | null;
  phone?: string | null;
  nis?: string | null;
  full_name: string;
  class_name?: string | null;
  grade?: number | null;
  class_code?: string | null;
  avatar_url?: string | null;
  institution?: { id: string; name: string } | null;
};
type ApiLoginResponse = { access_token: string; token_type: 'bearer'; expires_in: number; refresh_token: string; student: ApiStudent };

export const toProfile = (s: ApiStudent): SiswaProfile => ({
  id: s.id,
  email: s.email?.trim() || s.nis?.trim() || '',
  phone: s.phone?.trim() || undefined,
  nis: s.nis ?? undefined,
  name: s.full_name,
  className: s.class_name ?? undefined,
  grade: s.grade ?? undefined,
  classCode: s.class_code ?? undefined,
  school: s.institution?.name ?? undefined,
  photoUrl: s.avatar_url ?? undefined,
});

async function extractErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as {
      detail?: string | { loc?: (string | number)[]; msg?: string }[];
      error?: { code?: string; message?: string };
      message?: string;
    };
    if (typeof body.error?.message === 'string' && body.error.message.trim()) {
      return body.error.message.trim();
    }
    if (typeof body.detail === 'string' && body.detail.trim()) {
      return body.detail.trim();
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const first = body.detail[0];
      const field = first?.loc?.[first.loc.length - 1];
      const msg = first?.msg?.trim();
      if (field && msg) return `${String(field)}: ${msg}`;
      if (msg) return msg;
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    // ignore JSON parse failure
  }
  return undefined;
}

async function postAuth(path: string, body: unknown): Promise<LoginResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), APP.requestTimeoutMs * 2);
  try {
    const res = await fetch(`${APP.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (res.status === 401) {
      return { ok: false, reason: 'invalid-credentials', message: await extractErrorMessage(res) };
    }
    if (res.status === 409) {
      return { ok: false, reason: 'email-exists', message: await extractErrorMessage(res) };
    }
    if (res.status === 422 || res.status === 400) {
      return { ok: false, reason: 'validation-error', message: await extractErrorMessage(res) };
    }
    if (!res.ok) {
      return { ok: false, reason: 'service-error', message: await extractErrorMessage(res) };
    }
    const data = (await res.json()) as ApiLoginResponse;
    return {
      ok: true,
      profile: toProfile(data.student),
      tokens: { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 },
    };
  } catch {
    return { ok: false, reason: 'service-error' };
  } finally {
    clearTimeout(timer);
  }
}

export const httpAuthService: AuthService = {
  login: (email, password) => postAuth('/api/student/auth/login', { email, password }),
  register: (fullName, email, password, phone) =>
    postAuth('/api/student/auth/register', {
      full_name: fullName,
      email,
      password,
      phone,
    }),
  async completeProfile(accessToken, data) {
    const payload: Record<string, unknown> = {};
    if (data.fullName !== undefined) payload.full_name = data.fullName;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.grade !== undefined) payload.grade = data.grade;
    if (data.classCode !== undefined) payload.class_code = data.classCode;
    try {
      const res = await fetch(`${APP.apiBaseUrl}/api/student/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return toProfile((await res.json()) as ApiStudent);
    } catch {
      return null;
    }
  },
  async forgotPassword(email) {
    try {
      const res = await fetch(`${APP.apiBaseUrl}/api/student/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
  async logout(accessToken) {
    if (!accessToken) return;
    try {
      await fetch(`${APP.apiBaseUrl}/api/student/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Best-effort tracking logout; never blocks client logout.
    }
  },
  async refresh(refreshToken) {
    const r = await postAuth('/api/student/auth/refresh', { refresh_token: refreshToken });
    return !r.ok && r.reason === 'invalid-credentials' ? { ok: false, reason: 'invalid' } : r;
  },
};

export const authService: AuthService = httpAuthService;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_NUMBER_RE = /^\d+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return PHONE_NUMBER_RE.test(phone.trim());
}

export function validateCredentialLengths(email: string, password: string): string | null {
  if (email.length > AUTH.maxEmailLength) return `Email maksimal ${AUTH.maxEmailLength} karakter.`;
  if (password.length > AUTH.maxPasswordLength) return `Password maksimal ${AUTH.maxPasswordLength} karakter.`;
  return null;
}
