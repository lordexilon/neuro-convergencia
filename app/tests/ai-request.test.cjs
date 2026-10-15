const {test} = require('node:test');
const assert = require('node:assert/strict');
const {handleAiRequest, quotaConfig} = require('../src/lib/ai-request.cjs');
const USER = 'd3468da8-774c-48d4-931f-59fa3f527b91';
const env = {AI_EXTERNAL_ENABLED: 'true', NEXT_PUBLIC_SUPABASE_URL: 'https://product.test', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test', GROK_API_KEY: 'fake-system-key'};
const body = {externalAiConsent: true, entryData: {battery: 0, calib2: 'Hechos'}};
const request = (data = body, token = 'valid-test-token', extra = {}) => new Request('https://app.test/api/ai/reflect', {
  method: 'POST', headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {}), ...extra}, body: JSON.stringify(data)
});
const user = {id: USER, role: 'authenticated', is_anonymous: false};
const unused = async () => {throw Error('Unexpected side effect');};

test('disabled external AI, absent consent and absent token do not reach auth, quota or xAI', async () => {
  for (const [data, config, token, reason] of [[{}, env, '', 'no_external_consent'], [body, {...env, AI_EXTERNAL_ENABLED: 'false'}, '', 'external_ai_disabled'], [body, env, '', 'sign_in_required']]) {
    const result = await handleAiRequest(request(data, token), {env: config, fetchImpl: unused, reflect: unused});
    assert.equal((await result.json()).reason, reason);
  }
});
test('invalid, anonymous or unverifiable auth never reserves quota or calls xAI, even with BYOK', async () => {
  for (const auth of [() => new Response('', {status: 401}), () => new Response('', {status: 500}), () => Response.json({...user, is_anonymous: true}), () => Response.json({...user, id: 'forged'}), () => {throw Error('timeout');}]) {
    let calls = 0;
    const fetchImpl = async url => {assert.ok(url.endsWith('/auth/v1/user')); calls++; return auth();};
    const result = await handleAiRequest(request({...body, byokApiKey: 'personal-test-key'}), {env, fetchImpl, reflect: unused});
    assert.ok([401, 503].includes(result.status));
    assert.equal((await result.json()).source, 'offline_heuristic');
    assert.equal(calls, 1);
  }
});
test('auth and atomic reservation precede provider; verified ID overrides forged payload identity and limits', async () => {
  for (const personal of ['', 'personal-test-key']) {
    const order = [];
    const fetchImpl = async (url, options) => {
      if (url.endsWith('/user')) {
        order.push('auth');
        assert.equal(options.headers.Authorization, 'Bearer valid-test-token');
        assert.equal(options.headers.apikey, 'public-test');
        return Response.json(user);
      }
      order.push('quota');
      assert.equal(options.headers.apikey, 'sb_secret_test');
      assert.equal(options.headers.Authorization, undefined);
      assert.deepEqual(JSON.parse(options.body), {p_user_id: USER, p_window_seconds: 600, p_window_limit: 5, p_user_daily_limit: 20, p_global_daily_limit: 100});
      return Response.json({allowed: true});
    };
    const reflect = async options => {order.push('provider'); assert.equal(options.apiKey, personal || 'fake-system-key'); assert.equal(options.entryData.battery, 0); return {source: 'grok', model: 'test', reflection: 'Respuesta', fallback: false};};
    const result = await handleAiRequest(request({...body, byokApiKey: personal, user_id: 'forged', p_global_daily_limit: 999999}), {env, fetchImpl, reflect});
    assert.equal(result.status, 200);
    assert.deepEqual(order, ['auth', 'quota', 'provider']);
    const serialized = JSON.stringify(await result.json());
    assert.ok(!serialized.includes('key'));
  }
});
test('denied or unavailable quota fails closed for shared and BYOK credentials', async () => {
  for (const personal of ['', 'personal-test-key']) {
    for (const quota of [() => Response.json({allowed: false, retry_after_seconds: 600}), () => new Response('', {status: 404}), () => {throw Error('timeout');}, () => Response.json({allowed: 'true'}), () => Response.json(null)]) {
      const fetchImpl = async url => url.endsWith('/user') ? Response.json(user) : quota();
      const result = await handleAiRequest(request({...body, byokApiKey: personal}), {env, fetchImpl, reflect: unused});
      assert.ok([429, 503].includes(result.status));
      assert.equal((await result.json()).source, 'offline_heuristic');
      if (result.status === 429) assert.equal(result.headers.get('retry-after'), '600');
    }
  }
});
test('missing server key and invalid quota config cannot fall back to in-memory quota', async () => {
  for (const config of [{...env, SUPABASE_SERVICE_ROLE_KEY: ''}, {...env, AI_GLOBAL_DAILY_LIMIT: 'unlimited'}]) {
    const fetchImpl = async url => {assert.ok(url.endsWith('/user')); return Response.json(user);};
    const result = await handleAiRequest(request(), {env: config, fetchImpl, reflect: unused});
    assert.equal((await result.json()).reason, 'quota_unavailable');
  }
  for (const value of ['0', '-1', 'Infinity', '10001', '1.5']) assert.throws(() => quotaConfig({AI_GLOBAL_DAILY_LIMIT: value}));
});
test('rejects cross-origin, malformed and oversized requests before side effects', async () => {
  const deps = {env, fetchImpl: unused, reflect: unused};
  assert.equal((await handleAiRequest(request(body, '', {origin: 'https://other.test'}), deps)).status, 403);
  assert.equal((await handleAiRequest(request({...body, extra: 'x'.repeat(40000)}), deps)).status, 413);
  assert.equal((await handleAiRequest(new Request('https://app.test', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{bad'}), deps)).status, 400);
});

test('provider failure consumes the prior reservation without refund or automatic retry', async () => {
  let authCalls = 0, reservations = 0, providerCalls = 0;
  const config = {...env, SUPABASE_SERVICE_ROLE_KEY: 'legacy-server-jwt'};
  const fetchImpl = async (url, options) => {
    if (url.endsWith('/user')) {authCalls++; return Response.json(user);}
    reservations++;
    assert.equal(options.headers.Authorization, 'Bearer legacy-server-jwt');
    return Response.json({allowed: true});
  };
  const reflect = async () => {providerCalls++; throw Error('sensitive provider error');};
  const result = await handleAiRequest(request(), {env: config, fetchImpl, reflect});
  assert.equal((await result.json()).reason, 'internal_error');
  assert.deepEqual([authCalls, reservations, providerCalls], [1, 1, 1]);
});
