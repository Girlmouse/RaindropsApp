/**
 * scenes/waterfall.js
 * Raindrops Vol 2 — Autumn Waterfall Scene
 *
 * Audio: rain + waterfall roar
 * Background: dramatic waterfall, layered cliff rock face,
 *             autumn foliage (orange/red/gold), mist at base,
 *             rain adding to the cascade
 * Chime: resonant stone/marimba tone (triangle + body resonance)
 */

SceneManager.register('waterfall', {

  tracks: [
    { id: 'rain',      src: 'audio/rain.mp3',      volume: 0.8 },
    { id: 'waterfall', src: 'audio/waterfall.mp3', volume: 0.9 },
  ],

  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         24,
    GLOW_MIN_GAP:     950,
    GLOW_MAX_GAP:     1900,
    HIT_R:            45,
    DENSE:            13,
    DROP_SPEED_MIN:   19.0,
    DROP_SPEED_RANGE: 13.0,
    RAIN_COLOR:       [180, 160, 140],
    GLOW_COLOR:       [255, 140, 40],
    RIPPLE_COLOR:     [200, 120, 60],
    FX_COLORS:        ['rgba(255,140,40,', 'rgba(220,100,30,'],
    PROGRESS_COLOR:   [230, 130, 50],
    MENU_COLOR:       [20, 10, 5],
    MENU_TEXT_COLOR:  [240, 180, 100],
    ENDING_BG:        [[20, 10, 5], [16, 8, 4]],
    ENDING_PARTICLES: ['#f97316','#fb923c','#fbbf24','#ef4444','#dc2626','#a3e635','#84cc16','#fde047'],
    QUOTE_BG:         ['#100800', '#140a00', '#0c0600'],
    QUOTE_PILL:       'rgba(22,12,4,0.80)',
    QUOTE_BORDER:     'rgba(220,130,50,0.35)',
    QUOTE_TEXT:       'rgba(240,200,140,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'Water always finds its way.',
      'notice',
      'pause',
      'reflect',
      'Even the hardest rock yields to patient water.',
    ],
  },

  _canvas: null,
  _foliage: null,
  _mistParticles: [],
  _lastMist: 0,
  _fallOffset: 0,

  // ─── Cliff face ────────────────────────────────────────────────────────────────
  _drawCliff(c, w, h) {
    // Main cliff body — layered rock strata
    const cliffTop = h * 0.05;
    const cliffBase = h * 0.78;
    const cliffL = w * 0.12;
    const cliffR = w * 0.88;
    const fallL  = w * 0.38;
    const fallR  = w * 0.62;

    // Rock base color
    const rockGrad = c.createLinearGradient(0, cliffTop, 0, cliffBase);
    rockGrad.addColorStop(0,   '#2a2218');
    rockGrad.addColorStop(0.3, '#352a1c');
    rockGrad.addColorStop(0.6, '#3a2e20');
    rockGrad.addColorStop(1,   '#2e2418');
    c.fillStyle = rockGrad;

    // Left cliff face
    c.beginPath();
    c.moveTo(cliffL, cliffTop);
    c.lineTo(fallL, cliffTop);
    c.lineTo(fallL, cliffBase);
    c.lineTo(cliffL, cliffBase);
    c.closePath();
    c.fill();

    // Right cliff face
    c.beginPath();
    c.moveTo(fallR, cliffTop);
    c.lineTo(cliffR, cliffTop);
    c.lineTo(cliffR, cliffBase);
    c.lineTo(fallR, cliffBase);
    c.closePath();
    c.fill();

    // Rock strata lines
    const strataColors = ['rgba(20,16,10,0.5)', 'rgba(50,38,24,0.4)', 'rgba(35,27,17,0.45)'];
    for (let s = 0; s < 8; s++) {
      const sy = cliffTop + s * (cliffBase - cliffTop) / 8;
      const jitter = (Math.random() - 0.5) * h * 0.01;
      c.strokeStyle = strataColors[s % strataColors.length];
      c.lineWidth = 1 + Math.random();
      c.beginPath();
      c.moveTo(cliffL, sy + jitter);
      c.bezierCurveTo(
        fallL * 0.5, sy + jitter + h * 0.005,
        fallL * 0.8, sy + jitter - h * 0.003,
        fallL, sy + jitter
      );
      c.stroke();
      c.beginPath();
      c.moveTo(fallR, sy + jitter);
      c.bezierCurveTo(
        fallR + (cliffR - fallR) * 0.3, sy + jitter - h * 0.004,
        fallR + (cliffR - fallR) * 0.7, sy + jitter + h * 0.006,
        cliffR, sy + jitter
      );
      c.stroke();
    }

    // Wet rock sheen
    const wetL = c.createLinearGradient(cliffL, 0, fallL, 0);
    wetL.addColorStop(0, 'rgba(100,140,160,0)');
    wetL.addColorStop(0.7, 'rgba(100,140,160,0.08)');
    wetL.addColorStop(1, 'rgba(100,140,160,0.18)');
    c.fillStyle = wetL;
    c.fillRect(cliffL, cliffTop, fallL - cliffL, cliffBase - cliffTop);

    // Rock outcrop shadows
    c.fillStyle = 'rgba(10,8,4,0.4)';
    c.beginPath(); c.ellipse(w * 0.22, h * 0.35, w * 0.06, h * 0.04, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(w * 0.75, h * 0.45, w * 0.05, h * 0.03, 0.2, 0, Math.PI * 2); c.fill();
  },

  // ─── Waterfall ─────────────────────────────────────────────────────────────────
  _drawWaterfall(c, w, h, t) {
    const fallL = w * 0.38;
    const fallR = w * 0.62;
    const fallW = fallR - fallL;
    const fallTop = h * 0.05;
    const fallBase = h * 0.72;
    const fallH = fallBase - fallTop;

    // Main fall body
    const fallGrad = c.createLinearGradient(fallL, 0, fallR, 0);
    fallGrad.addColorStop(0,    'rgba(180,210,230,0.5)');
    fallGrad.addColorStop(0.15, 'rgba(220,235,245,0.85)');
    fallGrad.addColorStop(0.5,  'rgba(245,250,255,0.95)');
    fallGrad.addColorStop(0.85, 'rgba(220,235,245,0.85)');
    fallGrad.addColorStop(1,    'rgba(180,210,230,0.5)');
    c.fillStyle = fallGrad;
    c.fillRect(fallL, fallTop, fallW, fallH);

    // Animated flow streaks
    const streakCount = 12;
    for (let i = 0; i < streakCount; i++) {
      const sx = fallL + (i / streakCount) * fallW + (Math.sin(t * 0.001 + i) * 4);
      const phase = (t * 0.0008 + i * 0.15) % 1;
      const sy = fallTop + phase * fallH;
      const streakH = fallH * 0.15;
      const streak = c.createLinearGradient(sx, sy, sx, sy + streakH);
      streak.addColorStop(0, 'rgba(255,255,255,0)');
      streak.addColorStop(0.3, 'rgba(255,255,255,0.35)');
      streak.addColorStop(0.7, 'rgba(255,255,255,0.25)');
      streak.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = streak;
      c.fillRect(sx, sy, fallW / streakCount * 0.6, streakH);
    }

    // Edge foam
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(fallL, fallTop, 4, fallH);
    c.fillRect(fallR - 4, fallTop, 4, fallH);

    // Overhang shadow at top
    c.fillStyle = 'rgba(20,16,10,0.6)';
    c.fillRect(fallL - 4, fallTop, fallW + 8, h * 0.03);
  },

  // ─── Mist at base ──────────────────────────────────────────────────────────────
  _updateMist(now, w, h) {
    if (now - this._lastMist > 60) {
      const fallL = w * 0.38, fallR = w * 0.62;
      this._mistParticles.push({
        x: fallL + Math.random() * (fallR - fallL),
        y: h * 0.72,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.15 + 0.05),
        r: 4 + Math.random() * 8,
        born: now,
        life: 1200 + Math.random() * 800,
      });
      this._lastMist = now;
    }
    this._mistParticles = this._mistParticles.filter(p => now - p.born < p.life);
  },

  _drawMist(c, w, h, now) {
    this._mistParticles.forEach(p => {
      const age = (now - p.born) / p.life;
      p.x += p.vx;
      p.y += p.vy;
      c.save();
      c.globalAlpha = (1 - age) * 0.18;
      c.fillStyle = 'rgba(220,235,245,1)';
      c.beginPath();
      c.arc(p.x, p.y, p.r * (1 + age * 2), 0, Math.PI * 2);
      c.fill();
      c.restore();
    });

    // Static mist band at base
    const mistGrad = c.createRadialGradient(w / 2, h * 0.74, 0, w / 2, h * 0.74, w * 0.35);
    mistGrad.addColorStop(0,   'rgba(210,230,240,0.45)');
    mistGrad.addColorStop(0.5, 'rgba(210,230,240,0.20)');
    mistGrad.addColorStop(1,   'rgba(210,230,240,0)');
    c.fillStyle = mistGrad;
    c.fillRect(0, h * 0.68, w, h * 0.12);
  },

  // ─── Pool at base ──────────────────────────────────────────────────────────────
  _drawPool(c, w, h, t) {
    const poolY = h * 0.75;
    const pool = c.createLinearGradient(0, poolY, 0, h * 0.85);
    pool.addColorStop(0, 'rgba(140,180,200,0.8)');
    pool.addColorStop(0.5, 'rgba(100,145,170,0.9)');
    pool.addColorStop(1, 'rgba(60,100,130,0.95)');
    c.fillStyle = pool;
    c.beginPath();
    c.ellipse(w / 2, poolY + h * 0.04, w * 0.35, h * 0.06, 0, 0, Math.PI * 2);
    c.fill();

    // Pool ripples from falling water
    for (let r = 0; r < 4; r++) {
      const rAge = ((t * 0.0008 + r * 0.25) % 1);
      c.strokeStyle = `rgba(255,255,255,${(1 - rAge) * 0.3})`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(w / 2, poolY + h * 0.04, w * 0.08 * rAge, h * 0.02 * rAge, 0, 0, Math.PI * 2);
      c.stroke();
    }
  },

  // ─── Autumn foliage ────────────────────────────────────────────────────────────
  _buildFoliage(w, h) {
    const clusters = [];
    const colors = [
      [200, 80, 30], [220, 120, 20], [180, 60, 20],
      [240, 160, 20], [160, 50, 10], [200, 100, 10],
      [100, 140, 50], [120, 160, 40],  // some green mixed in
    ];
    // Left side
    for (let i = 0; i < 15; i++) {
      clusters.push({
        x: w * (Math.random() * 0.35),
        y: h * (0.02 + Math.random() * 0.40),
        r: w * (0.04 + Math.random() * 0.06),
        color: colors[Math.floor(Math.random() * colors.length)],
        layer: Math.random() > 0.5 ? 0 : 1,
      });
    }
    // Right side
    for (let i = 0; i < 15; i++) {
      clusters.push({
        x: w * (0.65 + Math.random() * 0.35),
        y: h * (0.02 + Math.random() * 0.40),
        r: w * (0.04 + Math.random() * 0.06),
        color: colors[Math.floor(Math.random() * colors.length)],
        layer: Math.random() > 0.5 ? 0 : 1,
      });
    }
    clusters.sort((a, b) => a.layer - b.layer);
    return clusters;
  },

  _drawFoliage(c, w, h, t) {
    if (!this._foliage) this._foliage = this._buildFoliage(w, h);
    this._foliage.forEach(cl => {
      const sway = Math.sin(t * 0.0006 + cl.x * 0.01) * 3;
      const [r, g, b] = cl.color;
      const alpha = cl.layer === 0 ? 0.75 : 0.90;
      c.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      c.beginPath();
      c.arc(cl.x + sway, cl.y, cl.r, 0, Math.PI * 2);
      c.fill();
      // Darker cluster center
      c.fillStyle = `rgba(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.7)},${alpha * 0.5})`;
      c.beginPath();
      c.arc(cl.x + sway * 0.5, cl.y + cl.r * 0.2, cl.r * 0.6, 0, Math.PI * 2);
      c.fill();
    });
  },

  // ─── Chime: marimba/stone resonance ──────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const cv = AudioEngine.getChimeVolume ? AudioEngine.getChimeVolume() : 1.0;

    const notes = [261.6, 311.1, 369.9, 415.3, 523.2, 622.2, 739.9];
    const f = notes[Math.floor(Math.random() * notes.length)];

    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.10 * cv, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01 * cv, actx.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.4);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + 1.4);

    // Body resonance — lower octave
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 0.5;
    g2.gain.setValueAtTime(0.04 * cv, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.8);
    o2.connect(g2); g2.connect(actx.destination);
    o2.start(); o2.stop(actx.currentTime + 0.8);

    // High harmonic shimmer
    const o3 = actx.createOscillator(), g3 = actx.createGain();
    o3.type = 'sine'; o3.frequency.value = f * 3.0;
    g3.gain.setValueAtTime(0.015 * cv, actx.currentTime);
    g3.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);
    o3.connect(g3); g3.connect(actx.destination);
    o3.start(); o3.stop(actx.currentTime + 0.5);
  },

  init(canvas) {
    this._canvas = canvas;
    this._foliage = null;
    this._mistParticles = [];
    this._lastMist = 0;
    const self = this;

    RainEngine.init(canvas, this.config, {
      drawBackground: (c, cw, ch) => {
        // Dramatic sky — sunset pinks and purples from ref
        const sky = c.createLinearGradient(0, 0, 0, ch * 0.12);
        sky.addColorStop(0,   '#1a0c08');
        sky.addColorStop(0.5, '#2a1410');
        sky.addColorStop(1,   '#200e0a');
        c.fillStyle = sky; c.fillRect(0, 0, cw, ch * 0.12);

        // Rock/cliff fills rest
        c.fillStyle = '#2a2018';
        c.fillRect(0, ch * 0.05, cw, ch * 0.95);
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawCliff(c, cw, ch);
        self._drawFoliage(c, cw, ch, now);
        self._drawWaterfall(c, cw, ch, now);
        self._updateMist(now, cw, ch);
        self._drawMist(c, cw, ch, now);
        self._drawPool(c, cw, ch, now);

        // Ground at bottom
        c.fillStyle = '#1a1208';
        c.fillRect(0, ch * 0.85, cw, ch * 0.15);
      },

      onResize:     () => { self._foliage = null; self._mistParticles = []; },
      onSceneReset: () => { self._foliage = null; self._mistParticles = []; },
      onFirstTap:   () => { AudioEngine.unlock(); AudioEngine.resetLevels(); },
      resetRain:    () => { AudioEngine.resetLevels(); },
      fadeRain:     () => { AudioEngine.fadeOut(4.0); },
      chime:        () => self._chime(),
      playEnd:      () => { AudioEngine.playEnd(); },
      onExit:       () => { AudioEngine.setMenuLevel(); },
    });
  },

  stop() { RainEngine.stop(); },
});
