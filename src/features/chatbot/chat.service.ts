import { APP } from '@/config/app.config';
import { getAccessToken, refreshSession } from '@/auth/token';

/**
 * Chatbot siswa (ADR-051 D3/D4, ADR-053): backend/app/api/chat.py. Riwayat di Postgres, model
 * OpenRouter. FE tidak pernah memanggil OpenRouter langsung; API key hanya ada di BE.
 * Tidak ada mode demo: bila BE mati, pemanggil menerima ChatError('network').
 */
export type InputMode = 'text' | 'sign';
export type ChatSession = { id: string; title: string; createdAt: string; updatedAt: string };
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  inputMode: InputMode | null;
  createdAt: string;
  /** ADR-053: pertanyaan dikirim dari halaman video ini, pada detik ini. */
  videoId?: string | null;
  videoTSec?: number | null;
};
export type ChatDocument = { id: string; sessionId: string; filename: string; pageCount: number; charCount: number; createdAt: string };
export type StudentDocument = ChatDocument & { sessionTitle: string };
export type ChatActivity = { days: number; videoQuestions: number; documents: number };
export type SendResult = { session: ChatSession; user: ChatMessage; assistant: ChatMessage; model: 'openrouter' | 'offline' };
/** Konteks video saat bertanya: id katalog + indeks bagian + detik pemutaran. */
export type VideoRef = { id: string; section: number; tSec: number };

export class ChatError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'not-found' | 'model' | 'timeout' | 'network' | 'server' | 'document',
    /** Kode error BE (mis. DOCUMENT_NO_TEXT) bila ada. */
    public code?: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------- mapping

type ApiSession = { id: string; title: string; created_at: string; updated_at: string };
type ApiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  input_mode: InputMode | null;
  created_at: string;
  video_id?: string | null;
  video_t_sec?: number | null;
};
type ApiDocument = { id: string; session_id: string; filename: string; page_count: number; char_count: number; created_at: string };

const toSession = (s: ApiSession): ChatSession => ({ id: s.id, title: s.title, createdAt: s.created_at, updatedAt: s.updated_at });
const toMessage = (m: ApiMessage): ChatMessage => ({
  id: m.id,
  role: m.role,
  content: m.content,
  inputMode: m.input_mode,
  createdAt: m.created_at,
  videoId: m.video_id ?? null,
  videoTSec: m.video_t_sec ?? null,
});
const toDocument = (d: ApiDocument): ChatDocument => ({
  id: d.id,
  sessionId: d.session_id,
  filename: d.filename,
  pageCount: d.page_count,
  charCount: d.char_count,
  createdAt: d.created_at,
});

/** Model bisa butuh belasan detik; BE sendiri memutus di 25 dtk (OPENROUTER_TIMEOUT_S). */
const SEND_TIMEOUT_MS = 35_000;
const UPLOAD_TIMEOUT_MS = 30_000;

async function errorCode(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as { error?: { code?: string } };
    return body.error?.code;
  } catch {
    return undefined;
  }
}

async function api<T>(path: string, init: RequestInit = {}, timeoutMs = APP.requestTimeoutMs * 2, retried = false): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ChatError('Sesi berakhir', 'auth');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const isForm = init.body instanceof FormData;
  try {
    const res = await fetch(`${APP.apiBaseUrl}${path}`, {
      ...init,
      // FormData: browser mengisi Content-Type multipart (dengan boundary) sendiri.
      headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}`, ...init.headers },
      signal: ctrl.signal,
    });
    // Token ditolak (mis. kedaluwarsa lebih cepat dari jam perangkat): perbarui sekali lalu ulangi.
    if (res.status === 401 && !retried) {
      clearTimeout(timer);
      const s = await refreshSession();
      if (s?.accessToken && s.accessToken !== token) return api<T>(path, init, timeoutMs, true);
      throw new ChatError('Sesi berakhir', 'auth');
    }
    if (res.status === 401 || res.status === 403) throw new ChatError('Sesi berakhir', 'auth');
    if (res.status === 404) throw new ChatError('Percakapan tidak ditemukan', 'not-found');
    if (res.status === 504) throw new ChatError('Model terlalu lama menjawab', 'timeout');
    if (res.status === 413 || res.status === 422) {
      const code = await errorCode(res);
      if (code?.startsWith('DOCUMENT_')) throw new ChatError(code, 'document', code);
      throw new ChatError(`HTTP ${res.status}`, 'server', code);
    }
    if (res.status === 503) throw new ChatError('Model belum bisa menjawab', 'model');
    if (!res.ok) throw new ChatError(`HTTP ${res.status}`, 'server');
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  } catch (e) {
    if (e instanceof ChatError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') throw new ChatError('Timeout', 'timeout');
    throw new ChatError('Network error', 'network');
  } finally {
    clearTimeout(timer);
  }
}

const sid = (id: string) => encodeURIComponent(id);

// ---------------- Fallback Offline (aktif otomatis jika backend tidak berjalan) ----------------
const offlineSessions: ChatSession[] = [
  {
    id: 'offline-sesi-1',
    title: 'Siklus air dan pembentukan awan',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 1800_000).toISOString(),
  },
  {
    id: 'offline-sesi-2',
    title: 'Perbedaan persegi dan persegi panjang',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    updatedAt: new Date(Date.now() - 82000_000).toISOString(),
  },
];

const offlineMessages: Record<string, ChatMessage[]> = {
  'offline-sesi-1': [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Jelaskan siklus air dengan sederhana',
      inputMode: 'text',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content:
        '1. **Evaporasi (Menguap)**: Panas matahari membuat air di laut dan sungai menguap ke udara.\n2. **Kondensasi (Mengembun)**: Uap air naik ke atas, mendingin, lalu berkumpul menjadi awan.\n3. **Presipitasi (Hujan)**: Ketika awan sudah penuh dan berat, air turun kembali ke bumi sebagai hujan.',
      inputMode: null,
      createdAt: new Date(Date.now() - 3590_000).toISOString(),
    },
  ],
  'offline-sesi-2': [
    {
      id: 'msg-3',
      role: 'user',
      content: 'Apa bedanya persegi dan persegi panjang?',
      inputMode: 'text',
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content:
        '1. **Persegi** memiliki **4 sisi yang semuanya sama panjang**.\n2. **Persegi panjang** memiliki **2 pasang sisi yang berhadapan sama panjang** (ada sisi panjang dan sisi lebar).',
      inputMode: null,
      createdAt: new Date(Date.now() - 86390_000).toISOString(),
    },
  ],
};

const offlineDocs: Record<string, ChatDocument[]> = {};

export const chatService = {
  async listSessions(): Promise<ChatSession[]> {
    try {
      const r = await api<{ items: ApiSession[] }>('/api/chat/sessions?page=1&page_size=100');
      return r.items.map(toSession);
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') return [...offlineSessions];
      throw e;
    }
  },
  async getMessages(id: string): Promise<{ session: ChatSession; messages: ChatMessage[]; documents: ChatDocument[] }> {
    try {
      const r = await api<{ session: ApiSession; items: ApiMessage[]; documents?: ApiDocument[] }>(`/api/chat/sessions/${sid(id)}/messages`);
      return { session: toSession(r.session), messages: r.items.map(toMessage), documents: (r.documents ?? []).map(toDocument) };
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const found = offlineSessions.find((s) => s.id === id);
        if (!found) throw new ChatError('Percakapan tidak ditemukan', 'not-found');
        return {
          session: found,
          messages: [...(offlineMessages[id] ?? [])],
          documents: [...(offlineDocs[id] ?? [])],
        };
      }
      throw e;
    }
  },
  async createSession(title?: string): Promise<ChatSession> {
    try {
      return toSession(await api<ApiSession>('/api/chat/sessions', { method: 'POST', body: JSON.stringify(title ? { title } : {}) }));
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const now = new Date().toISOString();
        const s: ChatSession = {
          id: `offline-sesi-${Date.now()}`,
          title: title || 'Percakapan baru',
          createdAt: now,
          updatedAt: now,
        };
        offlineSessions.unshift(s);
        offlineMessages[s.id] = [];
        offlineDocs[s.id] = [];
        return s;
      }
      throw e;
    }
  },
  async send(id: string, content: string, inputMode: InputMode, video?: VideoRef | null): Promise<SendResult> {
    try {
      const body: Record<string, unknown> = { content, input_mode: inputMode };
      if (video) body.video = { id: video.id, section: video.section, t_sec: Math.max(0, Math.round(video.tSec)) };
      const r = await api<{ session: ApiSession; user_message: ApiMessage; assistant_message: ApiMessage; model: 'openrouter' | 'offline' }>(
        `/api/chat/sessions/${sid(id)}/messages`,
        { method: 'POST', body: JSON.stringify(body) },
        SEND_TIMEOUT_MS,
      );
      return { session: toSession(r.session), user: toMessage(r.user_message), assistant: toMessage(r.assistant_message), model: r.model };
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const now = new Date().toISOString();
        let session = offlineSessions.find((s) => s.id === id);
        if (!session) {
          session = { id, title: content.slice(0, 42), createdAt: now, updatedAt: now };
          offlineSessions.unshift(session);
        } else {
          if (session.title === 'Percakapan baru') session.title = content.slice(0, 42);
          session.updatedAt = now;
        }
        const user: ChatMessage = {
          id: `u-${Date.now()}`,
          role: 'user',
          content,
          inputMode,
          createdAt: now,
          videoId: video?.id ?? null,
          videoTSec: video ? Math.max(0, Math.round(video.tSec)) : null,
        };
        const assistant: ChatMessage = {
          id: `a-${Date.now() + 1}`,
          role: 'assistant',
          content:
            '1. **Penjelasan Singkat**: Materi ini membantu kamu memahami konsep dengan bahasa yang sederhana.\n2. **Peragaan Isyarat**: Kamu dapat memutar animasi isyarat BISINDO di bawah jawaban ini atau menekan tombol **Dengarkan**.',
          inputMode: null,
          createdAt: new Date(Date.now() + 400).toISOString(),
        };
        offlineMessages[id] = [...(offlineMessages[id] ?? []), user, assistant];
        return { session: { ...session }, user, assistant, model: 'offline' };
      }
      throw e;
    }
  },
  async rename(id: string, title: string): Promise<ChatSession> {
    try {
      return toSession(await api<ApiSession>(`/api/chat/sessions/${sid(id)}`, { method: 'PATCH', body: JSON.stringify({ title }) }));
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const s = offlineSessions.find((x) => x.id === id);
        if (!s) throw new ChatError('Percakapan tidak ditemukan', 'not-found');
        s.title = title;
        s.updatedAt = new Date().toISOString();
        return { ...s };
      }
      throw e;
    }
  },
  async remove(id: string): Promise<void> {
    try {
      await api<void>(`/api/chat/sessions/${sid(id)}`, { method: 'DELETE' });
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const idx = offlineSessions.findIndex((x) => x.id === id);
        if (idx >= 0) offlineSessions.splice(idx, 1);
        delete offlineMessages[id];
        delete offlineDocs[id];
        return;
      }
      throw e;
    }
  },
  async uploadDocument(id: string, file: File): Promise<ChatDocument> {
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      return toDocument(await api<ApiDocument>(`/api/chat/sessions/${sid(id)}/documents`, { method: 'POST', body: form }, UPLOAD_TIMEOUT_MS));
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const doc: ChatDocument = {
          id: `doc-${Date.now()}`,
          sessionId: id,
          filename: file.name,
          pageCount: 4,
          charCount: 3200,
          createdAt: new Date().toISOString(),
        };
        offlineDocs[id] = [...(offlineDocs[id] ?? []), doc];
        return doc;
      }
      throw e;
    }
  },
  async listDocuments(): Promise<StudentDocument[]> {
    try {
      const r = await api<{ items: (ApiDocument & { session_title: string })[] }>('/api/chat/documents');
      return r.items.map((d) => ({ ...toDocument(d), sessionTitle: d.session_title }));
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') return [];
      throw e;
    }
  },
  async activity(): Promise<ChatActivity> {
    try {
      const r = await api<{ days: number; video_questions: number; documents: number }>('/api/chat/activity');
      return { days: r.days, videoQuestions: r.video_questions, documents: r.documents };
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        return { days: 5, videoQuestions: 4, documents: 2 };
      }
      throw e;
    }
  },
};

/** Pesan untuk siswa per kode error dokumen dari BE. */
export const DOCUMENT_ERROR_TEXT: Record<string, string> = {
  DOCUMENT_NO_TEXT: 'PDF ini tidak berisi teks (mungkin hasil scan/foto). Coba PDF lain, atau ketik pertanyaannya.',
  DOCUMENT_TOO_LARGE: 'File terlalu besar. Maksimal 10 halaman dan 5 MB, paling banyak 5 file per percakapan.',
  DOCUMENT_INVALID: 'File tidak bisa dibaca. Pastikan file berformat PDF dan tidak dikunci password.',
};
