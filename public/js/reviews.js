/* Villa Azure: cycling review toasts (bottom-left, unobtrusive). Real guest reviews. */
(function () {
  if (window.innerWidth < 700) return; // keep mobile clean
  try { if (sessionStorage.getItem('vz_rev_off')) return; } catch (e) {}

  var ES = (document.documentElement.lang || 'en').indexOf('es') === 0;
  var SRC = ES ? { airbnb: 'Huésped de Airbnb', guest: 'Reseña de huésped', google: 'Reseña de Google' }
               : { airbnb: 'Airbnb guest', guest: 'Guest review', google: 'Google review' };
  var MORE = ES ? 'Ver más' : 'View more';

  // [text, date, source]
  var REVIEWS = [
    ['We had a wonderful stay and would absolutely recommend this to anyone visiting Puerto Rico! The home was exactly as described: clean, comfortable, and thoughtfully equipped with everything we needed. The location was excellent, making it easy to explore the island while also providing a great place to come back and unwind each day.', 'Jul 2026', 'airbnb'],
    ['Thank you so much for an incredible peaceful stay. Great spot, great host and great vibes. Will definitely stay again!', 'Jul 2026', 'airbnb'],
    ['Amazing location: beautiful, super clean, very spacious, with the ocean right in front of it. Amazing communication from the host. Would book with no hesitation.', 'Jul 2026', 'airbnb'],
    ['Amazing place to relax and rejuvenate. Right by the beach for easy access. One of the nicest houses in PR. 10/10', 'Jun 2026', 'airbnb'],
    ['It was so nice to have immediate access to a pool and the beach, especially with kids. Plenty of towels were provided, everything was clean, and even with a group of 12 we never ran out of hot water. We came to PR for two weeks and booked three places. I wish I would have booked this one for the entire time!', 'Jun 2026', 'airbnb'],
    ['What a beautiful place. Every room is well thought out. All I brought was my toothbrush. Fabulous.', 'May 2026', 'airbnb'],
    ['This is the kind of place that makes people start planning the NEXT vacation before the current one even ends. It exceeded every expectation imaginable for our family of 13. Gorgeous, luxurious, spacious, securely gated, and somehow even more impressive in person than online. Every bedroom felt like a high-end hotel suite with en-suite bathrooms, yet it still felt warm and perfect for meaningful family time.', 'May 2026', 'airbnb'],
    ['Our small group had the pleasure of a stay while planning a corporate retreat, and it left us wanting so much more. Every room is beautifully furnished and thoughtfully designed, and we especially appreciated that all are en suite. We were so impressed that we booked the sister property as well. The location is unbeatable: just 10 minutes from the airport, yet nestled in the heart of the city.', 'May 2026', 'airbnb'],
    ['Was perfect for our company offsite.', 'Mar 2026', 'airbnb'],
    ['Awesome stay right next to the ocean!', 'Jul 2026', 'airbnb'],
    ['I loved the location of the villa and the ocean views. The pool was so refreshing.', '2026', 'guest'],
    ['This place was perfect for our large group of 14. Everyone had their own space but the common areas were large and a great place to gather.', '2026', 'guest'],
    ['The pool and bar area are one of a kind. Excellent house for large groups in San Juan. Supermarket walking distance, beach very close by, short Uber drives to all the best places in San Juan.', '2024', 'google'],
    ['Clean, well stocked, roomy, convenient.', 'Mar 2026', 'google'],
    ['The concierge service elevated this trip into something truly magical: ATVs through El Yunque, an incredible private catamaran charter complete with jet skis, and a bioluminescent kayaking tour our family will never forget. The absolute highlight was the private in-home chef dinner, an incredible locally sourced 7-course dinner directly at the villa. It genuinely felt like a five-star fine dining experience inside our own private resort.', '2026', 'google'],
    ['We absolutely loved our stay here! The space is beautiful, thoughtfully designed, and filled with so many special touches that make it feel both luxurious and welcoming. The location is perfect, with the beach just steps away and stunning views right outside the window. We enjoyed every moment here and are even more excited to be having our wedding here next year.', '2026', 'google'],
    ['I just got back from an incredible stay and I\'m already trying to figure out when we can return. The villa is genuinely spacious, with room for everyone to spread out and still have plenty of common space to gather. The design is thoughtful throughout, luxurious without being uncomfortable. It strikes that rare balance where everything is elegant but you still feel completely at home. The location could not have been better: an easy trip from the airport, set in a private gated spot, and yet you can walk to the beach (it\'s right there), restaurants, and shops in minutes. Our hosts were exceptional; their attentiveness honestly surpassed what we\'ve experienced at five-star hotels, always one step ahead of what we needed. One of the standout moments was a seven-course private dinner prepared in the villa by Chef Milton. He exceeded every expectation we had of an in-home chef. If you\'re considering a stay, don\'t hesitate. We can\'t wait to come back.', '2026', 'google']
  ];

  var css = '.vz-rev{position:fixed;left:22px;bottom:22px;z-index:55;width:300px;background:rgba(42,37,31,.94);color:#EDE6DA;border-radius:12px;padding:14px 34px 13px 16px;font-family:Jost,-apple-system,Helvetica,Arial,sans-serif;box-shadow:0 10px 34px rgba(0,0,0,.3);opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease;pointer-events:none;}' +
    '.vz-rev.show{opacity:1;transform:none;pointer-events:auto;}' +
    '.vz-rev .stars{color:#D9A85C;font-size:12px;letter-spacing:.18em;margin-bottom:6px;}' +
    '.vz-rev p{font-size:13px;line-height:1.5;margin:0 0 7px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}' +
    '.vz-rev p.full{display:block;-webkit-line-clamp:unset;max-height:220px;overflow-y:auto;}' +
    '.vz-rev .who{font-family:"Saira Condensed",Arial,sans-serif;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(237,230,218,.6);}' +
    '.vz-rev .more{background:none;border:none;color:#D9A85C;font-size:12px;padding:0;margin:0 0 7px;cursor:pointer;font-family:inherit;text-decoration:underline;display:none;}' +
    '.vz-rev .x{position:absolute;top:8px;right:10px;background:none;border:none;color:rgba(237,230,218,.55);font-size:15px;cursor:pointer;padding:2px;line-height:1;}' +
    '.vz-rev .x:hover{color:#fff;}' +
    '@media(max-width:700px){.vz-rev{display:none;}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'vz-rev';
  box.innerHTML = '<button class="x" aria-label="Dismiss">&times;</button><div class="stars">★★★★★</div><p></p><button class="more">' + MORE + '</button><div class="who"></div>';
  document.body.appendChild(box);

  var p = box.querySelector('p');
  var moreBtn = box.querySelector('.more');
  var timer = null;
  var hovering = false;
  var expanded = false;

  box.querySelector('.x').onclick = function () {
    hide();
    clearTimeout(timer);
    try { sessionStorage.setItem('vz_rev_off', '1'); } catch (e) {}
  };
  box.onmouseenter = function () { hovering = true; };
  box.onmouseleave = function () { hovering = false; };

  moreBtn.onclick = function () {
    p.classList.add('full');
    moreBtn.style.display = 'none';
    expanded = true;
    clearTimeout(timer);
    timer = setTimeout(waitHide, 14000); // extra reading time when expanded
  };

  var i = Math.floor(Math.random() * REVIEWS.length);

  function show() {
    var r = REVIEWS[i % REVIEWS.length];
    i++;
    expanded = false;
    p.classList.remove('full');
    p.textContent = '“' + r[0] + '”';
    box.querySelector('.who').textContent = SRC[r[2]] + ' · ' + r[1];
    box.classList.add('show');
    // reveal "view more" only when the text is actually clipped
    requestAnimationFrame(function () {
      moreBtn.style.display = (p.scrollHeight > p.clientHeight + 2) ? 'inline' : 'none';
    });
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
