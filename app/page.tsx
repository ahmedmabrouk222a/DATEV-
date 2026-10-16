'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { authenticate, loadWorkspace, saveWorkspace, resetWorkspace, resetAllWorkspaces, exportWorkspace, importWorkspace } from '@/lib/storage';
import { WorkspaceData, DEFAULT_WORKSPACE } from '@/lib/types';
import LoginScreen from '@/components/LoginScreen';
import DATEVApp from '@/components/DATEVApp';
import AdminBar from '@/components/AdminBar';

// ---- App Context ----
interface AppContextType {
  currentUser: string;
  role: 'admin' | 'student';
  viewingUser: string; // admin can view any user
  workspace: WorkspaceData;
  updateWorkspace: (data: Partial<WorkspaceData>) => void;
  isSaving: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppContext');
  return ctx;
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const [viewingUser, setViewingUser] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceData>(DEFAULT_WORKSPACE);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUserWorkspace = useCallback(async (username: string) => {
    setLoading(true);
    const data = await loadWorkspace(username);
    setWorkspace(data);
    setViewingUser(username);
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const result = await authenticate(username, password);
    if (!result) throw new Error('Ungültige Anmeldedaten');
    setCurrentUser(username);
    setRole(result.role);
    const targetUser = result.role === 'admin' ? 'user1' : username;
    await loadUserWorkspace(targetUser);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser('');
    setRole('student');
    setViewingUser('');
  };

  const updateWorkspace = useCallback((partial: Partial<WorkspaceData>) => {
    setWorkspace(prev => {
      const updated = { ...prev, ...partial };
      // Auto-save (debounced via useEffect below)
      return updated;
    });
  }, []);

  // Auto-save on workspace changes
  useEffect(() => {
    if (!viewingUser || !loggedIn) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      await saveWorkspace(viewingUser, workspace);
      setIsSaving(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [workspace, viewingUser, loggedIn]);

  const handleAdminSwitchUser = async (username: string) => {
    await loadUserWorkspace(username);
  };

  const handleAdminReset = async (username: string | 'ALL') => {
    if (username === 'ALL') {
      await resetAllWorkspaces();
      if (viewingUser) await loadUserWorkspace(viewingUser);
    } else {
      await resetWorkspace(username);
      if (viewingUser === username) await loadUserWorkspace(username);
    }
  };

  const handleAdminExport = async (username: string) => {
    const json = await exportWorkspace(username);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datev_${username}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdminImport = async (username: string, json: string) => {
    const data = await importWorkspace(username, json);
    if (viewingUser === username) setWorkspace(data);
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-200">
        <div className="datev-window p-8 text-center">
          <div className="text-sm">Lade Daten...</div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ currentUser, role, viewingUser, workspace, updateWorkspace, isSaving }}>
      <div className="flex flex-col h-screen overflow-hidden">
        {role === 'admin' && (
          <AdminBar
            currentUser={currentUser}
            viewingUser={viewingUser}
            isSaving={isSaving}
            onSwitchUser={handleAdminSwitchUser}
            onReset={handleAdminReset}
            onExport={handleAdminExport}
            onImport={handleAdminImport}
            onLogout={handleLogout}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <DATEVApp onLogout={role === 'student' ? handleLogout : undefined} />
        </div>
      </div>
    </AppContext.Provider>
  );
}
