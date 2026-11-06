/* Procedural soundtrack + SFX (Web Audio, no files).
   Music is generated in sync with film time, so seeking keeps the beat. */
window.AudioFX = (function () {
  let ctx, master, music, sfxBus, delay, noiseBuf, enabled = true, lastStep = -1;
  const lastSfx = {};
  const BPM = 104, STEP = 60 / BPM / 4;            // 16th-note length
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // I – vi – IV – V  (Cmaj7, Am7, Fmaj7, G6)
  const PROG = [[36, [60, 64, 67, 71]], [33, [57, 60, 64, 67]], [29, [57, 60, 65, 69]], [31, [59, 62, 67, 64]]];

  function init() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = enabled ? 0.85 : 0;
    master.connect(comp); comp.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.42; music.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    // simple echo send for space
    delay = ctx.createDelay(); delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f, t, dur, vol, bus, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.detune) osc.detune.value = o.detune;
    let node = osc;
    if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
    node.connect(g); g.connect(bus);
    if (o.send) g.connect(delay);
    env(g, t, o.a || 0.005, vol, dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, type, freq, bus, o = {}) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.q) f.Q.value = o.q;
    src.connect(f); f.connect(g); g.connect(bus);
    env(g, t, o.a || 0.002, vol, dur);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /* ---------- music ---------- */
  function schedule(step, when, ft) {
    const bar = Math.floor(step / 16), s = step % 16;
    const [root, chord] = PROG[bar % 4];
    const drums = ft >= 22 && ft < 345.8;
    const outro = ft >= 345.8;
    const fade = ft > 354 ? Math.max(0, 1 - (ft - 354) / 6) : (ft < 3 ? ft / 3 : 1);
    if (fade <= 0.01) return;
    const v = x => Math.max(0.0001, x * fade);

    if (s === 0 && (drums || bar % 2 === 0)) chord.forEach((n, i) =>
      tone('triangle', mtof(n), when, STEP * 16 * (drums ? 1 : 2), v(0.045), music, { a: 0.35, detune: i * 4, lp: 1800 }));

    // arpeggio
    const arpOn = drums ? (s % 2 === 1) : (s % 4 === 0);
    if (arpOn) {
      const n = chord[(s * 3 + bar) % 4] + 12;
      tone('square', mtof(n), when, 0.16, v(drums ? 0.035 : 0.03), music, { lp: 2600, send: true });
    }
    if (outro && s % 4 === 2) tone('sine', mtof(chord[(s + bar) % 4] + 24), when, 0.5, v(0.04), music, { send: true });

    if (!drums) return;
    if (s === 0 || s === 8 || (s === 10 && bar % 2)) tone('sine', 150, when, 0.32, v(0.9), music, { to: 42, glide: 0.14 });
    if (s === 4 || s === 12) { noise(when, 0.16, v(0.32), 'bandpass', 1800, music, { q: 0.8 }); tone('triangle', 190, when, 0.08, v(0.15), music); }
    if (s % 2 === 0) noise(when, s % 4 === 2 ? 0.07 : 0.035, v(s % 4 === 2 ? 0.14 : 0.07), 'highpass', 7500, music);
    if ([0, 3, 6, 8, 11, 14].includes(s)) tone('sawtooth', mtof(root + (s === 11 ? 12 : 0)), when, STEP * 1.6, v(0.16), music, { lp: 420 });
  }

  function update(ft, playing) {
    if (!ctx || !playing) return;
    const ahead = ft + 0.18;
    let s = lastStep + 1;
    while (s * STEP <= ahead) {
      const st = s * STEP;
      if (st >= ft - 0.03 && st < 360) schedule(s, ctx.currentTime + Math.max(0, st - ft), st);
      s++;
    }
    lastStep = s - 1;
  }
  function reset(ft) { lastStep = Math.ceil(ft / STEP) - 1; }

  /* ---------- sfx ---------- */
  function sfx(name) {
    if (!ctx || !enabled || !name) return;
    const t = ctx.currentTime, p = performance.now();
    if (lastSfx[name] && p - lastSfx[name] < 75) return;
    lastSfx[name] = p;
    if (name === 'pop') { tone('sine', 520 + Math.random() * 260, t, 0.12, 0.3, sfxBus, { to: 1200, glide: 0.06 }); }
    else if (name === 'whoosh') { noise(t, 0.45, 0.22, 'bandpass', 400, sfxBus, { to: 3200, q: 1.4, a: 0.12 }); }
    else if (name === 'ding') { tone('sine', 1318, t, 1.1, 0.22, sfxBus, { send: true }); tone('sine', 1976, t, 0.8, 0.1, sfxBus); }
    else if (name === 'stamp') { tone('sine', 110, t, 0.3, 0.8, sfxBus, { to: 40, glide: 0.2 }); noise(t, 0.18, 0.4, 'lowpass', 1200, sfxBus); }
  }

  function setEnabled(b) {
    enabled = b;
    if (master) master.gain.setTargetAtTime(b ? 0.85 : 0, ctx.currentTime, 0.05);
  }
  return { init, update, reset, sfx, setEnabled };
})();
