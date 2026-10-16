'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/app/page';

type BilanzView = 'zeitraum' | 'bilanz' | 'guv' | 'konten';

const AUSWEIS_COLUMNS = ['Handelsrecht', 'Offenlegung', 'Steuerrecht', 'E-Bilanz', 'Digitaler Finanzbericht'];
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

export default function BilanzModule() {
  const { workspace } = useApp();
  const [view, setView] = useState<BilanzView>('zeitraum');
  const [showEinstellung, setShowEinstellung] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    rechtsform: 'Kapitalgesellschaft',
    abschlusstyp: 'Bilanz',
    groesse: 'Kleine Gesellschaft',
    guv: 'Gesamtkostenverfahren',
    wjBeginn: '01.01.2026',
    wjEnde: '31.12.2026',
  });

  // Compute balance for any account number
  const getBalance = useMemo(() => {
    return (nr: string): number => {
      let b = 0;
      workspace.buchungen.forEach(buch => {
        if (buch.konto === nr) b += buch.sh === 'S' ? buch.umsatz : -buch.umsatz;
        if (buch.gegenkonto === nr) b += buch.sh === 'H' ? buch.umsatz : -buch.umsatz;
      });
      return b;
    };
  }, [workspace.buchungen]);

  const computeGroup = (accountNrs: string[]) =>
    accountNrs.reduce((sum, nr) => sum + Math.abs(getBalance(nr)), 0);

  const fmtEUR = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ========== AKTIVA ==========
  const AKTIVA_STRUCTURE = [
    {
      label: 'A. Anlagevermögen', key: 'AV',
      items: [
        { label: 'I. Immaterielle Vermögensgegenstände', accounts: ['0030'] },
        { label: 'II. Sachanlagen', accounts: ['215','235','250','420','421','440','500','520','540','620','650','675'] },
        { label: 'III. Finanzanlagen', accounts: [] },
      ]
    },
    {
      label: 'B. Umlaufvermögen', key: 'UV',
      items: [
        { label: 'I. Vorräte', accounts: [] },
        { label: 'II. Forderungen aus LuL', accounts: ['4000','4001','4002','4003','4004','4005','4006','4007','4008','4009','1400'] },
        { label: 'III. Forderungen sonstige', accounts: ['1570','1571'] },
        { label: 'IV. Kassenbestand, Bankguthaben', accounts: ['1000','1200'] },
      ]
    },
    { label: 'C. Rechnungsabgrenzungsposten', key: 'RAP', items: [] },
  ];

  // ========== PASSIVA ==========
  const PASSIVA_STRUCTURE = [
    {
      label: 'A. Eigenkapital', key: 'EK',
      items: [
        { label: 'I. Gezeichnetes Kapital', accounts: [] },
        { label: 'II. Kapitalrücklage', accounts: [] },
        { label: 'III. Gewinnrücklagen', accounts: [] },
        { label: 'IV. Gewinn-/Verlustvortrag / EB-Konto', accounts: ['9008'] },
      ]
    },
    {
      label: 'B. Rückstellungen', key: 'RS',
      items: [{ label: 'Sonstige Rückstellungen', accounts: [] }]
    },
    {
      label: 'C. Verbindlichkeiten', key: 'VB',
      items: [
        { label: '1. ggü. Kreditinstituten', accounts: [] },
        { label: '4. aus Lieferungen und Leistungen', accounts: ['7000','7001','7002','7003','7004','7005','7006','7007','7008','7009'] },
        { label: '5. Steuerverbindlichkeiten', accounts: ['1770','1771','1780'] },
      ]
    },
  ];

  // ========== GuV ==========
  const GUV_STRUCTURE = [
    { label: '1. Umsatzerlöse', accounts: ['8000','8100','8400'], type: 'Ertrag' },
    { label: '2. Bestandsveränderungen', accounts: [], type: 'Ertrag' },
    { label: '3. Sonstige betriebliche Erträge', accounts: [], type: 'Ertrag' },
    { label: '4. Materialaufwand', accounts: ['4905'], type: 'Aufwand' },
    { label: '5. Personalaufwand', accounts: ['4955','4960'], type: 'Aufwand' },
    { label: '6. Abschreibungen', accounts: [], type: 'Aufwand' },
    { label: '7. Sonstige betriebliche Aufwendungen', accounts: ['4830','4901','4902','4903','4950','4985','4986','9000','9001'], type: 'Aufwand' },
    { label: '8. Zinsen und ähnliche Aufwendungen', accounts: [], type: 'Aufwand' },
    { label: '9. Steuern vom Einkommen', accounts: [], type: 'Aufwand' },
  ];

  const totalAktiva = AKTIVA_STRUCTURE.reduce((s, sec) =>
    s + (sec.items?.reduce((ss, it) => ss + computeGroup(it.accounts), 0) || 0), 0);
  const totalPassiva = PASSIVA_STRUCTURE.reduce((s, sec) =>
    s + (sec.items?.reduce((ss, it) => ss + computeGroup(it.accounts), 0) || 0), 0);

  const totalErtrag = GUV_STRUCTURE.filter(g => g.type === 'Ertrag').reduce((s, g) => s + computeGroup(g.accounts), 0);
  const totalAufwand = GUV_STRUCTURE.filter(g => g.type === 'Aufwand').reduce((s, g) => s + computeGroup(g.accounts), 0);
  const jahresergebnis = totalErtrag - totalAufwand;

  const year = settings.wjEnde.split('.')[2] || '2026';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0', flexShrink: 0 }}>
        {([
          { key: 'zeitraum', label: 'Zeitraum / Stammdaten' },
          { key: 'bilanz', label: 'Bilanz' },
          { key: 'guv', label: 'GuV' },
          { key: 'konten', label: 'Konten anschauen' },
        ] as { key: BilanzView; label: string }[]).map(t => (
          <div key={t.key} className={`datev-tab ${view === t.key ? 'active' : ''}`}
            onClick={() => setView(t.key)} style={{ cursor: 'pointer' }}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>

        {/* ============ ZEITRAUM / STAMMDATEN ============ */}
        {view === 'zeitraum' && (
          <div style={{ maxWidth: '860px' }}>
            <div className="datev-section-header" style={{ marginBottom: '10px' }}>
              Jahresabschluss – Zeitraum und Stammdaten
            </div>

            {/* WJ */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '6px', background: '#FFFFF0', border: '1px solid #D0D0A0' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Wirtschaftsjahr Beginn:</label>
                <input className="datev-input" style={{ width: '100px' }} value={settings.wjBeginn}
                  onChange={e => setSettings(p => ({ ...p, wjBeginn: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Ende:</label>
                <input className="datev-input" style={{ width: '100px' }} value={settings.wjEnde}
                  onChange={e => setSettings(p => ({ ...p, wjEnde: e.target.value }))} />
              </div>
            </div>

            {/* Dropdowns grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 220px', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
              {[
                { key: 'rechtsform', label: 'Rechtsform', options: ['Kapitalgesellschaft', 'Personengesellschaft', 'Einzelkaufmann', 'GbR'] },
                { key: 'abschlusstyp', label: 'Abschlusstyp', options: ['Bilanz', 'E/A-Rechnung', 'Einnahmenüberschuss'] },
                { key: 'groesse', label: 'Größe', options: ['Kleine Gesellschaft', 'Mittelgroße Gesellschaft', 'Große Gesellschaft'] },
                { key: 'guv', label: 'GuV-Methode', options: ['Gesamtkostenverfahren', 'Umsatzkostenverfahren'] },
              ].map(f => (
                <React.Fragment key={f.key}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>{f.label}:</label>
                  <select className="datev-select"
                    value={(settings as Record<string, string>)[f.key]}
                    onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </React.Fragment>
              ))}
            </div>

            {/* Ausweiswahlrechte link */}
            <div style={{ marginBottom: '12px' }}>
              <span className="datev-link" style={{ fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => setShowEinstellung(true)}>
                ➔ Ausweiswahlrechte verwalten
              </span>
            </div>

            {/* Auswertungsschema table */}
            <div className="datev-section-header" style={{ marginBottom: '6px' }}>Auswertungsschema</div>
            <table className="datev-table" style={{ marginBottom: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Auswertung</th>
                  {AUSWEIS_COLUMNS.map(c => <th key={c} style={{ textAlign: 'center' }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {['Bilanz', 'GuV', 'Anhang', 'Lagebericht'].map((row, ri) => (
                  <tr key={row}>
                    <td style={{ fontWeight: 'bold' }}>{row}</td>
                    {AUSWEIS_COLUMNS.map((c, ci) => (
                      <td key={c} style={{ textAlign: 'center' }}>
                        <input type="checkbox" defaultChecked={ci === 0} id={`ausweis-${ri}-${ci}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
                onClick={() => setView('bilanz')} id="open-bilanz-btn">
                ➔ Jahresabschluss entwickeln (Bilanz)
              </button>
              <button className="datev-btn" style={{ background: '#FFE8A0' }}
                onClick={() => setView('guv')} id="open-guv-btn">
                ➔ GuV
              </button>
            </div>
          </div>
        )}

        {/* ============ BILANZ ============ */}
        {view === 'bilanz' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="datev-section-header">
                Bilanz zum {settings.wjEnde} | {settings.rechtsform} | {settings.groesse}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>Methode: {settings.guv}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {/* AKTIVA */}
              <div style={{ flex: 1, border: '2px solid #A0A0A0', minWidth: '380px' }}>
                <div className="datev-section-header" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  AKTIVA
                </div>
                <table className="datev-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th style={{ textAlign: 'right', width: '110px' }}>{year} EUR</th>
                      <th style={{ textAlign: 'right', width: '110px', color: '#888' }}>Vorjahr EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AKTIVA_STRUCTURE.map(section => {
                      const sectionTotal = section.items?.reduce((s, it) => s + computeGroup(it.accounts), 0) || 0;
                      return (
                        <React.Fragment key={section.key}>
                          <tr>
                            <td colSpan={3} style={{ fontWeight: 'bold', background: '#E8E8E8', padding: '3px 6px', cursor: 'pointer' }}
                              onClick={() => setSelectedItem(section.label)}>
                              {section.label}
                            </td>
                          </tr>
                          {section.items?.map((item, idx) => {
                            const val = computeGroup(item.accounts);
                            return (
                              <tr key={idx} style={{ cursor: 'pointer' }}
                                onClick={() => { setSelectedItem(item.label); setView('konten'); }}>
                                <td style={{ paddingLeft: '20px', fontSize: '11px' }}>
                                  {item.label}
                                  {item.accounts.length > 0 && (
                                    <span style={{ fontSize: '9px', color: '#888', marginLeft: '4px' }}>
                                      [{item.accounts.join(', ')}]
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: val > 0 ? '#004400' : undefined }}>
                                  {fmtEUR(val)}
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>0,00</td>
                              </tr>
                            );
                          })}
                          {section.items && section.items.length > 0 && (
                            <tr style={{ background: '#F0F0F0', fontWeight: 'bold' }}>
                              <td style={{ paddingLeft: '12px', fontStyle: 'italic' }}>Summe {section.label.split('.')[0]}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtEUR(sectionTotal)}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>0,00</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {/* Bilanzsumme */}
                    <tr style={{ background: '#B5E6A2', fontWeight: 'bold', fontSize: '12px' }}>
                      <td style={{ padding: '4px 6px' }}>Bilanzsumme Aktiva</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '4px' }}>{fmtEUR(totalAktiva)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#555', padding: '4px' }}>0,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PASSIVA */}
              <div style={{ flex: 1, border: '2px solid #A0A0A0', minWidth: '380px' }}>
                <div className="datev-section-header" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  PASSIVA
                </div>
                <table className="datev-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th style={{ textAlign: 'right', width: '110px' }}>{year} EUR</th>
                      <th style={{ textAlign: 'right', width: '110px', color: '#888' }}>Vorjahr EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PASSIVA_STRUCTURE.map(section => {
                      const sectionTotal = section.items?.reduce((s, it) => s + computeGroup(it.accounts), 0) || 0;
                      return (
                        <React.Fragment key={section.key}>
                          <tr>
                            <td colSpan={3} style={{ fontWeight: 'bold', background: '#E8E8E8', padding: '3px 6px' }}>
                              {section.label}
                            </td>
                          </tr>
                          {section.items?.map((item, idx) => {
                            const val = computeGroup(item.accounts);
                            return (
                              <tr key={idx} style={{ cursor: 'pointer' }}
                                onClick={() => { setSelectedItem(item.label); setView('konten'); }}>
                                <td style={{ paddingLeft: '20px', fontSize: '11px' }}>
                                  {item.label}
                                  {item.accounts.length > 0 && (
                                    <span style={{ fontSize: '9px', color: '#888', marginLeft: '4px' }}>
                                      [{item.accounts.join(', ')}]
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: val > 0 ? '#AA0000' : undefined }}>
                                  {fmtEUR(val)}
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>0,00</td>
                              </tr>
                            );
                          })}
                          {section.items && section.items.length > 0 && (
                            <tr style={{ background: '#F0F0F0', fontWeight: 'bold' }}>
                              <td style={{ paddingLeft: '12px', fontStyle: 'italic' }}>Summe {section.label.split('.')[0]}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtEUR(sectionTotal)}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>0,00</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {/* Jahresergebnis row */}
                    {jahresergebnis !== 0 && (
                      <tr style={{ background: '#FFF8CC' }}>
                        <td style={{ paddingLeft: '20px', fontStyle: 'italic', fontSize: '11px' }}>
                          Jahresergebnis {jahresergebnis >= 0 ? '(Gewinn)' : '(Verlust)'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: jahresergebnis >= 0 ? '#006600' : '#CC0000', fontWeight: 'bold' }}>
                          {fmtEUR(Math.abs(jahresergebnis))}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>0,00</td>
                      </tr>
                    )}
                    <tr style={{ background: '#B5E6A2', fontWeight: 'bold', fontSize: '12px' }}>
                      <td style={{ padding: '4px 6px' }}>Bilanzsumme Passiva</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', padding: '4px' }}>
                        {fmtEUR(totalPassiva + Math.abs(jahresergebnis))}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#555', padding: '4px' }}>0,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bilanz check */}
            <div style={{ marginTop: '8px', padding: '6px 10px', background: totalAktiva === (totalPassiva + Math.abs(jahresergebnis)) ? '#C8F0C8' : '#FFD0D0', border: '1px solid #A0A0A0', fontSize: '11px', display: 'flex', gap: '16px' }}>
              <span>Aktiva: <strong>{fmtEUR(totalAktiva)}</strong></span>
              <span>Passiva: <strong>{fmtEUR(totalPassiva + Math.abs(jahresergebnis))}</strong></span>
              <span style={{ fontWeight: 'bold' }}>
                {totalAktiva === (totalPassiva + Math.abs(jahresergebnis)) ? '✓ Bilanz ausgeglichen' : `⚠ Differenz: ${fmtEUR(Math.abs(totalAktiva - totalPassiva - Math.abs(jahresergebnis)))}`}
              </span>
            </div>
          </div>
        )}

        {/* ============ GuV ============ */}
        {view === 'guv' && (
          <div style={{ maxWidth: '700px' }}>
            <div className="datev-section-header" style={{ marginBottom: '8px' }}>
              Gewinn- und Verlustrechnung – {settings.wjBeginn} bis {settings.wjEnde}
              <span style={{ marginLeft: '12px', fontSize: '10px', fontWeight: 'normal' }}>Methode: {settings.guv}</span>
            </div>
            <table className="datev-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>{year} EUR</th>
                  <th style={{ textAlign: 'right', width: '120px', color: '#888' }}>Vorjahr EUR</th>
                </tr>
              </thead>
              <tbody>
                {GUV_STRUCTURE.map((g, idx) => {
                  const val = computeGroup(g.accounts);
                  return (
                    <tr key={idx} style={{ cursor: 'pointer' }}
                      onClick={() => { setSelectedItem(g.label); setView('konten'); }}>
                      <td style={{ paddingLeft: '12px', fontSize: '11px' }}>
                        {g.label}
                        {g.type === 'Ertrag' && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#006600' }}>▲ Ertrag</span>}
                        {g.type === 'Aufwand' && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#AA0000' }}>▼ Aufwand</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: g.type === 'Ertrag' ? '#006600' : '#AA0000' }}>
                        {fmtEUR(val)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>0,00</td>
                    </tr>
                  );
                })}
                {/* Divider */}
                <tr><td colSpan={3} style={{ height: '2px', background: '#888' }}></td></tr>
                {/* Ergebnis */}
                <tr style={{ background: jahresergebnis >= 0 ? '#C8F0C8' : '#FFD0D0', fontWeight: 'bold' }}>
                  <td style={{ padding: '4px 12px', fontSize: '12px' }}>
                    Jahresergebnis {jahresergebnis >= 0 ? '(Jahresüberschuss)' : '(Jahresfehlbetrag)'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: jahresergebnis >= 0 ? '#006600' : '#CC0000', padding: '4px' }}>
                    {fmtEUR(Math.abs(jahresergebnis))}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888', padding: '4px' }}>0,00</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '8px', fontSize: '11px', color: '#555', display: 'flex', gap: '16px' }}>
              <span>Gesamterlöse: <strong style={{ color: '#006600' }}>{fmtEUR(totalErtrag)}</strong></span>
              <span>Gesamtaufwand: <strong style={{ color: '#AA0000' }}>{fmtEUR(totalAufwand)}</strong></span>
            </div>
          </div>
        )}

        {/* ============ KONTEN ANSCHAUEN ============ */}
        {view === 'konten' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <div className="datev-section-header" style={{ marginBottom: 0 }}>
                Konten anschauen
                {selectedItem && <span style={{ fontWeight: 'normal', marginLeft: '8px', color: '#555' }}>→ {selectedItem}</span>}
              </div>
              <button className="datev-btn" onClick={() => setSelectedItem(null)}>Alle Konten</button>
            </div>
            <table className="datev-table">
              <thead>
                <tr>
                  <th>Konto</th>
                  <th>Bezeichnung</th>
                  <th>Typ</th>
                  <th>Bilanz-Kategorie</th>
                  <th style={{ textAlign: 'right' }}>Saldo Soll EUR</th>
                  <th style={{ textAlign: 'right' }}>Saldo Haben EUR</th>
                  <th style={{ textAlign: 'right', fontWeight: 'bold' }}>Netto-Saldo EUR</th>
                </tr>
              </thead>
              <tbody>
                {workspace.accounts
                  .map(a => {
                    let soll = 0, haben = 0;
                    workspace.buchungen.forEach(b => {
                      if (b.konto === a.number) { if (b.sh === 'S') soll += b.umsatz; else haben += b.umsatz; }
                      if (b.gegenkonto === a.number) { if (b.sh === 'H') soll += b.umsatz; else haben += b.umsatz; }
                    });
                    return { ...a, soll, haben, netto: soll - haben };
                  })
                  .filter(a => a.soll !== 0 || a.haben !== 0)
                  .sort((a, b) => a.number.localeCompare(b.number))
                  .map(a => (
                    <tr key={a.number} style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedItem(a.name)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{a.number}</td>
                      <td>{a.name}</td>
                      <td>
                        <span style={{
                          padding: '1px 4px', borderRadius: '2px', fontSize: '10px',
                          background: a.type === 'Aktiva' ? '#D0E8FF' : a.type === 'Passiva' ? '#FFD0D0' :
                            a.type === 'Aufwand' ? '#FFE8C0' : a.type === 'Ertrag' ? '#C0FFD0' :
                            a.type === 'Debitor' ? '#E0D0FF' : '#FFD0FF',
                        }}>{a.type}</span>
                      </td>
                      <td style={{ fontSize: '10px', color: '#555' }}>{a.bilanzCategory}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#006600' }}>{a.soll ? fmtEUR(a.soll) : ''}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#AA0000' }}>{a.haben ? fmtEUR(a.haben) : ''}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: a.netto < 0 ? '#CC0000' : a.netto > 0 ? '#006600' : undefined }}>
                        {fmtEUR(Math.abs(a.netto))} {a.netto > 0 ? 'S' : a.netto < 0 ? 'H' : ''}
                      </td>
                    </tr>
                  ))}
                {workspace.buchungen.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#888', fontStyle: 'italic' }}>
                      Keine Buchungen vorhanden – Bitte zuerst Buchungen erfassen
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ EINSTELLUNG MODAL ============ */}
      {showEinstellung && (
        <div className="modal-overlay" onClick={() => setShowEinstellung(false)}>
          <div className="modal-window" style={{ width: '620px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Einstellung – Ausweiswahlrechte verwalten</span>
              <button onClick={() => setShowEinstellung(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '8px', fontSize: '11px', color: '#555' }}>
                Konfigurieren Sie die Ausweisoptionen für jeden Berichtsrahmen:
              </div>
              <table className="datev-table">
                <thead>
                  <tr>
                    <th style={{ width: '240px' }}>Ausweisoption</th>
                    {AUSWEIS_COLUMNS.map(c => <th key={c} style={{ textAlign: 'center', fontSize: '10px' }}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Aktivierung selbsterstellter immat. VG',
                    'Ausschüttung nach Bilanzerstellung',
                    'Bildung Rücklage für eigene Anteile',
                    'Disagio als Rechnungsabgrenzung',
                    'Forderungsaufgliederung Restlaufzeit',
                    'Latente Steuern',
                    'Rückstellungen für Pensionen',
                    'Eventualverbindlichkeiten',
                  ].map(opt => (
                    <tr key={opt}>
                      <td style={{ fontSize: '11px' }}>{opt}</td>
                      {AUSWEIS_COLUMNS.map(c => (
                        <td key={c} style={{ textAlign: 'center' }}>
                          <select className="datev-select" style={{ width: '76px', fontSize: '10px' }}>
                            <option>Nein</option>
                            <option>Ja</option>
                            <option>Pflicht</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="datev-btn" style={{ background: '#B5E6A2', fontWeight: 'bold' }}
                onClick={() => { setShowEinstellung(false); setView('bilanz'); }}
                id="einstellung-ok-btn">
                OK
              </button>
              <button className="datev-btn" onClick={() => setShowEinstellung(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
