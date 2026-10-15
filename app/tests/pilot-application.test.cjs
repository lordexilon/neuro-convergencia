const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validateApplication, handleApplication} = require('../src/lib/pilot-application.cjs');
const payload = {id: 'd3468da8-774c-48d4-931f-59fa3f527b91', name: ' Ana ', email: ' ANA@example.test ', role: 'participante', contactConsent: true};
const env = {NEXT_PUBLIC_SUPABASE_URL: 'https://product.example.test', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'};
const request = (data = payload, origin = 'https://app.example.test') => new Request('https://app.example.test/api/pilot/applications', {method: 'POST', headers: {'Content-Type': 'application/json', origin}, body: JSON.stringify(data)});

test('minimizes data and requires consent, identity and valid contact', () => {
  assert.deepEqual(validateApplication({...payload, note: 'private'}), {...payload, name: 'Ana', email: 'ana@example.test'});
  for (const bad of [{contactConsent: false}, {name: '  '}, {email: 'bad'}, {role: 'admin'}, {id: 'bad'}, {name: 'a'.repeat(101)}]) {
    assert.throws(() => validateApplication({...payload, ...bad}));
  }
});
test('rejects invalid requests before reaching storage', async () => {
  let calls = 0;
  const fetchImpl = async () => {calls++; throw Error('must not call');};
  assert.equal((await handleApplication(request({...payload, contactConsent: false}), {env, fetchImpl})).status, 400);
  assert.equal((await handleApplication(request(payload, 'https://other.example.test'), {env, fetchImpl})).status, 403);
  assert.equal((await handleApplication(request({...payload, extra: 'x'.repeat(3000)}), {env, fetchImpl})).status, 413);
  assert.equal(calls, 0);
});
test('confirms only the exact persisted request and sends no unnecessary fields', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/submit_pilot_application');
    assert.deepEqual(JSON.parse(options.body), {p_id: payload.id, p_name: 'Ana', p_email: 'ana@example.test', p_role: 'participante', p_contact_consent: true});
    return Response.json(payload.id);
  };
  const result = await handleApplication(request({...payload, note: 'private'}), {env, fetchImpl});
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), {saved: true, id: payload.id});
});
test('database errors, missing migration, timeout and invalid acknowledgements never report success', async () => {
  for (const fetchImpl of [async () => new Response('missing function', {status: 404}), async () => {throw Error('timeout');}, async () => Response.json(null), async () => Response.json('other-id')]) {
    const result = await handleApplication(request(), {env, fetchImpl});
    assert.equal(result.status, 503);
    assert.equal((await result.json()).saved, undefined);
  }
  assert.equal((await handleApplication(request(), {env: {}})).status, 503);
});
