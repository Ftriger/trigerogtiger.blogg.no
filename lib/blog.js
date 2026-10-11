// Shared helpers: read the posts out of index.html so every post gets its own
// page, the sitemap and the RSS feed stay in step with what admin publishes.
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.trigerogtiger.no';
const NAME = "Triger'n og Tiger'n";
const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli',
  'august', 'september', 'oktober', 'november', 'desember'];
const CATS = { travel: 'Reise', blog: 'Blogg', kids: 'Barna', rec: 'Test/anbefaling' };

function readIndex() {
  return fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
}

function decode(s) {
  return s.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Same slug rule as the small script on the front page
function slugify(dateIso, title) {
  const t = title.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const t60 = t.length > 60 ? t.slice(0, 61).replace(/-[^-]*$/, '') : t;
  return dateIso.slice(0, 10) + (t60 ? '-' + t60 : '');
}

// Europe/Oslo offset: summer time from last Sunday of March to last Sunday of October
function osloOffset(y, m, d) {
  const lastSun = (mon) => { const x = new Date(Date.UTC(y, mon + 1, 0)); return x.getUTCDate() - x.getUTCDay(); };
  const md = m * 100 + d;
  const start = 2 * 100 + lastSun(2), end = 9 * 100 + lastSun(9);
  return md >= start && md < end ? '+02:00' : '+01:00';
}

function parseDate(text) {
  const m = /(\d{1,2})\. (\w+) (\d{4})(?:, kl\. (\d{2}):(\d{2}))?/.exec(text || '');
  if (!m) return null;
  const mon = MONTHS.indexOf(m[2].toLowerCase());
  if (mon < 0) return null;
  const y = +m[3], d = +m[1], hh = m[4] || '12', mm = m[5] || '00';
  const p = (n) => String(n).padStart(2, '0');
  return `${y}-${p(mon + 1)}-${p(d)}T${hh}:${mm}:00${osloOffset(y, mon, d)}`;
}

function getPosts(html) {
  html = html || readIndex();
  const posts = [];
  const re = /<article class="([a-z]+)"[^>]*>([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const body = m[2];
    const dateText = decode((/class="post-date">([\s\S]*?)<\/span>/.exec(body) || [])[1] || '');
    const tag = decode((/class="post-tag[^"]*">([\s\S]*?)<\/span>/.exec(body) || [])[1] || CATS[m[1]] || '');
    const titleHtml = (/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(body) || [])[1] || '';
    const title = decode(titleHtml).trim() || 'Uten tittel';
    const iso = parseDate(dateText);
    if (!iso) continue;
    const images = [...body.matchAll(/<img[^>]*src="([^"]+)"/g)].map((x) => x[1]);
    const text = decode(body.replace(/<div class="post-meta">[\s\S]*?<\/div>/, '').replace(/<h2[\s\S]*?<\/h2>/, '').replace(/<[^>]*class="location-badge"[^>]*>[\s\S]*?<\/(?:span|div|p)>/g, ''))
      .replace(/\s+/g, ' ').trim();
    // Inner content without the meta row and title, for the post page
    const content = body
      .replace(/^\s*<div class="post-inner">/, '').replace(/<\/div>\s*$/, '')
      .replace(/<div class="post-meta">[\s\S]*?<\/div>/, '').replace(/<h2[\s\S]*?<\/h2>/, '');
    posts.push({ cls: m[1], dateText, tag, title, iso, images, text, content, slug: slugify(iso, title) });
  }
  // Unique slugs (two posts with the same title on one day)
  const seen = {};
  for (const p of posts) {
    if (seen[p.slug]) { seen[p.slug]++; p.slug += '-' + seen[p.slug]; } else seen[p.slug] = 1;
  }
  // Search titles and thin posts (one-line mobile posts whose photos are lost)
  let seo = {};
  try { seo = require('./seo.json'); } catch (e) {}
  for (const p of posts) {
    p.seoTitle = seo[p.slug] || p.title;
    p.thin = !p.images.length && p.text.split(' ').length < 20;
  }
  // Newest first by date (slugs above are numbered in front-page order, like the page script)
  return posts.sort((a, b) => new Date(b.iso) - new Date(a.iso));
}

function describe(p) {
  const t = p.text || p.title;
  if (t.length <= 155) return t;
  const cut = t.slice(0, 155);
  return cut.slice(0, cut.lastIndexOf(' ') > 100 ? cut.lastIndexOf(' ') : 155).replace(/[,.;:!?\s]+$/, '') + '…';
}

function absImg(src) {
  if (/^https?:/.test(src)) return src;
  return SITE + '/' + src.replace(/^\/+/, '');
}

// Share image for Facebook and others: the post's first image, or the blog's own share image
let SIZES = {};
try { SIZES = require('./imgsizes.json'); } catch (e) {}
const DEFAULT_IMG = { url: SITE + '/image/og-bilde.jpg', w: 1200, h: 630, alt: "Triger'n og Tiger'n – reiser, korps og hverdag med seks barn" };
function shareImage(src, alt) {
  if (!src) return DEFAULT_IMG;
  const key = String(src).replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
  const s = SIZES[key];
  // Facebook ignores very small images; fall back to the blog's share image
  if (s && (s[0] < 200 || s[1] < 200)) return DEFAULT_IMG;
  return { url: absImg(src), w: s ? s[0] : null, h: s ? s[1] : null, alt: alt || '' };
}
function ogImageTags(img) {
  return [
    `<meta property="og:image" content="${esc(img.url)}">`,
    `<meta property="og:image:secure_url" content="${esc(img.url)}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    img.w ? `<meta property="og:image:width" content="${img.w}">` : '',
    img.h ? `<meta property="og:image:height" content="${img.h}">` : '',
    img.alt ? `<meta property="og:image:alt" content="${esc(img.alt)}">` : '',
    `<meta name="twitter:image" content="${esc(img.url)}">`
  ].filter(Boolean).join('\n');
}

const GTAG = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-SF15YNXK3X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-SF15YNXK3X');
</script>`;

module.exports = { SITE, NAME, MONTHS, readIndex, getPosts, describe, esc, decode, absImg, slugify, GTAG, shareImage, ogImageTags, DEFAULT_IMG };
