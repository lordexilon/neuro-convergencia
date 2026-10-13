'use client';

import {useState} from 'react';
import VideoPromo from './VideoPromo';

const layers = [
  {
    id: 'temperamento',
    name: 'Temperamento',
    weight: '60%',
    kabbalahName: 'Nefesh (El Alma Biológica)',
    badge: 'Base Biológica & Instintiva',
    level: 'El Piso Inferior',
    desc: 'Representa la base biológica, genética e instintiva inalterable. Dicta las respuestas viscerales primarias de supervivencia (ataque, huida, congelamiento) y los deseos esenciales (seguridad, alimento, afecto o placer).',
    insight: 'En la Kabalá práctica, Nefesh no se combate ni se juzga: se calma y se guía. Reconocer el detonante biológico evita que secuestre tus decisiones.',
    accent: '#b86d63',
    hotspotPosition: {top: '80%', left: '50%'}
  },
  {
    id: 'caracter',
    name: 'Carácter',
    weight: '30%',
    kabbalahName: 'Ruaj (El Alma Emocional)',
    badge: 'Dimensión Emocional Aprendida',
    level: 'El Piso Intermedio',
    desc: 'Representa la dimensión emocional moldeada durante la infancia y los vínculos familiares. Contiene los patrones defensivos aprendidos, las heridas emocionales y el filtro moral.',
    insight: 'Ruaj es el puente entre el instinto y la consciencia superior. Aquí se realiza el trabajo de rectificación (Tikún): sanar patrones reactivos y equilibrar el corazón.',
    accent: '#8e7a4b',
    hotspotPosition: {top: '46%', left: '50%'}
  },
  {
    id: 'personalidad',
    name: 'Personalidad',
    weight: '10%',
    kabbalahName: 'Neshamá (El Alma Consciente)',
    badge: 'Estructura Consciente & Social',
    level: 'El Piso Superior',
    desc: 'Representa el nivel analítico, lógico y contemplativo consciente. Es la chispa de claridad y la envoltura externa con la que interactuamos en el mundo.',
    insight: 'El objetivo de Neshamá es gobernar con sabiduría amorosa sobre Ruaj y Nefesh, alineando la fachada social con la autenticidad del propósito interior.',
    accent: '#3e6a52',
    hotspotPosition: {top: '14%', left: '50%'}
  }
];

const sefirotData = [
  {
    id: 'jesed',
    name: 'Jesed',
    translation: 'Benevolencia & Expansión',
    pillar: 'Columna Derecha (Fuerza Expansiva)',
    color: '#d69e43',
    desc: 'Energía de amor desbordante, optimismo y entrega incondicional. En la conducta cotidiana se manifiesta como deseo de conectar, empatía y generosidad.',
    tikun: 'Rectificación consciente: Establecer límites sanos para evitar la sobre-entrega, el desgaste por complacer o la falta de discernimiento.'
  },
  {
    id: 'guevura',
    name: 'Guevurá',
    translation: 'Rigor, Disciplina & Límites',
    color: '#b66355',
    pillar: 'Columna Izquierda (Fuerza de Contención)',
    desc: 'Energía de discernimiento, estructura, precaución y evaluación de riesgos. En la conducta cotidiana se manifiesta como orden, foco y firmeza.',
    tikun: 'Rectificación consciente: Flexibilizar el control para evitar caer en ira, juicio implacable, perfeccionismo rígido o pesimismo paralizante.'
  },
  {
    id: 'tiferet',
    name: 'Tiféret',
    translation: 'Armonía & Belleza Interior',
    color: '#497c64',
    pillar: 'Columna Central (Eje Equilibrador)',
    desc: 'El corazón consciente que armoniza el dar de Jesed con la contención de Guevurá. Es la verdad empática y la compasión con claridad objetiva.',
    tikun: 'Rectificación consciente: Aplicar la pausa de calibración consciente. Tomar perspectiva para no actuar ni por exceso de afecto ni por exceso de dureza.'
  },
  {
    id: 'netzaj-hod',
    name: 'Netzaj & Hod',
    translation: 'Acción Persistente vs. Gratitud Receptiva',
    color: '#55768d',
    pillar: 'Dinámica de Manifestación',
    desc: 'Netzaj aporta la fuerza para avanzar y superar obstáculos. Hod aporta la humildad para escuchar, rendirse al aprendizaje y agradecer los hechos tal como son.',
    tikun: 'Rectificación consciente: Pasar a la acción dirigida sin atropellar, manteniendo la escucha activa y la adaptabilidad.'
  },
  {
    id: 'yesod-maljut',
    name: 'Yesod & Maljut',
    translation: 'Fundamento & Manifestación Concreta',
    color: '#76614e',
    pillar: 'Aterrizaje en lo Real',
    desc: 'Yesod concentra la intención y la coherencia emocional. Maljut es la realidad física: tus hábitos tangibles, palabras dichas y acciones visibles.',
    tikun: 'Rectificación consciente: Alinear lo que sientes y piensas con lo que efectivamente haces en tu día a día, sin disociación ni apariencias.'
  }
];

const polaritiesData = {
  activo: {
    id: 'activo',
    title: 'Nivel Energético: Activo',
    icon: '⚡',
    badge: 'Movimiento & Dinamismo',
    desc: 'Orientado a la acción dirigida, el movimiento constante y la perseverancia. Su fortaleza es la iniciativa, pero requiere dirección consciente para evitar actuar por impulso o desgaste atropellado.',
    focus: 'Pasar a la acción con propósito, evitando la inactividad reflexiva excesiva.',
    tone: '#d18642'
  },
  pasivo: {
    id: 'pasivo',
    title: 'Nivel Energético: Pasivo / Receptivo',
    icon: '🛡️',
    badge: 'Regulación & Receptividad',
    desc: 'Enfocado en la regulación de la batería energética, la observación y la receptividad. Evita el agotamiento preservando recursos vitales y sintonizando con el entorno.',
    focus: 'Hacer pausas conscientes para no desgastarse ni actuar en piloto automático.',
    tone: '#567e9b'
  },
  positiva: {
    id: 'positiva',
    title: 'Polaridad Energética: Positiva',
    icon: '☀️',
    badge: 'Certeza & Optimismo',
    desc: 'Opera desde la confianza, la expansión afectiva y la generación de entusiasmo. Su cualidad es irradiar seguridad, aunque debe cuidar de no sobre-entregarse sin límites claros.',
    focus: 'Establecer límites sanos a la entrega emocional sin perder calidez.',
    tone: '#b59247'
  },
  preventiva: {
    id: 'preventiva',
    title: 'Polaridad Energética: Preventiva',
    icon: '🔍',
    badge: 'Evaluación de Riesgo & Detalle',
    desc: 'Se enfoca en el cuestionamiento constructivo, la previsión y la atención minuciosa al detalle. Protege contra errores, pero debe evitar caer en rigidez o pesimismo paralizante.',
    focus: 'Flexibilizar el control y diferenciar precauciones reales de miedos hipotéticos.',
    tone: '#688274'
  }
};

const spheres = [
  {
    id: 'personal',
    name: 'Vida Personal',
    icon: '🧘',
    summary: 'Hábitos, salud física y balance de energía.',
    question: '¿Cómo está tu batería energética y tu autocuidado hoy?',
    action: 'Evalúa tus horas de sueño, nutrición y momentos de silencio para recargar vitalidad.'
  },
  {
    id: 'profesional',
    name: 'Vida Profesional',
    icon: '⚙️',
    summary: 'Rendimiento, talentos y propósito.',
    question: '¿Tus tareas diarias están alineadas con tus fortalezas reales?',
    action: 'Revisa qué actividades drenan tu energía y cuáles expanden tu motivación intrínseca.'
  },
  {
    id: 'social',
    name: 'Vida Social',
    icon: '👥',
    summary: 'Calidad relacional y límites asertivos.',
    question: '¿Tus vínculos son nutritivos o sientes compromiso forzado?',
    action: 'Practica decir «no» con amabilidad y claridad para proteger tu espacio personal.'
  },
  {
    id: 'familiar',
    name: 'Vida Familiar',
    icon: '🏡',
    summary: 'Patrones de origen y expectativas mutuas.',
    question: '¿Estás respondiendo al presente o a mandatos heredados?',
    action: 'Disuelve expectativas inconscientes y comunícate desde la adultez emocional.'
  },
  {
    id: 'pareja',
    name: 'Vida de Pareja',
    icon: '🤍',
    summary: 'Sintonía, biofrecuencia e intimidad consciente.',
    question: '¿Hay un espacio de escucha genuina sin demandas implícitas?',
    action: 'Monitorea la conexión afectiva cotidiana sin forzar el ritmo del otro.'
  }
];

const protocolSteps = [
  {
    index: 0,
    step: 'Paso 1',
    shortTitle: '1. Calmar el Instinto',
    title: 'Tranquilizar al Temperamento',
    subtitle: 'Desactivar la alarma biológica (Nefesh)',
    desc: 'Frente a un detonante, el instinto primario percibe amenaza y activa ataque o huida. La primera tarea es respirar, pausar el cuerpo y alejarse del estallido reactivo para recuperar el centro.',
    key: '«Pausa fisiológica y respiración consciente antes de cualquier palabra o acción»',
    tag: 'Fase de Calma'
  },
  {
    index: 1,
    step: 'Paso 2',
    shortTitle: '2. Contrastar Hechos',
    title: 'Aportar Evidencias Concretas',
    subtitle: 'Discernimiento y hechos verificables (Tiféret)',
    desc: 'Separar lo que realmente ocurrió de lo que la mente o la herida emocional suponen. Presentar datos, hechos comprobables y fechas concretas en lugar de juicios vagos o interpretaciones sesgadas.',
    key: '«¿Cuáles son los hechos observables sin juicio ni suposición?»',
    tag: 'Fase de Claridad'
  },
  {
    index: 2,
    step: 'Paso 3',
    shortTitle: '3. Respuesta Serena',
    title: 'Expresar el Estado Emocional con Calma',
    subtitle: 'Respuesta centrada y límites sanos (Maljut)',
    desc: 'Describir los propios sentimientos de manera directa, asertiva y serena. Eliminar la manipulación, el reproche o la victimización, canalizando una acción constructiva.',
    key: '«Comunicación clara y límites sanos desde la serenidad interna»',
    tag: 'Fase de Elección'
  }
];

export default function LandingPage({onGoToJournal, onStartOnboarding}) {
  const [selectedLayer, setSelectedLayer] = useState('temperamento');
  const [selectedSefira, setSelectedSefira] = useState('tiferet');
  const [selectedPolarity, setSelectedPolarity] = useState('activo');
  const [activeSphere, setActiveSphere] = useState('personal');
  const [activeStep, setActiveStep] = useState(0);

  const activeLayer = layers.find(l => l.id === selectedLayer) || layers[0];
  const activeSefira = sefirotData.find(s => s.id === selectedSefira) || sefirotData[2];
  const activePolarity = polaritiesData[selectedPolarity] || polaritiesData.activo;
  const currentSphere = spheres.find(s => s.id === activeSphere) || spheres[0];
  const currentStep = protocolSteps[activeStep] || protocolSteps[0];

  return (
    <div className="landing-wrap">
      {/* Hero Section */}
      <section className="landing-hero" aria-label="Introducción Neuro Convergencia">
        <p className="eyebrow">INTEGRACIÓN DE NEUROCOMPORTAMIENTO Y KABALÁ PRÁCTICA</p>
        <h1 className="hero-title">
          El Mapa del <span>Neurocomportamiento</span>
        </h1>
        <p className="hero-subtitle">
          Una micro-tecnología de autoconocimiento reflexivo. Revisa una reacción cotidiana en menos de 2 minutos, distingue hechos objetivos de interpretaciones y elige tu respuesta con serenidad consciente.
        </p>

        <div className="hero-cta-group">
          <button type="button" className="cta-button primary-cta" onClick={onStartOnboarding}>
            <span>Iniciar Onboarding Interactivo</span>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="cta-button secondary-cta" onClick={onGoToJournal}>
            <span>Abrir Bitácora de Reflexión</span>
          </button>
        </div>

        <VideoPromo />
      </section>

      {/* Las 3 Capas del Ser: Formato Vertical y Espacioso */}
      <section className="landing-section" id="capas" aria-labelledby="heading-capas">
        <div className="section-header">
          <p className="eyebrow">MARCO CONCEPTUAL PEDAGÓGICO & LAS 3 DIMENSIONES DEL ALMA</p>
          <h2 id="heading-capas">Las Tres Capas del Ser</h2>
          <p className="section-desc">
            Este esquema es un <strong>modelo pedagógico de auto-observación</strong> (no una medición clínica ni psicométrica). Los pesos representan la inercia instintiva relativa que experimentamos en situaciones de tensión, integrando la sabiduría de la Kabalá práctica con la comprensión de la reactividad humana.
          </p>
        </div>

        <div className="interactive-showcase vertical-mode">
          {/* Visual Container Vertical */}
          <div className="figure-container vertical-frame" aria-label="Ilustración vertical interactiva del ser">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mapa_ser_vertical.jpg"
              alt="Estructura del Ser: Neshamá 10% (Consciencia), Ruaj 30% (Emoción) y Nefesh 60% (Instinto)"
              className="figure-image portrait-img"
              loading="lazy"
            />
            {/* Hotspots interactivos bien espaciados */}
            {layers.map(layer => (
              <button
                key={layer.id}
                type="button"
                className={`figure-hotspot spacious-hotspot ${selectedLayer === layer.id ? 'active' : ''}`}
                style={{
                  top: layer.hotspotPosition.top,
                  left: layer.hotspotPosition.left,
                  '--hotspot-color': layer.accent
                }}
                onClick={() => setSelectedLayer(layer.id)}
                aria-label={`Ver ${layer.name} (${layer.weight})`}
              >
                <span className="hotspot-pulse" aria-hidden="true" />
                <span className="hotspot-label">{layer.weight} · {layer.name}</span>
              </button>
            ))}
          </div>

          {/* Details & Tabs */}
          <div className="layers-detail-col">
            <div className="layers-nav" role="tablist" aria-label="Capas del ser">
              {layers.map(layer => (
                <button
                  key={layer.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedLayer === layer.id}
                  className={`layer-tab-btn ${selectedLayer === layer.id ? 'active' : ''}`}
                  style={{'--layer-accent': layer.accent}}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <div className="layer-tab-meta">
                    <span className="layer-weight">{layer.weight}</span>
                    <span className="layer-name">{layer.name}</span>
                  </div>
                  <small className="layer-badge">{layer.kabbalahName}</small>
                </button>
              ))}
            </div>

            <div className="layer-card" style={{borderLeftColor: activeLayer.accent}}>
              <div className="layer-card-header">
                <span className="layer-pill" style={{backgroundColor: activeLayer.accent}}>
                  Peso conductual: {activeLayer.weight}
                </span>
                <span className="layer-level-label">{activeLayer.kabbalahName}</span>
              </div>
              <h3>{activeLayer.name} · {activeLayer.badge}</h3>
              <p className="layer-text">{activeLayer.desc}</p>
              <div className="layer-insight-box">
                <strong>Clave de Kabalá Práctica (Tikún):</strong>
                <p>{activeLayer.insight}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIADOR: Psicología Cabalística & Las Sefirot Emocionales */}
      <section className="landing-section kabbalah-section" id="sefirot" aria-labelledby="heading-sefirot">
        <div className="section-header">
          <p className="eyebrow">DIFERENCIADOR EXCLUSIVO</p>
          <h2 id="heading-sefirot">Psicología Cabalística & Tikún de Rasgos</h2>
          <p className="section-desc">
            En la Kabalá práctica, el Árbol de la Vida es un mapa de biofrecuencia emocional. Cada Sefirá representa una fuerza que requiere equilibrio consciente para no caer en el exceso o la carencia.
          </p>
        </div>

        <div className="sefirot-showcase">
          <div className="sefirot-img-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arbol_sefirot.jpg"
              alt="Árbol de la Vida y las Sefirot emocionales de Kabalá Práctica"
              className="sefirot-img"
              loading="lazy"
            />
            <div className="sefirot-tags-selector">
              {sefirotData.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`sefira-pill-btn ${selectedSefira === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedSefira(s.id)}
                  style={{'--sefira-color': s.color}}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="sefirot-card" style={{borderLeftColor: activeSefira.color}}>
            <div className="sefirot-pillar-tag">{activeSefira.pillar}</div>
            <h3>{activeSefira.name} · {activeSefira.translation}</h3>
            <p className="sefirot-desc">{activeSefira.desc}</p>
            <div className="tikun-box">
              <strong>Trabajo de Rectificación (Tikún Personal):</strong>
              <p>{activeSefira.tikun}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cargas y Polaridades Energéticas */}
      <section className="landing-section" id="polaridades" aria-labelledby="heading-polaridades">
        <div className="section-header">
          <p className="eyebrow">DINÁMICA VITAL</p>
          <h2 id="heading-polaridades">Cargas y Polaridades Energéticas</h2>
          <p className="section-desc">
            Reconoce los dos ejes dinámicos de tu energía: el ritmo de acción (Activo vs. Pasivo) y la orientación de percepción (Certeza vs. Prevención de Riesgos).
          </p>
        </div>

        <div className="polarities-layout-v2">
          {/* Selector Horizontal Centrado */}
          <div className="polarities-top-nav">
            {['activo', 'pasivo', 'positiva', 'preventiva'].map(key => {
              const item = polaritiesData[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`pol-top-btn ${selectedPolarity === key ? 'active' : ''}`}
                  onClick={() => setSelectedPolarity(key)}
                >
                  <span className="pol-btn-icon">{item.icon}</span>
                  <span className="pol-btn-label">{item.title.split(': ')[1]}</span>
                </button>
              );
            })}
          </div>

          <div className="polarities-showcase">
            <div className="polarities-visual-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/polaridades.jpg"
                alt="Diagrama armónico de polaridades energéticas"
                className="polarities-image"
                loading="lazy"
              />
            </div>

            <div className="polarity-card active-card" style={{borderLeftColor: activePolarity.tone}}>
              <div className="polarity-badge" style={{color: activePolarity.tone}}>
                {activePolarity.icon} {activePolarity.badge}
              </div>
              <h3>{activePolarity.title}</h3>
              <p className="polarity-desc">{activePolarity.desc}</p>
              <div className="polarity-focus-box">
                <strong>Punto de equilibrio consciente:</strong>
                <p>{activePolarity.focus}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auditoría de las 5 Esferas con Grid Uniforme */}
      <section className="landing-section" id="esferas" aria-labelledby="heading-esferas">
        <div className="section-header">
          <p className="eyebrow">EQUILIBRIO INTEGRAL</p>
          <h2 id="heading-esferas">Auditoría Semanal de las 5 Esferas de Vida</h2>
          <p className="section-desc">
            La integración se manifiesta en la realidad tangible. Selecciona una esfera para evaluar tus patrones habituales.
          </p>
        </div>

        <div className="spheres-interactive-layout">
          <div className="spheres-grid-5">
            {spheres.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`sphere-card-btn ${activeSphere === s.id ? 'active' : ''}`}
                onClick={() => setActiveSphere(s.id)}
              >
                <span className="sphere-number" aria-hidden="true">0{idx + 1}</span>
                <div className="sphere-icon" aria-hidden="true">{s.icon}</div>
                <h3>{s.name}</h3>
                <p>{s.summary}</p>
              </button>
            ))}
          </div>

          <div className="sphere-detail-panel">
            <div className="sphere-detail-header">
              <span className="sphere-detail-icon" aria-hidden="true">{currentSphere.icon}</span>
              <div>
                <h3>Auditoría: {currentSphere.name}</h3>
                <p>{currentSphere.summary}</p>
              </div>
            </div>
            <div className="sphere-question-box">
              <strong>Pregunta de auto-observación:</strong>
              <p>«{currentSphere.question}»</p>
            </div>
            <div className="sphere-action-box">
              <strong>Acción sugerida:</strong>
              <p>{currentSphere.action}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Protocolo de Autorregulación Consciente con Stepper Equilibrado */}
      <section className="landing-section" id="protocolo" aria-labelledby="heading-protocolo">
        <div className="section-header">
          <p className="eyebrow">METODOLOGÍA PRÁCTICA</p>
          <h2 id="heading-protocolo">Protocolo de Autorregulación y Límites Sanos</h2>
          <p className="section-desc">
            Un método guiado en 3 pasos sucesivos para transformar el impacto emocional en una respuesta reflexiva y serena.
          </p>
        </div>

        <div className="protocol-showcase-v2">
          {/* Stepper Superior Equilibrado */}
          <div className="protocol-steps-nav-v2">
            {protocolSteps.map((p, idx) => (
              <button
                key={p.step}
                type="button"
                className={`protocol-nav-btn-v2 ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <span className="nav-step-num">{p.step}</span>
                <span className="nav-step-title">{p.shortTitle}</span>
              </button>
            ))}
          </div>

          <div className="protocol-grid-v2">
            <div className="protocol-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/protocolo.jpg"
                alt="Ilustración armónica de los 3 pasos de autorregulación consciente"
                className="protocol-image"
                loading="lazy"
              />
            </div>

            <div className="protocol-active-card">
              <div className="protocol-card-head">
                <span className="protocol-tag">{currentStep.tag}</span>
                <span className="protocol-step-num-badge">{currentStep.step} de 3</span>
              </div>
              <h3>{currentStep.title}</h3>
              <p className="protocol-subtitle">{currentStep.subtitle}</p>
              <p className="protocol-desc">{currentStep.desc}</p>
              <div className="protocol-quote-box">
                {currentStep.key}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Section */}
      <section className="landing-footer-cta" aria-label="Llamado a la acción">
        <p className="eyebrow">EMPIEZA HOY</p>
        <h2>Conecta con tu centro en menos de dos minutos</h2>
        <p>
          Registra tus reflexiones en tu bitácora personal privada o realiza el onboarding guiado para descubrir tu perfil.
        </p>
        <div className="hero-cta-group">
          <button type="button" className="cta-button primary-cta" onClick={onStartOnboarding}>
            <span>Realizar Onboarding Guiado</span>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="cta-button secondary-cta" onClick={onGoToJournal}>
            <span>Abrir Bitácora Privada</span>
          </button>
        </div>
      </section>
    </div>
  );
}
