'use client';

import {useState} from 'react';

export default function PilotModal({isOpen, onClose}) {
  const [role, setRole] = useState('participante');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Guardado local de prospectos para no perder interesados
    try {
      const existing = JSON.parse(localStorage.getItem('nc_pilot_leads') || '[]');
      existing.push({
        name: name.trim(),
        email: email.trim(),
        role,
        note: note.trim(),
        date: new Date().toISOString()
      });
      localStorage.setItem('nc_pilot_leads', JSON.stringify(existing));
    } catch {
      // ignore
    }

    // Preparar enlace mailto a alberto@applicandola.com
    const subject = encodeURIComponent(`[Piloto 21 Días] Postulación: ${name || 'Interesado/a'} (${role})`);
    const body = encodeURIComponent(
      `Hola Alberto,\n\nMe interesa participar en el Piloto de 21 Días de Neuro Convergencia.\n\n` +
      `Nombre: ${name}\n` +
      `Correo: ${email}\n` +
      `Rol: ${role === 'facilitador' ? 'Facilitador / Coach / Terapeuta' : 'Participante del Reto 21 Días'}\n` +
      `Comentarios/Motivación: ${note}\n\n` +
      `Quedo a la espera de la confirmación.\n`
    );

    window.open(`mailto:alberto@applicandola.com?subject=${subject}&body=${body}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="pilot-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="pilot-modal-title">
      <div className="pilot-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar modal">✕</button>

        {!submitted ? (
          <>
            <div className="pilot-modal-header">
              <span className="pilot-badge">Cohorte 1 · Cupos Limitados (20 lugares)</span>
              <h2 id="pilot-modal-title">Únete al Piloto de 21 Días</h2>
              <p className="pilot-subtitle">
                Experimenta el protocolo de autorregulación consciente y Kabalá práctica guiado por facilitadores.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pilot-form">
              <div className="form-group">
                <label className="form-label">¿Cómo te gustaría participar?</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-option ${role === 'participante' ? 'selected' : ''}`}
                    onClick={() => setRole('participante')}
                  >
                    <span className="role-icon">🌱</span>
                    <strong>Participante</strong>
                    <small>Quiero realizar el reto de 21 días para mí</small>
                  </button>
                  <button
                    type="button"
                    className={`role-option ${role === 'facilitador' ? 'selected' : ''}`}
                    onClick={() => setRole('facilitador')}
                  >
                    <span className="role-icon">🧭</span>
                    <strong>Facilitador / Guía</strong>
                    <small>Quiero guiar a mi comunidad o pacientes</small>
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
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pilot-note" className="form-label">
                  {role === 'facilitador' ? '¿A qué comunidad o público atiendes?' : '¿Qué objetivo de autorregulación buscas alcanzar?'} (Opcional)
                </label>
                <textarea
                  id="pilot-note"
                  rows={2}
                  placeholder={role === 'facilitador' ? 'Ej. Trabajo con grupos de meditación y coaching personal...' : 'Ej. Deseo aprender a gestionar la reactividad en el trabajo...'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="pilot-textarea"
                />
              </div>

              <div className="pilot-actions">
                <button type="submit" className="cta-button primary-cta full-width">
                  <span>Postularme al Piloto Gratuito</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="pilot-success-view">
            <div className="success-icon">✨</div>
            <h2>¡Solicitud Enviada con Éxito!</h2>
            <p>
              Hemos registrado tus datos y preparado el correo directo para <strong>alberto@applicandola.com</strong>.
            </p>
            <p className="success-hint">
              Te contactaremos a la brevedad con la fecha de inicio de la primera cohorte del piloto.
            </p>
            <button type="button" className="cta-button secondary-cta" onClick={onClose}>
              Volver a la aplicación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
