// ============================================================
// DATEV ERP - Hybrid Storage Manager
// Falls back to localStorage if Supabase is not configured
// ============================================================

import { WorkspaceData, DEFAULT_WORKSPACE } from './types';

const STORAGE_KEY = 'datev_workspaces_v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// ---- LocalStorage helpers (works offline) ----

function getLocalStore(): Record<string, WorkspaceData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalStore(store: Record<string, WorkspaceData>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ---- Supabase REST helpers (no SDK needed for simple ops) ----

async function supabaseFetch(path: string, options?: RequestInit) {
  if (!isSupabaseConfigured) return null;
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...(options?.headers || {}),
    },
  });
  return res;
}

// ---- Public API ----

export async function loadWorkspace(username: string): Promise<WorkspaceData> {
  // Try Supabase first
  if (isSupabaseConfigured) {
    try {
      const res = await supabaseFetch(`workspaces?username=eq.${encodeURIComponent(username)}&select=data`);
      if (res?.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].data && Object.keys(rows[0].data).length > 0) {
          const remoteData = rows[0].data as WorkspaceData;
          // Sync to localStorage as backup
          const store = getLocalStore();
          store[username] = remoteData;
          setLocalStore(store);
          return mergeWithDefaults(remoteData);
        }
      }
    } catch (e) {
      console.warn('Supabase load failed, using localStorage:', e);
    }
  }

  // Fall back to localStorage
  const store = getLocalStore();
  if (store[username] && Object.keys(store[username]).length > 0) {
    return mergeWithDefaults(store[username]);
  }

  // Return defaults
  return structuredClone(DEFAULT_WORKSPACE);
}

export async function saveWorkspace(username: string, data: WorkspaceData): Promise<void> {
  // Always save to localStorage first (instant)
  const store = getLocalStore();
  store[username] = data;
  setLocalStore(store);

  // Then sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabaseFetch(`workspaces?username=eq.${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
        headers: { 'Prefer': 'return=minimal' },
      });
    } catch (e) {
      console.warn('Supabase save failed, data saved locally:', e);
    }
  }
}

export async function resetWorkspace(username: string): Promise<WorkspaceData> {
  const fresh = structuredClone(DEFAULT_WORKSPACE);
  await saveWorkspace(username, fresh);
  return fresh;
}

export async function resetAllWorkspaces(): Promise<void> {
  const students = Array.from({ length: 10 }, (_, i) => `user${i + 1}`);
  await Promise.all(students.map(u => resetWorkspace(u)));
}

export async function exportWorkspace(username: string): Promise<string> {
  const data = await loadWorkspace(username);
  return JSON.stringify({ username, data, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importWorkspace(username: string, jsonString: string): Promise<WorkspaceData> {
  const parsed = JSON.parse(jsonString);
  const data = parsed.data as WorkspaceData;
  await saveWorkspace(username, data);
  return data;
}

// ---- Auth ----

const USERS: Record<string, { password: string; role: 'admin' | 'student' }> = {
  admin: { password: 'admin123', role: 'admin' },
  user1: { password: '1001', role: 'student' },
  user2: { password: '1002', role: 'student' },
  user3: { password: '1003', role: 'student' },
  user4: { password: '1004', role: 'student' },
  user5: { password: '1005', role: 'student' },
  user6: { password: '1006', role: 'student' },
  user7: { password: '1007', role: 'student' },
  user8: { password: '1008', role: 'student' },
  user9: { password: '1009', role: 'student' },
  user10: { password: '1010', role: 'student' },
};

export async function authenticate(username: string, password: string): Promise<{ role: 'admin' | 'student' } | null> {
  // Try Supabase auth first
  if (isSupabaseConfigured) {
    try {
      const res = await supabaseFetch(`workspaces?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}&select=username,role`);
      if (res?.ok) {
        const rows = await res.json();
        if (rows.length > 0) {
          return { role: rows[0].role };
        }
      }
    } catch (e) {
      console.warn('Supabase auth failed, using local:', e);
    }
  }
  // Local fallback
  const u = USERS[username];
  if (u && u.password === password) return { role: u.role };
  return null;
}

function mergeWithDefaults(data: Partial<WorkspaceData>): WorkspaceData {
  return {
    ...DEFAULT_WORKSPACE,
    ...data,
    accounts: data.accounts?.length ? data.accounts : DEFAULT_WORKSPACE.accounts,
    companies: data.companies?.length ? data.companies : DEFAULT_WORKSPACE.companies,
    inventar: data.inventar?.length ? data.inventar : DEFAULT_WORKSPACE.inventar,
    stapel: data.stapel?.length ? data.stapel : DEFAULT_WORKSPACE.stapel,
    buchungen: data.buchungen || [],
  };
}
