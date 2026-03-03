/**
 * shared/audio-engine.js
 * Raindrops — Shared Audio Engine
 *
 * Owns the single AudioContext for the whole app.
 * Scenes request tracks by name; the engine loads once and crossfades.
 *
 * Public API:
 *   AudioEngine.unlock()                        — call on first user gesture
 *   AudioEngine.playScene(trackDefs)            — start/crossfade scene tracks
 *   AudioEngine.stopScene()                     — stop all active scene tracks
 *   AudioEngine.setMenuLevel()                  — quiet background level
 *   AudioEngine.setSceneLevel(id, vol)          — set track volume
 *   AudioEngine.fadeOut(duration)               — fade everything to 0
 *   AudioEngine.resetLevel()                    — restore to full volume
 *   AudioEngine.chime()                         — generic chime (overridden per scene)
 */

const AudioEngine = (() => {

  const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const CROSSFADE_DUR = 3.0;

  let _actx = null;
  let _started = false;
  let _masterGain = null;

  // Buffer cache: src -> AudioBuffer
  const _buffers = {};

  // Active track state: id -> { gainNode, src, timer, buffer, targetVol }
  const _tracks = {};

  // ─── Init AudioContext ────────────────────────────────────────────────────────

  function _initContext() {
    if (_started) return;
    try {
      _actx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _actx.createGain();
      _masterGain.gain.value = 1.0;
      _masterGain.connect(_actx.destination);
      _started = true;
    } catch (e) {
      console.warn('[AudioEngine] WebAudio not available:', e);
    }
  }

  // ─── Buffer loading ───────────────────────────────────────────────────────────

  function _loadBuffer(src) {
    return new Promise((resolve, reject) => {
      if (_buffers[src]) { resolve(_buffers[src]); return; }
      fetch(src)
        .then(r => { if (!r.ok) throw new Error('fetch failed: ' + src); return r.arrayBuffer(); })
        .then(ab => _actx.decodeAudioData(ab))
        .then(buf => { _buffers[src] = buf; resolve(buf); })
        .catch(e => { console.warn('[AudioEngine] Load failed:', src, e); reject(e); });
    });
  }

  // ─── Crossfade loop for one track ────────────────────────────────────────────

  function _scheduleNext(trackId, startAt) {
    const track = _tracks[trackId];
    if (!track || !track.buffer || !track.gainNode || !_actx) return;

    const dur = track.buffer.duration;
    const src = _actx.createBufferSource();
    src.buffer = track.buffer;

    const srcGain = _actx.createGain();
    srcGain.gain.setValueAtTime(0, startAt);
    srcGain.gain.linearRampToValueAtTime(1, startAt + CROSSFADE_DUR);
    const fadeOutAt = startAt + dur - CROSSFADE_DUR;
    srcGain.gain.setValueAtTime(1, fadeOutAt);
    srcGain.gain.linearRampToValueAtTime(0, startAt + dur);

    src.connect(srcGain);
    srcGain.connect(track.gainNode);
    src.start(startAt);
    src.stop(startAt + dur);

    track.src = src;
    const delay = Math.max(0, (startAt + dur - CROSSFADE_DUR - _actx.currentTime) * 1000);
    track.timer = setTimeout(() => _scheduleNext(trackId, _actx.currentTime), delay);
  }

  function _startTrack(trackId) {
    if (!_actx) return;
    _scheduleNext(trackId, _actx.currentTime);
  }

  function _stopTrack(trackId) {
    const track = _tracks[trackId];
    if (!track) return;
    if (track.timer) { clearTimeout(track.timer); track.timer = null; }
    if (track.src) { try { track.src.stop(); } catch (e) {} track.src = null; }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  /**
   * Call on first user gesture to unlock WebAudio on mobile.
   */
  function unlock() {
    if (!_started) _initContext();
    if (_actx && _actx.state === 'suspended') {
      _actx.resume().catch(() => {});
    }
  }

  /**
   * Start playing a scene's tracks.
   * trackDefs: Array of { id, src, volume }
   * e.g. [{ id: 'rain', src: 'audio/rain.mp3', volume: 1.0 }, ...]
   */
  function playScene(trackDefs) {
    if (!_started) _initContext();
    if (!_actx) return;

    // Stop any tracks not in the new scene
    const newIds = trackDefs.map(t => t.id);
    for (const id of Object.keys(_tracks)) {
      if (!newIds.includes(id)) {
        _stopTrack(id);
        if (_tracks[id].gainNode) _tracks[id].gainNode.disconnect();
        delete _tracks[id];
      }
    }

    // Start or continue each track
    for (const def of trackDefs) {
      const vol = def.volume * (IS_MOBILE ? 1.0 : 0.7);

      if (_tracks[def.id]) {
        // Already playing — just adjust volume
        _tracks[def.id].gainNode.gain.setTargetAtTime(vol, _actx.currentTime, 0.1);
        continue;
      }

      // New track
      const gainNode = _actx.createGain();
      gainNode.gain.value = vol;
      gainNode.connect(_masterGain);

      _tracks[def.id] = { gainNode, src: null, timer: null, buffer: null, targetVol: vol };

      _loadBuffer(def.src).then(buf => {
        if (_tracks[def.id]) {
          _tracks[def.id].buffer = buf;
          _startTrack(def.id);
        }
      }).catch(() => {});
    }
  }

  /**
   * Stop all active scene tracks gracefully.
   */
  function stopScene() {
    for (const id of Object.keys(_tracks)) {
      _stopTrack(id);
      if (_tracks[id].gainNode) _tracks[id].gainNode.disconnect();
      delete _tracks[id];
    }
  }

  /**
   * Set a specific track's volume (e.g. during ending fade).
   */
  function setTrackVolume(id, vol, rampTime = 2.0) {
    if (!_actx || !_tracks[id]) return;
    _tracks[id].gainNode.gain.cancelScheduledValues(_actx.currentTime);
    _tracks[id].gainNode.gain.linearRampToValueAtTime(vol, _actx.currentTime + rampTime);
  }

  /**
   * Fade all scene audio out (e.g. during ending).
   */
  function fadeOut(duration = 4.0) {
    if (!_actx) return;
    for (const id of Object.keys(_tracks)) {
      setTrackVolume(id, 0, duration);
    }
  }

  /**
   * Restore all tracks to their target volume.
   */
  function resetLevels() {
    if (!_actx) return;
    for (const id of Object.keys(_tracks)) {
      const track = _tracks[id];
      track.gainNode.gain.cancelScheduledValues(_actx.currentTime);
      track.gainNode.gain.linearRampToValueAtTime(track.targetVol, _actx.currentTime + 1);
    }
  }

  /**
   * Set menu ambience level (quieter).
   */
  function setMenuLevel() {
    if (!_actx) return;
    for (const id of Object.keys(_tracks)) {
      const track = _tracks[id];
      const quietVol = track.targetVol * 0.35;
      track.gainNode.gain.setTargetAtTime(quietVol, _actx.currentTime, 0.3);
    }
  }

  /**
   * Simple synth chime — used as fallback, scenes override with their own.
   */
  function chime() {
    if (!_actx) return;
    const freqs = [1568, 2093, 2637, 3136, 3520];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    [f, f * 1.002].forEach((freq, i) => {
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(i === 0 ? 0.09 : 0.03, _actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, _actx.currentTime + 0.8);
      o.connect(g); g.connect(_actx.destination); o.start(); o.stop(_actx.currentTime + 0.8);
    });
  }

  /**
   * End-of-game ascending chord.
   */
  function playEnd() {
    if (!_actx) return;
    [261.6, 329.6, 392, 523.2].forEach((f, i) => {
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, _actx.currentTime + i * 0.3);
      g.gain.linearRampToValueAtTime(0.025, _actx.currentTime + i * 0.3 + 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, _actx.currentTime + i * 0.3 + 4);
      o.connect(g); g.connect(_actx.destination);
      o.start(_actx.currentTime + i * 0.3);
      o.stop(_actx.currentTime + i * 0.3 + 4);
    });
  }

  /**
   * Handle app going to background (mobile).
   */
  function suspend() {
    if (_actx && _actx.state === 'running') _actx.suspend().catch(() => {});
  }

  function resume() {
    if (_actx && _actx.state === 'suspended') _actx.resume().catch(() => {});
  }

  // Visibility / lifecycle hooks
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend(); else resume();
  });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pause', suspend);   // Capacitor
  window.addEventListener('resume', resume);   // Capacitor

  return {
    unlock,
    playScene,
    stopScene,
    setTrackVolume,
    fadeOut,
    resetLevels,
    setMenuLevel,
    chime,
    playEnd,
    suspend,
    resume,
  };

})();
