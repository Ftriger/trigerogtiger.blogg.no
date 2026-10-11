// /sitemap.xml – front page plus every post, with images, kept in step with index.html
const { SITE, getPosts, esc, absImg } = require('../lib/blog');

module.exports = (req, res) => {
  const posts = getPosts();
  const newest = posts.length ? posts[0].iso : new Date().toISOString();
  const urls = [
    `<url><loc>${SITE}/</loc><lastmod>${newest}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...posts.map((p) => `<url><loc>${SITE}/innlegg/${p.slug}</loc><lastmod>${p.iso}</lastmod><priority>0.7</priority>${p.images.slice(0, 20).map((s) => `<image:image><image:loc>${esc(absImg(s))}</image:loc></image:image>`).join('')}</url>`)
  ];
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`);
};
