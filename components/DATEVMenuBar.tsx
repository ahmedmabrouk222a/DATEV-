'use client';
import { useState } from 'react';
import type { ActiveModule } from './DATEVApp';

interface Props {
  onNavigate: (module: ActiveModule) => void;
  onLogout?: () => void;
}

type MenuKey = 'datei' | 'bearbeiten' | 'ansicht' | 'erfassen' | 'stammdaten' | 'auswertungen' | 'extras' | 'fenster' | 'hilfe' | null;

export default function DATEVMenuBar({ onNavigate, onLogout }: Props) {
  const [open, setOpen] = useState<MenuKey>(null);

  const menus: { key: MenuKey; label: string; items: { label?: string; action?: () => void; divider?: boolean }[] }[] = [
    {
      key: 'datei', label: 'Datei',
      items: [
        { label: 'Öffnen...', action: () => onNavigate('arbeitsplatz') },
        { label: 'Schließen' },
        { divider: true },
        { label: 'Drucken...', action: () => window.print() },
        { divider: true },
        { label: 'Beenden', action: onLogout },
      ]
    },
    {
      key: 'bearbeiten', label: 'Bearbeiten',
      items: [
        { label: 'Rückgängig' },
        { label: 'Wiederholen' },
        { divider: true },
        { label: 'Suchen...' },
      ]
    },
    {
      key: 'ansicht', label: 'Ansicht',
      items: [
        { label: 'Übersicht', action: () => onNavigate('arbeitsplatz') },
        { label: 'Symbolleiste' },
        { label: 'Statusleiste' },
      ]
    },
    {
      key: 'erfassen', label: 'Erfassen',
      items: [
        { label: 'Belege buchen', action: () => onNavigate('belege') },
        { label: 'Kontoblatt', action: () => onNavigate('kontoblatt') },
        { divider: true },
        { label: 'Inventare erfassen', action: () => onNavigate('inventar') },
      ]
    },
    {
      key: 'stammdaten', label: 'Stammdaten',
      items: [
        { label: 'Kontenplan (SKR03)', action: () => onNavigate('kontenplan') },
        { divider: true },
        { label: 'Unternehmen', action: () => onNavigate('arbeitsplatz') },
      ]
    },
    {
      key: 'auswertungen', label: 'Auswertungen',
      items: [
        { label: 'Kontoblatt', action: () => onNavigate('kontoblatt') },
        { label: 'Summen und Salden' },
        { divider: true },
        { label: 'Bilanz / GuV', action: () => onNavigate('bilanz') },
      ]
    },
    {
      key: 'extras', label: 'Extras',
      items: [
        { label: 'Einstellungen...' },
        { label: 'Datenexport' },
      ]
    },
    {
      key: 'fenster', label: 'Fenster',
      items: [
        { label: 'Neues Fenster' },
        { label: 'Anordnen' },
      ]
    },
    {
      key: 'hilfe', label: 'Hilfe',
      items: [
        { label: 'DATEV-Hilfe' },
        { label: 'Informationen...' },
      ]
    },
  ];

  return (
    <div className="datev-menubar" style={{ position: 'relative', zIndex: 100 }}>
      {menus.map(menu => (
        <div key={menu.key} style={{ position: 'relative' }}>
          <div
            className="datev-menu-item"
            style={{ background: open === menu.key ? '#316AC5' : undefined, color: open === menu.key ? 'white' : undefined }}
            onClick={() => setOpen(open === menu.key ? null : menu.key)}
            onMouseEnter={() => open !== null && setOpen(menu.key)}
          >
            {menu.label}
          </div>
          {open === menu.key && (
            <div
              className="context-menu"
              style={{ top: '100%', left: 0, minWidth: '180px' }}
              onMouseLeave={() => setOpen(null)}
            >
              {menu.items.map((item, idx) =>
                item.divider ? (
                  <div key={idx} style={{ height: '1px', background: '#C0C0C0', margin: '2px 0' }} />
                ) : (
                  <div
                    key={idx}
                    className="context-menu-item"
                    onClick={() => { item.action?.(); setOpen(null); }}
                  >
                    {item.label}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
