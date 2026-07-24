/* Villa Azure Concierge — preset-question chat widget (no external services) */
(function () {
  var ES = (document.documentElement.lang || 'en').indexOf('es') === 0;
  var waLink = (document.querySelector('.wa') || {}).href || 'https://wa.me/17875647405';
  var BOOK = ES ? 'https://villaazurevillaparadiso.guestybookings.com/es' : 'https://villaazurevillaparadiso.guestybookings.com/en';
  var P = ES ? '/es/' : '/';

  var FAQ = ES ? [
    { id: 'location', q: '¿Dónde está el hotel?', k: ['donde', 'ubicacion', 'direccion', 'llegar', 'queda'],
      a: 'Estamos en 1 Calle Guerrero Noble, Ocean Park, San Juan, 00913, a pasos de la playa de Ocean Park y a minutos de Condado y el Viejo San Juan.', link: [P + 'contact', 'Cómo llegar'] },
    { id: 'book', q: '¿Cómo reservo?', k: ['reservar', 'reserva', 'precio', 'tarifa', 'disponibilidad', 'costo'],
      a: 'Reserva directo en nuestro motor de reservas, sin cargos de OTA. Si prefieres, escríbenos por WhatsApp y te ayudamos personalmente.', link: [BOOK, 'Reservar ahora'] },
    { id: 'capacity', q: '¿Cuántos huéspedes caben?', k: ['huespedes', 'personas', 'capacidad', 'suites', 'habitaciones', 'grupo'],
      a: 'El hotel tiene 16 suites con baño privado, muchas con vista al mar, y aloja hasta 38 huéspedes. Puedes reservar una suite, varias, o el hotel completo.', link: [P + 'rooms', 'Ver las suites'] },
    { id: 'chef', q: '¿Tienen chef y concierge?', k: ['chef', 'comida', 'cocinero', 'concierge', 'cena', 'desayuno'],
      a: 'Sí. Nuestro chef privado prepara desde desayunos junto a la piscina hasta cenas frente al mar, y el concierge organiza tours, charters y traslados. Ambos servicios se cotizan por separado.', link: [P + 'amenities', 'Ver amenidades'] },
    { id: 'weddings', q: '¿Puedo celebrar una boda o evento?', k: ['boda', 'evento', 'celebrar', 'matrimonio', 'corporativo', 'retiro'],
      a: 'Claro. Con renta completa del hotel tienes los jardines frente al mar, el pabellón de cristal y las 16 suites para hasta 38 invitados que se hospedan.', link: [P + 'weddings', 'Explorar bodas'] },
    { id: 'amenities', q: '¿Qué amenidades tienen?', k: ['amenidades', 'piscina', 'playa', 'wifi', 'estacionamiento', 'parking'],
      a: 'Dos piscinas privadas, acceso directo a la playa, terraza BBQ, cocinas equipadas, WiFi gratis y estacionamiento gratis en la propiedad.', link: [P + 'amenities', 'Ver todo'] },
    { id: 'spa', q: '¿Hay spa o masajes?', k: ['spa', 'masaje', 'yoga', 'facial', 'bienestar'],
      a: 'No hay spa físico: lo llevamos a ti. Terapeutas licenciados dan masajes y tratamientos en tu suite o el jardín, y organizamos yoga privado en la playa. Se coordinan con el concierge y se cotizan por servicio.', link: [P + 'experiences', 'Ver experiencias'] },
    { id: 'kite', q: '¿Se puede hacer kitesurf?', k: ['kite', 'kitesurf', 'surf', 'viento', 'deportes'],
      a: 'Ocean Park es uno de los lugares más reconocidos de Puerto Rico para el kitesurf, y estamos sobre esa misma playa. El concierge te conecta con escuelas locales para clases y alquileres.', link: [P + 'kitesurfing', 'Más del kitesurf'] },
    { id: 'pets', q: '¿Aceptan mascotas?', k: ['mascota', 'perro', 'gato', 'pet'],
      a: 'No, el hotel no acepta mascotas.' },
    { id: 'checkin', q: '¿Horarios de check-in?', k: ['check', 'entrada', 'salida', 'hora', 'llegada'],
      a: 'Los detalles de llegada se coordinan personalmente con cada reserva. Escríbenos por WhatsApp y lo cuadramos contigo.' }
  ] : [
    { id: 'location', q: 'Where is the hotel located?', k: ['where', 'location', 'address', 'located', 'directions', 'far'],
      a: 'We’re at 1 Calle Guerrero Noble, Ocean Park, San Juan, 00913 — steps from Ocean Park Beach and minutes from Condado and Old San Juan.', link: [P + 'contact', 'Get in touch'] },
    { id: 'book', q: 'How do I book?', k: ['book', 'booking', 'reserve', 'price', 'rate', 'availability', 'cost'],
      a: 'Book direct through our booking engine with no OTA fees. Prefer a human? Message us on WhatsApp and we’ll help personally.', link: [BOOK, 'Book now'] },
    { id: 'capacity', q: 'How many guests can stay?', k: ['guests', 'people', 'capacity', 'suites', 'rooms', 'group', 'sleep'],
      a: 'The hotel has 16 en-suite designer suites, many with ocean views, sleeping up to 38 guests. Reserve one suite, several, or the entire hotel.', link: [P + 'rooms', 'See the suites'] },
    { id: 'chef', q: 'Do you have a chef and concierge?', k: ['chef', 'food', 'dinner', 'breakfast', 'concierge', 'cook', 'meals'],
      a: 'Yes. Our in-house private chef cooks everything from poolside breakfasts to oceanfront dinners, and the concierge arranges tours, charters and transfers. Both are priced separately.', link: [P + 'amenities', 'See amenities'] },
    { id: 'weddings', q: 'Can we host a wedding or event?', k: ['wedding', 'event', 'marry', 'celebration', 'corporate', 'retreat', 'party'],
      a: 'Absolutely. A full-hotel buyout gives you the oceanfront gardens, the glass pavilion and all 16 suites for up to 38 overnight guests.', link: [P + 'weddings', 'Explore weddings'] },
    { id: 'amenities', q: 'What amenities do you have?', k: ['amenities', 'pool', 'beach', 'wifi', 'parking', 'kitchen'],
      a: 'Two private pools, direct beach access, a BBQ terrace, chef’s kitchens, free WiFi and free on-site parking.', link: [P + 'amenities', 'See everything'] },
    { id: 'spa', q: 'Is there a spa or massage?', k: ['spa', 'massage', 'yoga', 'facial', 'wellness', 'treatment'],
      a: 'No spa walls here — we bring it to you. Licensed therapists do massages and treatments in your suite or garden, and we arrange private beach yoga. Booked via the concierge, priced per service.', link: [P + 'experiences', 'See experiences'] },
    { id: 'kite', q: 'Can I go kitesurfing?', k: ['kite', 'kitesurf', 'surf', 'wind', 'watersports', 'lessons'],
      a: 'Ocean Park is one of Puerto Rico’s best-known kite beaches, and the hotel sits right on it. Our concierge connects you with local schools for lessons and rentals.', link: [P + 'kitesurfing', 'More on kitesurfing'] },
    { id: 'pets', q: 'Are pets allowed?', k: ['pet', 'dog', 'cat', 'animal'],
      a: 'No, the hotel is not pet-friendly.' },
    { id: 'checkin', q: 'Check-in and check-out times?', k: ['check', 'checkin', 'checkout', 'arrival', 'time', 'early', 'late'],
      a: 'Arrival details are coordinated personally with every reservation. Message us on WhatsApp and we’ll sort it with you.' }
  ];

  var T = ES ? {
    title: 'Concierge Villa Azure', sub: 'Respuestas al instante',
    hi: '¡Hola! Soy el concierge digital de Villa Azure. Elige una pregunta, o escribe la tuya:',
    more: '¿Algo más?', typed_ph: 'Escribe tu pregunta…',
    nomatch: 'Buena pregunta — no tengo esa respuesta a la mano, pero nuestro equipo sí. Tocá abajo y te contestamos por WhatsApp.',
    wa: 'Continuar en WhatsApp', open: 'Preguntas', close: 'Cerrar chat'
  } : {
    title: 'Villa Azure Concierge', sub: 'Instant answers',
    hi: 'Hi! I’m the Villa Azure digital concierge. Tap a question, or type your own:',
    more: 'Anything else?', typed_ph: 'Type your question…',
    nomatch: 'Great question — I don’t have that answer on hand, but our team does. Tap below and we’ll reply on WhatsApp.',
    wa: 'Continue on WhatsApp', open: 'Questions', close: 'Close chat'
  };

  function log(ev, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      var d = { event: ev, chat_lang: ES ? 'es' : 'en', page: location.pathname };
      for (var k in params) d[k] = params[k];
      window.dataLayer.push(d);
    } catch (e) {}
  }

  var css = '.vz-launch{position:fixed;right:24px;bottom:96px;z-index:70;display:flex;align-items:center;gap:10px;background:#2A251F;color:#EDE6DA;border:none;border-radius:40px;padding:13px 22px;font-family:"Saira Condensed",Arial,sans-serif;font-size:13px;letter-spacing:.22em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.28);transition:transform .25s;}' +
    '.vz-launch:hover{transform:translateY(-2px);}' +
    '.vz-panel{position:fixed;right:24px;bottom:96px;z-index:71;width:min(390px,calc(100vw - 32px));max-height:min(600px,calc(100vh - 120px));display:none;flex-direction:column;background:#F4EEE4;border-radius:14px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.35);font-family:Jost,-apple-system,Helvetica,Arial,sans-serif;}' +
    '.vz-panel.open{display:flex;}' +
    '.vz-head{background:#2A251F;color:#EDE6DA;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;}' +
    '.vz-head h4{font-family:Marcellus,Georgia,serif;font-weight:400;font-size:17px;margin:0;}' +
    '.vz-head span{display:block;font-size:11.5px;opacity:.65;margin-top:2px;}' +
    '.vz-x{background:none;border:none;color:#EDE6DA;font-size:20px;cursor:pointer;line-height:1;padding:4px;}' +
    '.vz-body{padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;}' +
    '.vz-msg{background:#fff;border-radius:12px 12px 12px 3px;padding:12px 15px;font-size:14.5px;line-height:1.55;color:#23201B;max-width:92%;box-shadow:0 1px 4px rgba(0,0,0,.06);}' +
    '.vz-msg a{color:#A9744F;text-decoration:underline;}' +
    '.vz-user{background:#A9744F;color:#fff;border-radius:12px 12px 3px 12px;align-self:flex-end;padding:10px 14px;font-size:14.5px;max-width:85%;}' +
    '.vz-chips{display:flex;flex-wrap:wrap;gap:7px;}' +
    '.vz-chip{background:transparent;border:1px solid #A9744F;color:#7a5335;border-radius:30px;padding:7px 13px;font-size:13px;font-family:inherit;cursor:pointer;transition:.2s;}' +
    '.vz-chip:hover{background:#A9744F;color:#fff;}' +
    '.vz-in{display:flex;border-top:1px solid #DBD1C0;background:#fff;}' +
    '.vz-in input{flex:1;border:none;padding:14px 16px;font-size:14.5px;font-family:inherit;background:transparent;outline:none;color:#23201B;}' +
    '.vz-in button{background:none;border:none;color:#A9744F;font-size:18px;padding:0 18px;cursor:pointer;}' +
    '.vz-wa{display:inline-block;background:#25D366;color:#fff;border-radius:30px;padding:9px 17px;font-size:13.5px;text-decoration:none;margin-top:8px;}' +
    '@media(max-width:600px){.vz-launch{right:16px;bottom:88px;padding:12px 18px;}.vz-panel{right:16px;bottom:88px;}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var launch = document.createElement('button');
  launch.className = 'vz-launch';
  launch.innerHTML = '&#128172;&nbsp; ' + T.open;
  launch.setAttribute('aria-label', T.title);

  var panel = document.createElement('div');
  panel.className = 'vz-panel';
  panel.innerHTML =
    '<div class="vz-head"><div><h4>' + T.title + '</h4><span>' + T.sub + '</span></div>' +
    '<button class="vz-x" aria-label="' + T.close + '">&times;</button></div>' +
    '<div class="vz-body"></div>' +
    '<form class="vz-in"><input type="text" placeholder="' + T.typed_ph + '" aria-label="' + T.typed_ph + '"><button type="submit" aria-label="Send">&#10148;</button></form>';

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var body = panel.querySelector('.vz-body');
  var input = panel.querySelector('input');

  function el(cls, html) {
    var d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  function chips(items, label) {
    var wrap = el('vz-chips', '');
    items.forEach(function (f) {
      var b = document.createElement('button');
      b.className = 'vz-chip';
      b.type = 'button';
      b.textContent = f.q;
      b.onclick = function () { ask(f, 'click'); };
      wrap.appendChild(b);
    });
    return wrap;
  }

  function answer(f) {
    var html = f.a;
    if (f.link) html += ' <a href="' + f.link[0] + '"' + (f.link[0].indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + f.link[1] + '</a>';
    el('vz-msg', html);
  }

  function followups(except) {
    el('vz-msg', T.more);
    chips(FAQ.filter(function (f) { return f.id !== except; }).slice(0, 4));
  }

  function ask(f, how) {
    el('vz-user', f.q);
    log('chat_question', { chat_question: f.id, chat_method: how });
    setTimeout(function () { answer(f); followups(f.id); }, 250);
  }

  function match(text) {
    var t = text.toLowerCase();
    var best = null, score = 0;
    FAQ.forEach(function (f) {
      var s = 0;
      f.k.forEach(function (k) { if (t.indexOf(k) !== -1) s += 2; });
      f.q.toLowerCase().split(/\W+/).forEach(function (w) { if (w.length > 3 && t.indexOf(w) !== -1) s += 1; });
      if (s > score) { score = s; best = f; }
    });
    return score >= 2 ? best : null;
  }

  panel.querySelector('.vz-in').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    el('vz-user', text);
    var f = match(text);
    if (f) {
      log('chat_typed_matched', { chat_text: text.slice(0, 120), chat_question: f.id });
      setTimeout(function () { answer(f); followups(f.id); }, 250);
    } else {
      log('chat_typed_unmatched', { chat_text: text.slice(0, 120) });
      setTimeout(function () {
        el('vz-msg', T.nomatch + '<br><a class="vz-wa" href="' + waLink + '?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">' + T.wa + '</a>');
      }, 250);
    }
  });

  var started = false;
  function open() {
    panel.classList.add('open');
    launch.style.display = 'none';
    log('chat_opened', {});
    if (!started) {
      started = true;
      el('vz-msg', T.hi);
      chips(FAQ.slice(0, 6));
    }
  }
  function close() {
    panel.classList.remove('open');
    launch.style.display = 'flex';
  }
  launch.onclick = open;
  panel.querySelector('.vz-x').onclick = close;
  if (location.hash === '#chat') open();
})();
