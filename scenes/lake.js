/**
 * scenes/lake.js
 * Raindrops Vol 2 — Misty Lake Scene
 *
 * Audio: rain + soft water ambience
 * Background: wooden dock, bench, still misty lake,
 *             tree silhouettes in fog, rain ripples on water
 * Chime: soft bell/bowl (sine with slow attack)
 */

SceneManager.register('lake', {

  tracks: [
    { id: 'rain',  src: 'audio/rain.mp3',  volume: 0.9 },
    { id: 'water', src: 'audio/water.mp3', volume: 0.55 },
  ],

  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         26,
    GLOW_MIN_GAP:     1100,
    GLOW_MAX_GAP:     2200,
    HIT_R:            45,
    DENSE:            13,
    DROP_SPEED_MIN:   17.0,
    DROP_SPEED_RANGE: 11.0,
    RAIN_COLOR:       [140, 175, 185],
    GLOW_COLOR:       [120, 200, 210],
    RIPPLE_COLOR:     [100, 180, 195],
    FX_COLORS:        ['rgba(120,200,210,', 'rgba(80,160,175,'],
    PROGRESS_COLOR:   [100, 190, 200],
    MENU_COLOR:       [8, 18, 22],
    MENU_TEXT_COLOR:  [160, 220, 230],
    ENDING_BG:        [[8, 18, 22], [6, 15, 18]],
    ENDING_PARTICLES: ['#67e8f9','#22d3ee','#06b6d4','#0891b2','#a5f3fc','#7dd3fc','#93c5fd','#bae6fd'],
    QUOTE_BG:         ['#040e12', '#051018', '#030c10'],
    QUOTE_PILL:       'rgba(8,20,28,0.80)',
    QUOTE_BORDER:     'rgba(80,180,200,0.3)',
    QUOTE_TEXT:       'rgba(180,235,240,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'Still water holds the whole sky.',
      'notice',
      'pause',
      'reflect',
      'The fog doesn\'t hide the world. It simplifies it.',
    ],
  },

  _canvas: null,
  _waterRipples: [],
  _lastRipple: 0,
  _treeLine: null,

  // ─── Fog tree line ─────────────────────────────────────────────────────────────
  _buildTrees(w, h) {
    const trees = [];
    for (let i = 0; i < 22; i++) {
      trees.push({
        x: (i / 21) * w * 1.1 - w * 0.05,
        h: h * (0.12 + Math.random() * 0.14),
        w: 8 + Math.random() * 14,
        type: Math.random() > 0.4 ? 'pine' : 'round',
      });
    }
    return trees;
  },

  _drawTrees(c, w, h) {
    if (!this._treeLine) this._treeLine = this._buildTrees(w, h);
    const baseY = h * 0.42;

    this._treeLine.forEach(tr => {
      const alpha = 0.3 + Math.random() * 0.05; // misty — very faded
      c.fillStyle = `rgba(30,55,65,${alpha})`;

      if (tr.type === 'pine') {
        // Pine silhouette
        c.beginPath();
        c.moveTo(tr.x, baseY);
        c.lineTo(tr.x - tr.w / 2, baseY);
        c.lineTo(tr.x, baseY - tr.h);
        c.lineTo(tr.x + tr.w / 2, baseY);
        c.closePath();
        c.fill();
        // Second tier
        c.beginPath();
        c.moveTo(tr.x, baseY - tr.h * 0.4);
        c.lineTo(tr.x - tr.w * 0.4, baseY - tr.h * 0.4);
        c.lineTo(tr.x, baseY - tr.h * 1.1);
        c.lineTo(tr.x + tr.w * 0.4, baseY - tr.h * 0.4);
        c.closePath();
        c.fill();
      } else {
        c.beginPath();
        c.ellipse(tr.x, baseY - tr.h * 0.55, tr.w * 0.5, tr.h * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        // Trunk
        c.fillRect(tr.x - 2, baseY - tr.h * 0.15, 4, tr.h * 0.15);
      }
    });

    // Tree reflections in water — even mistier
    this._treeLine.forEach(tr => {
      c.save();
      c.globalAlpha = 0.12;
      c.fillStyle = 'rgba(30,55,65,1)';
      const reflY = h * 0.42;
      c.scale(1, -0.4);
      const flippedY = -(reflY) / 0.4;
      if (tr.type === 'pine') {
        c.beginPath();
        c.moveTo(tr.x, flippedY);
        c.lineTo(tr.x - tr.w / 2, flippedY);
        c.lineTo(tr.x, flippedY - tr.h);
        c.lineTo(tr.x + tr.w / 2, flippedY);
        c.closePath();
        c.fill();
      } else {
        c.beginPath();
        c.ellipse(tr.x, flippedY - tr.h * 0.55, tr.w * 0.5, tr.h * 0.5, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    });
  },

  // ─── Water ripples ─────────────────────────────────────────────────────────────
  _updateRipples(now) {
    if (now - this._lastRipple > 220) {
      this._waterRipples.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.44 + Math.random() * 0.20,
        born: now,
        maxR: 0.025 + Math.random() * 0.02,
      });
      this._lastRipple = now;
    }
    this._waterRipples = this._waterRipples.filter(r => now - r.born < 1800);
  },

  _drawRipples(c, w, h, now) {
    this._waterRipples.forEach(r => {
      const age = (now - r.born) / 1800;
      const rx = r.x * w;
      const ry = r.y * h;
      const radius = r.maxR * w * age;
      c.save();
      c.globalAlpha = (1 - age) * 0.45;
      c.strokeStyle = 'rgba(140,200,215,0.8)';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(rx, ry, radius, radius * 0.35, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    });
  },

  // ─── Dock ──────────────────────────────────────────────────────────────────────
  _drawDock(c, w, h) {
    const dockY  = h * 0.70;
    const dockW  = w * 0.55;
    const dockX  = w * 0.22;
    const dockH  = h * 0.08;
    const planks = 6;

    // Dock shadow
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(dockX + 4, dockY + 4, dockW, dockH);

    // Dock base
    c.fillStyle = '#5a3c1e';
    c.fillRect(dockX, dockY, dockW, dockH);

    // Plank lines
    c.strokeStyle = '#3a2410';
    c.lineWidth = 1.5;
    for (let i = 1; i < planks; i++) {
      const lx = dockX + (dockW / planks) * i;
      c.beginPath();
      c.moveTo(lx, dockY);
      c.lineTo(lx, dockY + dockH);
      c.stroke();
    }

    // Dock posts into water
    const postColor = '#3a2210';
    [dockX + dockW * 0.1, dockX + dockW * 0.5, dockX + dockW * 0.9].forEach(px => {
      c.fillStyle = postColor;
      c.fillRect(px - 4, dockY + dockH, 8, h * 0.06);
    });

    // Wet sheen on dock
    const sheen = c.createLinearGradient(dockX, dockY, dockX, dockY + dockH);
    sheen.addColorStop(0, 'rgba(140,180,200,0.15)');
    sheen.addColorStop(1, 'rgba(140,180,200,0)');
    c.fillStyle = sheen;
    c.fillRect(dockX, dockY, dockW, dockH);
  },

  // ─── Bench ─────────────────────────────────────────────────────────────────────
  _drawBench(c, w, h) {
    const bx = w * 0.30;
    const by = h * 0.64;
    const bw = w * 0.38;
    const bh = h * 0.04;

    // Bench legs
    c.strokeStyle = '#2a1a08';
    c.lineWidth = 3;
    c.lineCap = 'round';
    [[bx + bw * 0.12, by + bh, bx + bw * 0.08, by + bh * 3.5],
     [bx + bw * 0.88, by + bh, bx + bw * 0.92, by + bh * 3.5],
     [bx + bw * 0.12, by + bh, bx + bw * 0.88, by + bh],    // cross brace
    ].forEach(([x1,y1,x2,y2]) => {
      c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke();
    });

    // Seat slats (3)
    const slatColors = ['#7a5030', '#8a6040', '#7a5030'];
    for (let s = 0; s < 3; s++) {
      const sy = by + s * (bh * 0.38);
      c.fillStyle = slatColors[s];
      c.fillRect(bx, sy, bw, bh * 0.3);
      c.strokeStyle = '#3a2010';
      c.lineWidth = 1;
      c.strokeRect(bx, sy, bw, bh * 0.3);
    }

    // Back rest slats (2 horizontal)
    for (let s = 0; s < 2; s++) {
      const sy = by - bh * 1.2 - s * bh * 0.55;
      c.fillStyle = slatColors[s];
      c.fillRect(bx, sy, bw, bh * 0.28);
      c.strokeStyle = '#3a2010';
      c.lineWidth = 1;
      c.strokeRect(bx, sy, bw, bh * 0.28);
    }
    // Back posts
    c.strokeStyle = '#2a1a08';
    c.lineWidth = 3;
    [bx + bw * 0.1, bx + bw * 0.9].forEach(px => {
      c.beginPath();
      c.moveTo(px, by);
      c.lineTo(px, by - bh * 1.8);
      c.stroke();
    });

    // Rain drops on bench
    const wetSheen = c.createLinearGradient(bx, by - bh * 1.2, bx, by + bh);
    wetSheen.addColorStop(0, 'rgba(140,180,200,0.12)');
    wetSheen.addColorStop(1, 'rgba(140,180,200,0.06)');
    c.fillStyle = wetSheen;
    c.fillRect(bx, by - bh * 1.2, bw, bh * 2.2);
  },

  // ─── Chime: singing bowl ───────────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const cv = AudioEngine.getChimeVolume ? AudioEngine.getChimeVolume() : 1.0;

    const notes = [174.6, 220, 261.6, 293.7, 349.2, 392, 440];
    const f = notes[Math.floor(Math.random() * notes.length)];

    // Slow attack, long ring — singing bowl
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, actx.currentTime);
    g.gain.linearRampToValueAtTime(0.08 * cv, actx.currentTime + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 3.5);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + 3.5);

    // Shimmer overtone
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2.76;
    g2.gain.setValueAtTime(0, actx.currentTime);
    g2.gain.linearRampToValueAtTime(0.025 * cv, actx.currentTime + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 2.0);
    o2.connect(g2); g2.connect(actx.destination);
    o2.start(); o2.stop(actx.currentTime + 2.0);
  },

  init(canvas) {
    this._canvas = canvas;
    this._waterRipples = [];
    this._lastRipple = 0;
    this._treeLine = null;
    const self = this;

    RainEngine.init(canvas, this.config, {
      drawBackground: (c, cw, ch) => {
        // Sky — muted blue-grey
        const sky = c.createLinearGradient(0, 0, 0, ch * 0.44);
        sky.addColorStop(0,   '#0d1e26');
        sky.addColorStop(0.5, '#122530');
        sky.addColorStop(1,   '#1a3040');
        c.fillStyle = sky; c.fillRect(0, 0, cw, ch * 0.44);

        // Water — teal-grey still surface
        const water = c.createLinearGradient(0, ch * 0.42, 0, ch * 0.72);
        water.addColorStop(0,   '#1a3545');
        water.addColorStop(0.4, '#152c3a');
        water.addColorStop(1,   '#0e2030');
        c.fillStyle = water; c.fillRect(0, ch * 0.42, cw, ch * 0.30);

        // Fog band at horizon
        const fog = c.createLinearGradient(0, ch * 0.36, 0, ch * 0.48);
        fog.addColorStop(0, 'rgba(160,200,210,0)');
        fog.addColorStop(0.5, 'rgba(160,200,210,0.18)');
        fog.addColorStop(1, 'rgba(160,200,210,0)');
        c.fillStyle = fog; c.fillRect(0, ch * 0.36, cw, ch * 0.12);
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawTrees(c, cw, ch);
        self._updateRipples(now);
        self._drawRipples(c, cw, ch, now);

        // Ground / shore
        const shore = c.createLinearGradient(0, ch * 0.70, 0, ch);
        shore.addColorStop(0, '#1a1208');
        shore.addColorStop(1, '#0e0c06');
        c.fillStyle = shore; c.fillRect(0, ch * 0.70, cw, ch * 0.30);

        // Shore mist
        const shoreMist = c.createLinearGradient(0, ch * 0.68, 0, ch * 0.76);
        shoreMist.addColorStop(0, 'rgba(140,180,190,0)');
        shoreMist.addColorStop(0.5, 'rgba(140,180,190,0.10)');
        shoreMist.addColorStop(1, 'rgba(140,180,190,0)');
        c.fillStyle = shoreMist; c.fillRect(0, ch * 0.68, cw, ch * 0.08);

        self._drawDock(c, cw, ch);
        self._drawBench(c, cw, ch);
      },

      onResize:     () => { self._treeLine = null; self._waterRipples = []; },
      onSceneReset: () => { self._treeLine = null; self._waterRipples = []; },
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
