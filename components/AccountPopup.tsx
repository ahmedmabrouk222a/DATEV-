'use client';
import { useEffect, useRef, useState } from 'react';
import { Account } from '@/lib/types';

interface Props {
  accounts: Account[];
  search: string;
  onSelect: (account: Account) => void;
  onClose: () => void;
}

export default function AccountPopup({ accounts, search, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState(search);
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => { setFilter(search); setHighlighted(0); }, [search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = accounts.filter(a =>
    !filter ||
    a.number.startsWith(filter) ||
    a.name.toLowerCase().includes(filter.toLowerCase()) ||
    (a.beschreibung && a.beschreibung.toLowerCase().includes(filter.toLowerCase()))
  ).slice(0, 60);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlighted]) { e.preventDefault(); onSelect(filtered[highlighted]); }
    if (e.key === 'Escape') onClose();
  };

  // Type badge colors
  const typeBg: Record<string, string> = {
    Aktiva: '#D0E8FF', Passiva: '#FFD0D0', Aufwand: '#FFE8C0',
    Ertrag: '#C0FFD0', Debitor: '#E0D0FF', Kreditor: '#FFD0FF',
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 2000,
        width: '480px',
        background: 'white',
        border: '2px solid #316AC5',
        boxShadow: '3px 3px 8px rgba(0,0,0,0.3)',
        maxHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontSize: '11px',
      }}
    >
      {/* Header */}
      <div style={{ background: '#003399', color: 'white', padding: '3px 6px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>📋</span>
        <span>Kontoauswahl – SKR03</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.8 }}>{filtered.length} Treffer</span>
      </div>

      {/* Search input */}
      <div style={{ padding: '4px 6px', borderBottom: '1px solid #D0D0D0', background: '#F8F8F8' }}>
        <input
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid #316AC5', padding: '2px 6px', fontSize: '11px',
            background: '#FFFFF0',
          }}
          placeholder="Kontonummer oder Bezeichnung suchen..."
          value={filter}
          onChange={e => { setFilter(e.target.value); setHighlighted(0); }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '55px 1fr 55px',
        padding: '2px 6px',
        background: '#E8E8E8',
        borderBottom: '1px solid #C0C0C0',
        fontWeight: 'bold',
        fontSize: '10px',
        color: '#555',
      }}>
        <span>Kontonr.</span>
        <span>Bezeichnung / Erklärung</span>
        <span style={{ textAlign: 'center' }}>Typ</span>
      </div>

      {/* Account list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
            Kein Konto gefunden
          </div>
        )}
        {filtered.map((a, idx) => (
          <div
            key={a.number}
            onMouseDown={() => onSelect(a)}
            onMouseEnter={() => setHighlighted(idx)}
            style={{
              display: 'grid',
              gridTemplateColumns: '55px 1fr 55px',
              padding: '4px 6px',
              cursor: 'pointer',
              borderBottom: '1px solid #F0F0F0',
              background: idx === highlighted ? '#316AC5' : idx % 2 === 0 ? '#FFFFFF' : '#F8F8F8',
              color: idx === highlighted ? 'white' : 'inherit',
              alignItems: 'start',
            }}
          >
            {/* Account number */}
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px', paddingTop: '1px' }}>
              {a.number}
            </span>

            {/* Name + Description */}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{a.name}</div>
              {a.beschreibung && (
                <div style={{
                  fontSize: '10px',
                  color: idx === highlighted ? 'rgba(255,255,255,0.85)' : '#555',
                  marginTop: '1px',
                  lineHeight: '1.3',
                }}>
                  {a.beschreibung}
                </div>
              )}
            </div>

            {/* Type badge */}
            <div style={{ textAlign: 'center', paddingTop: '1px' }}>
              <span style={{
                padding: '1px 4px',
                borderRadius: '2px',
                fontSize: '9px',
                fontWeight: 'bold',
                background: idx === highlighted ? 'rgba(255,255,255,0.25)' : (typeBg[a.type] || '#E0E0E0'),
                color: idx === highlighted ? 'white' : '#333',
                border: idx === highlighted ? '1px solid rgba(255,255,255,0.4)' : '1px solid #D0D0D0',
                whiteSpace: 'nowrap',
              }}>
                {a.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div style={{ padding: '3px 6px', background: '#F0F0F0', borderTop: '1px solid #D0D0D0', fontSize: '10px', color: '#666', display: 'flex', gap: '12px' }}>
        <span>↑↓ Navigieren</span>
        <span>Enter – Auswählen</span>
        <span>Esc – Schließen</span>
      </div>
    </div>
  );
}
