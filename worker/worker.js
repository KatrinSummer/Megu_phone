// Progress backup for the Megu phone app. Tiny on purpose: the phone owns the
// data, this only keeps a copy the phone cannot lose.
//
//   GET  /              -> {progress}          the newest copy
//   GET  /?day=2026-09-07 -> {progress}        that day's snapshot
//   GET  /?days         -> ["2026-09-07", ...] which snapshots exist
//   PUT  /  {progress}  -> {saved, words}      stores it, plus today's snapshot
//
// Every request must carry  x-megu-key: <the key you set as MEGU_KEY>.

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,PUT,OPTIONS',
  'access-control-allow-headers': 'content-type,x-megu-key',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.headers.get('x-megu-key') !== env.MEGU_KEY) return json({ error: 'wrong key' }, 401);

    const url = new URL(request.url);
    const day = new Date().toISOString().slice(0, 10);

    if (request.method === 'GET') {
      if (url.searchParams.has('days')) {
        const list = await env.MEGU.list({ prefix: 'snap:' });
        return json(list.keys.map((k) => k.name.slice(5)).sort().reverse());
      }
      const wanted = url.searchParams.get('day');
      const stored = await env.MEGU.get(wanted ? `snap:${wanted}` : 'progress');
      return json(stored ? JSON.parse(stored) : { progress: {} });
    }

    if (request.method === 'PUT') {
      const body = await request.json().catch(() => null);
      if (!body || typeof body.progress !== 'object') return json({ error: 'expected {progress}' }, 400);
      const text = JSON.stringify({ progress: body.progress, saved: new Date().toISOString() });
      // One snapshot per day, kept for a season - enough to undo a bad merge.
      await Promise.all([
        env.MEGU.put('progress', text),
        env.MEGU.put(`snap:${day}`, text, { expirationTtl: 60 * 60 * 24 * 120 }),
      ]);
      return json({ saved: day, words: Object.keys(body.progress).length });
    }

    return json({ error: 'GET or PUT only' }, 405);
  },
};
