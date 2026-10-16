'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/app/page';
import AccountPopup from '@/components/AccountPopup';
import { BU_STEUER_MAP } from '@/lib/types';

// Helper functions for BU display
const getBULabel = (bu: string) => BU_STEUER_MAP[bu]?.label || 'Kein Steuerschlüssel';
const getSteuerkonto = (bu: string, sh: 'S'|'H'): string | null => {
  const m = BU_STEUER_MAP[bu];
  if (!m) return null;
  return m.vorsteuerkonto || m.uststeuerkonto || null;
};

export default function KontoblattModule() {
  const { workspace } = useApp();
  const [kontoNr, setKontoNr] = useState('');
  const [wj, setWj] = useState('01.01.2026');
  const [showPopup, setShowPopup] = useState(false);
  const [sortBy, setSortBy] = useState<'Belegdatum'|'Datum'>('Belegdatum');
  const [bereich, setBereich] = useState('Handelsrecht');
  const [zeitraum, setZeitraum] = useState<'Jahr'|'Monat'|'Monatsbereich'>('Jahr');
  const [showStorno, setShowStorno] = useState(true);

  const account = workspace.accounts.find(a => a.number === kontoNr);

  // Find all transactions for this account
  const buchungen = useMemo(() => {
    if (!kontoNr) return [];
    return workspace.buchungen.filter(b =>
      b.konto === kontoNr || b.gegenkonto === kontoNr
    ).sort((a, b) => a.nr - b.nr);
  }, [kontoNr, workspace.buchungen]);

  // Compute EB, Soll, Haben, Saldo
  const { ebWert, sollSum, habenSum, saldo } = useMemo(() => {
    let eb = 0, soll = 0, haben = 0;
    workspace.buchungen.forEach(b => {
      const isKonto = b.konto === kontoNr;
      const isGegen = b.gegenkonto === kontoNr;
      // EB entries have buchungstext starting with 'EB'
      const isEB = b.buchungstext?.startsWith('EB') || b.belegfeld1 === 'EB-2026';
      const amt = b.umsatz;
      if (isEB) {
        if (isKonto && b.sh === 'S') eb += amt;
        if (isKonto && b.sh === 'H') eb -= amt;
        if (isGegen && b.sh === 'H') eb += amt;
        if (isGegen && b.sh === 'S') eb -= amt;
      } else {
        if (isKonto && b.sh === 'S') soll += amt;
        if (isKonto && b.sh === 'H') haben += amt;
        if (isGegen && b.sh === 'H') soll += amt;
        if (isGegen && b.sh === 'S') haben += amt;
      }
    });
    return { ebWert: eb, sollSum: soll, habenSum: haben, saldo: eb + soll - haben };
  }, [kontoNr, workspace.buchungen]);

  const fmtEUR = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getAccountName = (nr: string) => workspace.accounts.find(a => a.number === nr)?.name || '';

  const prevAccount = () => {
    const idx = workspace.accounts.findIndex(a => a.number === kontoNr);
    if (idx > 0) setKontoNr(workspace.accounts[idx - 1].number);
  };

  const nextAccount = () => {
    const idx = workspace.accounts.findIndex(a => a.number === kontoNr);
    if (idx < workspace.accounts.length - 1) setKontoNr(workspace.accounts[idx + 1].number);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tab */}
        <div style={{ display: 'flex', padding: '4px 4px 0', background: '#E0E0E0', borderBottom: '1px solid #A0A0A0' }}>
          <div className="datev-tab active">Kontoblatt ✕</div>
        </div>

        {/* Account selector bar */}
        <div style={{ padding: '4px 8px', borderBottom: '1px solid #A0A0A0', background: '#F8F8F8', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold', fontSize: '11px' }}>Konto:</label>
          <button className="datev-btn" style={{ padding: '1px 3px' }} onClick={() => setKontoNr(workspace.accounts[0]?.number || '')}>|◀</button>
          <button className="datev-btn" style={{ padding: '1px 3px' }} onClick={prevAccount}>◀</button>
          <div style={{ position: 'relative' }}>
            <input
              className="datev-input"
              style={{ width: '100px', background: '#FFFF99', border: '1px solid #316AC5', fontWeight: 'bold' }}
              value={kontoNr}
              onChange={e => setKontoNr(e.target.value)}
              onFocus={() => setShowPopup(true)}
              placeholder="Kontonr."
              id="kontoblatt-kontonr"
            />
            {showPopup && (
              <AccountPopup
                accounts={workspace.accounts}
                search={kontoNr}
                onSelect={a => { setKontoNr(a.number); setShowPopup(false); }}
                onClose={() => setShowPopup(false)}
              />
            )}
          </div>
          {account && (
            <span style={{ fontSize: '11px', color: '#333' }}>{account.name}</span>
          )}
          <button className="datev-btn" style={{ padding: '1px 3px' }} onClick={nextAccount}>▶</button>
          <button className="datev-btn" style={{ padding: '1px 3px' }} onClick={() => setKontoNr(workspace.accounts[workspace.accounts.length-1]?.number || '')}>▶|</button>

          {/* Input bar for description */}
          <input className="datev-input" style={{ flex: 1 }} readOnly value={account ? `${account.number} – ${account.name}` : ''} />

          <label style={{ fontWeight: 'bold', fontSize: '11px' }}>WJ:</label>
          <button className="datev-btn" style={{ padding: '1px 3px' }}>◀</button>
          <select className="datev-select" style={{ width: '100px' }} value={wj} onChange={e => setWj(e.target.value)}>
            <option>01.01.2026</option>
            <option>01.01.2025</option>
          </select>
          <button className="datev-btn" style={{ padding: '1px 3px' }}>▶</button>
        </div>

        {/* Summary strip */}
        <div style={{ padding: '3px 8px', borderBottom: '1px solid #A0A0A0', background: '#F0F0F0', display: 'flex', gap: '32px', fontSize: '11px' }}>
          <div><span style={{ color: '#555' }}>Funktion</span></div>
          <div>
            <div style={{ color: '#555' }}>EB-Wert</div>
            <div style={{ fontFamily: 'monospace' }}>{fmtEUR(ebWert)}</div>
          </div>
          <div>
            <div style={{ color: '#555' }}>Saldo</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: saldo < 0 ? 'red' : undefined }}>{fmtEUR(saldo)}</div>
          </div>
          <div>
            <div style={{ color: '#555' }}>JVZ-Soll</div>
            <div style={{ fontFamily: 'monospace' }}>{fmtEUR(sollSum)}</div>
          </div>
          <div>
            <div style={{ color: '#555' }}>JVZ-Haben</div>
            <div style={{ fontFamily: 'monospace' }}>{fmtEUR(habenSum)}</div>
          </div>
        </div>

        {/* Transactions table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {!kontoNr ? (
            <div className="no-data-placeholder">
              <div style={{ fontSize: '48px', opacity: 0.3 }}>📄</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Bitte eine Kontonummer eingeben</div>
            </div>
          ) : buchungen.length === 0 ? (
            <div className="no-data-placeholder">
              <div style={{ fontSize: '48px', opacity: 0.3 }}>📄</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Keine Buchungen für Konto {kontoNr}</div>
            </div>
          ) : (
            <table className="datev-table" style={{ minWidth: '1400px' }}>
              <thead>
                <tr>
                  <th>BL</th>
                  <th style={{ background: '#CCFF99' }}>Datum ▲</th>
                  <th>Leistungsdatum</th>
                  <th>GU</th><th>BU</th>
                  <th>Gegenkonto</th>
                  <th>Buchungstext</th>
                  <th>USt%</th>
                  <th>Belegfeld1</th>
                  <th style={{ textAlign: 'right' }}>Umsatz Soll</th>
                  <th style={{ textAlign: 'right' }}>Umsatz Haben</th>
                  <th>WKZ</th>
                  <th style={{ textAlign: 'right' }}>Eingabebetrag</th>
                  <th>Kurs</th>
                  <th>Stapel-Nr.</th>
                  <th>BSNr</th>
                  <th>HK</th>
                  <th>Belegfeld2</th>
                </tr>
              </thead>
              <tbody>
                {buchungen.map(b => {
                  const isKonto = b.konto === kontoNr;
                  // Soll if: konto and S, or gegenkonto and H
                  const inSoll = (isKonto && b.sh === 'S') || (!isKonto && b.sh === 'H');
                  const gegenNr = isKonto ? b.gegenkonto : b.konto;
                  const buCode = b.bu || '';
                  const ustPct = buCode === '9' ? '19' : buCode === '8' ? '7' : buCode === '3' ? '19' : '';

                  return (
                    <tr key={b.id} style={{ cursor: 'pointer' }}>
                      <td></td>
                      <td>{b.datum}</td>
                      <td>{b.leistungsdatum}</td>
                      <td>{b.gu}</td>
                      <td>{b.bu}</td>
                      <td style={{ fontFamily: 'monospace' }}>{gegenNr} {getAccountName(gegenNr) ? `(${getAccountName(gegenNr).substring(0,14)})` : ''}</td>
                      <td>{b.buchungstext}</td>
                      <td style={{ textAlign: 'right' }}>{ustPct ? `${ustPct}%` : ''}</td>
                      <td>{b.belegfeld1}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: inSoll ? '#006600' : undefined }}>
                        {inSoll ? fmtEUR(b.umsatz) : ''}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: !inSoll ? '#CC0000' : undefined }}>
                        {!inSoll ? fmtEUR(b.umsatz) : ''}
                      </td>
                      <td>{b.wkz}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtEUR(b.umsatz)}</td>
                      <td>1,0000</td>
                      <td style={{ fontSize: '10px' }}>{workspace.stapel.find(s => s.id === b.stapelId)?.nummer}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{b.nr}</td>
                      <td></td>
                      <td>{b.belegfeld2}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '2px 8px', borderTop: '1px solid #A0A0A0', background: '#F0F0F0', display: 'flex', gap: '32px', fontSize: '11px' }}>
          <span>Anzahl: {buchungen.length}</span>
          <span>Saldo: {fmtEUR(saldo)}</span>
          <span>Umsatz Soll: {fmtEUR(sollSum)}</span>
          <span>Umsatz Haben: {fmtEUR(habenSum)}</span>
        </div>

        {/* Details panel at bottom */}
        <div style={{ height: '24px', borderTop: '1px solid #A0A0A0', background: '#F8F8F8', display: 'flex', alignItems: 'center', padding: '2px 8px', fontSize: '11px' }}>
          Details
          <button className="datev-btn" style={{ marginLeft: 'auto', padding: '0 4px', height: '18px' }}>📌</button>
          <button className="datev-btn" style={{ padding: '0 4px', height: '18px' }}>✕</button>
        </div>
      </div>

      {/* Right Eigenschaften sidebar */}
      <div className="datev-sidebar">
        <div className="datev-sidebar-section">
          <div className="datev-sidebar-title">▼ Eigenschaften</div>
          <div style={{ padding: '4px' }}>
            <div className="datev-link" style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>➔ Einstellungen</div>
            <div className="datev-link" style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>➔ Kontenumfang</div>
            <div className="datev-link" style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>➔ Druckeinstellungen</div>
          </div>
        </div>
        <div className="datev-sidebar-section">
          <div className="datev-sidebar-title">▼ Bereich</div>
          <div style={{ padding: '4px' }}>
            <select className="datev-select" style={{ width: '100%' }}
              value={bereich} onChange={e => setBereich(e.target.value)}>
              <option>Handelsrecht</option>
              <option>Steuerrecht</option>
            </select>
          </div>
        </div>
        <div className="datev-sidebar-section">
          <div className="datev-sidebar-title">▼ Zeitraum</div>
          <div style={{ padding: '4px' }}>
            {(['Jahr','Monat','Monatsbereich'] as const).map(z => (
              <div key={z} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <input type="radio" checked={zeitraum === z} onChange={() => setZeitraum(z)} />
                <label style={{ fontSize: '11px' }}>{z}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="datev-sidebar-section">
          <div className="datev-sidebar-title">▼ Umfang und Varianten</div>
          <div style={{ padding: '4px' }}>
            <div style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>– Stornobuchungen –</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <input type="checkbox" checked={!showStorno} onChange={e => setShowStorno(!e.target.checked)} />
              <label style={{ fontSize: '11px' }}>stornierte Buchungen ausblenden</label>
            </div>
            <div style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>– Sortierung –</div>
            <div style={{ fontSize: '11px', marginBottom: '2px' }}>Sortieren nach:</div>
            <select className="datev-select" style={{ width: '100%' }}
              value={sortBy} onChange={e => setSortBy(e.target.value as 'Belegdatum'|'Datum')}>
              <option>Belegdatum</option>
              <option>Datum</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
