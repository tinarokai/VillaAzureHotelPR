/* Villa Azure Concierge: preset-question chat widget (no external services) */
(function () {
  var API = 'https://villa-azure-concierge.tina-bd5.workers.dev';
  var SID = '';
  try {
    SID = localStorage.getItem('vz_sid') || '';
    if (!SID) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        SID = window.crypto.randomUUID();
      } else if (window.crypto && window.crypto.getRandomValues) {
        var buf = new Uint8Array(32);
        window.crypto.getRandomValues(buf);
        SID = '';
        for (var bi = 0; bi < buf.length; bi++) {
          SID += ('0' + buf[bi].toString(16)).slice(-2);
        }
      } else {
        // Last-resort fallback; browsers without crypto are effectively extinct.
        SID = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
      localStorage.setItem('vz_sid', SID);
    }
  } catch (e) {}
  var ES = (document.documentElement.lang || 'en').indexOf('es') === 0;
  var waLink = (document.querySelector('.wa') || {}).href || 'https://wa.me/19549001988';
  var BOOK = ES ? 'https://villaazurehotel.guestybookings.com/es' : 'https://villaazurehotel.guestybookings.com/en';
  var P = ES ? '/es/' : '/';

  var FAQ = ES ? [
    { id: 'location', q: '¿Dónde está el hotel?', k: ['donde', 'ubicacion', 'direccion', 'llegar', 'queda'],
      a: 'Estamos en 5 Calle Guerrero Noble, Ocean Park, San Juan, 00913, a pasos de la playa de Ocean Park y a minutos de Condado y el Viejo San Juan.', link: [P + 'contact', 'Cómo llegar'] },
    { id: 'book', q: '¿Cómo reservo?', k: ['reservar', 'reserva', 'precio', 'tarifa', 'disponibilidad', 'costo'],
      a: 'Reserva directo en nuestro motor de reservas, sin cargos de OTA. Si prefieres, escríbenos por WhatsApp y te ayudamos personalmente.', link: [BOOK, 'Reservar ahora'] },
    { id: 'capacity', q: '¿Cuántos huéspedes caben?', k: ['huespedes', 'personas', 'capacidad', 'suites', 'habitaciones', 'grupo'],
      a: 'El hotel tiene 16 suites con baño privado, muchas con vista al mar, y aloja hasta 36 huéspedes. Puedes reservar una suite, varias, o el hotel completo.', link: [P + 'rooms', 'Ver las suites'] },
    { id: 'chef', q: '¿Tienen chef y concierge?', k: ['chef', 'comida', 'cocinero', 'concierge', 'cena', 'desayuno'],
      a: 'Sí. Nuestro chef privado prepara desde desayunos junto a la piscina hasta cenas frente al mar, típicamente $85–$150 por persona más los víveres según el menú. El concierge organiza tours, charters y traslados.', link: [P + 'amenities', 'Ver amenidades'] },
    { id: 'weddings', q: '¿Puedo celebrar una boda o evento?', k: ['boda', 'evento', 'celebrar', 'matrimonio', 'corporativo', 'retiro'],
      a: 'Claro. Con el buyout de Villa Azure tienes los jardines y terrazas frente al mar y las 16 suites para hasta 36 invitados que se hospedan.', link: [P + 'weddings', 'Explorar bodas'] },
    { id: 'amenities', q: '¿Qué amenidades tienen?', k: ['amenidades', 'piscina', 'playa', 'wifi', 'estacionamiento', 'parking'],
      a: 'Dos piscinas privadas, acceso directo a la playa, terraza BBQ, cocinas equipadas, WiFi gratis y estacionamiento gratis en la propiedad.', link: [P + 'amenities', 'Ver todo'] },
    { id: 'spa', q: '¿Hay spa o masajes?', k: ['spa', 'masaje', 'yoga', 'facial', 'bienestar'],
      a: 'No hay spa físico: lo llevamos a ti. Terapeutas licenciados dan masajes y tratamientos en tu suite o el jardín, y organizamos yoga privado en la playa. Se coordinan con el concierge y se cotizan por servicio.', link: [P + 'experiences', 'Ver experiencias'] },
    { id: 'kite', q: '¿Se puede hacer kitesurf?', k: ['kite', 'kitesurf', 'surf', 'viento', 'deportes'],
      a: 'Ocean Park es uno de los lugares más reconocidos de Puerto Rico para el kitesurf, y estamos sobre esa misma playa. El concierge te conecta con escuelas locales para clases y alquileres.', link: [P + 'kitesurfing', 'Más del kitesurf'] },
    { id: 'beach', q: '¿El hotel está frente a la playa?', k: ['playa', 'frente', 'arena', 'mar', 'acceso'],
      a: 'Sí. El hotel es beachfront en Ocean Park, con acceso directo a la playa y dos piscinas, a pasos de la arena.', link: [P + 'amenities', 'Ver amenidades'] },
    { id: 'views', q: '¿Las suites tienen vista al mar?', k: ['vista', 'vistas', 'balcon', 'ocean view'],
      a: 'Muchas de las dieciséis suites tienen vista al mar o a la piscina, incluyendo la Suite Queen Vista al Mar y la Gran Suite Vista al Mar, el alojamiento insignia del hotel.', link: [P + 'rooms', 'Ver las suites'] },
    { id: 'nearby', q: '¿Qué hay para hacer cerca?', k: ['cerca', 'hacer', 'atracciones', 'visitar', 'turismo', 'viejo san juan', 'condado'],
      a: 'La playa de Ocean Park está al frente; el Viejo San Juan (reconocido por la UNESCO), la Laguna del Condado para kayak, el Museo de Arte de Puerto Rico y el Distrito T-Mobile con restaurantes y música en vivo quedan a minutos.', link: [P + 'amenities#destinations', 'Destinos cercanos'] },
    { id: 'airport', q: '¿Qué tan lejos está el aeropuerto?', k: ['aeropuerto', 'sju', 'traslado', 'transporte', 'taxi', 'llegar'],
      a: 'El aeropuerto internacional Luis Muñoz Marín (SJU) está a solo unos 10 minutos en auto. Uber funciona bien para grupos pequeños, y podemos coordinar choferes privados para grupos grandes o llegadas nocturnas.' },
    { id: 'dining', q: '¿El desayuno o las comidas están incluidas?', k: ['desayuno', 'comida', 'incluido', 'restaurante', 'cena', 'almuerzo'],
      a: 'Las comidas no están incluidas por defecto. Nuestro chef privado prepara desde desayunos hasta cenas de varios tiempos, a solicitud y con precio por servicio, y las suites cuentan con cocinas equipadas si prefieres cocinar.', link: [P + 'amenities', 'Ver amenidades'] },
    { id: 'corporate', q: '¿Reciben retiros corporativos?', k: ['corporativo', 'empresa', 'retiro', 'offsite', 'reunion', 'equipo'],
      a: 'Sí. Con el buyout de Villa Azure tu equipo tiene espacios de reunión frente al mar, dieciséis suites para hasta 36 personas, chef privado y actividades de playa a pasos.', link: [P + 'corporate', 'Ver corporativo'] },
    { id: 'family', q: '¿Es bueno para familias y grupos?', k: ['familia', 'ninos', 'grupo', 'amigos', 'conectadas'],
      a: 'Sí. Hay habitaciones con dos camas King perfectas para familias, habitaciones conectadas, dos piscinas y jardines, y el hotel completo aloja hasta 36 huéspedes.', link: [P + 'rooms', 'Ver las suites'] },
    { id: 'minstay', q: '\u00bfHay estad\u00eda m\u00ednima?', k: ['minimo', 'minima', 'noches', 'una noche', 'fin de semana'],
      a: 'Las estad\u00edas suelen tener un m\u00ednimo de 5 noches. Para estad\u00edas m\u00e1s cortas o fechas espec\u00edficas, escr\u00edbenos por WhatsApp y vemos qu\u00e9 es posible.' },
    { id: 'poolheat', q: '\u00bfLa piscina es climatizada?', k: ['climatizada', 'caliente', 'temperatura', 'fria'],
      a: 'S\u00ed, la piscina es climatizada y se mantiene a unos agradables 86\u00b0F (30\u00b0C) todo el a\u00f1o.' },
    { id: 'ac', q: '\u00bfLas suites tienen aire acondicionado?', k: ['aire', 'acondicionado', 'ac', 'abanico', 'calor'],
      a: 'S\u00ed, cada suite tiene su propio aire acondicionado, y las \u00e1reas comunes cuentan con aire central.' },
    { id: 'smoking', q: '\u00bfSe permite fumar?', k: ['fumar', 'cigarro', 'cigarrillo', 'vape', 'tabaco'],
      a: 'Los interiores son estrictamente libres de humo. Se puede fumar al aire libre en los patios y \u00e1reas de piscina.' },
    { id: 'quiet', q: '\u00bfPodemos poner m\u00fasica? \u00bfHoras de silencio?', k: ['musica', 'silencio', 'ruido', 'bocinas', 'fiesta'],
      a: 'La m\u00fasica al aire libre es bienvenida durante el d\u00eda. Las horas de silencio comienzan a las 8 PM entre semana y a las 10 PM los fines de semana, seg\u00fan las normas de San Juan.' },
    { id: 'restaurants', q: '\u00bfD\u00f3nde comemos cerca?', k: ['restaurante', 'comer', 'comida', 'cena', 'cafe', 'brunch'],
      a: 'A poca distancia a pie: Kasalta (panader\u00eda cubana legendaria), El Hamburger, Pirilo Pizza y Acapulco Taquer\u00eda. Para ocasiones especiales: 1919, Marmalade o Santaella, y nuestro concierge te reserva mesa.' },
    { id: 'groceries', q: '\u00bfPueden surtir la cocina antes de llegar?', k: ['viveres', 'compra', 'supermercado', 'instacart', 'despensa'],
      a: 'S\u00ed. Env\u00edanos tu lista al menos 48 horas antes de llegar y dejamos la cocina surtida (costo de la compra m\u00e1s un cargo de servicio). Instacart tambi\u00e9n entrega en el hotel.' },
    { id: 'beachgear', q: '\u00bfProveen equipo de playa?', k: ['sillas', 'sombrilla', 'nevera', 'snorkel', 'toallas', 'equipo'],
      a: 'Sillas de playa, sombrillas y una nevera port\u00e1til est\u00e1n incluidas. La playa est\u00e1 a 30 segundos del port\u00f3n, y podemos conseguir equipo de snorkel y boogie boards a solicitud.' },
    { id: 'pets', q: '¿Aceptan mascotas?', k: ['mascota', 'perro', 'gato', 'pet'],
      a: 'Lo sentimos, por ahora no aceptamos mascotas. Estamos trabajando en una opción pet-friendly para el futuro.' },
    { id: 'checkin', q: '¿Horarios de check-in?', k: ['check', 'entrada', 'salida', 'hora', 'llegada'],
      a: 'El check-in es a las 4:00 PM y el check-out antes de las 10:00 AM. A veces es posible entrar antes o salir más tarde según la agenda, escríbenos y tratamos de acomodarte.' }
  ] : [
    { id: 'location', q: 'Where is the hotel located?', k: ['where', 'location', 'address', 'located', 'directions', 'far'],
      a: 'We’re at 5 Calle Guerrero Noble, Ocean Park, San Juan, 00913, steps from Ocean Park Beach and minutes from Condado and Old San Juan.', link: [P + 'contact', 'Get in touch'] },
    { id: 'book', q: 'How do I book?', k: ['book', 'booking', 'reserve', 'price', 'rate', 'availability', 'cost'],
      a: 'Book direct through our booking engine with no OTA fees. Prefer a human? Message us on WhatsApp and we’ll help personally.', link: [BOOK, 'Book now'] },
    { id: 'capacity', q: 'How many guests can stay?', k: ['guests', 'people', 'capacity', 'suites', 'rooms', 'group', 'sleep'],
      a: 'The hotel has 16 en-suite designer suites, many with ocean views, sleeping up to 36 guests. Reserve one suite, several, or the entire hotel.', link: [P + 'rooms', 'See the suites'] },
    { id: 'chef', q: 'Do you have a chef and concierge?', k: ['chef', 'food', 'dinner', 'breakfast', 'concierge', 'cook', 'meals'],
      a: 'Yes. Our private chef cooks everything from poolside breakfasts to oceanfront dinners, typically $85–$150 per person plus groceries depending on the menu. The concierge arranges tours, charters and transfers.', link: [P + 'amenities', 'See amenities'] },
    { id: 'weddings', q: 'Can we host a wedding or event?', k: ['wedding', 'event', 'marry', 'celebration', 'corporate', 'retreat', 'party'],
      a: 'Absolutely. A full-hotel buyout gives you the oceanfront gardens, the terraces and all 16 suites for up to 36 overnight guests.', link: [P + 'weddings', 'Explore weddings'] },
    { id: 'amenities', q: 'What amenities do you have?', k: ['amenities', 'pool', 'beach', 'wifi', 'parking', 'kitchen'],
      a: 'Two private pools, direct beach access, a BBQ terrace, chef’s kitchens, free WiFi and free on-site parking.', link: [P + 'amenities', 'See everything'] },
    { id: 'spa', q: 'Is there a spa or massage?', k: ['spa', 'massage', 'yoga', 'facial', 'wellness', 'treatment'],
      a: 'No spa walls here. We bring it to you. Licensed therapists do massages and treatments in your suite or garden, and we arrange private beach yoga. Booked via the concierge, priced per service.', link: [P + 'experiences', 'See experiences'] },
    { id: 'kite', q: 'Can I go kitesurfing?', k: ['kite', 'kitesurf', 'surf', 'wind', 'watersports', 'lessons'],
      a: 'Ocean Park is one of Puerto Rico’s best-known kite beaches, and the hotel sits right on it. Our concierge connects you with local schools for lessons and rentals.', link: [P + 'kitesurfing', 'More on kitesurfing'] },
    { id: 'beach', q: 'Is the hotel right on the beach?', k: ['beach', 'beachfront', 'sand', 'ocean', 'access'],
      a: 'Yes. The hotel is beachfront in Ocean Park with direct beach access and two pools, just steps from the sand.', link: [P + 'amenities', 'See amenities'] },
    { id: 'views', q: 'Do the suites have ocean views?', k: ['view', 'views', 'balcony', 'ocean view'],
      a: 'Many of the sixteen suites have ocean or pool views, including the Ocean View Queen Suite and the Grand Ocean View Suite, the hotel\u2019s signature accommodation.', link: [P + 'rooms', 'See the suites'] },
    { id: 'nearby', q: 'What is there to do nearby?', k: ['nearby', 'around', 'attractions', 'things to do', 'visit', 'old san juan', 'condado'],
      a: 'Ocean Park Beach is right out front; Old San Juan (UNESCO-recognized), the Condado Lagoon for kayaking, the Museo de Arte de Puerto Rico and the Distrito T-Mobile dining and nightlife district are all minutes away.', link: [P + 'amenities#destinations', 'Nearby destinations'] },
    { id: 'airport', q: 'How far is the airport?', k: ['airport', 'sju', 'transfer', 'transport', 'taxi', 'shuttle'],
      a: 'Luis Muñoz Marín International Airport (SJU) is only about 10 minutes away by car. Uber works well for small groups, and we can arrange private drivers for bigger parties or late arrivals.' },
    { id: 'dining', q: 'Is breakfast or dining included?', k: ['breakfast', 'included', 'meal', 'restaurant', 'lunch', 'dinner'],
      a: 'Meals aren\u2019t included by default. Our in-house private chef prepares everything from breakfast to multi-course dinners on request, priced per service, and the suites include equipped kitchens if you\u2019d rather cook.', link: [P + 'amenities', 'See amenities'] },
    { id: 'corporate', q: 'Do you host corporate retreats?', k: ['corporate', 'company', 'retreat', 'offsite', 'meeting', 'team'],
      a: 'Yes. A full-hotel buyout gives your team oceanfront meeting spaces, sixteen suites for up to 36 people, an in-house chef and beach activities steps away.', link: [P + 'corporate', 'See corporate'] },
    { id: 'family', q: 'Is it good for families and groups?', k: ['family', 'kids', 'children', 'group', 'friends', 'connecting'],
      a: 'Very. There are rooms with two King beds that are perfect for families, connecting rooms, two pools and gardens, and the whole hotel sleeps up to 36 guests.', link: [P + 'rooms', 'See the suites'] },
    { id: 'minstay', q: 'Is there a minimum stay?', k: ['minimum', 'min stay', 'nights', 'one night', 'weekend'],
      a: 'Stays are typically a 5-night minimum. For shorter stays or specific dates, message us on WhatsApp and we\u2019ll see what\u2019s possible.' },
    { id: 'poolheat', q: 'Is the pool heated?', k: ['heated', 'pool temperature', 'warm', 'cold'],
      a: 'Yes, the pool is heated and kept at a warm 86\u00b0F year-round.' },
    { id: 'ac', q: 'Do the suites have air conditioning?', k: ['air', 'conditioning', 'ac', 'a/c', 'fan', 'hot'],
      a: 'Yes, every suite has its own air conditioning, and the main living areas have central air as well.' },
    { id: 'smoking', q: 'Is smoking allowed?', k: ['smoking', 'smoke', 'cigar', 'cigarette', 'vape'],
      a: 'Interiors are strictly non-smoking. Smoking is welcome outdoors on the patios and pool areas.' },
    { id: 'quiet', q: 'Can we play music? Quiet hours?', k: ['music', 'quiet', 'noise', 'speakers', 'loud'],
      a: 'Outdoor music is welcome during the day. Quiet hours start at 8 PM on weekdays and 10 PM on weekends, per San Juan norms.' },
    { id: 'restaurants', q: 'Where should we eat nearby?', k: ['restaurant', 'eat', 'food', 'dinner spots', 'cafe', 'brunch'],
      a: 'Within walking distance: Kasalta (legendary Cuban bakery), El Hamburger, Pirilo Pizza and Acapulco Taquer\u00eda. For special occasions try 1919, Marmalade or Santaella, and our concierge can book you a table.' },
    { id: 'groceries', q: 'Can you stock groceries before we arrive?', k: ['groceries', 'grocery', 'stock', 'instacart', 'supermarket', 'shopping'],
      a: 'Yes. Send us your list at least 48 hours before arrival and we\u2019ll have the kitchen stocked (grocery cost plus a service fee). Instacart also delivers to the hotel.' },
    { id: 'beachgear', q: 'Do you provide beach equipment?', k: ['beach chairs', 'umbrella', 'cooler', 'snorkel', 'towels', 'gear', 'equipment'],
      a: 'Beach chairs, umbrellas and a cooler are included. The beach is a 30-second walk from the gate, and we can arrange snorkel gear and boogie boards on request.' },
    { id: 'pets', q: 'Are pets allowed?', k: ['pet', 'dog', 'cat', 'animal'],
      a: 'Sorry, no pets at this time. We’re working on a pet-friendly option for the future.' },
    { id: 'checkin', q: 'Check-in and check-out times?', k: ['check', 'checkin', 'checkout', 'arrival', 'time', 'early', 'late'],
      a: 'Check-in is at 4:00 PM and check-out is by 10:00 AM. Early check-in or late check-out is sometimes possible depending on the schedule, message us and we’ll try to make it work.' }
  ];

  var T = ES ? {
    title: 'Concierge Villa Azure', sub: 'Respuestas al instante',
    hi: '¡Hola! Soy el concierge digital de Villa Azure. Elige una pregunta, o escribe la tuya:',
    more: '¿Algo más?', typed_ph: 'Escribe tu pregunta…',
    nomatch: 'Buena pregunta. No tengo esa respuesta a la mano, pero nuestro equipo sí. Toca abajo para escribirnos por WhatsApp, y nuestra respuesta también aparecerá aquí en este chat.',
    wa: 'Continuar en WhatsApp', open: 'Preguntas', close: 'Cerrar chat',
    lead: 'O déjanos tu correo y te respondemos:', lead_ph: 'tucorreo@email.com', lead_btn: 'Enviar', lead_ok: 'Listo, te responderemos a {email} pronto.'
  } : {
    title: 'Villa Azure Concierge', sub: 'Instant answers',
    hi: 'Hi! I’m the Villa Azure digital concierge. Tap a question, or type your own:',
    more: 'Anything else?', typed_ph: 'Type your question…',
    nomatch: 'Great question. I don’t have that answer on hand, but our team does. Tap below to reach us on WhatsApp, and our reply will also appear right here in this chat.',
    wa: 'Continue on WhatsApp', open: 'Questions', close: 'Close chat',
    lead: 'Or leave your email and we’ll get back to you:', lead_ph: 'you@email.com', lead_btn: 'Send', lead_ok: 'Got it. We’ll reply to {email} soon.'
  };

  function log(ev, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      var d = { event: ev, chat_lang: ES ? 'es' : 'en', page: location.pathname };
      for (var k in params) d[k] = params[k];
      window.dataLayer.push(d);
    } catch (e) {}
    try {
      if (API.indexOf('WORKER_SUBDOMAIN') !== -1) return;
      var payload = JSON.stringify({
        event: ev,
        question: (params && params.chat_question) || '',
        text: (params && params.chat_text) || '',
        email: (params && params.chat_email) || '',
        lang: ES ? 'es' : 'en',
        page: location.pathname,
        sid: SID
      });
      fetch(API + '/log', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload, keepalive: true }).catch(function () {
        if (navigator.sendBeacon) navigator.sendBeacon(API + '/log', payload);
      });
    } catch (e) {}
  }

  // Remote config: the dashboard can rewrite questions/answers without a site deploy.
  if (API.indexOf('WORKER_SUBDOMAIN') === -1) {
    try {
      fetch(API + '/config').then(function (r) { return r.json(); }).then(function (cfg) {
        var list = cfg && cfg[ES ? 'es' : 'en'];
        if (list && list.length) FAQ = list;
      }).catch(function () {});
    } catch (e) {}
  }

  var css = '.vz-launch{position:fixed;right:24px;bottom:96px;z-index:70;overflow:visible;display:flex;align-items:center;gap:10px;background:#2A251F;color:#EDE6DA;border:none;border-radius:40px;padding:13px 22px;font-family:"Saira Condensed",Arial,sans-serif;font-size:13px;letter-spacing:.22em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.28);transition:transform .25s;}' +
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
    '.vz-leadin{margin-top:12px;font-size:13px;color:#7A6F5E;}' +
    '.vz-dot{position:absolute;top:-3px;right:-3px;width:13px;height:13px;border-radius:50%;background:#C0392B;border:2px solid #F4EEE4;}' +
    '.vz-reply{border-left:3px solid #A9744F;}' +
    '.vz-reply .who{font-family:"Saira Condensed",Arial,sans-serif;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#A9744F;margin-bottom:4px;}' +
    '.vz-lead{display:flex;gap:6px;margin-top:6px;}' +
    '.vz-lead input{flex:1;border:1px solid #DBD1C0;border-radius:8px;padding:7px 10px;font-size:13.5px;font-family:inherit;background:#FDFBF7;}' +
    '.vz-lead button{border:none;border-radius:8px;background:#A9744F;color:#fff;padding:7px 14px;font-size:13px;cursor:pointer;}' +
    '@media(max-width:600px){.vz-launch{right:16px;bottom:88px;padding:12px 18px;}.vz-panel{right:16px;bottom:88px;}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var launch = document.createElement('button');
  launch.className = 'vz-launch';
  launch.innerHTML = '&#128172;&nbsp; ' + T.open;
  launch.setAttribute('aria-label', T.open + ' – ' + T.title);

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

  // Safe variant: text-only content. Use for anything sourced from the remote
  // config/replies API so a compromised worker can't inject HTML/JS.
  function elText(cls, text) {
    var d = document.createElement('div');
    d.className = cls;
    d.textContent = text == null ? '' : String(text);
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  function appendSafeLink(parent, href, label) {
    if (!href) return;
    var url = String(href);
    // Only allow http(s) and same-origin relative paths, block javascript:, data:, etc.
    var safe = /^https?:\/\//i.test(url) || url.charAt(0) === '/' || url.charAt(0) === '#';
    if (!safe) return;
    parent.appendChild(document.createTextNode(' '));
    var a = document.createElement('a');
    a.href = url;
    a.textContent = label == null ? url : String(label);
    if (/^https?:\/\//i.test(url)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    parent.appendChild(a);
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
    var d = elText('vz-msg', f.a);
    if (f.link && f.link.length >= 2) appendSafeLink(d, f.link[0], f.link[1]);
  }

  function followups(except) {
    elText('vz-msg', T.more);
    chips(FAQ.filter(function (f) { return f.id !== except; }).slice(0, 4));
  }

  function ask(f, how) {
    elText('vz-user', f.q);
    log('chat_question', { chat_question: f.id, chat_text: f.q, chat_method: how });
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
    elText('vz-user', text);
    var f = match(text);
    if (f) {
      log('chat_typed_matched', { chat_text: text.slice(0, 120), chat_question: f.id });
      setTimeout(function () { answer(f); followups(f.id); }, 250);
    } else {
      log('chat_typed_unmatched', { chat_text: text.slice(0, 120) });
      setTimeout(function () {
        var m = el('vz-msg', T.nomatch + '<br><a class="vz-wa" href="' + waLink + '?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">' + T.wa + '</a>' +
          '<div class="vz-leadin">' + T.lead + '</div>' +
          '<form class="vz-lead"><input type="email" required placeholder="' + T.lead_ph + '"><button type="submit">' + T.lead_btn + '</button></form>');
        m.querySelector('.vz-lead').addEventListener('submit', function (e2) {
          e2.preventDefault();
          var em = e2.target.querySelector('input').value.trim();
          if (!em) return;
          log('chat_lead', { chat_text: text.slice(0, 120), chat_email: em });
          e2.target.previousElementSibling.style.display = 'none';
          e2.target.style.display = 'none';
          el('vz-msg', T.lead_ok.replace('{email}', em));
        });
      }, 250);
    }
  });

  var T_WHO = ES ? 'Equipo Villa Azure' : 'Villa Azure team';
  var renderedReplies = 0;
  var replies = [];
  function renderReplies() {
    if (!panel.classList.contains('open')) return;
    for (var i = renderedReplies; i < replies.length; i++) {
      var wrap = document.createElement('div');
      wrap.className = 'vz-msg vz-reply';
      var who = document.createElement('div');
      who.className = 'who';
      who.textContent = T_WHO;
      wrap.appendChild(who);
      var txt = document.createElement('div');
      txt.textContent = replies[i] && replies[i].text != null ? String(replies[i].text) : '';
      wrap.appendChild(txt);
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    }
    renderedReplies = replies.length;
    try { localStorage.setItem('vz_seen', String(replies.length)); } catch (e) {}
    var dot = launch.querySelector('.vz-dot');
    if (dot) dot.remove();
  }
  function checkReplies() {
    if (!SID) return;
    fetch(API + '/replies?sid=' + SID).then(function (r) { return r.json(); }).then(function (j) {
      replies = (j && j.replies) || [];
      var seen = 0;
      try { seen = parseInt(localStorage.getItem('vz_seen') || '0', 10); } catch (e) {}
      if (panel.classList.contains('open')) {
        if (!started && replies.length) { openIntro(); }
        renderReplies();
      } else if (replies.length > seen && !launch.querySelector('.vz-dot')) {
        var d = document.createElement('span');
        d.className = 'vz-dot';
        launch.appendChild(d);
      }
    }).catch(function () {});
  }
  checkReplies();
  setInterval(function () { if (document.visibilityState === 'visible') checkReplies(); }, 30000);

  var started = false;
  function openIntro() {
    if (started) return;
    started = true;
    el('vz-msg', T.hi);
    chips(FAQ.slice(0, 6));
  }
  function open() {
    panel.classList.add('open');
    launch.style.display = 'none';
    log('chat_opened', {});
    openIntro();
    renderReplies();
  }
  function close() {
    panel.classList.remove('open');
    launch.style.display = 'flex';
  }
  launch.onclick = open;
  panel.querySelector('.vz-x').onclick = close;
  if (location.hash === '#chat') open();
})();
