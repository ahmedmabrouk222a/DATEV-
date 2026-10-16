'use client';
import { useState } from 'react';
import type { ActiveModule } from './DATEVApp';

interface Props {
  activeModule: ActiveModule;
  onNavigate: (module: ActiveModule) => void;
}

interface NavGroup {
  key: string;
  label: string;
  icon: string;
  children: { key: ActiveModule | string; label: string; isLeaf?: boolean }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'buchfuehrung', label: 'Buchführung', icon: '📒',
    children: [
      { key: '_top', label: 'Top-Themen' },
      { key: '_vort', label: 'Vorbereitende Tätigkeiten' },
      { key: 'belege', label: 'Belege buchen', isLeaf: true },
      { key: '_kredit', label: 'Kredite' },
      { key: 'inventar', label: 'Anlagenbuchführung', isLeaf: true },
      { key: '_abstimm', label: 'Buchführung abstimmen' },
      { key: '_fin', label: 'Finanzbuchführung auswerten' },
      { key: '_deb', label: 'Debitoren' },
      { key: '_kred', label: 'Kreditoren' },
      { key: '_kost', label: 'Kosten- und Leistungsrechnung' },
      { key: '_per', label: 'Buchungsperiode abschließen' },
      { key: '_abs', label: 'Abschließende Tätigkeiten' },
    ]
  },
];

const BOTTOM_NAV = [
  { key: 'buchfuehrung', label: 'Buchführung', icon: '📒' },
  { key: 'bilanz', label: 'Jahresabschluss', icon: '📊' },
  { key: '_analyse', label: 'Analyse und Planung', icon: '📈' },
  { key: 'kontenplan', label: 'Stammdaten', icon: '🗂️' },
  { key: '_basis', label: 'Basisdienste', icon: '⚙️' },
];

const SUB_ITEMS: Record<string, { key: string; label: string; module?: ActiveModule }[]> = {
  inventar: [
    { key: 'inv1', label: 'Inventare aus Buchung...' },
    { key: 'inv2', label: 'Inventare erfassen', module: 'inventar' },
    { key: 'inv3', label: 'Inventarübersicht', module: 'inventar' },
    { key: 'inv4', label: 'Bewegungsübersicht' },
    { key: 'inv5', label: 'Buchungen erzeugen', module: 'inventar' },
    { key: 'inv6', label: 'Abstimmung Anlagenbu...' },
    { key: 'inv7', label: 'Entwicklung des Anlage...' },
  ],
  _fin: [
    { key: 'fin1', label: 'Betriebswirtschaftliche...' },
    { key: 'fin2', label: 'Controllingreport' },
    { key: 'fin3', label: 'Steuervorauszahlungen' },
    { key: 'fin4', label: 'Branchenauswertungen' },
    { key: 'fin5', label: 'Summen- und Saldenliste' },
    { key: 'fin6', label: 'Kontoblatt', module: 'kontoblatt' },
    { key: 'fin7', label: 'Arbeitskonto' },
    { key: 'fin8', label: 'Kassen-/Bankbericht' },
    { key: 'fin9', label: 'Umsatzsteuer-Voranmel...' },
    { key: 'fin10', label: 'Zusammenfassende Me...' },
    { key: 'fin11', label: 'Primanota' },
    { key: 'fin12', label: 'Buchungsübersicht' },
  ],
  _deb: [
    { key: 'd1', label: 'OPOS-Konto' },
    { key: 'd2', label: 'OPOS-Liste' },
    { key: 'd3', label: 'Mahnwesen' },
    { key: 'd4', label: 'Lastschriften' },
    { key: 'd5', label: 'ABC-Analyse' },
    { key: 'd6', label: 'Debitorenstammdaten' },
  ],
  _kred: [
    { key: 'k1', label: 'OPOS-Konto' },
    { key: 'k2', label: 'OPOS-Liste' },
    { key: 'k3', label: 'Zahlungen' },
    { key: 'k4', label: 'ABC-Analyse' },
    { key: 'k5', label: 'Kreditorenstammdaten' },
  ],
};

export default function LeftNavPanel({ activeModule, onNavigate }: Props) {
  const [activeBottomKey, setActiveBottomKey] = useState('buchfuehrung');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ buchfuehrung: true, inventar: false, _fin: false, _deb: false, _kred: false });

  const toggleExpand = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{
      width: '200px', minWidth: '180px', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #A0A0A0', background: 'white', overflow: 'hidden'
    }}>
      {/* Panel header */}
      <div style={{
        background: '#F0F0F0', borderBottom: '1px solid #A0A0A0', padding: '2px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px'
      }}>
        <strong>Übersicht</strong>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="datev-btn" style={{ padding: '0 3px', height: '16px', fontSize: '10px' }}>📌</button>
          <button className="datev-btn" style={{ padding: '0 3px', height: '16px', fontSize: '10px' }}>✕</button>
        </div>
      </div>

      {/* Section label */}
      <div className="datev-tree-group" style={{ background: '#B5E6A2' }}>
        <span>📒</span> Buchführung
      </div>

      {/* Tree Items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {NAV_GROUPS[0].children.map(child => {
          const subItems = SUB_ITEMS[child.key];
          const isExpanded = expanded[child.key];

          if (subItems) {
            return (
              <div key={child.key}>
                <div
                  className="datev-tree-item"
                  style={{ paddingLeft: '8px', background: activeModule === child.key ? '#FFFF99' : undefined, fontWeight: 'bold' }}
                  onClick={() => { toggleExpand(child.key); if (child.isLeaf) onNavigate(child.key as ActiveModule); }}
                >
                  <span style={{ fontSize: '10px', width: '12px', display: 'inline-block' }}>{isExpanded ? '▼' : '▶'}</span>
                  <span style={{ fontSize: '11px' }}>📁</span>
                  <span>{child.label}</span>
                </div>
                {isExpanded && subItems.map(sub => (
                  <div
                    key={sub.key}
                    className="datev-tree-item"
                    style={{
                      paddingLeft: '28px',
                      background: sub.module && activeModule === sub.module ? '#FFFF99' : undefined,
                    }}
                    onClick={() => sub.module && onNavigate(sub.module as ActiveModule)}
                  >
                    <span style={{ fontSize: '10px' }}>📄</span>
                    <span style={{ fontSize: '11px' }}>{sub.label}</span>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div
              key={child.key}
              className={`datev-tree-item ${activeModule === child.key ? 'active' : ''}`}
              style={{ paddingLeft: '20px' }}
              onClick={() => child.isLeaf && onNavigate(child.key as ActiveModule)}
            >
              <span style={{ fontSize: '10px' }}>{child.isLeaf ? '📄' : '📁'}</span>
              <span style={{ fontSize: '11px' }}>{child.label}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div style={{ borderTop: '1px solid #A0A0A0' }}>
        {BOTTOM_NAV.map(item => (
          <div
            key={item.key}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              borderBottom: '1px solid #D0D0D0',
              background: activeBottomKey === item.key ? '#E0E8FF' : '#F8F8F8',
            }}
            onClick={() => {
              setActiveBottomKey(item.key);
              if (item.key !== '_analyse' && item.key !== '_basis') {
                onNavigate(item.key as ActiveModule);
              }
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
