// /rss.xml – feed for blog readers and blog lists (Feedly, Bloglovin, blogglister …)
const { SITE, NAME, getPosts, describe, esc, absImg } = require('../lib/blog');

module.exports = (req, res) => {
  const posts = getPosts().slice(0, 50);
  const rfc = (iso) => new Date(iso).toUTCString();
  const items = posts.map((p) => {
    const link = `${SITE}/innlegg/${p.slug}`;
    const img = p.images[0] ? `<enclosure url="${esc(absImg(p.images[0]))}" type="image/jpeg" length="0"/>` : '';
    return `<item><title>${esc(p.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${rfc(p.iso)}</pubDate><category>${esc(p.tag)}</category><description>${esc(describe(p))}</description>${img}</item>`;
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.end(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(NAME)} – familieblogg og reiseblogg</title>
<link>${SITE}/</link>
<atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
<description>Familien Triger fra Vestfold blogger om reiser, korps, hverdag og seks barn – Egypt, Tyrkia, Paris, London, Spania, Sardinia og mye mer.</description>
<language>nb-no</language>
${posts.length ? `<lastBuildDate>${rfc(posts[0].iso)}</lastBuildDate>` : ''}
${items.join('\n')}
</channel>
</rss>`);
};
