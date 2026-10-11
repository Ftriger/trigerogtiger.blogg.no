// /api/kommentar.js – receives a comment from a post page and stores it (unapproved)
// in kommentarer/kommentarer.json in the repo, using GITHUB_TOKEN from Vercel.
const { getPosts } = require('../lib/blog');
const { FILE } = require('../lib/comments');

const REPO = '/repos/Ftriger/trigerogtiger.blogg.no';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if ((req.headers['content-type'] || '').includes('application/json')) return JSON.parse(raw || '{}');
  return Object.fromEntries(new URLSearchParams(raw));
}

function gh(path, opts = {}) {
  return fetch('https://api.github.com' + path, {
    method: opts.method || 'GET',
    body: opts.body,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'trigerogtiger-kommentarer',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
}

async function save(comment) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const cur = await gh(`${REPO}/contents/${FILE}`);
    let data = { comments: [] }, sha;
    if (cur.ok) {
      const j = await cur.json();
      sha = j.sha;
      data = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8'));
      if (!Array.isArray(data.comments)) data.comments = [];
    } else if (cur.status !== 404) throw new Error('github ' + cur.status);
    data.comments.push(comment);
    const put = await gh(`${REPO}/contents/${FILE}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Ny kommentar fra ${comment.name}`,
        content: Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf8').toString('base64'),
        ...(sha ? { sha } : {})
      })
    });
    if (put.ok) return;
    if (put.status !== 409 && put.status !== 422) throw new Error('github ' + put.status);
  }
  throw new Error('conflict');
}

module.exports = async (req, res) => {
  const isForm = !(req.headers['content-type'] || '').includes('application/json');
  const done = (status, message, slug) => {
    if (isForm && slug) {
      res.statusCode = 303;
      res.setHeader('Location', `/innlegg/${encodeURIComponent(slug)}?kommentar=${status === 200 ? 'takk' : 'feil'}#kommentarer`);
      return res.end();
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ message }));
  };
  if (req.method !== 'POST') return done(405, 'Bruk POST');
  if (!process.env.GITHUB_TOKEN) return done(503, 'Kommentarer er ikke satt opp ennå.');

  let b;
  try { b = await readBody(req); } catch (e) { return done(400, 'Ugyldig forespørsel'); }
  const slug = String(b.slug || '').slice(0, 200);
  const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const text = String(b.text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);

  // Spam traps: hidden field must be empty, and nobody writes a comment in under 4 seconds
  if (b.website) return done(200, 'Takk!', slug);
  const t = Number(b.t || 0);
  if (!t || Date.now() - t < 4000) return done(400, 'Vent litt før du sender, og prøv igjen.', slug);

  const post = getPosts().find((p) => p.slug === slug);
  if (!post) return done(404, 'Fant ikke innlegget.');
  if (!name) return done(400, 'Skriv navnet ditt.', slug);
  if (text.length < 2) return done(400, 'Skriv en kommentar.', slug);
  if ((text.match(/https?:\/\//g) || []).length > 2) return done(400, 'For mange lenker i kommentaren.', slug);

  try {
    await save({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      slug, title: post.title, name, text,
      date: new Date().toISOString(),
      approved: false
    });
  } catch (e) {
    return done(502, 'Kunne ikke lagre kommentaren akkurat nå. Prøv igjen senere.', slug);
  }
  done(200, 'Takk! Kommentaren vises når den er godkjent.', slug);
};
