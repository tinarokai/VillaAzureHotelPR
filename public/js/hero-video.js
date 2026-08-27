/* Page-hero ambient loops.
   The poster paints immediately; the clip is only fetched once the page has
   finished loading, so it never competes with content for bandwidth. If the
   fetch fails, or the visitor prefers reduced motion, the poster simply stays. */
(function () {
  var vids = document.querySelectorAll('video.ph-video[data-src]');
  if (!vids.length) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function start() {
    Array.prototype.forEach.call(vids, function (v) {
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.src = v.dataset.src;
      v.load();
      var play = function () { var p = v.play(); if (p) p.catch(function () {}); };
      v.addEventListener('canplay', play, { once: true });
      play();
    });
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();

/* Below-the-fold bands. Same poster-first contract, but these only fetch when
   they scroll near the viewport, since nobody should pay for a video they
   never reach. */
(function () {
  var vids = document.querySelectorAll('video.lazy-video[data-src]');
  if (!vids.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var v = e.target; io.unobserve(v);
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.src = v.dataset.src; v.load();
      var play = function () { var p = v.play(); if (p) p.catch(function () {}); };
      v.addEventListener('canplay', play, { once: true });
      play();
    });
  }, { rootMargin: '200px 0px' });
  Array.prototype.forEach.call(vids, function (v) { io.observe(v); });
})();
