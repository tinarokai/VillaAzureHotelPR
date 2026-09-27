/**
 * Villa Azure Concierge backend
 * - POST /log            : store a chat event (from the website widget)
 * - GET  /config         : current Q&A config consumed by the widget
 * - GET  /admin?key=...  : dashboard (questions log + flow editor)
 * - GET  /admin/api/logs?key=...    : recent events (JSON)
 * - GET  /admin/api/config?key=...  : config (JSON)
 * - PUT  /admin/api/config?key=...  : save config (JSON)
 *
 * KV layout:
 *   config                  -> {"en":[...],"es":[...]} (same shape the widget uses)
 *   log:<invTs>:<rand>      -> one event, inverted timestamp so KV list() returns newest first
 */

const FAR_FUTURE = 99999999999999;
const LOG_TTL = 60 * 60 * 24 * 90; // keep events 90 days

function cors(origin) {
  const ok = /^https:\/\/(www\.)?villaazurehotelpr\.com$/.test(origin) || /^https:\/\/review\.villa-azure-hotel\.pages\.dev$/.test(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://villaazurehotelpr.com',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

function authed(req, url, env) {
  const key = url.searchParams.get('key') || (req.headers.get('Authorization') || '').replace('Bearer ', '');
  return env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const C = cors(origin);

    if (req.method === 'OPTIONS') return new Response(null, { headers: C });

    if (url.pathname === '/log' && req.method === 'POST') {
      let body;
      try { body = await req.json(); } catch { return json({ ok: false }, 400, C); }
      const ev = {
        t: Date.now(),
        event: String(body.event || '').slice(0, 40),
        question: String(body.question || '').slice(0, 60),
        text: String(body.text || '').slice(0, 300),
        email: String(body.email || '').slice(0, 120),
        lang: body.lang === 'es' ? 'es' : 'en',
        page: String(body.page || '').slice(0, 120),
        sid: String(body.sid || '').slice(0, 48),
      };
      if (!ev.event) return json({ ok: false }, 400, C);
      const key = `log:${String(FAR_FUTURE - ev.t).padStart(14, '0')}:${Math.random().toString(36).slice(2, 8)}`;
      await env.CHAT.put(key, JSON.stringify(ev), { expirationTtl: LOG_TTL });
      return json({ ok: true }, 200, C);
    }

    if (url.pathname === '/replies' && req.method === 'GET') {
      const sid = (url.searchParams.get('sid') || '').slice(0, 48);
      if (!sid) return json({ replies: [] }, 200, C);
      const raw = await env.CHAT.get('replies:' + sid);
      return json({ replies: raw ? JSON.parse(raw) : [] }, 200, { ...C, 'Cache-Control': 'no-store' });
    }

    if (url.pathname === '/admin/api/reply' && req.method === 'POST') {
      if (!authed(req, url, env)) return json({ error: 'unauthorized' }, 401);
      let body;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const sid = String(body.sid || '').slice(0, 48);
      const text = String(body.text || '').slice(0, 1000);
      if (!sid || !text) return json({ error: 'sid and text required' }, 400);
      const raw = await env.CHAT.get('replies:' + sid);
      const list = raw ? JSON.parse(raw) : [];
      list.push({ t: Date.now(), text });
      await env.CHAT.put('replies:' + sid, JSON.stringify(list.slice(-20)), { expirationTtl: LOG_TTL });
      const ev = { t: Date.now(), event: 'admin_reply', question: '', text, email: '', lang: body.lang === 'es' ? 'es' : 'en', page: '(dashboard)', sid };
      const key = `log:${String(FAR_FUTURE - ev.t).padStart(14, '0')}:${Math.random().toString(36).slice(2, 8)}`;
      await env.CHAT.put(key, JSON.stringify(ev), { expirationTtl: LOG_TTL });
      return json({ ok: true });
    }

    if (url.pathname === '/config' && req.method === 'GET') {
      const cfg = await env.CHAT.get('config');
      return json(cfg ? JSON.parse(cfg) : {}, 200, { ...C, 'Cache-Control': 'public, max-age=300' });
    }

    if (url.pathname === '/admin/api/logs') {
      if (!authed(req, url, env)) return json({ error: 'unauthorized' }, 401);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '300', 10), 500);
      const list = await env.CHAT.list({ prefix: 'log:', limit });
      const events = await Promise.all(list.keys.map(async (k) => {
        const v = await env.CHAT.get(k.name);
        return v ? JSON.parse(v) : null;
      }));
      return json({ events: events.filter(Boolean) });
    }

    if (url.pathname === '/admin/api/config') {
      if (!authed(req, url, env)) return json({ error: 'unauthorized' }, 401);
      if (req.method === 'GET') {
        const cfg = await env.CHAT.get('config');
        return json(cfg ? JSON.parse(cfg) : {});
      }
      if (req.method === 'PUT') {
        let body;
        try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
        if (!body || !Array.isArray(body.en) || !Array.isArray(body.es)) return json({ error: 'config must have en[] and es[]' }, 400);
        for (const lang of ['en', 'es']) {
          for (const f of body[lang]) {
            if (!f.id || !f.q || !f.a) return json({ error: `every ${lang} entry needs id, q, a` }, 400);
            f.k = Array.isArray(f.k) ? f.k : [];
          }
        }
        await env.CHAT.put('config', JSON.stringify({ en: body.en, es: body.es }));
        return json({ ok: true });
      }
    }

    if (url.pathname === '/admin') {
      if (!authed(req, url, env)) return new Response('Unauthorized — open this page with ?key=YOUR-ADMIN-KEY', { status: 401 });
      return new Response(DASHBOARD_HTML.replace('__KEY__', url.searchParams.get('key') || ''), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Villa Azure Concierge API', { status: 200 });
  },
};

const DASHBOARD_HTML = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Concierge Dashboard · Villa Azure</title>
<style>
  :root{--espresso:#2A251F;--paper:#F4EEE4;--clay:#A9744F;--stone:#7A6F5E;--line:#DBD1C0;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,'Jost',Helvetica,Arial,sans-serif;background:var(--paper);color:#23201B;padding:0 0 80px;}
  header{background:var(--espresso);color:#EDE6DA;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;}
  header h1{font-size:20px;font-weight:500;}
  header span{opacity:.6;font-size:13px;}
  nav{display:flex;gap:8px;padding:18px 28px;}
  nav button{border:1px solid var(--clay);background:transparent;color:var(--clay);border-radius:30px;padding:8px 20px;font-size:14px;cursor:pointer;}
  nav button.on{background:var(--clay);color:#fff;}
  main{padding:0 28px;max-width:1100px;}
  .card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
  table{width:100%;border-collapse:collapse;font-size:13.5px;}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top;}
  th{color:var(--stone);font-weight:500;text-transform:uppercase;font-size:11px;letter-spacing:.08em;}
  tr.miss td{background:#FBF0E8;}
  .pill{display:inline-block;border-radius:20px;padding:2px 10px;font-size:11.5px;background:var(--paper);color:var(--stone);}
  .pill.miss{background:#E8A87C;color:#fff;}
  .stats{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px;}
  .stat{background:#fff;border-radius:12px;padding:14px 22px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
  .stat b{display:block;font-size:24px;font-weight:500;}
  .stat span{font-size:12px;color:var(--stone);}
  .faq{border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:12px;background:#fff;}
  .faq input[type=text],.faq textarea{width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:14px;font-family:inherit;margin-top:4px;background:#FDFBF7;}
  .faq textarea{min-height:64px;resize:vertical;}
  .faq label{font-size:11px;color:var(--stone);text-transform:uppercase;letter-spacing:.06em;display:block;margin-top:10px;}
  .faq .row{display:flex;gap:10px;}
  .faq .row>div{flex:1;}
  .faqhead{display:flex;justify-content:space-between;align-items:center;gap:8px;}
  .faqhead b{font-size:15px;font-weight:500;}
  .btn{border:none;border-radius:8px;padding:8px 16px;font-size:13.5px;cursor:pointer;background:var(--espresso);color:#EDE6DA;}
  .btn.ghost{background:transparent;border:1px solid var(--line);color:var(--stone);}
  .btn.clay{background:var(--clay);color:#fff;}
  .btn.sm{padding:4px 10px;font-size:12px;}
  .langsw{display:flex;gap:6px;margin-bottom:14px;}
  #savebar{position:fixed;bottom:0;left:0;right:0;background:var(--espresso);padding:12px 28px;display:none;justify-content:flex-end;gap:10px;}
  #msg{color:#8fd48f;font-size:13px;align-self:center;}
</style>
<header>
  <div><h1>Villa Azure · Concierge Dashboard</h1><span>Guest questions and chat flow</span></div>
  <span id="upd"></span>
</header>
<nav>
  <button id="tab-q" class="on" onclick="show('q')">Incoming Questions</button>
  <button id="tab-r" onclick="show('r')">Responses</button>
  <button id="tab-f" onclick="show('f')">Edit Answers &amp; Flow</button>
</nav>
<main>
  <section id="view-q">
    <div class="stats" id="stats"></div>
    <div class="card"><table id="logtable"><thead><tr>
      <th>When</th><th>Type</th><th>Question / Text</th><th>Lang</th><th>Page</th><th>Respond</th>
    </tr></thead><tbody></tbody></table></div>
  </section>
  <section id="view-r" style="display:none">
    <div class="card" style="padding:12px 20px;color:var(--stone);font-size:13px;">What the guest saw as a reply — automatic answers are resolved against the <b>current</b> Q&amp;A config, so if you edited an answer since, the guest may have seen the older wording.</div>
    <div class="card"><table id="resptable"><thead><tr>
      <th>When</th><th>Guest asked</th><th>What we said back</th><th>How</th><th>Lang</th>
    </tr></thead><tbody></tbody></table></div>
  </section>
  <section id="view-f" style="display:none">
    <div class="langsw">
      <button class="btn sm clay" id="lang-en" onclick="setLang('en')">English</button>
      <button class="btn sm ghost" id="lang-es" onclick="setLang('es')">Español</button>
      <span style="flex:1"></span>
      <button class="btn sm" onclick="addFaq()">+ Add question</button>
    </div>
    <div id="faqs"></div>
  </section>
</main>
<div id="savebar"><span id="msg"></span><button class="btn ghost" onclick="load()">Discard</button><button class="btn clay" onclick="save()">Publish changes</button></div>
<script>
const KEY='__KEY__', API=location.origin;
let cfg={en:[],es:[]}, lang='en', dirty=false;
const EVNAMES={chat_opened:'Opened',chat_question:'Tapped',chat_typed_matched:'Typed · answered',chat_typed_unmatched:'Typed · NO ANSWER',chat_lead:'Left email · reply!',admin_reply:'You replied'};
function show(v){['q','r','f'].forEach(k=>{document.getElementById('view-'+k).style.display=v===k?'':'none';document.getElementById('tab-'+k).classList.toggle('on',v===k);});}
function fmt(t){const d=new Date(t);return d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
async function loadLogs(){
  const r=await fetch(API+'/admin/api/logs?key='+KEY);const {events}=await r.json();
  const tb=document.querySelector('#logtable tbody');tb.innerHTML='';
  let opened=0,asked=0,missed=0;const misses={};
  window._events=events;
  let leads=0;
  events.forEach((e,idx)=>{
    if(e.event==='chat_opened'){opened++;return;}
    asked++;
    const isMiss=e.event==='chat_typed_unmatched'||e.event==='chat_lead';
    if(e.event==='chat_typed_unmatched'){missed++;misses[e.text]=(misses[e.text]||0)+1;}
    if(e.event==='chat_lead')leads++;
    const tr=document.createElement('tr');
    if(isMiss)tr.className='miss';
    let respond='';
    if(isMiss){
      if(e.sid)respond+='<button class="btn sm clay" onclick="replyInChat('+idx+',this)">Reply in chat</button> ';
      respond+='<button class="btn sm ghost" onclick="answerFromLog('+idx+')">Answer as FAQ</button>';
      if(e.email){
        const subj=encodeURIComponent('Your question to Villa Azure Hotel');
        const bod=encodeURIComponent('Hi! Thanks for reaching out. You asked: "'+(e.text||'')+'". ');
        respond+=' <a class="btn sm clay" style="text-decoration:none" href="mailto:'+e.email+'?subject='+subj+'&body='+bod+'">Reply</a>';
      }
    }
    const who=e.email?' · <b>'+e.email+'</b>':'';
    tr.innerHTML='<td>'+fmt(e.t)+'</td><td><span class="pill'+(isMiss?' miss':'')+'">'+(EVNAMES[e.event]||e.event)+'</span></td><td>'+(e.text||e.question||'')+who+'</td><td>'+e.lang+'</td><td>'+e.page+'</td><td style="white-space:nowrap">'+respond+'</td>';
    tb.appendChild(tr);
  });
  document.getElementById('stats').innerHTML=
    '<div class="stat"><b>'+opened+'</b><span>chats opened</span></div>'+
    '<div class="stat"><b>'+asked+'</b><span>questions asked</span></div>'+
    '<div class="stat"><b>'+missed+'</b><span>unanswered (add these!)</span></div>'+
    '<div class="stat"><b>'+leads+'</b><span>left an email — reply!</span></div>';
  document.getElementById('upd').textContent='Updated '+new Date().toLocaleTimeString();
  renderResponses();
}
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function faqFor(e){const bank=cfg[e.lang==='es'?'es':'en']||[];return bank.find(f=>f.id===e.question)||null;}
const NOMATCH={en:'Great question — I don’t have that answer on hand, but our team does. Tap below to reach us on WhatsApp, and our reply will also appear right here in this chat.',es:'Buena pregunta — no tengo esa respuesta a la mano, pero nuestro equipo sí. Toca abajo para escribirnos por WhatsApp, y nuestra respuesta también aparecerá aquí en este chat.'};
function renderResponses(){
  const tb=document.querySelector('#resptable tbody');
  if(!tb||!window._events)return;
  tb.innerHTML='';
  window._events.forEach(e=>{
    let asked='',said='',how='',miss=false;
    if(e.event==='chat_question'){const f=faqFor(e);asked=f?f.q:e.question;said=f?f.a:'(this answer is no longer in the config)';how='Auto · tapped chip';}
    else if(e.event==='chat_typed_matched'){const f=faqFor(e);asked=e.text;said=f?f.a:'(this answer is no longer in the config)';how='Auto · keyword match';}
    else if(e.event==='chat_typed_unmatched'||e.event==='chat_lead'){asked=e.text;said=NOMATCH[e.lang==='es'?'es':'en'];how='Fallback · no match';miss=true;}
    else if(e.event==='admin_reply'){asked='(reply sent into an earlier chat)';said=e.text;how='You · manual reply';}
    else return;
    const tr=document.createElement('tr');
    if(miss)tr.className='miss';
    tr.innerHTML='<td style="white-space:nowrap">'+fmt(e.t)+'</td><td>'+esc(asked)+(e.email?' · <b>'+esc(e.email)+'</b>':'')+'</td><td>'+esc(said)+'</td><td style="white-space:nowrap"><span class="pill'+(miss?' miss':'')+'">'+how+'</span></td><td>'+e.lang+'</td>';
    tb.appendChild(tr);
  });
}
function setLang(l){lang=l;document.getElementById('lang-en').className='btn sm '+(l==='en'?'clay':'ghost');document.getElementById('lang-es').className='btn sm '+(l==='es'?'clay':'ghost');renderFaqs();}
function markDirty(){dirty=true;document.getElementById('savebar').style.display='flex';document.getElementById('msg').textContent='';}
function renderFaqs(){
  const box=document.getElementById('faqs');box.innerHTML='';
  cfg[lang].forEach((f,i)=>{
    const d=document.createElement('div');d.className='faq';
    d.innerHTML='<div class="faqhead"><b>'+(i+1)+'. '+f.q+'</b><span>'+
      '<button class="btn sm ghost" onclick="move('+i+',-1)">↑</button> '+
      '<button class="btn sm ghost" onclick="move('+i+',1)">↓</button> '+
      '<button class="btn sm ghost" onclick="del('+i+')">Delete</button></span></div>'+
      '<label>Question (shown as a tappable chip)</label><input type="text" value="'+f.q.replace(/"/g,'&quot;')+'" onchange="upd('+i+',\\'q\\',this.value)">'+
      '<label>Answer</label><textarea onchange="upd('+i+',\\'a\\',this.value)">'+f.a+'</textarea>'+
      '<div class="row"><div><label>Keywords (comma separated, for typed questions)</label><input type="text" value="'+(f.k||[]).join(', ')+'" onchange="upd('+i+',\\'k\\',this.value)"></div>'+
      '<div><label>Link URL (optional)</label><input type="text" value="'+((f.link&&f.link[0])||'')+'" onchange="updLink('+i+',0,this.value)"></div>'+
      '<div><label>Link label</label><input type="text" value="'+((f.link&&f.link[1])||'')+'" onchange="updLink('+i+',1,this.value)"></div></div>';
    box.appendChild(d);
  });
}
function upd(i,field,val){const f=cfg[lang][i];if(field==='k'){f.k=val.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);}else{f[field]=val;}markDirty();if(field==='q')renderFaqs();}
function updLink(i,part,val){const f=cfg[lang][i];f.link=f.link||['',''];f.link[part]=val;if(!f.link[0]&&!f.link[1])delete f.link;markDirty();}
function move(i,d){const a=cfg[lang];if(i+d<0||i+d>=a.length)return;[a[i],a[i+d]]=[a[i+d],a[i]];markDirty();renderFaqs();}
function del(i){if(!confirm('Delete this question?'))return;cfg[lang].splice(i,1);markDirty();renderFaqs();}
function replyInChat(i,btn){
  const e=window._events[i];if(!e||!e.sid)return;
  const tr=btn.closest('tr');
  if(tr.nextSibling&&tr.nextSibling.className==='replyrow'){tr.nextSibling.remove();return;}
  const row=document.createElement('tr');row.className='replyrow';
  const td=document.createElement('td');td.colSpan=6;
  td.innerHTML='<div style="display:flex;gap:8px;padding:6px 0;"><textarea style="flex:1;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13.5px;min-height:52px;" placeholder="Type your reply — it appears inside the guest\u2019s chat on the website"></textarea><button class="btn clay">Send to chat</button></div>';
  td.querySelector('button').onclick=async function(){
    const text=td.querySelector('textarea').value.trim();if(!text)return;
    this.textContent='Sending…';
    const r=await fetch(API+'/admin/api/reply?key='+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sid:e.sid,text,lang:e.lang})});
    const j=await r.json();
    if(j.ok){td.innerHTML='<div style="padding:8px 0;color:#5a8a5a;font-size:13px;">Sent — the guest will see it in their chat.</div>';setTimeout(loadLogs,1500);}
    else{this.textContent='Send to chat';alert('Error: '+(j.error||'unknown'));}
  };
  row.appendChild(td);tr.parentNode.insertBefore(row,tr.nextSibling);
}
function answerFromLog(i){
  const e=window._events[i];if(!e)return;
  setLang(e.lang==='es'?'es':'en');
  cfg[lang].push({id:'custom-'+Date.now().toString(36),q:e.text||'New question?',a:'Answer…',k:(e.text||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3).slice(0,5)});
  markDirty();show('f');renderFaqs();window.scrollTo(0,document.body.scrollHeight);
}
function addFaq(){cfg[lang].push({id:'custom-'+Date.now().toString(36),q:'New question?',a:'Answer…',k:[]});markDirty();renderFaqs();}
async function save(){
  const r=await fetch(API+'/admin/api/config?key='+KEY,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)});
  const j=await r.json();
  document.getElementById('msg').textContent=j.ok?'Published — live on the site within ~5 minutes.':'Error: '+(j.error||'unknown');
  if(j.ok){dirty=false;setTimeout(()=>{document.getElementById('savebar').style.display='none';},2500);}
}
async function load(){
  const r=await fetch(API+'/admin/api/config?key='+KEY);const j=await r.json();
  if(j.en){cfg=j;}
  dirty=false;document.getElementById('savebar').style.display='none';
  renderFaqs();renderResponses();
}
load();loadLogs();setInterval(loadLogs,60000);
</script>`;
