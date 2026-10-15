'use client';
import {useState} from 'react';
import {productClient} from '../lib/supabase';

export default function AccountPanel({session, configured, beforeRequest}) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'sent'
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // The application root owns the single session subscription across all views.

  // Solicitar el enlace de acceso configurado en Supabase.
  async function requestAccessLink(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await beforeRequest?.();
      if (typeof window !== 'undefined' && window.neuroSaveCurrentDraft) {
        window.neuroSaveCurrentDraft();
      }
      const {error} = await productClient().auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: new URL("/", window.location.origin).href
        }
      });
      if (error) {
        if (error.status === 429 || error.message?.toLowerCase().includes('rate')) {
          throw new Error('Se alcanzó el límite temporal de solicitudes. Espera antes de volver a solicitar un enlace.');
        }
        throw error;
      }
      setStep('sent');
      setMessage('Solicitud de acceso enviada. Abre el enlace del mensaje más reciente para iniciar sesión. Usa este navegador para recuperar tu borrador.');
    } catch (err) {
      setMessage(err.message || 'No pudimos solicitar el enlace. Revisa que el correo sea válido o inténtalo más tarde.');
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
        <form onSubmit={requestAccessLink}>
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
              {busy ? 'Enviando…' : 'Enviar enlace de acceso ➔'}
            </button>
          </div>
          <details className="email-help"><summary>Ayuda para encontrar el correo de acceso</summary>
            <p>Revisa tu correo y la carpeta de spam. Abre el enlace del mensaje de acceso más reciente. No compartas ese enlace. Si ya caducó, solicita uno nuevo.</p>
          </details>
        </form>
      ) : (
        <div className="access-link-sent">
          <p>Revisa la bandeja de entrada y spam de <strong>{email}</strong>. El correo contiene un enlace de acceso; aquí no necesitas escribir un código.</p>
          <button type="button" className="secondary" disabled={busy} onClick={() => {setStep('email'); setMessage('');}}>
            Cambiar correo o solicitar otro enlace
          </button>
        </div>
      )}
      {message && <p role="status" className="hint" style={{marginTop: '10px'}}>{message}</p>}
    </section>
  );
}
