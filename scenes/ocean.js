/**
 * scenes/ocean.js
 * Raindrops — Ocean Scene
 *
 * One audio track: rain (used as ocean ambient)
 * Background: animated ocean waves, distant yacht, blinking buoy
 * Chime: soft kalimba / string pluck
 */

SceneManager.register('ocean', {

  // ─── Audio tracks ─────────────────────────────────────────────────────────────
  tracks: [
    { id: 'rain', src: 'audio/rain.mp3', volume: 0.8 },
  ],

  // ─── Scene config ─────────────────────────────────────────────────────────────
  config: {
    DROPS_TO_WIN:     20,
    RAIN_INT:         22,
    GLOW_MIN_GAP:     1000,
    GLOW_MAX_GAP:     2000,
    HIT_R:            45,
    DENSE:            16,
    DROP_SPEED_MIN:   12.0,
    DROP_SPEED_RANGE: 8.0,
    RAIN_COLOR:       [120, 160, 195],
    GLOW_COLOR:       [80, 185, 255],
    RIPPLE_COLOR:     [96, 180, 230],
    FX_COLORS:        ['rgba(130,200,250,', 'rgba(100,175,230,'],
    PROGRESS_COLOR:   [70, 170, 230],
    MENU_COLOR:       [5, 20, 45],
    MENU_TEXT_COLOR:  [130, 210, 255],
    ENDING_BG:        [[10, 16, 35], [8, 18, 40]],
    ENDING_PARTICLES: ['#60a5fa','#3b82f6','#93c5fd','#7dd3fc','#38bdf8','#0ea5e9','#a5f3fc','#bfdbfe'],
    QUOTE_BG:         ['#0d1828', '#0a1420', '#070f18'],
    QUOTE_PILL:       'rgba(5,20,45,0.78)',
    QUOTE_BORDER:     'rgba(80,160,230,0.3)',
    QUOTE_TEXT:       'rgba(210,235,255,0.95)',
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
  _waveOffset: 0,
  _canvas: null,

  // ─── Ocean drawing ────────────────────────────────────────────────────────────
  _drawOcean(c, w, h, t) {
    const horizonY = h * 0.55;

    // Ocean body
    const oceanGrad = c.createLinearGradient(0, horizonY, 0, h);
    oceanGrad.addColorStop(0,    'rgba(45,70,100,0.9)');
    oceanGrad.addColorStop(0.3,  'rgba(35,55,82,0.95)');
    oceanGrad.addColorStop(0.5,  'rgba(22,38,60,0.97)');
    oceanGrad.addColorStop(0.67, 'rgba(12,24,40,0.98)');
    oceanGrad.addColorStop(1,    'rgba(5,14,25,1)');
    c.fillStyle = oceanGrad; c.fillRect(0, horizonY, w, h - horizonY);

    // Horizon glow
    const horizonGlow = c.createLinearGradient(0, horizonY - 12, 0, horizonY + 12);
    horizonGlow.addColorStop(0,    'rgba(100,140,180,0)');
    horizonGlow.addColorStop(0.35, 'rgba(130,170,210,0.12)');
    horizonGlow.addColorStop(0.5,  'rgba(160,200,240,0.35)');
    horizonGlow.addColorStop(0.65, 'rgba(130,170,210,0.12)');
    horizonGlow.addColorStop(1,    'rgba(100,140,180,0)');
    c.fillStyle = horizonGlow; c.fillRect(0, horizonY - 12, w, 24);

    c.strokeStyle = 'rgba(180,215,250,0.4)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, horizonY); c.lineTo(w, horizonY); c.stroke();

    // Waves
    this._waveOffset += 0.018;
    for (let layer = 0; layer < 5; layer++) {
      const waveY = horizonY + 6 + layer * 16;
      const amp   = 2 + layer * 1.8;
      const freq  = 0.014 - layer * 0.002;
      const speed = this._waveOffset * (1.2 - layer * 0.15);
      const alpha = 0.10 - layer * 0.018;
      c.strokeStyle = `rgba(100,145,190,${alpha})`; c.lineWidth = 1;
      c.beginPath();
      for (let x = 0; x < w; x += 2) {
        const y = waveY
          + Math.sin(x * freq + speed) * amp
          + Math.sin(x * freq * 2.3 + speed * 1.5) * amp * 0.4
          + Math.sin(x * freq * 0.7 - speed * 0.8) * amp * 0.2;
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }

    // Shimmer reflections
    c.save();
    for (let i = 0; i < 12; i++) {
      const sx = (w * 0.1 + i * w * 0.07 + Math.sin(this._waveOffset * 0.5 + i) * 15) % w;
      const sy = horizonY + 20 + i * 12 + Math.sin(this._waveOffset + i * 2) * 3;
      const sa = 0.04 + Math.sin(this._waveOffset * 1.5 + i * 1.3) * 0.02;
      c.fillStyle = `rgba(140,180,220,${sa})`;
      c.beginPath(); c.ellipse(sx, sy, 8 + Math.sin(this._waveOffset + i) * 3, 2, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();

    // Distant yacht
    const boatX = w * 0.22, boatY = horizonY + 20;
    c.fillStyle = 'rgba(20,25,35,0.9)';
    c.beginPath();
    c.moveTo(boatX - 24, boatY + 2);
    c.quadraticCurveTo(boatX - 27, boatY + 6, boatX - 20, boatY + 8);
    c.lineTo(boatX + 24, boatY + 8);
    c.quadraticCurveTo(boatX + 30, boatY + 5, boatX + 27, boatY + 2);
    c.lineTo(boatX - 24, boatY + 2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(25,30,42,0.9)';
    c.beginPath();
    c.moveTo(boatX - 10, boatY + 2); c.lineTo(boatX - 8, boatY - 6);
    c.lineTo(boatX + 14, boatY - 6); c.lineTo(boatX + 16, boatY + 2);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(22,27,38,0.9)';
    c.beginPath();
    c.moveTo(boatX - 5, boatY - 6); c.lineTo(boatX - 3, boatY - 11);
    c.lineTo(boatX + 8, boatY - 11); c.lineTo(boatX + 10, boatY - 6);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(20,25,35,0.9)';
    c.fillRect(boatX + 2, boatY - 16, 1.5, 6);

    // Buoy with blinking light
    const buoyX = w * 0.78, buoyY = horizonY + 28;
    const bobOffset = Math.sin(t * 0.002) * 2;
    c.fillStyle = 'rgba(20,25,35,0.9)';
    c.beginPath(); c.ellipse(buoyX, buoyY + bobOffset, 8, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(25,30,40,0.9)';
    c.fillRect(buoyX - 2, buoyY - 18 + bobOffset, 4, 10);

    if (Math.sin(t * 0.001) > 0) {
      const lg = c.createRadialGradient(buoyX, buoyY - 20 + bobOffset, 0, buoyX, buoyY - 20 + bobOffset, 20);
      lg.addColorStop(0, 'rgba(255,80,80,0.4)');
      lg.addColorStop(0.5, 'rgba(255,60,60,0.15)');
      lg.addColorStop(1, 'rgba(255,50,50,0)');
      c.fillStyle = lg; c.beginPath(); c.arc(buoyX, buoyY - 20 + bobOffset, 20, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,100,100,0.9)';
      c.beginPath(); c.arc(buoyX, buoyY - 20 + bobOffset, 3, 0, Math.PI * 2); c.fill();
    }
  },

  // ─── Chime: kalimba / soft pluck ─────────────────────────────────────────────
  _chime() {
    const actx = AudioEngine._getContext && AudioEngine._getContext();
    if (!actx) { AudioEngine.chime(); return; }

    const notes = [440, 523.2, 587.3, 659.2, 784, 880, 1046.5];
    const f = notes[Math.floor(Math.random() * notes.length)];

    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.09, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.015, actx.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.8);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.8);

    // Soft body resonance (lower octave)
    const o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 0.5;
    g2.gain.setValueAtTime(0.03, actx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);
    o2.connect(g2); g2.connect(actx.destination); o2.start(); o2.stop(actx.currentTime + 0.5);
  },

  // ─── SceneManager hooks ───────────────────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._waveOffset = 0;
    const self = this;

    RainEngine.init(canvas, this.config, {

      drawBackground: (c, cw, ch) => {
        const bg = c.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0,    '#131825');
        bg.addColorStop(0.2,  '#1a2030');
        bg.addColorStop(0.4,  '#243040');
        bg.addColorStop(0.55, '#2e3a50');
        bg.addColorStop(0.7,  '#3a4a60');
        bg.addColorStop(1,    '#4a5870');
        c.fillStyle = bg; c.fillRect(0, 0, cw, ch);

        // Stars
        [[0.12,0.08,1.2,0.6],[0.35,0.05,1.0,0.6],[0.58,0.12,1.3,0.6],
         [0.78,0.06,1.0,0.6],[0.92,0.15,1.1,0.6],[0.25,0.14,0.9,0.45],
         [0.68,0.10,0.8,0.45],[0.85,0.03,1.0,0.45]].forEach(([rx,ry,r,a]) => {
          c.fillStyle = `rgba(220,225,240,${a})`;
          c.beginPath(); c.arc(rx * cw, ry * ch, r, 0, Math.PI * 2); c.fill();
        });
      },

      drawForeground: (c, cw, ch, now) => {
        self._drawOcean(c, cw, ch, now);
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
