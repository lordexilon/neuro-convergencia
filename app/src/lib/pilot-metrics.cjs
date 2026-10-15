const DAY = 86400000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function timestamp(value) {
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Fecha inválida o sin zona horaria.');
  return Date.parse(value);
}
function validateCohort(cohort) {
  if (!cohort || typeof cohort.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(cohort.id)) throw new Error('Identificador de cohorte inválido.');
  const start = timestamp(cohort.startsAt);
  if (cohort.timeZone !== 'America/Asuncion') throw new Error('La cohorte usa America/Asuncion.');
  if (!Array.isArray(cohort.members) || cohort.members.length > 20) throw new Error('Máximo 20 participantes.');
  const ids = new Set();
  for (const member of cohort.members) {
    if (!UUID.test(member.userId || '') || ids.has(member.userId.toLowerCase())) throw new Error('Participante inválido o repetido.');
    if (member.consentVersion !== 'pilot-metrics-v1' || timestamp(member.consentedAt) > start) throw new Error('Se requiere consentimiento de medición previo al inicio.');
    ids.add(member.userId.toLowerCase());
  }
  return {start, ids};
}

function buildPilotReport(cohort, entries, asOf = new Date().toISOString()) {
  const {start, ids} = validateCohort(cohort);
  const cutoff = timestamp(asOf);
  const calendarDate = new Intl.DateTimeFormat('en-CA', {timeZone: cohort.timeZone, year: 'numeric', month: '2-digit', day: '2-digit'});
  const byUser = new Map([...ids].map(id => [id, []]));
  const seen = new Map();
  for (const entry of entries) {
    const owner = typeof entry.owner_id === 'string' ? entry.owner_id.toLowerCase() : '';
    if (!UUID.test(entry.id || '') || !ids.has(owner)) throw new Error('Registro fuera de la cohorte o sin identificador.');
    const time = timestamp(entry.created_at);
    const signature = JSON.stringify([owner, time]);
    const id = entry.id.toLowerCase();
    if (seen.has(id)) {
      if (seen.get(id) !== signature) throw new Error('Registro duplicado inconsistente.');
      continue;
    }
    seen.set(id, signature);
    if (time >= start && time < cutoff && time < start + 21 * DAY) byUser.get(owner).push(time);
  }
  const enrolled = ids.size;
  const metric = (fromDay, toDay, minimumDistinctDays) => {
    const status = enrolled < 5 ? 'insufficient_group' : cutoff < start + toDay * DAY ? 'pending_window' : 'measured';
    if (status !== 'measured') return {status, count: null, denominator: enrolled, percent: null};
    let count = 0;
    for (const times of byUser.values()) {
      const dates = new Set(times.filter(time => time >= start + fromDay * DAY && time < start + toDay * DAY).map(time => calendarDate.format(time)));
      if (dates.size >= minimumDistinctDays) count++;
    }
    return {status, count, denominator: enrolled, percent: Math.round(count / enrolled * 10000) / 100};
  };
  // No individual IDs, contact data, timestamps per person or journal text in output.
  return {cohortId: cohort.id, asOf: new Date(cutoff).toISOString(), startsAt: new Date(start).toISOString(), timeZone: cohort.timeZone,
    enrolled, status: cutoff < start ? 'not_started' : cutoff < start + 21 * DAY ? 'in_progress' : 'completed_window',
    metrics: {
      activation48h: metric(0, 2, 1), retentionD7: metric(6, 7, 1), retentionD21: metric(20, 21, 1),
      practice14d: metric(0, 14, 6), activeWeek3: metric(14, 21, 3),
      paymentConversion: {status: 'not_instrumented', count: null, denominator: enrolled, percent: null}
    }};
}
module.exports = {validateCohort, buildPilotReport};
