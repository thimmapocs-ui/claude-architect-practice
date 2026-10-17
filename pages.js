(function () {
  'use strict';
  const { SETS, quizHome, start, shuffle, esc, fmt, pct, load } = window.CCA;
  const C = window.CCA_CONTENT;
  const app = document.getElementById('app');
  const total = SETS.reduce((n, s) => n + s.questions.length, 0);
  let keyHandler = null;

  const link = (r, label, cls) => `<a class="${cls || 'btn'}" href="#/${r}">${label}</a>`;
  const domainName = (k) => C.names[k];

  // ---------- landing ----------
  function landing() {
    const mock = load().mock;
    app.innerHTML = `
      <section class="hero">
        <h1>Prepare for the Claude Certified Architect exam</h1>
        <p class="lead">Free, original practice. Scenario questions with an explanation for every option, a timed mock exam, flashcards and a printable cheat sheet. No sign-up, and your progress stays in your browser.</p>
        <div class="row">${link('quiz', 'Start a quiz')} ${link('mock', 'Try the mock exam', 'btn ghost')} ${link('guide', 'Browse the study guide', 'btn ghost')}</div>
      </section>
      <div class="stats">
        <div><b>${total}</b><span>practice questions</span></div>
        <div><b>${SETS.length}</b><span>question sets</span></div>
        <div><b>5</b><span>exam domains</span></div>
        <div><b>${C.flashcards.length}</b><span>flashcards</span></div>
        <div><b>${C.antipatterns.length}</b><span>anti-patterns</span></div>
      </div>
      <h2>Exam domains</h2>
      <div class="grid">${C.domains.map((d) => `
        <a class="card dcard" href="#/guide/${d.key}">
          <span class="pill">${d.weight}%</span>
          <h3>${esc(d.name)}</h3><p class="muted">${esc(d.blurb)}</p>
        </a>`).join('')}</div>
      <p class="muted small">Weights are community-reported and unofficial. Check the official exam guide.</p>
      <h2>Study tools</h2>
      <div class="grid">
        ${[['quiz', 'Quiz', `${total} questions in ${SETS.length} sets. Practice mode or exam mode.`],
           ['mock', 'Mock exam', 'Timed, drawn by domain weight, with a full breakdown.' + (mock ? ` Best ${mock.best}%.` : '')],
           ['flashcards', 'Flashcards', 'Flip cards with a domain filter and keyboard control.'],
           ['cheatsheet', 'Cheat sheet', 'One-page reference per domain. Print it for review.'],
           ['antipatterns', 'Anti-patterns', 'Common wrong-answer habits and what to do instead.'],
           ['guide', 'Study guide', 'Key ideas, production notes and doc links per domain.'],
           ['overview', 'Overview & plan', 'Exam facts, scenarios and a 6-week plan.']
          ].map(([r, t, d]) => `<a class="card tcard" href="#/${r}"><h3>${t}</h3><p class="muted">${d}</p></a>`).join('')}
      </div>`;
  }

  // ---------- overview ----------
  function overview() {
    const o = C.overview;
    app.innerHTML = `
      <h1>Exam overview & study plan</h1>
      <div class="card"><table>${o.facts.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
        <p class="muted small">${esc(o.note)}</p></div>
      <h2>Domains</h2>
      <table>${C.domains.map((d) => `<tr><td>${esc(d.name)}</td><td>${d.weight}%</td><td style="width:40%"><div class="bar"><span style="width:${d.weight * 3}%"></span></div></td></tr>`).join('')}</table>
      <h2>Typical scenarios</h2>
      <ul>${o.scenarios.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <h2>6-week study plan</h2>
      <div class="card">${o.plan.map(([w, t]) => `<p><strong>${esc(w)}.</strong> ${fmt(t)}</p>`).join('')}</div>
      <div class="row">${link('guide', 'Open the study guide')} ${link('mock', 'Take a mock exam', 'btn ghost')}</div>`;
  }

  // ---------- study guide ----------
  function guide(sel) {
    app.innerHTML = `
      <h1>Study guide</h1>
      <p class="muted">Short, practical notes per domain. Claude Code details follow the official docs, so check the linked page when versions matter.</p>
      ${C.guide.map((g) => `
        <details class="card" id="g-${g.d}" ${sel === g.d ? 'open' : ''}>
          <summary><strong>${esc(domainName(g.d))}</strong> <span class="pill">${C.domains.find((d) => d.key === g.d).weight}%</span></summary>
          <ul>${g.points.map((p) => `<li>${fmt(p)}</li>`).join('')}</ul>
          <p><strong>In production:</strong> ${fmt(g.prod)}</p>
          <p class="refs">Docs: ${g.links.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>
        </details>`).join('')}`;
    if (sel) { const el = document.getElementById('g-' + sel); if (el) el.scrollIntoView(); }
  }

  // ---------- cheat sheet ----------
  function cheatsheet() {
    app.innerHTML = `
      <div class="row spread"><h1>Cheat sheet</h1><button class="btn ghost noprint" id="print">Print</button></div>
      ${C.domains.map((d) => `
        <h2>${esc(d.name)}</h2>
        <div class="cheats">${C.cheatsheet.filter((c) => c.d === d.key).map((c) => `
          <div class="card cheat"><h3>${esc(c.title)}</h3><p>${fmt(c.body)}</p>${c.code ? `<pre>${esc(c.code)}</pre>` : ''}</div>`).join('')}</div>`).join('')}`;
    document.getElementById('print').addEventListener('click', () => window.print());
  }

  // ---------- anti-patterns ----------
  function antipatterns() {
    app.innerHTML = `
      <h1>Anti-patterns</h1>
      <p class="muted">Habits that look reasonable but lose points. Each one has a better default.</p>
      ${C.antipatterns.map((a, i) => `
        <div class="card ap"><span class="pill">${i + 1}</span><strong>${esc(a.bad)}</strong>
          <p class="why">Why it fails: ${esc(a.why)}</p><p class="fix">Instead: ${fmt(a.fix)}</p></div>`).join('')}`;
  }

  // ---------- flashcards ----------
  function flashcards() {
    let filter = 'all', deck = C.flashcards.slice(), i = 0, flipped = false;
    const draw = () => {
      const c = deck[i];
      app.innerHTML = `
        <h1>Flashcards</h1>
        <div class="row">
          <label>Domain <select id="fdom"><option value="all">All domains</option>
            ${C.domains.map((d) => `<option value="${d.key}" ${filter === d.key ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>
          <button class="btn ghost" id="fshuf">Shuffle</button>
        </div>
        ${c ? `<button class="flash ${flipped ? 'flipped' : ''}" id="card" aria-label="Flip card">
          <span class="muted small">${esc(domainName(c.d))} · ${flipped ? 'Answer' : 'Question'}</span>
          <span class="ftext">${fmt(flipped ? c.back : c.front)}</span></button>
        <div class="row spread"><button class="btn ghost" id="fprev">Previous</button>
          <span class="muted">${i + 1} / ${deck.length} · Space flips, arrows move</span>
          <button class="btn" id="fnext">Next</button></div>` : '<p class="muted">No cards.</p>'}`;
      const go = (d) => { i = (i + d + deck.length) % deck.length; flipped = false; draw(); };
      const flip = () => { flipped = !flipped; draw(); };
      const $ = (id) => document.getElementById(id);
      $('fdom').addEventListener('change', (e) => { filter = e.target.value; deck = C.flashcards.filter((x) => filter === 'all' || x.d === filter); i = 0; flipped = false; draw(); });
      $('fshuf').addEventListener('click', () => { deck = shuffle(deck); i = 0; flipped = false; draw(); });
      if (c) { $('card').addEventListener('click', flip); $('fprev').addEventListener('click', () => go(-1)); $('fnext').addEventListener('click', () => go(1)); }
      keyHandler = (e) => {
        if (!c || /^(SELECT|INPUT)$/.test((document.activeElement || {}).tagName)) return;
        if (e.key === ' ') { e.preventDefault(); flip(); }
        else if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
      };
    };
    draw();
  }
  document.addEventListener('keydown', (e) => keyHandler && keyHandler(e));

  // ---------- mock exam ----------
  function pickMock(count) {
    const pool = {};
    const seen = new Set();
    SETS.forEach((s) => s.questions.forEach((q) => {
      if (seen.has(q.question)) return;
      seen.add(q.question);
      (pool[q.domain] = pool[q.domain] || []).push(q);
    }));
    // largest-remainder allocation by exam weight
    const raw = C.domains.map((d) => ({ d, x: (count * d.weight) / 100 }));
    const alloc = raw.map((r) => ({ d: r.d, n: Math.floor(r.x), f: r.x - Math.floor(r.x) }));
    let left = count - alloc.reduce((n, a) => n + a.n, 0);
    alloc.slice().sort((a, b) => b.f - a.f).forEach((a) => { if (left > 0) { a.n++; left--; } });
    return alloc.flatMap((a) => shuffle(pool[a.d.name] || []).slice(0, a.n));
  }
  window.CCA.pickMock = pickMock;

  function mock() {
    const best = load().mock;
    app.innerHTML = `
      <h1>Mock exam</h1>
      <div class="card">
        <p>A timed exam-mode attempt. Questions are drawn across all sets and weighted by domain, and answers are revealed only at the end.</p>
        <div class="row">
          <label>Questions <select id="mq"><option value="60">60</option><option value="30">30</option></select></label>
          <label>Time limit <select id="mt"><option value="90">90 minutes</option><option value="60">60 minutes</option><option value="120">120 minutes</option></select></label>
        </div>
        <p class="muted small">The time limit is a practice setting, not an official figure. Aim for roughly 72% or higher, which mirrors the community-reported 720/1000 pass mark.${best ? ` Your best: ${best.best}%, last: ${best.last}%.` : ''}</p>
        <button class="btn" id="go">Start mock exam</button>
      </div>`;
    document.getElementById('go').addEventListener('click', () => {
      const n = Number(document.getElementById('mq').value);
      const qs = pickMock(n);
      if (!qs.length) { alert('No questions available.'); return; }
      start({ id: '__mock', title: `Mock exam (${qs.length} questions)`, questions: qs }, true,
        { mode: 'exam', shufOpts: true, shufQs: true, minutes: Number(document.getElementById('mt').value) });
    });
  }

  // ---------- router ----------
  const routes = {
    '': [landing, 'Claude Certified Architect Practice Questions (Free, Original)'],
    overview: [overview, 'Exam overview and study plan'],
    guide: [guide, 'Study guide'],
    cheatsheet: [cheatsheet, 'Cheat sheet'],
    quiz: [quizHome, 'Quiz'],
    mock: [mock, 'Mock exam'],
    flashcards: [flashcards, 'Flashcards'],
    antipatterns: [antipatterns, 'Anti-patterns']
  };
  function route() {
    keyHandler = null;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const r = routes[parts[0]] ? parts[0] : '';
    document.title = (r ? routes[r][1] + ' | ' : '') + 'Claude Architect Practice';
    if (!r) document.title = routes[''][1] + ' | Claude Architect Practice';
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === r));
    routes[r][0](parts[1]);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
