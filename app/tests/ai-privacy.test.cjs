const {test} = require('node:test');
const assert = require('node:assert/strict');
const {reflectionPayload, clearLegacyAiStorage} = require('../src/lib/ai-privacy.cjs');
const {handleAiRequest} = require('../src/lib/ai-request.cjs');

test('external payload excludes account identity, final learning and unexpected fields, preserves energy zero', () => {
  const result = reflectionPayload({battery: 0, context: 'x'.repeat(5000), email: 'private@example.test', owner_id: 'private', learning: 'private', tags: ['control', null]});
  assert.equal(result.battery, 0);
  assert.equal(result.context.length, 4000);
  assert.equal(result.email, undefined);
  assert.equal(result.owner_id, undefined);
  assert.equal(result.learning, undefined);
  assert.deepEqual(result.tags, ['control']);
});
test('legacy AI cleanup removes all keys without deleting journal drafts or unrelated storage', () => {
  const data = new Map([['neuro_byok_grok_key', 'secret'], ['neuro_ai_cache_a', 'reflection'], ['neuro_ai_cache_b', 'reflection'], ['neuro_journal_draft_v1', 'draft'], ['unrelated', 'keep']]);
  clearLegacyAiStorage({get length() {return data.size;}, key: i => [...data.keys()][i], removeItem: key => data.delete(key)});
  assert.deepEqual([...data.keys()], ['neuro_journal_draft_v1', 'unrelated']);
});

// Test the production handler with auth/quota responses injected. No real network calls.
function loadRoute(deps) {
  const env = {AI_EXTERNAL_ENABLED: 'true', NEXT_PUBLIC_SUPABASE_URL: 'https://product.test', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'server-test', GROK_API_KEY: 'fake-xai'};
  return req => handleAiRequest(req, {env, reflect: deps.reflect, fetchImpl: async url => url.endsWith('/user')
    ? Response.json({id: 'd3468da8-774c-48d4-931f-59fa3f527b91', role: 'authenticated', is_anonymous: false})
    : Response.json({allowed: true})});
}
test('actual route never calls external provider without explicit boolean consent, including BYOK', async () => {
  let calls = 0;
  const POST = loadRoute({reflect: async () => {calls++; throw Error('must not call');}});
  for (const consent of [undefined, false, 'true', 1]) {
    const result = await POST(new Request('https://app.test/api/ai/reflect', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer fake-user-token'}, body: JSON.stringify({entryData: {battery: 0}, byokApiKey: 'fake-key', externalAiConsent: consent})}));
    const body = await result.json();
    assert.equal(body.reason, 'no_external_consent');
    assert.equal(body.source, 'offline_heuristic');
  }
  assert.equal(calls, 0);
});
test('consented route minimizes payload and does not expose provider error details', async () => {
  const POST = loadRoute({reflect: async ({entryData}) => {
    assert.equal(entryData.email, undefined);
    assert.equal(entryData.learning, undefined);
    return {fallback: true, reflection: 'local', reason: 'private provider error'};
  }});
  const result = await POST(new Request('https://app.test/api/ai/reflect', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer fake-user-token'}, body: JSON.stringify({entryData: {email: 'private', learning: 'private'}, externalAiConsent: true})}));
  assert.equal((await result.json()).reason, 'external_ai_unavailable');
});
