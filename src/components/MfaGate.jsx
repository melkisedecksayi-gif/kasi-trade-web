
import React, { useEffect, useRef, useState } from 'react';

import {
  getMfaStatus,
  beginTotpEnrollment,
  verifyTotpCode,
} from '../services/mfaTotp';

export default function MfaGate({ supabase, onVerified }) {
  const [view, setView] = useState('loading');
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const verifiedCallback = useRef(onVerified);
  verifiedCallback.current = onVerified;

  useEffect(() => {
    let active = true;

    async function checkMfa() {
      try {
        const status = await getMfaStatus(supabase);

        if (!active) return;

        if (status === 'verified') {
          verifiedCallback.current();
          return;
        }

        const { data, error: factorError } =
          await supabase.auth.mfa.listFactors();

        if (factorError) throw factorError;

        if (!active) return;

        const factor = data?.totp?.[0];

        if (factor) {
          setFactorId(factor.id);
          setView('challenge');
        } else {
          setView('enroll');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'MFA check imeshindwa');
          setView('error');
        }
      }
    }

    checkMfa();

    return () => {
      active = false;
    };
  }, [supabase]);

  const enroll = async () => {
    setBusy(true);
    setError('');

    try {
      const result = await beginTotpEnrollment(supabase);
      setFactorId(result.factorId);
      setQrCode(result.qrCode);
      setView('challenge');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await verifyTotpCode(supabase, factorId, code);
      verifiedCallback.current();
    } catch (err) {
      setError(err.message || 'OTP si sahihi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 390,
        background: 'white',
        padding: 28,
        borderRadius: 16,
        boxShadow: '0 8px 30px #0001',
        textAlign: 'center',
        color: '#1e293b'
      }}>
        <h2>KasiTrade Security</h2>

        {view === 'loading' && <p>Inakagua usalama...</p>}

        {view === 'enroll' && (
          <>
            <p>Washa Google Authenticator ili kulinda akaunti yako.</p>
            <button onClick={enroll} disabled={busy}>
              {busy ? 'Inasubiri...' : 'Anza kuweka Authenticator'}
            </button>
          </>
        )}

        {view === 'challenge' && (
          <form onSubmit={verify}>
            {qrCode && (
              <>
                <p>Scan QR hii kwenye Google Authenticator.</p>
                <img
                  src={qrCode}
                  alt="Authenticator QR"
                  style={{ width: 200, maxWidth: '100%' }}
                />
              </>
            )}

            <p>Ingiza code ya tarakimu 6 kutoka Authenticator.</p>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e =>
                setCode(e.target.value.replace(/\D/g, ''))
              }
              placeholder="000000"
              style={{
                width: '100%',
                padding: 12,
                textAlign: 'center',
                fontSize: 22,
                boxSizing: 'border-box'
              }}
            />

            <button
              type="submit"
              disabled={busy || code.length !== 6}
              style={{ marginTop: 15, padding: 12, width: '100%' }}
            >
              {busy ? 'Inahakiki...' : 'Thibitisha Code'}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          style={{
            marginTop: 20,
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          Toka kwenye akaunti
        </button>
      </div>
    </div>
  );
}
