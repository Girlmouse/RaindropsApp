/**
 * scenes/beach.js
 * Raindrops Vol 2 — Tropical Beach Scene
 *
 * Audio: tropical rain + ocean waves
 * Background: warm sunset beach — pink/orange sand, teal water,
 *             leaning palm tree, distant hut, rain hitting the shore
 * Chime: soft steel-drum-like tone (sawtooth + filter)
 */

SceneManager.register('beach', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain',   src: 'audio/rain.mp3',   volume: 0.85 },
    { id: 'waves',  src: 'audio/waves.mp3',  volume: 0.75 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         22,
    GLOW_MIN_GAP:     900,
    GLOW_MAX_GAP:     1800,
    HIT_R:            45,
    DENSE:            13,
    DROP_SPEED_MIN:   20.0,
    DROP_SPEED_RANGE: 12.0,
    RAIN_COLOR:       [160, 220, 210],
    GLOW_COLOR:       [255, 180, 80],
    RIPPLE_COLOR:     [255, 160, 100],
    FX_COLORS:        ['rgba(255,180,80,', 'rgba(255,120,60,'],
    PROGRESS_COLOR:   [255, 160, 60],
    MENU_COLOR:       [80, 30, 10],
    MENU_TEXT_COLOR:  [255, 200, 120],
    ENDING_BG:        [[80, 30, 10], [60, 20, 5]],
    ENDING_PARTICLES: ['#ff9f43','#feca57','#ff6b6b','#ff4757','#eccc68','#ff7f50','#48dbfb','#0abde3'],
    QUOTE_BG:         ['#1a0a00', '#200c00', '#180900'],
    QUOTE_PILL:       'rgba(40,15,5,0.78)',
    QUOTE_BORDER:     'rgba(255,150,60,0.35)',
    QUOTE_TEXT:       'rgba(255,220,170,0.95)',
    QUOTES: [
      'breathe',
      'feel',
      'listen',
      'The ocean knows how to be patient. So can you.',
      'notice',
      'pause',
      'reflect',
      'Let the rain wash it all away.',
    ],
  },

  // ─── Internal state ───────────────────────────────────────────────────────────
  _canvas: null,
  _waveOffset: 0,
  _rainRipples: [],   // shore ripples from rain hitting wet sand
  _lastRipple: 0,

  // ─── Palm tree ────────────────────────────────────────────────────────────────
  _drawPalm(c, w, h, t) {
    const baseX = w * 0.72;
    const baseY = h * 0.68;

    // Gentle sway
    const sway = Math.sin(t * 0.0008) * 0.04;

    c.save();
    c.translate(baseX, baseY);

    // Trunk — curved, leaning left over water
    c.strokeStyle = '#3d2a1a';
    c.lineWidth = w * 0.025;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(
      -w * 0.04, -h * 0.15,
      -w * 0.10 + sway * w, -h * 0.32,
      -w * 0.18 + sway * w * 1.5, -h * 0.42
    );
    c.stroke();

    // Trunk texture lines
    c.strokeStyle = '#2a1a0a';
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const tFrac = i / 6;
      const tx = -w * 0.04 * tFrac - w * 0.10 * tFrac + sway * w * tFrac;
      const ty = -h * 0.42 * tFrac;
      c.beginPath();
      c.moveTo(tx - 4, ty);
      c.lineTo(tx + 4, ty + 3);
      c.stroke();
    }

    // Frond origin (top of trunk)
    const topX = -w * 0.18 + sway * w * 1.5;
    const topY = -h * 0.42;

    // Draw fronds — 7 leaves fanning out
    const fronds = [
      { angle: -0.5, len: 0.22, droop: 0.08 },
      { angle: -0.9, len: 0.20, droop: 0.10 },
      { angle: -1.3, len: 0.18, droop: 0.12 },
      { angle:  0.1, len: 0.21, droop: 0.07 },
      { angle:  0.5, len: 0.19, droop: 0.09 },
      { angle:  0.9, len: 0.17, droop: 0.11 },
      { angle: -1.7, len: 0.15, droop: 0.13 },
    ];

    fronds.forEach(fr => {
      const frSway = sway * 0.8;
      const ex = topX + Math.cos(fr.angle + frSway) * w * fr.len;
      const ey = topY + Math.sin(fr.angle + frSway) * h * fr.len + h * fr.droop;
      const cx1 = topX + Math.cos(fr.angle + frSway) * w * fr.len * 0.4;
      const cy1 = topY + Math.sin(fr.angle + frSway) * h * fr.len * 0.3;

      // Frond silhouette (dark green)
      c.strokeStyle = '#1a3d1a';
      c.lineWidth = w * 0.018;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(topX, topY);
      c.quadraticCurveTo(cx1, cy1, ex, ey);
      c.stroke();

      // Frond highlight (lighter green)
      c.strokeStyle = '#2a5a2a';
      c.lineWidth = w * 0.006;
      c.beginPath();
      c.moveTo(topX, topY);
      c.quadraticCurveTo(cx1 + 2, cy1 - 2, ex + 3, ey - 3);
      c.stroke();

      // Leaflets along each frond
      const steps = 6;
      for (let s = 1; s < steps; s++) {
        const ft = s / steps;
        const lx = topX + (cx1 - topX) * ft * 2;
        const ly = topY + (cy1 - topY) * ft * 2;
        const perpAngle = fr.angle + Math.PI / 2;
        const leafLen = w * 0.025 * (1 - ft * 0.4);
        c.strokeStyle = `rgba(26,60,20,${0.7 - ft * 0.2})`;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(lx, ly);
        c.lineTo(lx + Math.cos(perpAngle) * leafLen, ly + Math.sin(perpAngle) * leafLen);
        c.stroke();
        c.beginPath();
        c.moveTo(lx, ly);
        c.lineTo(lx - Math.cos(perpAngle) * leafLen, ly - Math.sin(perpAngle) * leafLen);
        c.stroke();
      }
    });

    // Coconuts cluster at frond base
    c.fillStyle = '#5a3a10';
    [[-8, 8], [0, 12], [8, 6]].forEach(([ox, oy]) => {
      c.beginPath();
      c.arc(topX + ox, topY + oy, 5, 0, Math.PI * 2);
      c.fill();
    });

    c.restore();
  },

  // ─── Distant beach hut ────────────────────────────────────────────────────────
  _drawHut(c, w, h) {
    const hx = w * 0.12, hy = h * 0.55;
    const hw = w * 0.08, hh = h * 0.06;

    // Hut body
    c.fillStyle = 'rgba(60,35,15,0.7)';
    c.fillRect(hx - hw / 2, hy, hw, hh);

    // Thatched roof
    c.fillStyle = 'rgba(80,55,20,0.75)';
    c.beginPath();
    c.moveTo(hx - hw * 0.7, hy);
    c.lineTo(hx, hy - hh * 0.8);
    c.lineTo(hx + hw * 0.7, hy);
    c.closePath();
    c.fill();

    // Warm window glow
    const wg = c.createRadialGradient(hx, hy + hh * 0.4, 0, hx, hy + hh * 0.4, hw * 0.8);
    wg.addColorStop(0, 'rgba(255,180,60,0.25)');
    wg.addColorStop(1, 'rgba(255,180,60,0)');
    c.fillStyle = wg;
    c.beginPath();
    c.arc(hx, hy + hh * 0.4, hw * 0.8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = 'rgba(255,200,80,0.6)';
    c.fillRect(hx - 4, hy + hh * 0.2, 8, 6);
  },

  // ─── Shore rain ripples ───────────────────────────────────────────────────────
  _updateRipples(now) {
    if (now - this._lastRipple > 180) {
      this._rainRipples.push({ x: Math.random(), born: now });
      this._lastRipple = now;
    }
    this._rainRipples = this._rainRipples.filter(r => now - r.born < 900);
  },

  _drawRipples(c, w, h, now) {
    this._rainRipples.forEach(r => {
      const age = (now - r.born) / 900;
      const rx = r.x * w;
      const ry = h * 0.68 + Math.random() * 2; // on wet sand / shore
      const maxR = w * 0.03;
      c.save();
      c.globalAlpha = (1 - age) * 0.35;
      c.strokeStyle = 'rgba(255,160,100,0.8)';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(rx, ry, maxR * age, maxR * age * 0.3, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    });
  },

  // ─── Waves ────────────────────────────────────────────────────────────────────
  _drawWaves(c, w, h, t) {
    const waterY = h * 0.58;
    const waveAmp = h * 0.012;

    // Deep water (background)
    const waterBg = c.createLinearGradient(0, waterY, 0, h * 0.70);
    waterBg.addColorStop(0, 'rgba(20,140,160,0.9)');
    waterBg.addColorStop(0.5, 'rgba(15,110,130,0.95)');
    waterBg.addColorStop(1, 'rgba(10,80,100,1)');
    c.fillStyle = waterBg;
    c.fillRect(0, waterY, w, h * 0.70 - waterY);

    // Animated wave lines
    for (let wv = 0; wv < 4; wv++) {
      const wy = waterY + wv * h * 0.018;
      const speed = t * 0.0015 + wv * 0.8;
      const amp = waveAmp * (1 - wv * 0.15);

      c.strokeStyle = `rgba(100,220,230,${0.25 - wv * 0.05})`;
      c.lineWidth = 1.5 - wv * 0.3;
      c.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = wy + Math.sin(x * 0.018 + speed) * amp
                     + Math.sin(x * 0.011 - speed * 0.7) * amp * 0.5;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }

    // Shore foam line
    const foamY = h * 0.665;
    const foamAmp = h * 0.008;
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 3;
    c.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = foamY + Math.sin(x * 0.02 + t * 0.002) * foamAmp;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();

    // Wet sand reflection strip
    const refGrad = c.createLinearGradient(0, h * 0.668, 0, h * 0.72);
    refGrad.addColorStop(0, 'rgba(40,120,140,0.45)');
    refGrad.addColorStop(1, 'rgba(40,120,140,0)');
    c.fillStyle = refGrad;
    c.fillRect(0, h * 0.668, w, h * 0.052);
  },

  // ─── Sand ─────────────────────────────────────────────────────────────────────
  _drawSand(c, w, h) {
    // Sand base — warm pink/orange gradient (key visual from ref image)
    const sand = c.createLinearGradient(0, h * 0.67, 0, h);
    sand.addColorStop(0, '#c8607a');   // pink at waterline
    sand.addColorStop(0.3, '#d4724a'); // orange mid
    sand.addColorStop(0.7, '#c86030'); // deeper orange
    sand.addColorStop(1,   '#8a3820'); // dark at bottom
    c.fillStyle = sand;
    c.fillRect(0, h * 0.67, w, h * 0.33);

    // Sand color wash — warm light from right
    const warmWash = c.createRadialGradient(w * 0.8, h * 0.72, 0, w * 0.8, h * 0.85, w * 0.6);
    warmWash.addColorStop(0, 'rgba(255,200,80,0.18)');
    warmWash.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = warmWash;
    c.fillRect(0, h * 0.67, w, h * 0.33);

    // Sand texture — subtle ripple lines
    c.strokeStyle = 'rgba(180,60,30,0.12)';
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const sy = h * 0.72 + i * h * 0.04;
      c.beginPath();
      c.moveTo(0, sy);
      c.bezierCurveTo(w * 0.3, sy + 3, w * 0.6, sy - 2, w, sy + 1);
      c.stroke();
    }

    // Wet sand puddle reflection near shore
    const puddle = c.createLinearGradient(0, h * 0.68, 0, h * 0.72);
    puddle.addColorStop(0, 'rgba(20,80,100,0.5)');
    puddle.addColorStop(1, 'rgba(20,80,100,0)');
    c.fillStyle = puddle;
    c.fillRect(0, h * 0.68, w, h * 0.04);
  },

  // ─── Small boat ───────────────────────────────────────────────────────────────
  _drawBoat(c, w, h, t) {
    const bx = w * 0.38;
    const by = h * 0.675;
    const bob = Math.sin(t * 0.0012) * 2;

    c.save();
    c.translate(bx, by + bob);

    // Hull
    c.fillStyle = '#4a5a6a';
    c.beginPath();
    c.moveTo(-w * 0.07, 0);
    c.lineTo(w * 0.07, 0);
    c.lineTo(w * 0.05, h * 0.018);
    c.lineTo(-w * 0.05, h * 0.018);
    c.closePath();
    c.fill();

    // Hull rim
    c.strokeStyle = '#6a7a8a';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-w * 0.07, 0);
    c.lineTo(w * 0.07, 0);
    c.stroke();

    // Rope from bow
    c.strokeStyle = 'rgba(120,90,50,0.6)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-w * 0.07, 0);
    c.quadraticCurveTo(-w * 0.11, h * 0.01, -w * 0.14, h * 0.005);
    c.stroke();

    c.restore();
  },

  // ─── Clouds ───────────────────────────────────────────────────────────────────
  _drawClouds(c, w, h, t) {
    const clouds = [
      { x: 0.15, y: 0.08, s: 1.0, speed: 0.00008 },
      { x: 0.55, y: 0.05, s: 1.3, speed: 0.00006 },
      { x: 0.82, y: 0.12, s: 0.8, speed: 0.00009 },
    ];

    clouds.forEach(cl => {
      const cx = (cl.x * w + t * cl.speed * w) % (w * 1.3) - w * 0.15;
      const cy = cl.y * h;
      const s  = cl.s * w * 0.12;

      // Dark rain cloud base
      const cg = c.createRadialGradient(cx, cy, 0, cx, cy, s);
      cg.addColorStop(0, 'rgba(40,50,70,0.85)');
      cg.addColorStop(0.6, 'rgba(30,40,60,0.7)');
      cg.addColorStop(1, 'rgba(20,30,50,0)');
      c.fillStyle = cg;
      c.beginPath(); c.ellipse(cx, cy, s, s * 0.55, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx - s * 0.35, cy + s * 0.1, s * 0.65, s * 0.45, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + s * 0.4,  cy + s * 0.1, s * 0.55, s * 0.40, 0, 0, Math.PI * 2); c.fill();

      // Teal/cyan cloud highlight (matches ref color palette)
      c.fillStyle = 'rgba(60,160,180,0.15)';
      c.beginPath(); c.ellipse(cx, cy - s * 0.1, s * 0.7, s * 0.35, 0, 0, Math.PI * 2); c.fill();
    });
  },

  // ─── Chime: warm steel drum tone ─────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const cv = AudioEngine.getChimeVolume ? AudioEngine.getChimeVolume() : 1.0;

    // Steel drum feel: warm pentatonic notes
    const notes = [261.6, 329.6, 392, 440, 523.2, 392, 329.6];
    const f = notes[Math.floor(Math.random() * notes.length)];

    // Main tone — sawtooth softened
    const o = actx.createOscillator();
    const g = actx.createGain();
    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    o.type = 'sawtooth';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.07 * cv, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.2);
    o.connect(filter); filter.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + 1.2);

    // Harmonic overtone
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2.76; // steel drum overtone ratio
    g2.gain.setValueAtTime(0.025 * cv, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.6);
    o2.connect(g2); g2.connect(actx.destination);
    o2.start(); o2.stop(actx.currentTime + 0.6);
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._waveOffset = 0;
    this._rainRipples = [];
    this._lastRipple = 0;
    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch) => {
        // Sky — teal/turquoise storm sky from ref image
        const sky = c.createLinearGradient(0, 0, 0, ch * 0.6);
        sky.addColorStop(0,   '#1a4a5a');
        sky.addColorStop(0.3, '#1e6070');
        sky.addColorStop(0.6, '#258090');
        sky.addColorStop(1,   '#30a0a8');
        c.fillStyle = sky;
        c.fillRect(0, 0, cw, ch * 0.6);

        // Horizon glow — warm orange bleed from sunset behind clouds
        const hGlow = c.createLinearGradient(0, ch * 0.45, 0, ch * 0.62);
        hGlow.addColorStop(0, 'rgba(255,140,40,0)');
        hGlow.addColorStop(0.5, 'rgba(255,120,30,0.35)');
        hGlow.addColorStop(1, 'rgba(255,100,20,0.55)');
        c.fillStyle = hGlow;
        c.fillRect(0, ch * 0.45, cw, ch * 0.17);
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawClouds(c, cw, ch, now);
        self._drawWaves(c, cw, ch, now);
        self._drawSand(c, cw, ch);
        self._drawHut(c, cw, ch);
        self._drawBoat(c, cw, ch, now);
        self._updateRipples(now);
        self._drawRipples(c, cw, ch, now);
        self._drawPalm(c, cw, ch, now);
      },

      onResize: () => {
        self._rainRipples = [];
      },

      onSceneReset: () => {
        self._rainRipples = [];
      },

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
