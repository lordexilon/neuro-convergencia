function reflectionPayload(data = {}) {
  const payload = {};
  for (const field of ['context', 'reactivity', 'bias', 'calib1', 'calib2', 'calib3']) {
    payload[field] = typeof data[field] === 'string' ? data[field].slice(0, 4000) : '';
  }
  payload.battery = Number.isInteger(data.battery) && data.battery >= 0 && data.battery <= 100 ? data.battery : 50;
  payload.tags = Array.isArray(data.tags) ? data.tags.filter(tag => typeof tag === 'string').slice(0, 6).map(tag => tag.slice(0, 50)) : [];
  return payload;
}

function clearLegacyAiStorage(storage) {
  // Remove only legacy AI material. Leave the user's journal draft untouched.
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i);
    if (key === 'neuro_byok_grok_key' || key?.startsWith('neuro_ai_cache_')) storage.removeItem(key);
  }
}

module.exports = {reflectionPayload, clearLegacyAiStorage};
