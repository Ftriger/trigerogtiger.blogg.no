// Shared page shell for topic pages and the about page, styled like the front page.
const { SITE, NAME, readIndex, esc, GTAG } = require('./blog');

const FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;1,8..60,300;1,8..60,400&family=Inter:wght@300;400;500;600&display=swap';

const EXTRA = `
.single { max-width: 980px; margin: 0 auto; padding: 2rem 16px 4rem; }
.crumbs { font-family: 'Inter', sans-serif; font-size: .82rem; color: var(--muted); margin-bottom: 1.2rem; }
.crumbs a { color: var(--accent); text-decoration: none; }
.single h1 { font-family: 'Playfair Display', serif; font-size: clamp(1.7rem, 4vw, 2.4rem); line-height: 1.2; margin: .4rem 0 1.2rem; }
.lead p { font-size: 1.08rem; line-height: 1.7; margin-bottom: 1rem; }
.plist { list-style: none; padding: 0; margin: 2rem 0; }
.plist li { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
.plist img { width: 120px; height: 90px; object-fit: cover; border-radius: 6px; flex: none; }
.plist a.t { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--ink); text-decoration: none; display: block; margin-bottom: .25rem; }
.plist a.t:hover { color: var(--accent); }
.plist time { font-family: 'Inter', sans-serif; font-size: .78rem; color: var(--muted); }
.plist p { font-size: .95rem; line-height: 1.55; margin-top: .3rem; color: var(--ink); }
.tgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin: 2rem 0; }
.tcard { display: block; padding: 1.2rem; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--ink); text-decoration: none; }
.tcard:hover { border-color: var(--accent2); }
.tcard strong { font-family: 'Playfair Display', serif; font-size: 1.2rem; display: block; margin-bottom: .3rem; }
.tcard span { font-family: 'Inter', sans-serif; font-size: .8rem; color: var(--muted); }
.home-link { margin-top: 2rem; font-family: 'Inter', sans-serif; }
.home-link a { color: var(--accent); }
@media (max-width: 560px) { .plist img { width: 84px; height: 64px; } }
`;

function shell({ title, desc, path, ld, body, img, type = 'website' }) {
  const css = (/<style>([\s\S]*?)<\/style>/.exec(readIndex()) || [])[1] || '';
  const url = SITE + path;
  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${GTAG}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(NAME)}">
<meta property="og:locale" content="nb_NO">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
${img ? `<meta property="og:image" content="${img}">\n<meta name="twitter:image" content="${img}">` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
<link rel="alternate" type="application/rss+xml" title="${esc(NAME)}" href="${SITE}/rss.xml">
<link href="${FONTS}" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>${css}${EXTRA}</style>
</head>
<body>
<div class="single">
${body}
  <p class="home-link"><a href="/">← Alle innlegg</a> · <a href="/tema/">Temaer</a> · <a href="/om-oss">Om oss</a></p>
</div>
</body>
</html>`;
}

function send(res, html, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.end(html);
}

module.exports = { shell, send };
