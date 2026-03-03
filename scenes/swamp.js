/**
 * scenes/swamp.js
 * Raindrops — Swamp Scene
 *
 * Two audio tracks: rain + frogs
 * Background: dark swamp water, cypress trees, alligators, fireflies, fog
 * Chime: ethereal bells with harmonics
 */

SceneManager.register('swamp', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain',  src: 'audio/rain.mp3',  volume: 0.9 },
    { id: 'frogs', src: 'audio/frogs.mp3', volume: 0.55 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         25,
    GLOW_MIN_GAP:     1000,
    GLOW_MAX_GAP:     2000,
    HIT_R:            45,
    DENSE:            14,
    DROP_SPEED_MIN:   12.0,
    DROP_SPEED_RANGE: 8.0,
    RAIN_COLOR:       [120, 160, 100],
    GLOW_COLOR:       [140, 255, 60],
    RIPPLE_COLOR:     [70, 180, 50],
    FX_COLORS:        ['rgba(140,255,80,', 'rgba(100,240,50,'],
    PROGRESS_COLOR:   [100, 220, 80],
    MENU_COLOR:       [10, 25, 10],
    MENU_TEXT_COLOR:  [130, 210, 100],
    ENDING_BG:        [[20, 28, 20], [15, 22, 15]],
    ENDING_PARTICLES: ['#5cff4a','#3deb35','#7fff5c','#28d41e','#a8ff3c','#8cff20','#60e810','#c8ff70'],
    QUOTE_BG:         ['#0a0d14', '#101520', '#0f1a12'],
    QUOTE_PILL:       'rgba(8,22,8,0.80)',
    QUOTE_BORDER:     'rgba(80,200,60,0.3)',
    QUOTE_TEXT:       'rgba(195,225,185,0.95)',
    QUOTES: [
      'breathe', 'feel', 'listen', 'notice', 'pause', 'reflect', 'release',
      'May your worries be as short lived as a fart on a windy day. — BH',
    ],
  },

  // ─── Internal state ───────────────────────────────────────────────────────────
  _waveOffset: 0,
  _stars: null,
  _grassTufts: null,
  _canvas: null,

  _initStatics() {
    this._stars = [];
    for (let i = 0; i < 12; i++) {
      this._stars.push({ x: Math.random(), y: Math.random() * 0.45, size: 0.8 + Math.random() * 0.8, brightness: 0.3 + Math.random() * 0.35 });
    }
    this._grassTufts = [];
    for (let i = 0; i < 22; i++) {
      this._grassTufts.push({ x: Math.random(), y: 0.62 + Math.random() * 0.35, blades: 4 + Math.floor(Math.random() * 5), height: 15 + Math.random() * 25, phase: Math.random() * Math.PI * 2 });
    }
  },

  // ─── Swamp drawing helpers ────────────────────────────────────────────────────

  _drawTreeSilhouette(c, x, baseY, height, detail) {
    c.beginPath(); c.moveTo(x - 4, baseY); c.lineTo(x - 3, baseY - height * 0.3);
    const segments = Math.floor(5 * detail);
    for (let i = 0; i <= segments; i++) {
      const py = baseY - height * 0.3 - (height * 0.7) * (i / segments);
      const spread = (15 + height * 0.1) * (1 - i / segments * 0.7);
      c.lineTo(x - spread + Math.sin(i * 1.5) * 5, py);
    }
    c.lineTo(x, baseY - height);
    for (let i = segments; i >= 0; i--) {
      const py = baseY - height * 0.3 - (height * 0.7) * (i / segments);
      const spread = (15 + height * 0.1) * (1 - i / segments * 0.7);
      c.lineTo(x + spread + Math.sin(i * 1.8) * 5, py);
    }
    c.lineTo(x + 3, baseY - height * 0.3); c.lineTo(x + 4, baseY); c.closePath(); c.fill();
  },

  _drawSwamp(c, w, h, t) {
    const waterLine = h * 0.60;
    const fgTrees = [
      {x:-0.02,height:195,trunk:9},{x:0.06,height:165,trunk:7},{x:0.14,height:210,trunk:9},
      {x:0.22,height:145,trunk:6},{x:0.30,height:180,trunk:8},{x:0.38,height:155,trunk:6},
      {x:0.46,height:200,trunk:9},{x:0.54,height:140,trunk:5},{x:0.62,height:185,trunk:8},
      {x:0.70,height:160,trunk:7},{x:0.78,height:175,trunk:7},{x:0.86,height:150,trunk:6},
      {x:0.94,height:190,trunk:8},{x:1.02,height:170,trunk:7},
    ];
    const bushes = [
      {x:0.05,y:0.58,width:45,height:30},{x:0.22,y:0.56,width:55,height:38},
      {x:0.42,y:0.57,width:40,height:28},{x:0.68,y:0.55,width:60,height:40},
      {x:0.92,y:0.57,width:50,height:35},
    ];
    const alligators = [{x:0.25,baseY:0.72,phase:0,eyePhase:0},{x:0.72,baseY:0.80,phase:2,eyePhase:1.5}];
    const logs = [
      {x:0.18,y:0.69,length:55,angle:-0.12,broken:true},
      {x:0.52,y:0.84,length:75,angle:0.08,broken:false},
      {x:0.82,y:0.72,length:40,angle:-0.25,broken:true},
    ];
    const scumPatches = [{x:0.12,y:0.66,size:18},{x:0.38,y:0.76,size:14},{x:0.56,y:0.69,size:22},{x:0.75,y:0.86,size:16},{x:0.90,y:0.73,size:12}];

    // Distant treeline
    ['rgba(35,60,30,0.25)','rgba(28,52,24,0.35)','rgba(22,45,18,0.45)','rgba(18,38,14,0.55)'].forEach((col, li) => {
      c.fillStyle = col;
      const counts = [15, 12, 8, 6];
      for (let i = 0; i < counts[li]; i++) {
        this._drawTreeSilhouette(c, w * (i / counts[li]) + Math.sin(i * 1.7 + li) * 20, waterLine, 70 + li * 15 + Math.sin(i * 2.1) * 30, 0.25 + li * 0.15);
      }
    });

    // Bushes
    bushes.forEach((bush, idx) => {
      const bx = bush.x * w, by = bush.y * h;
      for (let layer = 0; layer < 3; layer++) {
        c.fillStyle = `rgba(${25 - layer * 6},${50 - layer * 5},${20 - layer * 6},${0.5 - layer * 0.12})`;
        for (let i = 0; i < 5; i++) {
          c.beginPath(); c.ellipse(bx + (i - 2) * bush.width * 0.2 + Math.sin(i * 2 + idx) * 5, by + Math.sin(i * 1.5) * bush.height * 0.15 - layer * 5, bush.width * 0.35 + Math.sin(i) * 5, bush.height * 0.4 + Math.cos(i) * 4, 0, 0, Math.PI * 2); c.fill();
        }
      }
    });

    // Foreground trees
    fgTrees.forEach((tree, idx) => {
      const tx = tree.x * w, baseY = waterLine + 15;
      c.fillStyle = 'rgba(12,25,10,0.92)';
      c.beginPath(); c.moveTo(tx - tree.trunk, baseY);
      c.lineTo(tx - tree.trunk * 0.7, baseY - tree.height * 0.35);
      c.lineTo(tx - tree.trunk * 0.3, baseY - tree.height);
      c.lineTo(tx + tree.trunk * 0.3, baseY - tree.height);
      c.lineTo(tx + tree.trunk * 0.7, baseY - tree.height * 0.35);
      c.lineTo(tx + tree.trunk, baseY); c.closePath(); c.fill();
      // Bark lines
      c.strokeStyle = 'rgba(8,18,6,0.6)'; c.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const by2 = baseY - tree.height * 0.15 - i * tree.height * 0.14; c.beginPath(); c.moveTo(tx - tree.trunk * 0.6, by2); c.lineTo(tx + tree.trunk * 0.4, by2 - 8); c.stroke(); }
      // Branches
      c.strokeStyle = 'rgba(14,30,12,0.85)'; c.lineCap = 'round';
      c.lineWidth = 3; c.beginPath(); c.moveTo(tx - tree.trunk * 0.4, baseY - tree.height * 0.4); c.quadraticCurveTo(tx - 25, baseY - tree.height * 0.4 - 15, tx - 40, baseY - tree.height * 0.4 + 5); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(tx + tree.trunk * 0.4, baseY - tree.height * 0.55); c.quadraticCurveTo(tx + 20, baseY - tree.height * 0.55 - 20, tx + 38, baseY - tree.height * 0.55 - 10); c.stroke();
    });

    // Water
    const waterGrad = c.createLinearGradient(0, waterLine, 0, h);
    waterGrad.addColorStop(0, 'rgba(35,72,28,0.88)'); waterGrad.addColorStop(0.35, 'rgba(16,42,12,0.96)'); waterGrad.addColorStop(1, 'rgba(12,32,9,1)');
    c.fillStyle = waterGrad; c.fillRect(0, waterLine, w, h - waterLine);
    const sheen = c.createLinearGradient(0, waterLine - 5, 0, waterLine + 15);
    sheen.addColorStop(0, 'rgba(50,120,40,0)'); sheen.addColorStop(0.5, 'rgba(75,160,55,0.22)'); sheen.addColorStop(1, 'rgba(50,120,40,0)');
    c.fillStyle = sheen; c.fillRect(0, waterLine - 5, w, 20);

    // Waves
    this._waveOffset += 0.012;
    for (let layer = 0; layer < 4; layer++) {
      const wY = waterLine + 4 + layer * 18, amp = 1.5 + layer * 1.2, freq = 0.012 - layer * 0.002, spd = this._waveOffset * (1.0 - layer * 0.12);
      c.strokeStyle = `rgba(60,130,50,${0.08 - layer * 0.015})`; c.lineWidth = 1;
      c.beginPath();
      for (let x = 0; x < w; x += 2) { const y = wY + Math.sin(x * freq + spd) * amp + Math.sin(x * freq * 2.1 + spd * 1.3) * amp * 0.3; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }

    // Grass (back)
    this._drawGrass(c, w, h, t, false);

    // Logs
    logs.forEach(log => {
      const lx = log.x * w, ly = log.y * h + Math.sin(t * 0.001 + log.x * 5) * 2;
      c.save(); c.translate(lx, ly); c.rotate(log.angle);
      const lg = c.createLinearGradient(0, -8, 0, 8); lg.addColorStop(0, 'rgba(45,35,25,0.95)'); lg.addColorStop(1, 'rgba(30,22,15,0.95)');
      c.fillStyle = lg; c.beginPath(); c.ellipse(0, 0, log.length / 2, 7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(50,80,40,0.5)';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-log.length / 4 + i * log.length / 4, -4, 8 + i * 3, 3, 0.2, 0, Math.PI * 2); c.fill(); }
      c.restore();
    });

    // Alligators
    alligators.forEach(gator => {
      const gx = gator.x * w, gy = gator.baseY * h + Math.sin(t * 0.0008 + gator.phase) * 3;
      c.fillStyle = 'rgba(30,50,25,0.9)'; c.beginPath(); c.ellipse(gx, gy + 2, 25, 5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(35,55,30,0.9)'; c.beginPath(); c.ellipse(gx + 8, gy - 1, 6, 4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(gx + 18, gy - 1, 6, 4, 0, 0, Math.PI * 2); c.fill();
      const ep = 0.7 + Math.sin(t * 0.003 + gator.eyePhase) * 0.3;
      [gx + 8, gx + 18].forEach(ex => {
        const eg = c.createRadialGradient(ex, gy - 2, 0, ex, gy - 2, 15);
        eg.addColorStop(0, `rgba(140,255,60,${0.5 * ep})`); eg.addColorStop(1, 'rgba(70,180,30,0)');
        c.fillStyle = eg; c.beginPath(); c.arc(ex, gy - 2, 15, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(170,255,80,${0.95 * ep})`; c.beginPath(); c.ellipse(ex, gy - 2, 2.5, 3.5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(220,255,140,${ep})`; c.beginPath(); c.ellipse(ex, gy - 2, 1, 2.8, 0, 0, Math.PI * 2); c.fill();
      });
    });

    // Grass (front)
    this._drawGrass(c, w, h, t, true);

    // Scum patches
    scumPatches.forEach((patch, i) => {
      const px = patch.x * w + Math.sin(t * 0.001 + i) * 5, py = patch.y * h + Math.sin(t * 0.0015 + i * 2) * 3;
      c.fillStyle = 'rgba(35,75,25,0.45)'; c.beginPath(); c.ellipse(px, py, patch.size, patch.size * 0.4, Math.sin(i) * 0.3, 0, Math.PI * 2); c.fill();
    });

    // Fog layers
    for (let i = 0; i < 3; i++) {
      const fogY = h * 0.50 + i * h * 0.14, fogOffset = Math.sin(t * 0.0003 + i) * 40;
      const fg = c.createLinearGradient(0, fogY - 25, 0, fogY + 35);
      fg.addColorStop(0, 'rgba(50,100,40,0)'); fg.addColorStop(0.5, `rgba(55,110,45,${0.12 - i * 0.03})`); fg.addColorStop(1, 'rgba(50,100,40,0)');
      c.fillStyle = fg; c.fillRect(fogOffset - 60, fogY - 25, w + 120, 60);
    }
  },

  _drawGrass(c, w, h, t, front) {
    if (!this._grassTufts) return;
    this._grassTufts.forEach((tuft, idx) => {
      if ((idx % 2 === 0) !== front) return;
      const gx = tuft.x * w, gy = tuft.y * h, sway = Math.sin(t * 0.002 + tuft.phase) * 3;
      for (let b = 0; b < tuft.blades; b++) {
        const bx = gx + (b - tuft.blades / 2) * 4;
        const bh = tuft.height * (0.7 + Math.sin(b * 1.5) * 0.3);
        const ba = (b - tuft.blades / 2) * 0.15 + sway * 0.02;
        c.strokeStyle = `rgba(35,85,28,${front ? 0.85 : 0.5})`; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(bx, gy); c.quadraticCurveTo(bx + ba * 10 + sway, gy - bh * 0.6, bx + ba * 20 + sway * 1.5, gy - bh); c.stroke();
      }
    });
  },

  // ─── Chime: ethereal bells ────────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const notes = [523.2, 659.2, 784, 880, 1046.5, 1174.6, 1318.5, 1568];
    const f = notes[Math.floor(Math.random() * notes.length)];
    [[f, 0.06, 2.5], [f * 2.01, 0.035, 1.8], [f * 3.01, 0.018, 1.2], [f * 1.002, 0.04, 2.2]].forEach(([freq, vol, dur], i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, actx.currentTime + (i === 3 ? 0.01 : 0));
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + (i === 3 ? 0.01 : 0));
      o.stop(actx.currentTime + dur);
    });
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._waveOffset = 0;
    this._initStatics();
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
        // Stars
        if (self._stars) self._stars.forEach(s => {
          c.fillStyle = `rgba(200,210,195,${s.brightness})`;
          c.beginPath(); c.arc(s.x * cw, s.y * ch, s.size, 0, Math.PI * 2); c.fill();
        });
        // Fireflies
        for (let i = 0; i < 6; i++) {
          const fx = cw * (0.1 + i * 0.15) + Math.sin(now * 0.001 + i * 2) * 15;
          const fy = ch * (0.1 + Math.sin(i * 1.7) * 0.15) + Math.sin(now * 0.0007 + i) * 10;
          c.fillStyle = `rgba(100,255,70,${0.3 + Math.sin(now * 0.002 + i * 3) * 0.2})`;
          c.beginPath(); c.arc(fx, fy, 1.8, 0, Math.PI * 2); c.fill();
        }
        self._drawSwamp(c, cw, ch, now);
      },

      onResize: () => { self._initStatics(); },
      onSceneReset: () => { self._waveOffset = 0; },

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
