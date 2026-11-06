/* =========================================================
   TONGUES OF THE WORLD — playback engine
   Deterministic: every frame is computed from film time t,
   so play / pause / seek / ?t= stills all render identically.
   ========================================================= */
(function () {
  const F = window.FILM;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), layer = $('layer'), fx = $('fx'), countriesG = $('countries');
  const params = new URLSearchParams(location.search);
  const hm = location.hash.match(/t=([\d.]+)/);
  if (hm) { params.set('t', hm[1]); if (/still/.test(location.hash)) params.set('still', '1'); if (/nocc/.test(location.hash)) params.set('nocc', '1'); }
  if (window.FILM_START != null && !hm) { params.set('t', window.FILM_START); params.set('still', '1'); }
  const STILL = params.has('still');
  if (STILL) document.body.classList.add('still');

  ['cams', 'paints', 'dims', 'skies', 'boxes', 'chapters', 'captions'].forEach(k => F[k].sort((a, b) => a.t - b.t));

  /* ---------- easing ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const eout = p => 1 - Math.pow(1 - p, 3);
  const eback = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };

  /* ---------- stage scaling ---------- */
  function fit() {
    const vp = $('viewport'), s = Math.min(vp.clientWidth / 1920, vp.clientHeight / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------- map ---------- */
  let baseScale = 350, countryPaths = [], byName = {}, mapReady = false, lastCamKey = '';
  const geoPath = d3.geoPath();
  const sphere = { type: 'Sphere' }, grat = d3.geoGraticule10();

  function makeProj([lon, lat, k]) {
    const p = d3.geoNaturalEarth1().rotate([-lon, 0]).scale(baseScale * k).translate([960, 540]);
    const y = p([lon, lat])[1];
    p.translate([960, 540 + (540 - y)]);
    return p;
  }
  function camAt(t) {
    let state = F.cams[0].to.slice();
    for (const c of F.cams) {
      if (t >= c.t + c.dur) { state = c.to.slice(); continue; }
      if (t >= c.t) {
        const p = eio(clamp((t - c.t) / c.dur)), a = state, b = c.to;
        const dist = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
        const bump = 1 - Math.min(0.35, dist / 300) * Math.sin(Math.PI * p);   // pull back mid-flight
        const k = Math.exp(Math.log(a[2]) + (Math.log(b[2]) - Math.log(a[2])) * p) * bump;
        return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, k];
      }
      break;
    }
    return state;
  }

  async function loadMap() {
    baseScale = d3.geoNaturalEarth1().fitSize([1900, 1060], sphere).scale();
    const topo = await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')).json();
    const feats = topojson.feature(topo, topo.objects.countries).features.filter(f => f.properties.name !== 'Antarctica');
    countryPaths = feats.map(f => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('class', 'land');
      countriesG.appendChild(el);
      const rec = { f, el, color: null };
      byName[f.properties.name] = rec;
      return rec;
    });
    mapReady = true;
  }
  function drawMap(proj, key) {
    if (key === lastCamKey) return;
    lastCamKey = key;
    geoPath.projection(proj);
    $('sphere').setAttribute('d', geoPath(sphere));
    $('graticule').setAttribute('d', geoPath(grat));
    for (const c of countryPaths) c.el.setAttribute('d', geoPath(c.f) || '');
  }
  function applyPaints(t) {
    const want = {};
    for (const p of F.paints) {
      if (p.t > t) break;
      if (p.clear === true) { for (const k in want) delete want[k]; }
      else if (p.clear) p.clear.forEach(n => delete want[n]);
      else p.c.forEach(n => want[n] = p.color);
    }
    for (const c of countryPaths) {
      const col = want[c.f.properties.name] || null;
      if (col !== c.color) { c.color = col; c.el.style.fill = col || ''; if (col) flash(c.el); }
    }
  }
  function flash(el) { el.classList.remove('flash'); void el.getBBox; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 700); }

  /* ---------- helpers ---------- */
  const lastAt = (arr, t) => { let r = null; for (const x of arr) { if (x.t > t) break; r = x; } return r; };
  const isMapPt = p => Array.isArray(p) || (p && p.ll);
  function pt(p, proj, off) {
    let r = Array.isArray(p) ? proj(p) : p.ll ? proj(p.ll) : p.xy.slice();
    if (off) r = [r[0] + off[0], r[1] + off[1]];
    return r;
  }
  const svg = (tag, attrs) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* ---------- item lifecycle ---------- */
  const live = new Map();

  function create(it, t) {
    const late = t - it.t > 0.6;
    if (it.type === 'arrow') {
      const g = svg('g', { class: 'arrow' });
      const base = svg('path', { class: 'arr-base', stroke: it.color, 'stroke-width': 3 });
      if (it.dash) base.setAttribute('stroke-dasharray', '16 12');
      const line = svg('path', { class: it.dash ? 'arr-dash' : 'arr-line', stroke: it.color, 'stroke-width': it.dash ? 5 : 6, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow)' });
      const head = svg('path', { d: 'M0,-11 L22,0 L0,11 L5,0 Z', fill: it.color, filter: 'url(#glow)' });
      const start = svg('circle', { r: 7, fill: it.color });
      g.append(base, line, start, head);
      let mover, label;
      if (it.mover) { mover = svg('text', { class: 'mover', 'text-anchor': 'middle', 'dominant-baseline': 'central' }); mover.textContent = it.mover; g.append(mover); }
      if (it.label) { label = svg('text', { class: 'arr-lbl', fill: it.color, 'text-anchor': 'middle' }); label.textContent = it.label; g.append(label); }
      if (it.head === false) head.style.display = 'none';
      fx.appendChild(g);
      return { node: g, base, line, head, start, mover, label };
    }
    const el = document.createElement('div');
    el.className = 'el' + (it.type === 'pin' ? ' pin' : '') + (it.type === 'fly' ? ' fly' : '') + (it.anim === 'rise' ? ' rise' : '') +
      (it.wrap === 'bob' ? ' bob' : '') + (it.wrap === 'stamped' ? ' stampwrap' : '') + (late ? ' late' : '');
    const inner = document.createElement('div');
    inner.className = 'in ' + (it.cls || '');
    if (it.type === 'pin') {
      const fl = /^[a-z]{2}$/.test(it.flag) ? `<img src="https://flagcdn.com/w160/${it.flag}.png" alt="${it.flag} flag">` : it.flag;
      inner.innerHTML = `<div class="flag">${fl}</div><div class="lbl">${it.label}</div><div class="stick"></div><div class="dot"></div>`;
    } else if (it.type === 'bars') {
      inner.className = 'in bars';
      inner.innerHTML = `<h4>${it.title}</h4><p>${it.sub}</p>` + it.rows.map(([n, v, c]) =>
        `<div class="row"><div class="name">${n}</div><div class="b" style="background:${c}" data-w="${v / it.max * 1000}">${v.toLocaleString('en-US')}${it.unit}</div></div>`).join('');
    } else if (it.type === 'counter') {
      inner.textContent = it.fmt(it.from);
    } else inner.innerHTML = it.html;
    el.appendChild(inner);
    layer.appendChild(el);
    return { node: el, inner, bars: it.type === 'bars' ? [...inner.querySelectorAll('.b')] : null };
  }

  function update(it, L, t, proj, dimInfo) {
    const age = t - it.t, out = t >= it.u;
    const dimmed = dimInfo.on && it.t < dimInfo.t && (isMapPt(it.p) || isMapPt(it.from));
    if (it.type === 'arrow') {
      const a = pt(it.from, proj), b = pt(it.to, proj);
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const bend = it.bend != null ? it.bend : 0.2;
      const c = [(a[0] + b[0]) / 2 - dy / len * len * bend, (a[1] + b[1]) / 2 + dx / len * len * bend - (it.bend === 0 ? 0 : 0)];
      const p = eout(clamp(age / it.dur));
      const q = (s) => [(1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]];
      const tip = q(p), c1 = [a[0] + (c[0] - a[0]) * p, a[1] + (c[1] - a[1]) * p];
      L.base.setAttribute('d', `M${a}Q${c} ${b}`);
      L.base.style.opacity = it.dash ? 0 : 0.25 * p;
      L.line.setAttribute('d', `M${a}Q${c1} ${tip}`);
      L.start.setAttribute('cx', a[0]); L.start.setAttribute('cy', a[1]);
      const tan = q(Math.max(0, p - 0.02)), ang = Math.atan2(tip[1] - tan[1], tip[0] - tan[0]) * 180 / Math.PI;
      L.head.setAttribute('transform', `translate(${tip}) rotate(${ang}) scale(${p > 0.02 ? 1 : 0})`);
      if (L.mover) {
        const show = age < it.dur + 0.35 && age >= 0;
        L.mover.setAttribute('x', tip[0]); L.mover.setAttribute('y', tip[1] - 30);
        L.mover.style.opacity = show ? 1 : 0;
      }
      if (L.label) {
        const m = it.labelAt === 'mid' ? q(0.5) : b;
        L.label.setAttribute('x', m[0]); L.label.setAttribute('y', m[1] + (it.labelAt === 'mid' ? -22 : 38));
        L.label.style.opacity = clamp((age - it.dur * 0.6) / 0.3);
      }
      L.node.style.opacity = out ? clamp(1 - (t - it.u) / 0.45) : dimmed ? 0.08 : 1;
      return;
    }
    const n = L.node;
    if (it.p) { const [x, y] = pt(it.p, proj, it.off); n.style.left = x + 'px'; n.style.top = y + 'px'; }
    if (it.type === 'fly') {
      const p = clamp(age / it.dur), e = eio(p);
      const a = pt(it.from, proj), b = pt(it.to, proj);
      n.style.left = a[0] + (b[0] - a[0]) * e + 'px';
      n.style.top = a[1] + (b[1] - a[1]) * e - Math.sin(Math.PI * e) * 140 + 'px';
      if (!out) { L.inner.style.transform = `scale(${0.3 + 0.7 * eback(p)}) rotate(${(1 - e) * -14}deg)`; L.inner.style.opacity = clamp(p * 5); }
    }
    if (it.type === 'counter') L.inner.textContent = it.fmt(it.from + (it.to - it.from) * eout(clamp(age / it.dur)));
    if (L.bars) L.bars.forEach((b, i) => { if (age > 0.5 + i * (it.step || 0.25) && !b._set) { b._set = 1; b.style.width = b.dataset.w + 'px'; } });
    n.classList.toggle('out', out);
    n.classList.toggle('dimmed', dimmed);
  }

  function removeLive(i) { const L = live.get(i); if (L) { L.node.remove(); live.delete(i); } }
  function clearLive() { for (const i of [...live.keys()]) removeLive(i); }

  /* ---------- frame ---------- */
  let prevT = -1;
  function render(t, playing) {
    if (!mapReady) return;
    const cam = camAt(t);
    const proj = makeProj(cam);
    drawMap(proj, cam.map(v => v.toFixed(3)).join());
    applyPaints(t);

    const dimE = lastAt(F.dims, t), dimInfo = { on: !!(dimE && dimE.on), t: dimE ? dimE.t : 0 };
    $('dim').classList.toggle('on', dimInfo.on);
    const sk = lastAt(F.skies, t); if (sk && $('sky').dataset.bg !== sk.bg) { $('sky').dataset.bg = sk.bg; $('sky').style.background = sk.bg; }
    const bx = lastAt(F.boxes, t); $('letterbox').classList.toggle('on', !!(bx && bx.on));

    const ch = F.chapters.find(c => t >= c.t && t < c.u);
    $('chapter').classList.toggle('on', !!ch);
    if (ch && $('chapNum').textContent !== ch.n) { $('chapNum').textContent = ch.n; $('chapTitle').textContent = ch.title; }

    const cap = F.captions.find(c => t >= c.t && t < c.u);
    const capEl = $('caption'), txt = cap && ccOn ? cap.text : '';
    if (capEl.textContent !== txt) capEl.textContent = txt;

    // camera shake on stamps + slow Ken-Burns breathing
    let sx = 0, sy = 0;
    F.items.forEach((it, i) => {
      const end = it.u + 0.45;
      if (t >= it.t && t < end) {
        let L = live.get(i);
        if (!L) { L = create(it, t); live.set(i, L); }
        update(it, L, t, proj, dimInfo);
        if (it.wrap === 'stamped') { const a = t - it.t - 0.12; if (a > 0 && a < 0.4) { const k = (1 - a / 0.4) * 9; sx += Math.sin(a * 90) * k; sy += Math.cos(a * 70) * k; } }
        if (playing && it.sfx && prevT < it.t && t >= it.t && t - prevT < 0.5) AudioFX.sfx(it.sfx);
      } else if (live.has(i)) removeLive(i);
    });
    if (playing) F.chapters.forEach(c => { if (prevT < c.t && t >= c.t && t - prevT < 0.5) AudioFX.sfx('whoosh'); });
    const breathe = 1 + 0.012 * Math.sin(t / 6);
    const tr = `translate(${sx}px,${sy}px) scale(${breathe})`;
    $('map').style.transform = tr; $('fxs').style.transform = tr; layer.style.transform = tr;
    prevT = t;
  }

  /* ---------- transport ---------- */
  let t = clamp(parseFloat(params.get('t')) || 0, 0, F.duration), playing = false, t0 = 0, wall0 = 0, ccOn = true, sndOn = true;
  const fmtT = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  function now() { return playing ? clamp(t0 + (performance.now() - wall0) / 1000, 0, F.duration) : t; }
  function play() {
    if (t >= F.duration - 0.05) seek(0);
    AudioFX.init(); AudioFX.reset(t);
    playing = true; t0 = t; wall0 = performance.now(); prevT = t;
    $('play').textContent = '❚❚';
  }
  function pause() { t = now(); playing = false; $('play').textContent = '▶'; }
  function seek(s) {
    t = clamp(s, 0, F.duration); t0 = t; wall0 = performance.now();
    clearLive(); prevT = t; AudioFX.reset(t);
    if (!playing) render(t, false);
  }
  function loop() {
    if (playing) {
      t = now();
      if (t >= F.duration) { pause(); }
      AudioFX.update(t, playing);
    }
    render(t, playing);
    $('fill').style.width = (t / F.duration * 100) + '%';
    $('time').textContent = fmtT(t) + ' / ' + fmtT(F.duration);
    requestAnimationFrame(loop);
  }

  F.chapters.forEach(c => { const s = document.createElement('span'); s.style.left = (c.t / F.duration * 100) + '%'; s.title = c.n + ' · ' + c.title; $('marks').appendChild(s); });
  $('play').onclick = () => playing ? pause() : play();
  $('bar').onclick = e => { const r = $('bar').getBoundingClientRect(); seek((e.clientX - r.left) / r.width * F.duration); };
  $('fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
  $('cc').onclick = () => { ccOn = !ccOn; $('cc').classList.toggle('on', ccOn); };
  $('snd').onclick = () => { sndOn = !sndOn; $('snd').classList.toggle('on', sndOn); AudioFX.setEnabled(sndOn); };
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    else if (e.code === 'ArrowRight') seek(now() + 5);
    else if (e.code === 'ArrowLeft') seek(now() - 5);
    else if (e.key === 'f' || e.key === 'F') $('fs').click();
    else if (e.key === 'c' || e.key === 'C') $('cc').click();
    else if (e.key === 'm' || e.key === 'M') $('snd').click();
  });
  $('go').onclick = () => { $('start').style.display = 'none'; play(); };

  loadMap().then(() => {
    $('go').disabled = false; $('go').textContent = '▶ Play film';
    if (STILL || params.has('t')) $('start').style.display = 'none';
    if (STILL) { ccOn = !params.has('nocc'); }
    render(t, false);
    requestAnimationFrame(loop);
  }).catch(err => { $('go').textContent = 'Map failed to load — check connection'; console.error(err); });
})();
