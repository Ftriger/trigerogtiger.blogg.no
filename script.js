# style.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f5f5;
  color: #222;
  line-height: 1.6;
}

header {
  background: #111;
  color: white;
  padding: 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

nav button,
nav a {
  background: #222;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: 0.2s ease;
}

nav button:hover,
nav a:hover {
  background: #444;
}

main {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 20px;
}

article {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.post-inner {
  padding: 20px;
}

.post-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #777;
}

.post-tag {
  background: #eee;
  padding: 4px 10px;
  border-radius: 999px;
}

article h2 {
  font-size: 1.7rem;
  margin-bottom: 15px;
}

article p {
  margin-bottom: 15px;
}

article img {
  width: 100%;
  height: auto;
  display: block;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 30px;
}

.gallery-grid img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
  transition: transform 0.2s ease;
}

.gallery-grid img:hover {
  transform: scale(1.03);
}

footer {
  text-align: center;
  padding: 40px 20px;
  color: #777;
}

.hidden {
  display: none;
}

@media (max-width: 768px) {
  header h1 {
    font-size: 1.5rem;
  }

  nav {
    flex-direction: column;
  }

  article h2 {
    font-size: 1.3rem;
  }
}
```

---

# script.js

```javascript
// Smooth scroll for menu links

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute('href'));

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Category filtering

const filterButtons = document.querySelectorAll('[data-filter]');
const posts = document.querySelectorAll('article');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    posts.forEach(post => {
      if (filter === 'all') {
        post.classList.remove('hidden');
      } else {
        if (post.classList.contains(filter)) {
          post.classList.remove('hidden');
        } else {
          post.classList.add('hidden');
        }
      }
    });
  });
});

// Lazy load images

const lazyImages = document.querySelectorAll('img');

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;

      if (img.dataset.src) {
        img.src = img.dataset.src;
      }

      img.classList.add('loaded');
      observer.unobserve(img);
    }
  });
});

lazyImages.forEach(img => {
  imageObserver.observe(img);
});

// Mobile menu toggle

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
  });
}

// Console message

console.log('TrigerOgTiger blogg lastet korrekt 🚀');
```
