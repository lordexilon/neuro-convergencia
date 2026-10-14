const LAYER_MAP = {
  impulso: { name: 'Temperamento (60% biológico)', dynamic: 'Respuesta refleja de ataque/huida o imposición.' },
  emocion: { name: 'Carácter (30% memoria/vincular)', dynamic: 'Oleada emocional o hipersensibilidad al entorno.' },
  mente: { name: 'Personalidad (10% mental/racional)', dynamic: 'Bucle de sobrepensamiento, control o justificación.' },
  observador: { name: 'Observador Lúcido (Centro de Consciencia)', dynamic: 'Pausa serena y ecuanimidad ante el suceso.' }
};

const BIAS_MAP = {
  pasado: 'Proyección de experiencias o heridas previas sobre el presente.',
  futuro: 'Ansiedad anticipatoria e intento de controlar lo incierto.',
  creencia: 'Supuesto automático de autoexigencia o insuficiencia.',
  realidad: 'Atención anclada en los hechos comprobables.'
};

function generateOfflineReflection(entry = {}) {
  const layer = LAYER_MAP[entry.reactivity] || LAYER_MAP.observador;
  const biasDesc = BIAS_MAP[entry.bias] || 'Alineación con el momento presente.';
  const battery = Number.isInteger(entry.battery) ? entry.battery : 50;

  let batteryInsight = 'Energía equilibrada para responder con presencia.';
  if (battery <= 30) {
    batteryInsight = 'Energía baja (' + battery + '%): prioriza restaurar tu vitalidad antes de tomar decisiones definitivas.';
  } else if (battery >= 75) {
    batteryInsight = 'Energía alta (' + battery + '%): canaliza este impulso hacia una acción deliberada y constructiva.';
  }

  const pauseFact = entry.calib2 && entry.calib2.trim()
    ? 'Hecho clave registrado: «' + entry.calib2.trim().slice(0, 90) + '»'
    : 'Contrasta lo que realmente ocurrió frente a las interpretaciones.';

  const actionFact = entry.calib3 && entry.calib3.trim()
    ? 'Respuesta elegida: «' + entry.calib3.trim().slice(0, 90) + '»'
    : 'Da un paso a la vez desde tu centro.';

  return [
    '🌿 **Espejo de Capas:** ' + layer.name + ' activado (' + layer.dynamic + '). Filtro identificado: ' + biasDesc,
    '⚖️ **Pausa y Realidad:** ' + pauseFact + ' ' + batteryInsight,
    '🎯 **Micro-Paso Consciente:** ' + actionFact
  ].join('\n\n');
}

function buildGrokPrompt(entry = {}) {
  const layer = LAYER_MAP[entry.reactivity]?.name || 'No especificada';
  const bias = BIAS_MAP[entry.bias] || 'No especificado';
  const battery = Number.isInteger(entry.battery) ? entry.battery : 50;

  const system = [
    'Eres el Espejo Consciente de Neuro Convergencia.',
    'Pedagogía: 3 Capas (Temperamento 60%, Carácter 30%, Personalidad 10%), polaridades y esferas de vida.',
    'Objetivo: Sintetizar la reflexión del usuario en exactamente 3 viñetas concisas y transformadoras.',
    'Estructura obligatoria:',
    '1. 🌿 Espejo de Capas: Qué capa se activó y cómo opera el sesgo.',
    '2. ⚖️ Pausa y Realidad: Contraste de hechos objetivos y lectura del nivel de energía (' + battery + '%).',
    '3. 🎯 Micro-Paso Consciente: Recomendación micro-conductual inmediata sin moralina.',
    'Reglas estrictas: Máximo 90 palabras en total. Tono empático, sobrio, sin juzgar ni adular.'
  ].join(' ');

  const user = [
    'Situación: ' + (entry.context || 'Cotidianidad'),
    'Capa activada: ' + layer,
    'Filtro/Sesgo: ' + bias,
    'Batería: ' + battery + '%',
    'Pausa/Calibración: ' + (entry.calib1 || 'Respiración'),
    'Hechos objetivos: ' + (entry.calib2 || 'En observación'),
    'Respuesta elegida: ' + (entry.calib3 || 'Paso consciente'),
    'Etiquetas: ' + (Array.isArray(entry.tags) ? entry.tags.join(', ') : 'ninguna')
  ].join('\n');

  return { system, user };
}

async function callGrokApi({ apiKey, entryData, timeoutMs = 6000, model = 'grok-2-mini', customFetch = fetch }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('Falta GROK_API_KEY o clave vacía.');
  }

  const { system, user } = buildGrokPrompt(entryData);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Grok API timeout (' + timeoutMs + 'ms)')), timeoutMs);

  try {
    const res = await customFetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey.trim()
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3,
        max_tokens: 160
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error('Grok API HTTP ' + res.status + ': ' + (errText.slice(0, 120) || res.statusText));
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Respuesta vacía de Grok API.');

    return {
      source: 'grok',
      model: model,
      reflection: content,
      usage: json.usage || null,
      fallback: false
    };
  } finally {
    clearTimeout(timer);
  }
}

async function reflectOnJournalEntry({ entryData, apiKey, timeoutMs = 6000, model = 'grok-2-mini', customFetch = fetch }) {
  if (!apiKey || !apiKey.trim()) {
    return {
      source: 'offline_heuristic',
      model: 'heuristic-engine',
      reflection: generateOfflineReflection(entryData),
      fallback: true,
      reason: 'sin_clave'
    };
  }

  try {
    return await callGrokApi({ apiKey, entryData, timeoutMs, model, customFetch });
  } catch (err) {
    return {
      source: 'offline_heuristic',
      model: 'heuristic-engine',
      reflection: generateOfflineReflection(entryData),
      fallback: true,
      reason: err.name === 'AbortError' ? 'timeout' : (err.message || 'error_api')
    };
  }
}

const requestBuckets = new Map();

function checkRateLimit(clientId, maxRequests = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const id = clientId || 'anonymous';
  const history = requestBuckets.get(id) || [];

  const activeHistory = history.filter(ts => (now - ts) < windowMs);

  if (activeHistory.length >= maxRequests) {
    const oldestInWindow = activeHistory[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return { allowed: false, retryAfterMs, count: activeHistory.length };
  }

  activeHistory.push(now);
  requestBuckets.set(id, activeHistory);

  if (requestBuckets.size > 1000) {
    for (const [key, timestamps] of requestBuckets.entries()) {
      if (timestamps.every(ts => (now - ts) >= windowMs)) {
        requestBuckets.delete(key);
      }
    }
  }

  return { allowed: true, remaining: maxRequests - activeHistory.length, count: activeHistory.length };
}

function resetRateLimits() {
  requestBuckets.clear();
}

module.exports = {
  LAYER_MAP,
  BIAS_MAP,
  generateOfflineReflection,
  buildGrokPrompt,
  callGrokApi,
  reflectOnJournalEntry,
  checkRateLimit,
  resetRateLimits
};

