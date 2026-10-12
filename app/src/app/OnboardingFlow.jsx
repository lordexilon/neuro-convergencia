'use client';

import {useState} from 'react';
import {productClient} from '../lib/supabase';

const mockScenarios = [
  {
    id: 'critica',
    title: 'Recibes un comentario inesperado en el trabajo o familia',
    temperamento: 'Siento un golpe en el estómago y ganas de defenderme o alejarme de inmediato.',
    caracter: 'Pienso que «siempre me pasa lo mismo» o siento la herida de no ser valorado.',
    personalidad: 'Racionalizo buscando justificaciones lógicas o sobrepensando qué responder.'
  }
];

export default function OnboardingFlow({onComplete, onSkip}) {
  const [step, setStep] = useState(1);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [polarity, setPolarity] = useState('activo');
  const [observedLayer, setObservedLayer] = useState('');
  const [practicePhase, setPracticePhase] = useState(1);
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  const scenario = mockScenarios[0];

  async function handleRegister(e) {
    e.preventDefault();
    if (!email.trim() || sendingLink) return;
    setSendingLink(true);
    setAuthMessage('');
    try {
      const client = productClient();
      if (!client) throw new Error('Servicio de autenticación no disponible.');
      const {error} = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {emailRedirectTo: window.location.origin + '/'}
      });
      if (error) throw error;
      setLinkSent(true);
      setAuthMessage('¡Enlace enviado! Revisa tu bandeja de entrada para acceder directamente a tu bitácora privada.');
    } catch {
      setAuthMessage('No pudimos enviar el enlace en este momento. Puedes continuar explorando la bitácora directamente.');
    } finally {
      setSendingLink(false);
    }
  }

  return (
    <section className="onboarding-container" aria-label="Onboarding interactivo de Neuro Convergencia">
      {/* Header bar */}
      <div className="onboarding-header">
        <div className="onboarding-progress-badge">
          <span>Paso {step} de 4</span>
          <span className="onboarding-step-name">
            {step === 1 && 'Tu Energía Actual'}
            {step === 2 && 'Observa tus Capas'}
            {step === 3 && 'Aplica la Regulación'}
            {step === 4 && 'Tu Perfil & Acceso'}
          </span>
        </div>
        <button type="button" className="onboarding-skip-btn" onClick={onSkip}>
          Saltar a la Bitácora ✕
        </button>
      </div>

      <div className="onboarding-body">
        {/* Step 1: Batería y Polaridad */}
        {step === 1 && (
          <div className="onboarding-step-view">
            <p className="eyebrow">PASO 1 · TU ENERGÍA DE ORIGEN</p>
            <h2>¿Cómo sientes tu batería y ritmo vital hoy?</h2>
            <p className="hint">
              Antes de actuar o reflexionar, el primer paso es calibrar cuánta energía tienes disponible.
            </p>

            <div className="onboarding-card">
              <div className="energy-heading">
                <label htmlFor="onb-battery">Batería Energética Percibida</label>
                <output htmlFor="onb-battery">{energyLevel}%</output>
              </div>
              <input
                id="onb-battery"
                type="range"
                min={0}
                max={100}
                step={5}
                value={energyLevel}
                onChange={e => setEnergyLevel(Number(e.target.value))}
              />
              <div className="range-labels">
                <span>0% · Agotado</span>
                <span>50% · Equilibrado</span>
                <span>100% · Plena vitalidad</span>
              </div>
            </div>

            <fieldset className="onboarding-fieldset">
              <legend>¿Cuál es tu polaridad predominante en este momento?</legend>
              <div className="onboarding-polarity-options">
                <label className={`onb-option ${polarity === 'activo' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="polarity"
                    value="activo"
                    checked={polarity === 'activo'}
                    onChange={() => setPolarity('activo')}
                  />
                  <div>
                    <strong>⚡ Nivel Activo</strong>
                    <small>Siento impulso a moverme, resolver y tomar acción inmediata.</small>
                  </div>
                </label>

                <label className={`onb-option ${polarity === 'pasivo' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="polarity"
                    value="pasivo"
                    checked={polarity === 'pasivo'}
                    onChange={() => setPolarity('pasivo')}
                  />
                  <div>
                    <strong>🛡️ Nivel Receptivo</strong>
                    <small>Siento necesidad de pausar, observar y regular mi batería para no desgastarme.</small>
                  </div>
                </label>
              </div>
            </fieldset>

            <div className="actions">
              <button type="button" className="primary" onClick={() => setStep(2)}>
                Continuar al Paso 2 <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Reconoce la capa que reacciona */}
        {step === 2 && (
          <div className="onboarding-step-view">
            <p className="eyebrow">PASO 2 · ESTRUCTURA DEL SER</p>
            <h2>Imagina este detonante cotidiano</h2>
            <div className="scenario-box">
              <span className="scenario-tag">Situación de ejemplo</span>
              <p>«{scenario.title}»</p>
            </div>
            <p className="hint">
              ¿Cuál de estas tres capas suele tomar el control primero en ti?
            </p>

            <div className="onboarding-layers-selection">
              <label className={`onb-layer-choice ${observedLayer === 'temperamento' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="layer"
                  value="temperamento"
                  checked={observedLayer === 'temperamento'}
                  onChange={() => setObservedLayer('temperamento')}
                />
                <div className="onb-layer-info">
                  <span className="layer-tag-pill" style={{backgroundColor: '#b86d63'}}>Temperamento (60%)</span>
                  <strong>Reacción Biológica e Instintiva</strong>
                  <p>{scenario.temperamento}</p>
                </div>
              </label>

              <label className={`onb-layer-choice ${observedLayer === 'caracter' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="layer"
                  value="caracter"
                  checked={observedLayer === 'caracter'}
                  onChange={() => setObservedLayer('caracter')}
                />
                <div className="onb-layer-info">
                  <span className="layer-tag-pill" style={{backgroundColor: '#8e7a4b'}}>Carácter (30%)</span>
                  <strong>Patrón Emocional Aprendido</strong>
                  <p>{scenario.caracter}</p>
                </div>
              </label>

              <label className={`onb-layer-choice ${observedLayer === 'personalidad' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="layer"
                  value="personalidad"
                  checked={observedLayer === 'personalidad'}
                  onChange={() => setObservedLayer('personalidad')}
                />
                <div className="onb-layer-info">
                  <span className="layer-tag-pill" style={{backgroundColor: '#3e6a52'}}>Personalidad (10%)</span>
                  <strong>Sobrecarga Analítica Racional</strong>
                  <p>{scenario.personalidad}</p>
                </div>
              </label>
            </div>

            <div className="actions">
              <button type="button" className="secondary" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button type="button" className="primary" disabled={!observedLayer} onClick={() => setStep(3)}>
                Aplicar Regulación <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Mini-práctica de Autorregulación */}
        {step === 3 && (
          <div className="onboarding-step-view">
            <p className="eyebrow">PASO 3 · EL PROTOCOLO DE 3 PASOS</p>
            <h2>Experimenta la Autorregulación Consciente</h2>
            <p className="hint">
              Sigue la secuencia práctica para calmar el impulso y encontrar tu centro:
            </p>

            <div className="practice-stepper">
              <div className="practice-tabs">
                {['1. Calma', '2. Evidencias', '3. Respuesta'].map((tab, idx) => (
                  <button
                    key={tab}
                    type="button"
                    className={`practice-tab ${practicePhase === idx + 1 ? 'active' : ''}`}
                    onClick={() => setPracticePhase(idx + 1)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="practice-content-card">
                {practicePhase === 1 && (
                  <div>
                    <span className="phase-pill">Paso 1: Tranquilizar al Temperamento</span>
                    <h3>Pausa y respiración consciente</h3>
                    <p>
                      Desactiva la señal de peligro corporal. Toma una respiración profunda de 4 segundos, sostén y exhala despacio.
                    </p>
                    <div className="practice-exercise-box">
                      <strong>Micro-ejercicio:</strong> Haz una pausa de 5 segundos sin responder de inmediato.
                    </div>
                  </div>
                )}

                {practicePhase === 2 && (
                  <div>
                    <span className="phase-pill">Paso 2: Aportar Evidencias Concretas</span>
                    <h3>Diferencia hechos de suposiciones</h3>
                    <p>
                      ¿Qué pasó en la realidad observable? «Me hicieron una consulta puntual sobre los datos». Deja fuera las interpretaciones de que «lo hacen para atacarme».
                    </p>
                    <div className="practice-exercise-box">
                      <strong>Micro-ejercicio:</strong> Nombra un hecho comprobable sin emitir juicio moral.
                    </div>
                  </div>
                )}

                {practicePhase === 3 && (
                  <div>
                    <span className="phase-pill">Paso 3: Expresar con Calma</span>
                    <h3>Elige tu respuesta constructiva</h3>
                    <p>
                      Con los hechos claros y el cuerpo sereno, responde de forma directa, firme y amable.
                    </p>
                    <div className="practice-exercise-box">
                      <strong>Micro-ejercicio:</strong> «Comprendo tu punto. Revisemos juntos los números para avanzar».
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="actions">
              <button type="button" className="secondary" onClick={() => setStep(2)}>
                Atrás
              </button>
              <button type="button" className="primary" onClick={() => setStep(4)}>
                Ver mi Síntesis y Registrarme <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Síntesis & Registro con Supabase Auth */}
        {step === 4 && (
          <div className="onboarding-step-view">
            <p className="eyebrow">PASO 4 · REGISTRO Y BITÁCORA</p>
            <h2>Tu Síntesis de Consciencia</h2>
            <p className="hint">
              Has completado el mapa introductorio. Guarda tu cuenta para acceder a tu Bitácora privada permanente.
            </p>

            <div className="onboarding-summary-card">
              <div className="summary-item">
                <span>Batería inicial:</span>
                <strong>{energyLevel}%</strong>
              </div>
              <div className="summary-item">
                <span>Nivel energético:</span>
                <strong>{polarity === 'activo' ? '⚡ Activo (Iniciativa)' : '🛡️ Receptivo (Calibración)'}</strong>
              </div>
              <div className="summary-item">
                <span>Capa observada:</span>
                <strong>
                  {observedLayer === 'temperamento' && 'Temperamento Biológico (60%)'}
                  {observedLayer === 'caracter' && 'Carácter Emocional (30%)'}
                  {observedLayer === 'personalidad' && 'Personalidad Analítica (10%)'}
                </strong>
              </div>
            </div>

            {/* Formulario de Registro por Correo */}
            <div className="onboarding-auth-box">
              <h3>Crea o accede a tu cuenta privada</h3>
              <p className="auth-note">
                Acceso seguro por enlace de correo, sin contraseñas que recordar.
              </p>

              {linkSent ? (
                <div className="auth-success-alert" role="status">
                  <p>✓ {authMessage}</p>
                  <button type="button" className="primary" onClick={onComplete}>
                    Continuar a la Bitácora
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="onboarding-email-form">
                  <label htmlFor="onb-email">Ingresa tu correo electrónico</label>
                  <div className="email-input-row">
                    <input
                      id="onb-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                    />
                    <button type="submit" className="primary" disabled={sendingLink}>
                      {sendingLink ? 'Enviando…' : 'Recibir enlace'}
                    </button>
                  </div>
                  {authMessage && <p className="hint" role="status">{authMessage}</p>}
                </form>
              )}
            </div>

            <div className="actions">
              <button type="button" className="secondary" onClick={() => setStep(3)}>
                Atrás
              </button>
              <button type="button" className="secondary" onClick={onComplete}>
                Explorar Bitácora como Invitado
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
