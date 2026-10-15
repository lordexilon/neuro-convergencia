const {test} = require('node:test');
const assert = require('node:assert/strict');
const {buildPilotReport, validateCohort} = require('../src/lib/pilot-metrics.cjs');
const {readEntries, main} = require('../scripts/pilot-report.cjs');
const DAY = 86400000;
const start = Date.parse('2026-01-01T00:00:00-03:00');
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const cohort = {id: 'synthetic-test', startsAt: new Date(start).toISOString(), timeZone: 'America/Asuncion',
  members: [1, 2, 3, 4, 5].map(n => ({userId: uuid(n), consentVersion: 'pilot-metrics-v1', consentedAt: new Date(start - DAY).toISOString()}))};
let serial = 100;
const entry = (owner, day) => ({id: uuid(serial++), owner_id: uuid(owner), created_at: new Date(start + day * DAY).toISOString()});

test('distinguishes activation, D7/D21 and distinct practice dates using the full enrolled denominator', () => {
  const rows = [0, 1, 2, 6, 7, 13, 14, 15, 20].map(day => entry(1, day));
  rows.push(entry(2, 1), entry(2, 14), entry(2, 14.1), entry(2, 15), entry(3, 21), entry(4, -1));
  rows.push({...rows[0]}); // A duplicate page row cannot inflate usage.
  const report = buildPilotReport(cohort, rows, new Date(start + 21 * DAY).toISOString());
  assert.equal(report.metrics.activation48h.count, 2);
  assert.equal(report.metrics.retentionD7.count, 1);
  assert.equal(report.metrics.retentionD21.count, 1);
  assert.equal(report.metrics.practice14d.count, 1);
  assert.equal(report.metrics.activeWeek3.count, 1);
  assert.equal(report.metrics.activeWeek3.denominator, 5);
  assert.equal(report.metrics.activeWeek3.percent, 20);
  assert.equal(report.metrics.paymentConversion.count, null);
  for (const member of cohort.members) assert.ok(!JSON.stringify(report).includes(member.userId));
});
test('immature windows stay unknown; mature empty usage is zero; small cohorts are suppressed', () => {
  const pending = buildPilotReport(cohort, [], new Date(start + DAY).toISOString());
  assert.equal(pending.metrics.activation48h.status, 'pending_window');
  assert.equal(pending.metrics.activation48h.count, null);
  const closed = buildPilotReport(cohort, [], new Date(start + 21 * DAY).toISOString());
  assert.equal(closed.metrics.retentionD21.count, 0);
  assert.equal(closed.metrics.paymentConversion.status, 'not_instrumented');
  const small = buildPilotReport({...cohort, members: cohort.members.slice(0, 4)}, [], new Date(start + 21 * DAY).toISOString());
  assert.equal(small.metrics.activation48h.status, 'insufficient_group');
  assert.equal(small.metrics.activation48h.count, null);
});
test('48h and day boundaries exclude the next window rather than inflating retention', () => {
  const rows = [entry(1, 2), entry(2, 7), entry(3, 21)];
  const report = buildPilotReport(cohort, rows, new Date(start + 21 * DAY).toISOString());
  assert.equal(report.metrics.activation48h.count, 0);
  assert.equal(report.metrics.retentionD7.count, 0);
  assert.equal(report.metrics.retentionD21.count, 0);
});
test('requires consented, unique cohort members and rejects inconsistent or foreign records', () => {
  assert.throws(() => validateCohort({...cohort, members: [{...cohort.members[0], consentVersion: 'contact-only'}]}));
  assert.throws(() => validateCohort({...cohort, members: [{...cohort.members[0], consentedAt: new Date(start + DAY).toISOString()}]}));
  assert.throws(() => validateCohort({...cohort, members: [cohort.members[0], cohort.members[0]]}));
  assert.throws(() => buildPilotReport(cohort, [entry(6, 0)]));
  const row = entry(1, 0);
  assert.throws(() => buildPilotReport(cohort, [row, {...row, created_at: new Date(start + DAY).toISOString()}]));
});
function fakeClient(pages, selections) {
  return {from(table) {
    assert.equal(table, 'journal_entries');
    const query = {select(columns) {selections.push(columns); return query;}, in() {return query;}, gte() {return query;}, lt() {return query;}, order() {return query;},
      async range(from, to) {assert.equal(to - from, 999); return pages.shift();}};
    return query;
  }};
}
test('reader paginates beyond UI history and selects only identifiers and creation dates', async () => {
  const columns = [];
  const pages = [{data: Array.from({length: 1000}, () => entry(1, 0)), error: null}, {data: [entry(2, 1)], error: null}];
  const rows = await readEntries(fakeClient(pages, columns), cohort, new Date(start + 21 * DAY).toISOString());
  assert.equal(rows.length, 1001);
  assert.deepEqual(columns, ['id,owner_id,created_at', 'id,owner_id,created_at']);
});
test('read failures never emit partial reports and operator access is disabled by default', async () => {
  await assert.rejects(readEntries(fakeClient([{data: null, error: {message: 'private error'}}], []), cohort, new Date(start + 21 * DAY).toISOString()));
  await assert.rejects(main(['--cohort', 'pilot-cohort.local.json'], {}), /deshabilitado/);
  assert.deepEqual(await readEntries({from() {throw Error('No read needed for suppressed metrics');}}, {...cohort, members: cohort.members.slice(0, 4)}, new Date(start + 21 * DAY).toISOString()), []);
});
