'use client';

import InlineText from './InlineText';

import {useEffect, useRef, useState} from 'react';
import {generateOfflineReflection} from '../lib/ai-mentor.cjs';
import {reflectionPayload} from '../lib/ai-privacy.cjs';
import {productClient} from '../lib/supabase';

export default function AiMirror({data = {}, ownerId = null, onAdoptLearning}) {
  const entry = reflectionPayload(data);
  // A new entry or account starts with no key, consent or cached reflection.
  return <MirrorSession key={JSON.stringify([ownerId, entry])} ownerId={ownerId} entry={entry} onAdoptLearning={onAdoptLearning}/>;
}

function MirrorSession({entry, ownerId, onAdoptLearning}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [adopted, setAdopted] = useState(false);
  const [byokKey, setByokKey] = useState('');
  const [showByok, setShowByok] = useState(false);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState('');
  const pending = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);

  const localReflection = () => ({source: 'offline_heuristic', reflection: generateOfflineReflection(entry)});
  const revokeConsent = () => {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
    setConsent(false);
    setByokKey('');
    setResult(null);
    setAdopted(false);
    setNotice('');
  };
  const requestReflection = async () => {
    if (!consent || !ownerId || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 18000);
    setLoading(true);
    setAdopted(false);
    setNotice('');
    try {
      const sessionResult = await productClient()?.auth.getSession();
      if (controller.signal.aborted || pending.current !== controller) return;
      const session = sessionResult?.data?.session;
      if (sessionResult?.error || !session?.access_token || session.user.id !== ownerId) {
        setResult(localReflection());
        setNotice('Inicia sesión nuevamente para consultar a Grok. La guía local sigue disponible.');
        return;
      }
      const response = await fetch('/api/ai/reflect', {
        method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`},
        body: JSON.stringify({entryData: entry, byokApiKey: byokKey, externalAiConsent: true}),
        signal: controller.signal
      });
      const json = await response.json();
      if (typeof json.reflection !== 'string') throw new Error('Unavailable');
      if (pending.current === controller) {
        setResult(json);
        if (json.fallback) setNotice(json.reason === 'quota_exceeded'
          ? 'Alcanzaste un límite de consultas o se agotó la cuota global. Se muestra la guía local.'
          : json.reason === 'sign_in_required'
            ? 'Inicia sesión nuevamente para consultar a Grok. Se muestra la guía local.'
            : 'La IA externa no está disponible. Se muestra la guía local.');
      }
    } catch {
      if (pending.current === controller) {
        setResult(localReflection());
        setNotice('No se pudo completar la consulta. Se muestra la guía local.');
      }
    } finally {
      clearTimeout(timer);
      if (pending.current === controller) {pending.current = null; setLoading(false);}
    }
  };
  const useLocal = () => {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
    setAdopted(false);
    setNotice('');
    setResult(localReflection());
  };
  const handleAdopt = () => {
    if (!result?.reflection || !onAdoptLearning) return;
    const lines = result.reflection.split('\n\n');
    const step = lines.find(line => line.includes('Micro-Paso') || line.includes('🎯')) || lines.at(-1);
    onAdoptLearning(step.replace(/^[^:]+:\s*/, '').trim() || result.reflection);
    setAdopted(true);
  };
  return <section className="ai-mirror-card" aria-label="Espejo del Observador">
    <div className="ai-mirror-header"><h3>Espejo del Observador</h3>
      {result && <span className="ai-badge">{result.source === 'grok' ? 'Grok · xAI' : 'Guía local sin IA externa'}</span>}
    </div>
    <div className="ai-mirror-body">
      <p>Guía pedagógica de autorreflexión. No ofrece diagnóstico ni atención clínica.</p>
      <button type="button" className="ai-trigger-btn" onClick={useLocal}>Usar guía local sin enviar datos</button>
      <p>La consulta opcional a Grok envía a nuestro servidor y a xAI tu situación escrita, energía percibida, reactividad, sesgo, etiquetas y los tres pasos de reflexión. Evita nombres y datos que identifiquen a otras personas.</p>
      <p>xAI procesa ese contenido según sus propias condiciones. No garantizamos su retención ni su uso para entrenamiento. Puedes seguir usando la bitácora y la guía local sin aceptar.</p>
      <label><input type="checkbox" checked={consent} onChange={e => e.target.checked ? setConsent(true) : revokeConsent()}/>
        Autorizo enviar esta reflexión a xAI para obtener una respuesta de Grok.
      </label>
      <p className="hint">Puedes retirar esta autorización desmarcando la casilla. Esto detiene nuevos envíos y limpia la clave y el resultado en esta vista, pero no revierte datos ya enviados.</p>
      {!ownerId && <p>Inicia sesión en la bitácora para consultar a Grok. Puedes usar la guía local sin iniciar sesión.</p>}
      <p className="hint">Las consultas externas tienen límites por cuenta y para todo el servicio, incluso con clave propia. Si no hay cuota disponible, puedes usar la guía local.</p>
      <button type="button" className="ai-trigger-btn" disabled={!ownerId || !consent || loading} onClick={requestReflection}>
        {loading ? 'Consultando…' : 'Consultar a Grok con estos datos'}
      </button>
      {loading && <p role="status">Esperando respuesta. Si falla, se mostrará la guía local.</p>}
      {notice && <p role="status">{notice}</p>}
      {result && !loading && <div className="ai-result-box" aria-live="polite">
        {result.reflection.split('\n\n').map((text, index) => <p key={index}><InlineText text={text}/></p>)}
        {onAdoptLearning && <button type="button" className="ai-adopt-btn" disabled={adopted} onClick={handleAdopt}>
          {adopted ? 'Adoptado' : 'Adoptar Micro-Paso como Aprendizaje'}
        </button>}
      </div>}
    </div>
    <div className="ai-mirror-footer">
      <button type="button" className="byok-toggle-btn" aria-expanded={showByok} onClick={() => setShowByok(!showByok)}>Configurar clave xAI personal (opcional)</button>
      {showByok && <div className="byok-card">
        <label htmlFor="byok-input">Clave de tu cuenta xAI</label>
        <input id="byok-input" type="password" autoComplete="off" value={byokKey} onChange={e => setByokKey(e.target.value)} disabled={loading || !consent}/>
        <button type="button" onClick={() => setByokKey('')}>Limpiar clave</button>
        <p className="hint">La clave permanece en memoria mientras esta vista está abierta. No se guarda en localStorage. Al consultar, pasa por nuestro servidor hacia xAI. Desmarcar el consentimiento también la borra. Sin clave propia se intenta usar la cuota del servicio.</p>
      </div>}
    </div>
  </section>;
}
