'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HABIT_MODULES, cleanCitations } from '../lib/habitsContent';

export default function HabitsHub({
  habits = [],
  practices = [],
  onSaveHabit,
  onRecordPractice,
  onGoToJournal,
  session
}) {
  const [selectedModule, setSelectedModule] = useState(HABIT_MODULES[0]);
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'my-habits'
  const [newHabit, setNewHabit] = useState({
    title: '',
    reminder: '',
    routine: '',
    reward: '',
    is_keystone: false,
    substitute_for: ''
  });
  const [savingHabit, setSavingHabit] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const practicedTodayIds = new Set(
    practices.filter(p => p.practiced_at === today).map(p => p.habit_id)
  );

  async function handleCreateHabit(e) {
    e.preventDefault();
    if (!newHabit.title.trim() || !newHabit.reminder.trim() || !newHabit.routine.trim()) return;
    setSavingHabit(true);
    setStatusMessage('');
    try {
      await onSaveHabit(newHabit);
      setNewHabit({
        title: '',
        reminder: '',
        routine: '',
        reward: '',
        is_keystone: false,
        substitute_for: ''
      });
      setStatusMessage('¡Hábito incorporado con éxito!');
      setActiveTab('my-habits');
    } catch (err) {
      setStatusMessage('No se pudo guardar el hábito. Intenta nuevamente.');
    } finally {
      setSavingHabit(false);
    }
  }

  return (
    <section className="habits-hub-section" aria-label="Módulo de Hábitos Poderosos">
      <header className="habits-header">
        <p className="eyebrow">METODOLOGÍA DE LAS 3 R & PRÁCTICA DIARIA</p>
        <h2>Hábitos Poderosos</h2>
        <p className="hint">
          Construye sistemas microscópicos y anclajes conscientes para consolidar tu autorregulación.
        </p>

        {/* Selector de Pestañas */}
        <div className="habits-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'modules'}
            className={`habits-tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            📚 Módulos & Metodología
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'my-habits'}
            className={`habits-tab-btn ${activeTab === 'my-habits' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-habits')}
          >
            🌱 Mis Hábitos Activos ({habits.length})
          </button>
        </div>
      </header>

      {activeTab === 'modules' ? (
        <div className="habits-modules-layout">
          {/* Navegación lateral de módulos */}
          <nav className="modules-nav" aria-label="Lista de módulos de hábitos">
            {HABIT_MODULES.map(m => (
              <button
                key={m.id}
                type="button"
                className={`module-nav-item ${selectedModule.id === m.id ? 'active' : ''}`}
                onClick={() => setSelectedModule(m)}
              >
                <div className="module-nav-thumb">
                  {m.coverImage && (
                    <img
                      src={m.coverImage}
                      alt=""
                      className="module-thumb-img"
                    />
                  )}
                </div>
                <div className="module-nav-text">
                  <span className="module-nav-index">Módulo 0{m.id}</span>
                  <h4>{m.title}</h4>
                  <small>{m.subtitle}</small>
                </div>
              </button>
            ))}
          </nav>

          {/* Contenido del módulo seleccionado */}
          <article className="module-content-card">
            <div className="module-banner">
              {selectedModule.coverImage && (
                <img
                  src={selectedModule.coverImage}
                  alt={selectedModule.title}
                  className="module-banner-img"
                />
              )}
              <div className="module-banner-overlay">
                <span className="eyebrow">MÓDULO 0{selectedModule.id}</span>
                <h3>{selectedModule.title}</h3>
                <p>{selectedModule.subtitle}</p>
              </div>
            </div>

            <div className="module-sections-flow">
              {selectedModule.sections.map(section => (
                <div key={section.id} className="module-section-item">
                  {section.type === 'theory' ? (
                    <div className="theory-block">
                      <h4>{section.title}</h4>
                      {section.image && (
                        <div className="theory-illustration">
                          <img
                            src={section.image}
                            alt=""
                            className="theory-img"
                          />
                        </div>
                      )}
                      <div className="theory-text">
                        {cleanCitations(section.content)
                          .split('\n\n')
                          .map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="action-block-card">
                      <div className="action-badge">🎯 PRÁCTICA DEL MÓDULO</div>
                      <h4>{section.title}</h4>
                      <p className="action-desc">{section.description}</p>

                      {section.suggestedTriggers && (
                        <div className="suggested-pills">
                          <span className="pill-title">Sugerencias de Recordatorio (Gatillo):</span>
                          <div className="pills-wrap">
                            {section.suggestedTriggers.map((t, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="trigger-pill-btn"
                                onClick={() =>
                                  setNewHabit(prev => ({ ...prev, reminder: t }))
                                }
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botón rápido para saltar al creador */}
                      <button
                        type="button"
                        className="secondary-cta"
                        style={{ marginTop: '14px' }}
                        onClick={() => {
                          setActiveTab('my-habits');
                          if (!newHabit.title) {
                            setNewHabit(prev => ({
                              ...prev,
                              title: `Hábito Módulo ${selectedModule.id}`
                            }));
                          }
                        }}
                      >
                        ⚡ Diseñar este hábito en Mis Hábitos →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="my-habits-layout">
          {/* Creador de Hábitos (3R) */}
          <div className="create-habit-card">
            <h3>🌱 Define un Nuevo Hábito (3 R)</h3>
            <p className="hint">
              Un recordatorio cotidiano claro, una rutina microscópica y una recompensa consciente.
            </p>

            <form onSubmit={handleCreateHabit} className="create-habit-form">
              <div className="form-field">
                <label htmlFor="h-title">Nombre o Identidad del Hábito</label>
                <input
                  id="h-title"
                  type="text"
                  required
                  placeholder="Ej.: Pausa consciente de hidratación y calma"
                  value={newHabit.title}
                  onChange={e => setNewHabit({ ...newHabit, title: e.target.value })}
                />
              </div>

              <div className="form-field-grid">
                <div className="form-field">
                  <label htmlFor="h-reminder">1. Recordatorio (Gatillo)</label>
                  <input
                    id="h-reminder"
                    type="text"
                    required
                    placeholder="Ej.: Al terminar la primera reunión de la mañana"
                    value={newHabit.reminder}
                    onChange={e => setNewHabit({ ...newHabit, reminder: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="h-routine">2. Rutina (Acción simple)</label>
                  <input
                    id="h-routine"
                    type="text"
                    required
                    placeholder="Ej.: Beber un vaso de agua y respirar 3 veces"
                    value={newHabit.routine}
                    onChange={e => setNewHabit({ ...newHabit, routine: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="h-reward">3. Recompensa (Frase de refuerzo)</label>
                <input
                  id="h-reward"
                  type="text"
                  placeholder="Ej.: Sonreír y decirme 'Un momento de claridad ganado'"
                  value={newHabit.reward}
                  onChange={e => setNewHabit({ ...newHabit, reward: e.target.value })}
                />
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newHabit.is_keystone}
                    onChange={e => setNewHabit({ ...newHabit, is_keystone: e.target.checked })}
                  />
                  <span>
                    <strong>Marcar como Hábito Clave (Keystone):</strong> Desencadena un efecto dominó en mi bienestar.
                  </span>
                </label>
              </div>

              <div className="form-actions-row">
                <button
                  type="submit"
                  className="primary-cta"
                  disabled={savingHabit || !session}
                >
                  {savingHabit ? 'Guardando...' : session ? 'Guardar Hábito' : 'Accede para Guardar'}
                </button>
                {statusMessage && <span className="status-msg">{statusMessage}</span>}
              </div>
            </form>
          </div>

          {/* Listado de Hábitos y Prácticas */}
          <div className="habits-list-container">
            <h3>Tus Hábitos en Seguimiento</h3>
            {habits.length === 0 ? (
              <p className="hint">
                Aún no has registrado hábitos. Comienza diseñando el primero con la regla de las 3 R arriba.
              </p>
            ) : (
              <div className="habits-cards-grid">
                {habits.map(habit => {
                  const isDoneToday = practicedTodayIds.has(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className={`habit-tracker-card ${isDoneToday ? 'done-today' : ''}`}
                    >
                      <div className="habit-card-header">
                        <div>
                          {habit.is_keystone && <span className="keystone-badge">⭐ Clave</span>}
                          <h4>{habit.title}</h4>
                        </div>
                        <button
                          type="button"
                          className={`practice-check-btn ${isDoneToday ? 'checked' : ''}`}
                          disabled={!session}
                          onClick={() => onRecordPractice(habit.id)}
                          title={isDoneToday ? '¡Completado hoy!' : 'Registrar práctica de hoy'}
                        >
                          {isDoneToday ? '✓ Practicado hoy' : 'Marcar práctica hoy'}
                        </button>
                      </div>

                      <div className="habit-3r-details">
                        <div className="r-item">
                          <span className="r-tag">Recordatorio</span>
                          <p>{habit.reminder}</p>
                        </div>
                        <div className="r-item">
                          <span className="r-tag">Rutina</span>
                          <p>{habit.routine}</p>
                        </div>
                        {habit.reward && (
                          <div className="r-item">
                            <span className="r-tag">Recompensa</span>
                            <p>{habit.reward}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
