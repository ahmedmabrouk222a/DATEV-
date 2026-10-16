'use client';
import { useState } from 'react';
import { useApp } from '@/app/page';
import DATEVMenuBar from './DATEVMenuBar';
import DATEVToolbar from './DATEVToolbar';
import LeftNavPanel from './LeftNavPanel';
import ArbeitsplatzModule from './modules/ArbeitsplatzModule';
import KontenplanModule from './modules/KontenplanModule';
import InventarModule from './modules/InventarModule';
import BelegeModule from './modules/BelegeModule';
import KontoblattModule from './modules/KontoblattModule';
import BilanzModule from './modules/BilanzModule';

export type ActiveModule =
  | 'arbeitsplatz'
  | 'kontenplan'
  | 'inventar'
  | 'belege'
  | 'kontoblatt'
  | 'bilanz';

interface Props {
  onLogout?: () => void;
}

export default function DATEVApp({ onLogout }: Props) {
  const { currentUser, viewingUser, workspace, isSaving } = useApp();
  const [activeModule, setActiveModule] = useState<ActiveModule>('arbeitsplatz');
  const [activeCompanyId, setActiveCompanyId] = useState(workspace.activeCompanyId || '1');

  const activeCompany = workspace.companies.find(c => c.id === activeCompanyId) || workspace.companies[0];
  const titleStr = activeCompany
    ? `${activeCompany.nummer} / ${activeCompany.name} / 129805 / ${activeCompany.nummer} / 2026 - RW`
    : 'DATEV Arbeitsplatz V.17.1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ECE9D8' }}>
      {/* DATEV Title Bar */}
      <div className="datev-titlebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '22px', height: '22px', background: '#CC3300', borderRadius: '2px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #AA2200'
          }}>
            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>D</span>
          </div>
          <span style={{ fontSize: '11px' }}>
            {titleStr} &nbsp;&nbsp; Kanzlei-Rechnungswesen V.8.27
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <input
            placeholder="LEXinform/Info-Datenbank"
            style={{
              width: '180px', height: '18px', fontSize: '10px',
              border: '1px solid #7F9DB9', background: 'white', padding: '1px 4px'
            }}
          />
          <button className="datev-btn" style={{ padding: '1px 4px', height: '20px' }}>🔍</button>
          <span style={{ margin: '0 4px' }}>─</span>
          <button style={{
            width: '18px', height: '18px', background: '#C0C0C0', border: '1px solid #808080',
            cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>_</button>
          <button style={{
            width: '18px', height: '18px', background: '#C0C0C0', border: '1px solid #808080',
            cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>□</button>
          <button style={{
            width: '18px', height: '18px', background: '#FF6040', border: '1px solid #AA2200',
            cursor: 'pointer', fontSize: '10px', color: 'white', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={onLogout}>✕</button>
        </div>
      </div>

      {/* Menu Bar */}
      <DATEVMenuBar onNavigate={setActiveModule} onLogout={onLogout} />

      {/* Toolbar */}
      <DATEVToolbar activeModule={activeModule} onNavigate={setActiveModule} />

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Navigation */}
        <LeftNavPanel activeModule={activeModule} onNavigate={setActiveModule} />

        {/* Main Panel */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeModule === 'arbeitsplatz' && (
            <ArbeitsplatzModule
              onOpenBuchfuehrung={(companyId) => {
                setActiveCompanyId(companyId);
                setActiveModule('belege');
              }}
              onOpenBilanz={() => setActiveModule('bilanz')}
            />
          )}
          {activeModule === 'kontenplan' && <KontenplanModule />}
          {activeModule === 'inventar' && <InventarModule onNavigateToBelege={() => setActiveModule('belege')} />}
          {activeModule === 'belege' && <BelegeModule />}
          {activeModule === 'kontoblatt' && <KontoblattModule />}
          {activeModule === 'bilanz' && <BilanzModule />}
        </div>
      </div>

      {/* Status Bar */}
      <div className="datev-status-bar">
        <div>Benutzer: {viewingUser}</div>
        <div style={{ color: '#666' }}>|</div>
        <div>EUR</div>
        <div style={{ color: '#666' }}>|</div>
        <div style={{ flex: 1, fontSize: '10px', color: '#666' }}>
          C:\DATEV\DATEN\RWDAT\DATA\STANDARD
        </div>
        {isSaving && <div style={{ color: '#0052CC' }}>💾 Speichern...</div>}
      </div>
    </div>
  );
}
