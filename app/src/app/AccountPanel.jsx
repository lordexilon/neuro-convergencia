'use client';
import {useEffect, useState} from 'react';
import {productClient} from '../lib/supabase';

export default function AccountPanel({onSession}) {
  const [configured, setConfigured] = useState(null);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = productClient();
    setConfigured(!!client);
    if (!client) return;
    let alive = true;
    const apply = (value) => {
      if (alive) {
        setSession(value);
        onSession(value);
      }
    };
    client.auth.getSession().then(({data, error}) => {
      if (error && alive) setMessage('No se pudo recuperar la sesión.');
      else apply(data.session);
    });
    const {data} = client.auth.onAuthStateChange((_event, value) => apply(value));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [onSession]);

  // Paso 1: Solicitar código de 6 dígitos al correo
  async function requestOtpCode(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (typeof window !== 'undefined' && window.neuroSaveCurrentDraft) {
        window.neuroSaveCurrentDraft();
      }
      const {error} = await productClient().auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      });
      if (error) {
        if (error.status === 429 || error.message?.toLowerCase().includes('rate')) {
          throw new Error('Has solicitado varios accesos seguidos. Por seguridad, Supabase limita los envíos a 1 por minuto. Espera 60 segundos y vuelve a presionar el botón.');
        }
        throw error;
      }
      setStep('otp');
      setMessage('¡Código enviado! Revisa tu correo (busca "Your sign-in link" o código numérico). Escríbelo abajo.');
    } catch (err) {
      setMessage(err.message || 'No pudimos enviar el código. Revisa que el correo sea válido o inténtalo más tarde.');
    } finally {
      setBusy(false);
    }
  }

  // Paso 2: Verificar el código de 6 dígitos e iniciar sesión inmediatamente
  async function verifyOtpCode(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const cleanToken = otpToken.trim().replace(/\s+/g, '');
      const {data, error} = await productClient().auth.verifyOtp({
        email: email.trim(),
        token: cleanToken,
        type: 'email'
      });
      if (error) throw error;
      if (data?.session) {
        setStep('email');
        setOtpToken('');
        setMessage('¡Sesión iniciada con éxito! Tu bitácora privada ya está habilitada.');
      }
    } catch (err) {
      setMessage('El código ingresado no es válido o ya caducó. Intenta escribirlo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    setMessage('');
    try {
      const {error} = await productClient().auth.signOut();
      if (error) throw error;
      setStep('email');
      setOtpToken('');
    } catch {
      setMessage('No se pudo cerrar la sesión. Inténtalo otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account" aria-label="Acceso a tu bitácora">
      {configured === null ? (
        <p role="status">Comprobando acceso…</p>
      ) : !configured ? (
        <p>El guardado aún no está conectado. Puedes explorar el formulario como borrador temporal.</p>
      ) : session ? (
        <div className="account-row">
          <p>
            Tu bitácora privada <small>{session.user.email}</small>
          </p>
          <button type="button" className="secondary" disabled={busy} onClick={leave}>
            Cerrar sesión
          </button>
        </div>
      ) : step === 'email' ? (
        <form onSubmit={requestOtpCode}>
          <label htmlFor="login-email">Accede para guardar tu bitácora</label>
          <div className="account-row">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
            />
            <button className="primary" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar Código ➔'}
            </button>
          </div>
          <div className="hint-email-notice" style={{marginTop: '12px', padding: '14px 16px', background: '#f5f8f5', borderRadius: '12px', border: '1px solid #c9d8c8'}}>
            <p style={{margin: '0 0 6px', fontWeight: '700', color: '#1f362b', fontSize: '13px'}}>
              📬 ¿Cómo identificar el mensaje en tu bandeja?
            </p>
            <p style={{margin: '0 0 8px', fontSize: '12px', color: '#3d5648', lineHeight: '1.4'}}>
              El correo es emitido por el sistema seguro de autenticación. Búscalo así:
            </p>
            <div style={{background: '#ffffff', border: '1px solid #dce5db', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', fontSize: '12px', color: '#2b3f33'}}>
              <div><strong>De:</strong> <code>Supabase Auth &lt;noreply@mail.app.supabase.io&gt;</code></div>
              <div style={{marginTop: '4px'}}><strong>Asunto:</strong> <code>Your sign-in link</code> (o <code>Confirm your email</code>)</div>
            </div>
            <p style={{margin: 0, fontSize: '11px', color: '#627a6c', lineHeight: '1.4'}}>
              💡 <em>¿No aparece en tu bandeja principal?</em> Revisa la pestaña <strong>Promociones</strong> o la carpeta de <strong>Spam</strong>. Puedes ingresar copiando los 6 números del correo o pulsando directamente en el botón que contiene.
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtpCode} className="otp-verification-form">
          <label htmlFor="otp-token">Ingresa el código de 6 dígitos</label>
          <p className="hint" style={{margin: '4px 0 10px'}}>
            Enviado a <strong>{email}</strong>
          </p>
          <div className="account-row">
            <input
              id="otp-token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              required
              maxLength={8}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              placeholder="Ej. 123456"
              style={{fontSize: '18px', letterSpacing: '4px', textAlign: 'center'}}
            />
            <button className="primary" disabled={busy || otpToken.trim().length < 6}>
              {busy ? 'Verificando…' : 'Confirmar e Ingresar'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setStep('email');
                setMessage('');
              }}
            >
              Cambiar correo
            </button>
          </div>
        </form>
      )}
      {message && <p role="status" className="hint" style={{marginTop: '10px'}}>{message}</p>}
    </section>
  );
}
