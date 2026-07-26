/* Villa Azure — cycling review toasts (bottom-left, unobtrusive). Real Airbnb guest reviews. */
(function () {
  if (window.innerWidth < 700) return; // keep mobile clean
  try { if (sessionStorage.getItem('vz_rev_off')) return; } catch (e) {}

  var ES = (document.documentElement.lang || 'en').indexOf('es') === 0;
  var LBL = ES ? 'Huésped de Airbnb' : 'Airbnb guest';

  var REVIEWS = [
    ['We had a wonderful stay and would absolutely recommend this to anyone visiting Puerto Rico! Clean, comfortable, and thoughtfully equipped.', 'Jul 2026'],
    ['Thank you so much for an incredible peaceful stay. Great spot, great host and great vibes. Will definitely stay again!', 'Jul 2026'],
    ['Amazing location — beautiful, super clean, very spacious, with the ocean right in front of it.', 'Jul 2026'],
    ['Amazing place to relax and rejuvenate. Right by the beach for easy access. One of the nicest houses in PR. 10/10', 'Jun 2026'],
    ['So nice to have immediate access to a pool and the beach, especially with kids. Even with a group of 12, we never ran out of anything.', 'Jun 2026'],
    ['What a beautiful place — every room is well thought out. All I brought was my toothbrush. Fabulous.', 'May 2026'],
    ['The kind of place that makes people start planning the NEXT vacation before the current one even ends.', 'May 2026'],
    ['Was perfect for our company offsite.', 'Mar 2026'],
    ['Awesome stay right next to the ocean!', 'Jul 2026']
  ];

  var css = '.vz-rev{position:fixed;left:22px;bottom:22px;z-index:55;width:300px;background:rgba(42,37,31,.94);color:#EDE6DA;border-radius:12px;padding:14px 34px 13px 16px;font-family:Jost,-apple-system,Helvetica,Arial,sans-serif;box-shadow:0 10px 34px rgba(0,0,0,.3);opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease;pointer-events:none;}' +
    '.vz-rev.show{opacity:1;transform:none;pointer-events:auto;}' +
    '.vz-rev .stars{color:#D9A85C;font-size:12px;letter-spacing:.18em;margin-bottom:6px;}' +
    '.vz-rev p{font-size:13px;line-height:1.5;margin:0 0 7px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}' +
    '.vz-rev .who{font-family:"Saira Condensed",Arial,sans-serif;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(237,230,218,.6);}' +
    '.vz-rev .x{position:absolute;top:8px;right:10px;background:none;border:none;color:rgba(237,230,218,.55);font-size:15px;cursor:pointer;padding:2px;line-height:1;}' +
    '.vz-rev .x:hover{color:#fff;}' +
    '@media(max-width:700px){.vz-rev{display:none;}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'vz-rev';
  box.innerHTML = '<button class="x" aria-label="Dismiss">&times;</button><div class="stars">★★★★★</div><p></p><div class="who"></div>';
  document.body.appendChild(box);

  box.querySelector('.x').onclick = function () {
    hide();
    clearTimeout(timer);
    try { sessionStorage.setItem('vz_rev_off', '1'); } catch (e) {}
  };

  var i = Math.floor(Math.random() * REVIEWS.length);
  var timer = null;
  var hovering = false;
  box.onmouseenter = function () { hovering = true; };
  box.onmouseleave = function () { hovering = false; };

  function show() {
    var r = REVIEWS[i % REVIEWS.length];
    i++;
    box.querySelector('p').textContent = '“' + r[0] + '”';
    box.querySelector('.who').textContent = LBL + ' · ' + r[1];
    box.classList.add('show');
    timer = setTimeout(waitHide, 9000);
  }
  function waitHide() {
    if (hovering) { timer = setTimeout(waitHide, 1500); return; }
    hide();
    timer = setTimeout(show, 16000);
  }
  function hide() { box.classList.remove('show'); }

  timer = setTimeout(show, 7000);
})();
