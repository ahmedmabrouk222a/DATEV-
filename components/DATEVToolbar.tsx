'use client';
import type { ActiveModule } from './DATEVApp';

interface Props {
  activeModule: ActiveModule;
  onNavigate: (module: ActiveModule) => void;
}

interface ToolBtn {
  icon: string;
  label: string;
  action?: () => void;
  separator?: boolean;
}

export default function DATEVToolbar({ activeModule, onNavigate }: Props) {
  const buttons: ToolBtn[] = [
    { icon: '📁', label: 'Öffnen', action: () => onNavigate('arbeitsplatz') },
    { icon: '🖨️', label: 'Drucken', action: () => window.print() },
    { separator: true, icon: '', label: '' },
    { icon: '✂️', label: 'Ausschneiden' },
    { icon: '📋', label: 'Kopieren' },
    { icon: '📌', label: 'Einfügen' },
    { separator: true, icon: '', label: '' },
    { icon: '🏢', label: 'Unternehmen', action: () => onNavigate('arbeitsplatz') },
    { icon: '📚', label: 'Konten', action: () => onNavigate('kontenplan') },
    { icon: '🗂️', label: 'Inventar', action: () => onNavigate('inventar') },
    { icon: '📝', label: 'Buchen', action: () => onNavigate('belege') },
    { icon: '📊', label: 'Kontoblatt', action: () => onNavigate('kontoblatt') },
    { icon: '⚖️', label: 'Bilanz', action: () => onNavigate('bilanz') },
    { separator: true, icon: '', label: '' },
    { icon: '❓', label: 'Hilfe' },
  ];

  return (
    <div className="datev-toolbar">
      {buttons.map((btn, idx) =>
        btn.separator ? (
          <div key={idx} style={{ width: '1px', background: '#A0A0A0', height: '18px', margin: '0 3px' }} />
        ) : (
          <button
            key={idx}
            className="datev-btn"
            style={{
              padding: '1px 4px',
              height: '22px',
              background: activeModule === btn.label?.toLowerCase() ? '#D0E8FF' : undefined,
              minWidth: '24px',
            }}
            onClick={btn.action}
            title={btn.label}
          >
            <span style={{ fontSize: '13px' }}>{btn.icon}</span>
          </button>
        )
      )}

      {/* Date selector on right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '11px' }}>◀</span>
        <select className="datev-select" style={{ width: '110px', fontSize: '11px' }}>
          <option>01.01.2026</option>
          <option>01.01.2025</option>
        </select>
        <span style={{ fontSize: '11px' }}>▶</span>
      </div>
    </div>
  );
}
