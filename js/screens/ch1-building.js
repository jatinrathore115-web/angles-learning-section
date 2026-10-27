/* CHAPTER 1 — BUILDING ANGLES (R01–R05)
   Every narrated step appears in the single narration line (*word* = keyword). */
(function () {
  const { TYPE } = Lab;

  /* ===================================================== R01 */
  const COLS = [250, 590, 930, 1270], DY = 375, SY = 530, TY = 735;
  const ITEMS = {
    seg: { name: 'Line segment', obj: 'SEG' },
    ray: { name: 'Ray', obj: 'OA' },
    pt: { name: 'Point', obj: 'PT' },
    line: { name: 'Line', obj: 'M' },
  };
  const ORDER = ['seg', 'ray', 'pt', 'line'];   // drawings, left → right
  const TRAY = ['line', 'pt', 'ray', 'seg'];    // name cards (storyboard order)
  const HINT = {
    pt: 'A *point* has no length — it only marks a position.',
    seg: 'A *line segment* stops at two endpoints.',
    ray: 'A *ray* has exactly one endpoint and one arrow.',
    line: 'A *line* has no endpoints — it goes on both ways.',
  };

  const R01 = {
    id: 'R01', chapter: 0, topic: 'POINTS & RAYS', topicShort: 'Point, segment, ray, line',
    title: 'Geometry starts with a few simple *objects.*',
    async run(ctx, S) {
      S.keep([]);
      UI.setFocus(800, 470);
      const y = 470;
      ctx.state('DEMONSTRATE');
      await ctx.say('Geometry starts with a few simple *objects.*');

      // the first point is the only object on screen: centred and prominent
      S.vertex('P', { x: 800, y, label: '', size: 2.2 });
      UI.setFocus(800, y);
      await ctx.sayDo('A *point* marks an exact position.', () => S.show('P'), 500);

      S.vertex('Q', { x: 1040, y, label: '', size: 1.5 });
      S.seg('M', { x1: 560, y1: y, x2: 1040, y2: y, color: 'cyan', width: 7 });
      await ctx.sayDo('Two endpoints make a *line segment.*', async () => {
        // the point glides left and becomes the segment's first endpoint
        await S.get('P').to({ x: 560, size: 1.5 }, 650, Ease.inOutCubic);
        await S.show('Q'); await S.show('M', { dur: 650 });
      }, 500);

      // SEGMENT → RAY: one endpoint stays, the other side extends
      await ctx.sayDo('A *ray* starts at one point and goes on in one direction.', async () => {
        S.hide('Q', 300);
        Sound.play('geometry.draw');
        await S.get('M').to({ x2: 1360, arrow2: 1 }, 750, Ease.outCubic);
      }, 700);

      // RAY → LINE
      await ctx.sayDo('A *line* goes on in both directions.', async () => {
        S.hide('P', 300);
        Sound.play('geometry.draw');
        await S.get('M').to({ x1: 240, arrow1: 1 }, 750, Ease.outCubic);
      }, 600);

      // distribute the four objects into columns
      S.get('M').to({ x1: COLS[3] - 135, x2: COLS[3] + 135, y1: DY, y2: DY, width: 6 }, 800);
      S.seg('SEG', { x1: COLS[0] - 125, y1: DY, x2: COLS[0] + 125, y2: DY, dot1: 1, dot2: 1, color: 'cyan', width: 6 });
      S.vertex('O', { x: COLS[1] - 128, y: DY, label: '', size: 1.3 });
      S.ray('OA', { from: 'O', angle: 0, len: 256, color: 'cyan', label: '' });
      S.vertex('PT', { x: COLS[2], y: DY, label: '', size: 1.6 });
      await ctx.wait(500);
      S.show('SEG'); await ctx.wait(160);
      S.show('O'); S.show('OA'); await ctx.wait(160);
      await ctx.$(S.show('PT'));

      const slots = ORDER.map((k, i) => UI.ov('<div class="dslot">?</div>', { x: COLS[i], y: SY }));
      const homes = TRAY.map((k, i) => ({ x: 340 + i * 260, y: TY }));
      const cards = TRAY.map((k, i) => { const e = UI.ov(`<div class="dlabel hidden0" role="button" tabindex="0">${ITEMS[k].name}</div>`, homes[i]); e.dataset.k = k; e.dataset.i = i; return e; });
      for (const c of cards) { c.classList.remove('hidden0'); Sound.play('ui.hover'); await ctx.wait(110); }
      ctx.say('Match each name to its *drawing.*').catch(() => { });
      ctx.ready();

      let placed = 0, finish;
      const allDone = ctx.until(r => finish = r);
      const slotAt = p => slots.findIndex((s, j) => !s.classList.contains('done') && Math.abs(p.x - COLS[j]) < 150 && Math.abs(p.y - SY) < 95);
      const place = (card, j) => {
        const k = card.dataset.k;
        card.style.left = COLS[j] + 'px'; card.style.top = SY + 'px';
        // snap: freeze the current size, then let it grow to exactly fill the answer box
        card.style.width = card.offsetWidth + 'px'; card.style.height = card.offsetHeight + 'px';
        void card.offsetWidth;
        card.classList.add('placed'); card.setAttribute('tabindex', '-1');
        card.style.width = ''; card.style.height = '';
        slots[j].classList.add('done');
        Sound.play('equation.snap'); setTimeout(() => UI.correct({ small: true }), 90);
        S.pulse(S.get(ITEMS[k].obj), 800);
        if (k === 'ray') S.pulse('O', 800);
        S.ripple(k === 'ray' ? S.get('O').st : k === 'pt' ? S.get('PT').st : { x: COLS[j], y: DY }, 'mint', 0.9);
        if (++placed === 4) finish();
      };
      const wrong = card => {
        const i = +card.dataset.i;
        card.style.left = homes[i].x + 'px'; card.style.top = homes[i].y + 'px';
        UI.incorrect();
        ctx.sayNow(HINT[card.dataset.k], { tone: 'warn' });
      };
      cards.forEach(card => {
        let drag = false, off = null;
        ctx.on(card, 'pointerdown', ev => {
          if (!S.enabled || card.classList.contains('placed')) return;
          drag = true; card.setPointerCapture(ev.pointerId); card.classList.add('drag');
          Sound.play('ui.select');
          const p = UI.toStage(ev); off = { x: parseFloat(card.style.left) - p.x, y: parseFloat(card.style.top) - p.y };
        });
        ctx.on(card, 'pointermove', ev => {
          if (!drag) return;
          const p = UI.toStage(ev), q = { x: p.x + off.x, y: p.y + off.y };
          card.style.left = q.x + 'px'; card.style.top = q.y + 'px';
          const j = slotAt(q); slots.forEach((s, n) => s.classList.toggle('over', n === j));
        });
        const up = () => {
          if (!drag) return;
          drag = false; card.classList.remove('drag');
          const q = { x: parseFloat(card.style.left), y: parseFloat(card.style.top) };
          slots.forEach(s => s.classList.remove('over'));
          const j = slotAt(q);
          if (j < 0) { const i = +card.dataset.i; card.style.left = homes[i].x + 'px'; card.style.top = homes[i].y + 'px'; return; }
          if (ORDER[j] === card.dataset.k) place(card, j); else wrong(card);
        };
        ctx.on(card, 'pointerup', up); ctx.on(card, 'pointercancel', up);
        ctx.on(card, 'keydown', e => {   // keyboard: Enter places the card in its slot
          if (e.key !== 'Enter' || card.classList.contains('placed') || !S.enabled) return;
          place(card, ORDER.indexOf(card.dataset.k));
        });
      });
      ctx.idle(() => { const c = cards.find(c => !c.classList.contains('placed')); if (c) c.animate([{ transform: 'translate(-50%,-50%)' }, { transform: 'translate(-50%,-62%)' }, { transform: 'translate(-50%,-50%)' }], { duration: 700, easing: 'ease-in-out' }); });

      await allDone;
      await ctx.good('All matched — *endpoints* and *arrows* tell them apart.');
      // transition: the ray stays and becomes the first arm of an angle
      ctx.state('EXPLAIN');
      UI.fadeOverlay(400);
      S.keep(['O', 'OA']);
      // centred here; R02 then carries it to its place as an angle's first arm
      S.get('O').to({ x: 560, y: 470, size: 1.2 }, 900);
      S.get('OA').to({ len: 480 }, 900);
      UI.setFocus(800, 470);
      await ctx.wait(900);
      ctx.complete();
    },
  };

  /* ===================================================== R02 */
  const R02 = {
    id: 'R02', chapter: 0, topic: 'ANGLE PARTS', topicShort: 'Angle, arms, vertex',
    title: 'Now give this ray a *partner.*',
    async run(ctx, S) {
      S.keep(['O', 'OA']);
      UI.setFocus(640, 520);
      S.vertex('O', { x: 330, y: 730, label: 'O', labelAngle: null, size: 1.2 });
      S.ray('OA', { from: 'O', angle: 0, len: 640, color: 'cyan', label: 'A' });
      ctx.state('DEMONSTRATE');
      await ctx.$(S.show('O')); await ctx.$(S.show('OA'));
      S.get('OA').to({ labelOp: 1 }, 300);
      await ctx.say('Now give this ray a *partner.*');

      S.ray('OB', { from: 'O', angle: 48, len: 520, color: 'gold', label: 'B' });
      S.arc('ang', { at: 'O', from: 'OA', to: 'OB', r: 130, color: 'mag', label: '', minor: true });
      const ln = ctx.say('Two rays with one common endpoint form an *angle.*');
      await ctx.wait(200);
      await ctx.$(S.show('OB'));
      await ctx.wait(600);
      await ctx.$(S.show('ang'));
      await ln;

      // notation card: the angle's name and its parts (revealed as narrated)
      const card = UI.ov(`<div class="board notecard np">
          <div class="notation" aria-label="angle A O B"><span>∠</span><span class="nl">A</span><span class="nl">O</span><span class="nl">B</span></div>
          <div class="part rv"><span class="tag">ARMS</span><b>OA</b>,<b>OB</b></div>
          <div class="part rv"><span class="tag mag">VERTEX</span><b>O</b></div></div>`, { x: 1120, y: 300 });
      const parts = card.querySelectorAll('.part');

      await ctx.sayDo('The two rays are the *arms.*', async () => {
        await S.pulseMany(['OA', 'OB'], 800); UI.inNext(card); parts[0].classList.add('in');
      }, 500);
      ['OA', 'OB', 'ang'].forEach(id => S.get(id).to({ dim: 0.6 }, 300));
      await ctx.sayDo('Their common endpoint, O, is the *vertex.*', async () => {
        S.get('O').to({ ring: 1 }, 300);
        await S.pulse('O', 900); parts[1].classList.add('in');
      }, 900);
      S.get('O').to({ ring: 0 }, 300);
      ['OA', 'OB', 'ang'].forEach(id => S.get(id).to({ dim: 0 }, 300));
      const nl = card.querySelectorAll('.nl');
      await ctx.sayDo('Name it with the vertex in the middle: *∠AOB.*', async () => {
        S.trace([S.get('OA').tip(true), S.pt('O'), S.get('OB').tip(true)], { color: 'gold', dur: 1500, width: 6, hold: 400 });
        for (const [i, id] of [[0, 'OA'], [1, 'O'], [2, 'OB']]) { nl[i].classList.add('on'); S.pulse(id, 500); Sound.play('ui.select'); await Tween.sleep(480); }
        S.pulse('ang', 700);
      }, 1500);

      // INTERACTION — one step at a time, guided by the narration line
      ctx.ready();
      let step = 'move', finish;
      const done = ctx.until(r => finish = r);
      const tapped = new Set();
      const drag = S.drag('OB', {
        constrain: a => G.clamp(a, 15, 110),
        onChange: a => { if (step === 'move' && Math.abs(a - 48) >= 8) { step = 'arms'; Sound.play('equation.snap'); ctx.sayNow('Tap the two *arms.*'); } },
      });
      // show-me: OB lights up and swings on 'Move', then returns — the learner does the real move
      ctx.sayDo('Move ray *OB.*', () => Lab.demoRay(S, 'OB', [70, 48]), 150).catch(() => { });
      for (const id of ['OA', 'OB']) S.tap(id, () => {
        if (step === 'move') return;
        if (step === 'vertex') { UI.incorrect(); ctx.sayNow('That is an arm. Tap the shared *endpoint.*', { tone: 'warn' }); return; }
        S.pulse(id); Sound.play('equation.snap'); tapped.add(id);
        if (tapped.size === 2) { step = 'vertex'; ctx.sayNow('Now tap the *vertex.*'); }
      });
      S.tap('O', () => {
        if (step === 'arms') { UI.incorrect(); ctx.sayNow('That is the vertex. Tap the two *arms.*', { tone: 'warn' }); return; }
        if (step !== 'vertex') return;
        S.pulse('O'); S.ripple(S.pt('O'), 'cyan'); finish();
      });
      ctx.idle(() => step === 'move' ? drag.hint() : S.pulse(step === 'vertex' ? 'O' : [...['OA', 'OB']].find(i => !tapped.has(i)), 700));
      await done;
      drag.stop(false);
      await ctx.good('OA and OB are the *arms*; O is the *vertex.*');
      ctx.complete();
    },
  };

  /* ===================================================== R03–R05 shared angle */
  function angleSetup(S, b, { x = 520, y = 530 } = {}) {
    S.keep(['O', 'OA', 'OB', 'ang']);
    UI.setFocus(x, y);
    S.vertex('O', { x, y, label: 'O', labelAngle: null, size: 1.2 });
    S.ray('OA', { from: 'O', angle: 0, len: 470, color: 'cyan', label: 'A', dim: 0 });
    S.ray('OB', { from: 'O', angle: b, len: 290, color: 'gold', label: 'B', dim: 0 });
    S.arc('ang', { at: 'O', from: 'OA', to: 'OB', r: 96, color: 'mag', label: 'auto', minor: false, sub: '', dim: 0 });
  }
  async function angleShow(ctx, S) {
    await ctx.$(S.show('O')); await ctx.$(S.show('OA')); await ctx.$(S.show('OB')); await ctx.$(S.show('ang'));
  }

  /* ===================================================== R03 */
  const R03 = {
    id: 'R03', chapter: 0, topic: 'ANGLE TYPES', topicShort: 'Angle types & degrees',
    title: 'Angles are measured in *degrees.*',
    async run(ctx, S) {
      angleSetup(S, 125);
      ctx.state('DEMONSTRATE');
      await angleShow(ctx, S);
      // the type table is the definition the learner checks against — the only panel content
      UI.Panel.set(`<div class="types">
        <div class="ty" data-t="acute"><b>Acute</b><span>0° to 90°</span></div>
        <div class="ty" data-t="right"><b>Right</b><span>exactly 90°</span></div>
        <div class="ty" data-t="obtuse"><b>Obtuse</b><span>90° to 180°</span></div>
        <div class="ty" data-t="straight"><b>Straight</b><span>exactly 180°</span></div>
        <div class="ty" data-t="reflex"><b>Reflex</b><span>180° to 360°</span></div>
      </div>`);
      const arc = S.get('ang');
      await ctx.sayDo('Angles are measured in *degrees.*', () => S.pulse('ang', 800), 500);

      const seen = new Set();
      const update = () => {
        const t = G.classify(arc.value), T = TYPE[t];
        if (!T) return;
        arc.st.sub = T.name; arc.st.subColor = T.color;
        UI.Panel.qa('.ty').forEach(r => r.classList.toggle('cur', r.dataset.t === t));
        if (!seen.has(t)) { seen.add(t); UI.Panel.q(`.ty[data-t="${t}"]`)?.classList.add('seen'); if (t === 'right' || t === 'straight') Sound.play('geometry.rotateMilestone'); }
      };
      update();
      ctx.ready();
      ctx.sayDo('Drag the arm. Find every *type* of angle.', () => Lab.demoRay(S, 'OB', [100, 160, 125], { onUpdate: update }), 150).catch(() => { });
      let finished = false, finish; const allSeen = ctx.until(r => finish = r);
      const drag = S.drag('OB', {
        constrain: a => G.clamp(a, 1, 359),
        snap: [{ to: 90, tol: 2 }, { to: 180, tol: 2 }],
        onChange: () => { update(); ctx.state('INTERACTING'); if (!finished && seen.size >= 5) { finished = true; finish(); } },
      });
      ctx.idle(() => drag.hint());
      await allSeen;
      await ctx.good('The angle type depends on *how far* the ray turns.');
      ctx.complete();
    },
  };

  /* ===================================================== R04 */
  const WIDE = { x: 660, y: 530 };   // challenge screens: no panel, figure centred

  const R04 = {
    id: 'R04', chapter: 0, topic: 'ANGLE TYPES', topicShort: 'CFU: obtuse angle', cfu: true,
    title: 'Make an *obtuse* angle.', holdTitle: true,
    async run(ctx, S) {
      angleSetup(S, 60, WIDE);
      ctx.state('DEMONSTRATE');
      await angleShow(ctx, S);
      // neutral wiggle (stays acute): shows which ray to turn without hinting the answer
      await ctx.sayDo('Make an *obtuse* angle.', () => Lab.demoRay(S, 'OB', [72, 50, 60], { step: 420 }), 150);
      ctx.ready(); ctx.check(false);
      const drag = S.drag('OB', { constrain: a => G.clamp(a, 1, 359), onChange: () => ctx.enableCheck(true) });
      ctx.idle(() => drag.hint());
      const arc = S.get('ang');
      let tries = 0, ghosts = null;
      for (; ;) {
        await ctx.waitCheck();
        const v = arc.measure;
        if (v > 90 && v < 180) break;
        tries++;
        if (tries === 1) { S.pulse('OA', 800); await ctx.bad('Look at the *size* of the angle again.'); }
        else {
          if (!ghosts) { const O = S.pt('O'); ghosts = [S.ghostRay(O, 90, 260), S.ghostRay(O, 180, 260)]; }
          await ctx.bad(v === 90 ? 'That is exactly a *right angle*. Open it wider.'
            : v < 90 ? 'Obtuse lies between the *two dashed guides.*'
              : 'Too wide — obtuse is less than a *straight angle.*');
        }
        ctx.state('AWAIT_CHECK');
      }
      drag.stop();
      ghosts && ghosts.forEach(g => g());
      arc.st.sub = 'OBTUSE'; arc.st.subColor = TYPE.obtuse.color;
      S.pulse('ang', 900);
      await ctx.good('Yes — more than *90°*, less than *180°.*');
      await ctx.say('What happens if we keep *turning?*');
      ctx.complete();
    },
  };

  /* ===================================================== R05 */
  const R05 = {
    id: 'R05', chapter: 0, topic: 'ANGLE TYPES', topicShort: 'CFU: reflex angle', cfu: true,
    title: 'Keep turning — *past* a straight angle.', holdTitle: true,
    async run(ctx, S) {
      angleSetup(S, 125, WIDE);
      ctx.state('DEMONSTRATE');
      await angleShow(ctx, S);
      await ctx.sayDo('Keep turning — *past* a straight angle.', async () => {
        // shows the direction of turning only (stays below 180°)
        await Lab.demoRay(S, 'OB', [168, 125], { step: 850 });
      }, 200);
      await ctx.say('Now make a *reflex* angle.');
      ctx.ready(); ctx.check(false);
      const drag = S.drag('OB', { constrain: a => G.clamp(a, 1, 359), onChange: () => ctx.enableCheck(true) });
      ctx.idle(() => drag.hint());
      const arc = S.get('ang');
      for (; ;) {
        await ctx.waitCheck();
        const v = arc.measure;
        if (v > 180 && v < 360) break;
        await ctx.bad(v === 180 ? 'That is a *straight* angle. Keep turning.' : 'Look at the *size* again. Reflex is more than a straight angle.');
        ctx.state('AWAIT_CHECK');
      }
      drag.stop();
      arc.st.sub = 'REFLEX'; arc.st.subColor = TYPE.reflex.color;
      const O = S.pt('O');
      S.ripple(O, 'violet', 2.4); setTimeout(() => S.ripple(O, 'mag', 3.2), 180);
      S.pulse('ang', 900);
      await ctx.good('Exactly — more than *180°*, less than a *full turn.*');
      ctx.complete();
    },
  };

  Engine.register([R01, R02, R03, R04, R05]);
})();
