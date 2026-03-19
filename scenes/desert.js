/**
 * scenes/desert.js
 * Raindrops Vol 2 — Desert Rainstorm Scene
 *
 * Audio: rain + distant thunder rumble
 * Background: warm orange sand dunes, dramatic stormy sky,
 *             rain shafts in distance, desert flowers, sparse scrub
 * Chime: wind chime / hollow tube (airy tone)
 */

SceneManager.register('desert', {

  tracks: [
    { id: 'rain',    src: 'audio/rain.mp3',    volume: 0.85 },
    { id: 'thunder', src: 'audio/thunder.mp3', volume: 0.55 },
  ],

  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         20,
    GLOW_MIN_GAP:     1000,
    GLOW_MAX_GAP:     2000,
    HIT_R:            45,
    DENSE:            12,
    DROP_SPEED_MIN:   22.0,
    DROP_SPEED_RANGE: 15.0,
    RAIN_COLOR:       [180, 150, 110],
    GLOW_COLOR:       [255, 180, 60],
    RIPPLE_COLOR:     [220, 160, 80],
    FX_COLORS:        ['rgba(255,180,60,', 'rgba(220,130,40,'],
    PROGRESS_COLOR:   [240, 160, 60],
    MENU_COLOR:       [25, 12, 4],
    MENU_TEXT_COLOR:  [240, 190, 100],
    ENDING_BG:        [[25, 12, 4], [20, 10, 3]],
    ENDING_PARTICLES: ['#fb923c','#f97316','#ea580c','#fbbf24','#f59e0b','#a3e635','#84cc16','#fde047'],
    QUOTE_BG:         ['#120800', '#160a00', '#100600'],
    QUOTE_PILL:       'rgba(28,14,4,0.80)',
    QUOTE_BORDER:     'rgba(220,150,50,0.35)',
    QUOTE_TEXT:       'rgba(240,205,150,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'The desert waits. Then blooms.',
      'notice',
      'pause',
      'reflect',
      'Rain in the desert is a miracle every time.',
    ],
  },

  _canvas: null,
  _dunes: null,
  _flora: null,
  _rainShafts: null,
  _lightningTimer: 0,
  _lightningAlpha: 0,

  // ─── Dunes ─────────────────────────────────────────────────────────────────────
  _buildDunes(w, h) {
    const dunes = [];
    // Background dunes
    for (let i = 0; i < 5; i++) {
      dunes.push({
        cx: w * (0.1 + i * 0.22),
        peakY: h * (0.45 + Math.random() * 0.10),
        width: w * (0.35 + Math.random() * 0.25),
        layer: 0,
      });
    }
    // Foreground dunes
    for (let i = 0; i < 4; i++) {
      dunes.push({
        cx: w * (0.0 + i * 0.30),
        peakY: h * (0.58 + Math.random() * 0.08),
        width: w * (0.45 + Math.random() * 0.20),
        layer: 1,
      });
    }
    return dunes;
  },

  _drawDunes(c, w, h) {
    if (!this._dunes) this._dunes = this._buildDunes(w, h);

    this._dunes.forEach(d => {
      const isBack = d.layer === 0;

      // Dune gradient — warm orange/amber
      const dg = c.createLinearGradient(d.cx - d.width / 2, d.peakY, d.cx, h);
      if (isBack) {
        dg.addColorStop(0,   '#c87840');
        dg.addColorStop(0.4, '#d48848');
        dg.addColorStop(1,   '#b86830');
      } else {
        dg.addColorStop(0,   '#d4884a');
        dg.addColorStop(0.3, '#e09858');
        dg.addColorStop(0.7, '#c87838');
        dg.addColorStop(1,   '#a05820');
      }
      c.fillStyle = dg;

      // Dune shape — smooth hill
      c.beginPath();
      c.moveTo(d.cx - d.width / 2, h);
      c.quadraticCurveTo(d.cx - d.width * 0.1, d.peakY, d.cx, d.peakY);
      c.quadraticCurveTo(d.cx + d.width * 0.1, d.peakY, d.cx + d.width / 2, h);
      c.closePath();
      c.fill();

      // Slip face shadow (darker right side)
      const shadow = c.createLinearGradient(d.cx, d.peakY, d.cx + d.width * 0.4, h);
      shadow.addColorStop(0, 'rgba(80,35,10,0.0)');
      shadow.addColorStop(0.3, 'rgba(80,35,10,0.25)');
      shadow.addColorStop(1, 'rgba(80,35,10,0.4)');
      c.fillStyle = shadow;
      c.beginPath();
      c.moveTo(d.cx, d.peakY);
      c.quadraticCurveTo(d.cx + d.width * 0.1, d.peakY, d.cx + d.width / 2, h);
      c.lineTo(d.cx, h);
      c.closePath();
      c.fill();

      // Wind ripple lines on dune face
      if (!isBack) {
        c.strokeStyle = 'rgba(160,80,30,0.12)';
        c.lineWidth = 1;
        for (let r = 0; r < 5; r++) {
          const ry = d.peakY + r * (h - d.peakY) / 6;
          const rw = (d.width * 0.4) * (r / 5);
          c.beginPath();
          c.moveTo(d.cx - rw, ry);
          c.quadraticCurveTo(d.cx, ry - 4, d.cx + rw, ry);
          c.stroke();
        }
      }
    });
  },

  // ─── Desert flora ──────────────────────────────────────────────────────────────
  _buildFlora(w, h) {
    const plants = [];
    const types = ['scrub', 'flower', 'scrub', 'flower', 'scrub', 'scrub'];
    const flowerColors = ['#c8a020', '#d4b030', '#8a6010'];

    for (let i = 0; i < 14; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      plants.push({
        x: w * (0.05 + Math.random() * 0.88),
        y: h * (0.60 + Math.random() * 0.30),
        type,
        size: 0.5 + Math.random() * 0.8,
        color: type === 'flower'
          ? flowerColors[Math.floor(Math.random() * flowerColors.length)]
          : `rgba(${40 + Math.random() * 20},${60 + Math.random() * 25},${15 + Math.random() * 10},0.9)`,
      });
    }
    plants.sort((a, b) => a.y - b.y);
    return plants;
  },

  _drawFlora(c, w, h, t) {
    if (!this._flora) this._flora = this._buildFlora(w, h);

    this._flora.forEach(p => {
      const sway = Math.sin(t * 0.0007 + p.x * 0.01) * 2 * p.size;
      c.save();
      c.translate(p.x + sway, p.y);

      if (p.type === 'scrub') {
        // Desert scrub bush
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(0, 0, 8 * p.size, 0, Math.PI * 2); c.fill();
        c.beginPath();
        c.arc(-6 * p.size, 3 * p.size, 5 * p.size, 0, Math.PI * 2); c.fill();
        c.beginPath();
        c.arc(6 * p.size, 2 * p.size, 5 * p.size, 0, Math.PI * 2); c.fill();
        // Thin stems
        c.strokeStyle = 'rgba(50,30,10,0.6)';
        c.lineWidth = 1;
        for (let s = 0; s < 3; s++) {
          c.beginPath();
          c.moveTo((s - 1) * 5 * p.size, 2 * p.size);
          c.lineTo((s - 1) * 5 * p.size, 10 * p.size);
          c.stroke();
        }
      } else {
        // Desert flower — from ref image (yellow/purple)
        // Stem
        c.strokeStyle = 'rgba(60,50,20,0.8)';
        c.lineWidth = 1.5 * p.size;
        c.beginPath();
        c.moveTo(0, 5 * p.size);
        c.lineTo(0, 16 * p.size);
        c.stroke();

        // Leaves
        c.fillStyle = `rgba(50,70,20,0.8)`;
        c.beginPath();
        c.ellipse(-4 * p.size, 10 * p.size, 5 * p.size, 2 * p.size, -0.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(4 * p.size, 12 * p.size, 5 * p.size, 2 * p.size, 0.5, 0, Math.PI * 2);
        c.fill();

        // Flower head
        const petals = 6;
        for (let pet = 0; pet < petals; pet++) {
          const angle = (pet / petals) * Math.PI * 2;
          c.fillStyle = p.color;
          c.beginPath();
          c.ellipse(
            Math.cos(angle) * 5 * p.size,
            Math.sin(angle) * 5 * p.size - 2 * p.size,
            3.5 * p.size, 2 * p.size, angle, 0, Math.PI * 2
          );
          c.fill();
        }
        // Center
        c.fillStyle = 'rgba(80,40,10,0.9)';
        c.beginPath();
        c.arc(0, -2 * p.size, 3 * p.size, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    });
  },

  // ─── Distant rain shafts ───────────────────────────────────────────────────────
  _buildShafts(w, h) {
    return [
      { x: w * 0.15, width: w * 0.10, alpha: 0.18 },
      { x: w * 0.50, width: w * 0.14, alpha: 0.22 },
      { x: w * 0.78, width: w * 0.09, alpha: 0.16 },
    ];
  },

  _drawRainShafts(c, w, h) {
    if (!this._rainShafts) this._rainShafts = this._buildShafts(w, h);

    this._rainShafts.forEach(shaft => {
      const shaftGrad = c.createLinearGradient(shaft.x, h * 0.30, shaft.x, h * 0.65);
      shaftGrad.addColorStop(0, `rgba(160,140,120,0)`);
      shaftGrad.addColorStop(0.3, `rgba(160,140,120,${shaft.alpha})`);
      shaftGrad.addColorStop(0.8, `rgba(160,140,120,${shaft.alpha * 0.6})`);
      shaftGrad.addColorStop(1, `rgba(160,140,120,0)`);
      c.fillStyle = shaftGrad;
      // Slight angle
      c.save();
      c.translate(shaft.x, h * 0.30);
      c.rotate(0.05);
      c.fillRect(-shaft.width / 2, 0, shaft.width, h * 0.35);
      c.restore();
    });
  },

  // ─── Storm sky ─────────────────────────────────────────────────────────────────
  _drawClouds(c, w, h, t) {
    const clouds = [
      { x: 0.10, y: 0.08, rx: 0.28, ry: 0.10 },
      { x: 0.50, y: 0.05, rx: 0.32, ry: 0.12 },
      { x: 0.80, y: 0.10, rx: 0.24, ry: 0.09 },
      { x: 0.30, y: 0.16, rx: 0.20, ry: 0.08 },
      { x: 0.70, y: 0.18, rx: 0.22, ry: 0.07 },
    ];

    clouds.forEach((cl, i) => {
      const drift = Math.sin(t * 0.00005 + i) * w * 0.01;
      const cx = cl.x * w + drift;
      const cy = cl.y * h;

      // Storm cloud — dark purplish grey
      const cg = c.createRadialGradient(cx, cy, 0, cx, cy, cl.rx * w);
      cg.addColorStop(0,   'rgba(55,45,75,0.92)');
      cg.addColorStop(0.5, 'rgba(45,38,65,0.80)');
      cg.addColorStop(1,   'rgba(35,28,52,0)');
      c.fillStyle = cg;
      c.beginPath();
      c.ellipse(cx, cy, cl.rx * w, cl.ry * h, 0, 0, Math.PI * 2);
      c.fill();

      // Lighter edge highlight (ref shows light breaking through)
      const edge = c.createRadialGradient(cx - cl.rx * w * 0.2, cy - cl.ry * h * 0.3, 0,
                                           cx, cy, cl.rx * w * 0.7);
      edge.addColorStop(0, 'rgba(180,160,200,0.12)');
      edge.addColorStop(1, 'rgba(180,160,200,0)');
      c.fillStyle = edge;
      c.beginPath();
      c.ellipse(cx, cy, cl.rx * w * 0.7, cl.ry * h * 0.7, 0, 0, Math.PI * 2);
      c.fill();
    });
  },

  // ─── Lightning ─────────────────────────────────────────────────────────────────
  _drawLightning(c, w, h, now) {
    if (now > this._lightningTimer) {
      this._lightningAlpha = 0.6;
      this._lightningTimer = now + 5000 + Math.random() * 8000;
    }
    if (this._lightningAlpha > 0) {
      c.fillStyle = `rgba(200,180,255,${this._lightningAlpha * 0.15})`;
      c.fillRect(0, 0, w, h * 0.4);
      this._lightningAlpha *= 0.85;
    }
  },

  // ─── Chime: hollow wind tube ──────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const cv = AudioEngine.getChimeVolume ? AudioEngine.getChimeVolume() : 1.0;

    // Airy hollow tube — sine with noise-like character
    const notes = [220, 246.9, 293.7, 329.6, 370, 440, 493.9];
    const f = notes[Math.floor(Math.random() * notes.length)];

    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, actx.currentTime);
    g.gain.linearRampToValueAtTime(0.07 * cv, actx.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 2.5);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + 2.5);

    // Airy upper harmonic — slightly detuned for wind character
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2.01;
    g2.gain.setValueAtTime(0, actx.currentTime);
    g2.gain.linearRampToValueAtTime(0.02 * cv, actx.currentTime + 0.06);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.5);
    o2.connect(g2); g2.connect(actx.destination);
    o2.start(); o2.stop(actx.currentTime + 1.5);
  },

  init(canvas) {
    this._canvas = canvas;
    this._dunes = null;
    this._flora = null;
    this._rainShafts = null;
    this._lightningTimer = 3000;
    this._lightningAlpha = 0;
    const self = this;

    RainEngine.init(canvas, this.config, {
      drawBackground: (c, cw, ch) => {
        // Storm sky — dark purple/mauve from ref images
        const sky = c.createLinearGradient(0, 0, 0, ch * 0.50);
        sky.addColorStop(0,   '#1a1228');
        sky.addColorStop(0.3, '#221830');
        sky.addColorStop(0.6, '#2c1e38');
        sky.addColorStop(1,   '#382438');
        c.fillStyle = sky; c.fillRect(0, 0, cw, ch * 0.50);

        // Warm light break on horizon — key from ref
        const hLight = c.createLinearGradient(0, ch * 0.38, 0, ch * 0.52);
        hLight.addColorStop(0, 'rgba(200,140,60,0)');
        hLight.addColorStop(0.4, 'rgba(220,160,60,0.30)');
        hLight.addColorStop(0.7, 'rgba(240,180,80,0.45)');
        hLight.addColorStop(1, 'rgba(200,130,40,0.20)');
        c.fillStyle = hLight; c.fillRect(0, ch * 0.38, cw, ch * 0.14);

        // Sand base fill
        c.fillStyle = '#c87838';
        c.fillRect(0, ch * 0.50, cw, ch * 0.50);
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawClouds(c, cw, ch, now);
        self._drawLightning(c, cw, ch, now);
        self._drawRainShafts(c, cw, ch);
        self._drawDunes(c, cw, ch);
        self._drawFlora(c, cw, ch, now);

        // Ground darkening at very bottom
        const groundDark = c.createLinearGradient(0, ch * 0.88, 0, ch);
        groundDark.addColorStop(0, 'rgba(80,35,10,0)');
        groundDark.addColorStop(1, 'rgba(60,25,5,0.7)');
        c.fillStyle = groundDark;
        c.fillRect(0, ch * 0.88, cw, ch * 0.12);
      },

      onResize:     () => { self._dunes = null; self._flora = null; self._rainShafts = null; },
      onSceneReset: () => { self._dunes = null; self._flora = null; self._rainShafts = null; },
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
