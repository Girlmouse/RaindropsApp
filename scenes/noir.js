/**
 * scenes/noir.js
 * Raindrops — Noir Scene
 *
 * One audio track: rain
 * Background: dark city skyline, park bench, flickering street lamp, puddles
 * Rain: angled/windy streaks
 * Chime: low synth sawtooth with sub bass
 */

SceneManager.register('noir', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain', src: 'audio/rain.mp3', volume: 1.0 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         5,
    GLOW_MIN_GAP:     1000,
    GLOW_MAX_GAP:     2000,
    HIT_R:            80,
    DENSE:            12,
    DROP_SPEED_MIN:   12.0,
    DROP_SPEED_RANGE: 7.0,
    RAIN_COLOR:       [180, 180, 175],
    GLOW_COLOR:       [255, 255, 250],
    RIPPLE_COLOR:     [150, 150, 145],
    FX_COLORS:        ['rgba(255,255,250,', 'rgba(200,200,195,'],
    PROGRESS_COLOR:   [220, 220, 215],
    MENU_COLOR:       [20, 20, 20],
    MENU_TEXT_COLOR:  [253, 224, 71],
    ENDING_BG:        [[8, 8, 8], [6, 6, 6]],
    ENDING_PARTICLES: ['#e8e8e8','#d0d0d0','#c0c0c0','#b0b0b0','#ffd870','#ffe090','#ffcc55','#f5c842'],
    QUOTE_BG:         ['#0c0c0c', '#0a0a0a', '#080808'],
    QUOTE_PILL:       'rgba(15,12,20,0.75)',
    QUOTE_BORDER:     'rgba(180,180,175,0.25)',
    QUOTE_TEXT:       'rgba(220,220,215,0.95)',
    QUOTES: [
      'breathe', 'feel', 'listen', 'notice', 'pause', 'reflect', 'release',
      'May your worries be as short lived as a fart on a windy day. — BH',
    ],
  },

  // ─── Internal state ───────────────────────────────────────────────────────────
  _flickerState: 1,
  _flickerTimer: 0,
  _nextFlicker: 50,
  _canvas: null,

  // ─── Drop override: angled windy rain ─────────────────────────────────────────
  // RainEngine uses these via the config, but noir needs angled drops.
  // We override mkDrop behavior via the drawDrop callback.

  // ─── Scene drawing ────────────────────────────────────────────────────────────
  _drawScene(c, w, h, t) {
    const groundY = h * 0.75;

    // Sky gradient
    const skyGrad = c.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0,    '#1a1a1a');
    skyGrad.addColorStop(0.25, '#252525');
    skyGrad.addColorStop(0.5,  '#333333');
    skyGrad.addColorStop(0.75, '#424242');
    skyGrad.addColorStop(1,    '#4e4e4e');
    c.fillStyle = skyGrad; c.fillRect(0, 0, w, groundY);

    // Moon (faint, behind clouds)
    const mx = w * 0.75, my = h * 0.18, mr = 28;
    const moonGlow = c.createRadialGradient(mx, my, 0, mx, my, mr * 3);
    moonGlow.addColorStop(0, 'rgba(200,200,190,0.12)');
    moonGlow.addColorStop(0.3, 'rgba(180,180,175,0.06)');
    moonGlow.addColorStop(1, 'rgba(140,140,135,0)');
    c.fillStyle = moonGlow; c.beginPath(); c.arc(mx, my, mr * 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(180,180,175,0.15)'; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    // Clouds over moon
    [['rgba(25,25,25,0.7)', mx - 20, my + 5, 45, 18, 0.2],
     ['rgba(30,30,30,0.6)', mx + 25, my - 8, 40, 15, -0.15],
     ['rgba(22,22,22,0.65)', mx + 5, my + 15, 50, 14, 0.1]].forEach(([col, cx2, cy2, rx2, ry2, rot]) => {
      c.fillStyle = col; c.beginPath(); c.ellipse(cx2, cy2, rx2, ry2, rot, 0, Math.PI * 2); c.fill();
    });
    // Wispy clouds
    c.fillStyle = 'rgba(35,35,35,0.4)';
    [[w*0.2,h*0.12,60,12,0.1],[w*0.45,h*0.08,70,10,-0.1]].forEach(([cx2,cy2,rx2,ry2,rot]) => {
      c.beginPath(); c.ellipse(cx2, cy2, rx2, ry2, rot, 0, Math.PI * 2); c.fill();
    });

    // Stars
    [[0.08,0.05,1.2,0.5],[0.18,0.15,1.0,0.4],[0.32,0.08,1.4,0.55],[0.42,0.20,0.9,0.35],
     [0.55,0.06,1.1,0.45],[0.68,0.12,1.3,0.5],[0.85,0.04,1.0,0.4],[0.92,0.18,1.2,0.45]].forEach(([rx,ry,r,a]) => {
      c.fillStyle = `rgba(220,220,215,${a})`; c.beginPath(); c.arc(rx*w, ry*h, r, 0, Math.PI*2); c.fill();
    });

    // Background buildings
    c.fillStyle = '#0c0c0c';
    [{x:0.02,w:18,h:25},{x:0.06,w:15,h:35},{x:0.10,w:20,h:30},{x:0.15,w:12,h:45},
     {x:0.19,w:22,h:28},{x:0.24,w:16,h:38},{x:0.29,w:14,h:32},{x:0.34,w:25,h:55},
     {x:0.40,w:18,h:40},{x:0.46,w:20,h:35},{x:0.52,w:15,h:48},{x:0.57,w:22,h:30},
     {x:0.63,w:18,h:42},{x:0.68,w:28,h:60},{x:0.74,w:16,h:35},{x:0.79,w:20,h:45},
     {x:0.85,w:14,h:38},{x:0.90,w:24,h:50},{x:0.95,w:18,h:32}].forEach(b => {
      const bx = b.x * w, by = groundY - b.h - 35;
      c.fillStyle = '#0c0c0c'; c.fillRect(bx, by, b.w, b.h);
      if (b.h > 45) c.fillRect(bx + b.w / 2 - 1, by - 8, 2, 8);
      c.fillStyle = 'rgba(255,220,100,0.6)';
      for (let wy = 5; wy < b.h - 8; wy += 7)
        for (let wx = 3; wx < b.w - 4; wx += 5)
          if (Math.sin(b.x * 80 + wx * 3 + wy * 2) > 0.6) c.fillRect(bx + wx, by + wy, 2, 3);
      c.fillStyle = '#0c0c0c';
    });

    // Foreground buildings
    [{x:0.08,w:28,h:70},{x:0.25,w:35,h:85},{x:0.42,w:25,h:65},
     {x:0.58,w:40,h:95},{x:0.75,w:30,h:75},{x:0.92,w:32,h:80}].forEach(b => {
      const bx = b.x * w, by = groundY - b.h - 35;
      c.fillStyle = '#0a0a0a'; c.fillRect(bx, by, b.w, b.h);
      if (b.h > 80) { c.fillRect(bx + b.w / 2 - 2, by - 12, 4, 12); c.fillRect(bx + b.w * 0.3, by - 5, 3, 5); }
      c.fillStyle = 'rgba(255,225,110,0.7)';
      for (let wy = 6; wy < b.h - 10; wy += 9)
        for (let wx = 4; wx < b.w - 5; wx += 7)
          if (Math.sin(b.x * 60 + wx * 2.5 + wy * 1.8) > 0.5) c.fillRect(bx + wx, by + wy, 3, 4);
      c.fillStyle = '#0a0a0a';
    });

    // Tree layers (background silhouettes)
    [['#151515',20,25,30,h*0.75-32],['#111111',16,30,35,h*0.75-22],['#0d0d0d',14,38,40,h*0.75-8]].forEach(([col,count,tw,th,ty]) => {
      c.fillStyle = col;
      for (let i = 0; i < count; i++) {
        const tx = i * w / (count - 2) - 10 + Math.sin(i * 1.8) * 12;
        c.beginPath(); c.ellipse(tx, ty, tw + Math.sin(i * 2.5) * 12, th + Math.sin(i * 1.5) * 10, 0, 0, Math.PI * 2); c.fill();
      }
    });

    // Foreground trees
    const trees = [{x:0.08,height:220,trunk:10},{x:0.22,height:180,trunk:8},{x:0.72,height:200,trunk:9},{x:0.88,height:190,trunk:9},{x:0.95,height:170,trunk:7}];
    trees.forEach((tree, idx) => {
      if (idx > 2) return; // background pass
      const tx = tree.x * w, baseY = groundY;
      c.strokeStyle = '#0c0c0c'; c.lineWidth = 1.5; c.lineCap = 'round';
      for (let g = 0; g < 10; g++) {
        const gx = tx - 25 + g * 5 + Math.sin(g * 2) * 3;
        const gh = 18 + Math.sin(g * 1.5) * 8, lean = (g - 5) * 0.8;
        c.beginPath(); c.moveTo(gx, baseY); c.quadraticCurveTo(gx + lean * 0.5, baseY - gh * 0.6, gx + lean, baseY - gh); c.stroke();
      }
      c.fillStyle = '#0a0a0a';
      c.beginPath(); c.moveTo(tx - tree.trunk, baseY); c.lineTo(tx - tree.trunk * 0.3, baseY - tree.height); c.lineTo(tx + tree.trunk * 0.3, baseY - tree.height); c.lineTo(tx + tree.trunk, baseY); c.closePath(); c.fill();
      c.strokeStyle = '#0a0a0a'; c.lineWidth = 3;
      const brY = baseY - tree.height * 0.6;
      c.beginPath(); c.moveTo(tx - tree.trunk * 0.3, brY); c.quadraticCurveTo(tx - 40, brY - 30, tx - 55, brY - 15); c.stroke();
      c.beginPath(); c.moveTo(tx + tree.trunk * 0.3, brY - 10); c.quadraticCurveTo(tx + 35, brY - 40, tx + 50, brY - 25); c.stroke();
    });

    // Ground
    const gg = c.createLinearGradient(0, groundY, 0, h);
    gg.addColorStop(0, '#343434'); gg.addColorStop(1, '#282828');
    c.fillStyle = gg; c.fillRect(0, groundY, w, h - groundY);

    // Sidewalk
    const pathY = h * 0.78, pathH = h * 0.12;
    c.fillStyle = 'rgba(72,72,72,0.95)'; c.fillRect(0, pathY, w, pathH);
    c.strokeStyle = 'rgba(70,70,70,0.8)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, pathY); c.lineTo(w, pathY); c.stroke();

    // Puddles
    const puddles = [{x:0.15,y:0.5,rx:35,ry:8},{x:0.35,y:0.3,rx:45,ry:10},{x:0.55,y:0.7,rx:30,ry:7},{x:0.75,y:0.4,rx:50,ry:12},{x:0.90,y:0.6,rx:25,ry:6}];
    puddles.forEach((puddle, i) => {
      const px = puddle.x * w, py = pathY + puddle.y * pathH;
      c.fillStyle = 'rgba(35,35,35,0.8)'; c.beginPath(); c.ellipse(px, py, puddle.rx, puddle.ry, 0, 0, Math.PI * 2); c.fill();
      const ra = this._flickerState > 0.5 ? 0.25 * this._flickerState : 0.08;
      c.fillStyle = `rgba(255,230,140,${ra})`; c.beginPath(); c.ellipse(px - puddle.rx * 0.2, py - puddle.ry * 0.2, puddle.rx * 0.4, puddle.ry * 0.4, 0, 0, Math.PI * 2); c.fill();
      const rp = t * 0.002 + i;
      c.strokeStyle = `rgba(80,80,80,${0.12 + Math.sin(rp) * 0.05})`; c.lineWidth = 0.5;
      c.beginPath(); c.ellipse(px, py, puddle.rx * 0.6 + Math.sin(rp) * 5, puddle.ry * 0.6 + Math.sin(rp) * 2, 0, 0, Math.PI * 2); c.stroke();
    });

    // Bushes
    const bushes = [{x:0.05,y:0.72,width:50,height:25},{x:0.18,y:0.74,width:40,height:20},{x:0.32,y:0.73,width:35,height:22},{x:0.65,y:0.72,width:45,height:24},{x:0.82,y:0.74,width:38,height:20}];
    bushes.forEach((bush) => {
      const bx = bush.x * w, by = bush.y * h;
      for (let layer = 0; layer < 3; layer++) {
        c.fillStyle = `rgba(10,10,10,${0.9 - layer * 0.1})`;
        for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(bx + (i - 1.5) * bush.width * 0.25, by - layer * 4, bush.width * 0.3, bush.height * 0.5, 0, 0, Math.PI * 2); c.fill(); }
      }
    });

    // Street light + flicker
    this._drawStreetLight(c, w, h);

    // Bench
    this._drawBench(c, w, h);

    // Foreground trees (idx > 2)
    trees.forEach((tree, idx) => {
      if (idx <= 2) return;
      const tx = tree.x * w, baseY = groundY;
      c.fillStyle = '#0a0a0a';
      c.beginPath(); c.moveTo(tx - tree.trunk, baseY); c.lineTo(tx - tree.trunk * 0.3, baseY - tree.height); c.lineTo(tx + tree.trunk * 0.3, baseY - tree.height); c.lineTo(tx + tree.trunk, baseY); c.closePath(); c.fill();
      c.strokeStyle = '#0a0a0a'; c.lineWidth = 3;
      const brY = baseY - tree.height * 0.6;
      c.beginPath(); c.moveTo(tx - tree.trunk * 0.3, brY); c.quadraticCurveTo(tx - 40, brY - 30, tx - 55, brY - 15); c.stroke();
      c.beginPath(); c.moveTo(tx + tree.trunk * 0.3, brY - 10); c.quadraticCurveTo(tx + 35, brY - 40, tx + 50, brY - 25); c.stroke();
    });

    // Light cone (drawn on top)
    this._drawLightCone(c, w, h);
  },

  _drawStreetLight(c, w, h) {
    const lx = w * 0.45, groundY = h * 0.75, poleH = 180;
    c.fillStyle = '#151515'; c.fillRect(lx - 3, groundY - poleH, 6, poleH);
    c.fillStyle = '#181818'; c.fillRect(lx, groundY - poleH, 35, 4);
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.moveTo(lx + 30, groundY - poleH); c.lineTo(lx + 45, groundY - poleH + 8); c.lineTo(lx + 45, groundY - poleH + 15); c.lineTo(lx + 25, groundY - poleH + 15); c.lineTo(lx + 25, groundY - poleH + 8); c.closePath(); c.fill();

    // Flicker logic
    this._flickerTimer++;
    if (this._flickerTimer >= this._nextFlicker) {
      this._flickerTimer = 0;
      if (Math.random() < 0.15) {
        this._flickerState = Math.random() < 0.5 ? 0.3 : 0.6;
        this._nextFlicker = 2 + Math.floor(Math.random() * 4);
      } else {
        this._flickerState = 0.9 + Math.random() * 0.1;
        this._nextFlicker = 30 + Math.floor(Math.random() * 60);
      }
    }

    if (this._flickerState > 0.5) {
      const gi = this._flickerState;
      const bg = c.createRadialGradient(lx + 35, groundY - poleH + 12, 0, lx + 35, groundY - poleH + 12, 30);
      bg.addColorStop(0, `rgba(255,230,140,${0.95 * gi})`);
      bg.addColorStop(0.3, `rgba(255,220,100,${0.6 * gi})`);
      bg.addColorStop(1, 'rgba(255,200,60,0)');
      c.fillStyle = bg; c.beginPath(); c.arc(lx + 35, groundY - poleH + 12, 30, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(255,240,180,${0.98 * gi})`;
      c.beginPath(); c.ellipse(lx + 35, groundY - poleH + 12, 7, 5, 0, 0, Math.PI * 2); c.fill();
    }
  },

  _drawLightCone(c, w, h) {
    if (this._flickerState < 0.5) return;
    const lx = w * 0.45 + 35, ly = h * 0.75 - 180 + 15, groundY = h * 0.75;
    const intensity = this._flickerState * 0.22;
    const ag = c.createLinearGradient(lx, ly, lx, groundY);
    ag.addColorStop(0, `rgba(255,230,140,${intensity * 0.3})`);
    ag.addColorStop(1, 'rgba(255,220,100,0)');
    c.fillStyle = ag;
    c.beginPath(); c.moveTo(lx - 6, ly); c.lineTo(lx - 55, groundY); c.lineTo(lx + 55, groundY); c.lineTo(lx + 6, ly); c.closePath(); c.fill();
    const cg = c.createRadialGradient(lx, groundY, 0, lx, groundY, 60);
    cg.addColorStop(0, `rgba(255,235,130,${intensity * 0.9})`);
    cg.addColorStop(1, 'rgba(255,210,80,0)');
    c.fillStyle = cg; c.beginPath(); c.ellipse(lx, groundY + 2, 55, 14, 0, 0, Math.PI * 2); c.fill();
  },

  _drawBench(c, w, h) {
    const bx = w * 0.48, by = h * 0.75;
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(bx, by + 5, 50, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#050505'; c.fillRect(bx - 38, by - 28, 8, 28); c.fillRect(bx + 32, by - 28, 8, 28);
    c.fillRect(bx - 45, by - 35, 95, 10);
    c.fillRect(bx - 43, by - 62, 90, 8); c.fillRect(bx - 43, by - 50, 90, 8);
    c.fillRect(bx - 42, by - 62, 7, 37); c.fillRect(bx + 40, by - 62, 7, 37);
    c.fillRect(bx - 48, by - 45, 12, 16); c.fillRect(bx + 42, by - 45, 12, 16);
  },

  // ─── Chime: low synth sawtooth ────────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }
    const notes = [130.81, 146.83, 164.81, 174.61, 196, 220, 246.94, 261.63];
    const f = notes[Math.floor(Math.random() * notes.length)];
    // Sawtooth through lowpass
    const o = actx.createOscillator(), g = actx.createGain();
    const filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1200; filt.Q.value = 2;
    o.type = 'sawtooth'; o.frequency.value = f;
    g.gain.setValueAtTime(0.09, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.02, actx.currentTime + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.5);
    o.connect(filt); filt.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 1.5);
    // Sub bass
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 0.5;
    g2.gain.setValueAtTime(0.06, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.2);
    o2.connect(g2); g2.connect(actx.destination); o2.start(); o2.stop(actx.currentTime + 1.2);
    // Detuned layer
    const o3 = actx.createOscillator(), g3 = actx.createGain();
    const f2 = actx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 1000;
    o3.type = 'sawtooth'; o3.frequency.value = f * 1.01;
    g3.gain.setValueAtTime(0.04, actx.currentTime);
    g3.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.3);
    o3.connect(f2); f2.connect(g3); g3.connect(actx.destination); o3.start(); o3.stop(actx.currentTime + 1.3);
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._flickerState = 1; this._flickerTimer = 0; this._nextFlicker = 50;
    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch) => {
        c.fillStyle = '#242424'; c.fillRect(0, 0, cw, ch);
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawScene(c, cw, ch, now * 0.001);
      },

      // Noir has angled rain — override drop creation
      mkDrop: (w, h, forceGlow) => {
        const gl = forceGlow || false;
        const GLOW_MARGIN = 0.15;
        const xPos = gl ? w * GLOW_MARGIN + Math.random() * w * (1 - 2 * GLOW_MARGIN) : Math.random() * w * 1.3;
        return {
          x: xPos, y: -10 - Math.random() * 60,
          speed: gl ? (1.2 + Math.random() * 0.5) * (h / 600) : 12 + Math.random() * 7,
          length: gl ? 12 + Math.random() * 6 : 5 + Math.random() * 7,
          opacity: gl ? 1 : 0.15 + Math.random() * 0.12,
          isGlowing: gl, pulsePhase: Math.random() * Math.PI * 2,
          width: gl ? 2.5 : 0.7 + Math.random() * 0.5,
          caught: false, fadeOut: 1,
          drift: gl ? 0 : -2.5 - Math.random() * 1.5,
        };
      },

      // Noir draws angled streaks instead of vertical ones
      drawDrop: (c, d) => {
        c.save();
        if (d.isGlowing && !d.caught) {
          d.pulsePhase += 0.04; const p = 0.6 + Math.sin(d.pulsePhase) * 0.4;
          const og = c.createRadialGradient(d.x, d.y, 0, d.x, d.y, 24);
          og.addColorStop(0, `rgba(255,255,250,${0.35 * p})`);
          og.addColorStop(0.35, `rgba(255,252,245,${0.18 * p})`);
          og.addColorStop(1, 'rgba(245,242,235,0)');
          c.fillStyle = og; c.beginPath(); c.ellipse(d.x, d.y, 20, 26, 0, 0, Math.PI * 2); c.fill();
          const ig = c.createRadialGradient(d.x, d.y, 0, d.x, d.y, 9);
          ig.addColorStop(0, `rgba(255,255,255,${0.7 * p})`);
          ig.addColorStop(1, `rgba(255,253,248,${0.3 * p})`);
          c.fillStyle = ig; c.beginPath(); c.ellipse(d.x, d.y, 6, 9, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = `rgba(255,255,255,${0.95 * p * d.fadeOut})`;
          c.beginPath(); c.ellipse(d.x, d.y, 1.8, 3, 0, 0, Math.PI * 2); c.fill();
        } else {
          c.strokeStyle = `rgba(180,180,175,${d.opacity * d.fadeOut})`;
          c.lineWidth = d.width; c.lineCap = 'round';
          const dx = d.drift * 0.8, dy = d.length;
          c.beginPath(); c.moveTo(d.x - dx, d.y - dy / 2); c.lineTo(d.x + dx, d.y + dy / 2); c.stroke();
        }
        c.restore();
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
  },

});
