/* Human Consumer Products — renderer. Reads creators.js; nothing here changes when minds or concepts are added.
   Addresses: #index · #admission · #<mind> · #<mind>--back · #<mind>--<concept> · #<mind>--<concept>--brief · #<mind>--<concept>--commission */
(function () {
  var H = window.HCP;
  var app = document.getElementById('app');
  var nav = document.getElementById('nav');
  var live = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function minds() { return H.minds.filter(function (m) { return m.admitted; }); }
  function find(slug) { return minds().filter(function (m) { return m.slug === slug; })[0]; }
  function concept(m, id) { return (m.concepts || []).filter(function (c) { return c.id === id; })[0]; }
  function allConcepts() { var out = []; minds().forEach(function (m) { (m.concepts || []).forEach(function (c) { out.push([m, c]); }); }); return out; }
  function first(name) { return name.split(' ')[0]; }
  function mail(to, subject) { return 'mailto:' + esc(to) + '?subject=' + encodeURIComponent(subject); }
  function page(inner) { return '<section><div class="wrap" style="padding-top:clamp(48px,7vw,96px);padding-bottom:clamp(64px,8vw,112px);display:flex;flex-direction:column;gap:28px">' + inner + '</div></section>'; }
  function band(inner) { return '<section class="band"><div class="wrap">' + inner + '</div></section>'; }
  function tagClass(t) { return t === 'Now' || t === 'Live demo' ? 'tag yes' : t === 'Partly' ? 'tag part' : 'tag'; }
  function h1(t) { return '<h1 class="title">' + t + '</h1>'; }
  function kv(rows) {
    return '<dl class="kv">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
  }

  function field(n, label, type, req) { return '<label class="f"><span>' + esc(label) + '</span><input name="' + n + '" type="' + type + '"' + (req ? ' required' : '') + '></label>'; }
  function area(n, label, req) { return '<label class="f"><span>' + esc(label) + '</span><textarea name="' + n + '" rows="4"' + (req ? ' required' : '') + '></textarea></label>'; }
  function wireForm() {
    var f = document.getElementById('admit'); if (!f) return;
    var st = document.getElementById('admit-status');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); st.textContent = 'Sending…';
      fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw 0; f.innerHTML = '<h3>Received.</h3><p>Your submission is with the principal for sign-off. You will hear back by email.</p>'; })
        .catch(function () { st.textContent = 'Not sent. Please try again, or write to ' + H.entity.contact + '.'; });
    });
  }

  function setNav(m) {
    var items = [['#index', 'Index', 'index']];
    if (m) {
      items.push(['#' + m.slug, m.name, m.slug]);
      items.push(['#' + m.slug + '--back', 'Back the mind', m.slug + '--back']);
    } else {
      items.push(['#admission', 'Admission', 'admission']);
    }
    var cur = (location.hash || '#index').slice(1);
    nav.innerHTML = items.map(function (i) {
      return '<a href="' + i[0] + '"' + (cur === i[2] ? ' aria-current="page"' : '') + '>' + esc(i[1]) + '</a>';
    }).join('');
  }

  function registryRows() {
    return '<div class="table" role="table" aria-label="Concept registry">' +
      '<div class="tr th" role="row"><span role="columnheader">Code</span><span role="columnheader">Concept</span><span role="columnheader">Mind</span><span role="columnheader">Status</span></div>' +
      allConcepts().map(function (p) {
        var m = p[0], c = p[1];
        return '<a class="tr" role="row" href="#' + m.slug + '--' + c.id + '"><span role="cell" class="mono">' + esc(c.code) + '</span><span role="cell">' + esc(c.title) + '</span><span role="cell">' + esc(m.name) + '</span><span role="cell"><span class="' + tagClass(c.status) + '">' + esc(c.status) + '</span></span></a>';
      }).join('') + '</div>';
  }

  function index() {
    var lead = allConcepts()[0];
    return page(
      '<p class="kick">Human Consumer Products</p>' +
      h1('Concepts from human minds, for humans.') +
      '<p class="lead">Intelligence is abundant. Original concepts from human minds are not. Human Consumer Products holds, develops and licenses them — each one taken to the point where a product team can see it, test it and commission it.</p>' +
      (lead ? '<div class="row"><a class="btn" href="#' + lead[0].slug + '--' + lead[1].id + '">Open ' + esc(lead[1].code) + '</a><a class="btn ghost" href="#admission">Admission</a></div>' : '')
    ) + band('<p class="kick">Registry</p><h2 class="big">Concepts</h2>' + registryRows()) +
      band('<p class="kick">Terms</p><h2 class="big">Three ways in.</h2><div class="grid">' +
        '<div class="card"><p class="kick" style="color:var(--mute)">01</p><h3>See the concept</h3><p>Every concept is held as a working demonstration and a one-page brief, written to be forwarded to a product team.</p></div>' +
        '<div class="card"><p class="kick" style="color:var(--mute)">02</p><h3>Commission it</h3><p>Companies and investors co-commission defined stages. The originating mind keeps the concept; studios assign what they build.</p></div>' +
        '<div class="card"><p class="kick" style="color:var(--mute)">03</p><h3>Back the mind</h3><p>Standing support for the person, not a single product. Paid directly to them; it buys no equity.</p></div></div>') +
      band('<p class="kick">For agents</p><h2 class="big">Readable by machines.</h2><p class="lead">A structured index of every mind and concept is published at <a href="concepts.json">/concepts.json</a>, with a plain summary at <a href="llms.txt">/llms.txt</a>. Agents acting for a principal can assess and route enquiries without rendering this page.</p>');
  }

  function admission() {
    return page(
      '<p class="kick">Admission</p>' +
      h1('Minds are admitted by sign-off.') +
      '<p class="lead">Human Consumer Products admits a small number of originating minds. Admitted minds hold their concepts here in the same form: demonstrations, briefs, commission terms, and their own Back the mind.</p>' +
      '<ol class="steps">' +
      '<li><div><h3>Submission</h3><p>Who you are, and the first concept you would bring.</p></div></li>' +
      '<li><div><h3>Sign-off</h3><p>Reviewed by the principal. Terms agreed in writing.</p></div></li>' +
      '<li><div><h3>Payment link</h3><p>You provide your own payment link privately. Backers pay you directly.</p></div></li>' +
      '<li><div><h3>Registry entry</h3><p>Your concepts receive codes and go live at humanconsumerproducts.com.</p></div></li>' +
      '</ol>' +
      '<form id="admit" class="card" style="gap:16px" action="' + esc(H.entity.admissionForm) + '" method="POST">' +
      '<h3>Submission</h3>' +
      field('name', 'Name', 'text', true) + field('email', 'Email', 'email', true) + field('place', 'Where you are', 'text', false) +
      area('mind', 'Who you are, and what you originate', true) + area('concept', 'The first concept you would bring', true) +
      field('link', 'A link to your work (optional)', 'url', false) +
      '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' +
      '<div class="row"><button class="btn" type="submit">Submit for sign-off</button><span id="admit-status" class="mono small" role="status"></span></div></form>'
    );
  }

  function mindPage(m) {
    return page(
      '<p class="kick">Mind · ' + esc(m.place) + '</p>' +
      h1(esc(m.name)) +
      '<p class="lead">' + esc(m.line) + '</p>' +
      kv([['Concepts held', String((m.concepts || []).length)], ['Backing', (m.backMonthly || m.backOnce) ? 'Open' : 'Opening']]) +
      '<div class="row"><a class="btn" href="#' + m.slug + '--back">Back the mind</a></div>'
    ) + band('<p class="kick">Concepts</p><div class="grid">' + (m.concepts || []).map(function (c) {
      return '<div class="card"><span class="' + tagClass(c.status) + '">' + esc(c.status) + '</span><p class="mono small">' + esc(c.code) + '</p><h3>' + esc(c.title) + '</h3><p>' + esc(c.summary) + '</p><div class="row"><a href="#' + m.slug + '--' + c.id + '">Open</a><a href="#' + m.slug + '--' + c.id + '--brief">Brief</a><a href="#' + m.slug + '--' + c.id + '--commission">Commission</a></div></div>';
    }).join('') + '</div>');
  }

  function conceptPage(m, c) {
    var demo = c.demo === 'caster';
    var top = '<div class="wrap hero">' +
      '<p class="kick">' + esc(c.code) + ' · ' + esc(c.title) + ' · ' + esc(m.name) + '</p>' +
      '<h1 class="serif" style="font-style:italic;font-size:clamp(60px,11vw,144px);line-height:.92">' + esc(c.headline) + '</h1>' +
      '<p class="lead" style="max-width:620px">' + esc(c.summary) + '</p>' +
      (demo ? '<div class="stage"><canvas id="stage" data-codex-stage="1" role="img" aria-label="A stone and brass caster with a moving form made of light rising out of it. Drag to turn the light."></canvas></div>' +
        '<p id="caption" class="serif" style="font-style:italic;font-size:clamp(24px,2.6vw,32px);line-height:1.2;min-height:1.25em">Listening.</p>' +
        '<div id="chips" role="group" aria-label="Say something to the caster" class="row" style="justify-content:center;max-width:900px"></div>' +
        '<div class="row" style="justify-content:center"><button type="button" class="keep" id="keep" disabled>Keep it</button><span class="mono small" style="letter-spacing:.14em;text-transform:uppercase">Casts kept: <span id="kept">0</span></span></div>' +
        '<p class="mono small">Tap a phrase to cast it. Drag the light to turn it.</p>' : '') +
      '<div class="row" style="justify-content:center;margin-top:10px"><a class="btn" href="#' + m.slug + '--' + c.id + '--brief">Read the brief</a><a class="btn ghost" href="#' + m.slug + '--' + c.id + '--commission">Commission</a></div></div>';
    var record = band('<p class="kick">Record</p>' + kv([
      ['Code', '<span class="mono">' + esc(c.code) + '</span>'], ['Originator', esc(m.name)], ['Stage', esc(c.stage)], ['Rights', esc(c.rights)]
    ]) + ((c.versions && c.versions.length) ? '<div class="table" role="table" aria-label="Version log"><div class="tr th v" role="row"><span role="columnheader">Version</span><span role="columnheader">Date</span><span role="columnheader">Change</span></div>' +
      c.versions.slice().reverse().map(function (v) { return '<div class="tr v" role="row"><span role="cell" class="mono">' + esc(v[0]) + '</span><span role="cell" class="mono">' + esc(v[1]) + '</span><span role="cell">' + esc(v[2]) + '</span></div>'; }).join('') + '</div>' : ''));
    var feas = (c.feasibility && c.feasibility.length) ? band('<p class="kick">Feasibility</p><h2 class="big">What exists today, and what doesn’t yet.</h2><div class="grid">' +
      c.feasibility.map(function (f) { return '<div class="card"><span class="' + tagClass(f[0]) + '">' + esc(f[0]) + '</span><h3>' + esc(f[1]) + '</h3><p>' + esc(f[2]) + '</p></div>'; }).join('') + '</div>') : '';
    return top + record + feas;
  }

  function briefPage(m, c) {
    var body = (c.brief || []).map(function (b) {
      var v = Array.isArray(b[1]) ? '<ul>' + b[1].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p>' + esc(b[1]) + '</p>';
      return '<div><h3>' + esc(b[0]) + '</h3>' + v + '</div>';
    }).join('');
    return page('<div class="brief">' +
      '<p class="kick">Brief · ' + esc(c.code) + '</p>' + h1(esc(c.title)) +
      '<p class="lead">For product leaders, founders and studios. What it is, why now, and what it would take.</p>' +
      kv([['Originator', esc(m.name)], ['Stage', esc(c.stage)], ['Rights', esc(c.rights)]]) + body +
      '<div class="row noprint"><a class="btn" href="#' + m.slug + '--' + c.id + '--commission">Commission terms</a><a class="btn ghost" href="#' + m.slug + '--' + c.id + '">Open the demonstration</a></div>' +
      '<p class="note">Held at Human Consumer Products. Specifications are concept targets, not a specification.</p></div>');
  }

  function commissionPage(m, c) {
    return page(
      '<p class="kick">Commission · ' + esc(c.code) + '</p>' + h1('Commission ' + esc(c.title.toLowerCase()) + '.') +
      '<p class="lead">Concepts are commissioned in defined stages. Each stage has a fixed output. Commissioners may enter at any stage, alone or alongside others.</p>' +
      '<ol class="steps">' +
      '<li><div><h3>Working rig</h3><p>Existing components proving the full interaction on a bench.</p><p class="meta">Output: a functioning demonstration</p></div></li>' +
      '<li><div><h3>Looks-like, works-like prototype</h3><p>A studio turns the rig into an object that looks and behaves like the product.</p><p class="meta">Output: one hand-built unit</p></div></li>' +
      '<li><div><h3>Engineering prototype</h3><p>Custom components, designed for manufacture.</p><p class="meta">Output: a small batch</p></div></li>' +
      '<li><div><h3>Production partner</h3><p>A consumer company takes it to market under licence or partnership.</p><p class="meta">Output: a product in market</p></div></li>' +
      '</ol><div class="grid">' +
      '<div class="card"><h3>Commissioners receive</h3><p>First look at every stage, a seat in build reviews, credit on the concept, and first right to license or partner.</p></div>' +
      '<div class="card"><h3>Funds</h3><p>Commissioners fund a named stage. Studios are paid against milestones. Each stage closes with a written build note.</p></div>' +
      '<div class="card"><h3>Rights</h3><p>The concept stays with ' + esc(m.name) + '. Every studio contract assigns the work it creates, so the licensable position is clear.</p></div></div>' +
      '<div class="card" style="gap:14px"><h3>Enquiries</h3><p>From principals, product teams, studios, investors, or agents acting for them. State the stage of interest.</p><div class="row"><a class="btn" href="' + mail(m.contact, 'Commission enquiry — ' + c.code + ' ' + c.title) + '">Enquire</a><span class="mono small">' + esc(m.contact) + '</span></div></div>'
    );
  }

  function backPage(m) {
    var links = [];
    if (m.backMonthly) links.push('<a class="btn" href="' + esc(m.backMonthly) + '" target="_blank" rel="noopener">Back monthly</a>');
    if (m.backOnce) links.push('<a class="btn ghost" href="' + esc(m.backOnce) + '" target="_blank" rel="noopener">Back once</a>');
    var pay = links.length
      ? links.join('')
      : '<a class="btn" href="' + mail(m.contact, 'Backing ' + m.name) + '">Register to back</a><span class="mono small">Payments opening shortly</span>';
    return page(
      '<p class="kick">Back the mind · ' + esc(m.name) + '</p>' + h1('Back the mind, not the product.') +
      '<p class="lead">' + esc(m.statement) + '</p>' +
      '<div class="grid"><div class="card"><span class="tag yes">Today</span><h3>Fiat</h3><p>Monthly or one-off, paid directly to ' + esc(first(m.name)) + '. Backers are credited on every concept they help bring into being and see new concepts first.</p></div>' +
      '<div class="card"><span class="tag">Later</span><h3>Other forms of value</h3><p>As new forms of value emerge, from compute to agents to forms not yet named, they will be accepted here. The form changes; the backing does not.</p></div></div>' +
      '<div class="card" style="gap:14px"><h3>Back ' + esc(first(m.name)) + '</h3><div class="row">' + pay + '</div></div>' +
      '<p class="note">Backing is support, not investment. It confers no equity, share or return.</p>'
    );
  }

  function mountCaster() {
    var stage = document.getElementById('stage');
    if (!stage || typeof Component === 'undefined') return;
    var comp = new Component({});
    var chipsEl = document.getElementById('chips'), cap = document.getElementById('caption'), keep = document.getElementById('keep'), kept = document.getElementById('kept');
    comp.FORMS.forEach(function (f, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = f.label; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { comp.picks[i](); }); chipsEl.appendChild(b);
    });
    comp.onState = function () {
      var v = comp.renderVals(); cap.textContent = v.caption; keep.disabled = v.keepDisabled; kept.textContent = v.kept;
      Array.prototype.forEach.call(chipsEl.children, function (b, i) { b.setAttribute('aria-pressed', v.chips[i].pressed); });
    };
    keep.addEventListener('click', function () { comp.keep(); });
    stage.addEventListener('pointerdown', function (e) { comp.onDown(e); });
    stage.addEventListener('pointermove', function (e) { comp.onMove(e); });
    ['pointerup', 'pointercancel'].forEach(function (n) { stage.addEventListener(n, function () { comp.onUp(); }); });
    comp.canvasRef(stage); comp.componentDidMount();
    live = comp;
  }

  function route() {
    if (live) { live.componentWillUnmount(); live = null; }
    var key = (location.hash || '#index').slice(1) || 'index';
    var parts = key.split('--');
    var m = find(parts[0]);
    var html;
    if (key === 'admission') html = admission();
    else if (!m) html = index();
    else if (parts.length === 1) html = mindPage(m);
    else if (parts[1] === 'back') html = backPage(m);
    else {
      var c = concept(m, parts[1]);
      if (!c) html = mindPage(m);
      else if (parts[2] === 'brief') html = briefPage(m, c);
      else if (parts[2] === 'commission') html = commissionPage(m, c);
      else html = conceptPage(m, c);
    }
    setNav(m && key !== 'admission' ? m : null);
    app.innerHTML = html;
    window.scrollTo(0, 0);
    mountCaster();
    wireForm();
  }
  window.addEventListener('hashchange', route);
  route();
})();
