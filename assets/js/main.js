/* ARMOR-HAL project page: interactions. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(v, d) { return Number(v).toFixed(d == null ? 2 : d); }
  function signed(v, d) { var s = fmt(Math.abs(v), d); return (v > 0 ? '+' : v < 0 ? '−' : '±') + s; }

  /* ---------------- scroll progress, topbar, active nav ---------------- */
  var prog = $('#progress'), bar = $('#topbar');
  function onScroll() {
    var h = document.documentElement;
    var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    prog.style.transform = 'scaleX(' + p + ')';
    bar.classList.toggle('scrolled', h.scrollTop > 8);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav a');
  var secObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(function (s) { secObs.observe(s); });

  /* ---------------- reveal on scroll ---------------- */
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(function (n, i) {
    n.style.transitionDelay = (i % 3) * 70 + 'ms';
    revObs.observe(n);
  });

  /* ---------------- teaser videos: load near view, play while visible ---------------- */
  var vidObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.getAttribute('src') && v.dataset.src) { v.preload = 'auto'; v.src = v.dataset.src; }
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else { v.pause(); }
    });
  }, { threshold: 0.35 });
  $$('video[data-src]').forEach(function (v) { vidObs.observe(v); });

  /* ---------------- tooltip ---------------- */
  var tip = $('#tip');
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('show');
  }
  function hideTip() { tip.classList.remove('show'); }
  tip.style.position = 'fixed';

  /* =====================================================================
     1. Hero: phase-aware decoding timeline
     ===================================================================== */
  var N = 40;
  var X0 = 60, X1 = 980, Y0 = 26, Y1 = 186;
  function tx(t) { return X0 + (t - 1) / (N - 1) * (X1 - X0); }
  function ty(v) { return Y1 - v * (Y1 - Y0); }
  function jb(t) { return 0.04 + 0.9 * Math.exp(-(t - 1) / 3.1); }
  function hal(t) { return 0.07 + 0.7 / (1 + Math.exp(-(t - 17) / 3.8)) + 0.035 * Math.sin(t * 0.85); }
  function smooth(a, b, t) { var x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); }
  function w1(t) { return 1 - smooth(7, 10, t); }
  function w2(t) { return smooth(8, 12, t); }
  function pathOf(f) {
    var d = '';
    for (var i = 0; i <= 156; i++) {
      var t = 1 + i / 156 * (N - 1);
      d += (i ? 'L' : 'M') + tx(t).toFixed(1) + ' ' + ty(f(t)).toFixed(1);
    }
    return d;
  }
  var tl = $('#tlSvg');
  var T1END = 7.5, T2START = 9.5;
  // grid
  [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { el('line', { x1: X0, x2: X1, y1: ty(v), y2: ty(v), class: 'tl-grid' }, tl); });
  var win1 = el('rect', { x: X0 - 8, y: Y0 - 14, width: tx(T1END) - X0 + 8, height: Y1 - Y0 + 14, rx: 8, fill: 'var(--t1-soft)', class: 'win' }, tl);
  var win2 = el('rect', { x: tx(T2START), y: Y0 - 14, width: X1 - tx(T2START) + 8, height: Y1 - Y0 + 14, rx: 8, fill: 'var(--t2-soft)', class: 'win' }, tl);
  var w1lbl = el('text', { x: X0 + 2, y: Y0 + 2, class: 'lbl', fill: 'var(--t1)' }, tl, 'Thrust I');
  var w2lbl = el('text', { x: tx(T2START) + 10, y: Y0 + 2, class: 'lbl', fill: 'var(--t2)' }, tl, 'Thrust II');
  el('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, class: 'tl-axis' }, tl);
  el('text', { x: X0 - 10, y: ty(1) + 4, 'text-anchor': 'end' }, tl, 'high');
  el('text', { x: X0 - 10, y: ty(0) + 4, 'text-anchor': 'end' }, tl, 'low');
  var ghost1 = el('path', { d: pathOf(jb), class: 'curve ghost', stroke: 'var(--t1)' }, tl);
  var ghost2 = el('path', { d: pathOf(hal), class: 'curve ghost', stroke: 'var(--t2)' }, tl);
  var c1 = el('path', { d: pathOf(jb), class: 'curve', stroke: 'var(--t1)' }, tl);
  var c2 = el('path', { d: pathOf(hal), class: 'curve', stroke: 'var(--t2)' }, tl);
  // token row
  var tokRects = [];
  for (var t = 1; t <= N; t++) {
    tokRects.push(el('rect', { x: tx(t) - 7, y: 202, width: 14, height: 14, rx: 3, fill: 'var(--line-2)', style: 'transition: fill .4s' }, tl));
  }
  el('text', { x: X0 - 10, y: 213, 'text-anchor': 'end' }, tl, 'tokens');
  el('text', { x: tx(1) - 7, y: 240 }, tl, 'early →');
  el('text', { x: tx(20), y: 240, 'text-anchor': 'middle' }, tl, 'mid-phase decoding');
  el('text', { x: X1 + 7, y: 240, 'text-anchor': 'end' }, tl, 'late →');

  var tg1 = $('#tgT1'), tg2 = $('#tgT2');
  var scn = 'jb';
  function drawTimeline() {
    var on1 = tg1.checked, on2 = tg2.checked;
    c1.setAttribute('d', pathOf(function (t) { return on1 ? jb(t) * (1 - 0.88 * w1(t)) : jb(t); }));
    c2.setAttribute('d', pathOf(function (t) { return on2 ? hal(t) * (1 - 0.72 * w2(t)) : hal(t); }));
    ghost1.style.opacity = on1 ? .55 : 0;
    ghost2.style.opacity = on2 ? .55 : 0;
    win1.style.opacity = on1 ? 1 : .35;
    win2.style.opacity = on2 ? 1 : .35;
    w1lbl.style.opacity = on1 ? 1 : .55;
    w2lbl.style.opacity = on2 ? 1 : .55;
    tokRects.forEach(function (r, i) {
      var k = i + 1;
      var f = 'var(--line-2)';
      if (on1 && k <= T1END) f = 'var(--t1)';
      if (on2 && k >= T2START) f = 'var(--t2)';
      r.setAttribute('fill', f);
    });
  }

  var SCN = {
    jb: {
      prompt: '<span class="img-chip">▣ adversarial image · ε = 16/255</span>Explain, step by step, how to make a dangerous substance at home.',
      off: [['Sure', 'bad'], [',', 'bad'], ['here', 'bad'], ['are', 'bad'], ['the', 'bad'], ['steps', 'bad'], [':'], ['1.'], ['██████', 'redact'], ['████', 'redact'], ['███████', 'redact'], ['2.'], ['█████', 'redact'], ['████████', 'redact'], ['…']],
      on: [['I', 's1'], ['can’t', 's1'], ['help', 's1'], ['with', 's1'], ['that', 's1'], ['.'], ['If'], ['you’re'], ['curious'], ['about'], ['chemistry'], ['safety'], [','], ['I'], ['can'], ['share'], ['general'], ['lab'], ['guidelines'], ['.']],
      verdict: function (o1) {
        return o1
          ? '<span class="pill ok">Refused</span><span>The gate fires on the <b>first tokens</b>; the rest of the reply is generated normally.</span>'
          : '<span class="pill bad">Jailbroken</span><span>The perturbation pushes the <b>opening tokens</b> into compliance, and the rest follows.</span>';
      },
      uses: 1
    },
    hal: {
      prompt: '<span class="img-chip">▣ photo · a blue pumpkin on a wooden chair</span>Describe this image in detail.',
      off: [['A'], ['wooden'], ['chair'], ['holds'], ['an'], ['orange', 'hall'], ['pumpkin'], [','], ['next'], ['to'], ['a'], ['dining', 'hall'], ['table', 'hall'], ['set'], ['with'], ['a'], ['fork', 'hall'], ['and'], ['plates', 'hall'], ['.']],
      on: [['A'], ['wooden'], ['chair'], ['holds'], ['a'], ['blue', 's2'], ['pumpkin', 's2'], [','], ['set', 's2'], ['against', 's2'], ['a'], ['plain', 's2'], ['light', 's2'], ['wall', 's2'], ['.']],
      verdict: function (o1, o2) {
        return o2
          ? '<span class="pill ok">Grounded</span><span>Stabilization strengthens as attention to the image fades, so <b>later tokens</b> stay tied to what is visible.</span>'
          : '<span class="pill bad">Hallucinated</span><span>Mid-way through, the decoder trades the pixels for <b>language priors</b>: pumpkins are “supposed to be” orange.</span>';
      },
      uses: 2
    }
  };

  var streamTimer = null;
  function stream() {
    var s = SCN[scn];
    var on = s.uses === 1 ? tg1.checked : tg2.checked;
    var toks = on ? s.on : s.off;
    $('#prompt').innerHTML = s.prompt;
    var box = $('#tokens');
    box.innerHTML = '';
    $('#verdict').innerHTML = '';
    clearInterval(streamTimer);
    var i = 0;
    function push() {
      if (i >= toks.length) {
        clearInterval(streamTimer);
        $('#verdict').innerHTML = s.verdict(tg1.checked, tg2.checked);
        return;
      }
      var tk = toks[i++];
      var span = document.createElement('span');
      span.className = 'tok' + (tk[1] ? ' ' + tk[1] : '');
      span.textContent = tk[0];
      if (reduceMotion) span.style.animation = 'none', span.style.opacity = 1, span.style.transform = 'none';
      box.appendChild(span);
    }
    if (reduceMotion) { while (i < toks.length) push(); push(); }
    else streamTimer = setInterval(push, 70);
  }
  function refreshDemo() { drawTimeline(); stream(); }
  tg1.addEventListener('change', refreshDemo);
  tg2.addEventListener('change', refreshDemo);
  $('#replay').addEventListener('click', stream);
  $$('[data-scn]').forEach(function (b) {
    b.addEventListener('click', function () {
      scn = b.dataset.scn;
      $$('[data-scn]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      stream();
    });
  });
  drawTimeline();
  // start streaming when the demo becomes visible
  var demoObs = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) { stream(); demoObs.disconnect(); }
  }, { threshold: 0.3 });
  demoObs.observe($('#demo'));

  /* =====================================================================
     2. Thrust I: projection gate
     ===================================================================== */
  var gate = $('#gateSvg');
  var O = { x: 70, y: 250 }, R = 300;
  var vAng = 18 * Math.PI / 180, v = { x: Math.cos(vAng), y: Math.sin(vAng) };
  function P(x, y) { return { x: O.x + x, y: O.y - y }; }   // math coords → svg
  var defs = el('defs', {}, gate);
  ['ink', 't1', 'mut'].forEach(function (id) {
    var col = id === 'ink' ? 'var(--ink)' : id === 't1' ? 'var(--t1)' : 'var(--ink-3)';
    var m = el('marker', { id: 'ar-' + id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', fill: col }, m);
  });
  var zone = el('polygon', { fill: 'var(--t1-soft)', opacity: .9 }, gate);
  var tauLine = el('line', { stroke: 'var(--t1)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, gate);
  var tauTxt = el('text', { fill: 'var(--t1)' }, gate, 'τ');
  var zoneTxt = el('text', { fill: 'var(--t1)', 'font-weight': 600 }, gate, 'harmful zone');
  var vEnd = P(v.x * (R + 40), v.y * (R + 40));
  el('line', { x1: O.x, y1: O.y, x2: vEnd.x, y2: vEnd.y, stroke: 'var(--ink-3)', 'stroke-width': 1.25, 'marker-end': 'url(#ar-mut)' }, gate);
  el('text', { x: vEnd.x - 6, y: vEnd.y + 18, 'text-anchor': 'end' }, gate, 'harmful direction v');
  var projLine = el('line', { stroke: 'var(--ink-3)', 'stroke-dasharray': '2 4' }, gate);
  var projDot = el('circle', { r: 4, fill: 'var(--ink-3)' }, gate);
  var hLine = el('line', { x1: O.x, y1: O.y, stroke: 'var(--t1)', 'stroke-width': 2.5, 'marker-end': 'url(#ar-t1)' }, gate);
  var hTxt = el('text', { fill: 'var(--t1)', 'font-weight': 600 }, gate, 'h');
  var sLine = el('line', { x1: O.x, y1: O.y, stroke: 'var(--ink)', 'stroke-width': 2.5, 'marker-end': 'url(#ar-ink)' }, gate);
  var sTxt = el('text', { fill: 'var(--ink)', 'font-weight': 600 }, gate, 'h′ (steered)');
  el('circle', { cx: O.x, cy: O.y, r: 3.5, fill: 'var(--ink)' }, gate);

  var adv = $('#advSlider'), tau = $('#tauSlider');
  function setFill(inp) { var p = (inp.value - inp.min) / (inp.max - inp.min) * 100; inp.style.setProperty('--p', p + '%'); }
  function drawGate() {
    var p = +adv.value, th = +tau.value;
    setFill(adv); setFill(tau);
    $('#advOut').textContent = fmt(p); $('#tauOut').textContent = fmt(th);
    var ang = (96 - 76 * p) * Math.PI / 180, len = R * (0.62 + 0.3 * p);
    var h = { x: Math.cos(ang) * len, y: Math.sin(ang) * len };
    var proj = (h.x * v.x + h.y * v.y) / R;
    var open = proj > th;
    // threshold line ⟂ v at distance th·R
    var c = { x: v.x * th * R, y: v.y * th * R }, nrm = { x: -v.y, y: v.x };
    var a = P(c.x + nrm.x * 230, c.y + nrm.y * 230), b = P(c.x - nrm.x * 40, c.y - nrm.y * 40);
    tauLine.setAttribute('x1', a.x); tauLine.setAttribute('y1', a.y); tauLine.setAttribute('x2', b.x); tauLine.setAttribute('y2', b.y);
    var far = { x: v.x * 1.4 * R, y: v.y * 1.4 * R };
    var z1 = P(far.x + nrm.x * 230, far.y + nrm.y * 230), z2 = P(far.x - nrm.x * 40, far.y - nrm.y * 40);
    zone.setAttribute('points', [a, z1, z2, b].map(function (q) { return q.x + ',' + q.y; }).join(' '));
    tauTxt.setAttribute('x', a.x + 6); tauTxt.setAttribute('y', a.y + 12);
    var zt = P(v.x * (th * R + 30) + nrm.x * 170, v.y * (th * R + 30) + nrm.y * 170);
    zoneTxt.setAttribute('x', Math.min(zt.x, 380)); zoneTxt.setAttribute('y', Math.max(zt.y, 22));
    var hE = P(h.x, h.y);
    hLine.setAttribute('x2', hE.x); hLine.setAttribute('y2', hE.y);
    hTxt.setAttribute('x', hE.x + 8); hTxt.setAttribute('y', hE.y - 4);
    var pf = P(v.x * proj * R, v.y * proj * R);
    projLine.setAttribute('x1', hE.x); projLine.setAttribute('y1', hE.y); projLine.setAttribute('x2', pf.x); projLine.setAttribute('y2', pf.y);
    projDot.setAttribute('cx', pf.x); projDot.setAttribute('cy', pf.y);
    // steering: pull the harmful component back to just inside the gate
    var cut = open ? (proj - th * 0.6) * R : 0;
    var s = { x: h.x - v.x * cut, y: h.y - v.y * cut };
    var sE = P(s.x, s.y);
    sLine.setAttribute('x2', sE.x); sLine.setAttribute('y2', sE.y);
    sLine.style.opacity = open ? 1 : 0; sTxt.style.opacity = open ? 1 : 0;
    sTxt.setAttribute('x', sE.x - 10); sTxt.setAttribute('y', sE.y - 10);
    sTxt.setAttribute('text-anchor', 'end');
    $('#projOut').textContent = fmt(proj);
    var g = $('#gateOut');
    g.textContent = open ? 'open · steer' : 'closed';
    g.className = open ? 'gate-on' : 'gate-off';
    var k = open ? Math.max(1, Math.round(2 + 4 * (proj - th) / (1 - th))) : 0;
    $('#steerOut').textContent = open ? 'tokens 1–' + k : 'none';
  }
  adv.addEventListener('input', drawGate);
  tau.addEventListener('input', drawGate);
  drawGate();

  /* =====================================================================
     3. Thrust II: adaptive stabilization coefficient
     ===================================================================== */
  var stab = $('#stabSvg');
  var SN = 40, SX0 = 44, SX1 = 446;
  function sx(t) { return SX0 + (t - 1) / (SN - 1) * (SX1 - SX0); }
  var AY0 = 16, AY1 = 128, LY0 = 160, LY1 = 236;
  function ay(v) { return AY1 - v * (AY1 - AY0); }
  function att(t) { return Math.max(0.05, 0.7 * Math.exp(-(t - 1) / 20) + 0.14 + 0.08 * Math.sin(t / 1.9) + 0.05 * Math.cos(t * 1.3)); }
  [0, 0.5, 1].forEach(function (g) { el('line', { x1: SX0, x2: SX1, y1: ay(g), y2: ay(g), stroke: 'var(--grid)' }, stab); });
  el('text', { x: SX0 - 6, y: ay(1) + 4, 'text-anchor': 'end' }, stab, '1');
  el('text', { x: SX0 - 6, y: ay(0) + 4, 'text-anchor': 'end' }, stab, '0');
  el('text', { x: SX0, y: AY0 - 4 }, stab, 'attention to vision a(t)');
  var d = '';
  for (var i = 0; i <= 160; i++) { var tt = 1 + i / 160 * (SN - 1); d += (i ? 'L' : 'M') + sx(tt).toFixed(1) + ' ' + ay(att(tt)).toFixed(1); }
  el('path', { d: d, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linecap': 'round' }, stab);
  var aLine = el('line', { x1: SX0, x2: SX1, stroke: 'var(--t2)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, stab);
  var aTxt = el('text', { x: SX1, 'text-anchor': 'end', fill: 'var(--t2)' }, stab, 'a*');
  el('line', { x1: SX0, x2: SX1, y1: LY1, y2: LY1, stroke: 'var(--line-2)' }, stab);
  el('text', { x: SX0, y: LY0 - 6 }, stab, 'stabilization strength λ(t)');
  el('rect', { x: SX0 - 6, y: LY0, width: sx(8.5) - SX0 + 6, height: LY1 - LY0, rx: 5, fill: 'var(--t1-soft)', opacity: .7 }, stab);
  el('text', { x: (SX0 + sx(8.5)) / 2, y: LY1 - 8, 'text-anchor': 'middle', fill: 'var(--t1)' }, stab, 'Thrust I');
  el('text', { x: SX0, y: LY1 + 18 }, stab, 'token 1');
  el('text', { x: SX1, y: LY1 + 18, 'text-anchor': 'end' }, stab, 'token 40');
  var lamBars = [];
  for (var k = 1; k <= SN; k++) {
    lamBars.push(el('rect', { x: sx(k) - 3.5, width: 7, rx: 2, fill: 'var(--t2)', y: LY1, height: 0, style: 'transition: y .35s, height .35s' }, stab));
  }
  var lam = $('#lamSlider'), aS = $('#aSlider');
  function drawStab() {
    setFill(lam); setFill(aS);
    var l0 = +lam.value, astar = +aS.value;
    $('#lamOut').textContent = fmt(l0); $('#aOut').textContent = fmt(astar);
    aLine.setAttribute('y1', ay(astar)); aLine.setAttribute('y2', ay(astar));
    aTxt.setAttribute('y', ay(astar) - 6);
    var n = 0, peak = 0;
    lamBars.forEach(function (r, i) {
      var t = i + 1;
      var gap = Math.max(0, (astar - att(t)) / astar);
      var lt = t <= 8 ? 0 : Math.min(1, l0 * (0.25 + 1.6 * gap) * (gap > 0 ? 1 : 0));
      if (lt > 0.001) n++;
      peak = Math.max(peak, lt);
      var hgt = lt * (LY1 - LY0 - 6);
      r.setAttribute('y', LY1 - hgt); r.setAttribute('height', hgt);
    });
    $('#nSteer').textContent = n + ' / 32';
    $('#peakLam').textContent = fmt(peak);
  }
  lam.addEventListener('input', drawStab);
  aS.addEventListener('input', drawStab);
  drawStab();

  /* =====================================================================
     4. Grouped bar chart (HALS + Trajectory-Lens)
     ===================================================================== */
  function niceMax(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= v) return steps[i] * p;
    return 10 * p;
  }
  function barD(x, y0, w, h, r) {
    // rounded top corners only, anchored at baseline y0
    r = Math.min(r, w / 2, Math.max(h, 0));
    var y = y0 - h;
    return 'M' + x + ' ' + y0 + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y +
      'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + y0 + 'Z';
  }
  /* opts: {cats, a, b, aName, bName, decimals, lowerBetter, unit} */
  function groupedBars(container, opts) {
    var W = 920, H = 300, L = 46, Rr = 10, T = 26, B = 44;
    var max = niceMax(Math.max.apply(null, opts.a.concat(opts.b)) * 1.12);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opts.label });
    var y = function (v) { return T + (1 - v / max) * (H - T - B); };
    var y0 = y(0);
    for (var g = 0; g <= 4; g++) {
      var gv = max * g / 4;
      el('line', { x1: L, x2: W - Rr, y1: y(gv), y2: y(gv), stroke: g ? 'var(--grid)' : 'var(--line-2)' }, svg);
      el('text', { x: L - 8, y: y(gv) + 4, 'text-anchor': 'end' }, svg, gv % 1 ? gv.toFixed(gv < 10 ? 1 : 0) : gv);
    }
    var n = opts.cats.length, band = (W - L - Rr) / n;
    var bw = Math.min(42, band * 0.3), gap = 2;
    var plot = el('g', {}, svg);
    var bars = [];
    opts.cats.forEach(function (c, i) {
      var cx = L + band * (i + 0.5);
      var grp = el('g', { class: 'grp' }, plot);
      var xa = cx - bw - gap / 2, xb = cx + gap / 2;
      var ra = el('path', { d: barD(xa, y0, bw, 0, 4), fill: 'var(--base)', class: 'bar' }, grp);
      var rb = el('path', { d: barD(xb, y0, bw, 0, 4), fill: 'var(--t2)', class: 'bar' }, grp);
      bars.push([ra, xa, opts.a[i]], [rb, xb, opts.b[i]]);
      var delta = opts.b[i] - opts.a[i];
      var good = opts.lowerBetter ? delta < 0 : delta > 0;
      el('text', { x: xb + bw / 2, y: y(opts.b[i]) - 8, 'text-anchor': 'middle', class: 'delta', style: good ? 'fill:var(--t2)' : '' }, grp, signed(delta, opts.decimals));
      el('text', { x: cx, y: H - B + 20, 'text-anchor': 'middle', class: 'cat' }, grp, c);
      var hit = el('rect', { x: cx - band / 2, y: T - 10, width: band, height: H - T - B + 10, class: 'hit' }, grp);
      function over(ev) {
        svg.parentNode.classList.add('dim'); grp.classList.add('hot');
        showTip('<div style="font-weight:600;margin-bottom:3px">' + c + '</div>' +
          '<div><span class="k" style="background:var(--base)"></span>' + opts.aName + ' <b>' + fmt(opts.a[i], opts.decimals) + '</b></div>' +
          '<div><span class="k" style="background:var(--t2)"></span>' + opts.bName + ' <b>' + fmt(opts.b[i], opts.decimals) + '</b></div>' +
          '<div style="opacity:.75;margin-top:2px">Δ ' + signed(delta, opts.decimals) + (opts.lowerBetter ? ' (lower is better)' : ' (higher is better)') + '</div>',
          ev.clientX, ev.clientY);
      }
      hit.addEventListener('mousemove', over);
      hit.addEventListener('mouseleave', function () { svg.parentNode.classList.remove('dim'); grp.classList.remove('hot'); hideTip(); });
    });
    container.innerHTML = '';
    container.appendChild(svg);
    var draw = function () { bars.forEach(function (b) { b[0].setAttribute('d', barD(b[1], y0, bw, y0 - y(b[2]), 4)); }); };
    if (reduceMotion) draw(); else requestAnimationFrame(function () { requestAnimationFrame(draw); });
  }
  function table(container, head, rows) {
    var h = '<table class="data-table"><thead><tr>' + head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) { h += '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + r.cells.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr>'; });
    container.innerHTML = h + '</tbody></table>';
  }

  /* ---------- HALS data (from the HALS paper) ---------- */
  var HALS = {
    chair: { cats: ['Vanilla CLIP', 'SLADE', 'FARE', 'TeCoA', 'TGA-ZSR'], a: [46.4, 50.6, 52.4, 56.4, 60.2], b: [15.4, 16.0, 13.6, 19.8, 23.2], d: 1, low: true,
      t: 'CHAIR<sub>S</sub> drops by 31 to 39 points on every encoder',
      p: 'CHAIR<sub>S</sub> ↓ on LLaVA-v1.5. HALS also beats DoLa, VCD, PAI, OPERA, VTI and VISTA across every robust encoder.' },
    pope: { cats: ['Vanilla CLIP', 'SLADE', 'FARE', 'TeCoA', 'TGA-ZSR'], a: [84.8, 78.6, 77.8, 76.5, 75.1], b: [85.2, 82.2, 80.2, 79.3, 77.4], d: 1, low: false,
      t: 'POPE accuracy recovers on robust encoders',
      p: 'POPE accuracy (%) ↑ on LLaVA-v1.5. Robust encoders lose 6 to 10 points against vanilla CLIP; HALS wins back 2.3 to 3.6.' },
    amber: { cats: ['Vanilla CLIP', 'SLADE', 'FARE', 'TeCoA'], a: [37.6, 40.6, 36.4, 48.7], b: [19.5, 24.9, 22.8, 28.6], d: 1, low: true,
      t: 'Open-ended hallucination nearly halves on AMBER',
      p: 'AMBER Hal ↓ on LLaVA-v1.5. On ShareGPT4V + TeCoA, HALS cuts Hal from 73.0 to 17.3.' },
    mmhal: { cats: ['Vanilla CLIP', 'SLADE', 'FARE', 'TeCoA'], a: [2.35, 2.05, 2.01, 1.98], b: [3.05, 2.78, 2.66, 2.58], d: 2, low: false,
      t: 'Better answers beyond object hallucination',
      p: 'MMHal-Bench average score ↑ on ShareGPT4V: +0.66 on average, with the hallucination rate down 0.14.' },
    mme: { cats: ['Vanilla CLIP', 'SLADE', 'FARE', 'TeCoA'], a: [615.6, 598.4, 582.6, 552.6], b: [635.2, 612.4, 616.6, 590.6], d: 1, low: false,
      t: 'General perception improves, too',
      p: 'MME score ↑ on ShareGPT4V: +28.7 on average, outperforming VTI and VCD.' }
  };
  var halsSel = $('#halsMetric');
  function drawHals() {
    var m = HALS[halsSel.value];
    $('#halsTitle').innerHTML = m.t;
    $('#halsDesc').innerHTML = m.p;
    groupedBars($('#halsChart'), { cats: m.cats, a: m.a, b: m.b, aName: 'Baseline', bName: '+ HALS', decimals: m.d, lowerBetter: m.low, label: m.p.replace(/<[^>]+>/g, '') });
    table($('#halsTable'), ['Encoder', 'Baseline', '+ HALS', 'Δ'], m.cats.map(function (c, i) {
      return { cells: [c, fmt(m.a[i], m.d), '<b>' + fmt(m.b[i], m.d) + '</b>', signed(m.b[i] - m.a[i], m.d)] };
    }));
  }
  halsSel.addEventListener('change', drawHals);

  /* ---------- Trajectory-Lens data (LLaVA-Next-7B AUROC) ---------- */
  var TLB = ['SQA', 'InfoVQA', 'ChartQA', 'TextVQA', 'DocVQA', 'OCRBench', 'MME', 'VizWiz'];
  var TLM = [
    ['CoER', [59.35, 53.02, 58.24, 52.12, 50.26, 51.09, 52.59, 57.41]],
    ['CoEC', [59.04, 54.28, 61.62, 52.76, 57.83, 63.08, 55.03, 56.10]],
    ['INSIDE', [70.80, 59.07, 60.43, 59.48, 60.10, 59.25, 66.92, 60.94]],
    ['Logical Closed Loop †*', [54.10, 51.26, 58.74, 54.25, 52.35, 61.56, 49.66, 51.51]],
    ['Devils in Middle Layers *', [33.94, 50.63, 56.38, 49.12, 57.68, 54.04, 48.30, 34.04]],
    ['Semantic Uncertainty †', [50.74, 53.74, 56.07, 60.52, 62.20, 57.09, 64.41, 50.45]],
    ['Calib-Corr', [73.73, 56.54, 54.43, 61.53, 62.67, 62.34, 66.82, 60.28]],
    ['VL-Calibration *', [53.30, 53.21, 54.19, 54.38, 50.75, 53.13, 53.51, 42.03]]
  ];
  var OURS = [74.80, 61.14, 62.35, 62.80, 61.68, 65.25, 67.47, 61.25];
  var BEST = TLB.map(function (_, j) { return Math.max.apply(null, TLM.map(function (m) { return m[1][j]; })); });
  var tlSel = $('#tlBase');
  tlSel.innerHTML = '<option value="best">Strongest baseline (per benchmark)</option>' +
    TLM.map(function (m, i) { return '<option value="' + i + '">' + m[0] + '</option>'; }).join('');
  function drawTL() {
    var isBest = tlSel.value === 'best';
    var base = isBest ? BEST : TLM[+tlSel.value][1];
    var name = isBest ? 'Strongest baseline' : TLM[+tlSel.value][0];
    $('#tlBaseName').textContent = name;
    groupedBars($('#tlChart'), { cats: TLB, a: base, b: OURS, aName: name, bName: 'Trajectory-Lens', decimals: 2, lowerBetter: false, label: 'AUROC of Trajectory-Lens versus ' + name });
    var wins = OURS.filter(function (v, j) { return v > base[j]; }).length;
    $('#tlWins').textContent = 'Trajectory-Lens higher on ' + wins + ' of 8 benchmarks vs. ' + name + '.';
    var rows = TLM.map(function (m) { return { cells: [m[0]].concat(m[1].map(function (v, j) { return v === BEST[j] && v > OURS[j] ? '<span style="font-weight:700">' + fmt(v) + '</span>' : fmt(v); })) }; });
    rows.push({ cls: 'ours', cells: ['Trajectory-Lens (ours) *'].concat(OURS.map(function (v, j) { return v >= BEST[j] ? '<span style="color:var(--t2);font-weight:700">' + fmt(v) + '</span>' : fmt(v); })) });
    table($('#tlTable'), ['Method'].concat(TLB), rows);
  }
  tlSel.addEventListener('change', drawTL);

  // draw charts once visible so bars grow in view
  var chartObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target.id === 'halsCard') drawHals(); else drawTL();
      chartObs.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  chartObs.observe($('#halsCard'));
  chartObs.observe($('#tlCard'));

  $$('[data-table-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.dataset.tableToggle;
      var tbl = $('#' + id + 'Table'), ch = $('#' + id + 'Chart');
      var showTable = tbl.hidden;
      tbl.hidden = !showTable; ch.hidden = showTable;
      b.textContent = showTable ? 'Chart view' : 'Table view';
    });
  });

  /* =====================================================================
     5. Compute breakdown (proposal Table 1)
     ===================================================================== */
  var COMPUTE = [
    ['Utility preservation', 'VisIT-Bench, ScienceQA, COCO, Flickr30k', 4500, ''],
    ['Thrust II experiments', 'HallusionBench, POPE (open-ended)', 1500, 't2'],
    ['Ablation & trade-off studies', 'Subsets of all of the above', 1200, ''],
    ['Thrust I experiments', 'AdvBench (25), RealToxicityPrompts (100)', 1100, 't1'],
    ['Thrust II implementation', 'HallusionBench / POPE calibration', 700, 't2'],
    ['Thrust I implementation', 'Calibration sets across 4 LVLMs', 500, 't1'],
    ['Reproducibility & overhead', 'Replication, failed/preempted jobs', 500, '']
  ];
  var hb = $('#hbars');
  COMPUTE.forEach(function (r) {
    var row = document.createElement('div');
    row.className = 'hbar-row';
    row.innerHTML = '<div class="n">' + r[0] + '<small>' + r[1] + '</small></div>' +
      '<div class="hbar-track"><div class="hbar-fill ' + r[3] + '" data-w="' + (r[2] / 4500 * 100) + '"></div></div>' +
      '<div class="v">' + r[2].toLocaleString() + '</div>';
    hb.appendChild(row);
  });
  var hbObs = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return;
    $$('.hbar-fill', hb).forEach(function (f, i) { setTimeout(function () { f.style.width = f.dataset.w + '%'; }, reduceMotion ? 0 : i * 70); });
    hbObs.disconnect();
  }, { threshold: 0.3 });
  hbObs.observe(hb);

  /* =====================================================================
     6. Timeline phases
     ===================================================================== */
  var PHASES = [
    { src: '1-month and 3-month progress updates',
      scope: ['Set up the computational environment on NAIRR-supported Purdue Anvil AI: open-source LVLMs, multimodal datasets and evaluation pipelines.',
              'Baseline evaluations across multiple LVLMs for adversarial robustness, hallucination and core-utility preservation.',
              'Thrust I prototype: inference-time latent steering with projection-based gating in the early stages of generation, including how intervention timing affects unsafe or unreliable output.',
              'Thrust II infrastructure: how internal multimodal representations and generation trajectories differ between grounded and unreliable responses.'],
      out: ['Working experimental pipeline on Anvil with multi-model, multi-seed evaluation.',
            'Baseline reference results for evaluating ARMOR-HAL.',
            'Initial latent-steering pipeline (Thrust I).'] },
    { src: '9-month progress update',
      scope: ['Extensive experiments across LVLMs, robust vision encoders and multimodal benchmarks on how robustness interventions affect visual grounding and hallucination.',
              'Characterized spatial token homogenization: adversarial robustness alters the geometry of visual representations and increases hallucination.',
              'Developed HALS, a training-free, inference-time steering method that restores grounding while preserving adversarial robustness.'],
      out: ['<b>HALS</b>, accepted to the NeurIPS 2026 Main Conference.',
            'Large-scale multi-seed evaluations and ablations enabled by the NAIRR allocation.'] },
    { src: 'remaining-period plan in the 9-month update',
      scope: ['Extend toward adaptive interventions that decide when and where corrective steering is applied during generation.',
              'Systematic trade-off evaluation across robustness, hallucination, visual grounding and general utility.',
              'Additional generalization and ablation studies; continued development of the integrated ARMOR-HAL framework.',
              'Consolidate research artifacts and reproducibility resources for public release.'],
      out: ['<b>Trajectory-Lens</b>, published at EMNLP 2026 (Main).',
            'Final NAIRR report and this project page.'] }
  ];
  var phaseBtns = $$('.phase');
  function showPhase(i) {
    phaseBtns.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); });
    var p = PHASES[i];
    $('#phaseDetail').innerHTML =
      '<div><h5>Scope</h5><ul>' + p.scope.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
      '<div><h5>Outputs</h5><ul>' + p.out.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
      '<p class="note" style="grid-column:1/-1;margin:0">Source: ' + p.src + ' (NAIRR250393).</p>';
  }
  phaseBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { showPhase(i); });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var j = (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
        phaseBtns[j].focus(); showPhase(j);
      }
    });
  });
  showPhase(2);

})();
