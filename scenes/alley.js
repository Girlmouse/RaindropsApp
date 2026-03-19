/**
 * scenes/alley.js
 * Raindrops Vol 2 — European Back Street Scene
 *
 * Audio: rain + distant city ambience
 * Background: wet cobblestone alley, amber street lights,
 *             brick walls, reflections, foggy depth
 * Chime: muted piano note (sine cluster, warm)
 */

SceneManager.register('alley', {

  tracks: [
    { id: 'rain',  src: 'audio/rain.mp3',  volume: 1.0 },
    { id: 'city',  src: 'audio/city.mp3',  volume: 0.4 },
  ],

  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         22,
    GLOW_MIN_GAP:     900,
    GLOW_MAX_GAP:     1800,
    HIT_R:            45,
    DENSE:            14,
    DROP_SPEED_MIN:   20.0,
    DROP_SPEED_RANGE: 14.0,
    RAIN_COLOR:       [160, 140, 110],
    GLOW_COLOR:       [255, 160, 60],
    RIPPLE_COLOR:     [220, 150, 80],
    FX_COLORS:        ['rgba(255,160,60,', 'rgba(200,120,40,'],
    PROGRESS_COLOR:   [220, 150, 60],
    MENU_COLOR:       [20, 12, 5],
    MENU_TEXT_COLOR:  [220, 170, 100],
    ENDING_BG:        [[20, 12, 5], [16, 10, 4]],
    ENDING_PARTICLES: ['#f59e0b','#fbbf24','#d97706','#b45309','#fde68a','#fcd34d','#fb923c','#f97316'],
    QUOTE_BG:         ['#100800', '#140a00', '#0e0700'],
    QUOTE_PILL:       'rgba(25,15,5,0.80)',
    QUOTE_BORDER:     'rgba(200,140,50,0.35)',
    QUOTE_TEXT:       'rgba(235,200,140,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'Old streets have held a thousand storms before yours.',
      'notice',
      'pause',
      'reflect',
      'Even cobblestones reflect the sky.',
    ],
  },

  _canvas: null,
  _bricks: null,

  // ─── Bricks ────────────────────────────────────────────────────────────────────
  _buildBricks(w, h) {
    const bricks = { left: [], right: [] };
    const bh = 12, bw = 38, mortar = 3;
    const rows = Math.ceil(h / (bh + mortar));

    ['left', 'right'].forEach(side => {
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (bw / 2 + mortar / 2);
        const wallW  = w * 0.28;
        const cols   = Math.ceil(wallW / (bw + mortar)) + 1;
        for (let col = 0; col < cols; col++) {
          const shade = 0.85 + Math.random() * 0.15;
          bricks[side].push({
            x: col * (bw + mortar) - offset,
            y: r * (bh + mortar),
            shade,
          });
        }
      }
    });
    return bricks;
  },

  _drawWalls(c, w, h) {
    if (!this._bricks) this._bricks = this._buildBricks(w, h);
    const wallW = w * 0.28;

    // Left wall
    c.save();
    c.beginPath();
    c.rect(0, 0, wallW, h);
    c.clip();
    // Wall base color gradient (darker top, amber-lit bottom)
    const lg = c.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0,   '#1a0e06');
    lg.addColorStop(0.5, '#2a1808');
    lg.addColorStop(1,   '#3a2010');
    c.fillStyle = lg; c.fillRect(0, 0, wallW, h);

    this._bricks.left.forEach(b => {
      c.fillStyle = `rgba(${Math.round(90 * b.shade)},${Math.round(48 * b.shade)},${Math.round(22 * b.shade)},0.9)`;
      c.fillRect(b.x, b.y, 38, 12);
    });
    // Street lamp glow on wall
    const lampGlow = c.createRadialGradient(wallW, h * 0.38, 0, wallW, h * 0.38, wallW * 1.2);
    lampGlow.addColorStop(0, 'rgba(255,180,60,0.22)');
    lampGlow.addColorStop(1, 'rgba(255,180,60,0)');
    c.fillStyle = lampGlow; c.fillRect(0, 0, wallW, h);
    c.restore();

    // Right wall
    c.save();
    c.beginPath();
    c.rect(w - wallW, 0, wallW, h);
    c.clip();
    const rg = c.createLinearGradient(w - wallW, 0, w, 0);
    rg.addColorStop(0, '#2a1808');
    rg.addColorStop(1, '#1a0e06');
    c.fillStyle = rg; c.fillRect(w - wallW, 0, wallW, h);

    this._bricks.right.forEach(b => {
      c.fillStyle = `rgba(${Math.round(85 * b.shade)},${Math.round(44 * b.shade)},${Math.round(20 * b.shade)},0.9)`;
      c.fillRect(w - wallW + b.x, b.y, 38, 12);
    });
    c.restore();
  },

  // ─── Street ────────────────────────────────────────────────────────────────────
  _drawStreet(c, w, h) {
    const wallW = w * 0.28;
    const streetLeft  = wallW;
    const streetRight = w - wallW;
    const streetW = streetRight - streetLeft;

    // Cobblestone base
    const sg = c.createLinearGradient(0, h * 0.55, 0, h);
    sg.addColorStop(0, '#1a1208');
    sg.addColorStop(0.4, '#120e06');
    sg.addColorStop(1, '#0a0804');
    c.fillStyle = sg;
    c.fillRect(streetLeft, h * 0.55, streetW, h * 0.45);

    // Cobblestone pattern
    const stoneRows = 12, stoneCols = 6;
    for (let r = 0; r < stoneRows; r++) {
      for (let col = 0; col < stoneCols; col++) {
        const perspective = r / stoneRows;
        const sx = streetLeft + col * (streetW / stoneCols) + (r % 2) * streetW / stoneCols / 2;
        const sy = h * 0.56 + r * (h * 0.04);
        const sw = (streetW / stoneCols) * 0.85;
        const sh = h * 0.032 * (0.4 + perspective * 0.6);
        const bright = 0.3 + perspective * 0.3;
        c.fillStyle = `rgba(${Math.round(40 + perspective * 20)},${Math.round(28 + perspective * 15)},${Math.round(14 + perspective * 8)},0.8)`;
        c.fillRect(sx, sy, sw, sh);
        c.strokeStyle = `rgba(10,8,4,0.6)`;
        c.lineWidth = 0.5;
        c.strokeRect(sx, sy, sw, sh);
      }
    }

    // Wet street reflections
    const ref = c.createLinearGradient(0, h * 0.55, 0, h * 0.8);
    ref.addColorStop(0, 'rgba(255,140,40,0.18)');
    ref.addColorStop(0.4, 'rgba(60,80,120,0.12)');
    ref.addColorStop(1, 'rgba(30,40,80,0.06)');
    c.fillStyle = ref;
    c.fillRect(streetLeft, h * 0.55, streetW, h * 0.25);

    // Depth fog down the alley
    const fog = c.createLinearGradient(0, 0, 0, h * 0.6);
    fog.addColorStop(0, 'rgba(8,5,2,0.92)');
    fog.addColorStop(0.5, 'rgba(15,10,4,0.6)');
    fog.addColorStop(1, 'rgba(20,14,6,0)');
    c.fillStyle = fog;
    c.fillRect(streetLeft, 0, streetW, h * 0.6);
  },

  // ─── Street lamp ───────────────────────────────────────────────────────────────
  _drawLamps(c, w, h, t) {
    const lamps = [
      { x: w * 0.28, y: h * 0.32 },
      { x: w * 0.72, y: h * 0.36 },
    ];

    lamps.forEach(lp => {
      // Pole
      c.strokeStyle = '#2a2010';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(lp.x, lp.y + h * 0.05);
      c.lineTo(lp.x, h * 0.75);
      c.stroke();

      // Arm
      c.beginPath();
      c.moveTo(lp.x, lp.y + h * 0.05);
      c.quadraticCurveTo(lp.x + (lp.x < w / 2 ? 1 : -1) * 12, lp.y, lp.x + (lp.x < w / 2 ? 1 : -1) * 18, lp.y);
      c.stroke();

      // Lamp head
      c.fillStyle = '#1a1408';
      c.fillRect(lp.x + (lp.x < w / 2 ? 1 : -1) * 10, lp.y, 16, 8);

      // Light cone
      const flicker = 0.95 + Math.sin(t * 0.007 + lp.x) * 0.05;
      const cone = c.createRadialGradient(lp.x + (lp.x < w / 2 ? 1 : -1) * 18, lp.y + 6, 0,
                                           lp.x + (lp.x < w / 2 ? 1 : -1) * 18, lp.y + 6, h * 0.28);
      cone.addColorStop(0,   `rgba(255,200,80,${0.55 * flicker})`);
      cone.addColorStop(0.3, `rgba(255,160,40,${0.18 * flicker})`);
      cone.addColorStop(1,   `rgba(255,140,20,0)`);
      c.fillStyle = cone;
      c.beginPath();
      c.arc(lp.x + (lp.x < w / 2 ? 1 : -1) * 18, lp.y + 6, h * 0.28, 0, Math.PI * 2);
      c.fill();

      // Bulb
      c.fillStyle = `rgba(255,230,150,${flicker})`;
      c.beginPath();
      c.arc(lp.x + (lp.x < w / 2 ? 1 : -1) * 18, lp.y + 6, 4, 0, Math.PI * 2);
      c.fill();
    });
  },

  // ─── Distant alley end ─────────────────────────────────────────────────────────
  _drawAlleyEnd(c, w, h) {
    // Blue foggy light at end of alley
    const endGlow = c.createRadialGradient(w / 2, h * 0.25, 0, w / 2, h * 0.25, w * 0.18);
    endGlow.addColorStop(0, 'rgba(60,100,180,0.35)');
    endGlow.addColorStop(0.5, 'rgba(40,70,140,0.15)');
    endGlow.addColorStop(1, 'rgba(20,40,100,0)');
    c.fillStyle = endGlow;
    c.beginPath();
    c.arc(w / 2, h * 0.25, w * 0.18, 0, Math.PI * 2);
    c.fill();

    // Silhouette of far buildings
    c.fillStyle = 'rgba(5,4,2,0.8)';
    c.fillRect(w * 0.3, h * 0.05, w * 0.12, h * 0.22);
    c.fillRect(w * 0.44, h * 0.10, w * 0.08, h * 0.18);
    c.fillRect(w * 0.55, h * 0.07, w * 0.14, h * 0.20);

    // A window lit up in distance
    c.fillStyle = 'rgba(255,180,60,0.5)';
    c.fillRect(w * 0.34, h * 0.12, 5, 4);
    c.fillRect(w * 0.58, h * 0.10, 4, 4);
  },

  // ─── Chime: muted warm piano ──────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const cv = AudioEngine.getChimeVolume ? AudioEngine.getChimeVolume() : 1.0;

    const notes = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9];
    const f = notes[Math.floor(Math.random() * notes.length)];

    // Warm sine cluster — piano-like
    [f, f * 2, f * 3].forEach((freq, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const vol = [0.08, 0.03, 0.01][i] * cv;
      g.gain.setValueAtTime(vol, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.8);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 1.8);
    });
  },

  init(canvas) {
    this._canvas = canvas;
    this._bricks = null;
    const self = this;

    RainEngine.init(canvas, this.config, {
      drawBackground: (c, cw, ch) => {
        c.fillStyle = '#0a0600';
        c.fillRect(0, 0, cw, ch);
      },
      drawForeground: (c, cw, ch, now) => {
        self._drawAlleyEnd(c, cw, ch);
        self._drawWalls(c, cw, ch);
        self._drawStreet(c, cw, ch);
        self._drawLamps(c, cw, ch, now);
      },
      onResize:      () => { self._bricks = null; },
      onSceneReset:  () => { self._bricks = null; },
      onFirstTap:    () => { AudioEngine.unlock(); AudioEngine.resetLevels(); },
      resetRain:     () => { AudioEngine.resetLevels(); },
      fadeRain:      () => { AudioEngine.fadeOut(4.0); },
      chime:         () => self._chime(),
      playEnd:       () => { AudioEngine.playEnd(); },
      onExit:        () => { AudioEngine.setMenuLevel(); },
    });
  },

  stop() { RainEngine.stop(); },
});
