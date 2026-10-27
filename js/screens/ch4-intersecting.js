/* CHAPTER 4 — WHEN LINES INTERSECT (F10–F12) */
(function () {
  const { LAYOUT, cross, showCross, oppConnector, eq } = Lab;
  const DISTINCT = ['mag', 'cyan', 'mint', 'violet']; // no colour hint about which angles pair up
  const focus = layout => { const O = LAYOUT[layout].O; UI.setFocus(O.x, O.y); };

  /* ===================================================== F10 */
  const F10 = {
    id: 'F10', chapter: 3, topic: 'INTERSECTING LINES', topicShort: 'Build intersecting lines',
    title: 'Now let another line *cross* it.',
    async run(ctx, S) {
      cross(S, { colors: DISTINCT });
      focus('crossWide');
      ctx.state('DEMONSTRATE');
      const OD = S.get('OD');
      OD.to({ prog: 0, labelOp: 0, color: 'gold' }, 0);
      ['a1', 'a2', 'a3', 'a4'].forEach(id => S.get(id).to({ prog: 0, labelOp: 0 }, 250));
      await ctx.$(S.show('O'));
      S.show('OB'); await ctx.$(S.show('OA'));
      await ctx.sayDo('Now let another line *cross* it.', () => S.show('OC'), 300);

      // a short stub opposite C, carrying a golden handle
      await ctx.$(OD.to({ prog: 0.22 }, 400, Ease.outCubic));
      // show-me: the stub's handle appears and the ray grows a little through O, then shrinks back
      await ctx.sayDo('Extend the ray *through O.*', async () => {
        OD.ensureHandle(); OD.st.handleAt = OD.st.prog;
        OD.to({ handle: 1, hs: 1 }, MOTION.fast); S.pulse('OD', 800); Sound.play('ui.select');
        const off = Tween.onFrame(() => { OD.st.handleAt = OD.st.prog; });
        await OD.to({ prog: 0.42 }, 600, Ease.inOutCubic);
        await OD.to({ prog: 0.22 }, 500, Ease.inOutCubic);
        off(); OD.to({ hs: 0 }, MOTION.normal, Ease.outBack);
      }, 150);
      ctx.ready();
      let finish; const extended = ctx.until(r => finish = r);
      const ext = S.extend('OD', { min: 0.22, done: 0.88, onDone: () => finish() });
      ctx.idle(() => ext.hint());
      await extended;
      ctx.state('EXPLAIN');
      // EXTEND: a light pulse travels from C back through O and on to D
      OD.to({ prog: 1, color: 'cyan' }, 450, Ease.outCubic);
      await ctx.$(S.trace([S.get('OC').tip(true), S.pt('O'), OD.tip(true)], { mode: 'streak', color: 'white', dur: 800, hold: 0 }));
      OD.to({ labelOp: 1 }, 300);
      UI.correct();
      for (const id of ['a1', 'a2', 'a3', 'a4']) { S.show(id); await ctx.wait(160); }
      await ctx.say('Lines AB and CD *intersect* at O.', { tone: 'good' });
      ctx.complete();
    },
  };

  /* ===================================================== F11 */
  /** select one angle among candidates, then Check */
  async function pickAngle(ctx, S, { target, correct, candidates, wrongMsg }) {
    S.get(target).to({ ring: 1 }, 300);
    S.pulse(target, 800);
    let sel = null;
    const mark = () => candidates.forEach(id => S.get(id).to({ fillOp: id === sel ? 2.8 : 1, ring: id === sel ? 0.6 : 0 }, MOTION.micro));
    candidates.forEach(id => S.tap(id, () => { sel = id; Sound.play('ui.select'); mark(); ctx.enableCheck(true); }));
    ctx.check(false); ctx.state('READY');
    for (; ;) {
      await ctx.waitCheck();
      if (sel === correct) break;
      await ctx.bad(wrongMsg(sel));
      ctx.state('AWAIT_CHECK');
    }
    S.clearInteractions();
    candidates.forEach(id => S.get(id).to({ fillOp: 1, ring: 0 }, MOTION.fast));
    S.get(target).to({ ring: 0 }, 300);
  }

  const F11 = {
    id: 'F11', chapter: 3, topic: 'OPPOSITE ANGLES', topicShort: 'Vertically opposite pairs',
    title: 'Tap the angle *opposite ∠1*, then Check.',
    async run(ctx, S) {
      cross(S, { colors: DISTINCT });
      focus('crossWide');
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      const N = { a1: '∠1', a2: '∠2', a3: '∠3', a4: '∠4' };
      ctx.sayNow('Tap the angle *opposite ∠1*, then Check.');   // input is live while the prompt is spoken
      await pickAngle(ctx, S, {
        target: 'a1', correct: 'a3', candidates: ['a2', 'a3', 'a4'],
        wrongMsg: id => `${N[id]} shares an arm with ∠1. Look *across* the vertex.`,
      });
      S.pulseMany(['a1', 'a3'], 800);
      oppConnector(S, 'a1', 'a3');
      await ctx.good('∠1 and ∠3 sit *directly opposite.*');

      ctx.state('INTERACTING');
      ctx.sayNow('Now tap the angle *opposite ∠2.*');   // input is live while the prompt is spoken
      await pickAngle(ctx, S, {
        target: 'a2', correct: 'a4', candidates: ['a1', 'a3', 'a4'],
        wrongMsg: id => `${N[id]} shares an arm with ∠2. Look *straight across* O.`,
      });
      S.pulseMany(['a2', 'a4'], 800);
      oppConnector(S, 'a2', 'a4');
      await ctx.good('Two pairs of *vertically opposite* angles.');
      ctx.complete();
    },
  };

  /* ===================================================== F12 */
  const F12 = {
    id: 'F12', chapter: 3, topic: 'OPPOSITE ANGLES', topicShort: 'Explore: equal opposites',
    title: 'Rotate *CD.* Compare opposite angles.', holdTitle: true,
    async run(ctx, S) {
      // figure shifted left so the live equalities sit beside it
      cross(S, { O: { x: 640, y: 525 }, lenAB: 540, cdColor: 'gold', labels: ['auto', 'auto', 'auto', 'auto'], colors: ['mag', 'cyan', 'mag', 'cyan'] });
      UI.setFocus(640, 525);
      ctx.state('DEMONSTRATE');
      await showCross(ctx, S);
      const board = UI.ov(`<div class="board pairs np">
          <div>${eq([{ t: '∠1', c: 'mag' }, '=', { t: '∠3', c: 'mag' }], 'xs')}${eq([{ t: '', k: '1', c: 'mag' }, '=', { t: '', k: '3', c: 'mag' }])}</div>
          <div>${eq([{ t: '∠2', c: 'cyan' }, '=', { t: '∠4', c: 'cyan' }], 'xs')}${eq([{ t: '', k: '2', c: 'cyan' }, '=', { t: '', k: '4', c: 'cyan' }])}</div>
        </div>`, { x: 1250, y: 300 });
      const upd = () => ['1', '2', '3', '4'].forEach(k => { board.querySelector(`[data-k="${k}"]`).textContent = S.get('a' + k).measure + '°'; });
      upd(); UI.inNext(board);
      // the whole line turns: OD stays opposite OC, and the equalities stay live
      await ctx.sayDo('Rotate *CD.* Compare opposite angles.', () => Lab.demoRay(S, 'OC', [85, 50, 65], { linked: [{ id: 'OD', offset: 180 }], onUpdate: upd }), 150);
      ctx.ready();
      let travel = 0, last = S.get('OC').st.angle, finish;
      const explored = ctx.until(r => finish = r);
      const drag = S.drag('OC', {
        constrain: a => G.clamp(a, 15, 165),
        linked: [{ id: 'OD', offset: 180 }],
        onChange: a => { upd(); travel += Math.abs(a - last); last = a; ctx.state('INTERACTING'); if (travel > 120) finish(); },
      });
      ctx.idle(() => drag.hint());
      await explored;
      ctx.state('EXPLAIN');
      await ctx.say('The angles *change...*', { after: 350 });
      board.querySelectorAll('.eq:not(.xs) .tok').forEach(t => t.classList.add('okc'));
      UI.correct({ small: true });
      S.pulseMany(['a1', 'a3'], 700);
      setTimeout(() => S.pulseMany(['a2', 'a4'], 700), 350);
      await ctx.say('...but opposite angles stay *equal.*', { tone: 'good' });
      ctx.complete();
    },
  };

  Engine.register([F10, F11, F12]);
  Lab.pickAngle = pickAngle;
  Lab.DISTINCT = DISTINCT;
})();
