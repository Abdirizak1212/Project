/* Nadaara Hub — main.js */

window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  updateReadingProgress();
  updateFloatShare();
});

function toggleMenu() {
  const links = document.getElementById('navLinks');
  const hamburger = document.getElementById('hamburger');
  if (!links) return;
  links.classList.toggle('open');
  if (hamburger) hamburger.classList.toggle('active');
}

function toggleSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  overlay.classList.toggle('active');
  if (overlay.classList.contains('active')) setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
}

function runSearch() {
  const query = document.getElementById('searchInput')?.value.trim();
  if (query) { showToast('Search coming soon — use Ctrl+F for now.'); toggleSearch(); }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { const o = document.getElementById('searchOverlay'); if (o?.classList.contains('active')) toggleSearch(); }
});

function updateReadingProgress() {
  const bar = document.getElementById('readingProgress');
  if (!bar) return;
  const article = document.getElementById('articleBody');
  if (!article) {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) bar.style.width = Math.min((scrollTop / docHeight) * 100, 100) + '%';
    return;
  }
  const pct = Math.max(0, Math.min(((window.scrollY - article.offsetTop) / article.offsetHeight) * 100, 100));
  bar.style.width = pct + '%';
}

function updateFloatShare() {
  const f = document.getElementById('floatShare');
  if (f) f.classList.toggle('visible', window.scrollY > 400);
}

function sharePost(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  const urls = {
    twitter: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
    whatsapp: 'https://api.whatsapp.com/send?text=' + title + '%20' + url,
  };
  if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!'));
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
  });
}

async function subscribeNewsletter(e) {
  e.preventDefault();
  const form     = e.target;
  const btn      = form.querySelector('button[type="submit"]') || document.getElementById('nl-submit-btn');
  const alertEl  = document.getElementById('nl-alert');
  const emailEl  = form.querySelector('input[type="email"]');
  const nameEl   = form.querySelector('input[type="text"]');
  const email    = emailEl ? emailEl.value.trim() : '';
  const name     = nameEl  ? nameEl.value.trim()  : '';
  if (!email) return;

  const originalText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing…'; btn.disabled = true; }

  function showNlAlert(msg, ok) {
    if (!alertEl) return;
    alertEl.textContent    = msg;
    alertEl.style.display  = 'block';
    alertEl.style.background  = ok ? 'rgba(40,167,69,.15)' : 'rgba(220,53,69,.15)';
    alertEl.style.color       = ok ? '#28a745' : '#dc3545';
    alertEl.style.border      = ok ? '1px solid #28a74540' : '1px solid #dc354540';
    alertEl.style.padding     = '.6rem 1rem';
    alertEl.style.borderRadius = '8px';
    alertEl.style.fontSize    = '.88rem';
    alertEl.style.marginBottom = '1rem';
  }

  /* grab optional fields from the form if present */
  const freqEl  = form.querySelector('select');
  const frequency = freqEl ? freqEl.value : 'weekly';

  try {
    if (typeof db !== 'undefined') {
      /* try full insert first; fall back to email-only if columns mismatch */
      let result = await db.from('newsletter_subscribers').insert({
        email:     email,
        name:      name || null,
        frequency: frequency || 'weekly',
        active:    true
      });

      if (result.error && result.error.code !== '23505') {
        /* retry with minimal fields in case table has fewer columns */
        result = await db.from('newsletter_subscribers').insert({ email: email });
      }

      if (result.error) {
        if (result.error.code === '23505') {
          showNlAlert('You are already subscribed — thank you!', true);
          showToast('Already subscribed!');
        } else {
          throw new Error(result.error.message);
        }
      } else {
        showNlAlert('You are subscribed! Welcome to Nadaara Hub.', true);
        showToast('Subscribed to Nadaara Hub!');
        form.reset();
      }
    } else {
      await new Promise(r => setTimeout(r, 1200));
      showNlAlert('Subscribed! Welcome to Nadaara Hub.', true);
      showToast('Subscribed!');
      form.reset();
    }
  } catch (err) {
    showNlAlert('Subscription failed: ' + err.message, false);
  } finally {
    if (btn) setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3500);
  }
}

function toggleTopic(el) { el.classList.toggle('active'); }

let currentFilter = 'all';
function setFilter(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.post-card[data-cat]').forEach(card => {
    card.style.display = (currentFilter === 'all' || card.dataset.cat === currentFilter) ? '' : 'none';
  });
}

function sortPosts(val) { showToast('Sorted by: ' + val.charAt(0).toUpperCase() + val.slice(1)); }

function setAIFilter(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.ai-card[data-cat]').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
}

function loadMoreAI() { showToast('Loading more AI news…'); }

let liked = false;
function toggleLike() {
  liked = !liked;
  const btn   = document.getElementById('likeBtn');
  const count = document.getElementById('likeCount');
  if (!btn || !count) return;
  count.textContent = liked ? parseInt(count.textContent) + 1 : parseInt(count.textContent) - 1;
  btn.classList.toggle('liked', liked);
  if (liked) showToast('You liked this article!');
}

function submitComment(e) { e.preventDefault(); showToast('Comment submitted — it will appear after review.'); e.target.reset(); }

function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

function openEdition(num) { showToast('Edition #' + num + ' — archive viewer coming soon!'); }

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('page-btn') && !e.target.classList.contains('next')) {
    document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    window.scrollTo({ top: document.querySelector('.blog-page')?.offsetTop - 100 || 0, behavior: 'smooth' });
  }
});
