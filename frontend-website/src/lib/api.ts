// API_BASE_URL is defined later with enforced localhost:3007 policy

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionStatus: 'free' | 'pro';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  // Added optional trial fields to match backend response
  onTrial?: boolean;
  trialEndsAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface Conversation {
  id: number;
  title: string;
  summary?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  tokenCount: number;
  status: 'active' | 'archived' | 'deleted';
  model?: string;
  tags?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationData {
  title: string;
  summary?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  tokenCount?: number;
  model?: string;
  tags?: string;
}

export interface UpdateConversationData {
  title?: string;
  summary?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  tokenCount?: number;
  status?: 'active' | 'archived' | 'deleted';
  model?: string;
  tags?: string;
}

export interface ConversationStatistics {
  total: number;
  active: number;
  archived: number;
  totalTokens: number;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  last_edited_time: string;
}

export interface NotionStatus {
  connected: boolean;
  workspaceName?: string;
  databaseSelected: boolean;
}

export interface StripeCheckoutSession {
  url: string;
}

export interface StripePortalSession {
  url: string;
}

export interface Paged<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const LOCAL_ONLY_MODE = false;

function assertLocalOnly(_feature: string): void {
  // no-op: strict local mode disabled
}

export class ApiService {
  private static getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    // Strict local-only mode protection: prohibit any network requests to /conversations*
    if (LOCAL_ONLY_MODE) {
      const lowerEndpoint = (endpoint || '').toLowerCase();
      if (lowerEndpoint.startsWith('/conversations')) {
        assertLocalOnly(`HTTP ${options.method || 'GET'} ${endpoint}`);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try silent refresh with refreshToken and retry once
        const hasRetried = String((options.headers as Record<string, string> | undefined)?.['x-auth-retry'] || '') === '1';
        if (!hasRetried) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            const retryHeaders: Record<string, string> = {
              ...(options.headers as Record<string, string>),
              'x-auth-retry': '1',
            };
            return this.request<T>(endpoint, { ...options, headers: retryHeaders });
          }
        }

        // Only clear auth for authentication endpoints or explicit logout
        const isAuthEndpoint = endpoint.startsWith('/auth/') || endpoint === '/auth/me';
        const isExplicitLogout = endpoint.includes('/logout');
        if (isAuthEndpoint || isExplicitLogout) {
          this.removeAuthToken();
          this.removeRefreshToken();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('unauthorized'));
          }
        }
        // For non-auth endpoints, throw error without clearing login state
        let errorMessage = 'Authentication failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText;
        }
        throw new ApiError(response.status, errorMessage);
      } else if (response.status === 403) {
        throw new ApiError(response.status, 'Access forbidden');
      } else if (response.status === 404) {
        throw new ApiError(response.status, 'Resource not found');
      } else if (response.status >= 500) {
        throw new ApiError(response.status, 'Server error');
      }

      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new ApiError(response.status, errorMessage);
    }

    return response.json();
  }

  // Local-only conversations store (strict privacy: never send to server)
  private static LOCAL_CONV_KEY = 'local:conversations';

  private static loadLocalConversations(): Conversation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.LOCAL_CONV_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list.map((c: Record<string, unknown>) => {
        const rawMsgs: { role?: unknown; content?: unknown; timestamp?: unknown }[] = Array.isArray((c as Record<string, unknown>)?.messages)
          ? (((c as Record<string, unknown>).messages as unknown[]) as { role?: unknown; content?: unknown; timestamp?: unknown }[])
          : [];
        return {
          id: Number(c?.id) || 0,
          title: String((c as Record<string, unknown>)?.title ?? ''),
          summary: (c as Record<string, unknown>)?.summary ?? undefined,
          messages: rawMsgs.map((m) => ({
            role: (m?.role === 'assistant' ? 'assistant' : m?.role === 'system' ? 'system' : 'user') as 'assistant' | 'system' | 'user',
            content: typeof m?.content === 'string' ? m.content as string : String(m?.content ?? ''),
            timestamp: typeof m?.timestamp === 'string' ? (m.timestamp as string) : new Date().toISOString(),
          })),
          tokenCount: Number((c as Record<string, unknown>)?.tokenCount) || 0,
          status: (c as Record<string, unknown>)?.status === 'archived' ? 'archived' : (c as Record<string, unknown>)?.status === 'deleted' ? 'deleted' : 'active',
          model: (c as Record<string, unknown>)?.model ?? undefined,
          tags: (c as Record<string, unknown>)?.tags ?? undefined,
          userId: Number((c as Record<string, unknown>)?.userId) || 0,
          createdAt: typeof (c as Record<string, unknown>)?.createdAt === 'string' ? (c as Record<string, unknown>).createdAt as string : new Date().toISOString(),
          updatedAt: typeof (c as Record<string, unknown>)?.updatedAt === 'string' ? (c as Record<string, unknown>).updatedAt as string : new Date().toISOString(),
        } as Conversation;
      });
    } catch {
      return [];
    }
  }

  private static saveLocalConversations(list: Conversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.LOCAL_CONV_KEY, JSON.stringify(list));
    } catch {
      // ignore quota or serialization errors
    }
  }

  private static nextConversationId(list: Conversation[]): number {
    const maxId = list.reduce((max, c) => (Number(c.id) > max ? Number(c.id) : max), 0);
    return maxId + 1;
  }

  // New: import conversations (manual JSON import)
  static importConversations(payload: unknown): number {
    const list = this.loadLocalConversations();

    let items: unknown[] = [];
    if (Array.isArray(payload)) {
      items = payload as unknown[];
    } else if (payload && typeof payload === 'object') {
      const obj: Record<string, unknown> = payload as Record<string, unknown>;
      if (Array.isArray(obj.conversations)) {
        items = (obj.conversations as unknown[]) ?? [];
      } else if (Array.isArray(obj.items)) {
        // Compatible with some export formats that use an `items` container
        items = (obj.items as unknown[]) ?? [];
      } else if (Array.isArray(obj.turns)) {
        // Compatible with single-conversation export (e.g., extension export): directly contains a `turns` array
        items = [obj as unknown as Record<string, unknown>];
      } else {
        throw new Error('Invalid import file format. Expected exported JSON (with conversations array), a direct conversations array, or a single conversation with a turns array');
      }
    } else {
      throw new Error('Invalid import file format. Expected exported JSON (with conversations array), a direct conversations array, or a single conversation with a turns array');
    }

    const nowIso = new Date().toISOString();
    let added = 0;

    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      try {
        const input: Record<string, unknown> = raw as Record<string, unknown>;

        const hasMessagesArray = Array.isArray((input as Record<string, unknown>).messages);
        const messages: Conversation['messages'] = hasMessagesArray
          ? ((input as Record<string, unknown>).messages as Array<Record<string, unknown>>).map((m) => ({
              role: m?.role === 'assistant' ? 'assistant' : m?.role === 'system' ? 'system' : 'user',
              content: typeof m?.content === 'string' ? (m.content as string) : String(m?.content ?? ''),
              timestamp: typeof m?.timestamp === 'string' ? (m.timestamp as string) : nowIso,
            }))
          : Array.isArray((input as Record<string, unknown>).turns)
            ? ((input as Record<string, unknown>).turns as Array<Record<string, unknown>>).map((t) => ({
                role: t?.role === 'assistant' ? 'assistant' : t?.role === 'system' ? 'system' : 'user',
                content: typeof t?.content === 'string'
                  ? (t.content as string)
                  : (typeof (t?.content as Record<string, unknown> | undefined)?.text === 'string'
                      ? ((t.content as Record<string, unknown>).text as string)
                      : String((t?.content as Record<string, unknown> | undefined)?.html ?? '')),
                timestamp: typeof t?.timestamp === 'string' ? (t.timestamp as string) : nowIso,
              }))
            : [];

        const conv: Conversation = {
          id: this.nextConversationId(list),
          title: typeof input.title === 'string' ? (input.title as string) : 'Imported Conversation',
          summary: typeof input.summary === 'string' ? (input.summary as string) : undefined,
          messages,
          tokenCount: Number(input.tokenCount) || 0,
          status: (input as Record<string, unknown>).status === 'archived' ? 'archived' : (input as Record<string, unknown>).status === 'deleted' ? 'deleted' : 'active',
          model: typeof input.model === 'string' ? (input.model as string) : undefined,
          tags: typeof input.tags === 'string' ? (input.tags as string) : undefined,
          userId: Number(input.userId) || 0,
          createdAt: typeof input.createdAt === 'string' ? (input.createdAt as string) : nowIso,
          updatedAt: typeof input.updatedAt === 'string' ? (input.updatedAt as string) : nowIso,
        };

        list.push(conv);
        added += 1;
      } catch {
        // Skip a single failure without interrupting the overall import
        continue;
      }
    }

    this.saveLocalConversations(list);
    return added;
  }

  static setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      // Added validation for token before storing
      if (token && token.length > 0) {
        localStorage.setItem('authToken', token);
      }
    }
  }

  private static setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      if (token && token.length > 0) {
        localStorage.setItem('refreshToken', token);
        // Backward compatibility: also write to sessionStorage for existing tabs
        try { sessionStorage.setItem('refreshToken', token); } catch {}
      }
    }
  }

  private static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      const fromLocal = localStorage.getItem('refreshToken');
      if (fromLocal && fromLocal.length > 0) return fromLocal;
      // Backward compatibility: fallback to sessionStorage
      try {
        const fromSession = sessionStorage.getItem('refreshToken');
        return fromSession || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private static removeRefreshToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
      // Cleanup sessionStorage copy as well
      try { sessionStorage.removeItem('refreshToken'); } catch {}
    }
  }

  private static removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      // Just in case any legacy code wrote to sessionStorage
      try { sessionStorage.removeItem('authToken'); } catch {}
    }
  }

  // Try to refresh access token using refreshToken
  private static async refreshAccessToken(): Promise<boolean> {
    const rToken = this.getRefreshToken();
    if (!rToken) return false;
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rToken }),
      });
      if (!resp.ok) {
        // If refresh token is invalid, clear both tokens
        if (resp.status === 401) {
          this.removeAuthToken();
          this.removeRefreshToken();
        }
        return false;
      }
      const data: AuthResponse = await resp.json();
      if (!data?.accessToken || !data?.refreshToken) return false;
      this.setAuthToken(data.accessToken);
      this.setRefreshToken(data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  static async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setAuthToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    return response;
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      }),
    });

    this.setAuthToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    return response;
  }

  static async getCurrentUser(): Promise<User> {
    // Unify to /auth/me so that trial fields (onTrial, trialEndsAt) are returned
    return this.request<User>('/auth/me');
  }

  static async syncSubscription(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/stripe/sync-subscription', {
      method: 'POST',
    });
  }

  static async logout(): Promise<void> {
    this.removeAuthToken();
    this.removeRefreshToken();
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  static getToken(): string | null {
    return this.getAuthToken();
  }

  static async getConversations(status?: string): Promise<Conversation[]> {
    // Local-only: read from localStorage and optionally filter by status
    const list = this.loadLocalConversations();
    const filtered = typeof status === 'string' && status.length > 0
      ? list.filter((c) => c.status === status)
      : list.filter((c) => c.status !== 'deleted');
    // sort by updatedAt desc for a better UX
    filtered.sort((a, b) => (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    return filtered;
  }

  // Return a pseudo-paginated structure from local data for compatibility
  static async getConversationsPaged(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paged<Conversation>> {
    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.max(1, Number(params.limit ?? 20));
    const all = await this.getConversations(params.status);
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);
    return { page, limit, total, totalPages, data: items };
  }

  static async getAllConversations(_limitPerPage = 100): Promise<Conversation[]> {
    // Local-only: simply return all local conversations
    return this.getConversations();
  }

  static async getConversation(id: number): Promise<Conversation> {
    const list = this.loadLocalConversations();
    const conv = list.find((c) => Number(c.id) === Number(id));
    if (!conv) throw new ApiError(404, 'Conversation not found');
    return conv;
  }

  static async createConversation(data: CreateConversationData): Promise<Conversation> {
    const list = this.loadLocalConversations();
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: this.nextConversationId(list),
      title: data.title,
      summary: data.summary,
      messages: Array.isArray(data.messages) ? data.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp ?? now,
      })) : [],
      tokenCount: Number(data.tokenCount ?? 0),
      status: 'active',
      model: data.model,
      tags: data.tags,
      userId: 0,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newConv);
    this.saveLocalConversations(list);
    return newConv;
  }

  static async updateConversation(id: number, data: UpdateConversationData): Promise<Conversation> {
    const list = this.loadLocalConversations();
    const idx = list.findIndex((c) => Number(c.id) === Number(id));
    if (idx === -1) throw new ApiError(404, 'Conversation not found');
    const now = new Date().toISOString();
    const current = list[idx];
    const updated: Conversation = {
      ...current,
      title: data.title ?? current.title,
      summary: data.summary ?? current.summary,
      messages: Array.isArray(data.messages)
        ? data.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp ?? now }))
        : current.messages,
      tokenCount: typeof data.tokenCount === 'number' ? data.tokenCount : current.tokenCount,
      status: (data.status as Conversation['status']) ?? current.status,
      model: data.model ?? current.model,
      tags: data.tags ?? current.tags,
      updatedAt: now,
    };
    list[idx] = updated;
    this.saveLocalConversations(list);
    return updated;
  }

  static async deleteConversation(id: number): Promise<void> {
    const list = this.loadLocalConversations();
    const next = list.filter((c) => Number(c.id) !== Number(id));
    this.saveLocalConversations(next);
  }

  static async archiveConversation(id: number): Promise<Conversation> {
    const list = this.loadLocalConversations();
    const idx = list.findIndex((c) => Number(c.id) === Number(id));
    if (idx === -1) throw new ApiError(404, 'Conversation not found');
    const now = new Date().toISOString();
    list[idx] = { ...list[idx], status: 'archived', updatedAt: now };
    this.saveLocalConversations(list);
    return list[idx];
  }

  static async restoreConversation(id: number): Promise<Conversation> {
    const list = this.loadLocalConversations();
    const idx = list.findIndex((c) => Number(c.id) === Number(id));
    if (idx === -1) throw new ApiError(404, 'Conversation not found');
    const now = new Date().toISOString();
    list[idx] = { ...list[idx], status: 'active', updatedAt: now };
    this.saveLocalConversations(list);
    return list[idx];
  }

  static async addMessageToConversation(id: number, message: { role: string; content: string }): Promise<Conversation> {
    const list = this.loadLocalConversations();
    const idx = list.findIndex((c) => Number(c.id) === Number(id));
    if (idx === -1) throw new ApiError(404, 'Conversation not found');
    const now = new Date().toISOString();
    const msg = { role: (message.role as 'user' | 'assistant' | 'system') ?? 'user', content: message.content, timestamp: now };
    const tokenDelta = typeof message.content === 'string' ? Math.max(1, Math.ceil(message.content.length / 4)) : 0;
    const updated: Conversation = {
      ...list[idx],
      messages: [...list[idx].messages, msg],
      tokenCount: (list[idx].tokenCount || 0) + tokenDelta,
      updatedAt: now,
    };
    list[idx] = updated;
    this.saveLocalConversations(list);
    return updated;
  }

  static async getConversationStatistics(): Promise<ConversationStatistics> {
    const list = this.loadLocalConversations().filter((c) => c.status !== 'deleted');
    const total = list.length;
    const active = list.filter((c) => c.status === 'active').length;
    const archived = list.filter((c) => c.status === 'archived').length;
    const totalTokens = list.reduce((sum, c) => sum + (c.tokenCount || 0), 0);
    return { total, active, archived, totalTokens };
  }

  static clearLocalConversations(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.LOCAL_CONV_KEY);
      } catch {
        // ignore
      }
    }
  }

  static async connectNotion(accessToken: string, workspaceId: string, workspaceName: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/notion/connect', {
      method: 'POST',
      body: JSON.stringify({ accessToken, workspaceId, workspaceName }),
    });
  }

  static async selectNotionDatabase(databaseId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/notion/database', {
      method: 'POST',
      body: JSON.stringify({ databaseId }),
    });
  }

  static async getNotionDatabases(): Promise<{ databases: NotionDatabase[] }> {
    return this.request<{ databases: NotionDatabase[] }>('/notion/databases');
  }

  static async saveToNotion(data: { 
    title: string; 
    content: string; 
    summary?: string; 
    tags?: string 
  }): Promise<{ message: string; url: string }> {
    return this.request<{ message: string; url: string }>('/notion/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async disconnectNotion(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/notion/disconnect', {
      method: 'DELETE',
    });
  }

  static async getNotionStatus(): Promise<{ status: NotionStatus }> {
    return this.request<{ status: NotionStatus }>('/notion/status');
  }

  static async getNotionOAuthUrl(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/notion/oauth/authorize');
  }

  // Google Drive integration
  static async getDriveOAuthUrl(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/drive/oauth/authorize');
  }

  static async connectDrive(accessToken: string, folderId?: string, folderName?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/drive/connect', {
      method: 'POST',
      body: JSON.stringify({ accessToken, folderId, folderName }),
    });
  }

  static async getDriveStatus(): Promise<{ status: DriveStatus }> {
    return this.request<{ status: DriveStatus }>('/drive/status');
  }

  static async getDriveFolders(): Promise<{ folders: DriveFolder[] }> {
    return this.request<{ folders: DriveFolder[] }>('/drive/folders');
  }

  static async selectDriveFolder(folderId: string, folderName?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/drive/folder', {
      method: 'POST',
      body: JSON.stringify({ folderId, folderName }),
    });
  }

  static async saveToDrive(data: { title: string; content: string; summary?: string; tags?: string }): Promise<{ message: string; url: string }> {
    return this.request<{ message: string; url: string }>('/drive/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async disconnectDrive(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/drive/disconnect', { method: 'DELETE' });
  }

  static async createStripeCheckoutSession(priceId: string, successUrl: string, cancelUrl: string): Promise<StripeCheckoutSession> {
    return this.request<StripeCheckoutSession>('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ priceId, successUrl, cancelUrl }),
    });
  }

  static async createStripePortalSession(returnUrl: string): Promise<StripePortalSession> {
    return this.request<StripePortalSession>('/stripe/create-portal-session', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    });
  }

  static async me(): Promise<User> {
    return this.request<User>('/auth/me', { method: 'GET' });
  }

  static async startTrial(): Promise<{ message: string; onTrial: boolean; trialEndsAt: string; remainingSeconds?: number }> {
    return this.request('/auth/start-trial', { method: 'POST' });
  }
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface DriveStatus {
  connected: boolean;
  folderSelected: boolean;
  folderName?: string;
}

const RESOLVED_API_BASE_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  try {
    // Default fixed to 3007
    if (!raw || raw.trim() === '') {
      return 'http://localhost:3007';
    }
    const u = new URL(raw);
    const isLocalHost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (isLocalHost) {
      const port = u.port || '';
      if (port !== '' && port !== '3007') {
        u.port = '3007';
        return `${u.protocol}//${u.hostname}:${u.port}`;
      }
      // Local but no explicit port, default to 3007
      if (port === '') {
        return `${u.protocol}//${u.hostname}:3007`;
      }
    }
    // Keep remote environment as is
    return raw;
  } catch {
    // Environment variable is not a valid URL
    return 'http://localhost:3007';
  }
})();

export const API_BASE_URL = RESOLVED_API_BASE_URL;