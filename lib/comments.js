// Comments live in kommentarer/kommentarer.json in the repo.
// New ones arrive as approved:false and show up after approval in admin.
const fs = require('fs');
const path = require('path');

const FILE = 'kommentarer/kommentarer.json';

function readComments() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', FILE), 'utf8'));
    return Array.isArray(data.comments) ? data.comments : [];
  } catch (e) {
    return [];
  }
}

function approvedFor(slug) {
  return readComments()
    .filter((c) => c.slug === slug && c.approved)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

module.exports = { FILE, readComments, approvedFor };
