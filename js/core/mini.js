/* Mini figures — small static SVG constructions used inside choice cards.
   Built with the same angle math as the main stage, plus hidden highlight
   overlays (vertex / common arm / outer arms / overlap) for inspection mode. */
(function () {
  const f = n => (Math.round(n * 100) / 100);
  const col = c => Scene.COL[c] || Scene.COL.cyan;

  class Builder {
    constructor() { this.back = ''; this.mid = ''; this.top = ''; this.hl = ''; }
    ray(O, a, len, c = 'cyan', opt = {}) {
      const p = G.at(O, a, len), k = col(c);
      const q1 = G.at(p, a + 152, 13), q2 = G.at(p, a - 152, 13);
      this.mid += `<line class="m-glow" x1="${f(O.x)}" y1="${f(O.y)}" x2="${f(p.x)}" y2="${f(p.y)}" stroke="${k.glow}"/>`;
      this.mid += `<line class="m-ray" x1="${f(O.x)}" y1="${f(O.y)}" x2="${f(p.x)}" y2="${f(p.y)}" stroke="${k.core}"/>`;
      this.mid += `<path class="m-arrow" d="M${f(q1.x)} ${f(q1.y)} L${f(p.x)} ${f(p.y)} L${f(q2.x)} ${f(q2.y)}" stroke="${k.core}"/>`;
      if (opt.label) { const l = G.at(O, a, len + 20); this.top += `<text class="m-lbl" x="${f(l.x)}" y="${f(l.y)}" text-anchor="middle" dominant-baseline="central">${opt.label}</text>`; }
      return this;
    }
    arc(O, a0, a1, r, c = 'mag', opt = {}) {
      const s = G.ccw(a0, a1), k = col(c);
      this.back += `<path d="${G.arcPath(O, r, a0, s, true)}" fill="${k.fill}"/>`;
      this.back += `<path class="m-arc" d="${G.arcPath(O, r, a0, s, false)}" fill="none" stroke="${k.core}"/>`;
      if (opt.label) {
        const l = G.at(O, a0 + s / 2, r + (opt.gap || 24));
        this.top += `<text x="${f(l.x)}" y="${f(l.y)}" text-anchor="middle" dominant-baseline="central">${opt.label}</text>`;
      }
      return this;
    }
    v(O) {
      this.top += `<circle class="m-vh" cx="${f(O.x)}" cy="${f(O.y)}" r="9"/><circle class="m-v" cx="${f(O.x)}" cy="${f(O.y)}" r="5"/>`;
      return this;
    }
    /* highlight overlays (hidden until a role class is set on the svg) */
    hlVertex(O) { this.hl += `<circle class="m-hl r-vertex" cx="${f(O.x)}" cy="${f(O.y)}" r="15" fill="none" stroke="#ffd426" stroke-width="3.5"/>`; return this; }
    hlRay(O, a, len, role) { const p = G.at(O, a, len); this.hl += `<line class="m-hl r-${role}" x1="${f(O.x)}" y1="${f(O.y)}" x2="${f(p.x)}" y2="${f(p.y)}" stroke="${role === 'common' ? '#ffd426' : '#4dffd2'}" stroke-width="9" stroke-linecap="round" opacity="0" style="mix-blend-mode:screen"/>`; return this; }
    hlArc(O, a0, a1, r, role, c = 'coral') { const s = G.ccw(a0, a1); this.hl += `<path class="m-hl r-${role}" d="${G.arcPath(O, r, a0, s, true)}" fill="${col(c).fill.replace(/[\d.]+\)$/, '.55)')}"/>`; return this; }
    trace(points) {
      const L = G.polyLen(points);
      const d = points.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join(' ');
      this.hl += `<path class="m-trace" d="${d}" style="--len:${f(L)};stroke-dasharray:${f(L)};stroke-dashoffset:${f(L)};filter:drop-shadow(0 0 6px #fff)"/>`;
      return this;
    }
    text(x, y, s, cls = '') { this.top += `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${s}</text>`; return this; }
    svg(w, h) { return `<svg class="mini" viewBox="0 0 ${w} ${h}">${this.back}${this.hl}${this.mid}${this.top}</svg>`; }
  }

  window.Mini = { make: () => new Builder() };
})();
