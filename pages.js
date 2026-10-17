(function () {
  'use strict';
  const { SETS, quizHome, start, shuffle, esc, fmt, pct, load, save, qid, dayKey } = window.CCA;
  const C = window.CCA_CONTENT;
  const app = document.getElementById('app');
  const DAY = 86400000;
  const BOX_DAYS = [0, 1, 3, 7, 14];
  let keyHandler = null;

  // ---------- data helpers ----------
  const all = [];
  { const seen = new Set(); SETS.forEach((s) => s.questions.forEach((q) => { const id = qid(q); if (!seen.has(id)) { seen.add(id); all.push({ q, id, d: q.domain }); } })); }
  const domainName = (k) => C.names[k];
  const link = (r, label, cls) => `<a class="${cls || 'btn'}" href="#/${r}">${label}</a>`;
  const $ = (id) => document.getElementById(id);

  function mutate(fn) { const p = load(); fn(p); save(p); return p; }
  function markDay() { mutate((p) => { p.days = p.days || []; const t = dayKey(); if (!p.days.includes(t)) p.days.push(t); }); }

  function stats() {
    const p = load(), qs = p.q || {}, by = {};
    C.domains.forEach((d) => { by[d.name] = { d, total: 0, att: 0, ok: 0 }; });
    all.forEach((x) => { const b = by[x.d]; if (!b) return; b.total++; const r = qs[x.id]; if (r) { b.att++; b.ok += r.last; } });
    let w = 0, s = 0, att = 0;
    Object.values(by).forEach((b) => { att += b.att; if (b.att) { w += b.d.weight; s += (b.d.weight * b.ok) / b.att; } });
    return { p, by, att, ready: att >= 10 && w ? Math.round((100 * s) / w) : null };
  }

  function streak(p) {
    const days = new Set(p.days || []);
    let d = new Date();
    if (!days.has(dayKey(d))) d = new Date(d.getTime() - DAY);
    let n = 0;
    while (days.has(dayKey(d))) { n++; d = new Date(d.getTime() - DAY); }
    return n;
  }

  // Missed questions first (oldest miss first), then unseen, then the weakest of the rest.
  function ordered(filterFn) {
    const qs = load().q || {}, wrong = [], unseen = [], rest = [];
    all.filter(filterFn || (() => true)).forEach((x) => { const r = qs[x.id]; if (!r) unseen.push(x); else if (!r.last) wrong.push(x); else rest.push(x); });
    wrong.sort((a, b) => qs[a.id].at - qs[b.id].at);
    rest.sort((a, b) => qs[a.id].r / qs[a.id].n - qs[b.id].r / qs[b.id].n);
    return { wrong: wrong.length, unseen: unseen.length, list: [...wrong, ...shuffle(unseen), ...rest] };
  }

  function seeded(seed) {
    return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function dailyQs() {
    const r = seeded(Number(dayKey().replace(/-/g, '')));
    const a = all.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, 5).map((x) => x.q);
  }

  function pickMock(count) {
    const pool = {};
    all.forEach((x) => { (pool[x.d] = pool[x.d] || []).push(x.q); });
    const raw = C.domains.map((d) => ({ d, x: (count * d.weight) / 100 }));
    const alloc = raw.map((r) => ({ d: r.d, n: Math.floor(r.x), f: r.x - Math.floor(r.x) }));
    let left = count - alloc.reduce((n, a) => n + a.n, 0);
    alloc.slice().sort((a, b) => b.f - a.f).forEach((a) => { if (left > 0) { a.n++; left--; } });
    return alloc.flatMap((a) => shuffle(pool[a.d.name] || []).slice(0, a.n));
  }
  window.CCA.pickMock = pickMock;

  function run(id, title, questions, opts) {
    if (!questions.length) { alert('No questions available.'); return; }
    start({ id, title, questions }, false, Object.assign({ mode: 'practice', shufOpts: true, shufQs: false }, opts || {}));
  }

  window.CCA.onResults = (S, score) => {
    if (S.set.id === '__daily') mutate((p) => { p.daily = { date: dayKey(), score }; });
  };

  // ---------- dashboard ----------
  function ring(v) {
    const r = 52, c = 2 * Math.PI * r, f = v == null ? 0 : (c * v) / 100;
    return `<svg viewBox="0 0 130 130" class="ring" role="img" aria-label="Readiness ${v == null ? 'not yet measured' : v + ' percent'}">
      <circle cx="65" cy="65" r="${r}" class="ring-bg"/><circle cx="65" cy="65" r="${r}" class="ring-fg" stroke-dasharray="${f} ${c}" transform="rotate(-90 65 65)"/>
      <text x="65" y="63" text-anchor="middle" class="ring-n">${v == null ? '–' : v + '%'}</text>
      <text x="65" y="82" text-anchor="middle" class="ring-l">readiness</text></svg>`;
  }

  function dashboard() {
    const { p, by, att, ready } = stats();
    const wk = ordered(), due = dueCards('all').length;
    const dailyDone = p.daily && p.daily.date === dayKey();
    const nextPlan = nextPlanItem(p);
    const empty = att === 0;
    app.innerHTML = `
      <h1>Your prep home</h1>
      <p class="muted">Progress is calculated from your own answers and stays in this browser.</p>
      ${empty ? `<div class="card start">
        <h2>Start with a 10-question baseline</h2>
        <p>It samples every domain by exam weight, so the app can find your weak spots. Takes about 10 minutes.</p>
        <button class="btn" id="baseline">Take the baseline</button></div>` : ''}
      <div class="dash">
        <div class="card center">${ring(ready)}
          <p class="muted small">${ready == null ? 'Answer at least 10 questions to see an estimate.' : `Weighted by domain, from ${att} of ${all.length} questions.`}</p></div>
        <div class="card center"><div class="big">${streak(p)}</div><p class="muted">day streak</p>
          <p class="muted small">Any finished quiz, Daily Practice or recall card counts.</p></div>
        <div class="card mission"><h2>Today</h2>
          <ul class="tasks">
            <li class="${dailyDone ? 'done' : ''}">${link('daily', 'Daily Practice', 'tl')}<span class="muted">${dailyDone ? `done · ${p.daily.score}%` : '5 fresh questions'}</span></li>
            <li>${link('weak', 'Fix My Weak Areas', 'tl')}<span class="muted">${wk.wrong} missed · ${wk.unseen} unseen</span></li>
            <li>${link('recall', 'Flashcards', 'tl')}<span class="muted">${due} due</span></li>
            <li>${link('plan', nextPlan ? esc(nextPlan[0]) : 'Study plan complete', 'tl')}<span class="muted">${nextPlan ? 'next in your plan' : 'nice work'}</span></li>
          </ul></div>
      </div>
      <h2>Mastery by domain</h2>
      <div class="card"><table class="mastery">
        ${Object.values(by).map((b) => {
          const acc = b.att ? Math.round((100 * b.ok) / b.att) : null;
          return `<tr><td><strong>${esc(b.d.name)}</strong><br><span class="muted small">${b.d.weight}% of exam · ${b.att}/${b.total} tried</span></td>
            <td style="width:34%"><div class="bar ${acc != null && acc < 60 ? 'low' : ''}"><span style="width:${acc || 0}%"></span></div></td>
            <td class="num">${acc == null ? '–' : acc + '%'}</td>
            <td><button class="btn ghost sm" data-drill="${esc(b.d.name)}">Drill</button></td></tr>`;
        }).join('')}
      </table></div>
      <div class="row foot-actions">
        <button class="btn ghost sm" id="export">Export progress</button>
        <label class="btn ghost sm">Import progress<input type="file" id="import" accept="application/json" hidden></label>
        <button class="btn ghost sm" id="reset">Reset progress</button>
      </div>`;
    const bl = $('baseline'); if (bl) bl.addEventListener('click', () => run('__baseline', 'Baseline check', pickMock(10)));
    app.querySelectorAll('[data-drill]').forEach((b) => b.addEventListener('click', () => {
      const name = b.dataset.drill;
      run('__drill', 'Drill: ' + name, ordered((x) => x.d === name).list.slice(0, 10).map((x) => x.q));
    }));
    $('export').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' }));
      a.download = 'architect-practice-progress.json'; a.click(); URL.revokeObjectURL(a.href);
    });
    $('import').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => {
        let d; try { d = JSON.parse(t); } catch (err) { alert('That file is not valid JSON.'); return; }
        if (!d || typeof d !== 'object' || Array.isArray(d)) { alert('Unexpected file contents.'); return; }
        if (confirm('Replace your current progress with this file?')) { save(d); dashboard(); }
      });
    });
    $('reset').addEventListener('click', () => { if (confirm('Erase all saved progress in this browser?')) { save({}); dashboard(); } });
  }

  // ---------- daily 5 ----------
  function daily() {
    const p = load(), done = p.daily && p.daily.date === dayKey();
    app.innerHTML = `
      <h1>Daily Practice</h1>
      <div class="card"><p>Five questions that change every day, the same for everyone. A quick habit that keeps your streak alive.</p>
        ${done ? `<p><strong>Done for today:</strong> ${p.daily.score}%. Come back tomorrow, or run it again for practice.</p>` : ''}
        <button class="btn" id="go">${done ? 'Run again' : 'Start today\'s 5'}</button></div>`;
    $('go').addEventListener('click', () => run('__daily', 'Daily Practice · ' + dayKey(), dailyQs()));
  }

  // ---------- weak-spot trainer ----------
  function weak() {
    const o = ordered();
    app.innerHTML = `
      <h1>Fix My Weak Areas</h1>
      <div class="card"><p>Builds a session from what you have missed, then questions you have not seen, then your weakest correct answers.</p>
        <div class="row stat3"><div><b>${o.wrong}</b><span>missed</span></div><div><b>${o.unseen}</b><span>unseen</span></div><div><b>${all.length - o.wrong - o.unseen}</b><span>answered right</span></div></div>
        <div class="row"><label>Session size <select id="n"><option>10</option><option>20</option><option>5</option></select></label>
          <button class="btn" id="go">Start training</button></div></div>`;
    $('go').addEventListener('click', () => run('__weak', 'Fix My Weak Areas', ordered().list.slice(0, Number($('n').value)).map((x) => x.q)));
  }

  // ---------- recall deck (spaced repetition) ----------
  const cid = (c) => qid({ question: c.front });
  function dueCards(filter) {
    const cards = load().cards || {};
    return C.flashcards.filter((c) => (filter === 'all' || c.d === filter) && (!cards[cid(c)] || cards[cid(c)].due <= Date.now()));
  }
  function recall() {
    let filter = 'all', queue = null, flipped = false;
    const counts = () => {
      const cards = load().cards || {}; let nw = 0, learn = 0, mastered = 0;
      C.flashcards.forEach((c) => { const s = cards[cid(c)]; if (!s) nw++; else if (s.box >= 4) mastered++; else learn++; });
      return { nw, learn, mastered };
    };
    const draw = () => {
      const k = counts();
      if (!queue) {
        const d = dueCards(filter);
        app.innerHTML = `
          <h1>Flashcards</h1>
          <p class="muted">Cards you miss come back sooner; cards you know come back later (1, 3, 7, then 14 days).</p>
          <div class="card"><div class="row stat3"><div><b>${k.nw}</b><span>new</span></div><div><b>${k.learn}</b><span>learning</span></div><div><b>${k.mastered}</b><span>mastered</span></div></div>
            <div class="row"><label>Domain <select id="fdom"><option value="all">All domains</option>
              ${C.domains.map((x) => `<option value="${x.key}" ${filter === x.key ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
              <button class="btn" id="go" ${d.length ? '' : 'disabled'}>${d.length ? `Study ${Math.min(d.length, 20)} due card${d.length === 1 ? '' : 's'}` : 'Nothing due'}</button></div></div>`;
        $('fdom').addEventListener('change', (e) => { filter = e.target.value; draw(); });
        $('go').addEventListener('click', () => { queue = shuffle(d).slice(0, 20); flipped = false; draw(); });
        keyHandler = null; return;
      }
      if (!queue.length) { queue = null; markDay(); app.innerHTML = `<h1>Flashcards</h1><div class="card"><h2>Session complete</h2><p>Nice. Cards come back when they are due.</p>${link('recall', 'Back to the deck')} ${link('', 'Dashboard', 'btn ghost')}</div>`; keyHandler = null; return; }
      const c = queue[0];
      app.innerHTML = `
        <div class="row spread"><h1>Flashcards</h1><button class="btn ghost sm" id="stop">End session</button></div>
        <button class="flash ${flipped ? 'flipped' : ''}" id="card" aria-label="Flip card">
          <span class="muted small">${esc(domainName(c.d))} · ${flipped ? 'Answer' : 'Question'}</span>
          <span class="ftext">${fmt(flipped ? c.back : c.front)}</span></button>
        <div class="row spread"><span class="muted">${queue.length} left · Space flips${flipped ? ' · 1 Again · 2 Got it' : ''}</span>
          ${flipped ? '<div class="row"><button class="btn ghost" id="again">Again (1)</button><button class="btn" id="got">Got it (2)</button></div>' : '<button class="btn ghost" id="flip">Show answer</button>'}</div>`;
      const flip = () => { flipped = true; draw(); };
      const rate = (good) => {
        const id = cid(c), cur = (load().cards || {})[id] || { box: 0 };
        const box = good ? Math.min(4, cur.box + 1) : 1;
        mutate((p) => { p.cards = p.cards || {}; p.cards[id] = { box, due: Date.now() + (good ? BOX_DAYS[box] : 0) * DAY }; });
        queue.shift(); if (!good) queue.push(c);
        flipped = false; draw();
      };
      $('card').addEventListener('click', () => { if (!flipped) flip(); });
      $('stop').addEventListener('click', () => { queue = null; draw(); });
      if (flipped) { $('again').addEventListener('click', () => rate(false)); $('got').addEventListener('click', () => rate(true)); }
      else $('flip').addEventListener('click', flip);
      keyHandler = (e) => {
        if (/^(SELECT|INPUT)$/.test((document.activeElement || {}).tagName)) return;
        if (e.key === ' ') { e.preventDefault(); if (!flipped) flip(); }
        else if (flipped && e.key === '1') rate(false);
        else if (flipped && e.key === '2') rate(true);
      };
    };
    draw();
  }

  // ---------- code clinic ----------
  function clinic() {
    const solved = () => load().clinic || {};
    const list = () => {
      const s = solved();
      app.innerHTML = `
        <h1>Fix the Code</h1>
        <p class="muted">Each snippet has one faulty line. Click it. ${Object.keys(s).length} of ${C.clinic.length} fixed.</p>
        <div class="grid">${C.clinic.map((c, i) => `
          <button class="card tcard clin ${s[i] ? 'fixed' : ''}" data-i="${i}">
            <span class="pill">${esc(domainName(c.d).split(' ')[0])}</span>
            <h3>${esc(c.title)}</h3><span class="muted small">${s[i] ? 'Fixed' : 'Not fixed yet'} · ${esc(c.lang)}</span></button>`).join('')}</div>`;
      app.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.i))));
    };
    const open = (i) => {
      const c = C.clinic[i]; let wrong = [], done = false;
      const draw = () => {
        app.innerHTML = `
          <div class="row spread"><h1>${esc(c.title)}</h1><button class="btn ghost sm" id="back">All snippets</button></div>
          <p class="muted">Click the line that causes the problem.</p>
          <div class="code" role="group" aria-label="Code snippet">${c.lines.map((l, n) => `
            <button class="cl ${wrong.includes(n) ? 'wrongline' : ''} ${done && n === c.bug ? 'bugline' : ''}" data-n="${n}" ${done ? 'disabled' : ''}>
              <span class="ln">${n + 1}</span><code>${esc(l) || '&nbsp;'}</code></button>`).join('')}</div>
          ${wrong.length && !done ? `<p class="bad-note">Not that line. ${wrong.length} wrong so far.</p><button class="btn ghost sm" id="show">Show the answer</button>` : ''}
          ${done ? `<div class="explain"><strong>The problem</strong><p>${fmt(c.why)}</p><strong>The fix</strong><p>${fmt(c.fix)}</p></div>
            <div class="row"><button class="btn" id="next">Next snippet</button></div>` : ''}`;
        $('back').addEventListener('click', list);
        app.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => {
          const n = Number(b.dataset.n);
          if (n === c.bug) { done = true; mutate((p) => { p.clinic = p.clinic || {}; p.clinic[i] = 1; }); markDay(); } else if (!wrong.includes(n)) wrong.push(n);
          draw();
        }));
        const sh = $('show'); if (sh) sh.addEventListener('click', () => { done = true; draw(); });
        const nx = $('next'); if (nx) nx.addEventListener('click', () => open((i + 1) % C.clinic.length));
      };
      draw(); window.scrollTo(0, 0);
    };
    list();
  }

  // ---------- study guide ----------
  function guide(sel) {
    app.innerHTML = `
      <h1>Lessons</h1>
      <p class="muted">Short, practical notes per domain. Claude Code details follow the official docs, so check the linked page when versions matter.</p>
      ${C.guide.map((g) => `
        <details class="card" id="g-${g.d}" ${sel === g.d ? 'open' : ''}>
          <summary><strong>${esc(domainName(g.d))}</strong> <span class="pill">${C.domains.find((d) => d.key === g.d).weight}%</span></summary>
          <ul>${g.points.map((x) => `<li>${fmt(x)}</li>`).join('')}</ul>
          <p><strong>In production:</strong> ${fmt(g.prod)}</p>
          <p class="lens"><strong>Salesforce lens:</strong> ${fmt(C.sfLens[g.d])}</p>
          <p class="refs">Docs: ${g.links.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>
        </details>`).join('')}`;
    if (sel) { const el = $('g-' + sel); if (el && el.scrollIntoView) el.scrollIntoView(); }
  }

  // ---------- field notes ----------
  function notes() {
    app.innerHTML = `
      <div class="row spread"><h1>Quick Reference</h1><button class="btn ghost noprint" id="print">Print</button></div>
      ${C.domains.map((d) => `
        <h2>${esc(d.name)}</h2>
        <div class="cheats">${C.cheatsheet.filter((c) => c.d === d.key).map((c) => `
          <div class="card cheat"><h3>${esc(c.title)}</h3><p>${fmt(c.body)}</p>${c.code ? `<pre>${esc(c.code)}</pre>` : ''}</div>`).join('')}</div>`).join('')}`;
    $('print').addEventListener('click', () => window.print());
  }

  // ---------- pitfalls ----------
  function pitfalls() {
    app.innerHTML = `
      <h1>Common Mistakes</h1>
      <p class="muted">Habits that look reasonable but lose points. Each has a better default.</p>
      ${C.antipatterns.map((a, i) => `
        <div class="card ap"><span class="pill">${i + 1}</span><strong>${esc(a.bad)}</strong>
          <p class="why">Why it fails: ${esc(a.why)}</p><p class="fix">Instead: ${fmt(a.fix)}</p></div>`).join('')}`;
  }

  // ---------- full simulation ----------
  function sim() {
    const best = load().mock;
    app.innerHTML = `
      <h1>Mock Exam</h1>
      <div class="card">
        <p>A timed, exam-mode run. Questions are drawn across all sets and weighted by domain, and answers are revealed only at the end.</p>
        <div class="row">
          <label>Questions <select id="mq"><option value="60">60</option><option value="30">30</option></select></label>
          <label>Time limit <select id="mt"><option value="90">90 minutes</option><option value="60">60 minutes</option><option value="120">120 minutes</option></select></label>
        </div>
        <p class="muted small">The time limit is a practice setting, not an official figure. Aim for roughly 72% or higher, which mirrors the community-reported 720/1000 pass mark.${best ? ` Your best: ${best.best}%, last: ${best.last}%.` : ''}</p>
        <button class="btn" id="go">Start simulation</button>
      </div>`;
    $('go').addEventListener('click', () => {
      const qs = pickMock(Number($('mq').value));
      start({ id: '__mock', title: `Mock Exam (${qs.length} questions)`, questions: qs }, true,
        { mode: 'exam', shufOpts: true, shufQs: true, minutes: Number($('mt').value) });
    });
  }

  // ---------- plan ----------
  function nextPlanItem(p) {
    const done = p.plan || {};
    for (let w = 0; w < C.plan.length; w++) for (let i = 0; i < C.plan[w].items.length; i++) if (!done[w + '.' + i]) return C.plan[w].items[i];
    return null;
  }
  function plan() {
    const o = C.overview, p = load(), done = p.plan || {};
    const totalItems = C.plan.reduce((n, w) => n + w.items.length, 0), got = Object.keys(done).length;
    app.innerHTML = `
      <h1>Exam Info & 2-Week Plan</h1>
      <div class="card"><table>${o.facts.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
        <p class="muted small">${esc(o.note)}</p></div>
      <h2>Typical scenarios</h2>
      <ul>${o.scenarios.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <h2>Two-week plan <span class="muted small">${got}/${totalItems} done</span></h2>
      <div class="bar" style="margin-bottom:10px"><span style="width:${pct(got, totalItems)}%"></span></div>
      ${C.plan.map((w, wi) => `<div class="card"><h3>${esc(w.w)} · ${esc(w.t)}</h3>
        ${w.items.map(([t, r], i) => `<label class="chk"><input type="checkbox" data-k="${wi}.${i}" ${done[wi + '.' + i] ? 'checked' : ''}>
          <span>${esc(t)}</span><a href="#/${r}" class="small">Go</a></label>`).join('')}</div>`).join('')}`;
    app.querySelectorAll('[data-k]').forEach((cb) => cb.addEventListener('change', () => {
      mutate((q) => { q.plan = q.plan || {}; if (cb.checked) q.plan[cb.dataset.k] = 1; else delete q.plan[cb.dataset.k]; });
      plan();
    }));
  }

  // ---------- search ----------
  let index = null;
  const strip = (s) => String(s).replace(/`/g, '');
  function buildIndex() {
    const out = [];
    C.guide.forEach((g) => g.points.forEach((x) => out.push({ t: strip(x).slice(0, 90), s: domainName(g.d), r: 'guide/' + g.d, k: 'Guide' })));
    C.cheatsheet.forEach((c) => out.push({ t: c.title, s: strip(c.body), r: 'notes', k: 'Notes' }));
    C.flashcards.forEach((c) => out.push({ t: strip(c.front), s: strip(c.back), r: 'recall', k: 'Recall' }));
    C.antipatterns.forEach((a) => out.push({ t: a.bad, s: strip(a.why + ' ' + a.fix), r: 'pitfalls', k: 'Common Mistake' }));
    C.clinic.forEach((c) => out.push({ t: c.title, s: strip(c.why), r: 'clinic', k: 'Clinic' }));
    all.forEach((x) => out.push({ t: strip(x.q.question).slice(0, 110), s: x.d, r: 'quiz', k: 'Question' }));
    out.forEach((e) => { e.h = (e.t + ' ' + e.s).toLowerCase(); });
    return out;
  }
  function search(term) {
    const terms = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    index = index || buildIndex();
    return index.filter((e) => terms.every((t) => e.h.includes(t)))
      .map((e) => ({ e, sc: terms.reduce((n, t) => n + (e.t.toLowerCase().includes(t) ? 2 : 1), 0) }))
      .sort((a, b) => b.sc - a.sc).slice(0, 12).map((x) => x.e);
  }
  const box = document.createElement('div');
  box.className = 'searchbox'; box.hidden = true;
  box.innerHTML = '<div class="sb-panel" role="dialog" aria-label="Search"><input id="sbq" type="search" placeholder="Search notes, cards, mistakes, questions…" autocomplete="off"><ul id="sbr"></ul><p class="muted small">Enter opens the first result · Esc closes</p></div>';
  document.body.appendChild(box);
  function openSearch() { box.hidden = false; $('sbq').value = ''; $('sbr').innerHTML = ''; $('sbq').focus(); }
  function closeSearch() { box.hidden = true; }
  $('sbq').addEventListener('input', (e) => {
    const res = search(e.target.value);
    $('sbr').innerHTML = res.length ? res.map((x) => `<li><a href="#/${x.r}"><span class="pill">${x.k}</span> ${esc(x.t)}</a></li>`).join('') : (e.target.value ? '<li class="muted">No matches.</li>' : '');
  });
  $('sbq').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = $('sbr').querySelector('a'); if (a) { location.hash = a.getAttribute('href'); closeSearch(); } } });
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('a')) closeSearch(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
    else if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement || {}).tagName))) { e.preventDefault(); openSearch(); }
    else if (keyHandler) keyHandler(e);
  });
  const sb = document.getElementById('searchBtn'); if (sb) sb.addEventListener('click', openSearch);

  // ---------- router ----------
  const routes = {
    '': [dashboard, 'Home'], guide: [guide, 'Lessons'], notes: [notes, 'Quick Reference'], pitfalls: [pitfalls, 'Common Mistakes'],
    quiz: [quizHome, 'Practice Tests'], sim: [sim, 'Mock Exam'], weak: [weak, 'Fix My Weak Areas'], daily: [daily, 'Daily Practice'],
    recall: [recall, 'Flashcards'], clinic: [clinic, 'Fix the Code'], plan: [plan, 'Exam Info and 2-Week Plan']
  };
  const alias = { overview: 'plan', cheatsheet: 'notes', antipatterns: 'pitfalls', mock: 'sim', flashcards: 'recall' };
  function route() {
    keyHandler = null;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const r = routes[alias[parts[0]] || parts[0]] ? (alias[parts[0]] || parts[0]) : '';
    document.title = (r ? routes[r][1] + ' | ' : 'Claude Certified Architect Practice Questions (Free, Original) | ') + 'Claude Architect Practice';
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === r));
    routes[r][0](parts[1]);
    window.scrollTo(0, 0);
  }
  window.CCA.leave = route;
  window.addEventListener('hashchange', route);
  route();
})();
