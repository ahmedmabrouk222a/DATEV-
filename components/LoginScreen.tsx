'use client';
import { useState } from 'react';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } catch {
      setError('Benutzername oder Passwort ist falsch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '3px', fontFamily: 'Arial' }}>
            DATEV
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            Kanzlei-Rechnungswesen – Schulungsumgebung
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Anmeldung</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>DATEV Arbeitsplatz V.17.1</div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
            {/* DATEV Icon */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px', height: '64px', background: '#003399', borderRadius: '8px',
                margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #A0A0A0'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '22px', fontFamily: 'Arial' }}>D</span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '3px', fontWeight: 'bold' }}>
                Benutzer:
              </label>
              <input
                className="datev-input"
                style={{ width: '100%' }}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="z.B. user1 oder admin"
                autoFocus
                id="login-username"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '3px', fontWeight: 'bold' }}>
                Passwort:
              </label>
              <input
                className="datev-input"
                style={{ width: '100%' }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                id="login-password"
              />
            </div>

            {error && (
              <div style={{
                background: '#FFE0E0', border: '1px solid #FF0000', color: '#CC0000',
                padding: '4px 8px', fontSize: '11px', marginBottom: '10px'
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              className="datev-btn"
              type="submit"
              disabled={loading}
              id="login-submit"
              style={{ width: '100%', justifyContent: 'center', background: loading ? '#D0D0D0' : '#F0F0F0' }}
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>

            <div style={{ marginTop: '12px', fontSize: '10px', color: '#666', borderTop: '1px solid #D0D0D0', paddingTop: '8px' }}>
              <strong>Schüler:</strong> user1–user10 | Passwörter: 1001–1010<br/>
              <strong>Admin:</strong> admin | Passwort: admin123
            </div>
          </form>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>
          © DATEV eG – Schulungsumgebung (nicht lizenziert)
        </div>
      </div>
    </div>
  );
}
