/* CHAPTER 6 — APPLY & RECALL (F20–F23) */
(function () {
  const { LAYOUT, cross, showCross, lineTrace, oppConnector, dimOthers, eq } = Lab;
  const focus = layout => { const O = LAYOUT[layout].O; UI.setFocus(O.x, O.y); };
  const NAMES = { a1: '∠1', a2: '∠2', a3: '∠3', a4: '∠4' };

  /* ===================================================== F20 */
  const F20 = {
    id: 'F20', chapter: 5, topic: 'APPLY', topicShort: 'CFU: three missing angles', cfu: true,
    title: '∠1 is *67°.* Find the other three angles.',
    async run(ctx, S) {
      cross(S, { layout: 'crossPanel', c: 67, colors: Lab.DISTINCT, labels: ['auto', '2', '3', '4'] });
      focus('crossPanel');
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      const row = (id, c) => `<div class="prow" data-r="${id}" style="flex-direction:column;align-items:stretch;gap:8px">
          <div style="display:flex;align-items:center;justify-content:space-between"><div class="eq sm"><span class="tok c-${c}">${NAMES[id]}</span><span class="op">=</span>${UI.pickHTML(id)}</div><svg class="lock" viewBox="0 0 24 24" fill="none" stroke="#34f5c5" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>
          <div class="reasons"><button class="reason sm" data-v="lp">Linear pair</button><button class="reason sm" data-v="vo">Vertically opposite</button></div></div>`;
      UI.Panel.set(`${row('a2', 'cyan')}${row('a3', 'mint')}${row('a4', 'violet')}`);
      UI.Panel.body.style.gap = '10px';
      await ctx.say('∠1 is *67°.* Find the other three angles.');

      const m1 = S.get('a1').measure;
      const RULES = {
        a2: { v: 180 - m1, why: ['lp'] },
        a3: { v: m1, why: ['vo'] },
        a4: { v: 180 - m1, why: ['lp', 'vo'] }, // linear pair with ∠1, or opposite ∠2
      };
      const HINT = {
        a2: { v: '∠1 and ∠2 are a linear pair — they make *180°.*', why: '∠2 is *next to* ∠1, not opposite it.' },
        a3: { v: '∠3 sits directly *across* the vertex from ∠1.', why: '∠3 is *across* the vertex from ∠1.' },
        a4: { v: '∠4 and ∠1 are a linear pair along *line CD.*', why: '' },
      };
      // conceptual hint when a row is opened: show the relationship, never the number
      const showRelation = id => {
        dimOthers(S, ['a1', id]);
        S.pulseMany(['a1', id], 700);
        if (id === 'a3') oppConnector(S, 'a1', 'a3', { hold: 300 });
        else lineTrace(S, ...(id === 'a2' ? ['OA', 'OB'] : ['OC', 'OD']), { color: 'gold', dur: 700, hold: 200 });
      };
      const miss = text => { UI.incorrect(); ctx.sayNow(text, { tone: 'warn' }); };
      let finish; const solved = ctx.until(r => finish = r);
      const rows = {};
      const rowDone = id => {
        const r = rows[id];
        if (!r.pick.ok || !r.whyOk || r.done) return;
        r.done = true;
        r.el.classList.add('lockd'); r.el.querySelector('.lock').classList.add('in');
        S.get(id).st.label = 'auto'; S.pulse(id, 700);
        UI.correct({ small: true });
        if (Object.values(rows).every(x => x.done)) finish();
      };
      // same three options on every row, ascending: position never hints at the answer
      const OPTS = [90 - m1, m1, 180 - m1];
      for (const id of ['a2', 'a3', 'a4']) {
        const el = UI.Panel.q(`[data-r="${id}"]`);
        rows[id] = { el, whyOk: false, done: false };
        rows[id].pick = UI.pick(el.querySelector('.pick'), {
          options: OPTS, correct: RULES[id].v, label: NAMES[id],
          onOpen: () => showRelation(id),
          onResult: ok => ok ? rowDone(id) : miss(HINT[id].v),
        });
        const btns = [...el.querySelectorAll('.reason')];
        btns.forEach(b => ctx.on(b, 'click', () => {
          if (rows[id].whyOk || b.disabled) return;
          if (RULES[id].why.includes(b.dataset.v)) {
            rows[id].whyOk = true; b.classList.add('ok'); UI.correct({ small: true });
            btns.forEach(x => { x.disabled = true; if (x !== b) x.style.opacity = .35; });
            rowDone(id);
          } else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); b.disabled = true; miss(HINT[id].why); }
        }));
      }
      ctx.ready();
      ctx.sayNow('Choose each *measure* and its *reason.*');
      ctx.idle(() => { const r = Object.values(rows).find(x => !x.done); r && (r.pick.ok ? S.pulse('a1', 800) : r.pick.hint()); });
      await solved;
      dimOthers(S, ['a1', 'a2', 'a3', 'a4']);
      UI.correct();
      oppConnector(S, 'a1', 'a3'); setTimeout(() => oppConnector(S, 'a2', 'a4'), 400);
      await ctx.say(`Opposite angles are equal: *∠3 = ${m1}°*, *∠4 = ∠2.*`, { tone: 'good' });
      await ctx.sayDo(`Linear pairs total 180°: *${m1}° + ${180 - m1}° = 180°.*`, () => lineTrace(S, 'OA', 'OB', { color: 'mint', dur: 900 }), 200, { tone: 'good' });
      ctx.complete();
    },
  };

  /* ===================================================== F21 */
  const F21 = {
    id: 'F21', chapter: 5, topic: 'APPLY', topicShort: 'CFU: right-angle crossing', cfu: true,
    title: 'Which angle is vertically opposite to *∠1?*',
    async run(ctx, S) {
      cross(S, { ab: 10, c: 100, lenAB: 560, lenCD: 262, colors: Lab.DISTINCT, labels: ['1', '2', '3', '4'], subs: ['90°', '90°', '90°', '90°'] });
      focus('crossWide');
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      await ctx.say('Which angle is vertically opposite to *∠1?*');
      await ctx.say('Every angle is 90° — so *don’t use the number.*');
      ctx.sayNow('Look *across the vertex*, then Check.');   // input is live while the prompt is spoken
      await Lab.pickAngle(ctx, S, {
        target: 'a1', correct: 'a3', candidates: ['a2', 'a3', 'a4'],
        wrongMsg: id => `${NAMES[id]} shares an arm with ∠1. Opposite angles share *only the vertex.*`,
      });
      S.pulseMany(['a1', 'a3'], 800);
      await ctx.$(oppConnector(S, 'a1', 'a3', { hold: 300 }));
      await ctx.good('Yes — ∠3 sits *directly across* from ∠1.');
      ctx.complete();
    },
  };

  /* ===================================================== F22 */
  function figF22(kind) {
    const m = Mini.make();
    if (kind === 'A') {
      const O = { x: 190, y: 180 };
      m.arc(O, 0, 80, 48, 'mag', { label: '80°', gap: 32 }).arc(O, 80, 180, 48, 'cyan', { label: '100°', gap: 32 });
      m.hlRay(O, 80, 150, 'common'); m.hlRay(O, 0, 160, 'outer'); m.hlRay(O, 180, 160, 'outer');
      m.ray(O, 0, 160, 'cyan').ray(O, 80, 150, 'cyan').ray(O, 180, 160, 'cyan').v(O).hlVertex(O);
      m.trace([G.at(O, 180, 160), O, G.at(O, 0, 160)]);
    } else {
      const P = { x: 40, y: 180 }, Q = { x: 225, y: 180 };
      m.arc(P, 0, 80, 44, 'mag', { label: '80°', gap: 30 }).arc(Q, 0, 100, 44, 'cyan', { label: '100°', gap: 32 });
      m.ray(P, 0, 140, 'cyan').ray(P, 80, 140, 'cyan').v(P).hlVertex(P);
      m.ray(Q, 0, 130, 'cyan').ray(Q, 100, 140, 'cyan').v(Q).hlVertex(Q);
    }
    return m.svg(380, 220);
  }

  const F22 = {
    id: 'F22', chapter: 5, topic: 'CONVERSE', topicShort: 'CFU: converse conditions', cfu: true,
    title: "Which pair's non-common arms *must form a line?*",
    async run(ctx, S) {
      S.keep([]);
      UI.setFocus(800, 470);
      ctx.state('DEMONSTRATE');
      const cards = await Lab.cardRow(ctx, ['A', 'B'].map(id => ({ id, svg: figF22(id) })), { y: 228, width: 560 });
      const insp = UI.ov(`<div class="board center"><div class="insp" style="margin-top:0">
        <button data-i="vertex">Shared vertex</button><button data-i="common">Common arm</button><button data-i="total">Total</button></div></div>`, { x: 800, y: 712 });
      UI.inNext(insp);
      insp.querySelectorAll('button').forEach(b => ctx.on(b, 'click', () => {
        const on = b.classList.toggle('on'); Sound.play('ui.select');
        const k = b.dataset.i;
        if (k === 'total') ['A', 'B'].forEach(id => cards.note(id, on ? '80° + 100° = 180°' : ''));
        else cards.cards.forEach(c => c.querySelector('svg').classList.toggle('insp-' + k, on));
      }));
      await ctx.say("Which pair's non-common arms *must form a line?*");
      ctx.ready(); ctx.check(false);
      cards.onSelect = () => ctx.enableCheck(true);
      for (; ;) {
        await ctx.waitCheck();
        if (cards.value === 'A') break;
        cards.card('B').classList.add('bad');
        await ctx.bad('Pair B totals 180° too — but it is *not adjacent.*');
        ctx.state('AWAIT_CHECK');
      }
      cards.lock('A');
      insp.style.opacity = .4;
      const svg = cards.svg('A');
      ctx.state('EXPLAIN');
      cards.note('A', '100° + 80° → <b style="color:#4dffd2">180°</b>'); Sound.play('equation.snap');
      await ctx.wait(700);
      svg.classList.add('show-vertex', 'show-common'); Sound.play('ui.select');
      await ctx.wait(700);
      svg.classList.add('show-trace'); Sound.play('geometry.draw');
      await ctx.good('Adjacent *and* 180° — so the outer arms form a *line.*');
      ctx.complete();
    },
  };

  /* ===================================================== F23 */
  const RECAP = [
    { k: '1', title: 'Linear pair → total 180°' },
    { k: '2', title: 'Vertically opposite → equal' },
    { k: '3', title: 'Adjacent + total 180° → non-common arms form a line' },
  ];
  const LINE = { 1: 'A linear pair totals *180°.*', 2: 'Vertically opposite angles are *equal.*', 3: 'Adjacent + 180° → outer arms form a *line.*' };
  const F23 = {
    id: 'F23', chapter: 5, topic: 'LEARNING CLOSE', topicShort: 'Learning close',
    title: 'You can find angles *without measuring them.*',
    async run(ctx, S) {
      cross(S, { layout: 'crossPanel', c: 65, colors: ['mag', 'cyan', 'mag', 'cyan'] });
      focus('crossPanel');
      ctx.state('DEMONSTRATE');
      const OD = S.get('OD');
      OD.to({ prog: 0, labelOp: 0 }, 0);
      ['a3', 'a4'].forEach(id => S.get(id).to({ prog: 0, labelOp: 0 }, 0));
      await ctx.$(S.show('O')); S.show('OB'); await ctx.$(S.show('OA')); await ctx.$(S.show('OC'));
      S.show('a1'); await ctx.$(S.show('a2'));

      await ctx.say('You can find angles *without measuring them.*');
      UI.Panel.set(`<div class="recap">${RECAP.map(r => `<button class="rtile" data-k="${r.k}"><i>${r.k}</i><span>${r.title}</span></button>`).join('')}</div>
        <div class="board in eqbox" style="position:relative;text-align:center;min-height:72px;display:grid;place-items:center"></div>`);
      const box = UI.Panel.q('.eqbox');
      const setBox = html => { box.innerHTML = html; box.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' }); };

      const collapseD = async () => {
        if (OD.st.prog > 0) { ['a3', 'a4'].forEach(id => S.get(id).to({ prog: 0, labelOp: 0 }, 300)); await OD.to({ prog: 0, labelOp: 0 }, 400); }
      };
      const ANIM = {
        async 1() {
          await collapseD();
          S.get('a1').st.label = '1'; S.get('a2').st.label = '2';
          S.pulseMany(['a1', 'a2'], 800);
          setBox(eq([{ t: '∠1', c: 'mag' }, '+', { t: '∠2', c: 'cyan' }, '=', { t: '180°', cls: 'okc' }], 'sm'));
          await lineTrace(S, 'OA', 'OB', { color: 'gold', dur: 900, hold: 300 });
        },
        async 2() {
          S.get('a1').st.label = '1'; S.get('a2').st.label = '2';
          if (OD.st.prog < 1) {
            Sound.play('geometry.draw');
            await OD.to({ prog: 1, labelOp: 1 }, 600, Ease.outCubic);
            S.trace([S.get('OC').tip(true), S.pt('O'), OD.tip(true)], { mode: 'streak', dur: 600, hold: 0 });
            S.show('a3'); await Tween.sleep(120); await S.show('a4');
          }
          setBox(`<div style="display:flex;gap:26px;justify-content:center">${eq([{ t: '∠1', c: 'mag' }, '=', { t: '∠3', c: 'mag' }], 'sm')}${eq([{ t: '∠2', c: 'cyan' }, '=', { t: '∠4', c: 'cyan' }], 'sm')}</div>`);
          oppConnector(S, 'a1', 'a3', { hold: 200 });
          await Tween.sleep(450);
          await oppConnector(S, 'a2', 'a4', { hold: 200 });
        },
        async 3() {
          await collapseD();
          S.get('a1').st.label = 'auto'; S.get('a2').st.label = 'auto';
          const OA = S.get('OA');
          await OA.to({ angle: 155 }, 500);
          const upd = () => setText(`${S.get('a1').measure}° + ${S.get('a2').measure}° = ${S.get('a1').measure + S.get('a2').measure}°`);
          const setText = t => { box.innerHTML = `<div class="eq sm">${t}</div>`; };
          const off = Tween.onFrame(upd);
          await OA.to({ angle: 180 }, 1100, Ease.inOutCubic);
          off(); upd();
          box.querySelector('.eq').style.color = '#6fffd8';
          Sound.play('equation.snap');
          await lineTrace(S, 'OA', 'OB', { color: 'mint', dur: 800, hold: 300 });
          
        },
      };
      const seen = new Set();
      let busy = false, finish;
      const allSeen = ctx.until(r => finish = r);
      ctx.ready();
      ctx.sayNow('Tap each relationship to *replay* it.');   // input is live while the prompt is spoken
      UI.Panel.qa('.rtile').forEach(t => ctx.on(t, 'click', async () => {
        if (busy || !S.enabled) return;
        busy = true;
        UI.Panel.qa('.rtile').forEach(x => x.classList.toggle('cur', x === t));
        Sound.play('ui.select');
        ctx.sayNow(LINE[t.dataset.k]);
        try { await ANIM[t.dataset.k](); } catch (e) { }
        t.classList.add('seen'); seen.add(t.dataset.k);
        busy = false;
        if (seen.size === 3) finish();
      }));
      ctx.idle(() => { const t = UI.Panel.qa('.rtile').find(x => !x.classList.contains('seen')); t && t.animate([{ transform: 'none' }, { transform: 'translateX(-6px)' }, { transform: 'none' }], { duration: 500 }); });
      await allSeen;
      ctx.state('EXPLAIN');
      UI.Panel.qa('.rtile').forEach(x => x.classList.remove('cur'));
      box.innerHTML = '<div class="mastered" style="position:relative;left:auto;transform:none"><b style="font-size:23px">ANGLE RELATIONSHIPS MASTERED</b><span style="font-size:14px">Linear pairs · Vertically opposite angles · The converse</span></div>';
      box.classList.add('glow');
      const badge = box.firstElementChild;
      await ctx.wait(300);
      S.ripple(S.pt('O'), 'mint', 2.6); setTimeout(() => S.ripple(S.pt('O'), 'gold', 3.4), 220);
      Sound.play('chapter.complete');
      badge.classList.add('in');
      await ctx.say('You built it, explored it, and *proved it.*', { tone: 'good' });
      ctx.complete();
    },
  };

  Engine.register([F20, F21, F22, F23]);
})();
