'use client';
import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/app/page';
import { Buchung, Buchungsstapel, BU_STEUER_MAP } from '@/lib/types';
import AccountPopup from '@/components/AccountPopup';

const EMPTY_FORM = {
  gu: '', wkz: 'EUR', umsatz: '', sh: 'S' as 'S'|'H', bu: '',
  gegenkonto: '', belegfeld1: '', belegfeld2: '', datum: '',
  leistungsdatum: '', konto: '', kost1: '', kost2: '', kostMenge: '',
  skonto: '', buchungstext: '',
};

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

// BU-Label helper
const getBULabel = (bu: string) => BU_STEUER_MAP[bu]?.label || 'Kein Steuerschlüssel';

// Steuer-Konto für automatische Splittbuchung
const getSteuerkonto = (bu: string, sh: 'S'|'H'): string | null => {
  const m = BU_STEUER_MAP[bu];
  if (!m) return null;
  // Einkauf (Soll auf Kostenkonto) → Vorsteuer
  if (m.vorsteuerkonto) return m.vorsteuerkonto;
  // Verkauf (Haben auf Erlöskonto) → USt
  if (m.uststeuerkonto) return m.uststeuerkonto;
  return null;
};

// Steuerbetrag aus Brutto
const calcSteuer = (brutto: number, bu: string): number => {
  const pct = parseFloat(BU_STEUER_MAP[bu]?.prozent || '0');
  if (!pct) return 0;
  return Math.round((brutto / (100 + pct) * pct) * 100) / 100;
};

export default function BelegeModule() {
  const { workspace, updateWorkspace } = useApp();
  const [view, setView] = useState<'stapel' | 'buchung'>('stapel');
  const [selectedStapelId, setSelectedStapelId] = useState<string>(workspace.stapel[0]?.id || '');
  const [showNewStapel, setShowNewStapel] = useState(false);
  const [newStapel, setNewStapel] = useState<Partial<Buchungsstapel>>({ diktatkuerzel: 'AS', periode: 'August' });
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gegenkontoPopup, setGegenkontoPopup] = useState(false);
  const [kontoPopup, setKontoPopup] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  const selectedStapel = workspace.stapel.find(s => s.id === selectedStapelId);
  const stapelBuchungen = workspace.buchungen.filter(b => b.stapelId === selectedStapelId);

  // Live saldo per account
  const getKontoSaldo = useCallback((nr: string) => {
    if (!nr) return 0;
    let s = 0;
    workspace.buchungen.forEach(b => {
      if (b.konto === nr) s += b.sh === 'S' ? b.umsatz : -b.umsatz;
      if (b.gegenkonto === nr) s += b.sh === 'H' ? b.umsatz : -b.umsatz;
    });
    return s;
  }, [workspace.buchungen]);

  const getAccountName = (nr: string) => workspace.accounts.find(a => a.number === nr)?.name || '';
  const fmtEUR = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const today = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.2026`;
  };

  // Handle Enter: advance to next field
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = inputRefs.current[idx + 1];
      if (next) { next.focus(); }
      else { handlePost(); }
    }
    if (e.key === 'Escape') setForm({ ...EMPTY_FORM });
  };

  const handlePost = () => {
    const umsatzVal = parseFloat(String(form.umsatz).replace(',', '.'));
    if (!umsatzVal || umsatzVal <= 0) { alert('Bitte einen Umsatzbetrag eingeben!'); return; }
    if (!form.gegenkonto) { alert('Bitte ein Gegenkonto eingeben!'); return; }
    if (!form.konto) { alert('Bitte ein Konto eingeben!'); return; }

    const datumFinal = form.datum || today();
    const maxNr = workspace.buchungen.reduce((m, b) => Math.max(m, b.nr), 0);

    const buchung: Buchung = {
      id: editingId || Date.now().toString(),
      stapelId: selectedStapelId,
      nr: editingId ? (workspace.buchungen.find(b => b.id === editingId)?.nr || maxNr + 1) : maxNr + 1,
      wkz: form.wkz,
      umsatz: umsatzVal,
      sh: form.sh,
      gu: form.gu,
      bu: form.bu,
      gegenkonto: form.gegenkonto,
      belegfeld1: form.belegfeld1,
      belegfeld2: form.belegfeld2,
      datum: datumFinal,
      leistungsdatum: form.leistungsdatum || datumFinal,
      konto: form.konto,
      kost1: form.kost1,
      kost2: form.kost2,
      kostMenge: form.kostMenge,
      skonto: parseFloat(String(form.skonto).replace(',', '.')) || 0,
      buchungstext: form.buchungstext,
    };

    // ─── Automatische Steuerbuchung (Split) ───────────────────────────
    const steuerkonto = getSteuerkonto(form.bu, form.sh);
    const steuerbetrag = calcSteuer(umsatzVal, form.bu);
    const newBuchungen: Buchung[] = [];

    if (editingId) {
      newBuchungen.push(...workspace.buchungen.map(b => b.id === editingId ? buchung : b));
    } else {
      newBuchungen.push(...workspace.buchungen, buchung);

      // Add automatic tax split booking if BU is set and not editing
      if (steuerkonto && steuerbetrag > 0) {
        const steuerBu: Buchung = {
          id: `tax-${Date.now()}`,
          stapelId: selectedStapelId,
          nr: buchung.nr + 1,
          wkz: form.wkz,
          umsatz: steuerbetrag,
          sh: form.sh,
          gu: 'T', // T = Steuerbuchung (auto)
          bu: '',
          gegenkonto: form.bu === '8' || form.bu === '9' ? form.gegenkonto : form.konto,
          belegfeld1: form.belegfeld1,
          belegfeld2: form.belegfeld2,
          datum: datumFinal,
          leistungsdatum: form.leistungsdatum || datumFinal,
          konto: steuerkonto,
          kost1: '',
          kost2: '',
          kostMenge: '',
          skonto: 0,
          buchungstext: `Steuer (${BU_STEUER_MAP[form.bu]?.prozent || ''}%) zu ${form.buchungstext}`,
        };
        newBuchungen.push(steuerBu);
      }
    }

    updateWorkspace({ buchungen: newBuchungen });
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setTimeout(() => inputRefs.current[2]?.focus(), 50);
  };


  const handleDelete = (id: string) => {
    updateWorkspace({ buchungen: workspace.buchungen.filter(b => b.id !== id) });
    if (selectedRow === id) setSelectedRow(null);
  };

  const handleEdit = (b: Buchung) => {
    setEditingId(b.id);
    setForm({
      gu: b.gu, wkz: b.wkz, umsatz: String(b.umsatz), sh: b.sh, bu: b.bu,
      gegenkonto: b.gegenkonto, belegfeld1: b.belegfeld1, belegfeld2: b.belegfeld2,
      datum: b.datum, leistungsdatum: b.leistungsdatum, konto: b.konto,
      kost1: b.kost1, kost2: b.kost2, kostMenge: b.kostMenge,
      skonto: b.skonto ? String(b.skonto) : '', buchungstext: b.buchungstext,
    });
    setTimeout(() => inputRefs.current[2]?.focus(), 50);
  };

  const handleCreateStapel = () => {
    if (!newStapel.datumVon || !newStapel.datumBis) { alert('Datum von und bis sind Pflichtfelder!'); return; }
    const s: Buchungsstapel = {
      id: Date.now().toString(),
      nummer: `08-2026/${String(workspace.stapel.length + 10).padStart(4, '0')}`,
      bezeichnung: newStapel.bezeichnung || `${newStapel.diktatkuerzel} ${newStapel.periode}`,
      datumVon: newStapel.datumVon!,
      datumBis: newStapel.datumBis!,
      periode: newStapel.periode || 'August',
      diktatkuerzel: newStapel.diktatkuerzel || 'AS',
    };
    updateWorkspace({ stapel: [...workspace.stapel, s] });
    setSelectedStapelId(s.id);
    setNewStapel({ diktatkuerzel: 'AS', periode: 'August' });
    setShowNewStapel(false);
    setView('buchung');
  };

  const abstimmsumme = stapelBuchungen.reduce((s, b) => s + b.umsatz, 0);
  const selectedBuchung = stapelBuchungen.find(b => b.id === selectedRow);
  const gegenSaldo = getKontoSaldo(form.gegenkonto);
  const kontoSaldo = getKontoSaldo(form.konto);

  // =================== STAPEL VIEW ===================
  if (view === 'stapel') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0' }}>
          <div className="datev-tab active">Buchungsstapel auswählen</div>
        </div>

        <div style={{ padding: '6px 8px', borderBottom: '1px solid #A0A0A0', background: '#F8F8F8', display: 'flex', gap: '8px' }}>
          <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
            onClick={() => setShowNewStapel(true)} id="new-stapel-btn">
            + Neuen Buchungsstapel anlegen
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          <table className="datev-table" style={{ minWidth: '750px' }}>
            <thead>
              <tr>
                <th>Stapel-Nummer</th>
                <th>Bezeichnung</th>
                <th>Datum von</th>
                <th>Datum bis</th>
                <th>Periode</th>
                <th>Diktatkürzel</th>
                <th style={{ textAlign: 'right' }}>Buchungen</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {workspace.stapel.map(s => (
                <tr key={s.id}
                  className={selectedStapelId === s.id ? 'selected' : ''}
                  onClick={() => setSelectedStapelId(s.id)}
                  onDoubleClick={() => { setSelectedStapelId(s.id); setView('buchung'); }}
                  style={{ cursor: 'pointer' }}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{s.nummer}</td>
                  <td>{s.bezeichnung}</td>
                  <td>{s.datumVon}</td>
                  <td>{s.datumBis}</td>
                  <td>{s.periode}</td>
                  <td>{s.diktatkuerzel}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {workspace.buchungen.filter(b => b.stapelId === s.id).length}
                  </td>
                  <td>
                    <button className="datev-btn"
                      style={{ padding: '1px 6px', fontSize: '11px', background: '#E0E8FF' }}
                      onClick={e => { e.stopPropagation(); setSelectedStapelId(s.id); setView('buchung'); }}>
                      Öffnen ▶
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#666' }}>
            Doppelklick zum Öffnen des Stapels
          </div>
        </div>

        {/* New Stapel Modal */}
        {showNewStapel && (
          <div className="modal-overlay" onClick={() => setShowNewStapel(false)}>
            <div className="modal-window" style={{ width: '440px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span>Neuen Buchungsstapel anlegen</span>
                <button onClick={() => setShowNewStapel(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
              </div>
              <div className="modal-body">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { key: 'datumVon', label: 'Datum von *', ph: '01.08.2026' },
                      { key: 'datumBis', label: 'Datum bis *', ph: '31.08.2026' },
                      { key: 'bezeichnung', label: 'Bezeichnung', ph: 'Bank 08.2026' },
                      { key: 'diktatkuerzel', label: 'Diktatkürzel (AS)', ph: 'AS' },
                    ].map(f => (
                      <tr key={f.key} style={{ marginBottom: '6px' }}>
                        <td style={{ padding: '4px 8px 4px 0', fontWeight: 'bold', fontSize: '11px', width: '160px' }}>{f.label}:</td>
                        <td>
                          <input className="datev-input" style={{ width: '100%' }}
                            placeholder={f.ph}
                            value={(newStapel as Record<string, string>)[f.key] || ''}
                            onChange={e => setNewStapel(p => ({ ...p, [f.key]: e.target.value }))} />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: '4px 8px 4px 0', fontWeight: 'bold', fontSize: '11px' }}>Periode:</td>
                      <td>
                        <select className="datev-select" style={{ width: '100%' }}
                          value={newStapel.periode || 'August'}
                          onChange={e => setNewStapel(p => ({ ...p, periode: e.target.value }))}>
                          {MONTHS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
                  onClick={handleCreateStapel} id="save-stapel-btn">OK</button>
                <button className="datev-btn" onClick={() => setShowNewStapel(false)}>Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =================== BUCHUNG VIEW ===================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0', flexShrink: 0 }}>
        <div className="datev-tab" onClick={() => setView('stapel')} style={{ cursor: 'pointer' }}>← Stapel</div>
        <div className="datev-tab active">
          Belege buchen – {selectedStapel?.nummer}
          {editingId && <span style={{ color: '#CC6600', marginLeft: '6px' }}>[Bearbeiten]</span>}
        </div>
      </div>

      {/* Stapel info bar */}
      <div style={{ padding: '3px 8px', borderBottom: '1px solid #A0A0A0', background: '#F8F8F8', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', flexShrink: 0 }}>
        <label style={{ fontWeight: 'bold' }}>Stapel:</label>
        <select className="datev-select" style={{ width: '240px' }}
          value={selectedStapelId} onChange={e => setSelectedStapelId(e.target.value)}>
          {workspace.stapel.map(s => (
            <option key={s.id} value={s.id}>{s.nummer} – {s.bezeichnung}</option>
          ))}
        </select>
        <button className="datev-btn" style={{ padding: '1px 5px' }} title="Stapel bearbeiten">✏️</button>
        <span style={{ color: '#555' }}>|</span>
        <span>Periode: <strong>{selectedStapel?.datumVon} – {selectedStapel?.datumBis}</strong></span>
        <span style={{ color: '#555' }}>|</span>
        <span>Diktatkürzel: <strong>{selectedStapel?.diktatkuerzel}</strong></span>
      </div>

      {/* ---- Buchungen grid ---- */}
      <div style={{ flexShrink: 0, maxHeight: '32%', overflow: 'auto', borderBottom: '2px solid #A0A0A0' }}>
        <table className="datev-table" style={{ minWidth: '1400px', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ width: '20px' }}>!</th>
              <th style={{ width: '20px' }}>BL</th>
              <th style={{ width: '36px' }}>Nr.</th>
              <th style={{ width: '40px' }}>WKZ</th>
              <th style={{ textAlign: 'right', width: '90px' }}>Umsatz</th>
              <th style={{ width: '30px' }}>S/H</th>
              <th style={{ width: '28px' }}>GU</th>
              <th style={{ width: '28px' }}>BU</th>
              <th>Gegenkonto</th>
              <th>Belegfeld 1</th>
              <th>Belegfeld 2</th>
              <th style={{ width: '80px' }}>Datum</th>
              <th style={{ width: '80px' }}>Leistungsdatum</th>
              <th>Konto</th>
              <th style={{ width: '50px' }}>KOST1</th>
              <th style={{ width: '50px' }}>KOST2</th>
              <th style={{ textAlign: 'right', width: '70px' }}>Skonto</th>
              <th>Buchungstext</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {/* Abstimmsumme */}
            <tr style={{ background: '#F8F8E8' }}>
              <td colSpan={4} style={{ borderRight: 'none' }}></td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {fmtEUR(abstimmsumme)}
              </td>
              <td colSpan={13} style={{ textAlign: 'right', fontStyle: 'italic', color: '#666', fontSize: '10px', borderLeft: 'none' }}>
                Abstimmsumme
              </td>
              <td></td>
            </tr>
            {stapelBuchungen.length === 0 && (
              <tr>
                <td colSpan={19} style={{ textAlign: 'center', padding: '16px', color: '#888', fontStyle: 'italic' }}>
                  Keine Buchungen im Stapel – Buchung im gelben Feld unten erfassen
                </td>
              </tr>
            )}
            {stapelBuchungen.map(b => (
              <tr key={b.id}
                className={selectedRow === b.id ? 'selected' : editingId === b.id ? 'selected' : ''}
                onClick={() => setSelectedRow(b.id)}
                onDoubleClick={() => handleEdit(b)}
                style={{ cursor: 'pointer', background: editingId === b.id ? '#FFFACD' : undefined }}>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{b.nr}</td>
                <td>{b.wkz}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {fmtEUR(b.umsatz)}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: b.sh === 'S' ? '#004400' : '#AA0000' }}>
                  {b.sh}
                </td>
                <td>{b.gu}</td>
                <td title={getBULabel(b.bu)} style={{ whiteSpace: 'nowrap' }}>
                  {b.bu ? (
                    <span style={{
                      background: (b.bu === '9' || b.bu === '8') ? '#E0F0FF' : '#FFE8E0',
                      padding: '0 3px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold',
                      border: '1px solid #C0C0C0',
                    }} title={getBULabel(b.bu)}>{b.bu}</span>
                  ) : '–'}
                </td>
                <td style={{ fontFamily: 'monospace' }}>
                  {b.gegenkonto}
                  {getAccountName(b.gegenkonto) && (
                    <span style={{ color: '#555', fontSize: '10px' }}> {getAccountName(b.gegenkonto).substring(0, 16)}</span>
                  )}
                </td>
                <td>{b.belegfeld1}</td>
                <td>{b.belegfeld2}</td>
                <td>{b.datum}</td>
                <td>{b.leistungsdatum}</td>
                <td style={{ fontFamily: 'monospace' }}>
                  {b.konto}
                  {getAccountName(b.konto) && (
                    <span style={{ color: '#555', fontSize: '10px' }}> {getAccountName(b.konto).substring(0, 16)}</span>
                  )}
                </td>
                <td>{b.kost1}</td>
                <td>{b.kost2}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{b.skonto ? fmtEUR(b.skonto) : ''}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.buchungstext}
                </td>
                <td>
                  <button className="datev-btn"
                    style={{ padding: '0 3px', fontSize: '10px', marginRight: '2px' }}
                    onClick={e => { e.stopPropagation(); handleEdit(b); }}
                    title="Bearbeiten">✏️</button>
                  <button className="datev-btn"
                    style={{ padding: '0 3px', fontSize: '10px', color: 'red' }}
                    onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                    title="Löschen">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Details Panel ---- */}
      <div style={{ borderBottom: '1px solid #A0A0A0', background: '#F8F8F8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '2px 6px', background: '#EAEAEA', borderBottom: detailsOpen ? '1px solid #D0D0D0' : 'none', cursor: 'pointer' }}
          onClick={() => setDetailsOpen(!detailsOpen)}>
          <span style={{ fontSize: '10px', marginRight: '4px' }}>{detailsOpen ? '▼' : '▶'}</span>
          <strong style={{ fontSize: '11px' }}>Details</strong>
        </div>
        {detailsOpen && (
          <div style={{ display: 'flex', minHeight: '72px' }}>
            <div style={{ width: '190px', borderRight: '1px solid #D0D0D0', padding: '4px 8px' }}>
              {['Summen und Salden', 'Elektronischer Beleg', 'Zusatzinformationen', 'Steuerl. Sachverhalte', 'OPOS-Informationen'].map(l => (
                <div key={l} className="datev-link" style={{ marginBottom: '3px', fontSize: '11px' }}>➔ {l}</div>
              ))}
            </div>
            <div style={{ flex: 1, padding: '6px 12px', fontSize: '11px' }}>
              {selectedBuchung ? (
                <div style={{ lineHeight: '1.8' }}>
                  <strong>Nr. {selectedBuchung.nr}</strong> | {selectedBuchung.datum} |
                  <strong style={{ color: '#006600', marginLeft: '4px' }}>Soll: {selectedBuchung.konto}</strong> {getAccountName(selectedBuchung.konto)} →
                  <strong style={{ color: '#AA0000', marginLeft: '4px' }}>Haben: {selectedBuchung.gegenkonto}</strong> {getAccountName(selectedBuchung.gegenkonto)} |
                  Betrag: <strong>{fmtEUR(selectedBuchung.umsatz)} EUR {selectedBuchung.sh}</strong> |
                  BU: <strong style={{ color: selectedBuchung.bu ? '#0052CC' : '#888' }}>
                    {getBULabel(selectedBuchung.bu)}
                    {getSteuerkonto(selectedBuchung.bu, selectedBuchung.sh) && (
                      <span style={{ marginLeft: '6px', color: '#AA0000' }}>
                        → Kto {getSteuerkonto(selectedBuchung.bu, selectedBuchung.sh)}
                      </span>
                    )}
                  </strong><br />

                  Text: <em>{selectedBuchung.buchungstext}</em>
                  {selectedBuchung.belegfeld1 && <span> | Beleg: {selectedBuchung.belegfeld1}</span>}
                </div>
              ) : (
                <span style={{ color: '#888', fontStyle: 'italic' }}>Keine Daten vorhanden...</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Booking Mask (yellow) ---- */}
      <div className="datev-booking-mask" style={{ padding: '5px 8px', flexShrink: 0, overflow: 'visible' }}>
        {/* Abstimmsumme header */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px', fontSize: '11px', borderBottom: '1px solid #D0C000', paddingBottom: '3px' }}>
          Abstimmsumme: {fmtEUR(abstimmsumme)} {form.sh}
          {editingId && <span style={{ color: '#CC6600', marginLeft: '12px', fontSize: '10px' }}>⚠ Buchung wird bearbeitet – Enter oder ✓ zum Speichern</span>}
        </div>

        {/* Row 1: main fields */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* GU */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>GU:</div>
            <input ref={el => { inputRefs.current[0] = el; }}
              className="datev-input" style={{ width: '26px' }}
              value={form.gu} onChange={e => setForm(p => ({ ...p, gu: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 0)} />
          </div>
          {/* WKZ */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>WKZ:</div>
            <select ref={el => { inputRefs.current[1] = el; }}
              className="datev-select" style={{ width: '52px' }}
              value={form.wkz} onChange={e => setForm(p => ({ ...p, wkz: e.target.value }))}>
              <option>EUR</option><option>USD</option><option>CHF</option><option>GBP</option>
            </select>
          </div>
          {/* Umsatz */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Umsatz:</div>
            <input ref={el => { inputRefs.current[2] = el; }}
              className="datev-input"
              style={{ width: '96px', textAlign: 'right', border: '2px solid #316AC5', background: '#FFFFFF' }}
              placeholder="0,00"
              value={form.umsatz}
              onChange={e => setForm(p => ({ ...p, umsatz: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 2)}
              autoFocus />
          </div>
          {/* S/H */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>S/H:</div>
            <select ref={el => { inputRefs.current[3] = el; }}
              className="datev-select" style={{ width: '42px', fontWeight: 'bold' }}
              value={form.sh} onChange={e => setForm(p => ({ ...p, sh: e.target.value as 'S' | 'H' }))}>
              <option value="S">S</option>
              <option value="H">H</option>
            </select>
          </div>
          {/* BU – Steuerschlüssel */}
          <div style={{ minWidth: '130px' }}>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>BU (Steuer):</div>
            <select
              ref={el => { inputRefs.current[4] = el as unknown as HTMLInputElement; }}
              className="datev-select"
              style={{ width: '130px', fontSize: '10px' }}
              value={form.bu}
              onChange={e => setForm(p => ({ ...p, bu: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 4)}
              title="Steuerschlüssel wählen">
              <option value="">0 – Ohne Steuer</option>
              <option value="8">8 – VSt 7% (1571)</option>
              <option value="9">9 – VSt 19% (1576)</option>
              <option value="2">2 – USt 7% (1771)</option>
              <option value="3">3 – USt 19% (1776)</option>
            </select>
            {form.bu && (
              <div style={{ fontSize: '9px', color: '#0052CC', marginTop: '1px', lineHeight: '1.2' }}>
                {getBULabel(form.bu)}
                {getSteuerkonto(form.bu, form.sh) && (
                  <span style={{ marginLeft: '4px', color: '#AA0000' }}>
                    → Kto {getSteuerkonto(form.bu, form.sh)}
                  </span>
                )}
                {form.umsatz && parseFloat(String(form.umsatz)) > 0 && (
                  <span style={{ marginLeft: '4px', color: '#006600', fontWeight: 'bold' }}>
                    = {(calcSteuer(parseFloat(String(form.umsatz).replace(',','.')), form.bu)).toLocaleString('de-DE', {minimumFractionDigits:2})} EUR
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Gegenkonto */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Gegenkto:</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              <input ref={el => { inputRefs.current[5] = el; }}
                className="datev-input" style={{ width: '68px' }}
                value={form.gegenkonto}
                onChange={e => { setForm(p => ({ ...p, gegenkonto: e.target.value })); setGegenkontoPopup(true); }}
                onFocus={() => setGegenkontoPopup(true)}
                onKeyDown={e => { if (e.key !== 'Enter') return; setGegenkontoPopup(false); handleKeyDown(e, 5); }} />
              <button className="datev-btn" style={{ padding: '0 3px' }}
                onClick={() => setGegenkontoPopup(!gegenkontoPopup)}>▼</button>
            </div>
            {form.gegenkonto && (
              <div style={{ fontSize: '9px', color: '#0052CC', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getAccountName(form.gegenkonto)}
              </div>
            )}
            {gegenkontoPopup && (
              <AccountPopup
                accounts={workspace.accounts}
                search={form.gegenkonto}
                onSelect={a => { setForm(p => ({ ...p, gegenkonto: a.number })); setGegenkontoPopup(false); inputRefs.current[6]?.focus(); }}
                onClose={() => setGegenkontoPopup(false)}
              />
            )}
          </div>
          {/* Belegfeld 1 */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Belegfeld 1:</div>
            <input ref={el => { inputRefs.current[6] = el; }}
              className="datev-input" style={{ width: '88px' }}
              placeholder="Rg-Nr."
              value={form.belegfeld1}
              onChange={e => setForm(p => ({ ...p, belegfeld1: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 6)} />
          </div>
          {/* Datum */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Datum:</div>
            <input ref={el => { inputRefs.current[7] = el; }}
              className="datev-input" style={{ width: '82px' }}
              placeholder="TT.MM.JJJJ"
              value={form.datum}
              onChange={e => setForm(p => ({ ...p, datum: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 7)} />
          </div>
          {/* Konto */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Konto:</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              <input ref={el => { inputRefs.current[8] = el; }}
                className="datev-input" style={{ width: '68px' }}
                value={form.konto}
                onChange={e => { setForm(p => ({ ...p, konto: e.target.value })); setKontoPopup(true); }}
                onFocus={() => setKontoPopup(true)}
                onKeyDown={e => { if (e.key !== 'Enter') return; setKontoPopup(false); handleKeyDown(e, 8); }} />
              <button className="datev-btn" style={{ padding: '0 3px' }}
                onClick={() => setKontoPopup(!kontoPopup)}>▼</button>
            </div>
            {form.konto && (
              <div style={{ fontSize: '9px', color: '#0052CC', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getAccountName(form.konto)}
              </div>
            )}
            {kontoPopup && (
              <AccountPopup
                accounts={workspace.accounts}
                search={form.konto}
                onSelect={a => { setForm(p => ({ ...p, konto: a.number })); setKontoPopup(false); inputRefs.current[9]?.focus(); }}
                onClose={() => setKontoPopup(false)}
              />
            )}
          </div>
          {/* Leistungsdatum */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Leistungsdatum:</div>
            <input ref={el => { inputRefs.current[9] = el; }}
              className="datev-input" style={{ width: '82px' }}
              placeholder="TT.MM.JJJJ"
              value={form.leistungsdatum}
              onChange={e => setForm(p => ({ ...p, leistungsdatum: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 9)} />
          </div>
          {/* KOST1 */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>KOST1:</div>
            <input ref={el => { inputRefs.current[10] = el; }}
              className="datev-input" style={{ width: '50px' }}
              value={form.kost1}
              onChange={e => setForm(p => ({ ...p, kost1: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 10)} />
          </div>
          {/* Skonto */}
          <div>
            <div style={{ fontSize: '10px', marginBottom: '1px', fontWeight: 'bold' }}>Skonto:</div>
            <input ref={el => { inputRefs.current[11] = el; }}
              className="datev-input" style={{ width: '66px', textAlign: 'right' }}
              value={form.skonto}
              onChange={e => setForm(p => ({ ...p, skonto: e.target.value }))}
              onKeyDown={e => handleKeyDown(e, 11)} />
          </div>
        </div>

        {/* Row 2: Buchungstext + action buttons */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '4px', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Buchungstext:</div>
          <input ref={el => { inputRefs.current[12] = el; }}
            className="datev-input" style={{ flex: 1 }}
            value={form.buchungstext}
            onChange={e => setForm(p => ({ ...p, buchungstext: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handlePost(); } if (e.key === 'Escape') setForm({ ...EMPTY_FORM }); }}
            placeholder="Buchungstext eingeben..." />
          <button className="datev-btn" style={{ padding: '1px 4px' }} title="Textvorlage">📋</button>
          <button className="datev-btn" style={{ padding: '1px 4px' }} title="Speichern">💾</button>
          <button className="datev-btn" style={{ padding: '1px 4px' }} title="Drucken">🖨️</button>
          {/* POST BUTTON */}
          <button
            className="datev-btn"
            id="post-buchung-btn"
            style={{ background: editingId ? '#CC6600' : '#4A9B3A', color: 'white', padding: '2px 10px', fontWeight: 'bold', fontSize: '13px' }}
            onClick={handlePost}
            title={editingId ? 'Buchung aktualisieren (Enter)' : 'Buchung übernehmen (Enter)'}>
            ✓
          </button>
          <button
            className="datev-btn"
            style={{ color: 'red', padding: '2px 6px', fontWeight: 'bold', fontSize: '13px' }}
            onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); }}
            title="Verwerfen (Esc)">
            ✕
          </button>
        </div>

        {/* Quick action links */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '11px', flexWrap: 'wrap' }}>
          {['Aufteilung starten', 'Rechnungen buchen', 'Zahlungen buchen', 'Buchungsvorschläge bearbeiten', 'Digitale Belege buchen'].map(l => (
            <span key={l} className="datev-link">➔ {l}</span>
          ))}
        </div>
      </div>

      {/* ---- Saldo footer ---- */}
      <div style={{ background: '#F0F0F0', borderTop: '1px solid #A0A0A0', padding: '3px 8px', flexShrink: 0 }}>
        {[
          { label: 'Gegenkonto', nr: form.gegenkonto, saldo: gegenSaldo },
          { label: 'Konto', nr: form.konto, saldo: kontoSaldo },
        ].map(({ label, nr, saldo }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '2px' }}>
            <span style={{ fontSize: '13px' }}>📁</span>
            <span style={{ fontWeight: 'bold', width: '80px' }}>{label}:</span>
            <span style={{ fontFamily: 'monospace', width: '50px' }}>{nr}</span>
            <span style={{ color: '#555', flex: 1 }}>{getAccountName(nr)}</span>
            <span>Saldo: EUR</span>
            <span style={{
              fontFamily: 'monospace', fontWeight: 'bold', width: '90px', textAlign: 'right',
              color: saldo < 0 ? '#CC0000' : saldo > 0 ? '#006600' : '#333'
            }}>
              {fmtEUR(Math.abs(saldo))}
              {saldo !== 0 && <span style={{ fontSize: '9px', marginLeft: '3px' }}>{saldo > 0 ? 'S' : 'H'}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
