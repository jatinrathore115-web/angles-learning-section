/* CHAPTER 2 — ANGLE RELATIONSHIPS (R06, F01, F02) */
(function () {
  const { eq } = Lab;

  /* ===================================================== R06 */
  const R06 = {
    id: 'R06', chapter: 1, topic: 'ANGLE PAIRS', topicShort: 'Complementary & supplementary',
    title: "Find each pair's *total.*",
    async run(ctx, S) {
      S.keep([]);
      UI.setFocus(800, 470);
      ctx.state('DEMONSTRATE');
      const Y = 480, L = 230, R = 78, CX = { A: 420, B: 1160 };
      // Pair A (cool) — two separate angles
      S.vertex('V1', { x: 150, y: Y, label: '' }); S.ray('V1a', { from: 'V1', angle: 0, len: L }); S.ray('V1b', { from: 'V1', angle: 35, len: L });
      S.arc('A1', { at: 'V1', from: 'V1a', to: 'V1b', r: R, color: 'cyan', label: 'auto' });
      S.vertex('V2', { x: 450, y: Y, label: '' }); S.ray('V2a', { from: 'V2', angle: 0, len: L }); S.ray('V2b', { from: 'V2', angle: 55, len: L });
      S.arc('A2', { at: 'V2', from: 'V2a', to: 'V2b', r: R, color: 'violet', label: 'auto' });
      // Pair B (warm) — O/OA/OB carry into the next screen
      S.vertex('O', { x: 930, y: Y, label: '' }); S.ray('OA', { from: 'O', angle: 0, len: L, label: '' }); S.ray('OB', { from: 'O', angle: 125, len: 210, label: '' });
      S.arc('B1', { at: 'O', from: 'OA', to: 'OB', r: R, color: 'gold', label: 'auto' });
      S.vertex('V4', { x: 1200, y: Y, label: '' }); S.ray('V4a', { from: 'V4', angle: 0, len: L }); S.ray('V4b', { from: 'V4', angle: 55, len: L });
      S.arc('B2', { at: 'V4', from: 'V4a', to: 'V4b', r: R - 12, color: 'mag', label: 'auto' });

      const tagA = UI.ov('<div class="tag np rv">Pair A</div>', { x: CX.A - 48, y: 236 });
      const tagB = UI.ov('<div class="tag gold np rv">Pair B</div>', { x: CX.B - 48, y: 236 });
      const bA = UI.ov(`<div class="board center">${eq([{ t: '35°', k: 'a', c: 'cyan', cls: 'ghost' }, '+', { t: '55°', k: 'b', c: 'cyan', cls: 'ghost' }, '=', UI.pickHTML('A')])}</div>`, { x: CX.A, y: 600 });
      const bB = UI.ov(`<div class="board center">${eq([{ t: '125°', k: 'a', c: 'gold', cls: 'ghost' }, '+', { t: '55°', k: 'b', c: 'gold', cls: 'ghost' }, '=', UI.pickHTML('B')])}</div>`, { x: CX.B, y: 600 });
      const nA = UI.ov('<div class="board center np"><span class="tag">Complementary</span></div>', { x: CX.A, y: 712 });
      const nB = UI.ov('<div class="board center np"><span class="tag gold">Supplementary</span></div>', { x: CX.B, y: 712 });

      await ctx.say("Find each pair's *total.*");
      for (const ids of [['V1', 'V1a', 'V1b', 'A1'], ['V2', 'V2a', 'V2b', 'A2']]) for (const id of ids) { S.show(id); await ctx.wait(70); }
      tagA.classList.add('in');
      await ctx.wait(250);
      for (const ids of [['O', 'OA', 'OB', 'B1'], ['V4', 'V4a', 'V4b', 'B2']]) for (const id of ids) { S.show(id); await ctx.wait(70); }
      tagB.classList.add('in');
      await ctx.wait(450);
      bA.classList.add('in'); bB.classList.add('in');

      // EQUATION TRANSFER: measure tokens lift from the diagram into each sum
      for (const [board, arcs] of [[bA, ['A1', 'A2']], [bB, ['B1', 'B2']]]) {
        for (const [i, id] of arcs.entries()) {
          const tok = board.querySelector(`.tok[data-k="${i ? 'b' : 'a'}"]`);
          S.pulse(id, 600);
          await ctx.$(UI.fly(`${S.get(id).measure}°`, S.get(id).labelPoint(), tok, { dur: 650, onArrive: () => tok.classList.remove('ghost') }));
        }
      }

      // one dropdown per pair; totals come from the live geometry, distractors are typical slips
      const totA = S.get('A1').measure + S.get('A2').measure, totB = S.get('B1').measure + S.get('B2').measure;
      let finish; const solved = ctx.until(r => finish = r);
      const HINT = {
        A: v => v === 180 ? '180° is a *straight* angle. Add 35° and 55° again.' : 'Not quite. Add *35° + 55°* carefully.',
        B: v => v < totB ? 'A little more. Try *125 + 50*, then add 5.' : 'A little less. Try *125 + 50*, then add 5.',
      };
      const onResult = key => (ok, v) => {
        if (!ok) { UI.incorrect(); ctx.sayNow(HINT[key](v), { tone: 'warn' }); return; }
        UI.correct({ small: true });
        S.pulseMany(key === 'A' ? ['A1', 'A2'] : ['B1', 'B2'], 700);
        if (pA.ok && pB.ok) finish();
      };
      const pA = UI.pick(bA.querySelector('.pick'), { options: [80, totA, 180], correct: totA, label: 'Total of pair A', onResult: onResult('A') });
      const pB = UI.pick(bB.querySelector('.pick'), { options: [170, totB, 190], correct: totB, label: 'Total of pair B', onResult: onResult('B') });
      ctx.ready();
      ctx.sayNow('Add each pair and choose its *total.*');
      ctx.idle(() => [pA, pB].find(p => !p.ok)?.hint());
      await solved;

      ctx.state('EXPLAIN');
      bA.classList.add('glow'); nA.classList.add('in'); S.pulseMany(['A1', 'A2'], 800);
      await ctx.say('These add to *90°* — they are *complementary.*', { tone: 'good' });
      bB.classList.add('glow'); nB.classList.add('in'); S.pulseMany(['B1', 'B2'], 800);
      await ctx.say('These add to *180°* — they are *supplementary.*', { tone: 'good' });

      // DIAGRAM MORPH: Pair B's angles move onto one vertex
      ['V1', 'V1a', 'V1b', 'A1', 'V2', 'V2a', 'V2b', 'A2'].forEach(id => S.hide(id, 500));
      [tagA, bA, nA].forEach(e => { e.style.transition = 'opacity .5s'; e.style.opacity = 0; });
      await ctx.sayDo('What if two angles also share a *vertex?*', async () => {
        S.get('V4').to({ x: 930, y: Y }, 1000);
        S.get('V4a').to({ angle: 125 }, 1000);
        await S.get('V4b').to({ angle: 180 }, 1000);
        Sound.play('equation.snap'); S.ripple(S.pt('O'), 'gold');
      }, 300);
      ctx.complete();
    },
  };

  /* ===================================================== F01 */
  const F01 = {
    id: 'F01', chapter: 1, topic: 'ADJACENT ANGLES', topicShort: 'Adjacent angles',
    title: 'Here is *∠AOB.*',
    async run(ctx, S) {
      S.keep(['O', 'OA', 'OB']);
      UI.setFocus(800, 560);
      ctx.state('DEMONSTRATE');
      S.vertex('O', { x: 790, y: 760, label: 'O', labelAngle: null });
      S.ray('OA', { from: 'O', angle: 15, len: 600, color: 'cyan', label: 'A' });
      S.ray('OB', { from: 'O', angle: 145, len: 540, color: 'cyan', label: 'B' });
      S.arc('big', { at: 'O', from: 'OA', to: 'OB', r: 130, color: 'violet', label: '', minor: true });
      await ctx.$(S.show('O')); S.show('OA'); await ctx.$(S.show('OB'));
      ['OA', 'OB'].forEach(id => S.get(id).to({ labelOp: 1 }, 300));
      await ctx.sayDo('Here is *∠AOB.*', () => S.show('big'), 300);

      // SPLIT ANGLE: a new arm grows inside, the arc divides in two
      S.ray('OC', { from: 'O', angle: 75, len: 480, color: 'gold', label: 'C' });
      S.arc('x1', { at: 'O', from: 'OA', to: 'OC', r: 130, color: 'cyan', label: 'auto' });
      S.arc('x2', { at: 'O', from: 'OC', to: 'OB', r: 130, color: 'mag', label: 'auto' });
      await ctx.sayDo('Draw ray *OC* inside it.', async () => {
        await S.pulse('big', 600);
        await S.show('OC');
        S.hide('big', 300);
        S.show('x1'); await Tween.sleep(120); await S.show('x2');
      }, 200);

      await ctx.sayDo('The two angles share the same *vertex.*', async () => {
        S.get('O').to({ ring: 1 }, 300); await S.pulse('O', 900);
      }, 800);
      S.get('O').to({ ring: 0 }, 300);
      await ctx.sayDo('They also share one *arm.*', () => S.pulse('OC', 900), 600);
      await ctx.sayDo('Angles like these are *adjacent angles.*', () => S.pulseMany(['x1', 'x2'], 900), 900);

      // INTERACTION — the narration line leads each step
      ctx.ready();
      let step = 'drag', finish;
      const done = ctx.until(r => finish = r);
      const drag = S.drag('OC', {
        constrain: a => G.clamp(a, 27, 133),
        onChange: a => { if (step === 'drag' && Math.abs(a - 75) >= 10) { step = 'vertex'; Sound.play('equation.snap'); ctx.sayNow('Tap the shared *vertex.*'); } },
      });
      ctx.sayDo('Drag *C* between OA and OB.', () => Lab.demoRay(S, 'OC', [95, 60, 75]), 150).catch(() => { });
      S.tap('O', () => {
        if (step !== 'vertex') return;
        S.pulse('O'); S.ripple(S.pt('O'), 'cyan'); Sound.play('equation.snap');
        step = 'arm'; ctx.sayNow('Now tap the *common arm.*');
      });
      S.tap('OC', () => { if (step !== 'arm') return; S.pulse('OC'); finish(); });
      for (const id of ['OA', 'OB']) S.tap(id, () => {
        if (step !== 'arm') return;
        UI.incorrect(); ctx.sayNow(`${id} belongs to only one angle. Which arm do *both* use?`, { tone: 'warn' });
      });
      ctx.idle(() => step === 'drag' ? drag.hint() : S.pulse(step === 'vertex' ? 'O' : 'OC', 800));
      await done;
      drag.stop(false);
      await ctx.good('Common vertex, common arm, *no overlap.*');
      ctx.complete();
    },
  };

  /* ===================================================== F02 */
  function figF02(kind) {
    const m = Mini.make();
    if (kind === 'A') { // share vertex & arm but overlap
      const O = { x: 50, y: 190 };
      m.hlArc(O, 0, 40, 118, 'overlap');
      m.arc(O, 0, 95, 52, 'mag').arc(O, 0, 40, 88, 'cyan');
      m.ray(O, 0, 215, 'cyan').ray(O, 40, 200, 'cyan').ray(O, 95, 160, 'cyan').v(O).hlVertex(O);
    } else if (kind === 'B') { // adjacent
      const O = { x: 120, y: 190 };
      m.arc(O, 0, 55, 58, 'cyan').arc(O, 55, 130, 58, 'mag');
      m.hlRay(O, 55, 172, 'common');
      m.ray(O, 0, 150, 'cyan').ray(O, 55, 172, 'cyan').ray(O, 130, 160, 'cyan').v(O).hlVertex(O);
    } else { // share vertex only
      const O = { x: 140, y: 190 };
      m.arc(O, 0, 45, 54, 'cyan').arc(O, 110, 165, 54, 'mag');
      m.ray(O, 0, 128, 'cyan').ray(O, 45, 150, 'cyan').ray(O, 110, 150, 'cyan').ray(O, 165, 128, 'cyan').v(O).hlVertex(O);
    }
    return m.svg(280, 220);
  }

  /** shared multiple-choice card row */
  async function cardRow(ctx, items, { x = 800, y = 236, width = 430 } = {}) {
    const row = UI.ov(`<div class="cards">${items.map(it => `<button class="mcard" data-id="${it.id}" style="width:${width}px" aria-label="Pair ${it.id}"><div class="mcard-k"><span>${it.id}</span></div>${it.svg}<div class="mcard-note"></div></button>`).join('')}</div>`, { x: 0, y });
    row.style.left = (x - row.offsetWidth / 2) + 'px';
    const cards = [...row.querySelectorAll('.mcard')];
    let sel = null;
    const api = {
      row, cards,
      get value() { return sel; },
      card: id => cards.find(c => c.dataset.id === id),
      svg: id => api.card(id).querySelector('svg'),
      note: (id, html) => { api.card(id).querySelector('.mcard-note').innerHTML = html; },
      onSelect: null,
      lock(ok) { cards.forEach(c => { c.classList.add('locked'); if (c.dataset.id !== ok) c.classList.add('dim'); else { c.classList.remove('sel'); c.classList.add('ok'); } }); },
    };
    cards.forEach(c => {
      ctx.on(c, 'click', () => {
        if (!ctx.S.enabled || c.classList.contains('locked')) return;
        cards.forEach(x => x.classList.remove('sel', 'bad'));
        c.classList.add('sel'); sel = c.dataset.id; Sound.play('ui.select');
        api.onSelect && api.onSelect(sel);
      });
      ctx.on(c, 'pointerenter', () => Sound.play('ui.hover'));
    });
    for (const c of cards) { c.classList.add('in'); await ctx.wait(120); }
    return api;
  }

  const F02 = {
    id: 'F02', chapter: 1, topic: 'ADJACENT ANGLES', topicShort: 'CFU: adjacency', cfu: true,
    title: 'Which pair is *adjacent?*',
    async run(ctx, S) {
      S.keep([]);
      UI.setFocus(800, 480);
      ctx.state('DEMONSTRATE');
      const cards = await cardRow(ctx, ['A', 'B', 'C'].map(id => ({ id, svg: figF02(id) })));
      await ctx.say('Which pair is *adjacent?*');
      ctx.ready(); ctx.check(false);
      cards.onSelect = () => ctx.enableCheck(true);
      ctx.idle(() => cards.cards.forEach((c, i) => setTimeout(() => c.animate([{ transform: 'none' }, { transform: 'translateY(-6px)' }, { transform: 'none' }], { duration: 500 }), i * 120)));
      for (; ;) {
        await ctx.waitCheck();
        const v = cards.value;
        if (v === 'B') break;
        cards.card(v).classList.add('bad');
        const svg = cards.svg(v);
        if (v === 'A') { svg.classList.remove('show-overlap'); void svg.offsetWidth; svg.classList.add('show-overlap'); await ctx.bad('These *overlap*. Adjacent angles sit side by side.'); }
        else { svg.classList.add('show-vertex'); await ctx.bad('They share a vertex — but do they share an *arm?*'); }
        ctx.state('AWAIT_CHECK');
      }
      cards.lock('B');
      const svg = cards.svg('B');
      svg.classList.add('show-vertex'); Sound.play('ui.select');
      await ctx.wait(450);
      svg.classList.add('show-common'); Sound.play('equation.snap');
      await ctx.good('Correct — one *vertex*, one *arm*, no overlap.');
      ctx.complete();
    },
  };

  Engine.register([R06, F01, F02]);
  Lab.cardRow = cardRow;
})();
