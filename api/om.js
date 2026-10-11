// /om-oss – who writes the blog (helps Google and AI search trust who is behind it)
const { SITE, NAME, getPosts, esc } = require('../lib/blog');
const { TOPICS } = require('../lib/topics');
const { shell, send } = require('../lib/page');

module.exports = (req, res) => {
  const posts = getPosts();
  const first = posts[posts.length - 1], last = posts[0];
  const img = SITE + '/image/og-bilde.jpg';

  const body = `
  <div class="crumbs"><a href="/">${esc(NAME)}</a> › Om oss</div>
  <h1>Om oss – familien bak ${esc(NAME)}</h1>
  <div class="lead">
    <p>${esc(NAME)} er familiebloggen til Finn Magne og Tina Triger fra Sandefjord i Vestfold. Bloggen startet i november 2008, rett før vår første tur til Sharm El Sheikh, og vi skrev her fram til 2014. Til sammen ble det ${posts.length} innlegg.</p>
    <p>Det begynte som en reiseblogg, men ble fort mer enn det. Husbyggingen i 2009–2010, bryllupet i Sandefjord kirke i 2010, bryllupsreisen til Spania og Sardinia, Paris og London med barna, Tyrkia, korps og 17. mai. Og hverdagen i en familie med seks barn: Kine, Tiril, Emma, Theo og tvillingene Storm og Ariane.</p>
  </div>
  <h2 style="font-family:'Playfair Display',serif;margin:2rem 0 .6rem">Hvem er vi?</h2>
  <div class="lead">
    <p><strong>Finn Magne</strong> – alltid optimistisk, eventyrlysten, bereist, øl-elskende (er det øl der? ja da drar vi!), tøff, praktisk, susete og uten stedsans.</p>
    <p><strong>Tina</strong> – bereist i Danmark, snakkesalig, eventyrlysten, nysgjerrig, susete og uten stedsans.</p>
    <p>Sammen er vi dynamitt!</p>
  </div>
  <h2 style="font-family:'Playfair Display',serif;margin:2rem 0 .6rem">Les mer</h2>
  <div class="tgrid">${TOPICS.map((t) => `<a class="tcard" href="/tema/${t.slug}"><strong>${esc(t.name)}</strong></a>`).join('')}</div>
  <div class="lead"><p style="font-size:.9rem;color:var(--muted)">Bloggen lå opprinnelig på trigerogtiger.blogg.no og er gjenopprettet fra arkivkopier. Noen bilder fra de eldste innleggene gikk tapt underveis.</p></div>`;

  const people = [
    { '@type': 'Person', '@id': SITE + '/om-oss#finn-magne', name: 'Finn Magne Triger', homeLocation: { '@type': 'Place', name: 'Sandefjord, Vestfold' } },
    { '@type': 'Person', '@id': SITE + '/om-oss#tina', name: 'Tina Triger', homeLocation: { '@type': 'Place', name: 'Sandefjord, Vestfold' } }
  ];
  const ld = {
    '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Om oss', url: SITE + '/om-oss', inLanguage: 'nb-NO',
    mainEntity: {
      '@type': 'Blog', name: NAME, url: SITE, inLanguage: 'nb-NO',
      dateCreated: first.iso, dateModified: last.iso,
      author: people, about: ['Reiser', 'Familieliv', 'Husbygging', 'Korps']
    }
  };

  send(res, shell({ title: `Om oss – ${NAME}`, desc: `Familien Triger fra Sandefjord: Finn Magne, Tina og seks barn. Familieblogg og reiseblogg fra 2008 til 2014 om Egypt, bryllupsreise, Paris, London, Tyrkia, husbygging og korps.`, path: '/om-oss', ld, body, img, type: 'profile' }));
};
