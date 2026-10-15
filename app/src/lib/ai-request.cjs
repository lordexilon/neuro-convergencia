const {reflectionPayload} = require('./ai-privacy.cjs');
const {generateOfflineReflection, reflectOnJournalEntry} = require('./ai-mentor.cjs');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function quotaConfig(env) {
  const integer = (name, fallback, max) => {
    if (env[name] === undefined || env[name] === '') return fallback;
    if (!/^\d+$/.test(env[name])) throw new Error('Invalid quota configuration');
    const value = Number(env[name]);
    if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error('Invalid quota configuration');
    return value;
  };
  return {
    p_window_seconds: integer('AI_USER_WINDOW_SECONDS', 600, 86400),
    p_window_limit: integer('AI_USER_WINDOW_LIMIT', 5, 100),
    p_user_daily_limit: integer('AI_USER_DAILY_LIMIT', 20, 1000),
    p_global_daily_limit: integer('AI_GLOBAL_DAILY_LIMIT', 100, 10000)
  };
}
async function handleAiRequest(request, {env = process.env, fetchImpl = fetch, reflect = reflectOnJournalEntry} = {}) {
  const reply = (body, status = 200, extra = {}) => Response.json(body, {status, headers: {'Cache-Control': 'no-store', ...extra}});
  let entryData = {};
  const local = (reason, status = 200, retryAfter = 0) => reply({success: true, source: 'offline_heuristic', model: 'heuristic-engine',
    reflection: generateOfflineReflection(entryData), fallback: true, reason, retryAfterSeconds: retryAfter}, status,
    retryAfter ? {'Retry-After': String(retryAfter)} : {});
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return local('invalid_origin', 403);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return local('invalid_request', 415);
    // Bound the stream itself, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return local('invalid_request', 400);
    const chunks = [];
    let size = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) {await reader.cancel(); return local('request_too_large', 413);}
      chunks.push(value);
    }
    let body;
    try {body = JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {return local('invalid_request', 400);}
    if (!body || typeof body !== 'object' || Array.isArray(body)) return local('invalid_request', 400);
    entryData = reflectionPayload(body.entryData || {});
    if (body.externalAiConsent !== true) return local('no_external_consent');
    if (env.AI_EXTERNAL_ENABLED !== 'true') return local('external_ai_disabled');
    const authorization = request.headers.get('authorization') || '';
    if (!/^Bearer [^\s]+$/i.test(authorization) || authorization.length > 8192) return local('sign_in_required', 401);
    const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publicKey) return local('auth_unavailable', 503);
    let user;
    try {
      const response = await fetchImpl(`${url}/auth/v1/user`, {headers: {apikey: publicKey, Authorization: authorization}, signal: AbortSignal.timeout(3000), cache: 'no-store'});
      if (response.status === 401 || response.status === 403) return local('sign_in_required', 401);
      if (!response.ok) return local('auth_unavailable', 503);
      user = await response.json();
    } catch {return local('auth_unavailable', 503);}
    // Never trust an owner/user ID supplied by the caller or merely decode its JWT.
    if (!UUID.test(user?.id || '') || user.is_anonymous !== false || user.role !== 'authenticated') return local('sign_in_required', 401);
    const personalKey = typeof body.byokApiKey === 'string' ? body.byokApiKey.trim() : '';
    if (personalKey.length > 4096) return local('invalid_request', 400);
    const apiKey = personalKey || env.GROK_API_KEY?.trim() || env.XAI_API_KEY?.trim() || '';
    if (!apiKey) return local('external_ai_unavailable');
    const adminKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!adminKey) return local('quota_unavailable', 503);
    let quota;
    try {
      const limits = quotaConfig(env);
      const headers = {'Content-Type': 'application/json', apikey: adminKey};
      // New secret keys use apikey. Legacy service-role JWTs also use Authorization.
      if (!adminKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${adminKey}`;
      const response = await fetchImpl(`${url}/rest/v1/rpc/reserve_ai_quota`, {
        method: 'POST', headers, body: JSON.stringify({p_user_id: user.id, ...limits}),
        signal: AbortSignal.timeout(3000), cache: 'no-store'
      });
      if (!response.ok) return local('quota_unavailable', 503);
      quota = await response.json();
      if (quota?.allowed !== true) {
        if (quota?.allowed === false && Number.isInteger(quota.retry_after_seconds) && quota.retry_after_seconds > 0 && quota.retry_after_seconds <= 86400) {
          return local('quota_exceeded', 429, quota.retry_after_seconds);
        }
        return local('quota_unavailable', 503);
      }
    } catch {return local('quota_unavailable', 503);}
    // Reserve BEFORE calling xAI. Errors/timeouts still consume a slot conservatively.
    const result = await reflect({entryData, apiKey, timeoutMs: 6000, model: env.GROK_MODEL || 'grok-2-mini', customFetch: fetchImpl});
    return reply({success: true, source: result.source, model: result.model, reflection: result.reflection,
      fallback: result.fallback, reason: result.fallback ? 'external_ai_unavailable' : undefined});
  } catch {return local('internal_error', 503);}
}
module.exports = {handleAiRequest, quotaConfig};
