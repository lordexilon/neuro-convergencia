'use client';

import { useState, useEffect, useMemo } from 'react';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export default function AiMirror({ data = {}, onAdoptLearning }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [adopted, setAdopted] = useState(false);
  const [byokKey, setByokKey] = useState('');
  const [showByok, setShowByok] = useState(false);

  // Generar clave única para el contenido actual
  const contentSignature = useMemo(() => {
    const raw = [
      data.context || '',
      data.battery || 50,
      data.reactivity || '',
      data.bias || '',
      data.calib1 || '',
      data.calib2 || '',
      data.calib3 || ''
    ].join('::');
    return simpleHash(raw);
  }, [data]);

  // Cargar clave BYOK y caché local al montar o cambiar contenido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedKey = localStorage.getItem('neuro_byok_grok_key') || '';
        setByokKey(storedKey);

        const cached = localStorage.getItem('neuro_ai_cache_' + contentSignature);
        if (cached) {
          setResult(JSON.parse(cached));
        } else {
          setResult(null);
        }
      } catch {}
    }
  }, [contentSignature]);

  const saveByokKey = (val) => {
    setByokKey(val);
    try {
      if (val.trim()) {
        localStorage.setItem('neuro_byok_grok_key', val.trim());
      } else {
        localStorage.removeItem('neuro_byok_grok_key');
      }
    } catch {}
  };

  const requestReflection = async () => {
    if (loading) return;
    setLoading(true);
    setAdopted(false);

    try {
      const res = await fetch('/api/ai/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryData: data,
          byokApiKey: byokKey
        })
      });

      const json = await res.json();
      if (json && json.reflection) {
        setResult(json);
        try {
          localStorage.setItem('neuro_ai_cache_' + contentSignature, JSON.stringify(json));
        } catch {}
      }
    } catch (err) {
      // Si por alguna razón la red se cortó antes de llegar al servidor Next.js,
      // fallback estático directo para jamás dejar al usuario colgado
      const fallbackLocal = {
        source: 'offline_heuristic',
        model: 'heuristic-engine',
        reflection: [
          '🌿 **Espejo de Capas:** Reacción registrada en tu bitácora. Observa si proviene del impulso reactivo o de tu centro.',
          '⚖️ **Pausa y Realidad:** Conecta con tu respiración y valida los hechos objetivos comprobables.',
          '🎯 **Micro-Paso Consciente:** Da un solo paso a la vez, cuidando tu energía disponible (' + (data.battery || 50) + '%).'
        ].join('\n\n'),
        fallback: true
      };
      setResult(fallbackLocal);
    } finally {
      setLoading(false);
    }
  };

  const handleAdopt = () => {
    if (!result || !result.reflection || !onAdoptLearning) return;
    // Extraer el micro-paso consciente o la reflexión completa
    const lines = result.reflection.split('\n\n');
    const microStep = lines.find(l => l.includes('Micro-Paso') || l.includes('🎯')) || lines[lines.length - 1];
    const cleanText = microStep.replace(/^[^:]+:\s*/, '').trim();
    onAdoptLearning(cleanText || result.reflection);
    setAdopted(true);
  };

  return (
    <section className="ai-mirror-card" aria-label="Espejo del Observador Consciente">
      <div className="ai-mirror-header">
        <div className="ai-mirror-title-box">
          <span className="ai-mirror-icon" aria-hidden="true">🔮</span>
          <div>
            <h3>Espejo del Observador</h3>
            <p className="ai-mirror-sub">Síntesis pedagógica de tus 3 capas y polaridades</p>
          </div>
        </div>

        {result && (
          <span className={`ai-badge ${result.source === 'grok' ? 'badge-grok' : 'badge-offline'}`}>
            {result.source === 'grok' ? '✨ Grok AI' : '🌱 Sabiduría Esencial'}
          </span>
        )}
      </div>

      <div className="ai-mirror-body">
        {!result && !loading && (
          <div className="ai-prompt-box">
            <p>
              ¿Deseas una lectura socrática inmediata de lo que viviste? Integra tu reactividad biológica (60%),
              emocional (30%) y mental (10%) en una guía clara.
            </p>
            <button
              type="button"
              className="ai-trigger-btn"
              onClick={requestReflection}
            >
              <span>✨ Consultar al Observador</span>
              <small>Inferencia rápida · Zero-Hang</small>
            </button>
          </div>
        )}

        {loading && (
          <div className="ai-loading-box" role="status">
            <div className="ai-pulse-dot" aria-hidden="true" />
            <p>Sintonizando con el Observador consciente... (máx. 6s)</p>
          </div>
        )}

        {result && !loading && (
          <div className="ai-result-box">
            <div className="ai-reflection-text">
              {result.reflection.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="ai-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="ai-result-actions">
              {onAdoptLearning && (
                <button
                  type="button"
                  className={`ai-adopt-btn ${adopted ? 'adopted' : ''}`}
                  onClick={handleAdopt}
                  disabled={adopted}
                >
                  {adopted ? '✓ Adoptado en Integración' : '📌 Adoptar Micro-Paso como Aprendizaje'}
                </button>
              )}

              <button
                type="button"
                className="ai-refresh-btn"
                onClick={requestReflection}
                title="Volver a consultar"
              >
                🔄 Recalibrar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ai-mirror-footer">
        <button
          type="button"
          className="byok-toggle-btn"
          onClick={() => setShowByok(!showByok)}
          aria-expanded={showByok}
        >
          ⚙️ {showByok ? 'Ocultar ajustes de clave' : 'Configurar clave xAI personal (Opcional)'}
        </button>

        {showByok && (
          <div className="byok-card">
            <label htmlFor="byok-input">API Key de Grok (xAI) para tu cuenta:</label>
            <div className="byok-input-row">
              <input
                id="byok-input"
                type="password"
                placeholder="xai-..."
                value={byokKey}
                onChange={(e) => saveByokKey(e.target.value)}
              />
              {byokKey && (
                <button
                  type="button"
                  className="byok-clear-btn"
                  onClick={() => saveByokKey('')}
                >
                  Limpiar
                </button>
              )}
            </div>
            <p className="hint">
              Se almacena solo en este navegador. Si no ingresas una clave, se utiliza el motor compartido o el motor offline automático.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
