// One page per blog post: /innlegg/<slug>
// Built from index.html on request, so posts published from admin get a page right away.
const { SITE, NAME, readIndex, getPosts, describe, esc, absImg, GTAG } = require('../lib/blog');
const { TOPICS } = require('../lib/topics');
const { approvedFor } = require('../lib/comments');

module.exports = (req, res) => {
  const url = new URL(req.url, SITE);
  const slug = (url.searchParams.get('slug') || '').replace(/\/+$/, '');
  const html = readIndex();
  const posts = getPosts(html);
  const i = posts.findIndex((p) => p.slug === slug);

  if (i < 0) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`<!DOCTYPE html><html lang="nb"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Fant ikke innlegget</title></head><body style="font-family:Georgia,serif;padding:3rem;text-align:center"><h1>Fant ikke innlegget</h1><p><a href="/">Til forsiden</a></p></body></html>`);
  }

  const p = posts[i];
  const newer = posts[i - 1], older = posts[i + 1];
  const related = posts.filter((x, j) => j !== i && !x.thin && x.cls === p.cls)
    .sort((a, b) => Math.abs(new Date(a.iso) - new Date(p.iso)) - Math.abs(new Date(b.iso) - new Date(p.iso)))
    .slice(0, 5);
  const css = (/<style>([\s\S]*?)<\/style>/.exec(html) || [])[1] || '';
  const canonical = `${SITE}/innlegg/${p.slug}`;
  const desc = describe(p);
  const img = p.images[0] ? absImg(p.images[0]) : null;
  const year = p.iso.slice(0, 4);
  const topics = TOPICS.filter((t) => t.match(p));
  const comments = approvedFor(p.slug);
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' });
  const commentsHtml = `
  <section class="comments" id="kommentarer">
    <h2>Kommentarer${comments.length ? ` (${comments.length})` : ''}</h2>
    ${comments.length ? `<ol class="clist">${comments.map((c) => `
      <li><div class="chead"><strong>${esc(c.name)}</strong> <time datetime="${esc(c.date)}">${esc(fmtDate(c.date))}</time></div>
      <div class="ctext">${esc(c.text).replace(/\n/g, '<br>')}</div></li>`).join('')}</ol>` : '<p class="cnone">Ingen kommentarer ennå. Bli den første!</p>'}
    <form class="cform" method="post" action="/api/kommentar.js">
      <input type="hidden" name="slug" value="${esc(p.slug)}">
      <input type="hidden" name="t" value="">
      <div class="hp" aria-hidden="true"><label>Nettside <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <label for="cname">Navn</label>
      <input id="cname" name="name" type="text" maxlength="60" required autocomplete="name">
      <label for="ctext">Kommentar</label>
      <textarea id="ctext" name="text" rows="5" maxlength="2000" required></textarea>
      <button type="submit">Send kommentar</button>
      <p class="cmsg" role="status"></p>
      <p class="cnote">Kommentarer vises etter at de er godkjent. Vi viser bare navnet du skriver.</p>
    </form>
  </section>
  <script>
  (function () {
    var f = document.querySelector('.cform'); if (!f) return;
    f.t.value = Date.now();
    var msg = f.querySelector('.cmsg');
    if (/kommentar=takk/.test(location.search)) msg.textContent = 'Takk! Kommentaren vises når den er godkjent.';
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('button'); btn.disabled = true; msg.textContent = 'Sender…';
      fetch('/api/kommentar.js', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: f.slug.value, t: f.t.value, website: f.website.value, name: f.name.value, text: f.text.value }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) { msg.textContent = x.j.message || (x.ok ? 'Takk!' : 'Noe gikk galt.'); if (x.ok) { f.text.value = ''; } })
        .catch(function () { msg.textContent = 'Kunne ikke sende. Prøv igjen.'; })
        .then(function () { btn.disabled = false; });
    });
  })();
  </script>`;

  // Image paths in the post are relative to the front page
  let content = p.content.replace(/src="(?!https?:|\/)([^"]+)"/g, 'src="/$1"');
  let n = 0;
  content = content.replace(/<img([^>]*?)alt="[^"]*"/g, (m, a) => `<img${a}alt="${esc(p.title)} – bilde ${++n}"`);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.seoTitle.slice(0, 110),
      description: desc,
      datePublished: p.iso,
      dateModified: p.iso,
      inLanguage: 'nb-NO',
      mainEntityOfPage: canonical,
      url: canonical,
      articleSection: p.tag,
      wordCount: p.text.split(' ').length,
      commentCount: comments.length,
      comment: comments.length ? comments.map((c) => ({ '@type': 'Comment', text: c.text, dateCreated: c.date, author: { '@type': 'Person', name: c.name } })) : undefined,
      image: p.images.length ? p.images.map(absImg) : undefined,
      author: { '@type': 'Person', name: 'Tina og Finn Magne Triger', url: SITE },
      publisher: { '@type': 'Organization', name: NAME, url: SITE },
      isPartOf: { '@type': 'Blog', name: NAME, url: SITE }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: p.tag, item: SITE + '/#' + ({ travel: 'reise', blog: 'blogg', kids: 'barna', rec: 'oppskrifter' }[p.cls] || 'alle') },
        { '@type': 'ListItem', position: 3, name: p.title, item: canonical }
      ]
    }
  ];

  const link = (x, label) => x ? `<a class="pn" href="/innlegg/${x.slug}"><span>${label}</span>${esc(x.title)}</a>` : '<span></span>';

  const page = `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${GTAG}
<title>${esc(p.seoTitle)} – ${esc(NAME)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${p.thin ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="author" content="Tina og Finn Magne Triger">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(NAME)}">
<meta property="og:locale" content="nb_NO">
<meta property="og:title" content="${esc(p.seoTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
${img ? `<meta property="og:image" content="${img}">` : ''}
<meta property="article:published_time" content="${p.iso}">
<meta property="article:section" content="${esc(p.tag)}">
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(p.seoTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
${img ? `<meta name="twitter:image" content="${img}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(NAME)}" href="${SITE}/rss.xml">
${newer ? `<link rel="next" href="/innlegg/${newer.slug}">` : ''}
${older ? `<link rel="prev" href="/innlegg/${older.slug}">` : ''}
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;1,8..60,300;1,8..60,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>${css}
.single { max-width: 980px; margin: 0 auto; padding: 2rem 16px 4rem; }
.crumbs { font-family: 'Inter', sans-serif; font-size: .82rem; color: var(--muted); margin-bottom: 1.2rem; }
.crumbs a { color: var(--accent); text-decoration: none; }
.single article h1 { font-family: 'Playfair Display', serif; font-size: clamp(1.7rem, 4vw, 2.4rem); line-height: 1.2; margin: .4rem 0 1.2rem; }
.single .post-gallery img { max-width: 100% !important; max-height: none !important; width: 100%; height: auto; }
.pager { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2.5rem 0 1.5rem; }
.pn { display: block; padding: 1rem; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--ink); text-decoration: none; font-family: 'Inter', sans-serif; font-size: .9rem; }
.pn span { display: block; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: .3rem; }
.pn:hover { border-color: var(--accent2); }
.related h2 { font-family: 'Playfair Display', serif; font-size: 1.2rem; margin-bottom: .6rem; }
.related ul { list-style: none; padding: 0; }
.related li { padding: .45rem 0; border-bottom: 1px solid var(--border); font-family: 'Inter', sans-serif; font-size: .92rem; }
.related a { color: var(--ink); text-decoration: none; }
.related a:hover { color: var(--accent); }
.related time { color: var(--muted); font-size: .8rem; margin-left: .4rem; }
.home-link { margin-top: 2rem; font-family: 'Inter', sans-serif; }
.home-link a, .topics a { color: var(--accent); }
.topics { font-family: 'Inter', sans-serif; font-size: .92rem; margin-top: 2rem; }
.comments { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.comments h2 { font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 1rem; }
.clist { list-style: none; padding: 0; margin: 0 0 1.5rem; }
.clist li { padding: .9rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin-bottom: .7rem; }
.chead { font-family: 'Inter', sans-serif; font-size: .85rem; margin-bottom: .35rem; }
.chead time { color: var(--muted); margin-left: .4rem; font-size: .78rem; }
.ctext { line-height: 1.6; }
.cnone { color: var(--muted); font-style: italic; margin-bottom: 1rem; }
.cform { display: grid; gap: .45rem; max-width: 640px; font-family: 'Inter', sans-serif; }
.cform label { font-size: .8rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); margin-top: .4rem; }
.cform input[type=text], .cform textarea { font: inherit; font-size: 1rem; padding: .65rem .8rem; border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--ink); width: 100%; box-sizing: border-box; }
.cform textarea { resize: vertical; font-family: 'Source Serif 4', Georgia, serif; }
.cform button { justify-self: start; margin-top: .5rem; padding: .7rem 1.3rem; border: none; border-radius: 8px; background: var(--accent); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
.cform button:disabled { opacity: .6; cursor: wait; }
.cmsg { min-height: 1.2em; font-size: .9rem; color: var(--accent); }
.cnote { font-size: .78rem; color: var(--muted); }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
@media (max-width: 560px) { .pager { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="single">
  <div class="crumbs"><a href="/">${esc(NAME)}</a> › <a href="/#${({ travel: 'reise', blog: 'blogg', kids: 'barna', rec: 'oppskrifter' }[p.cls] || 'alle')}">${esc(p.tag)}</a> › ${year}</div>
  <article class="${p.cls}">
    <div class="post-inner">
    <div class="post-meta">
      <time class="post-date" datetime="${p.iso}">${esc(p.dateText)}</time>
      <span class="post-tag">${esc(p.tag)}</span>
    </div>
    <h1>${esc(p.title)}</h1>
    ${content}
    </div>
  </article>
  ${commentsHtml}
  ${topics.length ? `<p class="topics">Les mer: ${topics.map((t) => `<a href="/tema/${t.slug}">${esc(t.name)}</a>`).join(' · ')}</p>` : ''}
  <div class="pager">${link(older, '← Eldre innlegg')}${link(newer, 'Nyere innlegg →')}</div>
  ${related.length ? `<section class="related"><h2>Flere innlegg om ${esc(p.tag.toLowerCase())}</h2><ul>${related.map((x) => `<li><a href="/innlegg/${x.slug}">${esc(x.title)}</a><time datetime="${x.iso}">${esc(x.dateText.replace(/, kl\..*/, ''))}</time></li>`).join('')}</ul></section>` : ''}
  <p class="home-link"><a href="/">← Alle innlegg på ${esc(NAME)}</a> · <a href="/tema/">Temaer</a> · <a href="/om-oss">Om oss</a></p>
</div>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.end(page);
};
