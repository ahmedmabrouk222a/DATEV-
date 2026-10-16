'use client';
import { useState, useRef } from 'react';

interface Props {
  currentUser: string;
  viewingUser: string;
  isSaving: boolean;
  onSwitchUser: (username: string) => void;
  onReset: (username: string | 'ALL') => void;
  onExport: (username: string) => void;
  onImport: (username: string, json: string) => void;
  onLogout: () => void;
}

const STUDENTS = Array.from({ length: 10 }, (_, i) => `user${i + 1}`);

export default function AdminBar({
  currentUser, viewingUser, isSaving,
  onSwitchUser, onReset, onExport, onImport, onLogout
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState('');

  const handleImportClick = (username: string) => {
    setImportTarget(username);
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      onImport(importTarget, json);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="admin-bar" style={{ position: 'relative' }}>
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />

      <span style={{ fontWeight: 'bold', marginRight: '4px' }}>👑 ADMIN: {currentUser}</span>
      <span style={{ opacity: 0.7 }}>|</span>
      <span style={{ marginLeft: '4px' }}>Ansicht: <strong>{viewingUser}</strong></span>
      {isSaving && <span style={{ marginLeft: '8px', opacity: 0.8 }}>💾 Speichern...</span>}

      <span style={{ flex: 1 }} />

      {/* Switch user dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className="datev-btn"
          style={{ background: '#AA0000', color: 'white', border: '1px solid #880000' }}
          onClick={() => setShowMenu(!showMenu)}
          id="admin-switch-btn"
        >
          👤 Benutzer wechseln ▾
        </button>

        {showMenu && (
          <div className="context-menu" style={{ right: 0, top: '100%', width: '320px' }}
            onMouseLeave={() => setShowMenu(false)}>
            {STUDENTS.map(u => (
              <div key={u} style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', gap: '4px' }}>
                <button
                  className="datev-btn"
                  style={{ flex: 1, background: viewingUser === u ? '#FFD700' : undefined }}
                  onClick={() => { onSwitchUser(u); setShowMenu(false); }}
                >
                  {u}
                </button>
                <button className="datev-btn" style={{ fontSize: '10px' }} onClick={() => onExport(u)} title="Export">📥</button>
                <button className="datev-btn" style={{ fontSize: '10px' }} onClick={() => handleImportClick(u)} title="Import">📤</button>
                <button className="datev-btn" style={{ fontSize: '10px', color: 'red' }} onClick={() => onReset(u)} title="Reset">🔄</button>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #A0A0A0', padding: '4px' }}>
              <button
                className="datev-btn"
                style={{ width: '100%', color: 'red', fontWeight: 'bold' }}
                onClick={() => { if (confirm('ALLE 10 Arbeitsbereiche zurücksetzen?')) { onReset('ALL'); setShowMenu(false); } }}
                id="admin-reset-all-btn"
              >
                ⚠ ALLE Arbeitsbereiche zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="datev-btn" style={{ background: '#550000', color: 'white', border: '1px solid #330000' }}
        onClick={() => onExport(viewingUser)} id="admin-export-btn">
        📥 Export
      </button>

      <button className="datev-btn" style={{ background: '#003399', color: 'white', border: '1px solid #001177' }}
        onClick={onLogout} id="admin-logout-btn">
        Abmelden
      </button>
    </div>
  );
}
