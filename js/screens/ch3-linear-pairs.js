/* CHAPTER 3 — LINEAR PAIRS (F03–F09) */
(function () {
  const { LAYOUT, linePair, showLinePair, lineTrace, eq } = Lab;

  /** equation board centred under the figure */
  function underBoard(html, layout = 'pairWide') {
    const O = LAYOUT[layout].O;
    return UI.ov(`<div class="board center live-eq np">${html}</div>`, { x: O.x, y: O.y + 82 });
  }
  /** live "x° + y° = z°", always derived from the geometry */
  function liveSum(S, layout) {
    const b = underBoard(eq([{ t: '', k: 'r', c: 'mag' }, '+', { t: '', k: 'l', c: 'cyan' }, '=', { t: '', k: 's', cls: 'tot' }]), layout);
    const r = b.querySelector('[data-k="r"]'), l = b.querySelector('[data-k="l"]'), s = b.querySelector('[data-k="s"]');
    const update = () => {
      const m1 = S.get('a1').measure, m2 = S.get('a2').measure;
      r.textContent = m1 + '°'; l.textContent = m2 + '°'; s.textContent = (m1 + m2) + '°';
      return m1 + m2;
    };
    update();
    return { el: b, update, tot: s };
  }
  const focus = layout => { const O = LAYOUT[layout].O; UI.setFocus(O.x, O.y - 100); };

  /* ===================================================== F03 */
  const F03 = {
    id: 'F03', chapter: 2, topic: 'FIXED SUM', topicShort: 'Discovery: fixed sum',
    title: 'Move *C* and watch both angles.', holdTitle: true,
    async run(ctx, S) {
      linePair(S, { layout: 'pairPanel', c: 65, cColor: 'gold' });
      focus('pairPanel');
      ctx.state('DEMONSTRATE');
      await showLinePair(ctx, S);
      const sum = liveSum(S, 'pairPanel');
      sum.el.classList.add('in');
      // the sum board stays live during the demo: both angles change, the total does not
      await ctx.sayDo('Move *C* and watch both angles.', () => Lab.demoRay(S, 'OC', [90, 45, 65], { step: 600, onUpdate: () => sum.update() }), 150);
      ctx.ready();
      let travel = 0, last = 65, finish;
      const explored = ctx.until(r => finish = r);
      const upd = () => sum.update();
      const drag = S.drag('OC', {
        constrain: a => G.clamp(a, 10, 170),
        onChange: a => { upd(); travel += Math.abs(a - last); last = a; ctx.state('INTERACTING'); if (travel > 150) finish(); },
      });
      ctx.idle(() => drag.hint());
      await explored;
      ctx.state('EXPLAIN');
      await ctx.say('The two angles *change...*', { after: 350 });
      sum.el.classList.add('flash'); sum.tot.classList.add('okc'); Sound.play('equation.snap');
      await ctx.say('...but their total stays *180°.*');

      UI.Panel.set('<div class="ch"></div>');
      const ch = UI.choices(UI.Panel.q('.ch'), [{ id: 'sum', html: 'Their sum stays 180°.' }, { id: 'each', html: 'Each angle stays the same.' }], { onChange: () => ctx.enableCheck(true) });
      await ctx.$(ch.show());
      ctx.say('What *stays the same?*').catch(() => { });
      ctx.state('AWAIT_CHECK'); ctx.check(false);
      for (; ;) {
        await ctx.waitCheck();
        if (ch.value === 'sum') break;
        ch.mark('each', 'bad');
        await ctx.bad('Drag C again — do the two *measures* really stay the same?');
        ctx.state('AWAIT_CHECK');
      }
      drag.stop();
      ch.lock('sum');
      const off = Tween.onFrame(upd); ctx.cleanups.push(off);
      S.get('OC').to({ angle: 65 }, 600);
      await ctx.good('Wherever C goes, the angles add up to *180°.*');
      await ctx.$(lineTrace(S, 'OA', 'OB', { color: 'gold' }));   // transition: the straight line matters next
      off();
      ctx.complete();
    },
  };

  /* ===================================================== F04 */
  const F04 = {
    id: 'F04', chapter: 2, topic: 'LINEAR PAIR', topicShort: 'Linear Pair Axiom',
    title: 'These two angles are *adjacent.*',
    async run(ctx, S) {
      linePair(S, { c: 65, labels: ['1', '2'] });
      focus('pairWide');
      ctx.state('DEMONSTRATE');
      await showLinePair(ctx, S);
      const axiom = underBoard(`<div class="tag gold" style="display:flex;justify-content:center;margin:0 auto 10px;width:max-content">Linear Pair Axiom</div>${eq([{ t: '∠1', k: '1', c: 'mag', cls: 'ghost' }, '+', { t: '∠2', k: '2', c: 'cyan', cls: 'ghost' }, '=', { t: '180°', k: 's', cls: 'ghost' }])}`);

      await ctx.sayDo('These two angles are *adjacent.*', () => S.pulseMany(['a1', 'a2', 'O'], 800), 400);
      ctx.ready();
      ctx.sayNow('Tap the arm they *share.*');   // input is live while the prompt is spoken
      let r1; const got1 = ctx.until(r => r1 = r);
      S.tap('OC', () => { S.pulse('OC'); Sound.play('equation.snap'); S.clearInteractions(); r1(); });
      for (const id of ['OA', 'OB']) S.tap(id, () => { UI.incorrect(); ctx.sayNow(`${id} belongs to one angle only. Tap the *shared* arm.`, { tone: 'warn' }); });
      ctx.idle(() => S.pulse('OC', 700));
      await got1;

      ctx.sayNow('Now tap the two *non-common arms.*');   // input is live while the prompt is spoken
      const left = new Set(['OA', 'OB']);
      let r2; const got2 = ctx.until(r => r2 = r);
      for (const id of ['OA', 'OB']) S.tap(id, () => { S.pulse(id); S.get(id).to({ hl: 0.5 }, 200); left.delete(id); Sound.play('ui.select'); if (!left.size) r2(); });
      S.tap('OC', () => { UI.incorrect(); ctx.sayNow('OC is shared. Tap the two *outer* arms.', { tone: 'warn' }); });
      await got2;
      S.clearInteractions();
      ctx.state('EXPLAIN');
      ['OA', 'OB'].forEach(id => S.get(id).to({ hl: 0 }, 300));
      await ctx.sayDo('Their non-common arms form a *straight line.*', () => lineTrace(S, 'OA', 'OB', { color: 'gold', dur: 1100 }), 500);
      UI.correct({ small: true });
      await ctx.say('This is a *linear pair.*', { tone: 'good' });

      // Linear Pair Axiom: tokens lift from the angles into the equation
      UI.inNext(axiom);
      await ctx.wait(300);
      const flyIn = (txt, arcId, tok) => { S.pulse(arcId, 600); return UI.fly(txt, S.get(arcId).labelPoint(), tok, { dur: 700, onArrive: () => tok.classList.remove('ghost') }); };
      const ln = ctx.say('If a ray stands on a line, the two angles add up to *180°.*');
      await ctx.$(flyIn('∠1', 'a1', axiom.querySelector('[data-k="1"]')));
      await ctx.$(flyIn('∠2', 'a2', axiom.querySelector('[data-k="2"]')));
      const ts = axiom.querySelector('[data-k="s"]'); ts.classList.remove('ghost'); ts.classList.add('okc'); Sound.play('equation.snap');
      await ln;
      ctx.complete();
    },
  };

  /* ===================================================== F05 */
  function figF05(kind) {
    const m = Mini.make();
    if (kind === 'A') { // adjacent, but 80° + 50° ≠ 180°
      const O = { x: 150, y: 190 };
      m.arc(O, 0, 80, 46, 'mag', { label: '80°', gap: 30 }).arc(O, 80, 130, 46, 'cyan', { label: '50°', gap: 30 });
      m.hlRay(O, 80, 160, 'common'); m.hlRay(O, 0, 125, 'outer'); m.hlRay(O, 130, 150, 'outer');
      m.ray(O, 0, 125, 'cyan').ray(O, 80, 160, 'cyan').ray(O, 130, 150, 'cyan').v(O).hlVertex(O);
    } else if (kind === 'B') { // supplementary but not adjacent
      const P = { x: 25, y: 190 }, Q = { x: 165, y: 190 };
      m.arc(P, 0, 80, 42, 'mag', { label: '80°', gap: 28 }).arc(Q, 0, 100, 42, 'cyan', { label: '100°', gap: 30 });
      m.ray(P, 0, 110, 'cyan').ray(P, 80, 140, 'cyan').v(P).hlVertex(P);
      m.ray(Q, 0, 105, 'cyan').ray(Q, 100, 140, 'cyan').v(Q).hlVertex(Q);
    } else { // linear pair
      const O = { x: 140, y: 190 };
      m.arc(O, 0, 65, 46, 'mag', { label: '65°', gap: 30 }).arc(O, 65, 180, 46, 'cyan', { label: '115°', gap: 30 });
      m.hlRay(O, 65, 160, 'common'); m.hlRay(O, 0, 128, 'outer'); m.hlRay(O, 180, 128, 'outer');
      m.ray(O, 0, 128, 'cyan').ray(O, 65, 160, 'cyan').ray(O, 180, 128, 'cyan').v(O).hlVertex(O);
      m.trace([G.at(O, 180, 128), O, G.at(O, 0, 128)]);
    }
    return m.svg(280, 220);
  }

  const F05 = {
    id: 'F05', chapter: 2, topic: 'LINEAR PAIR', topicShort: 'CFU: linear pair', cfu: true,
    title: 'Which pair forms a *linear pair?*',
    async run(ctx, S) {
      S.keep([]);
      UI.setFocus(800, 480);
      ctx.state('DEMONSTRATE');
      const cards = await Lab.cardRow(ctx, ['A', 'B', 'C'].map(id => ({ id, svg: figF05(id) })));
      await ctx.say('Which pair forms a *linear pair?*');
      ctx.ready(); ctx.check(false);
      // inspection mode: the selected card exposes its vertex, shared arm and outer arms
      cards.onSelect = id => {
        ctx.enableCheck(true);
        cards.cards.forEach(c => ['insp-vertex', 'insp-common', 'insp-outer'].forEach(k => c.querySelector('svg').classList.toggle(k, c.dataset.id === id)));
      };
      for (; ;) {
        await ctx.waitCheck();
        const v = cards.value;
        if (v === 'C') break;
        cards.card(v).classList.add('bad');
        await ctx.bad(v === 'A' ? 'Adjacent — but 80° + 50° is not *180°.*' : 'They total 180°, but they are *not adjacent.*');
        ctx.state('AWAIT_CHECK');
      }
      cards.lock('C');
      cards.svg('C').classList.add('show-trace'); Sound.play('geometry.draw');
      cards.note('C', '65° + 115° = 180°');
      await ctx.good('Adjacent, and the outside arms form a *line.*');
      ctx.complete();
    },
  };

  /* ===================================================== F06 */
  const F06 = {
    id: 'F06', chapter: 2, topic: 'LINEAR PAIR', topicShort: 'Find the missing angle',
    title: 'A linear pair totals *180°.*',
    async run(ctx, S) {
      linePair(S, { c: 128, labels: ['auto', '?'] });
      focus('pairWide');
      ctx.state('DEMONSTRATE');
      await showLinePair(ctx, S);
      // board sits in the open space above OB, so its menu opens downward without covering the vertex
      const board = UI.ov(`<div class="board center">${eq([{ t: '128°', k: 'k', c: 'mag', cls: 'ghost' }, '+', UI.pickHTML('u'), '=', { t: '180°', k: 's' }])}</div>`, { x: 1180, y: 290 });
      UI.inNext(board);
      const tk = board.querySelector('[data-k="k"]');
      await ctx.sayDo('A linear pair totals *180°.*', async () => {
        S.pulse('a1', 600);
        await UI.fly('128°', S.get('a1').labelPoint(), tk, { onArrive: () => tk.classList.remove('ghost') });
        S.pulse('a2', 600);
      }, 200);

      const known = S.get('a1').measure, answer = 180 - known;
      let finish; const solved = ctx.until(r => finish = r);
      const pk = UI.pick(board.querySelector('.pick'), {
        options: [answer, answer + 10, known], correct: answer, label: 'Missing angle',
        onOpen: () => S.pulse('a2', 700),
        onResult: (ok, v) => {
          if (ok) { finish(); return; }
          UI.incorrect(); S.pulse('a1', 600);
          ctx.sayNow(v === known ? 'That is the *known* angle. What adds to 128° to make 180°?' : `Check: 128° + ${v}° = ${known + v}°, not *180°.*`, { tone: 'warn' });
        },
      });
      ctx.ready();
      await ctx.say('What must the *missing angle* be?');
      ctx.idle(() => { pk.hint(); S.pulse('a2', 900); });
      await solved;
      S.get('a2').st.label = 'auto';
      S.pulse('a2', 800);
      await ctx.good(`128° + ${answer}° = *180°.*`);
      ctx.complete();
    },
  };

  /* ===================================================== F07 */
  const F07 = {
    id: 'F07', chapter: 2, topic: 'LINEAR PAIR', topicShort: 'CFU: construct a pair', cfu: true,
    title: 'Drag *A* so ∠1 and ∠2 form a linear pair.', holdTitle: true,
    async run(ctx, S) {
      linePair(S, { c: 70, a: 150, aColor: 'gold', labels: ['1', '2'] });
      focus('pairWide');
      ctx.state('DEMONSTRATE');
      await showLinePair(ctx, S);
      // neutral wiggle that never reaches 180°: shows the ray, not the answer
      await ctx.sayDo('Drag *A* so ∠1 and ∠2 form a linear pair.', () => Lab.demoRay(S, 'OA', [140, 160, 150], { step: 420 }), 150);
      ctx.ready(); ctx.check(false);
      let atLine = false;
      const drag = S.drag('OA', {
        constrain: a => G.clamp(a, 80, 205),
        snap: [{ to: 180, tol: 3 }],
        onChange: a => {
          ctx.enableCheck(true);
          if (a === 180 && !atLine) { Sound.play('equation.snap'); S.pulse('OB', 500); } // subtle magnetic cue
          atLine = a === 180;
        },
      });
      ctx.idle(() => drag.hint());
      let tries = 0, ghost = null;
      for (; ;) {
        await ctx.waitCheck();
        if (G.norm360(S.get('OA').st.angle) === 180) break;
        tries++;
        if (tries >= 2 && !ghost) ghost = S.ghostRay(S.pt('O'), 180, LAYOUT.pairWide.lenAB);
        await ctx.bad(tries < 2 ? 'Do the non-common arms OA and OB form a *straight line?*' : 'Line OA up with the *dashed* extension of OB.');
        ctx.state('AWAIT_CHECK');
      }
      drag.stop();
      ghost && ghost();
      await ctx.$(lineTrace(S, 'OA', 'OB', { color: 'mint', dur: 1000 }));
      await ctx.good('The non-common arms now form one *straight line.*');
      ctx.complete();
    },
  };

  /* ===================================================== F08 */
  const F08 = {
    id: 'F08', chapter: 2, topic: 'CONVERSE', topicShort: 'Converse: explore',
    title: 'Drag *A* until the total is *180°.*', holdTitle: true,
    async run(ctx, S) {
      linePair(S, { c: 65, a: 155, aColor: 'gold' });
      focus('pairWide');
      ctx.state('DEMONSTRATE');
      await showLinePair(ctx, S);
      const sum = liveSum(S);
      sum.el.classList.add('in');
      await ctx.sayDo('Drag *A* until the total is *180°.*', () => Lab.demoRay(S, 'OA', [145, 162, 155], { step: 480, onUpdate: () => sum.update() }), 150);
      ctx.ready();
      let ghost = null, finish;
      const reached = ctx.until(r => finish = r);
      const drag = S.drag('OA', {
        constrain: a => G.clamp(a, 75, 205),
        snap: [{ to: 180, tol: 1 }],
        onChange: () => {
          const t = sum.update();
          ctx.state('INTERACTING');
          const near = Math.abs(t - 180) <= 12;     // anticipation as the total nears 180°
          sum.tot.classList.toggle('hl', near && t !== 180);
          if (near && !ghost) ghost = S.ghostRay(S.pt('O'), 180, LAYOUT.pairWide.lenAB, 'gold');
          if (!near && ghost) { ghost(); ghost = null; }
          if (t === 180) finish();
        },
      });
      ctx.idle(() => drag.hint());
      await reached;
      drag.stop();
      ghost && ghost();
      ctx.state('EXPLAIN');
      sum.tot.classList.remove('hl'); sum.tot.classList.add('okc'); sum.el.classList.add('flash');
      UI.correct();
      await ctx.wait(400);
      await ctx.sayDo('Look at the *outside arms.*', () => lineTrace(S, 'OA', 'OB', { color: 'gold', dur: 1100 }), 300, { after: 300 });
      await ctx.say('Total 180° — the outside arms form a *straight line.*', { tone: 'good' });
      ctx.complete();
    },
  };

  /* ===================================================== F09 */
  const F09 = {
    id: 'F09', chapter: 2, topic: 'CONVERSE', topicShort: 'Converse of the axiom',
    title: 'If adjacent angles total 180°, *what follows?*',
    async run(ctx, S) {
      linePair(S, { layout: 'pairPanel', c: 70, a: 180 });
      focus('pairPanel');
      ctx.state('DEMONSTRATE');
      await showLinePair(ctx, S);
      liveSum(S, 'pairPanel').el.classList.add('in');
      await ctx.say('If adjacent angles total 180°, *what follows?*');
      UI.Panel.set(`<div class="ch"></div>
        <div class="rv" style="text-align:center;margin-top:6px"><span class="tag gold">Converse of the Linear Pair Axiom</span></div>`);
      const ch = UI.choices(UI.Panel.q('.ch'), [{ id: 'line', html: 'Their non-common arms form a line.' }, { id: 'all', html: 'All three arms form a line.' }], { onChange: () => ctx.enableCheck(true) });
      await ctx.$(ch.show());
      ctx.state('AWAIT_CHECK'); ctx.check(false);
      for (; ;) {
        await ctx.waitCheck();
        if (ch.value === 'line') break;
        ch.mark('all', 'bad'); S.pulse('OC', 800);
        await ctx.bad('OC points away from the line. Look only at the *outside* arms.');
        ctx.state('AWAIT_CHECK');
      }
      ch.lock('line');
      await ctx.$(lineTrace(S, 'OA', 'OB', { mode: 'streak', color: 'gold', dur: 900, hold: 0 }));
      await ctx.$(lineTrace(S, 'OA', 'OB', { color: 'mint', dur: 700 }));
      UI.Panel.q('.rv').classList.add('in');
      UI.correct();
      await ctx.say('So the rule also works in *reverse.*', { tone: 'good' });
      ctx.complete();
    },
  };

  Engine.register([F03, F04, F05, F06, F07, F08, F09]);
})();
