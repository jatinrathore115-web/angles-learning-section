/* HTML UI layer: narration line, panel, choices, equations,
   token transfer, dock and chapter transitions. */
(function () {
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const overlay = $('overlay');

  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /** element rect in stage coordinates (stage is CSS-scaled) */
  function rectOf(el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const k = s.width / 1600;
    const x = (r.left - s.left) / k, y = (r.top - s.top) / k, w = r.width / k, hh = r.height / k;
    return { x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2 };
  }

  /* ---------------------------------------------------- narration line
     The single primary text element of every screen. It carries the
     narrator's current step, the task prompt and feedback. *word* marks
     a highlighted keyword. */
  function headingHTML(src) {
    return src.split(/(\*[^*]+\*)/).filter(Boolean).map(part => {
      const em = /^\*.*\*$/.test(part);
      const txt = em ? part.slice(1, -1) : part;
      return txt.split(/(\s+)/).map(w => /^\s+$/.test(w) ? ' ' : w ? `<span class="w">${em ? `<em>${w}</em>` : w}</span>` : '').join('');
    }).join('');
  }
  const lineEl = $('heading');
  let lineTok = 0, lineKey = '';
  /** text appears word by word at the voice's pace: each word lands as it is said */
  async function line(text, { tone = '', dur = null } = {}) {
    const key = tone + '|' + text;
    if (key === lineKey) return;
    lineKey = key;
    const tok = ++lineTok;
    if (lineEl.innerHTML) {
      lineEl.classList.remove('in'); lineEl.classList.add('out');
      await Tween.sleep(170);
      if (tok !== lineTok) return;
    }
    const badge = tone === 'good' ? '<span class="tb good">✓</span>' : tone === 'warn' ? '<span class="tb warn">!</span>' : '';
    lineEl.className = 'heading ' + tone + (text.replace(/\*/g, '').length > 50 ? ' long' : '');
    lineEl.innerHTML = badge + headingHTML(text);
    // per-character time from the clip length (silent lines use a calm reading pace)
    const chars = text.replace(/\*/g, '').length || 1;
    const perChar = dur ? Math.max(16, (dur - 0.35) * 1000 / chars) : 22;
    let at = dur ? 120 : 0;   // clips open with ~0.3 s of silence; first word lands with the voice
    [...lineEl.querySelectorAll('.w, .tb')].forEach(w => {
      w.style.transitionDelay = `${Math.round(at)}ms`;
      if (w.classList.contains('w')) at += (w.textContent.length + 1) * perChar;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => { if (tok === lineTok) lineEl.classList.add('in'); }));
  }
  function clearLine() { lineTok++; lineKey = ''; lineEl.classList.remove('in'); lineEl.classList.add('out'); }

  const panel = $('panel'), panelBody = $('panelBody');

  /* ------------------------------------------------------------- panel */
  const Panel = {
    el: panel, body: panelBody,
    set(html) {
      panelBody.innerHTML = html;
      panel.classList.add('on');
      return panelBody;
    },
    async reveal(sel = '.rv', gap = 110) {
      const items = [...panelBody.querySelectorAll(sel)];
      for (const it of items) { it.classList.add('in'); await Tween.sleep(gap); }
    },
    off() { panel.classList.remove('on'); },
    isOn() { return panel.classList.contains('on'); },
    q: s => panelBody.querySelector(s),
    qa: s => [...panelBody.querySelectorAll(s)],
  };

  /* ----------------------------------------------------------- choices */
  function choices(container, options, { onChange } = {}) {
    const wrap = h('<div class="choices" role="radiogroup"></div>');
    container.appendChild(wrap);
    let sel = null;
    const btns = options.map(o => {
      const b = h(`<button class="choice" role="radio" aria-checked="false" data-id="${o.id}">${o.html}</button>`);
      b.addEventListener('click', () => {
        if (b.classList.contains('locked')) return;
        btns.forEach(x => { x.classList.remove('sel', 'bad'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
        sel = o.id; Sound.play('ui.select');
        onChange && onChange(sel);
      });
      b.addEventListener('pointerenter', () => Sound.play('ui.hover'));
      wrap.appendChild(b);
      return b;
    });
    return {
      el: wrap,
      get value() { return sel; },
      async show(gap = 120) { for (const b of btns) { b.classList.add('in'); await Tween.sleep(gap); } },
      mark(id, cls) { const b = btns.find(x => x.dataset.id === id); if (b) { b.classList.remove('bad'); void b.offsetWidth; b.classList.add(cls); } },
      lock(correctId) { btns.forEach(b => { b.classList.add('locked'); if (b.dataset.id !== correctId) b.classList.add('faded'); else b.classList.add('ok'); }); },
      clear() { btns.forEach(b => b.classList.remove('bad')); },
    };
  }

  /* --------------------------------------------------------- overlay */
  function ov(html, { x, y, center = false, cls = '' } = {}) {
    const e = h(html);
    if (cls) e.classList.add(...cls.split(' '));
    e.style.left = x + 'px'; e.style.top = y + 'px';
    if (center) e.classList.add('center');
    overlay.appendChild(e);
    return e;
  }
  function clearOverlay() { [...overlay.children].forEach(c => c.remove()); }
  async function fadeOverlay(dur = 300) {
    const items = [...overlay.children];
    items.forEach(c => { c.style.transition = `opacity ${dur}ms`; c.style.opacity = 0; });
    await Tween.sleep(dur);
    items.forEach(c => c.remove());
  }
  const inNext = el => requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));

  /* ---------------------------------------------- EQUATION TRANSFER */
  /** a measure token lifts from a stage point and snaps into a target element */
  function fly(text, from, toEl, { dur = 750, onArrive, cls = '' } = {}) {
    const t = h(`<div class="flytok ${cls}">${text}</div>`);
    overlay.appendChild(t);
    t.style.left = from.x + 'px'; t.style.top = from.y + 'px';
    const to = rectOf(toEl);
    return Tween.animate(dur, (k) => {
      const x = G.lerp(from.x, to.cx, k), y = G.lerp(from.y, to.cy, k) - Math.sin(k * Math.PI) * 70;
      t.style.left = x + 'px'; t.style.top = y + 'px';
      t.style.transform = `translate(-50%,-50%) scale(${1 + Math.sin(k * Math.PI) * 0.12})`;
    }, Ease.inOutCubic).then(() => {
      Sound.play('equation.snap');
      t.remove();
      onArrive && onArrive();
    });
  }

  /* ---------------------------------------------------------- dropdown
     Answer picker: a trigger in the equation + a menu of three options
     floated on the stage (so panels never clip it). Choosing gives instant
     feedback; a wrong option is crossed out so the next try is informed. */
  const CHEV = '<svg viewBox="0 0 24 24"><path d="M6 9.5l6 6 6-6"/></svg>';
  const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let openPick = null;
  function pickHTML(key = '') {
    return `<button type="button" class="pick" data-pick="${key}" aria-haspopup="listbox" aria-expanded="false"><span class="pick-val">?</span><span class="pick-ic">${CHEV}</span></button>`;
  }
  /** opts: { options:[n,n,n], correct, unit:'°', label, onResult(ok, v), onOpen() } */
  function pick(trigger, opts) {
    const unit = opts.unit ?? '°';
    const val = trigger.querySelector('.pick-val'), ic = trigger.querySelector('.pick-ic');
    const wrong = new Set();
    const badges = ['A', 'B', 'C', 'D'];
    let menu = null, ok = false, revert = null;
    trigger.setAttribute('aria-label', `${opts.label || 'Choose an answer'}: not answered`);

    const position = () => {
      const r = rectOf(trigger);
      menu.style.width = Math.max(r.w + 40, 190) + 'px';
      const below = r.y + r.h + 14 + menu.offsetHeight < 856;
      // no room below: open as a slim row above, so it never hides the figure being worked on
      if (!below) { menu.classList.add('row'); menu.style.width = 'auto'; }
      const mw = menu.offsetWidth, mh = menu.offsetHeight;
      const x = G.clamp(r.cx - mw / 2, 36, 1564 - mw);
      menu.style.left = x + 'px';
      menu.style.top = (below ? r.y + r.h + 14 : r.y - 14 - mh) + 'px';
      menu.classList.toggle('up', !below);
      menu.style.setProperty('--caret', (r.cx - x) + 'px');
    };
    const close = (focusBack = false) => {
      if (!menu) return;
      const m = menu; menu = null; openPick = null;
      m.classList.remove('in'); m.classList.add('out');
      setTimeout(() => m.remove(), 170);
      trigger.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false');
      if (focusBack) trigger.focus();
    };
    const choose = v => {
      close();
      clearTimeout(revert);
      val.textContent = v + unit;
      trigger.classList.remove('bad');
      if (v === opts.correct) {
        ok = true;
        trigger.classList.add('ok'); trigger.disabled = true; ic.innerHTML = TICK;
        trigger.setAttribute('aria-label', `${opts.label || 'Answer'}: ${v}${unit}, correct`);
        correct({ small: true });
      } else {
        wrong.add(v);
        void trigger.offsetWidth; trigger.classList.add('bad');
        trigger.setAttribute('aria-label', `${opts.label || 'Answer'}: ${v}${unit} is not correct, try again`);
        revert = setTimeout(() => { if (!ok) { val.textContent = '?'; trigger.classList.remove('bad'); } }, 1400);
      }
      opts.onResult && opts.onResult(v === opts.correct, v);
    };
    const open = () => {
      if (ok || trigger.disabled) return;
      if (openPick && openPick !== api) openPick.close();
      if (menu) { close(); return; }
      menu = h(`<div class="pmenu" role="listbox" aria-label="${opts.label || 'Options'}">${opts.options.map((v, i) =>
        `<button type="button" class="popt ${wrong.has(v) ? 'wrong' : ''}" role="option" data-v="${v}" ${wrong.has(v) ? 'aria-disabled="true" tabindex="-1"' : ''} style="--d:${i * 45}ms"><i>${wrong.has(v) ? '✕' : badges[i]}</i><b>${v}${unit}</b></button>`).join('')}</div>`);
      stage.appendChild(menu);
      position();
      openPick = api;
      trigger.classList.add('open'); trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => menu && menu.classList.add('in'));
      Sound.play('ui.select');
      const items = [...menu.querySelectorAll('.popt:not(.wrong)')];
      menu.addEventListener('click', e => { const b = e.target.closest('.popt'); if (b && !b.classList.contains('wrong')) choose(+b.dataset.v); });
      menu.addEventListener('pointerover', e => { if (e.target.closest('.popt:not(.wrong)')) Sound.play('ui.hover'); });
      menu.addEventListener('keydown', e => {
        const i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
        else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); close(true); }
      });
      setTimeout(() => items[0] && items[0].focus({ preventScroll: true }), 30);
      opts.onOpen && opts.onOpen();
    };
    trigger.addEventListener('click', open);
    trigger.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); open(); } });
    const api = { el: trigger, get ok() { return ok; }, open, close, choose, hint() { trigger.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-in-out' }); } };
    trigger.__pick = api;
    return api;
  }
  function closePicks() { if (openPick) openPick.close(); }
  // tap anywhere else closes the open menu
  document.addEventListener('pointerdown', e => {
    if (openPick && !e.target.closest('.pmenu') && e.target.closest('.pick') !== openPick.el) openPick.close();
  }, true);

  /* ---------------------------------------------------------- dock */
  const bCheck = $('bCheck'), bNext = $('bNext'), bBack = $('bBack');
  const Dock = {
    check: bCheck, next: bNext, back: bBack,
    setCheck(visible, enabled = false) { bCheck.classList.toggle('hidden', !visible); bCheck.disabled = !enabled; },
    enableCheck(v) { bCheck.disabled = !v; },
    setNext(enabled, pulse = false) { bNext.disabled = !enabled; bNext.classList.toggle('pulse', !!pulse && enabled); },
  };

  /* --------------------------------------------- chapter / challenge */
  async function chapter(k, t) {
    const c = $('chapter');
    $('chapterK').textContent = k; $('chapterT').textContent = t;
    c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
    Sound.play('transition.soft');
    await Tween.sleep(1150);
  }

  /* ------------------------------------------------- answer feedback
     One place for right/wrong feedback so every screen behaves the same:
     correct → recorded chime + falling angles; incorrect → recorded buzz-free
     "try again" cue (the line/hint and the shake carry the explanation). */
  const fall = h('<div class="fall" aria-hidden="true"></div>');
  stage.appendChild(fall);
  const FALL_COLORS = ['#2de2ff', '#ff4fe6', '#ffd426', '#34f5c5', '#b98aff', '#ffb347'];
  const FALL_KINDS = [35, 60, 90, 125, 180];
  function angleGlyph(deg, color) {
    const O = { x: 6, y: 30 }, L = 26, r = 10;
    const p = G.at(O, deg, L);
    const mark = deg === 90
      ? `<path d="M${O.x + 8} ${O.y} V${O.y - 8} H${O.x}" fill="none" stroke="${color}" stroke-width="2.4"/>`
      : `<path d="${G.arcPath(O, r, 0, deg, true)}" fill="${color}" fill-opacity=".28" stroke="${color}" stroke-width="2.2"/>`;
    const x0 = deg === 180 ? 30 : 6;   // centre straight angles in the box
    return `<svg viewBox="${deg === 180 ? -20 : 0} 0 ${deg === 180 ? 56 : 36} 36"><g stroke-linecap="round">${mark}
      <line x1="${O.x}" y1="${O.y}" x2="${O.x + L}" y2="${O.y}" stroke="${color}" stroke-width="3.8"/>
      <line x1="${O.x}" y1="${O.y}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${color}" stroke-width="3.8"/>
      <circle cx="${O.x}" cy="${O.y}" r="3" fill="#fff"/></g></svg>`;
  }
  /* "Angle rain": three depth layers give parallax — near pieces are larger,
     brighter and faster; far ones small, dim and slow. Released over ~1 s so it
     reads as rain, not a single drop. Glyph markup is cached per shape+colour. */
  const GLYPHS = {};
  const glyph = (deg, color) => GLYPHS[deg + color] || (GLYPHS[deg + color] = angleGlyph(deg, color));
  const LAYERS = [
    { share: 0.25, size: [30, 44], dur: [2.0, 2.6], op: 1 },      // near
    { share: 0.40, size: [20, 30], dur: [2.6, 3.3], op: 0.85 },   // middle
    { share: 0.35, size: [12, 20], dur: [3.3, 4.2], op: 0.6 },    // far
  ];
  const rnd = (a, b) => a + Math.random() * (b - a);
  let lastFall = 0;
  function celebrate({ small = false } = {}) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const now = performance.now();
    if (now - lastFall < 1100) return;
    lastFall = now;
    const n = small ? 30 : 72, spread = small ? 0.6 : 1.1;   // pieces · seconds of release
    const frag = document.createDocumentFragment();
    let longest = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const L = t < LAYERS[0].share ? LAYERS[0] : t < LAYERS[0].share + LAYERS[1].share ? LAYERS[1] : LAYERS[2];
      const size = rnd(...L.size), dur = rnd(...L.dur), delay = Math.random() * spread;
      // stratified across the full width (with jitter) so the rain never clumps
      const slot = (i * 37) % n;
      const x = 1 + (slot + Math.random()) * (98 / n);
      const r0 = Math.round(Math.random() * 360), spin = (Math.random() < 0.5 ? -1 : 1) * rnd(120, 380);
      const el = document.createElement('i');
      el.className = 'fa';
      el.style.cssText = `left:${x.toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;--op:${L.op};--r0:${r0}deg;--r1:${r0 + spin}deg;--sway:${rnd(-70, 70).toFixed(0)}px;animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s`;
      el.innerHTML = glyph(FALL_KINDS[(i * 3 + Math.floor(Math.random() * 2)) % FALL_KINDS.length], FALL_COLORS[Math.floor(Math.random() * FALL_COLORS.length)]);
      frag.appendChild(el);
      longest = Math.max(longest, dur + delay);
    }
    const batch = [...frag.children];
    fall.appendChild(frag);
    setTimeout(() => batch.forEach(el => el.remove()), longest * 1000 + 150);
  }
  /* "Oops" face: small angles fly in from all four sides and assemble into a
     sad face (round outline, droopy eyes, frown), hold briefly, then shrink away.
     Short (~1.5 s), never blocks input, warm colours rather than alarm-red. */
  const sad = h('<div class="sadface" aria-hidden="true"><i class="sad-halo"></i></div>');
  stage.appendChild(sad);
  const SAD = { ring: '#ff8a7a', eye: '#ffd426', mouth: '#ffd426' };
  function sadFace() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    sad.querySelectorAll('.sp').forEach(e => e.remove());
    const parts = [];
    const R = 122;
    // outline: 18 angles around a circle, each turned along the curve
    for (let i = 0; i < 18; i++) {
      const t = i / 18 * 360;
      parts.push({ x: Math.cos(t * Math.PI / 180) * R, y: Math.sin(t * Math.PI / 180) * R, rot: t + 90, size: 34, deg: 60, color: SAD.ring });
    }
    // eyes: right angles opened upward (a droopy "V"), the white vertex dot reads as the pupil
    parts.push({ x: -42, y: -14, rot: -45, size: 34, deg: 90, color: SAD.eye });
    parts.push({ x: 42, y: -14, rot: -45, size: 34, deg: 90, color: SAD.eye });
    // sad eyebrows: straight angles, inner ends raised
    parts.push({ x: -44, y: -56, rot: -16, size: 40, deg: 180, color: SAD.eye });
    parts.push({ x: 44, y: -56, rot: 16, size: 40, deg: 180, color: SAD.eye });
    // frown: 7 angles along a downward-curving arc
    for (let i = 0; i < 7; i++) {
      const a = 218 + i * (104 / 6);              // arc 218°–322° about a centre below the mouth
      const ax = Math.cos(a * Math.PI / 180) * 66, ay = 112 + Math.sin(a * Math.PI / 180) * 66;
      parts.push({ x: ax, y: ay, rot: a + 90, size: 30, deg: 60, color: SAD.mouth });
    }
    const W = 1600, H = 900;
    parts.forEach((p, i) => {
      const el = document.createElement('i');
      el.className = 'sp';
      el.style.width = el.style.height = p.size + 'px';
      el.innerHTML = glyph(p.deg, p.color);
      if (p.flip) el.firstChild.style.transform = 'scaleX(-1)';
      sad.appendChild(el);
      // entry from top / right / bottom / left in turn, spread along that edge
      const side = i % 4, k = (i * 0.37) % 1;
      const from = side === 0 ? { x: (k - 0.5) * W, y: -H / 2 - 60 }
        : side === 1 ? { x: W / 2 + 60, y: (k - 0.5) * H }
          : side === 2 ? { x: (k - 0.5) * W, y: H / 2 + 60 }
            : { x: -W / 2 - 60, y: (k - 0.5) * H };
      const spin = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 180);
      const end = `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px) rotate(${p.rot}deg)`;
      if (reduce) { el.animate([{ opacity: 0, transform: end }, { opacity: 1, transform: end }, { opacity: 1, transform: end }, { opacity: 0, transform: end }], { duration: 1300, fill: 'forwards' }); return; }
      const delay = (i % 9) * 28 + Math.random() * 60;
      el.animate([
        { transform: `translate(${from.x}px, ${from.y}px) rotate(${p.rot + spin}deg) scale(.6)`, opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: `${end} scale(1.12)`, opacity: 1, offset: 0.85 },
        { transform: `${end} scale(1)`, opacity: 1 },
      ], { duration: 680, delay, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'both' });
    });
    sad.classList.remove('on', 'out'); void sad.offsetWidth; sad.classList.add('on');
    clearTimeout(sad._t1); clearTimeout(sad._t2);
    sad._t1 = setTimeout(() => sad.classList.add('out'), reduce ? 1000 : 1150);
    sad._t2 = setTimeout(() => { sad.classList.remove('on', 'out'); sad.querySelectorAll('.sp').forEach(e => e.remove()); }, 1600);
  }

  function correct(opts) { Sound.play('answer.correct'); celebrate(opts); }
  function incorrect() { Sound.play('answer.incorrect'); sadFace(); }

  function toStage(evt) {
    const s = stage.getBoundingClientRect(), k = s.width / 1600;
    return { x: (evt.clientX - s.left) / k, y: (evt.clientY - s.top) / k };
  }

  function setFocus(x, y) { const f = $('bgFocus'); f.style.left = (x - 380) + 'px'; f.style.top = (y - 380) + 'px'; }

  window.UI = { h, rectOf, toStage, line, clearLine, correct, incorrect, celebrate, Panel, choices, ov, clearOverlay, fadeOverlay, inNext, fly, pickHTML, pick, closePicks, Dock, chapter, setFocus, headingHTML };
})();
