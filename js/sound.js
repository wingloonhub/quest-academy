/* sound.js — tiny synthesised sound effects (no audio files).
   Browsers need a user gesture before audio plays — ensureCtx() handles it. */
(function () {
  "use strict";
  let ctx = null;
  let masterGain = null;
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) { } }
    return ctx;
  }

  // One tone with an optional pitch glide and a short envelope.
  function tone(opts) {
    const c = ensureCtx(); if (!c) return;
    const now = c.currentTime + (opts.delay || 0);
    const dur = opts.duration || 0.2;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq, now);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(opts.vol || 0.2, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  const SOUNDS = {
    click()   { tone({ type: "square", freq: 520, duration: 0.05, vol: 0.08 }); },
    correct() {
      tone({ type: "triangle", freq: 660,  duration: 0.10, vol: 0.20 });
      tone({ type: "triangle", freq: 880,  duration: 0.12, vol: 0.20, delay: 0.08 });
      tone({ type: "triangle", freq: 1175, duration: 0.18, vol: 0.20, delay: 0.18 });
    },
    wrong()   { tone({ type: "square", freq: 220, freqEnd: 110, duration: 0.30, vol: 0.18 }); },
    star()    {
      tone({ type: "triangle", freq: 1318, duration: 0.10, vol: 0.20 });
      tone({ type: "triangle", freq: 1760, duration: 0.18, vol: 0.20, delay: 0.08 });
    },
    win()     {
      [523.25, 659.26, 783.99, 1046.50].forEach((f, i) =>
        tone({ type: "triangle", freq: f, duration: 0.22, vol: 0.18, delay: i * 0.10 }));
    },
    tick()    { tone({ type: "square", freq: 1200, duration: 0.04, vol: 0.10 }); },
    coin()    {
      tone({ type: "square", freq: 988,  duration: 0.07, vol: 0.14 });
      tone({ type: "square", freq: 1318, duration: 0.14, vol: 0.14, delay: 0.06 });
      tone({ type: "square", freq: 1760, duration: 0.18, vol: 0.12, delay: 0.14 });
    },
    finish()  {
      [392.00, 523.25, 659.26].forEach((f, i) =>
        tone({ type: "triangle", freq: f, duration: 0.20, vol: 0.16, delay: i * 0.12 }));
    }
  };

  let muted = false;
  try { muted = localStorage.getItem("qa_muted") === "1"; } catch (e) { }

  window.SOUND = {
    play(name) { if (muted) return; if (SOUNDS[name]) SOUNDS[name](); },
    isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem("qa_muted", muted ? "1" : "0"); } catch (e) { }
      if (!muted) ensureCtx();
      return muted;
    },
    // Call once on an early user gesture so later sounds aren't blocked.
    unlock() { ensureCtx(); }
  };
})();
