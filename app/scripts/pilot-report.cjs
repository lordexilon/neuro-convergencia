// Read-only operator report. Never run against SCA Matrix or without participant consent.
const fs = require('node:fs');
const {validateCohort, buildPilotReport} = require('../src/lib/pilot-metrics.cjs');
async function readEntries(client, cohort, asOf) {
  const {start, ids} = validateCohort(cohort);
  if (ids.size < 5 || Date.parse(asOf) <= start) return [];
  const end = new Date(Math.min(Date.parse(asOf), start + 21 * 86400000)).toISOString();
  const rows = [];
  // Read the full cohort window, independent of the UI's last-20-record limit.
  for (let offset = 0; offset < 100000; offset += 1000) {
    const {data, error} = await client.from('journal_entries').select('id,owner_id,created_at')
      .in('owner_id', [...ids]).gte('created_at', new Date(start).toISOString()).lt('created_at', end)
      .order('created_at', {ascending: true}).order('id', {ascending: true}).range(offset, offset + 999);
    if (error || !Array.isArray(data)) throw new Error('No se pudo leer la ventana completa; no se emite reporte parcial.');
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
  throw new Error('Ventana demasiado extensa; no se emite reporte parcial.');
}
async function main(args = process.argv.slice(2), env = process.env) {
  if (args.length !== 2 || args[0] !== '--cohort') throw new Error('Uso: node scripts/pilot-report.cjs --cohort pilot-cohort.local.json');
  if (env.PILOT_REPORT_ENABLED !== 'true') throw new Error('Reporte deshabilitado. Requiere autorización de lectura y PILOT_REPORT_ENABLED=true.');
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || env.PILOT_REPORT_PRODUCT_URL !== env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Confirma la URL del Supabase de producto y su clave privada.');
  let cohort;
  try {cohort = JSON.parse(fs.readFileSync(args[1], 'utf8'));} catch {throw new Error('No se pudo leer el archivo privado de cohorte.');}
  validateCohort(cohort);
  const {createClient} = require('@supabase/supabase-js');
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {persistSession: false, autoRefreshToken: false},
    global: {fetch: (url, options) => fetch(url, {...options, signal: AbortSignal.timeout(10000)})}
  });
  const asOf = new Date().toISOString();
  const entries = await readEntries(client, cohort, asOf);
  console.log(JSON.stringify(buildPilotReport(cohort, entries, asOf), null, 2));
}
if (require.main === module) main().catch(() => {console.error('Reporte no emitido. Revisa autorización, configuración, consentimiento y disponibilidad del producto.'); process.exitCode = 1;});
module.exports = {readEntries, main};
