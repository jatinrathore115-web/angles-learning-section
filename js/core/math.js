/* Geometry math. Directions use the mathematical convention:
   degrees, counter-clockwise positive, 0° pointing right.
   Stage/SVG coordinates have y pointing down, so conversion flips y. */
(function () {
  const RAD = Math.PI / 180;

  const G = {
    rad: d => d * RAD,
    deg: r => r / RAD,

    norm360(a) { return ((a % 360) + 360) % 360; },

    /** unit vector for a direction in stage coordinates */
    dir(a) { return { x: Math.cos(a * RAD), y: -Math.sin(a * RAD) }; },

    /** point at distance d from p in direction a */
    at(p, a, d) { return { x: p.x + Math.cos(a * RAD) * d, y: p.y - Math.sin(a * RAD) * d }; },

    /** direction (deg, 0..360) of the vector from p to q */
    angleOf(p, q) { return G.norm360(G.deg(Math.atan2(-(q.y - p.y), q.x - p.x))); },

    /** counter-clockwise sweep from direction `from` to direction `to`, in [0, 360) */
    ccw(from, to) { return G.norm360(to - from); },

    /** signed shortest rotation from a to b, in (-180, 180] */
    delta(a, b) { let d = G.norm360(b - a); return d > 180 ? d - 360 : d; },

    /** angle between two direction vectors using cross/dot (always 0..180) */
    between(u, v) {
      const cross = u.x * v.y - u.y * v.x;
      const dot = u.x * v.x + u.y * v.y;
      return Math.abs(G.deg(Math.atan2(cross, dot)));
    },

    dist(p, q) { return Math.hypot(q.x - p.x, q.y - p.y); },
    lerp(a, b, t) { return a + (b - a) * t; },
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },

    /** classify an angle measure (degrees). Exact values for right/straight. */
    classify(t) {
      const v = Math.round(t * 1000) / 1000;
      if (v <= 0) return 'zero';
      if (v < 90) return 'acute';
      if (v === 90) return 'right';
      if (v < 180) return 'obtuse';
      if (v === 180) return 'straight';
      if (v < 360) return 'reflex';
      return 'full';
    },

    /** SVG arc path from direction a0 sweeping ccw by s degrees */
    arcPath(c, r, a0, s, wedge) {
      if (s <= 0.01) return '';
      if (s >= 359.99) s = 359.99;
      const p0 = G.at(c, a0, r), p1 = G.at(c, a0 + s, r);
      const large = s > 180 ? 1 : 0;
      // ccw in math = sweep-flag 0 in y-down SVG
      const arc = `A ${r} ${r} 0 ${large} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
      if (wedge) return `M ${c.x.toFixed(2)} ${c.y.toFixed(2)} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} ${arc} Z`;
      return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} ${arc}`;
    },

    polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += G.dist(pts[i - 1], pts[i]); return L; },
  };

  window.G = G;
})();
