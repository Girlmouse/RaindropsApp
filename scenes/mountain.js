/**
 * scenes/mountain.js
 * Raindrops — Mountain Scene
 *
 * One audio track: rain
 * Background: mountain ranges, lake, campfire with cabin, dense forest, moon
 * Chime: singing bowl / bell (sine with metallic overtone)
 */

SceneManager.register('mountain', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain', src: 'audio/rain.mp3', volume: 1.0 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         20,
    GLOW_MIN_GAP:     1000,
    GLOW_MAX_GAP:     2000,
    HIT_R:            45,
    DENSE:            16,
    DROP_SPEED_MIN:   14.0,
    DROP_SPEED_RANGE: 10.0,
    RAIN_COLOR:       [140, 150, 170],
    GLOW_COLOR:       [160, 185, 240],
    RIPPLE_COLOR:     [180, 195, 220],
    FX_COLORS:        ['rgba(200,210,240,', 'rgba(170,185,220,'],
    PROGRESS_COLOR:   [160, 180, 220],
    MENU_COLOR:       [25, 30, 55],
    MENU_TEXT_COLOR:  [200, 215, 245],
    ENDING_BG:        [[20, 24, 40], [28, 31, 46]],
    ENDING_PARTICLES: ['#93c5fd','#60a5fa','#bfdbfe','#e0f2fe','#c7d2fe','#a5b4fc','#ddd6fe'],
    QUOTE_BG:         ['#141828', '#111525', '#0e1220'],
    QUOTE_PILL:       'rgba(15,20,40,0.78)',
    QUOTE_BORDER:     'rgba(160,180,230,0.3)',
    QUOTE_TEXT:       'rgba(220,228,248,0.95)',
    QUOTES: [
      'breathe',
      'May your worries be as short lived as a fart on a windy day. — BH',
      'feel', 'listen', 'notice', 'pause', 'reflect', 'release',
    ],
  },

  // ─── Internal state ───────────────────────────────────────────────────────────
  _mountains: null,
  _forestData: null,
  _bushData: null,
  _rocksData: null,
  _shadowsData: null,
  _campfireFlicker: 0,
  _sparks: [],
  _canvas: null,

  // ─── Mountain builder ─────────────────────────────────────────────────────────
  _buildMountains(w, h) {
    const layers = [];
    const far = []; let fx = 0;
    while (fx < w + 60) {
      const pw = 60 + Math.random() * 100, ph = h * 0.15 + Math.random() * h * 0.15;
      far.push({ x: fx, w: pw, h: ph }); fx += pw * 0.6;
    }
    layers.push({ peaks: far, color: 'rgba(45,50,70,0.6)', y: h * 0.45 });

    const mid = []; let mx = 0;
    while (mx < w + 80) {
      const pw = 80 + Math.random() * 120, ph = h * 0.2 + Math.random() * h * 0.2;
      mid.push({ x: mx, w: pw, h: ph }); mx += pw * 0.55;
    }
    layers.push({ peaks: mid, color: 'rgba(30,35,50,0.8)', y: h * 0.52 });

    const near = []; let nx = -30;
    while (nx < w + 100) {
      const pw = 100 + Math.random() * 140, ph = h * 0.3 + Math.random() * h * 0.25;
      near.push({ x: nx, w: pw, h: ph }); nx += pw * 0.5;
    }
    layers.push({ peaks: near, color: 'rgba(18,20,30,0.92)', y: h * 0.58 });
    return layers;
  },

  _drawMountains(c, w, h) {
    if (!this._mountains) this._mountains = this._buildMountains(w, h);
    this._mountains.forEach(layer => {
      layer.peaks.forEach(pk => {
        c.fillStyle = layer.color;
        c.beginPath();
        c.moveTo(pk.x, layer.y);
        c.lineTo(pk.x + pk.w * 0.4, layer.y - pk.h * 0.7);
        c.lineTo(pk.x + pk.w * 0.5, layer.y - pk.h);
        c.lineTo(pk.x + pk.w * 0.65, layer.y - pk.h * 0.6);
        c.lineTo(pk.x + pk.w, layer.y);
        c.closePath(); c.fill();
        if (pk.h > h * 0.25) {
          c.fillStyle = 'rgba(180,190,210,0.15)';
          c.beginPath();
          c.moveTo(pk.x + pk.w * 0.42, layer.y - pk.h * 0.8);
          c.lineTo(pk.x + pk.w * 0.5, layer.y - pk.h);
          c.lineTo(pk.x + pk.w * 0.58, layer.y - pk.h * 0.82);
          c.closePath(); c.fill();
        }
      });
    });
  },

  _drawMoon(c, w, h) {
    const mx = w * 0.12, my = h * 0.10, mr = 22;
    const glow = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
    glow.addColorStop(0, 'rgba(220,225,235,0.15)');
    glow.addColorStop(0.5, 'rgba(200,210,225,0.05)');
    glow.addColorStop(1, 'rgba(180,190,210,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(mx, my, mr * 3, 0, Math.PI * 2); c.fill();
    const moonGrad = c.createRadialGradient(mx - 3, my - 3, 0, mx, my, mr);
    moonGrad.addColorStop(0, 'rgba(245,245,250,0.95)');
    moonGrad.addColorStop(0.7, 'rgba(220,225,235,0.9)');
    moonGrad.addColorStop(1, 'rgba(200,205,220,0.85)');
    c.fillStyle = moonGrad; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(180,185,200,0.2)';
    c.beginPath(); c.arc(mx - 5, my - 3, 3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(mx + 6, my + 5, 3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(mx + 2, my - 6, 2, 0, Math.PI * 2); c.fill();
  },

  _buildForest(w, h) {
    const trees = [];
    for (let i = 0; i < 50; i++) trees.push({
      x: Math.random() * w, baseY: h * 0.50 + Math.random() * h * 0.18,
      height: 35 + Math.random() * 55, width: 18 + Math.random() * 22,
      layers: 3 + Math.floor(Math.random() * 2), darkness: 0.85 + Math.random() * 0.15,
    });
    for (let i = 0; i < 30; i++) trees.push({
      x: Math.random() * w, baseY: h * 0.52 + Math.random() * h * 0.15,
      height: 25 + Math.random() * 45, width: 14 + Math.random() * 18,
      layers: 2 + Math.floor(Math.random() * 2), darkness: 0.80 + Math.random() * 0.2,
    });
    trees.sort((a, b) => a.baseY - b.baseY);
    return trees;
  },

  _drawForest(c, w, h) {
    if (!this._forestData) this._forestData = this._buildForest(w, h);
    this._forestData.forEach(tree => {
      c.fillStyle = `rgba(8,6,5,${tree.darkness})`;
      c.fillRect(tree.x - 2, tree.baseY - tree.h * 0.3, 4, tree.h * 0.3);
      for (let l = 0; l < tree.layers; l++) {
        const layerY = tree.baseY - tree.height * 0.2 - l * (tree.height * 0.25);
        const layerW = tree.width * (1 - l * 0.2);
        const layerH = tree.height * 0.35;
        const gv = 12 + l * 2;
        c.fillStyle = `rgba(${4 + l},${gv},${6 + l},${tree.darkness})`;
        c.beginPath();
        c.moveTo(tree.x, layerY - layerH);
        c.lineTo(tree.x - layerW / 2, layerY);
        c.lineTo(tree.x + layerW / 2, layerY);
        c.closePath(); c.fill();
      }
      c.fillStyle = `rgba(3,10,5,${tree.darkness})`;
      c.beginPath();
      c.moveTo(tree.x, tree.baseY - tree.height);
      c.lineTo(tree.x - tree.width * 0.15, tree.baseY - tree.height * 0.75);
      c.lineTo(tree.x + tree.width * 0.15, tree.baseY - tree.height * 0.75);
      c.closePath(); c.fill();
    });
  },

  _buildBushes(w, h) {
    const bushes = [];
    for (let i = 0; i < 8; i++) bushes.push({ x: w * 0.01 + Math.random() * w * 0.06, y: h * 0.75 + Math.random() * h * 0.12, size: 8 + Math.random() * 12, layers: 2 + Math.floor(Math.random() * 2) });
    for (let i = 0; i < 8; i++) bushes.push({ x: w * 0.88 + Math.random() * w * 0.10, y: h * 0.74 + Math.random() * h * 0.10, size: 7 + Math.random() * 10, layers: 2 + Math.floor(Math.random() * 2) });
    for (let i = 0; i < 10; i++) bushes.push({ x: Math.random() * w * 0.12, y: h * 0.88 + Math.random() * h * 0.12, size: 10 + Math.random() * 14, layers: 2 + Math.floor(Math.random() * 2) });
    for (let i = 0; i < 10; i++) bushes.push({ x: w * 0.88 + Math.random() * w * 0.12, y: h * 0.88 + Math.random() * h * 0.12, size: 10 + Math.random() * 14, layers: 2 + Math.floor(Math.random() * 2) });
    return bushes;
  },

  _buildRocks(w, h) {
    const rocks = [];
    for (let i = 0; i < 45; i++) {
      const size = 8 + Math.random() * 20;
      rocks.push({ x: Math.random() * w, y: h * 0.50 + Math.random() * h * 0.18, w: size, h: size * (0.4 + Math.random() * 0.25), points: 5 + Math.floor(Math.random() * 4), color: { r: 18 + Math.floor(Math.random() * 12), g: 16 + Math.floor(Math.random() * 10), b: 14 + Math.floor(Math.random() * 8) }, angleOffsets: Array.from({ length: 9 }, () => (Math.random() - 0.5) * 0.4) });
    }
    for (let i = 0; i < 15; i++) {
      const size = 18 + Math.random() * 30;
      rocks.push({ x: Math.random() * w, y: h * 0.52 + Math.random() * h * 0.15, w: size, h: size * (0.4 + Math.random() * 0.2), points: 6 + Math.floor(Math.random() * 3), color: { r: 22 + Math.floor(Math.random() * 10), g: 18 + Math.floor(Math.random() * 8), b: 15 + Math.floor(Math.random() * 6) }, angleOffsets: Array.from({ length: 9 }, () => (Math.random() - 0.5) * 0.5) });
    }
    rocks.sort((a, b) => a.y - b.y);
    return rocks;
  },

  _buildShadows(w, h) {
    const shadows = [];
    const dirtY = h * 0.48, dirtH = h * 0.22;
    for (let i = 0; i < 25; i++) shadows.push({ x: Math.random() * w, y: dirtY + Math.random() * dirtH, w: 30 + Math.random() * 60, h: 10 + Math.random() * 20, alpha: 0.3 + Math.random() * 0.3, rotation: Math.random() * 0.5 });
    for (let i = 0; i < 30; i++) shadows.push({ x: Math.random() * w, y: dirtY + Math.random() * dirtH, w: 3 + Math.random() * 8, h: (3 + Math.random() * 8) * 0.6, alpha: 0.5, rotation: Math.random() * Math.PI, isTexture: true, color: { r: 20 + Math.floor(Math.random() * 15), g: 16 + Math.floor(Math.random() * 12), b: 12 + Math.floor(Math.random() * 10) } });
    return shadows;
  },

  _drawLake(c, w, h, t) {
    const groundY = h * 0.68;
    c.fillStyle = 'rgba(18,18,18,1)'; c.fillRect(0, groundY, w, h - groundY);

    const lakeCX = w * 0.5, lakeCY = h * 0.85, lakeRX = w * 0.42, lakeRY = h * 0.18;
    const lakeGrad = c.createLinearGradient(0, h * 0.73, 0, h);
    lakeGrad.addColorStop(0, 'rgba(4,12,18,0.97)'); lakeGrad.addColorStop(1, 'rgba(2,8,12,1)');
    c.fillStyle = lakeGrad;
    c.beginPath(); c.ellipse(lakeCX, lakeCY, lakeRX, lakeRY, 0, 0, Math.PI * 2); c.fill();

    // Moon reflection — wavy shimmer strips
    const mrX = w * 0.30, mrY = lakeCY - lakeRY * 0.3;
    const ts = t * 0.001;
    c.save();
    for (let i = 0; i < 9; i++) {
      const stripY = mrY - 28 + i * 7;
      const baseW = 28 - Math.abs(i - 4) * 5;
      const stripW = Math.max(baseW * (0.7 + Math.sin(ts * 1.8 + i * 1.1) * 0.3), 3);
      const stripX = mrX + Math.sin(ts * 1.2 + i * 0.9) * 12; // bigger wobble
      const alpha = (0.4 - Math.abs(i - 4) * 0.04) * (0.6 + Math.sin(ts * 1.8 + i * 1.3) * 0.4);
      c.fillStyle = `rgba(220,230,245,${Math.max(alpha, 0)})`;
      c.beginPath(); c.ellipse(stripX, stripY, stripW, 3, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();

    // Bushes
    if (!this._bushData) this._bushData = this._buildBushes(w, h);
    this._bushData.forEach(bush => {
      for (let l = 0; l < bush.layers; l++) {
        const ox = (l - bush.layers / 2) * bush.size * 0.4;
        c.fillStyle = `rgba(3,8,5,${0.98 - l * 0.05})`;
        c.beginPath(); c.arc(bush.x + ox, bush.y + l * 2, bush.size - l * 2, 0, Math.PI * 2); c.fill();
      }
    });
  },

  _drawCampfire(c, w, h, t) {
    const cx = w * 0.50, cy = h * 0.58;
    this._campfireFlicker += 0.15;
    const flicker = Math.sin(this._campfireFlicker) * 0.3 + Math.sin(this._campfireFlicker * 1.7) * 0.2;

    // Ground glow
    const gg = c.createRadialGradient(cx, cy, 0, cx, cy, 50);
    gg.addColorStop(0, 'rgba(255,150,50,0.15)'); gg.addColorStop(1, 'rgba(255,80,20,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(cx, cy, 50, 0, Math.PI * 2); c.fill();

    // Cabin
    const cabX = cx + 30, cabY = cy + 5, cabW = 45, cabH = 32;
    c.fillStyle = 'rgba(8,8,8,0.98)'; c.fillRect(cabX, cabY - cabH, cabW, cabH);
    c.fillStyle = 'rgba(5,5,5,0.98)';
    c.beginPath(); c.moveTo(cabX - 6, cabY - cabH); c.lineTo(cabX + cabW / 2, cabY - cabH - 20); c.lineTo(cabX + cabW + 6, cabY - cabH); c.closePath(); c.fill();
    c.fillStyle = 'rgba(6,6,6,0.98)'; c.fillRect(cabX + cabW - 12, cabY - cabH - 15, 6, 12);
    c.fillStyle = 'rgba(12,10,10,0.95)'; c.fillRect(cabX + 8, cabY - 18, 10, 18);
    c.fillStyle = 'rgba(255,180,80,0.5)'; c.fillRect(cabX + 22, cabY - cabH + 8, 10, 8);
    c.strokeStyle = 'rgba(3,3,3,0.9)'; c.lineWidth = 1; c.strokeRect(cabX + 22, cabY - cabH + 8, 10, 8);

    // Fire stones & logs
    c.fillStyle = 'rgba(30,28,26,0.9)';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      c.beginPath(); c.ellipse(cx + Math.cos(a) * 10, cy + 3 + Math.sin(a) * 4, 3, 2.5, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(35,28,22,0.9)';
    c.save(); c.translate(cx, cy + 2); c.rotate(-0.3); c.fillRect(-10, -2, 20, 4); c.rotate(0.6); c.fillRect(-10, -2, 20, 4); c.restore();

    // Flames
    [{ ox: 0, h: 10 + flicker * 4, w: 3, color: 'rgba(255,200,80,' },
     { ox: -2, h: 7 + flicker * 3, w: 2, color: 'rgba(255,150,50,' },
     { ox: 2, h: 8 + flicker * 3, w: 2.5, color: 'rgba(255,120,30,' }].forEach((f, i) => {
      const wob = Math.sin(this._campfireFlicker + i) * 1.5;
      c.fillStyle = f.color + '0.7)';
      c.beginPath();
      c.moveTo(cx + f.ox - f.w + wob, cy);
      c.quadraticCurveTo(cx + f.ox + wob * 0.5, cy - f.h * 0.5, cx + f.ox + wob, cy - f.h);
      c.quadraticCurveTo(cx + f.ox + wob * 0.5, cy - f.h * 0.5, cx + f.ox + f.w + wob, cy);
      c.closePath(); c.fill();
    });

    // Sparks
    if (Math.random() > 0.985) this._sparks.push({ x: cx + (Math.random() - 0.5) * 6, y: cy - 10 - Math.random() * 5, vx: (Math.random() - 0.5) * 0.3, vy: -0.3 - Math.random() * 0.3 });
    for (let i = this._sparks.length - 1; i >= 0; i--) {
      const s = this._sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.008;
      const age = (cy - 10 - s.y) / 30;
      if (age > 1 || s.y > cy) { this._sparks.splice(i, 1); continue; }
      c.fillStyle = `rgba(255,180,80,${0.6 - age * 0.6})`;
      c.beginPath(); c.arc(s.x, s.y, 1, 0, Math.PI * 2); c.fill();
    }
  },

  _drawMist(c, w, h, t) {
    for (let i = 0; i < 4; i++) {
      const ds = 0.0001 + i * 0.00005;
      const fx = Math.sin(t * ds + i * 2) * 60 + Math.cos(t * ds * 0.7 + i) * 30;
      const fy = h * 0.10 + i * 12;
      c.save(); c.globalAlpha = 0.06 - i * 0.01; c.fillStyle = 'rgba(180,190,205,0.5)';
      c.beginPath(); c.ellipse(w * 0.3 + fx, fy, w * 0.2, 8 + i * 3, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(w * 0.6 - fx * 0.6, fy + 5, w * 0.15, 6 + i * 2, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  },

  // ─── Chime: singing bowl ──────────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const notes = [523.2, 659.2, 784, 1046.5, 1318.5];
    const f = notes[Math.floor(Math.random() * notes.length)];
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.09, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.8);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 1.8);
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2.76;
    g2.gain.setValueAtTime(0.02, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.6);
    o2.connect(g2); g2.connect(actx.destination); o2.start(); o2.stop(actx.currentTime + 0.6);
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._mountains = null; this._forestData = null; this._bushData = null;
    this._rocksData = null; this._shadowsData = null;
    this._campfireFlicker = 0; this._sparks = [];
    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch) => {
        const bg = c.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, '#1a2035'); bg.addColorStop(0.3, '#1e2438');
        bg.addColorStop(0.6, '#252a42'); bg.addColorStop(1, '#2a2e48');
        c.fillStyle = bg; c.fillRect(0, 0, cw, ch);
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawMoon(c, cw, ch);

        // Stars
        [[0.08,0.05,1.5,0.7],[0.45,0.03,1.0,0.7],[0.72,0.07,1.5,0.7],
         [0.88,0.04,1.0,0.7],[0.35,0.09,1.2,0.7]].forEach(([rx,ry,r,a]) => {
          c.fillStyle = `rgba(220,225,235,${a})`;
          c.beginPath(); c.arc(rx * cw, ry * ch, r, 0, Math.PI * 2); c.fill();
        });

        self._drawMountains(c, cw, ch);

        // Dirt area
        const dirtY = ch * 0.48, dirtH = ch * 0.22;
        const dg = c.createLinearGradient(0, dirtY, 0, dirtY + dirtH);
        dg.addColorStop(0, 'rgba(25,20,15,1)'); dg.addColorStop(1, 'rgba(18,15,12,1)');
        c.fillStyle = dg; c.fillRect(0, dirtY, cw, dirtH);

        // Shadows
        if (!self._shadowsData) self._shadowsData = self._buildShadows(cw, ch);
        self._shadowsData.forEach(s => {
          c.fillStyle = s.isTexture ? `rgba(${s.color.r},${s.color.g},${s.color.b},${s.alpha})` : `rgba(8,6,5,${s.alpha})`;
          c.beginPath(); c.ellipse(s.x, s.y, s.w, s.h, s.rotation, 0, Math.PI * 2); c.fill();
        });

        // Rocks
        if (!self._rocksData) self._rocksData = self._buildRocks(cw, ch);
        self._rocksData.forEach(rock => {
          c.fillStyle = `rgba(${rock.color.r},${rock.color.g},${rock.color.b},0.95)`;
          c.beginPath();
          for (let i = 0; i < rock.points; i++) {
            const angle = (i / rock.points) * Math.PI * 2 + rock.angleOffsets[i];
            const rx = rock.x + Math.cos(angle) * rock.w / 2 * (0.7 + rock.angleOffsets[i] * 0.5);
            const ry = rock.y + Math.sin(angle) * rock.h / 2 * (0.7 + rock.angleOffsets[(i + 1) % rock.points] * 0.5);
            if (i === 0) c.moveTo(rx, ry); else c.lineTo(rx, ry);
          }
          c.closePath(); c.fill();
        });

        self._drawForest(c, cw, ch);
        self._drawMist(c, cw, ch, now);
        self._drawLake(c, cw, ch, now);
        self._drawCampfire(c, cw, ch, now);
      },

      onResize: () => {
        self._mountains = null; self._forestData = null; self._bushData = null;
        self._rocksData = null; self._shadowsData = null;
      },
      onSceneReset: () => {
        self._mountains = null; self._forestData = null; self._bushData = null;
        self._rocksData = null; self._shadowsData = null; self._sparks = [];
      },

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
    this._sparks = [];
  },

});
