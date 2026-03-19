import { NextRequest } from 'next/server';

// Edge runtime for streaming
export const runtime = 'edge';

interface WorldEvent {
  headline: string;
  region:   string;
  severity: string;
  source?:  string;
}

interface BriefRequestBody {
  location:    { lat: number; lng: number; city?: string };
  scenario:    string;
  airports:    { iata: string; name: string; distanceKm: number; etaCar: string; etaAir: string }[];
  worldEvents: { baseline: WorldEvent[]; live: WorldEvent[] };
}

export async function POST(req: NextRequest) {
  const body = await req.json() as BriefRequestBody;
  const { location, scenario, airports, worldEvents } = body;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Return a formatted mock brief without OpenAI
    const text = mockBrief(location, scenario, airports, worldEvents);
    return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const locStr = location.city
    ? `${location.city} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
    : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

  const airportList = airports
    .map((a, i) => `  ${i + 1}. [${a.iata}] ${a.name} — ${a.distanceKm} km · ${a.etaCar} by road · ${a.etaAir} by air`)
    .join('\n');

  // Build world situation context
  const baselineCtx = (worldEvents?.baseline ?? []).slice(0, 10)
    .map(e => `[${e.severity}] ${e.region}: ${e.headline}`).join('\n');
  const liveCtx = (worldEvents?.live ?? []).slice(0, 10)
    .map(e => `[LIVE] ${e.headline}${e.source ? ` (${e.source})` : ''}`).join('\n');
  const worldCtx = [baselineCtx, liveCtx].filter(Boolean).join('\n');

  const userPrompt =
    `CURRENT POSITION: ${locStr}\n` +
    `THREAT SCENARIO: ${scenario || 'GENERAL EMERGENCY — IMMEDIATE EVACUATION REQUIRED'}\n\n` +
    (worldCtx ? `GLOBAL SITUATION REPORT (live intelligence feed):\n${worldCtx}\n\n` : '') +
    `NEAREST AIRPORTS:\n${airportList}\n\n` +
    `Generate an operational intelligence evacuation brief. Include: THREAT ASSESSMENT (reference relevant active conflicts near the position), PRIMARY ROUTE, CONTINGENCY ROUTES, ETA TO SAFETY, CRITICAL WARNINGS. Be precise and actionable. Reference the global situation where relevant to the user's location.`;

  const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content:
            'You are JARVIS, an advanced AI operational intelligence system. You have real-time access to global intelligence feeds including active conflicts, war zones, and geopolitical crises. Provide classified-style evacuation briefings with military precision. Use ALL CAPS section headers followed by colon. Be direct, concise, and prioritize life safety. Cross-reference the user\'s position with known conflict zones and active threats in the global situation report provided. Today: ' +
            new Date().toUTCString(),
        },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!oaiRes.ok || !oaiRes.body) {
    const err = await oaiRes.text().catch(() => String(oaiRes.status));
    return new Response(`[JARVIS ERROR] OpenAI unavailable (${oaiRes.status}): ${err}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Strip SSE framing → emit raw text tokens
  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    async start(controller) {
      const reader  = oaiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { controller.close(); return; }
          try {
            const token = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
            if (token) controller.enqueue(encoder.encode(token));
          } catch { /* ignore parse errors */ }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':    'text/plain; charset=utf-8',
      'Cache-Control':   'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

function mockBrief(
  location:    BriefRequestBody['location'],
  scenario:    string,
  airports:    BriefRequestBody['airports'],
  worldEvents: BriefRequestBody['worldEvents'],
): string {
  const locStr = location.city ?? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`;
  const primary    = airports[0];
  const secondary  = airports[1];
  const tertiary   = airports[2];

  const nearbyConflicts = (worldEvents?.baseline ?? [])
    .filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH')
    .slice(0, 3)
    .map(e => `• ${e.region}: ${e.headline}`).join('\n');

  return (
    `[JARVIS // OPERATIONS BRIEF // DEMO MODE]\n` +
    `════════════════════════════════════════\n` +
    `⚠  Add OPENAI_API_KEY to .env.local for live GPT-4o AI analysis\n\n` +
    `THREAT ASSESSMENT:\n` +
    `Scenario: ${scenario || 'GENERAL EMERGENCY'}. Position confirmed at ${locStr}.\n` +
    `Elevated risk detected. Immediate evacuation protocol initiated.\n` +
    (nearbyConflicts ? `\nACTIVE GLOBAL CONFLICTS (intel feed):\n${nearbyConflicts}\n` : '') +
    `\n` +
    `PRIMARY ROUTE:\n` +
    (primary
      ? `Direct overland to [${primary.iata}] ${primary.name} — ${primary.distanceKm} km · ETA ${primary.etaCar} by road.`
      : 'No airports in range — expand search radius.') +
    `\n\nCONTINGENCY ROUTES:\n` +
    (secondary ? `• [${secondary.iata}] ${secondary.name} — ${secondary.distanceKm} km · ${secondary.etaCar}\n` : '') +
    (tertiary  ? `• [${tertiary.iata}]  ${tertiary.name} — ${tertiary.distanceKm} km · ${tertiary.etaCar}\n` : '') +
    `\nETA TO SAFETY:\n` +
    (primary ? `Depart now → arrive ${primary.iata} in ~${primary.etaCar}.` : 'Assess alternatives.') +
    `\n\nCRITICAL WARNINGS:\n` +
    `• Avoid major highway chokepoints — expect civilian congestion\n` +
    `• Maintain vehicle fuel above 50% threshold at all times\n` +
    `• Monitor civil aviation NOTAMs and emergency broadcasts\n` +
    `• Military emergency frequency: 121.5 MHz\n` +
    `• Carry essential documents, cash, and 72-hour emergency kit`
  );
}
