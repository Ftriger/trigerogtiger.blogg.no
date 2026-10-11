// /api/gh.js – lets the admin page log in with a simple admin code.
// The GitHub token lives only in Vercel (env GITHUB_TOKEN); the page sends the
// admin code (env ADMIN_CODE) and this function forwards the call to GitHub,
// limited to this one repository.
const crypto = require('crypto');

const REPO_PATH = '/repos/Ftriger/trigerogtiger.blogg.no';

function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const reply = (res, status, obj) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return reply(res, 405, { message: 'Bruk POST' });
  const CODE = process.env.ADMIN_CODE, TOKEN = process.env.GITHUB_TOKEN;
  if (!CODE || !TOKEN) return reply(res, 503, { message: 'Admin-kode er ikke satt opp i Vercel ennå (ADMIN_CODE og GITHUB_TOKEN).' });

  let b;
  try { b = await readBody(req); } catch (e) { return reply(res, 400, { message: 'Ugyldig forespørsel' }); }

  if (!same(req.headers['x-admin-code'] || '', CODE)) {
    await new Promise((r) => setTimeout(r, 1500)); // slow down guessing
    return reply(res, 401, { message: 'Feil admin-kode' });
  }

  const path = String(b.path || '');
  const method = String(b.method || 'GET').toUpperCase();
  if (!(path === REPO_PATH || path.startsWith(REPO_PATH + '/')) || path.includes('..') ||
      !['GET', 'POST', 'PATCH', 'PUT'].includes(method)) {
    return reply(res, 403, { message: 'Ikke tillatt' });
  }

  const gh = await fetch('https://api.github.com' + path, {
    method,
    body: b.body == null ? undefined : (typeof b.body === 'string' ? b.body : JSON.stringify(b.body)),
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: b.accept || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'trigerogtiger-admin',
      ...(b.body == null ? {} : { 'Content-Type': 'application/json' })
    }
  });
  res.statusCode = gh.status;
  res.setHeader('Content-Type', gh.headers.get('content-type') || 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(await gh.arrayBuffer()));
};
