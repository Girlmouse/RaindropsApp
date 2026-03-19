/**
 * scenes/cyberpunk.js
 * Raindrops Vol 2 — Cyberpunk Rooftop Scene
 *
 * Audio: heavy rain + distant city hum
 * Background: rainy rooftop, two empty chairs, neon signs (HOTEL, OPEN),
 *             rain-soaked city skyline, flying vehicles, puddle reflections
 * Chime: electric synth blip (square wave + reverb-like decay)
 */

SceneManager.register('cyberpunk', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain',     src: 'audio/rain.mp3',      volume: 1.1 },
    { id: 'cityHum',  src: 'audio/city.mp3',       volume: 0.5 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         18,          // heavier rain
    GLOW_MIN_GAP:     800,
    GLOW_MAX_GAP:     1600,
    HIT_R:            45,
    DENSE:            16,          // denser drops for heavy rain
    DROP_SPEED_MIN:   24.0,
    DROP_SPEED_RANGE: 16.0,
    RAIN_COLOR:       [140, 170, 210],
    GLOW_COLOR:       [255, 60, 120],
    RIPPLE_COLOR:     [200, 80, 255],
    FX_COLORS:        ['rgba(255,60,120,', 'rgba(180,60,255,'],
    PROGRESS_COLOR:   [255, 60, 160],
    MENU_COLOR:       [10, 8, 20],
    MENU_TEXT_COLOR:  [255, 80, 160],
    ENDING_BG:        [[10, 5, 20], [8, 4, 18]],
    ENDING_PARTICLES: ['#ff2d78','#bf00ff','#00e5ff','#ff6ec7','#7b2fff','#ff4081','#00bcd4','#e040fb'],
    QUOTE_BG:         ['#08040f', '#0a0518', '#060310'],
    QUOTE_PILL:       'rgba(20,8,35,0.82)',
    QUOTE_BORDER:     'rgba(200,60,255,0.35)',
    QUOTE_TEXT:       'rgba(220,180,255,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'Even in the neon dark, rain is just rain.',
      'notice',
      'pause',
      'reflect',
      'The city never sleeps. But you can.',
    ],
  },

  // ─── Internal state ───────────────────────────────────────────────────────────
  _canvas: null,
  _buildings: null,
  _vehicles: [],
  _puddles: [],
  _neonFlicker: {},
  _lastVehicle: 0,

  // ─── City skyline ─────────────────────────────────────────────────────────────
  _buildSkyline(w, h) {
    const buildings = [];
    // Far background buildings
    for (let i = 0; i < 14; i++) {
      const bw = w * (0.05 + Math.random() * 0.07);
      const bh = h * (0.15 + Math.random() * 0.25);
      const bx = (i / 13) * w * 1.1 - w * 0.05;
      buildings.push({
        x: bx, w: bw, h: bh,
        layer: 0,
        windows: _genWindows(bw, bh, 6, 10),
        color: [8 + Math.random() * 8, 10 + Math.random() * 10, 20 + Math.random() * 15],
      });
    }
    // Mid buildings
    for (let i = 0; i < 9; i++) {
      const bw = w * (0.07 + Math.random() * 0.10);
      const bh = h * (0.22 + Math.random() * 0.30);
      const bx = (i / 8) * w * 1.15 - w * 0.08;
      buildings.push({
        x: bx, w: bw, h: bh,
        layer: 1,
        windows: _genWindows(bw, bh, 5, 8),
        color: [10 + Math.random() * 6, 12 + Math.random() * 8, 25 + Math.random() * 12],
      });
    }
    return buildings;

    function _genWindows(bw, bh, cols, rows) {
      const wins = [];
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          if (Math.random() > 0.35) {
            wins.push({
              col, row: r,
              color: Math.random() > 0.7
                ? `rgba(255,${60 + Math.random() * 40},${120 + Math.random() * 80},`
                : `rgba(${60 + Math.random() * 80},${100 + Math.random() * 80},${200 + Math.random() * 55},`,
              on: Math.random() > 0.25,
            });
          }
        }
      }
      return wins;
    }
  },

  _drawSkyline(c, w, h, t) {
    if (!this._buildings) this._buildings = this._buildSkyline(w, h);
    const skylineBase = h * 0.52;

    this._buildings.forEach(b => {
      const bTop = skylineBase - b.h;
      const alpha = b.layer === 0 ? 0.75 : 0.9;

      // Building body
      c.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${alpha})`;
      c.fillRect(b.x, bTop, b.w, b.h);

      // Windows
      const ww = b.w / (6 + 1);
      const wh = b.h / (10 + 1);
      b.windows.forEach(win => {
        if (!win.on) return;
        // Occasional flicker
        if (Math.sin(t * 0.003 + b.x + win.row * 7) > 0.97) return;
        const wx = b.x + (win.col + 1) * ww - ww * 0.4;
        const wy = bTop + (win.row + 1) * wh - wh * 0.4;
        const bright = b.layer === 0 ? '0.6)' : '0.8)';
        c.fillStyle = win.color + bright;
        c.fillRect(wx, wy, ww * 0.6, wh * 0.55);

        // Window glow on rainy glass
        c.fillStyle = win.color + '0.08)';
        c.fillRect(wx - 2, wy - 2, ww * 0.6 + 4, wh * 0.55 + 4);
      });

      // Building edge glow (neon bleed)
      if (b.layer === 1 && Math.random() > 0.96) {
        c.strokeStyle = `rgba(180,60,255,0.15)`;
        c.lineWidth = 2;
        c.strokeRect(b.x, bTop, b.w, b.h);
      }
    });
  },

  // ─── Flying vehicles ──────────────────────────────────────────────────────────
  _updateVehicles(now, w, h) {
    if (now - this._lastVehicle > 4000 + Math.random() * 5000) {
      this._vehicles.push({
        x: -w * 0.05,
        y: h * (0.15 + Math.random() * 0.30),
        speed: w * (0.00012 + Math.random() * 0.00008),
        size: 0.5 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? [255, 60, 120] : [60, 180, 255],
        born: now,
      });
      this._lastVehicle = now;
    }
    this._vehicles = this._vehicles.filter(v => v.x < w * 1.1);
  },

  _drawVehicles(c, w, h, t) {
    this._vehicles.forEach(v => {
      v.x += v.speed * 16; // approximate dt
      const [r, g, b] = v.color;
      const s = v.size;

      // Vehicle body
      c.fillStyle = `rgba(${r},${g},${b},0.9)`;
      c.beginPath();
      c.ellipse(v.x, v.y, 14 * s, 4 * s, 0, 0, Math.PI * 2);
      c.fill();

      // Light trail
      const trail = c.createLinearGradient(v.x - 30 * s, v.y, v.x, v.y);
      trail.addColorStop(0, `rgba(${r},${g},${b},0)`);
      trail.addColorStop(1, `rgba(${r},${g},${b},0.5)`);
      c.fillStyle = trail;
      c.fillRect(v.x - 30 * s, v.y - 2 * s, 30 * s, 4 * s);

      // Headlights
      c.fillStyle = `rgba(255,240,200,0.95)`;
      c.beginPath(); c.arc(v.x + 14 * s, v.y, 2 * s, 0, Math.PI * 2); c.fill();
      const hl = c.createRadialGradient(v.x + 14 * s, v.y, 0, v.x + 14 * s, v.y, 18 * s);
      hl.addColorStop(0, 'rgba(255,240,200,0.25)');
      hl.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = hl;
      c.beginPath(); c.arc(v.x + 14 * s, v.y, 18 * s, 0, Math.PI * 2); c.fill();
    });
  },

  // ─── Neon signs ───────────────────────────────────────────────────────────────
  _drawNeonSign(c, x, y, text, color, t, flickerId) {
    // Flicker logic
    if (!this._neonFlicker[flickerId]) this._neonFlicker[flickerId] = Math.random() * 1000;
    const flick = Math.sin(t * 0.003 + this._neonFlicker[flickerId]);
    const alpha = flick > 0.98 ? 0.2 : (flick > 0.95 ? 0.7 : 1.0);

    const [r, g, b] = color;

    // Sign backing
    c.fillStyle = `rgba(10,5,15,0.85)`;
    c.fillRect(x - 6, y - 14, text.length * 13 + 12, 22);
    c.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.5})`;
    c.lineWidth = 1;
    c.strokeRect(x - 6, y - 14, text.length * 13 + 12, 22);

    // Neon glow (outer)
    c.shadowColor = `rgba(${r},${g},${b},${alpha})`;
    c.shadowBlur = 12;
    c.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    c.font = 'bold 14px monospace';
    c.fillText(text, x, y);

    // Neon glow (inner bright)
    c.shadowBlur = 4;
    c.fillStyle = `rgba(255,220,240,${alpha * 0.8})`;
    c.fillText(text, x, y);

    c.shadowBlur = 0;

    // Puddle reflection of sign
    const refY = y + 45;
    c.save();
    c.globalAlpha = 0.18 * alpha;
    c.transform(1, 0, 0, -0.3, 0, refY + y * 0.3);
    c.fillStyle = `rgba(${r},${g},${b},1)`;
    c.font = 'bold 14px monospace';
    c.fillText(text, x, y);
    c.restore();
  },

  // ─── Rooftop surface ──────────────────────────────────────────────────────────
  _drawRooftop(c, w, h, t) {
    const roofY = h * 0.62;

    // Rooftop floor — wet concrete
    const floor = c.createLinearGradient(0, roofY, 0, h);
    floor.addColorStop(0, '#0e1018');
    floor.addColorStop(0.3, '#0a0c12');
    floor.addColorStop(1, '#060810');
    c.fillStyle = floor;
    c.fillRect(0, roofY, w, h - roofY);

    // Railing
    c.strokeStyle = 'rgba(40,45,60,0.95)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, roofY + h * 0.04);
    c.lineTo(w, roofY + h * 0.04);
    c.stroke();

    // Railing posts
    c.lineWidth = 2;
    for (let px = w * 0.05; px < w; px += w * 0.065) {
      c.beginPath();
      c.moveTo(px, roofY);
      c.lineTo(px, roofY + h * 0.04);
      c.stroke();
    }

    // Puddles on roof — animated ripples
    const puddles = [
      { x: w * 0.25, rx: w * 0.08, ry: h * 0.012 },
      { x: w * 0.6,  rx: w * 0.06, ry: h * 0.010 },
      { x: w * 0.82, rx: w * 0.04, ry: h * 0.008 },
    ];
    puddles.forEach((p, i) => {
      const py = roofY + h * 0.055;
      // Puddle base
      const pg = c.createRadialGradient(p.x, py, 0, p.x, py, p.rx);
      pg.addColorStop(0, 'rgba(60,100,160,0.35)');
      pg.addColorStop(0.7, 'rgba(40,70,120,0.2)');
      pg.addColorStop(1, 'rgba(20,40,80,0)');
      c.fillStyle = pg;
      c.beginPath();
      c.ellipse(p.x, py, p.rx, p.ry, 0, 0, Math.PI * 2);
      c.fill();

      // Rain ripples in puddle
      const rippleAge = ((t * 0.001 + i * 0.33) % 1);
      c.strokeStyle = `rgba(100,150,220,${(1 - rippleAge) * 0.4})`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(p.x, py, p.rx * rippleAge * 0.8, p.ry * rippleAge * 0.8, 0, 0, Math.PI * 2);
      c.stroke();
    });

    // Chairs — two empty chairs facing city (key image element)
    this._drawChairs(c, w, h, roofY);
  },

  // ─── Two empty chairs ─────────────────────────────────────────────────────────
  _drawChairs(c, w, h, roofY) {
    const chairY = roofY + h * 0.065;
    const chairs = [w * 0.35, w * 0.52];

    chairs.forEach(cx => {
      const cw2 = w * 0.07;
      const ch2 = h * 0.08;

      c.strokeStyle = 'rgba(55,60,80,0.95)';
      c.lineWidth = 2.5;
      c.lineCap = 'round';

      // Seat
      c.fillStyle = 'rgba(30,32,45,0.9)';
      c.fillRect(cx - cw2 / 2, chairY, cw2, ch2 * 0.2);
      c.strokeRect(cx - cw2 / 2, chairY, cw2, ch2 * 0.2);

      // Back
      c.fillRect(cx - cw2 / 2, chairY - ch2 * 0.55, cw2, ch2 * 0.5);
      c.strokeRect(cx - cw2 / 2, chairY - ch2 * 0.55, cw2, ch2 * 0.5);

      // Legs
      const legPairs = [
        [cx - cw2 * 0.4, chairY + ch2 * 0.2, cx - cw2 * 0.5, chairY + ch2 * 0.55],
        [cx + cw2 * 0.4, chairY + ch2 * 0.2, cx + cw2 * 0.5, chairY + ch2 * 0.55],
      ];
      legPairs.forEach(([x1,y1,x2,y2]) => {
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      });

      // Chair wet sheen
      const sheen = c.createLinearGradient(cx - cw2 / 2, chairY - ch2 * 0.55, cx + cw2 / 2, chairY + ch2 * 0.2);
      sheen.addColorStop(0, 'rgba(100,130,200,0.08)');
      sheen.addColorStop(1, 'rgba(100,130,200,0)');
      c.fillStyle = sheen;
      c.fillRect(cx - cw2 / 2, chairY - ch2 * 0.55, cw2, ch2 * 0.7);
    });
  },

  // ─── Chime: synth electric blip ───────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const cv = AudioEngine.getChimeVolume ? AudioEngine.getChimeVolume() : 1.0;

    // Square wave blip — cyberpunk feel
    const notes = [220, 277.2, 329.6, 440, 554.4, 659.2, 880];
    const f = notes[Math.floor(Math.random() * notes.length)];

    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square';
    o.frequency.value = f;
    // Quick attack, slow decay — synth pluck
    g.gain.setValueAtTime(0.06 * cv, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.02 * cv, actx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.9);

    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, actx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, actx.currentTime + 0.9);

    o.connect(filter); filter.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + 0.9);

    // Sub-bass pulse
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 0.5;
    g2.gain.setValueAtTime(0.04 * cv, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.3);
    o2.connect(g2); g2.connect(actx.destination);
    o2.start(); o2.stop(actx.currentTime + 0.3);
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._buildings = null;
    this._vehicles = [];
    this._neonFlicker = {};
    this._lastVehicle = 0;
    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch) => {
        // Deep night sky — dark blue/purple
        const sky = c.createLinearGradient(0, 0, 0, ch * 0.55);
        sky.addColorStop(0,   '#04030a');
        sky.addColorStop(0.4, '#06040f');
        sky.addColorStop(0.8, '#0a061a');
        sky.addColorStop(1,   '#0e0820');
        c.fillStyle = sky;
        c.fillRect(0, 0, cw, ch * 0.55);

        // Atmospheric neon bleed in sky from city below
        const cityGlow = c.createLinearGradient(0, ch * 0.30, 0, ch * 0.55);
        cityGlow.addColorStop(0, 'rgba(80,20,120,0)');
        cityGlow.addColorStop(0.5, 'rgba(100,20,140,0.12)');
        cityGlow.addColorStop(1, 'rgba(140,30,180,0.22)');
        c.fillStyle = cityGlow;
        c.fillRect(0, ch * 0.30, cw, ch * 0.25);
      },

      drawForeground: (c, cw, ch, now) => {
        // Skyline
        self._drawSkyline(c, cw, ch, now);

        // Neon signs — key visual from ref image
        self._drawNeonSign(c, cw * 0.05, ch * 0.70, 'HOTEL', [255, 40, 80], now, 'hotel');
        self._drawNeonSign(c, cw * 0.72, ch * 0.67, 'OPEN', [60, 220, 120], now, 'open');

        // Flying vehicles
        self._updateVehicles(now, cw, ch);
        self._drawVehicles(c, cw, ch, now);

        // Rooftop + chairs + puddles
        self._drawRooftop(c, cw, ch, now);

        // Rain mist layer over city
        const mist = c.createLinearGradient(0, ch * 0.45, 0, ch * 0.62);
        mist.addColorStop(0, 'rgba(10,15,30,0)');
        mist.addColorStop(1, 'rgba(10,15,30,0.25)');
        c.fillStyle = mist;
        c.fillRect(0, ch * 0.45, cw, ch * 0.17);
      },

      onResize: () => { self._buildings = null; },
      onSceneReset: () => { self._buildings = null; self._vehicles = []; },

      onFirstTap: () => {
        AudioEngine.unlock();
        AudioEngine.resetLevels();
      },

      resetRain: () => { AudioEngine.resetLevels(); },
      fadeRain:  () => { AudioEngine.fadeOut(4.0); },
      chime:     () => self._chime(),
      playEnd:   () => { AudioEngine.playEnd(); },
      onExit:    () => { AudioEngine.setMenuLevel(); },
    });
  },

  stop() {
    RainEngine.stop();
  },

});
