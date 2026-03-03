/**
 * scenes/forest.js
 * Raindrops — Forest Scene
 *
 * Two audio tracks: rain + crickets
 * Background: dark forest with layered trees, fireflies, crescent moon
 * Chime: harp-like pluck (triangle wave)
 */

SceneManager.register('forest', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain',     src: 'audio/rain.mp3',     volume: 1.0 },
    { id: 'crickets', src: 'audio/crickets.mp3',  volume: 0.6 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         25,
    GLOW_MIN_GAP:     1000,
    GLOW_MAX_GAP:     2000,
    HIT_R:            45,
    DENSE:            14,
    DROP_SPEED_MIN:   18.0,
    DROP_SPEED_RANGE: 14.0,
    RAIN_COLOR:       [150, 190, 160],
    GLOW_COLOR:       [80, 220, 120],
    RIPPLE_COLOR:     [130, 200, 140],
    FX_COLORS:        ['rgba(160,230,170,', 'rgba(120,200,140,'],
    PROGRESS_COLOR:   [100, 200, 120],
    MENU_COLOR:       [20, 55, 25],
    MENU_TEXT_COLOR:  [160, 240, 170],
    ENDING_BG:        [[10, 20, 12], [8, 26, 10]],
    ENDING_PARTICLES: ['#22c55e','#4ade80','#86efac','#a3e635','#84cc16','#bef264','#fef08a','#fde047'],
    QUOTE_BG:         ['#0d1f10', '#0a1a0c', '#08140a'],
    QUOTE_PILL:       'rgba(12,30,15,0.75)',
    QUOTE_BORDER:     'rgba(100,200,120,0.3)',
    QUOTE_TEXT:       'rgba(210,245,215,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'May your worries be as short lived as a fart on a windy day. — BH',
      'notice',
      'pause',
      'reflect',
      'release',
    ],
  },

  // ─── Internal state ───────────────────────────────────────────────────────────
  _forest: null,
  _canvas: null,

  // ─── Forest builder ───────────────────────────────────────────────────────────
  _buildForest(w, h) {
    const trees = [];
    // Background layer
    for (let i = 0; i < 18; i++) {
      trees.push({
        x: -20 + Math.random() * (w + 40),
        h: h * 0.25 + Math.random() * h * 0.2,
        w: 20 + Math.random() * 15,
        layer: 0, shade: Math.random() * 0.15,
      });
    }
    // Midground layer
    for (let i = 0; i < 12; i++) {
      trees.push({
        x: -20 + Math.random() * (w + 40),
        h: h * 0.35 + Math.random() * h * 0.25,
        w: 25 + Math.random() * 20,
        layer: 1, shade: Math.random() * 0.1,
      });
    }
    // Foreground layer
    for (let i = 0; i < 8; i++) {
      trees.push({
        x: -10 + Math.random() * (w + 20),
        h: h * 0.5 + Math.random() * h * 0.3,
        w: 30 + Math.random() * 25,
        layer: 2, shade: Math.random() * 0.05,
      });
    }
    trees.sort((a, b) => a.layer - b.layer);
    return trees;
  },

  _drawForest(c, w, h, t) {
    if (!this._forest) this._forest = this._buildForest(w, h);
    const baseY = h;

    // Ground fog
    const fog = c.createLinearGradient(0, h * 0.7, 0, h);
    fog.addColorStop(0, 'rgba(15,30,18,0)');
    fog.addColorStop(1, 'rgba(15,30,18,0.3)');
    c.fillStyle = fog; c.fillRect(0, h * 0.7, w, h * 0.3);

    this._forest.forEach(tr => {
      const darkness = [0.92, 0.88, 0.95][tr.layer];
      const green = [12, 16, 8][tr.layer];
      const alpha = darkness - tr.shade;

      // Trunk
      const trunkW = tr.w * 0.08 + 2;
      c.fillStyle = `rgba(${green - 4},${green},${green - 6},${alpha})`;
      c.fillRect(tr.x - trunkW / 2, baseY - tr.h * 0.4, trunkW, tr.h * 0.4);

      // Canopy
      c.fillStyle = `rgba(${green},${green + 8},${green - 2},${alpha})`;
      c.beginPath(); c.ellipse(tr.x, baseY - tr.h * 0.55, tr.w * 0.5, tr.h * 0.35, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(tr.x - tr.w * 0.1, baseY - tr.h * 0.75, tr.w * 0.3, tr.h * 0.2, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(tr.x + tr.w * 0.2, baseY - tr.h * 0.5, tr.w * 0.25, tr.h * 0.18, 0, 0, Math.PI * 2); c.fill();

      // Fireflies on midground trees
      if (tr.layer === 1 && Math.sin(t * 0.001 + tr.x * 0.1) > 0.85) {
        const fx = tr.x + Math.sin(t * 0.002 + tr.x) * 15;
        const fy = baseY - tr.h * 0.4 + Math.cos(t * 0.0015 + tr.x) * 10;
        c.fillStyle = 'rgba(200,230,100,0.3)';
        c.beginPath(); c.arc(fx, fy, 2, 0, Math.PI * 2); c.fill();
        const fg = c.createRadialGradient(fx, fy, 0, fx, fy, 8);
        fg.addColorStop(0, 'rgba(200,230,100,0.12)'); fg.addColorStop(1, 'rgba(200,230,100,0)');
        c.fillStyle = fg; c.beginPath(); c.arc(fx, fy, 8, 0, Math.PI * 2); c.fill();
      }
    });

    // Ground line
    c.fillStyle = 'rgba(10,20,12,0.8)'; c.fillRect(0, baseY - 3, w, 5);

    // Bushes
    const bushColors = ['rgba(8,22,10,0.9)', 'rgba(12,28,14,0.85)', 'rgba(6,18,8,0.9)'];
    const bushes = [
      { x: w * 0.05, r: 18 }, { x: w * 0.15, r: 14 }, { x: w * 0.28, r: 20 },
      { x: w * 0.42, r: 12 }, { x: w * 0.55, r: 16 }, { x: w * 0.65, r: 22 },
      { x: w * 0.78, r: 13 }, { x: w * 0.88, r: 17 }, { x: w * 0.95, r: 15 },
    ];
    bushes.forEach((b, i) => {
      c.fillStyle = bushColors[i % bushColors.length];
      c.beginPath(); c.ellipse(b.x, baseY - 2, b.r, b.r * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(b.x - b.r * 0.5, baseY - 1, b.r * 0.6, b.r * 0.4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(b.x + b.r * 0.6, baseY, b.r * 0.5, b.r * 0.35, 0, 0, Math.PI * 2); c.fill();
    });
  },

  // ─── Chime: harp-like pluck ───────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    // Fallback: use AudioEngine's built-in if no context exposed
    if (!actx) { AudioEngine.chime(); return; }

    const notes = [392, 440, 523.2, 587.3, 659.2, 784, 880];
    const f = notes[Math.floor(Math.random() * notes.length)];

    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.09, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.005, actx.currentTime + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.0);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 1.0);

    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2;
    g2.gain.setValueAtTime(0.03, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.4);
    o2.connect(g2); g2.connect(actx.destination); o2.start(); o2.stop(actx.currentTime + 0.4);
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._forest = null;
    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch) => {
        const bg = c.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, '#0a0d14'); bg.addColorStop(0.2, '#101520');
        bg.addColorStop(0.4, '#181f28'); bg.addColorStop(0.6, '#1a2218');
        bg.addColorStop(1, '#0f1a12');
        c.fillStyle = bg; c.fillRect(0, 0, cw, ch);
      },

      drawForeground: (c, cw, ch, now) => {
        // Crescent moon
        const moonX = cw * 0.78, moonY = ch * 0.10, moonR = 9;
        const mg = c.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3);
        mg.addColorStop(0, 'rgba(220,230,200,0.15)'); mg.addColorStop(1, 'rgba(220,230,200,0)');
        c.fillStyle = mg; c.beginPath(); c.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(235,240,220,0.95)';
        c.beginPath(); c.arc(moonX, moonY, moonR, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#0a1a0e';
        c.beginPath(); c.arc(moonX + 5, moonY - 1, moonR - 1, 0, Math.PI * 2); c.fill();

        self._drawForest(c, cw, ch, now);
      },

      onResize: () => { self._forest = null; },
      onSceneReset: () => { self._forest = null; },

      onFirstTap: () => {
        AudioEngine.unlock();
        AudioEngine.playScene(self.tracks);
        AudioEngine.resetLevels();
      },

      resetRain: () => { AudioEngine.resetLevels(); },
      fadeRain:  () => { AudioEngine.fadeOut(4.0); },
      chime:     () => self._chime(),
      playEnd:   () => { AudioEngine.playEnd(); },
      onExit:    () => { AudioEngine.setMenuLevel(); },
    });

    AudioEngine.playScene(this.tracks);
    AudioEngine.setMenuLevel();
  },

  stop() {
    RainEngine.stop();
  },

});
