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
