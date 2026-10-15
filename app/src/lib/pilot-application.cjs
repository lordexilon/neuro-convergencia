const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateApplication(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Solicitud inválida.');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!UUID.test(input.id || '')) throw new Error('Identificador inválido.');
  if (!name || name.length > 100 || /[\r\n\x00-\x1f]/.test(name)) throw new Error('Escribe un nombre de hasta 100 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo válido.');
  if (!['participante', 'facilitador'].includes(input.role)) throw new Error('Selecciona un rol válido.');
  if (input.contactConsent !== true) throw new Error('Autoriza el contacto para gestionar tu postulación.');
  // Only these fields reach storage. Do not collect reflections or free-form health information.
  return {id: input.id, name, email, role: input.role, contactConsent: true};
}

async function handleApplication(request, {env = process.env, fetchImpl = fetch} = {}) {
  const reply = (body, status) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({error: 'Origen no permitido.'}, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply({error: 'Formato inválido.'}, 415);
  let data;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2048) return reply({error: 'Solicitud demasiado extensa.'}, 413);
    data = validateApplication(JSON.parse(raw));
  } catch (error) {
    return reply({error: error instanceof SyntaxError ? 'Solicitud inválida.' : error.message}, 400);
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return reply({error: 'Las postulaciones todavía no están disponibles. Intenta más tarde.'}, 503);
  try {
    const response = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/rpc/submit_pilot_application`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', apikey: key},
      body: JSON.stringify({p_id: data.id, p_name: data.name, p_email: data.email, p_role: data.role, p_contact_consent: true}),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    // A 2xx alone is insufficient: the database must acknowledge this exact request.
    if (!response.ok || await response.json() !== data.id) throw new Error('Unconfirmed persistence');
    return reply({saved: true, id: data.id}, 201);
  } catch {
    return reply({error: 'No pudimos confirmar el registro. Conservamos el formulario para que puedas reintentar.'}, 503);
  }
}

module.exports = {validateApplication, handleApplication};
