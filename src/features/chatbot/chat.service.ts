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

const SESSIONS_STORAGE_KEY = 'lunar.offline_chat_sessions';
const MESSAGES_STORAGE_KEY = 'lunar.offline_chat_messages';
const DOCS_STORAGE_KEY = 'lunar.offline_chat_docs';

const INITIAL_OFFLINE_SESSIONS: ChatSession[] = [
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

const INITIAL_OFFLINE_MESSAGES: Record<string, ChatMessage[]> = {
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

function getStoredSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [...INITIAL_OFFLINE_SESSIONS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_OFFLINE_SESSIONS];
  } catch {
    return [...INITIAL_OFFLINE_SESSIONS];
  }
}

function saveStoredSessions(list: ChatSession[]) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function getStoredMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return { ...INITIAL_OFFLINE_MESSAGES };
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : { ...INITIAL_OFFLINE_MESSAGES };
  } catch {
    return { ...INITIAL_OFFLINE_MESSAGES };
  }
}

function saveStoredMessages(dict: Record<string, ChatMessage[]>) {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(dict));
  } catch {}
}

function getStoredDocs(): Record<string, ChatDocument[]> {
  try {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredDocs(dict: Record<string, ChatDocument[]>) {
  try {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(dict));
  } catch {}
}

function generateOfflineAnswer(content: string, video?: VideoRef | null): string {
  const q = content.toLowerCase();
  if (video) {
    return `1. **Penjelasan Bagian Video**: Pada bagian menit ini, perhatikan bagaimana konsep tersebut dijelaskan langkah demi langkah.\n2. **Poin Utama**: Konsep ini sangat penting untuk diingat saat mengerjakan latihan soal.\n3. **Coba Lagi**: Kamu juga bisa memutar ulang 10 detik sebelumnya untuk melihat peragaan isyaratnya secara perlahan.`;
  }
  if (q.includes('siklus') || q.includes('air') || q.includes('hujan') || q.includes('awan')) {
    return '1. **Evaporasi**: Air di bumi menguap karena panas matahari.\n2. **Kondensasi**: Uap air berubah menjadi titik-titik air di langit dan membentuk awan.\n3. **Presipitasi**: Air dari awan jatuh ke bumi sebagai hujan, lalu mengalir kembali ke laut.';
  }
  if (q.includes('persegi') || q.includes('segitiga') || q.includes('lingkaran') || q.includes('bangun datar')) {
    return '1. **Persegi**: Memiliki 4 sisi yang sama panjang dan 4 sudut siku-siku.\n2. **Persegi Panjang**: Sisi yang saling berhadapan memiliki panjang yang sama.\n3. **Segitiga**: Memiliki 3 sisi dan 3 sudut.';
  }
  if (q.includes('pecahan')) {
    return '1. **Arti Pecahan**: Bagian dari benda yang utuh.\n2. **Contoh 1/2 (Setengah)**: 1 kue dipotong menjadi 2 bagian yang sama besar.\n3. **Penyebut dan Pembilang**: Angka atas disebut pembilang, angka bawah disebut penyebut.';
  }
  if (q.includes('tumbuhan') || q.includes('akar') || q.includes('daun')) {
    return '1. **Akar**: Menyerap air dan zat hara dari dalam tanah.\n2. **Batang**: Menyalurkan air dari akar menuju ke daun.\n3. **Daun**: Tempat terjadinya fotosintesis membuat makanan dengan bantuan sinar matahari.';
  }
  if (q.includes('inggris') || q.includes('english') || q.includes('present') || q.includes('sapaan')) {
    return '1. **Greetings (Sapaan)**: "Good morning" artinya selamat pagi, "How are you?" artinya apa kabar?\n2. **Simple Present**: Digunakan untuk kebiasaan sehari-hari, contohnya "I study every day".';
  }
  return `1. **Jawaban LUNAR**: Pertanyaan kamu tentang "${content.slice(0, 30)}..." sudah dicatat.\n2. **Langkah Belajar**: Pahami konsep dasarnya terlebih dahulu, lalu coba tonton materi video terkait untuk melihat peragaan isyaratnya.\n3. **Semangat**: Ada lagi yang ingin kamu tanyakan atau diskusikan bersama LUNAR?`;
}

export const chatService = {
  async listSessions(): Promise<ChatSession[]> {
    try {
      const r = await api<{ items: ApiSession[] }>('/api/chat/sessions?page=1&page_size=100');
      return r.items.map(toSession);
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') return getStoredSessions();
      throw e;
    }
  },
  async getMessages(id: string): Promise<{ session: ChatSession; messages: ChatMessage[]; documents: ChatDocument[] }> {
    try {
      const r = await api<{ session: ApiSession; items: ApiMessage[]; documents?: ApiDocument[] }>(`/api/chat/sessions/${sid(id)}/messages`);
      return { session: toSession(r.session), messages: r.items.map(toMessage), documents: (r.documents ?? []).map(toDocument) };
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const sessions = getStoredSessions();
        const found = sessions.find((s) => s.id === id);
        if (!found) throw new ChatError('Percakapan tidak ditemukan', 'not-found');
        const allMsgs = getStoredMessages();
        const allDocs = getStoredDocs();
        return {
          session: found,
          messages: [...(allMsgs[id] ?? [])],
          documents: [...(allDocs[id] ?? [])],
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
        const sessions = getStoredSessions();
        sessions.unshift(s);
        saveStoredSessions(sessions);

        const allMsgs = getStoredMessages();
        allMsgs[s.id] = [];
        saveStoredMessages(allMsgs);
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
        const sessions = getStoredSessions();
        let session = sessions.find((s) => s.id === id);
        if (!session) {
          session = { id, title: content.slice(0, 42), createdAt: now, updatedAt: now };
          sessions.unshift(session);
        } else {
          if (session.title === 'Percakapan baru') session.title = content.slice(0, 42);
          session.updatedAt = now;
        }
        saveStoredSessions(sessions);

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
          content: generateOfflineAnswer(content, video),
          inputMode: null,
          createdAt: new Date(Date.now() + 300).toISOString(),
        };

        const allMsgs = getStoredMessages();
        allMsgs[id] = [...(allMsgs[id] ?? []), user, assistant];
        saveStoredMessages(allMsgs);

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
        const sessions = getStoredSessions();
        const s = sessions.find((x) => x.id === id);
        if (!s) throw new ChatError('Percakapan tidak ditemukan', 'not-found');
        s.title = title;
        s.updatedAt = new Date().toISOString();
        saveStoredSessions(sessions);
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
        const sessions = getStoredSessions().filter((x) => x.id !== id);
        saveStoredSessions(sessions);

        const allMsgs = getStoredMessages();
        delete allMsgs[id];
        saveStoredMessages(allMsgs);

        const allDocs = getStoredDocs();
        delete allDocs[id];
        saveStoredDocs(allDocs);
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
        const allDocs = getStoredDocs();
        allDocs[id] = [...(allDocs[id] ?? []), doc];
        saveStoredDocs(allDocs);
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
      if (e instanceof ChatError && e.kind === 'network') {
        const sessions = getStoredSessions();
        const allDocs = getStoredDocs();
        const list: StudentDocument[] = [];
        for (const [sessId, docs] of Object.entries(allDocs)) {
          const sess = sessions.find((s) => s.id === sessId);
          for (const d of docs) {
            list.push({ ...d, sessionTitle: sess?.title ?? 'Percakapan' });
          }
        }
        return list;
      }
      throw e;
    }
  },
  async activity(): Promise<ChatActivity> {
    try {
      const r = await api<{ days: number; video_questions: number; documents: number }>('/api/chat/activity');
      return { days: r.days, videoQuestions: r.video_questions, documents: r.documents };
    } catch (e) {
      if (e instanceof ChatError && e.kind === 'network') {
        const sessions = getStoredSessions();
        return { days: Math.max(1, sessions.length), videoQuestions: 3, documents: 1 };
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
