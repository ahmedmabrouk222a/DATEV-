'use client';
import { useState, useMemo, Fragment } from 'react';
import { useApp } from '@/app/page';
import { Account } from '@/lib/types';

const TYPE_OPTIONS = ['Alle', 'Aktiva', 'Passiva', 'Aufwand', 'Ertrag', 'Debitor', 'Kreditor'];

const TYPE_BG: Record<string, string> = {
  Aktiva: '#D0E8FF', Passiva: '#FFD0D0', Aufwand: '#FFE8C0',
  Ertrag: '#C0FFD0', Debitor: '#E0D0FF', Kreditor: '#FFD0FF',
};

const EMPTY_NEW: Partial<Account> = { type: 'Aktiva' };

export default function KontenplanModule() {
  const { workspace, updateWorkspace } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Alle');
  const [showNew, setShowNew] = useState(false);
  const [newAcc, setNewAcc] = useState<Partial<Account>>({ ...EMPTY_NEW });
  const [selectedNr, setSelectedNr] = useState<string | null>(null);
  const [expandDesc, setExpandDesc] = useState<string | null>(null);
  const [kontenrahmen, setKontenrahmen] = useState('SKR03');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return workspace.accounts
      .filter(a =>
        (typeFilter === 'Alle' || a.type === typeFilter) &&
        (!q || a.number.includes(q) || a.name.toLowerCase().includes(q) ||
          (a.beschreibung && a.beschreibung.toLowerCase().includes(q)))
      )
      .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [workspace.accounts, search, typeFilter]);

  const handleAdd = () => {
    if (!newAcc.number || !newAcc.name) { alert('Kontonummer und Bezeichnung sind Pflichtfelder!'); return; }
    if (workspace.accounts.find(a => a.number === newAcc.number)) {
      alert(`Konto ${newAcc.number} existiert bereits!`); return;
    }
    const acc: Account = {
      number: newAcc.number!,
      name: newAcc.name!,
      type: (newAcc.type as Account['type']) || 'Aktiva',
      bilanzCategory: newAcc.bilanzCategory || '',
      beschreibung: newAcc.beschreibung || '',
    };
    updateWorkspace({ accounts: [...workspace.accounts, acc] });
    setNewAcc({ ...EMPTY_NEW });
    setShowNew(false);
  };

  const handleDelete = (nr: string) => {
    if (!confirm(`Konto ${nr} wirklich löschen?`)) return;
    updateWorkspace({ accounts: workspace.accounts.filter(a => a.number !== nr) });
    if (selectedNr === nr) setSelectedNr(null);
  };

  const handleDescUpdate = (nr: string, val: string) => {
    updateWorkspace({
      accounts: workspace.accounts.map(a => a.number === nr ? { ...a, beschreibung: val } : a),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0', flexShrink: 0 }}>
        <div className="datev-tab active">Stammdaten → Kontenplan ({kontenrahmen})</div>
      </div>

      {/* Toolbar */}
      <div style={{
        padding: '5px 8px', borderBottom: '1px solid #A0A0A0',
        background: '#F8F8F8', display: 'flex', gap: '8px',
        alignItems: 'center', flexWrap: 'wrap', flexShrink: 0,
      }}>
        {/* Kontenrahmen */}
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Kontenrahmen:</label>
        <select className="datev-select" style={{ width: '80px' }}
          value={kontenrahmen} onChange={e => setKontenrahmen(e.target.value)}>
          <option>SKR03</option><option>SKR04</option>
        </select>

        {/* Typ */}
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Typ:</label>
        <select className="datev-select" style={{ width: '90px' }}
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>

        {/* Search */}
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Suche:</label>
        <input
          className="datev-input" style={{ width: '200px' }}
          placeholder="Kontonr. oder Name oder Erklärung..."
          value={search} onChange={e => setSearch(e.target.value)}
          id="kontenplan-search"
        />
        {search && (
          <button className="datev-btn" style={{ padding: '1px 5px' }}
            onClick={() => setSearch('')}>✕</button>
        )}

        <span style={{ flex: 1 }} />

        {/* Add account */}
        <button
          className="datev-btn"
          style={{ background: '#B5E6A2', fontWeight: 'bold' }}
          onClick={() => setShowNew(true)}
          id="add-konto-btn"
        >
          + Neues Konto anlegen
        </button>

        <span style={{ fontSize: '11px', color: '#555' }}>
          {filtered.length} von {workspace.accounts.length} Konten
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="datev-table" style={{ minWidth: '900px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ width: '80px' }}>Kontonummer ▲</th>
              <th style={{ width: '220px' }}>Kontobezeichnung</th>
              <th style={{ width: '70px' }}>Typ</th>
              <th style={{ width: '200px' }}>Bilanz-Kategorie</th>
              <th>Erklärung (pädagogisch)</th>
              <th style={{ width: '50px' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <Fragment key={a.number}>
                <tr
                  className={selectedNr === a.number ? 'selected' : ''}
                  onClick={() => setSelectedNr(prev => prev === a.number ? null : a.number)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Kontonummer */}
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px' }}>
                    {a.number}
                  </td>
                  {/* Bezeichnung */}
                  <td style={{ fontWeight: 'bold' }}>{a.name}</td>
                  {/* Typ badge */}
                  <td>
                    <span style={{
                      padding: '1px 5px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold',
                      background: TYPE_BG[a.type] || '#E0E0E0', border: '1px solid #C0C0C0',
                    }}>
                      {a.type}
                    </span>
                  </td>
                  {/* Bilanz-Kategorie */}
                  <td style={{ fontSize: '10px', color: '#555' }}>{a.bilanzCategory}</td>
                  {/* Erklärung – truncated, click row to expand */}
                  <td style={{ fontSize: '11px', color: '#333' }}>
                    {a.beschreibung ? (
                      expandDesc === a.number ? (
                        <div>
                          <div style={{ marginBottom: '3px', color: '#003399' }}>{a.beschreibung}</div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="datev-btn" style={{ fontSize: '10px', padding: '0 4px' }}
                              onClick={e => { e.stopPropagation(); setExpandDesc(null); }}>
                              ▲ Einklappen
                            </button>
                            <button className="datev-btn" style={{ fontSize: '10px', padding: '0 4px' }}
                              onClick={e => e.stopPropagation()}>
                              ✏️ Bearbeiten
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{ cursor: 'pointer', color: '#0052CC', textDecoration: 'underline dotted' }}
                          title={a.beschreibung}
                          onClick={e => { e.stopPropagation(); setExpandDesc(a.number); }}>
                          {a.beschreibung.length > 70
                            ? a.beschreibung.substring(0, 68) + '…'
                            : a.beschreibung}
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#AAA', fontStyle: 'italic', fontSize: '10px' }}>–</span>
                    )}
                  </td>
                  {/* Delete */}
                  <td>
                    <button
                      className="datev-btn"
                      style={{ color: 'red', padding: '0 4px', fontSize: '11px' }}
                      onClick={e => { e.stopPropagation(); handleDelete(a.number); }}
                      title={`Konto ${a.number} löschen`}
                      id={`del-konto-${a.number}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>

                {/* Expanded description editor */}
                {selectedNr === a.number && expandDesc === a.number && (
                  <tr key={`${a.number}-edit`} style={{ background: '#FFFFF0' }}>
                    <td colSpan={6} style={{ padding: '6px 12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: '4px' }}>
                          Erklärung bearbeiten:
                        </label>
                        <textarea
                          style={{
                            flex: 1, fontSize: '11px', padding: '4px',
                            border: '1px solid #316AC5', resize: 'vertical', minHeight: '50px',
                          }}
                          defaultValue={a.beschreibung}
                          onBlur={e => handleDescUpdate(a.number, e.target.value)}
                        />
                        <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold', fontSize: '11px' }}
                          onClick={() => setExpandDesc(null)}>
                          ✓ OK
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#888', fontStyle: 'italic' }}>
                  Keine Konten gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div style={{
        borderTop: '1px solid #A0A0A0', padding: '3px 8px',
        background: '#F0F0F0', fontSize: '10px', color: '#555',
        display: 'flex', gap: '16px', flexShrink: 0,
      }}>
        <span>Kontenrahmen: <strong>{kontenrahmen}</strong></span>
        <span>Gesamt: <strong>{workspace.accounts.length}</strong></span>
        <span>Angezeigt: <strong>{filtered.length}</strong></span>
        <span>Aktiva: {filtered.filter(a => a.type === 'Aktiva').length}</span>
        <span>Passiva: {filtered.filter(a => a.type === 'Passiva').length}</span>
        <span>Aufwand: {filtered.filter(a => a.type === 'Aufwand').length}</span>
        <span>Ertrag: {filtered.filter(a => a.type === 'Ertrag').length}</span>
        <span>Debitor: {filtered.filter(a => a.type === 'Debitor').length}</span>
        <span>Kreditor: {filtered.filter(a => a.type === 'Kreditor').length}</span>
      </div>

      {/* New account modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-window" style={{ width: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Neues Konto anlegen</span>
              <button onClick={() => setShowNew(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <div className="modal-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { key: 'number', label: 'Kontonummer *', type: 'text', ph: 'z.B. 4999' },
                    { key: 'name', label: 'Kontobezeichnung *', type: 'text', ph: 'z.B. Sonstige Aufwendungen' },
                    { key: 'bilanzCategory', label: 'Bilanz-Kategorie', type: 'text', ph: 'z.B. Aufwendungen' },
                  ].map(f => (
                    <tr key={f.key}>
                      <td style={{ padding: '4px 8px 4px 0', fontWeight: 'bold', fontSize: '11px', width: '160px' }}>{f.label}:</td>
                      <td style={{ paddingBottom: '6px' }}>
                        <input className="datev-input" style={{ width: '100%' }}
                          type={f.type} placeholder={f.ph}
                          value={(newAcc as Record<string, string>)[f.key] || ''}
                          onChange={e => setNewAcc(p => ({ ...p, [f.key]: e.target.value }))} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '4px 8px 4px 0', fontWeight: 'bold', fontSize: '11px' }}>Kontotyp *:</td>
                    <td style={{ paddingBottom: '6px' }}>
                      <select className="datev-select" style={{ width: '100%' }}
                        value={newAcc.type || 'Aktiva'}
                        onChange={e => setNewAcc(p => ({ ...p, type: e.target.value as Account['type'] }))}>
                        {['Aktiva', 'Passiva', 'Aufwand', 'Ertrag', 'Debitor', 'Kreditor'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px 4px 0', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'top' }}>
                      Erklärung<br />
                      <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(pädagogisch)</span>:
                    </td>
                    <td style={{ paddingBottom: '6px' }}>
                      <textarea className="datev-input" style={{ width: '100%', resize: 'vertical', minHeight: '60px', fontSize: '11px' }}
                        placeholder="Hier wird ... erfasst."
                        value={newAcc.beschreibung || ''}
                        onChange={e => setNewAcc(p => ({ ...p, beschreibung: e.target.value }))} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
                onClick={handleAdd} id="save-konto-btn">✓ OK</button>
              <button className="datev-btn" onClick={() => { setShowNew(false); setNewAcc({ ...EMPTY_NEW }); }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
