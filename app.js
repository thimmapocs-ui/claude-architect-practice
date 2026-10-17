(function () {
  'use strict';

  const SETS = window.QUESTION_SETS || [];
  const STORE_KEY = 'cca-practice-v1';
  const app = document.getElementById('app');

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Minimal formatting: `code` and blank-line paragraphs.
  const fmt = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  const paras = (s) => String(s).split(/\n\s*\n/).map((p) => `<p>${fmt(p.trim())}</p>`).join('');
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } };
  const save = (d) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } };
  const correctIdx = (q) => q.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  const isRight = (q, sel) => {
    const c = correctIdx(q);
    return sel.length === c.length && c.every((i) => sel.includes(i));
  };
  const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);

  let S = null; // active attempt

  // ---------- home ----------
  function home() {
    stopTimer();
    S = null;
    const progress = load();
    const domains = [...new Set(SETS.flatMap((s) => s.questions.map((q) => q.domain)))];
    app.innerHTML = `
      <h1>Free practice for Claude Certified Architect – Foundations</h1>
      <p class="muted">Original, scenario-based questions. Every option has an explanation, so you learn why the wrong answers are wrong.
      Your progress is saved only in this browser.</p>

      <div class="card">
        <div class="row">
          <label>Mode
            <select id="mode">
              <option value="practice">Practice (feedback after each question)</option>
              <option value="exam">Exam (feedback at the end)</option>
            </select>
          </label>
          <label><input type="checkbox" id="shuf" checked> Shuffle options</label>
          <label><input type="checkbox" id="shufq"> Shuffle questions</label>
        </div>
      </div>

      <div class="grid">
        ${SETS.map((s) => {
          const p = progress[s.id];
          return `<div class="card set-card">
            <h2>${esc(s.title)}</h2>
            <p class="muted">${esc(s.description || '')}</p>
            <p class="muted">${s.questions.length} questions${p ? ` · Best ${p.best}% · Last ${p.last}%` : ''}</p>
            <button class="btn" data-start="${esc(s.id)}">Start</button>
          </div>`;
        }).join('')}
        <div class="card set-card">
          <h2>Mixed: all sets</h2>
          <p class="muted">Every question from every set, shuffled.</p>
          <p class="muted">${SETS.reduce((n, s) => n + s.questions.length, 0)} questions</p>
          <button class="btn" data-start="__all">Start</button>
        </div>
      </div>

      <div class="card">
        <h2>Practice by domain</h2>
        <div class="row">${domains.map((d) => `<button class="btn ghost" data-domain="${esc(d)}">${esc(d)}</button>`).join('')}</div>
      </div>`;

    app.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.start;
      if (id === '__all') {
        start({ id: '__all', title: 'Mixed: all sets', questions: SETS.flatMap((s) => s.questions) }, true);
      } else {
        start(SETS.find((s) => s.id === id));
      }
    }));
    app.querySelectorAll('[data-domain]').forEach((b) => b.addEventListener('click', () => {
      const d = b.dataset.domain;
      start({ id: '__domain:' + d, title: 'Domain: ' + d, questions: SETS.flatMap((s) => s.questions).filter((q) => q.domain === d) }, true);
    }));
  }

  // ---------- attempt ----------
  let timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function tick() {
    if (!S || !S.deadline) { stopTimer(); return; }
    const left = Math.max(0, Math.round((S.deadline - Date.now()) / 1000));
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      el.classList.toggle('low', left <= 300);
    }
    if (left <= 0) { stopTimer(); results(); }
  }

  // cfg (optional): { mode, shufOpts, shufQs, minutes }. Without it, the hub controls are read.
  function start(set, forceShuffleQs, cfg) {
    const c = cfg || {
      mode: document.getElementById('mode').value,
      shufOpts: document.getElementById('shuf').checked,
      shufQs: forceShuffleQs || document.getElementById('shufq').checked
    };
    const qs = (c.shufQs ? shuffle(set.questions) : set.questions).map((q) => ({ ...q, options: c.shufOpts ? shuffle(q.options) : q.options.slice() }));
    stopTimer();
    S = { set, mode: c.mode, qs, idx: 0, sel: qs.map(() => []), checked: qs.map(() => false), flags: qs.map(() => false),
      deadline: c.minutes ? Date.now() + c.minutes * 60000 : null };
    if (S.deadline) timerId = setInterval(tick, 1000);
    renderQ();
    tick();
    window.scrollTo(0, 0);
  }

  function renderQ() {
    const q = S.qs[S.idx];
    const need = correctIdx(q).length;
    const multi = need > 1;
    const sel = S.sel[S.idx];
    const reveal = S.checked[S.idx];
    const answered = S.sel.filter((s) => s.length).length;

    app.innerHTML = `
      <div class="row spread">
        <div><strong>${esc(S.set.title)}</strong> <span class="muted">· ${S.mode === 'exam' ? 'Exam' : 'Practice'} mode</span></div>
        <div class="row">${S.deadline ? '<span class="timer" id="timer" aria-label="Time left"></span>' : ''}<button class="btn ghost" id="quit">Exit</button></div>
      </div>
      <div class="bar" style="margin:10px 0"><span style="width:${pct(answered, S.qs.length)}%"></span></div>
      <div class="palette">${S.qs.map((qq, i) => {
        let cls = i === S.idx ? 'cur' : '';
        if (S.checked[i]) cls += isRight(qq, S.sel[i]) ? ' ok' : ' bad';
        else if (S.sel[i].length) cls += ' ans';
        if (S.flags[i]) cls += ' flag';
        return `<button class="${cls}" data-go="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`;
      }).join('')}</div>

      <div class="card">
        <div class="row spread">
          <span class="muted">Question ${S.idx + 1} of ${S.qs.length}</span>
          <span class="pill">${esc(q.domain)}</span>
        </div>
        ${q.scenario ? `<div class="scenario"><strong>Scenario:</strong> ${fmt(q.scenario)}</div>` : ''}
        <h2>${fmt(q.question)}</h2>
        ${multi ? `<p class="muted">Select ${need}.</p>` : ''}
        <div class="opts">
          ${q.options.map((o, i) => {
            const chosen = sel.includes(i);
            let cls = chosen ? 'sel' : '';
            let verdict = '';
            if (reveal) {
              if (o.correct) { cls = 'right'; verdict = `<span class="verdict ok">${chosen ? 'Correct — your choice' : 'Correct answer'}</span>`; }
              else if (chosen) { cls = 'wrong'; verdict = '<span class="verdict bad">Your choice — incorrect</span>'; }
            }
            return `<label class="${cls}">
              <input type="${multi ? 'checkbox' : 'radio'}" name="opt" value="${i}" ${chosen ? 'checked' : ''} ${reveal ? 'disabled' : ''}>
              <div>${fmt(o.text)}${reveal ? `<div>${verdict}</div><div class="why">${fmt(o.why)}</div>` : ''}</div>
            </label>`;
          }).join('')}
        </div>
        ${reveal ? `<div class="explain"><strong>Explanation</strong>${paras(q.explanation)}
          ${q.refs && q.refs.length ? `<div class="refs">Read more: ${q.refs.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>`).join(' · ')}</div>` : ''}</div>` : ''}
      </div>

      <div class="row spread">
        <div class="row">
          <button class="btn ghost" id="prev" ${S.idx === 0 ? 'disabled' : ''}>Previous</button>
          <button class="btn ghost" id="flag">${S.flags[S.idx] ? 'Unflag' : 'Flag for review'}</button>
        </div>
        <div class="row">
          ${S.mode === 'practice' && !reveal ? `<button class="btn" id="check" ${sel.length !== need ? 'disabled' : ''}>Check answer</button>` : ''}
          ${S.idx < S.qs.length - 1 ? '<button class="btn ghost" id="next">Next</button>' : ''}
          <button class="btn" id="finish">Finish</button>
        </div>
      </div>`;

    app.querySelectorAll('input[name="opt"]').forEach((inp) => inp.addEventListener('change', () => {
      const i = Number(inp.value);
      if (multi) {
        S.sel[S.idx] = inp.checked ? [...sel.filter((x) => x !== i), i] : sel.filter((x) => x !== i);
        if (S.sel[S.idx].length > need) S.sel[S.idx] = S.sel[S.idx].slice(-need); // keep the latest picks
      } else {
        S.sel[S.idx] = [i];
      }
      renderQ();
    }));
    app.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { S.idx = Number(b.dataset.go); renderQ(); }));
    on('#quit', () => { if (confirm('Exit this attempt? Progress in this attempt will be lost.')) home(); });
    on('#prev', () => { S.idx--; renderQ(); });
    on('#next', () => { S.idx++; renderQ(); window.scrollTo(0, 0); });
    on('#flag', () => { S.flags[S.idx] = !S.flags[S.idx]; renderQ(); });
    on('#check', () => { S.checked[S.idx] = true; renderQ(); });
    on('#finish', () => {
      const left = S.qs.length - answered;
      if (left && !confirm(`${left} question(s) unanswered. Finish anyway?`)) return;
      results();
    });
  }

  function on(sel, fn) { const el = app.querySelector(sel); if (el) el.addEventListener('click', fn); }

  // ---------- results ----------
  function results() {
    const right = S.qs.filter((q, i) => isRight(q, S.sel[i])).length;
    const score = pct(right, S.qs.length);
    const byDomain = {};
    S.qs.forEach((q, i) => {
      const d = (byDomain[q.domain] = byDomain[q.domain] || { n: 0, r: 0 });
      d.n++; if (isRight(q, S.sel[i])) d.r++;
    });

    stopTimer();
    const key = S.set.id === '__mock' ? 'mock' : S.set.id;
    if (!S.set.id.startsWith('__') || key === 'mock') {
      const p = load();
      const prev = p[key] || { best: 0 };
      p[key] = { best: Math.max(prev.best, score), last: score, at: new Date().toISOString() };
      save(p);
    }

    app.innerHTML = `
      <div class="card">
        <h1>${esc(S.set.title)} — results</h1>
        <div class="score">${score}%</div>
        <p class="muted">${right} of ${S.qs.length} correct. Treat 72% or higher as a reasonable practice target.</p>
        <table><tr><th>Domain</th><th>Score</th><th style="width:40%"></th></tr>
          ${Object.entries(byDomain).map(([d, v]) => `<tr><td>${esc(d)}</td><td>${v.r}/${v.n}</td>
            <td><div class="bar"><span style="width:${pct(v.r, v.n)}%"></span></div></td></tr>`).join('')}
        </table>
        <div class="row" style="margin-top:14px">
          <button class="btn" id="review">Review all answers</button>
          <button class="btn ghost" id="reviewWrong">Review incorrect only</button>
          <button class="btn ghost" id="again">Back to sets</button>
        </div>
      </div>`;

    const review = (onlyWrong) => {
      const keep = S.qs.map((q, i) => i).filter((i) => !onlyWrong || !isRight(S.qs[i], S.sel[i]));
      if (!keep.length) { alert('Nothing to review — all correct!'); return; }
      S = { ...S, mode: 'practice', qs: keep.map((i) => S.qs[i]), sel: keep.map((i) => S.sel[i]),
        checked: keep.map(() => true), flags: keep.map((i) => S.flags[i]), idx: 0, deadline: null };
      renderQ();
    };
    on('#review', () => review(false));
    on('#reviewWrong', () => review(true));
    on('#again', home);
  }

  // pages.js owns routing and calls CCA.quizHome for #/quiz
  window.CCA = { SETS, quizHome: home, start, shuffle, esc, fmt, pct, load };
})();
