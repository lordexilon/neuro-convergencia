import { NextResponse } from 'next/server';
import { reflectOnJournalEntry, checkRateLimit, generateOfflineReflection } from '../../../../lib/ai-mentor.cjs';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { entryData = {}, byokApiKey = '' } = body;

    const hasByok = Boolean(byokApiKey && typeof byokApiKey === 'string' && byokApiKey.trim());

    // Si no usa clave propia, aplicar rate limiter preventivo para resguardar la cuota
    if (!hasByok) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'client-default');
      const limit = checkRateLimit(ip, 5, 10 * 60 * 1000); // 5 consultas por 10 min

      if (!limit.allowed) {
        return NextResponse.json({
          success: true,
          source: 'offline_heuristic',
          model: 'heuristic-engine',
          reflection: generateOfflineReflection(entryData),
          fallback: true,
          rateLimited: true,
          reason: 'rate_limit_exceeded'
        });
      }
    }

    const systemKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    const activeKey = hasByok ? byokApiKey.trim() : systemKey.trim();

    const result = await reflectOnJournalEntry({
      entryData,
      apiKey: activeKey,
      timeoutMs: 6000,
      model: process.env.GROK_MODEL || 'grok-2-mini'
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    // Si ocurre un error inesperado de parseo, aún así respondemos con fallback sin colgar al cliente
    return NextResponse.json({
      success: true,
      source: 'offline_heuristic',
      model: 'heuristic-engine',
      reflection: '🌿 **Espejo del Observador:** Mantén tu atención en la respiración y en los hechos presentes. Recuerda pausar antes de reaccionar.',
      fallback: true,
      reason: error?.message || 'internal_catch'
    });
  }
}
