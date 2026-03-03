/**
 * scenes/city.js
 * Raindrops — City Scene
 *
 * Registers itself with SceneManager.
 * Uses RainEngine (shared/game-engine.js) for all drop/game logic.
 * Uses AudioEngine (shared/audio-engine.js) for audio.
 */

SceneManager.register('city', {

  // ─── Audio tracks for this scene ─────────────────────────────────────────────
  tracks: [
    { id: 'rain', src: 'audio/rain.mp3', volume: 1.0 },
  ],

  // ─── Scene config (passed to RainEngine) ─────────────────────────────────────
  config: {
    DROPS_TO_WIN:   20,
    RAIN_INT:       5,
    GLOW_MIN_GAP:   1000,
    GLOW_MAX_GAP:   2000,
    HIT_R:          80,
    DENSE:          12,
    DROP_SPEED_MIN: 26.0,
    DROP_SPEED_RANGE: 18.0,
    RAIN_COLOR:     [180, 175, 210],
    GLOW_COLOR:     [180, 120, 255],
    RIPPLE_COLOR:   [200, 175, 255],
    FX_COLORS:      ['rgba(236,210,255,', 'rgba(200,175,255,'],
    PROGRESS_COLOR: [180, 140, 240],
    MENU_COLOR:     [50, 25, 80],
    MENU_TEXT_COLOR:[253, 224, 71],
    ENDING_BG:      [[8, 6, 14], [12, 8, 20]],
    ENDING_PARTICLES: ['#fbbf24','#f59e0b','#fcd34d','#fb923c','#fdba74','#fef08a','#c084fc','#e879f9'],
    QUOTE_BG:       ['#0a0d14', '#101520', '#120f1e'],
    QUOTE_PILL:     'rgba(20,12,40,0.75)',
    QUOTE_BORDER:   'rgba(180,140,255,0.3)',
    QUOTE_TEXT:     'rgba(235,225,255,0.95)',
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
  _sky: null,
  _canvas: null,

  // ─── Skyline builder ─────────────────────────────────────────────────────────
  _buildSkyline(w, h) {
    const bs = []; let x = -5;
    while (x < w + 20) {
      const bw = 14 + Math.random() * 38;
      const bh = h * 0.12 + Math.random() * h * 0.48;
      const ant = Math.random() > 0.7;
      const wins = [];
      const wC = Math.floor(bw / 8), wR = Math.floor(bh / 12);
      for (let r = 1; r < wR; r++) {
        for (let cl = 0; cl < wC; cl++) {
          if (Math.random() > 0.75) {
            wins.push({
              rx: 3 + cl * (bw / wC), ry: r * 12,
              lit: Math.random() > 0.75,
              flicker: Math.random() > 0.995,
              fSpd: 0.001 + Math.random() * 0.002,
              fPh: Math.random() * Math.PI * 2,
            });
          }
        }
      }
      bs.push({ x, w: bw, h: bh, ant, aH: 10 + Math.random() * 20, wins });
      x += bw + 2 + Math.random() * 5;
    }
    return bs;
  },

  _drawSkyline(c, w, h, t) {
    if (!this._sky) this._sky = this._buildSkyline(w, h);
    const by = h;
    const gl = c.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.8);
    gl.addColorStop(0, 'rgba(60,30,80,0.12)');
    gl.addColorStop(0.5, 'rgba(40,20,60,0.05)');
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gl; c.fillRect(0, 0, w, h);

    this._sky.forEach(b => {
      c.fillStyle = 'rgba(8,6,14,0.95)'; c.fillRect(b.x, by - b.h, b.w, b.h);
      c.strokeStyle = 'rgba(60,40,80,0.12)'; c.lineWidth = 0.5; c.strokeRect(b.x, by - b.h, b.w, b.h);
      if (b.ant) {
        const ax = b.x + b.w / 2;
        c.strokeStyle = 'rgba(40,30,60,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(ax, by - b.h); c.lineTo(ax, by - b.h - b.aH); c.stroke();
        if (Math.sin(t * 0.003 + b.x) > 0.3) {
          c.fillStyle = 'rgba(255,50,50,0.6)';
          c.beginPath(); c.arc(ax, by - b.h - b.aH, 1.5, 0, Math.PI * 2); c.fill();
          const rg = c.createRadialGradient(ax, by - b.h - b.aH, 0, ax, by - b.h - b.aH, 8);
          rg.addColorStop(0, 'rgba(255,50,50,0.15)'); rg.addColorStop(1, 'rgba(255,50,50,0)');
          c.fillStyle = rg; c.beginPath(); c.arc(ax, by - b.h - b.aH, 8, 0, Math.PI * 2); c.fill();
        }
      }
      b.wins.forEach(win => {
        let a = win.lit ? 0.6 : 0.08;
        if (win.flicker) a *= 0.5 + 0.5 * Math.sin(t * win.fSpd + win.fPh);
        if (win.lit) {
          const wx = b.x + win.rx, wy = by - b.h + win.ry;
          c.fillStyle = `rgba(255,220,140,${a * 0.3})`; c.fillRect(wx - 1, wy - 1, 5, 5);
          c.fillStyle = `rgba(255,200,100,${a})`; c.fillRect(wx, wy, 3, 3);
        } else {
          c.fillStyle = `rgba(30,25,45,${a})`; c.fillRect(b.x + win.rx, by - b.h + win.ry, 3, 3);
        }
      });
    });
  },

  // ─── Static stars ────────────────────────────────────────────────────────────
  _stars: [
    { x: 0.05, y: 0.06, size: 1.1, alpha: 0.5 }, { x: 0.12, y: 0.14, size: 0.9, alpha: 0.4 },
    { x: 0.22, y: 0.08, size: 1.3, alpha: 0.55 }, { x: 0.30, y: 0.18, size: 0.8, alpha: 0.35 },
    { x: 0.38, y: 0.05, size: 1.0, alpha: 0.45 }, { x: 0.48, y: 0.12, size: 1.2, alpha: 0.5 },
    { x: 0.55, y: 0.03, size: 0.9, alpha: 0.4 },  { x: 0.65, y: 0.10, size: 1.1, alpha: 0.45 },
    { x: 0.72, y: 0.16, size: 0.85, alpha: 0.38 },{ x: 0.82, y: 0.07, size: 1.25, alpha: 0.52 },
    { x: 0.90, y: 0.13, size: 0.95, alpha: 0.42 },{ x: 0.96, y: 0.04, size: 1.0, alpha: 0.48 },
  ],

  // ─── Chime (city: synth ding) ─────────────────────────────────────────────────
  _chime() {
    AudioEngine.chime();
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────

  init(canvas) {
    this._canvas = canvas;
    this._sky = null;

    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch, now) => {
        // Sky gradient
        const bg = c.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, '#0a0d14'); bg.addColorStop(0.2, '#101520');
        bg.addColorStop(0.4, '#181f28'); bg.addColorStop(0.6, '#1a1528');
        bg.addColorStop(1, '#120f1e');
        c.fillStyle = bg; c.fillRect(0, 0, cw, ch);

        // Stars
        self._stars.forEach(star => {
          c.fillStyle = `rgba(220,210,240,${star.alpha})`;
          c.beginPath(); c.arc(star.x * cw, star.y * ch, star.size, 0, Math.PI * 2); c.fill();
        });
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawSkyline(c, cw, ch, now);
      },

      onResize: () => { self._sky = null; },

      onSceneReset: () => { self._sky = null; },

      onFirstTap: () => {
        AudioEngine.unlock();
        AudioEngine.playScene(self.tracks);
        AudioEngine.resetLevels();
      },

      resetRain: () => {
        AudioEngine.resetLevels();
      },

      fadeRain: () => {
        AudioEngine.fadeOut(4.0);
      },

      chime: () => self._chime(),

      playEnd: () => {
        AudioEngine.playEnd();
      },

      onExit: () => {
        AudioEngine.setMenuLevel();
      },
    });

    // Start audio at menu level if already unlocked
    AudioEngine.playScene(this.tracks);
    AudioEngine.setMenuLevel();
  },

  stop() {
    RainEngine.stop();
  },

});
