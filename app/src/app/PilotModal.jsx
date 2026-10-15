'use client';

import {useRef, useState} from 'react';
import ModalDialog from './ModalDialog';

export default function PilotModal({isOpen, onClose}) {
  const [role, setRole] = useState('participante');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(null);
  const requestSignature = useRef('');
  const inFlight = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    setError('');
    if (!name.trim() || !email.trim() || !contactConsent) {
      setError('Completa nombre y correo y autoriza el contacto.');
      return;
    }
    inFlight.current = true;
    setSaving(true);
    try {
      // Retain the same UUID across retries, including responses lost after commit.
      const signature = JSON.stringify([name.trim(), email.trim().toLowerCase(), role, contactConsent]);
      if (signature !== requestSignature.current) {
        requestId.current = crypto.randomUUID();
        requestSignature.current = signature;
      }
      const response = await fetch('/api/pilot/applications', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: requestId.current, name, email, role, contactConsent}),
        signal: AbortSignal.timeout(12000)
      });
      const result = await response.json();
      if (!response.ok || result.saved !== true || result.id !== requestId.current) {
        throw new Error(result.error || 'No pudimos confirmar el registro. Intenta nuevamente.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.name === 'TimeoutError' || err.name === 'AbortError'
        ? 'La confirmación demoró demasiado. Reintenta con el mismo formulario.'
        : err.message || 'No pudimos confirmar el registro. Intenta nuevamente.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <ModalDialog onClose={onClose} labelledBy="pilot-modal-title">
      <div className="pilot-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar modal">✕</button>

        {!submitted ? (
          <>
            <div className="pilot-modal-header">
              <span className="pilot-badge">Piloto · Hasta 20 participantes</span>
              <h2 id="pilot-modal-title">Únete al Piloto de 21 Días</h2>
              <p className="pilot-subtitle">
                21 días gratuitos, sin tarjeta ni renovación automática. Confirmaremos cupo y fecha por correo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pilot-form" aria-busy={saving}>
              <fieldset disabled={saving} style={{border: 0, padding: 0, margin: 0}}>
              <div className="form-group">
                <label className="form-label">¿Cómo te gustaría participar?</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-option ${role === 'participante' ? 'selected' : ''}`}
                    aria-pressed={role === 'participante'}
                    onClick={() => setRole('participante')}
                  >
                    <span className="role-icon">🌱</span>
                    <strong>Participante</strong>
                  </button>
                  <button
                    type="button"
                    className={`role-option ${role === 'facilitador' ? 'selected' : ''}`}
                    aria-pressed={role === 'facilitador'}
                    onClick={() => setRole('facilitador')}
                  >
                    <span className="role-icon">🧭</span>
                    <strong>Facilitador / Guía</strong>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pilot-name" className="form-label">Tu Nombre</label>
                <input
                  id="pilot-name"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pilot-input"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pilot-email" className="form-label">Tu Correo Electrónico</label>
                <input
                  id="pilot-email"
                  type="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pilot-input"
                  maxLength={254}
                  required
                />
              </div>

              <label className="form-label">
                <input type="checkbox" checked={contactConsent} onChange={e => setContactConsent(e.target.checked)} required />
                Autorizo el uso de estos datos para gestionar mi postulación y contactarme sobre el piloto.
              </label>
              <details className="pilot-data-details"><summary>Uso de datos y condiciones</summary>
                <p>Guardamos nombre, correo y rol para gestionar la postulación. No incluyas reflexiones ni datos de salud. Postularte no garantiza cupo. La medición de uso requiere autorización adicional; cualquier continuidad pagada se propondrá por separado.</p>
              </details>
              {error && <p role="alert">{error}</p>}

              <div className="pilot-actions">
                <button type="submit" className="cta-button primary-cta full-width">
                  <span>{saving ? 'Registrando solicitud…' : 'Postularme al Piloto Gratuito'}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              </fieldset>
            </form>
          </>
        ) : (
          <div className="pilot-success-view">
            <div className="success-icon">✨</div>
            <h2 id="pilot-modal-title" role="status">Solicitud registrada</h2>
            <p>
              Tu postulación quedó guardada. El registro no confirma un cupo ni el envío de un correo automático.
            </p>
            <p className="success-hint">
              El equipo organizador podrá contactarte por correo para confirmar disponibilidad y fecha de inicio.
            </p>
            <button type="button" className="cta-button secondary-cta" onClick={onClose}>
              Volver a la aplicación
            </button>
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
