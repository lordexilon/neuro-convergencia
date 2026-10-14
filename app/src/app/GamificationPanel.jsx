'use client';

import {useState} from 'react';
import {calculateMilestones, WEEKLY_CHALLENGE} from '../lib/gamification.cjs';

export default function GamificationPanel({entries = [], habits = [], practices = []}) {
  const [enabled, setEnabled] = useState(true);
  const milestones = calculateMilestones(entries, habits, practices);
  const unlockedCount = milestones.filter(m => m.unlocked).length;

  if (!enabled) {
    return (
      <aside className="gamification-minimized" aria-label="Progreso consciente minimizado">
        <button
          type="button"
          className="gamification-toggle-btn"
          onClick={() => setEnabled(true)}
        >
          <span>🌱 Hitos de Consciencia ({unlockedCount}/{milestones.length})</span>
          <span className="toggle-action">Mostrar</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="gamification-panel" aria-label="Progreso consciente e hitos de autoconocimiento">
      <div className="gamification-head">
        <div>
          <span className="eyebrow">AUTORREGULACIÓN & CONSTANCIA</span>
          <h3>Hitos de Autoconocimiento</h3>
        </div>
        <button
          type="button"
          className="gamification-close-btn"
          onClick={() => setEnabled(false)}
          title="Ocultar panel de hitos"
          aria-label="Ocultar panel de hitos"
        >
          Ocultar
        </button>
      </div>

      {/* Reto Semanal */}
      <div className="weekly-challenge-box">
        <div className="challenge-tag">
          <span aria-hidden="true">🎯</span>
          <span>{WEEKLY_CHALLENGE.title}</span>
        </div>
        <p>{WEEKLY_CHALLENGE.prompt}</p>
      </div>

      {/* Resumen de Hitos */}
      <div className="milestones-counter">
        <span>Emblemas alcanzados: <strong>{unlockedCount} de {milestones.length}</strong></span>
        <span>Reflexiones registradas: <strong>{entries.length}</strong></span>
      </div>

      {/* Grid de Emblemas */}
      <div className="milestones-grid">
        {milestones.map(m => (
          <div
            key={m.id}
            className={`milestone-badge-card ${m.unlocked ? 'unlocked' : 'in-progress'}`}
          >
            <div className="milestone-icon-wrap" aria-hidden="true">
              <span className="milestone-icon">{m.icon}</span>
              {m.unlocked && <span className="milestone-check">✓</span>}
            </div>
            <div className="milestone-info">
              <h4>{m.name}</h4>
              <p>{m.description}</p>
              <div className="milestone-progress-bar" role="progressbar" aria-valuenow={m.percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="milestone-progress-fill" style={{width: `${m.percent}%`}} />
              </div>
              <small className="milestone-progress-label">
                {m.unlocked ? '¡Completado!' : `${m.current} de ${m.target}`}
              </small>
            </div>
          </div>
        ))}
      </div>
      <p className="gamification-disclaimer">
        Este progreso es personal y privado. No penaliza pausas ni juzga tus emociones.
      </p>
    </aside>
  );
}
