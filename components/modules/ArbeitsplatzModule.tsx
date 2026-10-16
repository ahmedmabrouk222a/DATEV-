'use client';
import { useState } from 'react';
import { useApp } from '@/app/page';
import { Company } from '@/lib/types';

interface Props {
  onOpenBuchfuehrung: (companyId: string) => void;
  onOpenBilanz: () => void;
}

const EMPTY_COMPANY: Omit<Company, 'id'> = {
  nummer: '', name: '', typ: 'GmbH', plz: '', ort: '', strasse: '', telefon: ''
};

export default function ArbeitsplatzModule({ onOpenBuchfuehrung, onOpenBilanz }: Props) {
  const { workspace, updateWorkspace } = useApp();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(workspace.activeCompanyId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ ...EMPTY_COMPANY });
  const [activeView, setActiveView] = useState<'unternehmens' | 'anwendung'>('unternehmens');

  const filtered = workspace.companies.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nummer.includes(search) || c.ort.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCompany = workspace.companies.find(c => c.id === selectedId);

  const handleAddCompany = () => {
    if (!newCompany.nummer || !newCompany.name) return;
    const company: Company = { ...newCompany, id: Date.now().toString() };
    updateWorkspace({ companies: [...workspace.companies, company] });
    setNewCompany({ ...EMPTY_COMPANY });
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Unternehmen löschen?')) return;
    updateWorkspace({ companies: workspace.companies.filter(c => c.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const handleSelectCompany = (id: string) => {
    setSelectedId(id);
    updateWorkspace({ activeCompanyId: id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab header */}
      <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0' }}>
        <div className="datev-tab active">DATEV Arbeitsplatz V.17.1</div>
      </div>

      {/* Left tree + right content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left mini-tree */}
        <div style={{ width: '220px', borderRight: '1px solid #A0A0A0', background: 'white', overflowY: 'auto' }}>
          <div className="datev-section-header">Unser Unternehmen</div>
          <div
            className={`datev-tree-item ${activeView === 'unternehmens' ? 'active' : ''}`}
            style={{ paddingLeft: '16px' }}
            onClick={() => setActiveView('unternehmens')}
          >
            <span>🏢</span> Unternehmensübersicht
          </div>
          <div
            className={`datev-tree-item ${activeView === 'anwendung' ? 'active' : ''}`}
            style={{ paddingLeft: '16px' }}
            onClick={() => setActiveView('anwendung')}
          >
            <span>📋</span> Anwendungsübersicht
          </div>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {activeView === 'unternehmens' && (
            <>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="datev-section-header" style={{ padding: '2px 8px', marginBottom: 0 }}>
                  Aktive Unternehmen
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px' }}>Schnellsuche:</span>
                  <input
                    className="datev-input"
                    style={{ width: '180px' }}
                    placeholder="Name, Nummer oder Ort..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    id="company-search"
                  />
                </div>
                <button className="datev-btn" style={{ background: '#B5E6A2' }}
                  onClick={() => setShowAddModal(true)} id="add-company-btn">
                  + Unternehmen anlegen
                </button>
              </div>

              {/* Companies Table */}
              <div style={{ border: '1px solid #A0A0A0', overflowX: 'auto' }}>
                <table className="datev-table" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      <th>Unternehmensnummer</th>
                      <th>Name</th>
                      <th>Typ</th>
                      <th>PLZ</th>
                      <th>Ort</th>
                      <th>Straße</th>
                      <th>Telefon</th>
                      <th style={{ width: '60px' }}>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(company => (
                      <tr
                        key={company.id}
                        className={selectedId === company.id ? 'selected' : ''}
                        onClick={() => handleSelectCompany(company.id)}
                        onDoubleClick={() => onOpenBuchfuehrung(company.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: '16px', height: '16px', background: '#003399', display: 'inline-block', borderRadius: '2px' }}
                            title="Aktiv" />
                        </td>
                        <td>{company.nummer}</td>
                        <td style={{ fontWeight: selectedId === company.id ? 'bold' : undefined }}>{company.name}</td>
                        <td>{company.typ}</td>
                        <td>{company.plz}</td>
                        <td>{company.ort}</td>
                        <td>{company.strasse}</td>
                        <td>{company.telefon}</td>
                        <td>
                          <button className="datev-btn" style={{ padding: '0 4px', fontSize: '10px', color: 'red' }}
                            onClick={e => { e.stopPropagation(); handleDelete(company.id); }}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        Keine Unternehmen gefunden
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '6px', fontSize: '10px', color: '#666' }}>
                {filtered.length} Unternehmen | Doppelklick zum Öffnen der Buchführung
              </div>
            </>
          )}

          {activeView === 'anwendung' && selectedCompany && (
            <>
              <div className="datev-section-header" style={{ marginBottom: '8px' }}>
                Anwendungsübersicht – {selectedCompany.nummer} {selectedCompany.name}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Buchführung Card */}
                <div style={{
                  border: '1px solid #A0A0A0', background: 'white', width: '200px',
                  cursor: 'pointer', padding: '0'
                }}
                  onClick={() => onOpenBuchfuehrung(selectedCompany.id)}>
                  <div style={{ background: '#B5E6A2', padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #A0A0A0' }}>
                    📒 Buchführung 2026
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px' }}>
                    <div>Wirtschaftsjahr: 2026</div>
                    <div style={{ color: '#0052CC', marginTop: '4px' }}>➔ Belege buchen</div>
                    <div style={{ color: '#0052CC' }}>➔ Kontoblatt</div>
                    <div style={{ marginTop: '8px', padding: '4px', background: '#F0F0F0', fontSize: '10px' }}>
                      Klicken zum Öffnen
                    </div>
                  </div>
                </div>

                {/* Jahresabschluss Card */}
                <div style={{
                  border: '1px solid #A0A0A0', background: 'white', width: '200px',
                  cursor: 'pointer', padding: '0'
                }}
                  onClick={() => onOpenBilanz()}>
                  <div style={{ background: '#FFE8A0', padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #A0A0A0' }}>
                    📊 Jahresabschluss 2026
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px' }}>
                    <div>Wirtschaftsjahr: 2026</div>
                    <div style={{ color: '#0052CC', marginTop: '4px' }}>➔ Bilanz</div>
                    <div style={{ color: '#0052CC' }}>➔ GuV</div>
                    <div style={{ marginTop: '8px', padding: '4px', background: '#F0F0F0', fontSize: '10px' }}>
                      Klicken zum Öffnen
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeView === 'anwendung' && !selectedCompany && (
            <div className="no-data-placeholder">
              <div style={{ fontSize: '40px' }}>🏢</div>
              <div>Bitte ein Unternehmen auswählen</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Neues Unternehmen anlegen</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { key: 'nummer', label: 'Unternehmensnummer *' },
                    { key: 'name', label: 'Name *' },
                    { key: 'typ', label: 'Typ' },
                    { key: 'plz', label: 'PLZ' },
                    { key: 'ort', label: 'Ort' },
                    { key: 'strasse', label: 'Straße' },
                    { key: 'telefon', label: 'Telefon' },
                  ].map(field => (
                    <tr key={field.key} style={{ marginBottom: '6px' }}>
                      <td style={{ padding: '3px 8px 3px 0', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '160px' }}>
                        {field.label}:
                      </td>
                      <td>
                        {field.key === 'typ' ? (
                          <select
                            className="datev-select"
                            style={{ width: '100%' }}
                            value={(newCompany as Record<string,string>)[field.key]}
                            onChange={e => setNewCompany(p => ({ ...p, [field.key]: e.target.value }))}
                          >
                            <option>GmbH</option><option>AG</option><option>KG</option>
                            <option>OHG</option><option>GbR</option><option>Einzelunternehmen</option>
                            <option>MVZ</option><option>Filiale</option>
                          </select>
                        ) : (
                          <input
                            className="datev-input"
                            style={{ width: '100%' }}
                            value={(newCompany as Record<string,string>)[field.key]}
                            onChange={e => setNewCompany(p => ({ ...p, [field.key]: e.target.value }))}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="datev-btn" onClick={handleAddCompany} id="save-company-btn"
                style={{ background: '#B5E6A2' }}>
                ✓ Speichern
              </button>
              <button className="datev-btn" onClick={() => setShowAddModal(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
