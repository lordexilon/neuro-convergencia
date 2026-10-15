const {test} = require('node:test');
const assert = require('node:assert/strict');
const {observeProductSession, sessionView} = require('../src/lib/product-session.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));
function clientWith(promise) {
  let listener, stopped = 0;
  return {auth: {
    getSession: () => promise,
    onAuthStateChange: callback => {listener = callback; return {data: {subscription: {unsubscribe: () => stopped++}}};}
  }, emit: (event, session) => listener(event, session), stopped: () => stopped};
}
function sink() {
  const sessions = [], errors = [];
  let ready = 0;
  return {sessions, errors, ready: () => ready, callbacks: {onSession: value => sessions.push(value), onError: error => errors.push(error), onReady: () => ready++}};
}
test('restored session reaches the journal; token refresh preserves voluntary map navigation', () => {
  assert.equal(sessionView(null, 'account-a', 'landing'), 'journal');
  assert.equal(sessionView('account-a', 'account-a', 'landing'), 'landing');
  assert.equal(sessionView('account-a', 'account-a', 'habits'), 'habits');
  assert.equal(sessionView('account-a', null, 'journal'), 'landing');
  assert.equal(sessionView(null, null, 'journal'), 'journal');
  assert.equal(sessionView('account-a', 'account-b', 'landing'), 'journal');
});
test('one root observer restores a session and cleans its subscription on unmount', async () => {
  const session = {user: {id: 'account-a'}};
  const client = clientWith(Promise.resolve({data: {session}, error: null}));
  const state = sink();
  const stop = observeProductSession(client, state.callbacks);
  await tick();
  assert.deepEqual(state.sessions, [session]);
  assert.equal(state.ready(), 1);
  stop();
  client.emit('SIGNED_OUT', null);
  assert.equal(client.stopped(), 1);
  assert.equal(state.sessions.length, 1);
});
test('a stale bootstrap cannot undo a signout or newer login event', async () => {
  for (const latest of [null, {user: {id: 'account-b'}}]) {
    let resolve;
    const client = clientWith(new Promise(done => {resolve = done;}));
    const state = sink();
    const stop = observeProductSession(client, state.callbacks);
    client.emit(latest ? 'SIGNED_IN' : 'SIGNED_OUT', latest);
    resolve({data: {session: {user: {id: 'account-a'}}}, error: null});
    await tick();
    assert.deepEqual(state.sessions, [latest]);
    stop();
  }
});
test('bootstrap failures release the loading screen and can recover from a later auth event', async () => {
  const client = clientWith(Promise.resolve({data: {session: null}, error: {message: 'private'}}));
  const state = sink();
  const stop = observeProductSession(client, state.callbacks);
  await tick();
  assert.equal(state.ready(), 1);
  assert.equal(state.sessions.length, 0);
  assert.ok(state.errors[0].includes('recuperar'));
  client.emit('SIGNED_IN', {user: {id: 'account-a'}});
  assert.equal(state.errors.at(-1), '');
  assert.equal(state.sessions.length, 1);
  stop();
});
