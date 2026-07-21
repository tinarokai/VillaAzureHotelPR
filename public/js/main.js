// Header scroll
const header = document.querySelector('.header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 60);
    header.classList.toggle('header--top', window.scrollY <= 60);
  });
  header.classList.add('header--top');
}

// Mobile menu toggle
const toggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const spans = toggle.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    }
  });
}

// Scroll animations
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Room card galleries
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const track = gallery.querySelector('.rg-track');
  const slides = Array.from(track.querySelectorAll('img'));
  const prev = gallery.querySelector('.rg-prev');
  const next = gallery.querySelector('.rg-next');
  const dotsWrap = gallery.querySelector('.rg-dots');
  if (!track || slides.length < 2) {
    if (prev) prev.style.display = 'none';
    if (next) next.style.display = 'none';
    return;
  }

  // build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Photo ${i + 1}`);
    dot.addEventListener('click', () => scrollTo(i));
    dotsWrap.appendChild(dot);
  });

  function current() {
    const w = track.clientWidth;
    return Math.round(track.scrollLeft / w);
  }
  function scrollTo(i) {
    const w = track.clientWidth;
    const max = slides.length - 1;
    const idx = Math.max(0, Math.min(max, i));
    track.scrollTo({ left: w * idx, behavior: 'smooth' });
  }
  function update() {
    const idx = current();
    dotsWrap.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === idx));
  }

  prev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); scrollTo(current() - 1); });
  next.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); scrollTo(current() + 1); });
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
});

// Testimonials slider
(function () {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;
  const prev = document.querySelector('.t-prev');
  const next = document.querySelector('.t-next');
  const dotsWrap = document.getElementById('testimonialsDots');
  const slides = Array.from(track.children);

  function visibleCount() { return 1; }
  function pageCount() { return Math.max(1, slides.length - visibleCount() + 1); }

  function buildDots() {
    if (!dotsWrap) return;
    const count = pageCount();
    dotsWrap.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      b.addEventListener('click', () => scrollToIndex(i));
      dotsWrap.appendChild(b);
    }
    updateDots();
  }

  function currentIndex() {
    const slideW = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || '0');
    return Math.round(track.scrollLeft / slideW);
  }
  function scrollToIndex(i) {
    const slideW = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || '0');
    track.scrollTo({ left: slideW * i, behavior: 'smooth' });
  }
  function updateDots() {
    if (!dotsWrap) return;
    const idx = currentIndex();
    dotsWrap.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === idx));
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= pageCount() - 1;
  }

  prev?.addEventListener('click', () => scrollToIndex(Math.max(0, currentIndex() - 1)));
  next?.addEventListener('click', () => scrollToIndex(Math.min(pageCount() - 1, currentIndex() + 1)));
  track.addEventListener('scroll', () => requestAnimationFrame(updateDots), { passive: true });
  window.addEventListener('resize', () => { buildDots(); });

  buildDots();
})();

// Lightbox
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lightboxImg = lightbox.querySelector('img');
  const galleryItems = document.querySelectorAll('.gallery-item');
  let currentIndex = 0;
  const images = [];

  galleryItems.forEach((item, i) => {
    const img = item.querySelector('img');
    if (img) images.push(img.src);
    item.addEventListener('click', () => {
      currentIndex = i;
      lightboxImg.src = images[currentIndex];
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

  function navigate(dir) {
    currentIndex = (currentIndex + dir + images.length) % images.length;
    lightboxImg.src = images[currentIndex];
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
}

// Contact form (basic)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Message Sent!';
    btn.style.background = '#25d366';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      btn.style.color = '';
      contactForm.reset();
    }, 3000);
  });
}

// Force autoplay on mobile (iOS/Android sometimes needs an explicit play() call)
(function(){
  function kick(v){
    try {
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted','');
      v.setAttribute('playsinline','');
      v.setAttribute('webkit-playsinline','');
      v.setAttribute('autoplay','');
      v.playsInline = true;
      v.autoplay = true;
      var p = v.play();
      if (p && p.catch) p.catch(function(){
        // Retry once after a tick (helps iOS after metadata loads)
        setTimeout(function(){ try { v.play().catch(function(){}); } catch(e){} }, 300);
      });
    } catch(e){}
  }
  function playAll(){
    document.querySelectorAll('video').forEach(function(v){
      if (v.readyState < 2) {
        v.addEventListener('loadedmetadata', function(){ kick(v); }, { once: true });
        v.addEventListener('canplay', function(){ kick(v); }, { once: true });
        try { v.load(); } catch(e){}
      }
      kick(v);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playAll);
  } else {
    playAll();
  }
  window.addEventListener('load', playAll);
  ['touchstart','touchend','click','scroll','pointerdown'].forEach(function(ev){
    window.addEventListener(ev, playAll, { once: true, passive: true });
  });
  // When tab becomes visible again, retry
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) playAll();
  });
})();
