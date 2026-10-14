const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateOfflineReflection,
  buildGrokPrompt,
  reflectOnJournalEntry,
  LAYER_MAP
} = require('../src/lib/ai-mentor.cjs');

test('generateOfflineReflection produce síntesis estructurada con 3 puntos sin requerir API', () => {
  const mockEntry = {
    reactivity: 'impulso',
    bias: 'pasado',
    battery: 25,
    context: 'Discusión en el trabajo sobre plazos',
    calib1: 'Respiré tres veces',
    calib2: 'Solo pidieron un informe preliminar',
    calib3: 'Responderé con el cronograma real mañana'
  };

  const output = generateOfflineReflection(mockEntry);
  assert.ok(output.includes('🌿 **Espejo de Capas:**'));
  assert.ok(output.includes('Temperamento (60% biológico)'));
  assert.ok(output.includes('⚖️ **Pausa y Realidad:**'));
  assert.ok(output.includes('Energía baja (25%)'));
  assert.ok(output.includes('🎯 **Micro-Paso Consciente:**'));
  assert.ok(output.includes('Responderé con el cronograma real'));
});

test('buildGrokPrompt genera instrucciones concisas y delimitadas', () => {
  const mockEntry = {
    reactivity: 'mente',
    bias: 'futuro',
    battery: 80,
    calib2: 'El reporte no fue cancelado',
    calib3: 'Avanzaré paso a paso'
  };

  const { system, user } = buildGrokPrompt(mockEntry);
  assert.ok(system.includes('Espejo Consciente de Neuro Convergencia'));
  assert.ok(system.includes('Máximo 90 palabras'));
  assert.ok(user.includes('Personalidad (10% mental/racional)'));
  assert.ok(user.includes('Batería: 80%'));
});

test('reflectOnJournalEntry conmuta a fallback offline inmediato si no hay clave', async () => {
  const res = await reflectOnJournalEntry({
    entryData: { reactivity: 'emocion', bias: 'creencia', battery: 60 },
    apiKey: ''
  });

  assert.equal(res.source, 'offline_heuristic');
  assert.equal(res.fallback, true);
  assert.equal(res.reason, 'sin_clave');
  assert.ok(res.reflection.includes('Carácter (30% memoria/vincular)'));
});

test('reflectOnJournalEntry maneja timeout o error de fetch y activa fallback sin colgarse', async () => {
  // Simulamos un fetch que falla por conexión o cuota 429
  const failingFetch = async () => {
    throw new Error('Connection refused or rate limited');
  };

  const res = await reflectOnJournalEntry({
    entryData: { reactivity: 'observador', bias: 'realidad', battery: 90 },
    apiKey: 'xai-dummy-key',
    customFetch: failingFetch
  });

  assert.equal(res.source, 'offline_heuristic');
  assert.equal(res.fallback, true);
  assert.ok(res.reason.includes('Connection refused'));
  assert.ok(res.reflection.includes('Observador Lúcido'));
});

test('checkRateLimit bloquea exceso tras el umbral permitido y calcula retryAfter', () => {
  const { checkRateLimit, resetRateLimits } = require('../src/lib/ai-mentor.cjs');
  resetRateLimits();

  const ip = 'tester-ip-123';
  for (let i = 0; i < 3; i++) {
    const res = checkRateLimit(ip, 3, 5000);
    assert.equal(res.allowed, true);
  }

  // Cuarta llamada debe ser rechazada
  const blocked = checkRateLimit(ip, 3, 5000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
  assert.equal(blocked.count, 3);
});

test('reflectOnJournalEntry procesa respuesta exitosa simulada de Grok API', async () => {
  const mockSuccessFetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: '🌿 **Espejo de Capas:** Prueba mock exitosa.\n\n⚖️ **Pausa y Realidad:** Hechos validados.\n\n🎯 **Micro-Paso Consciente:** Acción concreta.'
        }
      }],
      usage: { prompt_tokens: 45, completion_tokens: 30, total_tokens: 75 }
    })
  });

  const res = await reflectOnJournalEntry({
    entryData: { reactivity: 'impulso', bias: 'pasado', battery: 40 },
    apiKey: 'xai-valid-key',
    customFetch: mockSuccessFetch
  });

  assert.equal(res.source, 'grok');
  assert.equal(res.fallback, false);
  assert.ok(res.reflection.includes('Prueba mock exitosa'));
  assert.equal(res.usage.total_tokens, 75);
});

