/* Shared constructions and helpers used across screens. */
(function () {
  const TYPE = {
    acute: { name: 'ACUTE', color: '#4df0ff' },
    right: { name: 'RIGHT', color: '#4dffd2' },
    obtuse: { name: 'OBTUSE', color: '#ff6cf0' },
    straight: { name: 'STRAIGHT', color: '#ffd426' },
    reflex: { name: 'REFLEX', color: '#c39bff' },
  };


  /* Layout presets: the geometry is the hero, so figures fill the stage.
     'wide' = no side panel (centred); 'panel' = sits left of a control panel. */
  const LAYOUT = {
    pairWide: { O: { x: 800, y: 650 }, lenAB: 600, lenC: 400, r: 110 },
    pairPanel: { O: { x: 590, y: 650 }, lenAB: 470, lenC: 390, r: 105 },
    crossWide: { O: { x: 780, y: 525 }, lenAB: 600, lenCD: 300, r: 80 },
    crossPanel: { O: { x: 575, y: 525 }, lenAB: 465, lenCD: 300, r: 76 },
  };

  /** line AB through O with ray OC standing on it (chapter 3 base figure) */
  function linePair(S, opts = {}) {
    const { O, c = 65, lenAB, lenC, cColor = 'cyan', aColor = 'cyan', a = 180, labels = ['auto', 'auto'], colors = ['mag', 'cyan'], r, extra = [] } = { ...LAYOUT[opts.layout || 'pairWide'], ...opts };
    S.keep(['O', 'OA', 'OB', 'OC', 'a1', 'a2', ...extra]);
    S.vertex('O', { ...O, label: 'O', labelAngle: null });
    S.ray('OB', { from: 'O', angle: 0, len: lenAB, label: 'B', color: 'cyan', dim: 0, handle: 0 });
    S.ray('OA', { from: 'O', angle: a, len: lenAB, label: 'A', color: aColor, dim: 0, handle: 0 });
    S.ray('OC', { from: 'O', angle: c, len: lenC, label: 'C', color: cColor, dim: 0, handle: 0 });
    S.arc('a1', { at: 'O', from: 'OB', to: 'OC', r, color: colors[0], label: labels[0], dim: 0, ring: 0, sub: '' });
    S.arc('a2', { at: 'O', from: 'OC', to: 'OA', r, color: colors[1], label: labels[1], dim: 0, ring: 0, sub: '' });
  }
  async function showLinePair(ctx, S) {
    await ctx.$(S.show('O'));
    S.show('OB'); await ctx.wait(120);
    await ctx.$(S.show('OA'));
    await ctx.$(S.show('OC'));
    S.show('a1'); await ctx.wait(140);
    await ctx.$(S.show('a2'));
  }

  /** two intersecting lines AB and CD at O (chapters 4–6) */
  function cross(S, opts = {}) {
    const { O, ab = 0, c = 65, lenAB, lenCD, cdColor = 'cyan', colors = ['mag', 'cyan', 'mag', 'cyan'], labels = ['1', '2', '3', '4'], r, extra = [], subs = ['', '', '', ''] } = { ...LAYOUT[opts.layout || 'crossWide'], ...opts };
    S.keep(['O', 'OA', 'OB', 'OC', 'OD', 'a1', 'a2', 'a3', 'a4', ...extra]);
    S.vertex('O', { ...O, label: 'O', labelAngle: ab - 36, labelDist: 34 });
    S.ray('OB', { from: 'O', angle: ab, len: lenAB, label: 'B', color: 'cyan', dim: 0, handle: 0 });
    S.ray('OA', { from: 'O', angle: ab + 180, len: lenAB, label: 'A', color: 'cyan', dim: 0, handle: 0 });
    S.ray('OC', { from: 'O', angle: c, len: lenCD, label: 'C', color: cdColor, dim: 0, handle: 0, handleAt: 0.82 });
    S.ray('OD', { from: 'O', angle: c + 180, len: lenCD, label: 'D', color: cdColor, dim: 0, handle: 0, handleAt: 0.82 });
    const pairs = [['OB', 'OC'], ['OC', 'OA'], ['OA', 'OD'], ['OD', 'OB']];
    pairs.forEach(([f, t], i) => S.arc('a' + (i + 1), { at: 'O', from: f, to: t, r, color: colors[i], label: labels[i], dim: 0, ring: 0, sub: subs[i], labelGap: 34 }));
  }
  async function showCross(ctx, S, { arcs = true } = {}) {
    await ctx.$(S.show('O'));
    S.show('OB'); await ctx.wait(100);
    await ctx.$(S.show('OA'));
    S.show('OC'); await ctx.wait(100);
    await ctx.$(S.show('OD'));
    if (arcs) for (const id of ['a1', 'a2', 'a3', 'a4']) { S.show(id); await ctx.wait(130); }
    await ctx.wait(260);
  }
  const tipOf = (S, id) => S.get(id).tip(true);
  const O = S => S.pt('O');

  /** straight-line light trace through O, e.g. A → O → B */
  function lineTrace(S, r1, r2, opt = {}) {
    return S.trace([tipOf(S, r1), O(S), tipOf(S, r2)], Object.assign({ color: 'white', dur: 950, width: 6, hold: 500 }, opt));
  }
  /** temporary dotted connector across the vertex between two angle regions */
  function oppConnector(S, a, b, opt = {}) {
    const pa = S.get(a).innerPoint(1.25), pb = S.get(b).innerPoint(1.25);
    return S.trace([pa, O(S), pb], Object.assign({ color: 'gold', dur: 800, width: 5, hold: 700, dotted: true }, opt));
  }
  /** Show-me demo for a "move this ray" instruction: the ray lights up, its handle
      appears, and it glides through `path` (angles) and back home — run in sync with
      the narration. It never completes the task: paths end where they started, and a
      learner who grabs the handle takes over at once (a drag cancels the tween). */
  async function demoRay(S, id, path, { linked = [], onUpdate, step = 700 } = {}) {
    const r = S.get(id);
    if (!r) return;
    r.ensureHandle();
    r.to({ handle: 1 }, MOTION.fast);
    r.to({ hs: 1 }, MOTION.micro);
    S.pulse(id, 800);
    Sound.play('ui.select');
    const t0 = performance.now();
    const taken = () => (r.userMovedAt || 0) > t0;   // the learner grabbed the ray: the demo yields at once
    const off = Tween.onFrame(() => {
      if (taken()) return;
      for (const l of linked) { const o = S.get(l.id); if (o) o.st.angle = r.st.angle + l.offset; }
      onUpdate && onUpdate(r.st.angle);
    });
    try { for (const a of path) { if (taken()) break; await r.to({ angle: a }, step, Ease.inOutCubic); } }
    finally { off(); r.to({ hs: 0 }, MOTION.normal, Ease.outBack); }
  }

  function dimOthers(S, keepIds, all = ['a1', 'a2', 'a3', 'a4']) {
    all.forEach(id => S.has(id) && S.get(id).to({ dim: keepIds.includes(id) ? 0 : 1 }, MOTION.fast));
  }

  /** equation html from token list. Strings: '+', '=' are operators; {t, c, k, cls} are tokens */
  function eq(parts, size = '') {
    return `<div class="eq ${size}">${parts.map(p => {
      if (p === '+' || p === '=' || p === '−') return `<span class="op">${p}</span>`;
      if (typeof p === 'string') return p;
      return `<span class="tok ${p.c ? 'c-' + p.c : ''} ${p.cls || ''}" data-k="${p.k || ''}">${p.t}</span>`;
    }).join('')}</div>`;
  }

  window.Lab = { LAYOUT, TYPE, linePair, showLinePair, cross, showCross, lineTrace, oppConnector, dimOthers, demoRay, eq };
})();
