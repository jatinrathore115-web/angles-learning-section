/* CHAPTER 5 — PROVE IT (F13–F19). Quieter stage, sharper geometry.
   The figure sits beside a panel that holds only the proof itself. */
(function () {
  const { LAYOUT, cross, showCross, lineTrace, oppConnector, dimOthers } = Lab;
  const PAIR = ['mag', 'cyan', 'mag', 'cyan'];
  const NAMES = { a1: '∠1', a2: '∠2', a3: '∠3', a4: '∠4' };
  const COLOR = { a1: 'mag', a2: 'cyan', a3: 'mag', a4: 'cyan' };
  /** the straight line that makes two angles a linear pair (their outer arms) */
  const PAIR_LINE = { 'a1|a2': ['OA', 'OB'], 'a2|a3': ['OC', 'OD'], 'a3|a4': ['OA', 'OB'], 'a1|a4': ['OC', 'OD'] };
  const lineOf = (x, y) => PAIR_LINE[[x, y].sort().join('|')];
  const ARMS = { a1: ['OB', 'OC'], a2: ['OC', 'OA'], a3: ['OA', 'OD'], a4: ['OD', 'OB'] };

  function proofFigure(S) {
    cross(S, { layout: 'crossPanel', colors: PAIR });
    const O = LAYOUT.crossPanel.O; UI.setFocus(O.x, O.y);
  }
  const T = (id, extra = '') => `<span class="tok c-${COLOR[id]} ${extra}" data-k="${id}">${NAMES[id]}</span>`;
  const OP = (s, k = '') => `<span class="op tok" data-k="${k}" style="min-width:0;padding:0 2px">${s}</span>`;
  const lockSvg = '<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="#34f5c5" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const doneRow = (a, b) => `<div class="prow lockd done"><div class="eq sm">${T(a)}${OP('+')}${T(b)}${OP('=')}<span class="tok">180°</span></div><span class="why">Linear pair</span></div>`;

  /** reason chips with the same instant feedback as the answer dropdowns */
  function reasons(ctx, container, { correct, onResult }) {
    const opts = [['lp', 'Linear pair'], ['vo', 'Vertically opposite'], ['mv', 'Measured values']];
    container.innerHTML = opts.map(([k, t]) => `<button class="reason" data-k="${k}">${t}</button>`).join('');
    const btns = [...container.querySelectorAll('.reason')];
    let ok = false;
    btns.forEach(b => ctx.on(b, 'click', () => {
      if (ok || b.disabled) return;
      if (correct.includes(b.dataset.k)) {
        ok = true; b.classList.add('ok'); UI.correct({ small: true });
        btns.forEach(x => { x.disabled = true; if (x !== b) x.style.opacity = .35; });
      } else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); b.disabled = true; }
      onResult(ok, b.dataset.k);
    }));
    return { get ok() { return ok; } };
  }

  /** one proof step: tokens fly from the diagram into "∠x + ∠y = ?", then total + reason */
  async function proofStep(ctx, S, { a, b, prior = '' }) {
    dimOthers(S, [a, b]);
    UI.Panel.set(`${prior}
      <div class="prow cur"><div class="eq sm">${T(a, 'ghost')}${OP('+')}${T(b, 'ghost')}${OP('=')}<span class="ans">${UI.pickHTML('sum')}</span></div>${lockSvg}</div>
      <div class="reasons"></div>`);
    const [ra, rb] = lineOf(a, b);
    const common = ARMS[a].find(r => ARMS[b].includes(r));
    await ctx.sayDo(`${NAMES[a]} and ${NAMES[b]} form a *linear pair.*`, async () => {
      S.pulseMany([a, b], 800);
      if (common) S.pulse(common, 800);
      await lineTrace(S, ra, rb, { color: 'gold', dur: 1000, hold: 300 });
    }, 300);
    for (const id of [a, b]) {
      const tok = UI.Panel.q(`.prow.cur .tok[data-k="${id}"]`);
      S.pulse(id, 600);
      await ctx.$(UI.fly(NAMES[id], S.get(id).labelPoint(), tok, { dur: 650, onArrive: () => tok.classList.remove('ghost') }));
    }
    let finish; const solved = ctx.until(r => finish = r);
    const miss = text => { UI.incorrect(); ctx.sayNow(text, { tone: 'warn' }); };
    const both = () => { if (pk.ok && rs.ok) finish(); };
    const pk = UI.pick(UI.Panel.q('.prow.cur .pick'), {
      options: [90, 180, 360], correct: 180, label: `${NAMES[a]} plus ${NAMES[b]}`,
      onResult: (ok, v) => ok ? both() : miss(v === 90
        ? `90° is a right angle. These two fill a *straight line.*`
        : `360° is a full turn. These two fill only a *straight line.*`),
    });
    const rs = reasons(ctx, UI.Panel.q('.reasons'), {
      correct: ['lp'],
      onResult: (ok, k) => ok ? both() : miss(k === 'vo' ? `They are *next to* each other, not opposite.` : 'A proof cannot rely on *measuring.*'),
    });
    ctx.ready();
    await ctx.say('Choose the *total*, then the *reason.*');
    ctx.idle(() => { pk.ok ? S.pulseMany([a, b], 800) : pk.hint(); });
    await solved;
    // the solved step settles into the same two-line form as a finished row: equation, then its reason
    const row = UI.Panel.q('.prow.cur');
    row.querySelector('.ans').innerHTML = '<span class="tok okc">180°</span>';
    row.querySelector('.lock').remove();
    row.classList.add('lockd', 'done');
    row.insertAdjacentHTML('beforeend', '<span class="why">Linear pair</span>');
    const chips = UI.Panel.q('.reasons');
    chips.style.transition = 'opacity .3s'; chips.style.opacity = 0;
    setTimeout(() => chips.remove(), 320);
    Sound.play('equation.snap');
  }

  /* ===================================================== F13 */
  const F13 = {
    id: 'F13', chapter: 4, topic: 'PROOF', topicShort: 'Proof goal', quiet: true,
    title: 'Can we show *∠1 = ∠3* without measuring?',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      UI.Panel.set(`
        <div class="rv p-k">Given</div><div class="rv p-t">AB and CD are straight lines.</div>
        <div class="p-sep"></div>
        <div class="rv p-k">To show</div><div class="rv eq">${T('a1')}${OP('=')}${T('a3')}</div>`);
      await ctx.say('Can we show *∠1 = ∠3* without measuring?');
      await ctx.$(UI.Panel.reveal());
      ctx.sayNow('Tap the two angles we want to *compare.*');   // input is live while the prompt is spoken
      ctx.ready();
      const left = new Set(['a1', 'a3']);
      let finish; const got = ctx.until(r => finish = r);
      ['a1', 'a2', 'a3', 'a4'].forEach(id => S.tap(id, () => {
        if (left.has(id)) { left.delete(id); Sound.play('equation.snap'); S.get(id).to({ ring: 1 }, 300); S.pulse(id, 700); if (!left.size) finish(); }
        else if (id === 'a2' || id === 'a4') { UI.incorrect(); ctx.sayNow('We want ∠1 and the angle *opposite* it.', { tone: 'warn' }); }
      }));
      ctx.idle(() => S.pulse([...left][0], 800));
      await got;
      S.clearInteractions();
      await ctx.good('Goal: prove *∠1 = ∠3* with reasons, not a protractor.');
      ctx.complete();
    },
  };

  /* ===================================================== F14 */
  const F14 = {
    id: 'F14', chapter: 4, topic: 'PROOF · STEP 1', topicShort: 'Proof step 1', quiet: true,
    title: '∠1 and ∠2 form a *linear pair.*',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      await proofStep(ctx, S, { a: 'a1', b: 'a2' });
      await ctx.good('∠1 + ∠2 = 180°, a *linear pair.*');
      ctx.complete();
    },
  };

  /* ===================================================== F15 */
  const F15 = {
    id: 'F15', chapter: 4, topic: 'PROOF · STEP 2', topicShort: 'Proof step 2', quiet: true,
    title: '∠2 and ∠3 form a *linear pair.*',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      await proofStep(ctx, S, { a: 'a2', b: 'a3', prior: doneRow('a1', 'a2') });
      UI.Panel.qa('.prow .tok').filter(t => t.textContent === '180°').forEach(t => t.classList.add('hl'));
      await ctx.good('Notice: *both* totals are 180°.');
      ctx.complete();
    },
  };

  /* ===================================================== F16 */
  const F16 = {
    id: 'F16', chapter: 4, topic: 'PROOF · STEP 3', topicShort: 'Proof step 3', quiet: true,
    title: 'Tap the two equal *totals.*',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      UI.Panel.set(`
        <div class="prow lockd" data-r="1"><div class="eq sm">${T('a1')}${OP('+')}${T('a2')}${OP('=')}<span class="tok tap" data-t="1">180°</span></div></div>
        <div class="prow lockd" data-r="2"><div class="eq sm">${T('a2')}${OP('+')}${T('a3')}${OP('=')}<span class="tok tap" data-t="2">180°</span></div></div>
        <div class="p-sep"></div>
        <div class="prow" style="justify-content:center"><div class="eq sm"><span class="tok ghost" data-k="L">∠1 + ∠2</span>${OP('=')}<span class="tok ghost" data-k="R">∠2 + ∠3</span></div></div>`);
      ctx.sayNow('Tap the two equal *totals.*');   // input is live while the prompt is spoken
      ctx.ready();
      const left = new Set(['1', '2']);
      let finish; const got = ctx.until(r => finish = r);
      UI.Panel.qa('.tok.tap').forEach(t => ctx.on(t, 'click', () => {
        if (!left.has(t.dataset.t)) return;
        left.delete(t.dataset.t); t.classList.remove('tap'); t.classList.add('hl'); Sound.play('ui.select');
        if (!left.size) finish();
      }));
      ctx.idle(() => UI.Panel.qa('.tok.tap').forEach(t => t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 600 })));
      await got;
      ctx.state('EXPLAIN');
      UI.Panel.qa('[data-t]').forEach(t => { t.classList.remove('hl'); t.classList.add('okc'); });
      Sound.play('equation.snap');
      await ctx.sayDo('Both expressions equal the *same value.*', async () => {
        const L = UI.Panel.q('[data-k="L"]'), R = UI.Panel.q('[data-k="R"]');
        const r1 = UI.rectOf(UI.Panel.q('[data-r="1"] .eq')), r2 = UI.rectOf(UI.Panel.q('[data-r="2"] .eq'));
        await UI.fly('∠1 + ∠2', { x: r1.x + 90, y: r1.cy }, L, { dur: 800, onArrive: () => L.classList.remove('ghost') });
        await UI.fly('∠2 + ∠3', { x: r2.x + 90, y: r2.cy }, R, { dur: 800, onArrive: () => R.classList.remove('ghost') });
      }, 500);
      await ctx.good('So *∠1 + ∠2 = ∠2 + ∠3.*');
      ctx.complete();
    },
  };

  /* ===================================================== PROOF CANCELLATION */
  async function cancel(ctx, panelSel, keys) {
    const toks = keys.map(k => UI.Panel.q(`${panelSel} [data-k="${k}"]`));
    toks.forEach(t => t.classList.add('cancel'));
    Sound.play('equation.snap');
    await ctx.wait(650);
    toks.forEach(t => t.classList.add('gone'));
    await ctx.wait(500);
    Sound.play('proof.resolve');
  }

  /* ===================================================== F17 */
  const F17 = {
    id: 'F17', chapter: 4, topic: 'PROOF · STEP 4', topicShort: 'Proof step 4', quiet: true,
    title: 'The same *∠2* appears on both sides.',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      UI.Panel.set(`
        <div class="prow big" style="justify-content:center;padding:26px 10px"><div class="eq">
          <span class="tok c-mag" data-k="L1">∠1</span>${OP('+', 'Lp')}<span class="tok c-cyan tap" data-k="L2">∠2</span>${OP('=')}<span class="tok c-cyan tap" data-k="R2">∠2</span>${OP('+', 'Rp')}<span class="tok c-mag" data-k="R3">∠3</span>
        </div></div>`);
      const two = ['L2', 'R2'].map(k => UI.Panel.q(`[data-k="${k}"]`));
      await ctx.sayDo('The same *∠2* appears on both sides.', async () => {
        two.forEach(t => t.classList.add('hl')); S.pulse('a2', 900);
        await Tween.sleep(900); two.forEach(t => t.classList.remove('hl'));
      }, 600);
      ctx.sayNow('Tap *∠2* on each side.');   // input is live while the prompt is spoken
      ctx.ready();
      const left = new Set(['L2', 'R2']);
      let finish; const got = ctx.until(r => finish = r);
      UI.Panel.qa('.prow .tok[data-k]').forEach(t => ctx.on(t, 'click', () => {
        if (!S.enabled) return;
        const k = t.dataset.k;
        if (left.has(k)) { left.delete(k); t.classList.remove('tap'); t.classList.add('hl'); Sound.play('ui.select'); if (!left.size) finish(); }
        else if (k === 'L1' || k === 'R3') { UI.incorrect(); ctx.sayNow('That angle is on only *one side.*', { tone: 'warn' }); }
      }));
      ctx.idle(() => two.forEach(t => t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 600 })));
      await got;
      ctx.state('EXPLAIN');
      await ctx.say('Subtract it from *both sides.*');
      await cancel(ctx, '.prow.big', ['Lp', 'L2', 'R2', 'Rp']);
      dimOthers(S, ['a1', 'a3']);
      S.get('a1').to({ ring: 1 }, 300); S.get('a3').to({ ring: 1 }, 300);
      oppConnector(S, 'a1', 'a3');
      await ctx.good('*∠1 = ∠3* — proved without measuring.');
      ctx.complete();
    },
  };

  /* ===================================================== F18 */
  const F18 = {
    id: 'F18', chapter: 4, topic: 'PROOF · SECOND PAIR', topicShort: 'CFU: prove ∠2 = ∠4', quiet: true, cfu: true,
    title: 'Now show *∠2 = ∠4.*',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      dimOthers(S, ['a2', 'a4']);
      await ctx.say('Now show *∠2 = ∠4.*');
      const chips = r => `<div class="reasons" data-row="${r}"><button class="reason ang" data-v="a1">∠1</button><button class="reason ang" data-v="a3">∠3</button></div>`;
      UI.Panel.set(`
        <div class="prow" data-row="1"><div class="eq sm">${T('a2')}${OP('+')}<span class="slot" data-s="1">?</span>${OP('=')}<span class="tok">180°</span></div>${chips(1)}</div>
        <div class="prow" data-row="2"><div class="eq sm">${T('a4')}${OP('+')}<span class="slot" data-s="2">?</span>${OP('=')}<span class="tok">180°</span></div>${chips(2)}</div>
        <div class="prow res" style="justify-content:center;opacity:0;transition:opacity .4s"><div class="eq sm">
          <span class="tok c-cyan" data-k="A">∠2</span>${OP('+', 'Ap')}<span class="tok" data-k="X1">∠x</span>${OP('=')}<span class="tok c-cyan" data-k="B">∠4</span>${OP('+', 'Bp')}<span class="tok" data-k="X2">∠x</span>
        </div></div>`);
      UI.Panel.qa('.prow[data-row]').forEach(r => { r.style.flexDirection = 'column'; r.style.alignItems = 'stretch'; });
      ctx.sayNow('Which angle pairs with *both* ∠2 and ∠4?');   // input is live while the prompt is spoken
      ctx.ready(); ctx.check(false);
      const pick = { 1: null, 2: null };
      const rowAngle = { 1: 'a2', 2: 'a4' };
      UI.Panel.qa('.reasons[data-row] .reason').forEach(b => ctx.on(b, 'click', () => {
        if (!S.enabled || b.disabled) return;
        const row = b.parentElement.dataset.row, v = b.dataset.v;
        b.parentElement.querySelectorAll('.reason').forEach(x => x.classList.remove('sel', 'bad'));
        b.classList.add('sel'); pick[row] = v;
        const slot = UI.Panel.q(`.slot[data-s="${row}"]`);
        slot.textContent = NAMES[v]; slot.classList.add('filled');
        Sound.play('equation.snap');
        S.get(v).to({ dim: 0 }, 200); S.pulseMany([v, rowAngle[row]], 700);
        const [r1, r2] = lineOf(v, rowAngle[row]);
        lineTrace(S, r1, r2, { color: 'gold', dur: 700, hold: 200 });
        ctx.enableCheck(!!(pick[1] && pick[2]));
      }));
      ctx.idle(() => S.pulseMany(['a1', 'a3'], 800));
      for (; ;) {
        await ctx.waitCheck();
        if (pick[1] && pick[1] === pick[2]) break;
        await ctx.bad('Both are true — but to cancel, use the *same* angle in both.');
        ctx.state('AWAIT_CHECK');
      }
      UI.Panel.qa('.reasons[data-row] .reason').forEach(b => { b.disabled = true; if (!b.classList.contains('sel')) b.style.opacity = .35; else b.classList.add('ok'); });
      const x = NAMES[pick[1]];
      UI.Panel.qa('[data-k="X1"],[data-k="X2"]').forEach(t => { t.textContent = x; t.classList.add('c-' + COLOR[pick[1]]); });
      UI.Panel.q('.prow.res').style.opacity = 1;
      UI.correct();
      await ctx.say(`Both are 180°, so *∠2 + ${x} = ∠4 + ${x}.*`);
      await cancel(ctx, '.prow.res', ['Ap', 'X1', 'X2', 'Bp']);
      dimOthers(S, ['a2', 'a4']);
      S.get('a2').to({ ring: 1 }, 300); S.get('a4').to({ ring: 1 }, 300);
      oppConnector(S, 'a2', 'a4');
      await ctx.good('Same reasoning, different pair: *∠2 = ∠4.*');
      ctx.complete();
    },
  };

  /* ===================================================== F19 */
  const F19 = {
    id: 'F19', chapter: 4, topic: 'THEOREM', topicShort: 'Vertically Opposite Angles', quiet: true,
    title: 'Tap an angle to see its *opposite pair.*',
    async run(ctx, S) {
      proofFigure(S);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      UI.Panel.set(`
        <div class="prow" data-p="1" style="justify-content:center;opacity:.25"><div class="eq">${T('a1')}${OP('=')}${T('a3')}</div></div>
        <div class="prow" data-p="2" style="justify-content:center;opacity:.25"><div class="eq">${T('a2')}${OP('=')}${T('a4')}</div></div>
        <div class="theorem" style="position:relative;left:50%;width:100%;padding:18px 16px;margin-top:6px">
          <div class="theorem-k">THEOREM</div>
          <div class="theorem-t" style="font-size:24px">VERTICALLY OPPOSITE ANGLES</div>
          <div class="theorem-s" style="font-size:16px">If two lines intersect, the vertically opposite angles are equal.</div>
        </div>`);
      ctx.sayNow('Tap an angle to see its *opposite pair.*');   // input is live while the prompt is spoken
      ctx.ready();
      const left = new Set(['1', '2']);
      let finish; const got = ctx.until(r => finish = r);
      const showPair = p => {
        if (!left.has(p)) return;
        left.delete(p);
        const [a, b] = p === '1' ? ['a1', 'a3'] : ['a2', 'a4'];
        S.pulseMany([a, b], 800); S.get(a).to({ ring: 1 }, 300); S.get(b).to({ ring: 1 }, 300);
        oppConnector(S, a, b);
        const row = UI.Panel.q(`[data-p="${p}"]`); row.style.opacity = 1; row.classList.add('lockd');
        Sound.play('equation.snap');
        if (!left.size) finish();
      };
      ['a1', 'a3'].forEach(id => S.tap(id, () => showPair('1')));
      ['a2', 'a4'].forEach(id => S.tap(id, () => showPair('2')));
      ctx.idle(() => S.pulse(left.has('1') ? 'a1' : 'a2', 800));
      await got;
      S.clearInteractions();
      ctx.state('EXPLAIN');
      await ctx.wait(700);
      ['a1', 'a2', 'a3', 'a4'].forEach(id => S.get(id).to({ ring: 0 }, 300));
      UI.Panel.q('.theorem').classList.add('in');
      Sound.play('proof.resolve');
      S.ripple(S.pt('O'), 'gold', 2.4);
      await ctx.say('Vertically opposite angles are *always equal.*', { tone: 'good' });
      ctx.complete();
    },
  };

  Engine.register([F13, F14, F15, F16, F17, F18, F19]);
})();
