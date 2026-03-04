/**
 * shared/game-engine.js
 * Raindrops — Shared Game Engine
 *
 * Handles everything common across all scenes:
 *   - Drop physics (spawn, move, fade, catch)
 *   - Game state machine (menu → playing → ending → quote)
 *   - Glow toggle UI
 *   - Ripples, catch particles, progress bar, exit button
 *   - Input (tap / touch)
 *
 * Each scene calls:
 *   RainEngine.init(config, hooks)  — once, when scene starts
 *   RainEngine.stop()               — when scene exits
 */

const RainEngine = (() => {

  // ─── Internal state ──────────────────────────────────────────────────────────
  let _cfg = null;      // scene config
  let _hooks = null;    // scene hooks (drawBackground, chime, playEnd, etc.)
  let _cv = null;       // canvas element
  let _c = null;        // 2d context
  let _raf = null;      // requestAnimationFrame handle
  let _glowToggleBtn = null;
  let _glowToggleLabel = null;
  let _glowEnabled = true;
  let _quoteIndex = 0;
  let _lastTick = Date.now();

  const gs = {
    drops: [], catchPs: [], ripples: [],
    score: 0, phase: 'menu',
    lastRain: 0, nextGlow: 0,
    cloudOff: 0, menuPulse: 0,
    endT: 0, endQuote: '',
    rainFaded: false, rbPs: null,
    quoteStartTime: 0,
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function getSize() {
    const W = window.innerWidth;
    const H = window.innerHeight || document.documentElement.clientHeight;
    const IS_MOB = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (IS_MOB) return { w: Math.floor(W), h: Math.floor(H) };
    const mw = Math.min(W * 0.98, 800), mh = H * 0.92;
    let w = mw, h = mw * (4 / 3);
    if (h > mh) { h = mh; w = h * (3 / 4); }
    return { w: Math.floor(w), h: Math.floor(h) };
  }

  function resize() {
    if (!_cv || !_c) return;
    const { w, h } = getSize();
    _cv.width = w * 2; _cv.height = h * 2;
    _cv.style.width = w + 'px'; _cv.style.height = h + 'px';
    _c.setTransform(2, 0, 0, 2, 0, 0);
    if (_hooks && _hooks.onResize) _hooks.onResize();
  }

  function scheduleGlow() {
    if (!_glowEnabled || !_cfg) { gs.nextGlow = Infinity; return; }
    gs.nextGlow = Date.now() + _cfg.GLOW_MIN_GAP + Math.random() * (_cfg.GLOW_MAX_GAP - _cfg.GLOW_MIN_GAP);
  }

  function mkDrop(w, h, forceGlow) {
    const gl = forceGlow || false;
    const speedScale = h / 600;
    const GLOW_MARGIN = 0.12;
    const xPos = gl
      ? w * GLOW_MARGIN + Math.random() * w * (1 - 2 * GLOW_MARGIN)
      : Math.random() * w;
    return {
      x: xPos, y: -10 - Math.random() * 50,
      speed: gl ? (1.2 + Math.random() * 0.5) * speedScale : (_cfg.DROP_SPEED_MIN + Math.random() * _cfg.DROP_SPEED_RANGE) * speedScale,
      length: gl ? 16 + Math.random() * 10 : 2 + Math.random() * 5,
      opacity: gl ? 1 : 0.2 + Math.random() * 0.4,
      isGlowing: gl, pulsePhase: Math.random() * Math.PI * 2,
      width: gl ? 2.5 : 0.6 + Math.random() * 0.8,
      caught: false, fadeOut: 1, grounded: false,
      drift: (Math.random() - 0.5) * 0.2,
    };
  }

  function mkFx(x, y) {
    const ps = [];
    const colors = _cfg.FX_COLORS || ['rgba(200,200,255,', 'rgba(180,180,240,'];
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3, s = 2 + Math.random() * 3;
      ps.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5,
        life: 1, size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return ps;
  }

  function mkRip(x, y) { return { x, y, radius: 3, opacity: 0.45, speed: 1 }; }

  // ─── Canvas: roundRect fallback ───────────────────────────────────────────────
  function ensureRoundRect(ctx) {
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, w, h, r) {
        r = Math.min(r || 0, w / 2, h / 2);
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  function getPos(e) {
    const r = _cv.getBoundingClientRect();
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: px - r.left, y: py - r.top };
  }

  function tap(e) {
    e.preventDefault();

    // Unlock audio on first tap
    if (_hooks && _hooks.onFirstTap) _hooks.onFirstTap();

    if (gs.phase === 'menu') {
      gs.phase = 'playing'; gs.score = 0;
      gs.drops = []; gs.catchPs = []; gs.ripples = [];
      gs.endT = 0; gs.rainFaded = false; gs.rbPs = null;
      if (_hooks && _hooks.onSceneReset) _hooks.onSceneReset();
      scheduleGlow();
      if (_hooks && _hooks.resetRain) _hooks.resetRain();
      _lastTick = Date.now();
      return;
    }

    if (gs.phase === 'quote') {
      const rect = _cv.getBoundingClientRect();
      const cw = rect.width, ch = rect.height;
      const btnW = 120, btnH = 34, btnY = ch - 55, gap = 16;
      const totalW = btnW * 2 + gap;
      const btn1X = (cw - totalW) / 2;
      const btn2X = btn1X + btnW + gap;
      const { x, y } = getPos(e);

      // Home button
      if (x >= btn2X && x <= btn2X + btnW && y >= btnY && y <= btnY + btnH) {
        _exitToMenu();
        return;
      }
      // Replay button
      if (x >= btn1X && x <= btn1X + btnW && y >= btnY && y <= btnY + btnH) {
        gs.phase = 'playing'; gs.score = 0;
        gs.drops = []; gs.catchPs = []; gs.ripples = [];
        gs.endT = 0; gs.rainFaded = false; gs.rbPs = null;
        if (_hooks && _hooks.onSceneReset) _hooks.onSceneReset();
        scheduleGlow(); _lastTick = Date.now();
        if (_hooks && _hooks.resetRain) _hooks.resetRain();
        return;
      }
      return;
    }

    if (gs.phase === 'playing' || gs.phase === 'ending') {
      const { x: ex, y: ey } = getPos(e);
      const { w: cw, h: ch } = getSize();
      const exitW = 50, exitH = 28, exitX = 12, exitY = ch - 44;
      if (ex >= exitX && ex <= exitX + exitW && ey >= exitY && ey <= exitY + exitH) {
        _exitToMenu();
        return;
      }
    }

    if (gs.phase !== 'playing') return;

    const { x, y } = getPos(e);
    let best = Infinity, bi = -1;
    for (let i = 0; i < gs.drops.length; i++) {
      const d = gs.drops[i];
      if (!d.isGlowing || d.caught) continue;
      const dist = Math.hypot(x - d.x, y - d.y);
      if (dist < _cfg.HIT_R && dist < best) { best = dist; bi = i; }
    }
    if (bi >= 0) {
      const d = gs.drops[bi];
      d.caught = true; gs.score++;
      gs.catchPs.push(...mkFx(d.x, d.y));
      gs.ripples.push(mkRip(d.x, d.y));
      if (_hooks && _hooks.chime) _hooks.chime();
      if (gs.score >= _cfg.DROPS_TO_WIN) {
        gs.phase = 'ending'; gs.endT = 0;
        gs.endQuote = _cfg.QUOTES[_quoteIndex % _cfg.QUOTES.length];
        _quoteIndex++;
        if (_hooks && _hooks.playEnd) _hooks.playEnd();
      }
    } else {
      gs.ripples.push(mkRip(x, y));
    }
  }

  // ─── Draw drop ───────────────────────────────────────────────────────────────

  function drawDrop(d) {
    _c.save();
    if (d.isGlowing && !d.caught) {
      d.pulsePhase += 0.04;
      const p = 0.6 + Math.sin(d.pulsePhase) * 0.4;
      const gc = _cfg.GLOW_COLOR || [180, 120, 255];
      const og = _c.createRadialGradient(d.x, d.y, 0, d.x, d.y, 26);
      og.addColorStop(0, `rgba(${gc[0]},${gc[1]},${gc[2]},${0.35 * p})`);
      og.addColorStop(0.35, `rgba(${gc[0] - 30},${gc[1] - 20},${gc[2] - 15},${0.18 * p})`);
      og.addColorStop(0.65, `rgba(${gc[0] - 50},${gc[1] - 40},${gc[2] - 35},${0.08 * p})`);
      og.addColorStop(1, `rgba(${gc[0] - 60},${gc[1] - 50},${gc[2] - 55},0)`);
      _c.fillStyle = og; _c.beginPath(); _c.ellipse(d.x, d.y, 22, 28, 0, 0, Math.PI * 2); _c.fill();
      const ig = _c.createRadialGradient(d.x, d.y, 0, d.x, d.y, 10);
      ig.addColorStop(0, `rgba(220,200,255,${0.6 * p})`);
      ig.addColorStop(1, `rgba(180,150,250,${0.25 * p})`);
      _c.fillStyle = ig; _c.beginPath(); _c.ellipse(d.x, d.y, 7, 10, 0, 0, Math.PI * 2); _c.fill();
      _c.fillStyle = `rgba(240,230,255,${0.85 * p * d.fadeOut})`;
      _c.beginPath(); _c.ellipse(d.x, d.y, 4, 6, 0, 0, Math.PI * 2); _c.fill();
      _c.fillStyle = `rgba(255,255,255,${0.95 * p * d.fadeOut})`;
      _c.beginPath(); _c.ellipse(d.x, d.y, 2, 3.5, 0, 0, Math.PI * 2); _c.fill();
    } else {
      const rc = _cfg.RAIN_COLOR || [180, 175, 210];
      _c.strokeStyle = `rgba(${rc[0]},${rc[1]},${rc[2]},${d.opacity * d.fadeOut})`;
      _c.lineWidth = d.width; _c.lineCap = 'round';
      _c.beginPath();
      _c.moveTo(d.x + d.drift * 5, d.y - d.length / 2);
      _c.lineTo(d.x, d.y + d.length / 2);
      _c.stroke();
    }
    _c.restore();
  }

  // ─── Glow toggle UI ──────────────────────────────────────────────────────────

  function positionGlowToggle() {
    if (!_glowToggleBtn || !_cv) return;
    const r = _cv.getBoundingClientRect();
    const pad = 14;
    const size = _glowToggleBtn.offsetWidth || 54;
    _glowToggleBtn.style.left = (r.right - size - pad) + 'px';
    _glowToggleBtn.style.top = (r.bottom - size - pad) + 'px';
  }

  function setGlowEnabled(on) {
    _glowEnabled = !!on;
    if (!_glowEnabled) {
      gs.nextGlow = Infinity;
      for (const d of gs.drops) {
        if (d && d.isGlowing && !d.caught) d.grounded = true;
      }
    } else {
      scheduleGlow();
    }
    if (_glowToggleBtn) _glowToggleBtn.classList.toggle('off', !_glowEnabled);
    if (_glowToggleLabel) _glowToggleLabel.textContent = _glowEnabled ? 'ON' : 'OFF';
  }

  // ─── Exit to menu ─────────────────────────────────────────────────────────────

  function _exitToMenu() {
    if (_hooks && _hooks.onExit) _hooks.onExit();
    if (window.SceneManager) window.SceneManager.showMenu();
  }

  // ─── Main render loop ─────────────────────────────────────────────────────────

  function loop() {
    _raf = requestAnimationFrame(loop);
    const now = Date.now();
    const { w: cw, h: ch } = getSize();

    // Show/hide glow toggle
    if (_glowToggleBtn) {
      const show = gs.phase === 'playing';
      _glowToggleBtn.style.opacity = show ? '1' : '0';
      _glowToggleBtn.style.pointerEvents = show ? 'auto' : 'none';
      positionGlowToggle();
    }

    // Draw background (scene-specific)
    if (_hooks && _hooks.drawBackground) {
      _hooks.drawBackground(_c, cw, ch, now);
    }

    const isActive = gs.phase === 'menu' || gs.phase === 'playing' || gs.phase === 'ending' || gs.phase === 'quote';

    if (isActive) {
      // Clouds
      gs.cloudOff += 0.06;
      _c.save(); _c.globalAlpha = 0.18; _c.fillStyle = 'rgba(30,20,45,1)';
      for (let i = 0; i < 3; i++) {
        const cx2 = ((gs.cloudOff * (0.18 + i * 0.12) + i * 190) % (cw + 300)) - 150;
        _c.beginPath(); _c.ellipse(cx2, 16 + i * 13, 105 + i * 22, 13 + i * 4, 0, 0, Math.PI * 2); _c.fill();
      }
      _c.restore();

      // Scene-specific foreground layer (trees, skyline, etc.)
      if (_hooks && _hooks.drawForeground) {
        _hooks.drawForeground(_c, cw, ch, now);
      }

      // ── Rain spawning ──
      const canSpawn = gs.phase === 'playing' || gs.phase === 'ending';
      const isMenu = gs.phase === 'menu' || gs.phase === 'quote';

      if (canSpawn && now - gs.lastRain > _cfg.RAIN_INT) {
        for (let i = 0; i < _cfg.DENSE; i++) gs.drops.push(mkDrop(cw, ch, false));
        gs.lastRain = now;
      }
      if (isMenu && now - gs.lastRain > 120) {
        for (let i = 0; i < 2; i++) {
          const d = mkDrop(cw, ch, false);
          d.opacity = 0.04 + Math.random() * 0.10;
          gs.drops.push(d);
        }
        gs.lastRain = now;
      }

      // Glow drop spawning
      if (gs.phase === 'playing' && _glowEnabled && now >= gs.nextGlow) {
        gs.drops.push(mkDrop(cw, ch, true));
        scheduleGlow();
      }

      // Cap regular drops
      const MAX_REGULAR = 500;
      let regularCount = 0;
      for (let i = gs.drops.length - 1; i >= 0; i--) {
        if (!gs.drops[i].isGlowing) {
          regularCount++;
          if (regularCount > MAX_REGULAR) gs.drops.splice(i, 1);
        }
      }

      // Update & draw drops
      for (let i = gs.drops.length - 1; i >= 0; i--) {
        const d = gs.drops[i];
        d.y += d.speed; d.x += d.drift;
        if (!d.grounded && (d.y + d.length / 2) >= (ch + 2)) d.grounded = true;
        if (d.caught) {
          d.fadeOut -= 0.08;
          if (d.fadeOut <= 0) { gs.drops.splice(i, 1); continue; }
        }
        if (d.isGlowing) {
          if (d.grounded) { d.fadeOut -= 0.04; if (d.fadeOut <= 0) { gs.drops.splice(i, 1); continue; } }
        } else {
          if (d.y > ch + 20) { gs.drops.splice(i, 1); continue; }
        }
        drawDrop(d);
      }

      // Ground splashes
      if (gs.phase === 'playing') {
        for (let i = 0; i < 2; i++) {
          const sx = Math.random() * cw, sy = ch - 2 + Math.random() * 3;
          _c.fillStyle = `rgba(150,145,175,${0.04 + Math.random() * 0.04})`;
          _c.beginPath(); _c.ellipse(sx, sy, 2 + Math.random() * 3, 1, 0, 0, Math.PI * 2); _c.fill();
        }
      }

      // Ripples
      const rc = _cfg.RIPPLE_COLOR || [200, 175, 255];
      for (let i = gs.ripples.length - 1; i >= 0; i--) {
        const r = gs.ripples[i]; r.radius += r.speed; r.opacity -= 0.01;
        if (r.opacity <= 0) { gs.ripples.splice(i, 1); continue; }
        _c.save(); _c.strokeStyle = `rgba(${rc[0]},${rc[1]},${rc[2]},${r.opacity})`; _c.lineWidth = 1;
        _c.beginPath(); _c.arc(r.x, r.y, r.radius, 0, Math.PI * 2); _c.stroke(); _c.restore();
      }

      // Catch particles
      for (let i = gs.catchPs.length - 1; i >= 0; i--) {
        const p = gs.catchPs[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= 0.016;
        if (p.life <= 0) { gs.catchPs.splice(i, 1); continue; }
        _c.save(); _c.globalAlpha = p.life; _c.fillStyle = p.color + p.life + ')';
        _c.beginPath(); _c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); _c.fill(); _c.restore();
      }
    }

    // ── Playing UI ──
    if (gs.phase === 'playing') {
      const pc = _cfg.PROGRESS_COLOR || [180, 140, 240];
      const barW = 5, barH = ch * 0.6, barX = 12, barY = (ch - barH) / 2;
      const prog = Math.min(gs.score / _cfg.DROPS_TO_WIN, 1);
      _c.fillStyle = 'rgba(255,255,255,0.06)';
      _c.beginPath(); _c.roundRect(barX, barY, barW, barH, 3); _c.fill();
      if (prog > 0) {
        const fillH = barH * prog;
        const fg = _c.createLinearGradient(0, barY + barH, 0, barY + barH - fillH);
        fg.addColorStop(0, `rgba(${pc[0]},${pc[1]},${pc[2]},0.4)`);
        fg.addColorStop(1, `rgba(${Math.min(pc[0] + 40, 255)},${Math.min(pc[1] + 60, 255)},${Math.min(pc[2] + 15, 255)},0.7)`);
        _c.fillStyle = fg; _c.beginPath(); _c.roundRect(barX, barY + barH - fillH, barW, fillH, 3); _c.fill();
        _c.shadowColor = `rgba(${pc[0]},${pc[1]},${pc[2]},0.35)`; _c.shadowBlur = 6;
        _c.beginPath(); _c.roundRect(barX, barY + barH - fillH, barW, fillH, 3); _c.fill(); _c.shadowBlur = 0;
      }
      _c.fillStyle = 'rgba(255,255,255,0.65)'; _c.font = "600 13px 'Helvetica Neue',sans-serif";
      _c.textAlign = 'center'; _c.fillText(`${gs.score}`, barX + barW / 2, barY + barH + 18);
    }

    // ── Menu ──
    if (gs.phase === 'menu') {
      gs.menuPulse += 0.018;
      const mc = _cfg.MENU_COLOR || [50, 25, 80];
      const mt = _cfg.MENU_TEXT_COLOR || [253, 224, 71];
      const btnW = 140, btnH = 34, btnX = (cw - btnW) / 2, btnY = ch - 55;
      _c.fillStyle = `rgba(${mc[0]},${mc[1]},${mc[2]},0.85)`;
      _c.beginPath(); _c.roundRect(btnX, btnY, btnW, btnH, 17); _c.fill();
      _c.fillStyle = `rgba(${mt[0]},${mt[1]},${mt[2]},${0.8 + Math.sin(gs.menuPulse) * 0.2})`;
      _c.font = "600 13px 'Helvetica Neue',sans-serif";
      _c.textAlign = 'center'; _c.fillText('tap to begin', cw / 2, btnY + btnH / 2 + 4);
    }

    // ── Ending transition ──
    if (gs.phase === 'ending') {
      gs.endT += 0.005;
      const t = Math.min(gs.endT, 1);

      if (!gs.rainFaded && t > 0.2) {
        if (_hooks && _hooks.fadeRain) _hooks.fadeRain();
        gs.rainFaded = true;
      }

      const ec = _cfg.ENDING_BG || [[8, 6, 14], [12, 8, 20]];
      const r1 = Math.floor(ec[0][0] + (18 - ec[0][0]) * t);
      const g1 = Math.floor(ec[0][1] + (12 - ec[0][1]) * t);
      const b1 = Math.floor(ec[0][2] + (30 - ec[0][2]) * t);
      const r2 = Math.floor(ec[1][0] + (25 - ec[1][0]) * t);
      const g2 = Math.floor(ec[1][1] + (15 - ec[1][1]) * t);
      const b2 = Math.floor(ec[1][2] + (40 - ec[1][2]) * t);
      const tbg = _c.createLinearGradient(0, 0, 0, ch);
      tbg.addColorStop(0, `rgb(${r1},${g1},${b1})`); tbg.addColorStop(1, `rgb(${r2},${g2},${b2})`);
      _c.fillStyle = tbg; _c.fillRect(0, 0, cw, ch);

      for (let i = gs.drops.length - 1; i >= 0; i--) {
        const d = gs.drops[i];
        if (d.isGlowing) continue;
        d.opacity *= 0.95;
        if (d.opacity < 0.003) { gs.drops.splice(i, 1); continue; }
        _c.save(); _c.strokeStyle = `rgba(180,160,220,${d.opacity})`; _c.lineWidth = d.width; _c.lineCap = 'round';
        _c.beginPath(); _c.moveTo(d.x, d.y - d.length / 2); _c.lineTo(d.x, d.y + d.length / 2); _c.stroke(); _c.restore();
        d.y += d.speed;
      }

      if (t > 0.3) {
        if (!gs.rbPs || gs.rbPs.length === 0) {
          gs.rbPs = [];
          const cols = _cfg.ENDING_PARTICLES || ['#c084fc', '#e879f9', '#fbbf24', '#f59e0b', '#60a5fa'];
          for (let i = 0; i < 100; i++) gs.rbPs.push({
            x: Math.random() * cw, y: Math.random() * ch,
            size: 2 + Math.random() * 5,
            color: cols[Math.floor(Math.random() * cols.length)],
            speed: 0.15 + Math.random() * 0.4,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpd: 0.008 + Math.random() * 0.015,
            opacity: 0, target: 0.4 + Math.random() * 0.4,
            shape: Math.random() > 0.5 ? 'c' : 'd',
          });
        }
        const po = (t - 0.3) / 0.7;
        gs.rbPs.forEach(p => {
          p.wobble += p.wobbleSpd; p.y -= p.speed * 0.3; p.x += Math.sin(p.wobble) * 0.3;
          if (p.y < -10) p.y = ch + 10;
          _c.save(); _c.globalAlpha = p.target * po * 0.5; _c.fillStyle = p.color;
          if (p.shape === 'c') { _c.beginPath(); _c.arc(p.x, p.y, p.size, 0, Math.PI * 2); _c.fill(); }
          else { _c.translate(p.x, p.y); _c.rotate(Math.PI / 4); _c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); }
          _c.restore();
        });
      }

      if (gs.endT > 1.3) { gs.phase = 'quote'; gs.quoteStartTime = Date.now(); }
    }

    // ── Quote screen ──
    if (gs.phase === 'quote') {
      const qc = _cfg.QUOTE_BG || ['#0a0d14', '#101520', '#120f1e'];
      const rg = _c.createLinearGradient(0, 0, 0, ch);
      rg.addColorStop(0, qc[0]); rg.addColorStop(0.5, qc[1]); rg.addColorStop(1, qc[2]);
      _c.fillStyle = rg; _c.fillRect(0, 0, cw, ch);

      if (gs.rbPs) gs.rbPs.forEach(p => {
        p.wobble += p.wobbleSpd; p.y -= p.speed * 0.2; p.x += Math.sin(p.wobble) * 0.25;
        if (p.opacity < p.target) p.opacity += 0.006;
        if (p.y < -10) { p.y = ch + 10; p.x = Math.random() * cw; }
        _c.save(); _c.globalAlpha = p.opacity * 0.7; _c.fillStyle = p.color;
        if (p.shape === 'c') { _c.beginPath(); _c.arc(p.x, p.y, p.size, 0, Math.PI * 2); _c.fill(); }
        else { _c.translate(p.x, p.y); _c.rotate(Math.PI / 4); _c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); }
        _c.restore();
      });

      const quoteAge = (Date.now() - gs.quoteStartTime) / 1000;
      const quoteFade = quoteAge < 7 ? 1 : Math.max(0, 1 - (quoteAge - 7) / 2);

      if (quoteFade > 0 && gs.endQuote) {
        _c.save();
        _c.font = "italic 600 22px 'Helvetica Neue',sans-serif";
        const maxW = cw * 0.72;
        const words = gs.endQuote.split(' ');
        let lines = [], cur = '';
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (_c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
          else cur = test;
        }
        if (cur) lines.push(cur);
        const lh = 34, padX = 28, padY = 18;
        let maxLineW = 0;
        lines.forEach(l => { const w = _c.measureText(l).width; if (w > maxLineW) maxLineW = w; });
        const pillW = maxLineW + padX * 2, pillH = lines.length * lh + padY * 2;
        const pillX = (cw - pillW) / 2, pillY = ch / 2 - pillH / 2;

        const qpc = _cfg.QUOTE_PILL || 'rgba(20,12,40,0.75)';
        const qbc = _cfg.QUOTE_BORDER || 'rgba(180,140,255,0.3)';
        const qtc = _cfg.QUOTE_TEXT || 'rgba(235,225,255,0.95)';
        _c.globalAlpha = quoteFade * 0.88;
        _c.fillStyle = qpc;
        _c.beginPath(); _c.roundRect(pillX, pillY, pillW, pillH, 14); _c.fill();
        _c.globalAlpha = quoteFade * 0.5;
        _c.strokeStyle = qbc; _c.lineWidth = 1; _c.stroke();
        _c.globalAlpha = quoteFade;
        _c.fillStyle = qtc; _c.textAlign = 'center'; _c.textBaseline = 'middle';
        lines.forEach((l, i) => _c.fillText(l, cw / 2, pillY + padY + lh * 0.5 + i * lh));
        _c.restore();
      }

      const mc = _cfg.MENU_COLOR || [50, 25, 80];
      const mt = _cfg.MENU_TEXT_COLOR || [253, 224, 71];
      const btnW = 120, btnH = 34, btnY = ch - 55, gap = 16;
      const totalW = btnW * 2 + gap;
      const btn1X = (cw - totalW) / 2;
      const btn2X = btn1X + btnW + gap;

      _c.fillStyle = `rgba(${mc[0]},${mc[1]},${mc[2]},0.85)`;
      _c.beginPath(); _c.roundRect(btn1X, btnY, btnW, btnH, 17); _c.fill();
      _c.fillStyle = `rgba(${mt[0]},${mt[1]},${mt[2]},0.95)`;
      _c.font = "600 13px 'Helvetica Neue',sans-serif"; _c.textAlign = 'center';
      _c.fillText('replay', btn1X + btnW / 2, btnY + btnH / 2 + 4);

      _c.fillStyle = `rgba(${mc[0]},${mc[1]},${mc[2]},0.85)`;
      _c.beginPath(); _c.roundRect(btn2X, btnY, btnW, btnH, 17); _c.fill();
      _c.fillStyle = `rgba(${mt[0]},${mt[1]},${mt[2]},0.95)`;
      _c.fillText('home', btn2X + btnW / 2, btnY + btnH / 2 + 4);
    }

    // ── Exit button ──
    if (gs.phase === 'playing' || gs.phase === 'ending') {
      const exitW = 50, exitH = 28, exitX = 12, exitY = ch - 44;
      _c.fillStyle = 'rgba(20,20,20,0.7)';
      _c.beginPath(); _c.roundRect(exitX, exitY, exitW, exitH, 14); _c.fill();
      _c.fillStyle = 'rgba(180,180,175,0.6)';
      _c.font = "600 12px 'Helvetica Neue',sans-serif"; _c.textAlign = 'center';
      _c.fillText('exit', exitX + exitW / 2, exitY + exitH / 2 + 4);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  function init(canvasEl, cfg, hooks) {
    _cv = canvasEl;
    _c = _cv.getContext('2d');
    _cfg = cfg;
    _hooks = hooks;
    _glowEnabled = true;
    // Sync button UI to ON state (done again below after button is found)
    _quoteIndex = 0;

    // Reset game state
    Object.assign(gs, {
      drops: [], catchPs: [], ripples: [],
      score: 0, phase: 'menu',
      lastRain: 0, nextGlow: 0,
      cloudOff: 0, menuPulse: 0,
      endT: 0, endQuote: '',
      rainFaded: false, rbPs: null,
      quoteStartTime: 0,
    });

    ensureRoundRect(_c);
    resize();

    // Glow toggle
    _glowToggleBtn = document.getElementById('glowToggle');
    _glowToggleLabel = document.getElementById('glowToggleLabel');
    // Reset UI to ON
    if (_glowToggleBtn) _glowToggleBtn.classList.remove('off');
    if (_glowToggleLabel) _glowToggleLabel.textContent = 'ON';
    if (_glowToggleBtn) {
      _glowToggleBtn.onclick = (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        setGlowEnabled(!_glowEnabled);
        if (_hooks && _hooks.onFirstTap) _hooks.onFirstTap();
      };
    }

    // Input
    _cv.addEventListener('click', tap);
    _cv.addEventListener('touchstart', tap, { passive: false });

    // Resize
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 60));

    scheduleGlow();
    _lastTick = Date.now();
    loop();
  }

  function stop() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_cv) {
      _cv.removeEventListener('click', tap);
      _cv.removeEventListener('touchstart', tap);
    }
    window.removeEventListener('resize', resize);
  }

  return { init, stop, getSize };

})();
