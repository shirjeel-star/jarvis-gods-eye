import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface GdeltArticle {
  title: string;
  url: string;
  domain: string;
  seendate?: string;
  sourcecountry?: string;
  language?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

// Active conflict zones with baseline hardcoded data (always returned)
// Updated March 2026
const BASELINE_EVENTS = [
  { headline: 'MIDDLE EAST: Ongoing Israel-Hamas/Hezbollah conflict operations — Gaza, Lebanon active zones', region: 'MENA', severity: 'CRITICAL' },
  { headline: 'UKRAINE: Russia-Ukraine war continues — frontlines active in eastern Ukraine', region: 'EUROPE', severity: 'CRITICAL' },
  { headline: 'SUDAN: Civil war between SAF and RSF — Khartoum and Darfur remain high-risk', region: 'AFRICA', severity: 'CRITICAL' },
  { headline: 'IRAN: Regional proxy tensions elevated — Strait of Hormuz shipping alerts active', region: 'MENA', severity: 'HIGH' },
  { headline: 'SOUTH CHINA SEA: Elevated naval activity — Taiwan Strait tensions ongoing', region: 'ASIA-PAC', severity: 'HIGH' },
  { headline: 'MYANMAR: Military junta operations vs resistance forces — civilian zones affected', region: 'SEA', severity: 'HIGH' },
  { headline: 'SAHEL REGION: Multi-country instability — Mali, Niger, Burkina Faso no-go zones', region: 'AFRICA', severity: 'ELEVATED' },
  { headline: 'RED SEA: Houthi maritime threat persists — commercial vessel diversion routes active', region: 'MENA', severity: 'HIGH' },
  { headline: 'HAITI: Escalating gang control — Port-au-Prince airport security compromised', region: 'LATAM', severity: 'ELEVATED' },
  { headline: 'NAGORNO-KARABAKH: Regional instability — Armenia-Azerbaijan border watch maintained', region: 'EUROPE', severity: 'ELEVATED' },
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q') ?? 'war military conflict airstrike ceasefire invasion troops attack';

  let liveHeadlines: { headline: string; region: string; severity: string; source?: string; ts?: string }[] = [];

  try {
    // GDELT v2 DOC API — free, no API key required
    const gdeltUrl =
      'https://api.gdeltproject.org/api/v2/doc/doc?' +
      new URLSearchParams({
        query:      query,
        mode:       'artlist',
        maxrecords: '20',
        format:     'json',
        timespan:   '360',          // last 6 hours
        sourcelang: 'english',
        sort:       'DateDesc',
      }).toString();

    const gdeltRes = await fetch(gdeltUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (gdeltRes.ok) {
      const data: GdeltResponse = await gdeltRes.json();
      const articles = data.articles ?? [];

      liveHeadlines = articles
        .filter(a => a.title && a.title.length > 15)
        .slice(0, 15)
        .map(a => ({
          headline: a.title.replace(/\s+/g, ' ').trim(),
          region:   a.sourcecountry ?? 'GLOBAL',
          severity: 'LIVE',
          source:   a.domain,
          ts:       a.seendate,
        }));
    }
  } catch {
    // GDELT unavailable — fall through to baseline only
  }

  return Response.json({
    baseline: BASELINE_EVENTS,
    live:     liveHeadlines,
    fetchedAt: new Date().toISOString(),
  });
}
