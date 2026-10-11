// /tema/ (list of topics) and /tema/<slug> (one topic with all its posts)
const { SITE, NAME, getPosts, describe, esc, absImg } = require('../lib/blog');
const { TOPICS } = require('../lib/topics');
const { shell, send } = require('../lib/page');

const dateNo = (p) => p.dateText.replace(/, kl\..*/, '');

module.exports = (req, res) => {
  const url = new URL(req.url, SITE);
  const slug = (url.searchParams.get('slug') || '').replace(/\/+$/, '');
  const posts = getPosts().filter((p) => !p.thin);

  if (!slug) {
    const list = TOPICS.map((t) => ({ t, n: posts.filter(t.match).length }));
    const body = `
  <div class="crumbs"><a href="/">${esc(NAME)}</a> › Temaer</div>
  <h1>Temaer på ${esc(NAME)}</h1>
  <div class="lead"><p>Reisene, bryllupet, husbyggingen og korpslivet, samlet tema for tema. Velg et tema for å lese alle innleggene om det i rekkefølge.</p></div>
  <div class="tgrid">${list.map(({ t, n }) => `<a class="tcard" href="/tema/${t.slug}"><strong>${esc(t.name)}</strong><span>${n} innlegg</span></a>`).join('')}</div>`;
    const ld = {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Temaer', url: SITE + '/tema/',
      isPartOf: { '@type': 'Blog', name: NAME, url: SITE },
      hasPart: TOPICS.map((t) => ({ '@type': 'CollectionPage', name: t.name, url: `${SITE}/tema/${t.slug}` }))
    };
    return send(res, shell({ title: `Temaer – ${NAME}`, desc: 'Alle temaene på familiebloggen Triger\'n og Tiger\'n: Sharm El Sheikh og Egypt, bryllupsreise, Paris og London med barn, Tyrkia, husbygging, korps og Justin Bieber.', path: '/tema/', ld, body }));
  }

  const t = TOPICS.find((x) => x.slug === slug);
  if (!t) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<!DOCTYPE html><html lang="nb"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Fant ikke temaet</title></head><body style="font-family:Georgia,serif;padding:3rem;text-align:center"><h1>Fant ikke temaet</h1><p><a href="/tema/">Alle temaer</a></p></body></html>');
  }

  // Oldest first, so the trip or project reads as a story
  const items = posts.filter(t.match).sort((a, b) => new Date(a.iso) - new Date(b.iso));
  const firstImg = items.find((p) => p.images.length);
  const img = firstImg ? absImg(firstImg.images[0]) : null;
  const desc = t.intro[0].length > 155 ? t.intro[0].slice(0, t.intro[0].lastIndexOf(' ', 152)) + '…' : t.intro[0];

  const body = `
  <div class="crumbs"><a href="/">${esc(NAME)}</a> › <a href="/tema/">Temaer</a> › ${esc(t.name)}</div>
  <h1>${esc(t.title)}</h1>
  <div class="lead">${t.intro.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
  <ul class="plist">${items.map((p) => `
    <li>${p.images.length ? `<img src="${esc(absImg(p.images[0]))}" alt="${esc(p.title)}" loading="lazy">` : ''}
      <div><a class="t" href="/innlegg/${p.slug}">${esc(p.seoTitle)}</a><time datetime="${p.iso}">${esc(dateNo(p))}</time><p>${esc(describe(p))}</p></div></li>`).join('')}
  </ul>`;

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.title, description: desc,
      url: `${SITE}/tema/${t.slug}`, inLanguage: 'nb-NO', image: img || undefined,
      isPartOf: { '@type': 'Blog', name: NAME, url: SITE },
      mainEntity: {
        '@type': 'ItemList', numberOfItems: items.length,
        itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/innlegg/${p.slug}`, name: p.seoTitle }))
      }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Temaer', item: SITE + '/tema/' },
        { '@type': 'ListItem', position: 3, name: t.name, item: `${SITE}/tema/${t.slug}` }
      ]
    }
  ];

  send(res, shell({ title: `${t.title} – ${NAME}`, desc, path: `/tema/${t.slug}`, ld, body, img }));
};
