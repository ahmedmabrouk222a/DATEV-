'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/app/page';
import { InventarItem } from '@/lib/types';

type SubView = 'erfassen' | 'uebersicht' | 'buchungen' | 'bewegung';

interface Props {
  onNavigateToBelege: () => void;
}

export default function InventarModule({ onNavigateToBelege }: Props) {
  const { workspace, updateWorkspace } = useApp();
  const [subView, setSubView] = useState<SubView>('erfassen');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventarItem>>({ menge: 1, stueckpreis: 0 });
  const [editId, setEditId] = useState<string | null>(null);
  const [ebGenerated, setEbGenerated] = useState(false);
  const [searchKat, setSearchKat] = useState('');

  const inventar = workspace.inventar;

  const filteredInventar = useMemo(() =>
    inventar.filter(i =>
      !searchKat || i.kategorie.toLowerCase().includes(searchKat.toLowerCase()) ||
      i.bezeichnung.toLowerCase().includes(searchKat.toLowerCase())
    ), [inventar, searchKat]);

  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAddItem = () => {
    if (!newItem.bezeichnung || !newItem.konto) { alert('Bezeichnung und Konto sind Pflichtfelder!'); return; }
    const item: InventarItem = {
      id: Date.now().toString(),
      bezeichnung: newItem.bezeichnung!,
      kategorie: newItem.kategorie || '',
      konto: newItem.konto!,
      menge: Number(newItem.menge) || 1,
      stueckpreis: Number(newItem.stueckpreis) || 0,
    };
    updateWorkspace({ inventar: [...inventar, item] });
    setNewItem({ menge: 1, stueckpreis: 0 });
    setShowAddItem(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eintrag löschen?')) return;
    updateWorkspace({ inventar: inventar.filter(i => i.id !== id) });
  };

  const handleEBGenerate = () => {
    if (inventar.length === 0) { alert('Keine Inventare vorhanden!'); return; }
    if (!confirm(`${inventar.length} EB-Buchungen erzeugen?`)) return;

    const now = new Date();
    const dateStr = `01.01.2026`;

    let stapel = workspace.stapel.find(s => s.bezeichnung.toLowerCase().includes('eb') || s.diktatkuerzel === 'EB');
    if (!stapel) {
      stapel = {
        id: `eb-${Date.now()}`,
        nummer: `01-2026/${String(workspace.stapel.length + 1).padStart(4, '0')}`,
        bezeichnung: 'Eröffnungsbuchungen EB 01.01.2026',
        datumVon: '01.01.2026',
        datumBis: '01.01.2026',
        periode: 'Januar',
        diktatkuerzel: 'EB',
      };
      updateWorkspace({ stapel: [...workspace.stapel, stapel] });
    }

    const maxNr = workspace.buchungen.reduce((m, b) => Math.max(m, b.nr), 0);
    const newBuchungen = inventar.map((item, idx) => ({
      id: `eb-${Date.now()}-${idx}`,
      stapelId: stapel!.id,
      nr: maxNr + idx + 1,
      wkz: 'EUR',
      umsatz: item.menge * item.stueckpreis,
      sh: 'S' as const,
      gu: '',
      bu: '',
      gegenkonto: '9008',
      belegfeld1: 'EB-2026',
      belegfeld2: '',
      datum: dateStr,
      leistungsdatum: dateStr,
      konto: item.konto,
      kost1: '',
      kost2: '',
      kostMenge: '',
      skonto: 0,
      buchungstext: `EB ${item.bezeichnung}`,
    }));

    updateWorkspace({ buchungen: [...workspace.buchungen, ...newBuchungen] });
    setEbGenerated(true);
    setTimeout(() => {
      alert(`✓ ${newBuchungen.length} EB-Buchungen erfolgreich erzeugt!\n\nStapel: ${stapel!.nummer}\nGesamtbetrag: ${fmt(inventar.reduce((s, i) => s + i.menge * i.stueckpreis, 0))} EUR`);
      onNavigateToBelege();
    }, 100);
  };

  const totalWert = inventar.reduce((s, i) => s + i.menge * i.stueckpreis, 0);

  // Group by category for Übersicht
  const byKategorie = useMemo(() => {
    const groups: Record<string, { items: InventarItem[]; total: number }> = {};
    inventar.forEach(i => {
      const k = i.kategorie || 'Sonstige';
      if (!groups[k]) groups[k] = { items: [], total: 0 };
      groups[k].items.push(i);
      groups[k].total += i.menge * i.stueckpreis;
    });
    return groups;
  }, [inventar]);

  const TABS = [
    { key: 'erfassen', label: 'Inventare aus Buchungen...' },
    { key: 'uebersicht', label: 'Inventarübersicht' },
    { key: 'buchungen', label: 'Buchungen erzeugen (EB)' },
    { key: 'bewegung', label: 'Bewegungsübersicht' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <div key={t.key} className={`datev-tab ${subView === t.key ? 'active' : ''}`}
            onClick={() => setSubView(t.key as SubView)} style={{ cursor: 'pointer' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>

        {/* ============ INVENTARE ERFASSEN ============ */}
        {subView === 'erfassen' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="datev-section-header" style={{ marginBottom: 0 }}>Inventare erfassen</div>
              <input className="datev-input" style={{ width: '180px' }}
                placeholder="Suche nach Kategorie..."
                value={searchKat} onChange={e => setSearchKat(e.target.value)} />
              <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
                onClick={() => setShowAddItem(true)} id="add-inventar-btn">
                + Neues Inventar erfassen
              </button>
              <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 'bold' }}>
                Gesamtwert: {fmt(totalWert)} EUR
              </div>
            </div>
            <table className="datev-table">
              <thead>
                <tr>
                  <th>Bezeichnung</th>
                  <th>Kategorie</th>
                  <th>Konto</th>
                  <th style={{ textAlign: 'right' }}>Menge</th>
                  <th style={{ textAlign: 'right' }}>Stückpreis EUR</th>
                  <th style={{ textAlign: 'right' }}>Gesamtwert EUR</th>
                  <th style={{ width: '50px' }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventar.map(item => (
                  <tr key={item.id} onDoubleClick={() => setEditId(item.id)}>
                    <td>
                      {editId === item.id ? (
                        <input className="datev-input" style={{ width: '100%' }} defaultValue={item.bezeichnung}
                          onBlur={e => { updateWorkspace({ inventar: inventar.map(i => i.id === item.id ? { ...i, bezeichnung: e.target.value } : i) }); setEditId(null); }}
                          autoFocus />
                      ) : item.bezeichnung}
                    </td>
                    <td style={{ fontSize: '11px', color: '#555' }}>{item.kategorie}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.konto}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input className="datev-input" style={{ width: '60px', textAlign: 'right' }}
                        type="number" value={item.menge}
                        onChange={e => updateWorkspace({ inventar: inventar.map(i => i.id === item.id ? { ...i, menge: Number(e.target.value) } : i) })} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input className="datev-input" style={{ width: '80px', textAlign: 'right' }}
                        type="number" step="0.01" value={item.stueckpreis}
                        onChange={e => updateWorkspace({ inventar: inventar.map(i => i.id === item.id ? { ...i, stueckpreis: Number(e.target.value) } : i) })} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006600' }}>
                      {fmt(item.menge * item.stueckpreis)}
                    </td>
                    <td>
                      <button className="datev-btn" style={{ padding: '0 3px', fontSize: '10px', color: 'red' }}
                        onClick={() => handleDelete(item.id)}>✕</button>
                    </td>
                  </tr>
                ))}
                {filteredInventar.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '20px', fontStyle: 'italic' }}>
                    {inventar.length === 0 ? 'Keine Inventare erfasst' : 'Keine Ergebnisse'}
                  </td></tr>
                )}
                {/* Total row */}
                {filteredInventar.length > 0 && (
                  <tr style={{ background: '#E8E8E8', fontWeight: 'bold' }}>
                    <td colSpan={5} style={{ textAlign: 'right' }}>Gesamt:</td>
                    <td style={{ textAlign: 'right' }}>{fmt(filteredInventar.reduce((s, i) => s + i.menge * i.stueckpreis, 0))} EUR</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#666' }}>
              Doppelklick zum Bearbeiten | Menge und Stückpreis direkt editierbar
            </div>
          </>
        )}

        {/* ============ INVENTARÜBERSICHT ============ */}
        {subView === 'uebersicht' && (
          <>
            <div className="datev-section-header" style={{ marginBottom: '8px' }}>
              Inventarübersicht – Bewertungsgrundlage nach § 240 HGB – Stichtag: 31.12.2025
            </div>
            {Object.entries(byKategorie).map(([kat, grp]) => (
              <div key={kat} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', background: '#D0E8FF', padding: '3px 6px', marginBottom: '4px', fontSize: '11px' }}>
                  📁 {kat} – Summe: {fmt(grp.total)} EUR
                </div>
                <table className="datev-table">
                  <thead>
                    <tr>
                      <th>Konto</th>
                      <th>Bezeichnung</th>
                      <th style={{ textAlign: 'right' }}>Menge</th>
                      <th style={{ textAlign: 'right' }}>× Stückpreis EUR</th>
                      <th style={{ textAlign: 'right' }}>= Gesamtwert EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.konto}</td>
                        <td>{item.bezeichnung}</td>
                        <td style={{ textAlign: 'right' }}>{item.menge}</td>
                        <td style={{ textAlign: 'right' }}>{fmt(item.stueckpreis)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(item.menge * item.stueckpreis)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={{ background: '#B5E6A2', padding: '6px 10px', fontWeight: 'bold', fontSize: '12px', marginTop: '8px', border: '1px solid #80C880' }}>
              Gesamt-Inventarwert: {fmt(totalWert)} EUR
            </div>
          </>
        )}

        {/* ============ BUCHUNGEN ERZEUGEN (EB) ============ */}
        {subView === 'buchungen' && (
          <div style={{ maxWidth: '700px' }}>
            <div className="datev-section-header" style={{ marginBottom: '12px' }}>
              Buchungen erzeugen – Eröffnungsbilanz (EB) zum 01.01.2026
            </div>

            <div style={{ background: '#FFFFCC', border: '1px solid #C0C080', padding: '12px', marginBottom: '16px', fontSize: '11px' }}>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                ⓘ Durch Klick auf „Buchungen erzeugen (EB)" werden automatisch Eröffnungsbilanz-Buchungen erzeugt:
              </p>
              <div style={{ border: '1px solid #D0D0A0', background: 'white' }}>
                <table className="datev-table">
                  <thead>
                    <tr>
                      <th>Konto (Soll)</th>
                      <th>Bezeichnung</th>
                      <th>→ Gegenkonto (Haben)</th>
                      <th style={{ textAlign: 'right' }}>Betrag EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventar.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.konto}</td>
                        <td>{item.bezeichnung} (×{item.menge})</td>
                        <td style={{ fontFamily: 'monospace' }}>9008 (EB-Konto)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006600' }}>
                          {fmt(item.menge * item.stueckpreis)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#E8E8E8', fontWeight: 'bold' }}>
                      <td colSpan={3} style={{ textAlign: 'right' }}>Gesamtbetrag:</td>
                      <td style={{ textAlign: 'right', color: '#006600' }}>{fmt(totalWert)} EUR</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {inventar.length === 0 && (
                <div style={{ marginTop: '8px', color: '#AA0000' }}>
                  ⚠ Keine Inventare vorhanden – bitte zuerst Inventare erfassen
                </div>
              )}
            </div>

            <button
              className="datev-btn"
              id="eb-generate-btn"
              style={{ background: '#4A9B3A', color: 'white', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold' }}
              onClick={handleEBGenerate}
              disabled={inventar.length === 0}>
              ✓ Buchungen erzeugen (EB)
            </button>

            {ebGenerated && (
              <div style={{ marginTop: '12px', background: '#C8F0C8', border: '1px solid #4A9B3A', padding: '10px', fontSize: '11px' }}>
                ✓ EB-Buchungen wurden erfolgreich in den Buchungsstapel übertragen.<br />
                <span className="datev-link" onClick={onNavigateToBelege}>➔ Zum Buchungsstapel wechseln</span>
              </div>
            )}
          </div>
        )}

        {/* ============ BEWEGUNGSÜBERSICHT ============ */}
        {subView === 'bewegung' && (
          <>
            <div className="datev-section-header" style={{ marginBottom: '8px' }}>
              Bewegungsübersicht – Zu- und Abgänge 2026
            </div>
            <table className="datev-table">
              <thead>
                <tr>
                  <th>Konto</th>
                  <th>Bezeichnung</th>
                  <th style={{ textAlign: 'right' }}>Anfangsbestand EUR</th>
                  <th style={{ textAlign: 'right' }}>Zugänge EUR</th>
                  <th style={{ textAlign: 'right' }}>Abgänge EUR</th>
                  <th style={{ textAlign: 'right' }}>Endbestand EUR</th>
                </tr>
              </thead>
              <tbody>
                {inventar.map(item => {
                  const anfang = item.menge * item.stueckpreis;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.konto}</td>
                      <td>{item.bezeichnung}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(anfang)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#006600' }}>0,00</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#CC0000' }}>0,00</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(anfang)}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#E8E8E8', fontWeight: 'bold' }}>
                  <td colSpan={2} style={{ textAlign: 'right' }}>Gesamt:</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(totalWert)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0,00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0,00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(totalWert)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="modal-window" style={{ width: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Neues Inventar erfassen</span>
              <button onClick={() => setShowAddItem(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { key: 'bezeichnung', label: 'Bezeichnung *', type: 'text', ph: 'z.B. Laptop Dell' },
                    { key: 'kategorie', label: 'Kategorie', type: 'text', ph: 'z.B. office items IT' },
                    { key: 'konto', label: 'Konto (SKR03) *', type: 'text', ph: 'z.B. 420' },
                    { key: 'menge', label: 'Menge', type: 'number', ph: '1' },
                    { key: 'stueckpreis', label: 'Stückpreis (EUR)', type: 'number', ph: '0,00' },
                  ].map(f => (
                    <tr key={f.key} style={{ marginBottom: '4px' }}>
                      <td style={{ padding: '4px 8px 4px 0', fontWeight: 'bold', fontSize: '11px', width: '150px' }}>{f.label}:</td>
                      <td>
                        <input className="datev-input" style={{ width: '100%' }}
                          type={f.type}
                          step={f.key === 'stueckpreis' ? '0.01' : undefined}
                          placeholder={f.ph}
                          value={(newItem as Record<string, string | number>)[f.key] || ''}
                          onChange={e => setNewItem(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {newItem.menge && newItem.stueckpreis && (
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#006600', fontSize: '11px' }}>
                  Gesamtwert: {fmt(Number(newItem.menge) * Number(newItem.stueckpreis))} EUR
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
                onClick={handleAddItem} id="save-inventar-btn">✓ OK</button>
              <button className="datev-btn" onClick={() => setShowAddItem(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
