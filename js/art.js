/* art.js — inline SVG artwork for Quest Academy: the academy crest, student
   avatars (boy / girl), the owl mascot, the three subject badges and stars. */
(function () {
  "use strict";

  // Points of a 5-pointed star centred on (cx, cy).
  function starPoints(cx, cy, R, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (-90 + i * 36) * Math.PI / 180;
      const rad = i % 2 ? r : R;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + "," + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return pts.join(" ");
  }

  // Academy crest — navy shield, gold star, open book striped in the three subject colours.
  function crest() {
    return `
<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="qaGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#c98a1b"/></linearGradient>
    <linearGradient id="qaNavy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a86"/><stop offset="1" stop-color="#0f1844"/></linearGradient>
  </defs>
  <path d="M60 8 L106 22 V62 C106 96 86 120 60 132 C34 120 14 96 14 62 V22 Z" fill="url(#qaNavy)" stroke="url(#qaGold)" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="${starPoints(60, 46, 15, 6.4)}" fill="url(#qaGold)"/>
  <path d="M28 80 q16 -8 32 0 v32 q-16 -8 -32 0 z" fill="#f5f2e8"/>
  <path d="M92 80 q-16 -8 -32 0 v32 q16 -8 32 0 z" fill="#e4dfcc"/>
  <path d="M60 80 v32" stroke="#c98a1b" stroke-width="2"/>
  <path d="M34 89 q10 -4 20 0" stroke="#a78bfa" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M34 96 q10 -4 20 0" stroke="#34d399" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M34 103 q10 -4 20 0" stroke="#fbbf24" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M66 89 q10 -4 20 0" stroke="#a78bfa" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M66 96 q10 -4 20 0" stroke="#34d399" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M66 103 q10 -4 20 0" stroke="#fbbf24" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</svg>`;
  }

  // Student in academy blazer + mortarboard. gender: "boy" | "girl"
  function student(gender) {
    const girl = gender === "girl";
    const hairBack = girl
      ? '<path d="M24 34 q-7 18 -2 32 l7 -4 q-3 -14 2 -26 z" fill="#2b1a0c"/>' +
        '<path d="M56 34 q7 18 2 32 l-7 -4 q3 -14 -2 -26 z" fill="#2b1a0c"/>'
      : "";
    const fringe = girl
      ? '<path d="M25.5 38 q3 -13 14.5 -13 q11.5 0 14.5 13 q-5 -7 -14.5 -7 q-9.5 0 -14.5 7 z" fill="#2b1a0c"/>'
      : '<path d="M25.5 37 q2 -12 14.5 -12 q12.5 0 14.5 12 q-4 -4 -9 -4 l-3 3 -3 -3 q-6 0 -14 4 z" fill="#2b1a0c"/>';
    return `
<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="qaBlazer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34459a"/><stop offset="1" stop-color="#1a2457"/></linearGradient>
  </defs>
  ${hairBack}
  <rect x="28" y="98" width="9" height="11" rx="2" fill="#141b3f"/>
  <rect x="43" y="98" width="9" height="11" rx="2" fill="#141b3f"/>
  <path d="M24 58 h32 q7 0 7 8 v28 q0 6 -6 6 h-34 q-6 0 -6 -6 v-28 q0 -8 7 -8 z" fill="url(#qaBlazer)"/>
  <path d="M33 58 L40 73 L47 58 z" fill="#f5f2e8"/>
  <path d="M38.4 60 h3.2 l1.6 11 -3.2 4.4 -3.2 -4.4 z" fill="#f2c14e"/>
  <path d="M26 66 l7 -8 M54 66 l-7 -8" stroke="#f2c14e" stroke-width="1.6"/>
  <circle cx="51.5" cy="76" r="3" fill="#f2c14e"/>
  <rect x="11" y="62" width="8" height="26" rx="4" fill="#26337a"/>
  <rect x="61" y="62" width="8" height="26" rx="4" fill="#26337a"/>
  <circle cx="15" cy="89" r="4" fill="#e8b98d"/>
  <circle cx="65" cy="89" r="4" fill="#e8b98d"/>
  <circle cx="40" cy="41" r="15" fill="#e8b98d"/>
  ${fringe}
  <circle cx="35" cy="42" r="1.9" fill="#2b1a0c"/>
  <circle cx="45" cy="42" r="1.9" fill="#2b1a0c"/>
  <circle cx="31.5" cy="47" r="2.2" fill="#f2a08a" opacity=".6"/>
  <circle cx="48.5" cy="47" r="2.2" fill="#f2a08a" opacity=".6"/>
  <path d="M35 48.5 q5 4 10 0" stroke="#2b1a0c" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M28 25 v6 q12 5 24 0 v-6 L40 30 Z" fill="#1f2a5c"/>
  <path d="M40 12 L67 21.5 L40 31 L13 21.5 Z" fill="#141b3f"/>
  <path d="M40 21.5 L61 25 v9" stroke="#f2c14e" stroke-width="1.6" fill="none"/>
  <circle cx="61" cy="35" r="2.4" fill="#f2c14e"/>
</svg>`;
  }

  // Owl mascot in a mortarboard — "coming soon" screens and results.
  function owl() {
    return `
<svg viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="60" cy="72" rx="34" ry="38" fill="#6b4f2a"/>
  <path d="M27 66 q-7 24 8 36 q5 -20 -8 -36 z" fill="#57401f"/>
  <path d="M93 66 q7 24 -8 36 q-5 -20 8 -36 z" fill="#57401f"/>
  <ellipse cx="60" cy="84" rx="21" ry="22" fill="#dcc49e"/>
  <path d="M50 78 q3 3 6 0 M64 78 q3 3 6 0 M53 88 q3 3 6 0 M61 88 q3 3 6 0 M57 97 q3 3 6 0" stroke="#b49770" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <circle cx="46" cy="56" r="13" fill="#fff"/>
  <circle cx="74" cy="56" r="13" fill="#fff"/>
  <circle cx="47.5" cy="57" r="6" fill="#1b1b2f"/>
  <circle cx="72.5" cy="57" r="6" fill="#1b1b2f"/>
  <circle cx="49.5" cy="55" r="2" fill="#fff"/>
  <circle cx="74.5" cy="55" r="2" fill="#fff"/>
  <path d="M55.5 66 L64.5 66 L60 74 Z" fill="#f2c14e"/>
  <path d="M50 108 l-4 7 M50 108 v8 M50 108 l4 7 M70 108 l-4 7 M70 108 v8 M70 108 l4 7" stroke="#f2c14e" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M44 36 v7 q16 6 32 0 v-7 L60 41 Z" fill="#1f2a5c"/>
  <path d="M60 20 L92 31 L60 42 L28 31 Z" fill="#141b3f"/>
  <path d="M60 31 L86 35 v11" stroke="#f2c14e" stroke-width="2" fill="none"/>
  <circle cx="86" cy="47" r="3" fill="#f2c14e"/>
</svg>`;
  }

  // Subject badges.
  function subject(id) {
    if (id === "english") return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="50" cy="50" r="47" fill="#a78bfa" opacity=".16"/>
  <path d="M15 32 q17.5 -9 35 0 v42 q-17.5 -9 -35 0 z" fill="#f1edff"/>
  <path d="M85 32 q-17.5 -9 -35 0 v42 q17.5 -9 35 0 z" fill="#ddd6fe"/>
  <path d="M50 32 v42" stroke="#6d28d9" stroke-width="2.5"/>
  <path d="M12 76 q19 -9 38 0 q19 -9 38 0" stroke="#7c3aed" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <text x="33" y="62" font-family="Georgia,serif" font-size="24" font-weight="800" fill="#6d28d9" text-anchor="middle">A</text>
  <text x="67" y="62" font-family="Georgia,serif" font-size="24" font-weight="800" fill="#6d28d9" text-anchor="middle">a</text>
</svg>`;
    if (id === "bahasa") {
      const petal = 'd="M0 -3 C -15 -12 -16 -34 0 -38 C 16 -34 15 -12 0 -3 Z"';
      return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="50" cy="50" r="47" fill="#34d399" opacity=".16"/>
  <path d="M50 52 q26 2 34 26 q-26 2 -34 -26 z" fill="#059669"/>
  <path d="M50 52 q-24 6 -30 30 q24 -4 30 -30 z" fill="#10b981"/>
  <g transform="translate(50 50)">
    ${[0, 72, 144, 216, 288].map(r => `<path ${petal} fill="${r % 144 ? "#e11d48" : "#f43f5e"}" transform="rotate(${r})"/>`).join("")}
    <circle r="7" fill="#9f1239"/>
    <path d="M0 0 L13 -17" stroke="#fde68a" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="13" cy="-17" r="3.4" fill="#fbbf24"/>
  </g>
</svg>`;
    }
    if (id === "maths") return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="50" cy="50" r="47" fill="#fbbf24" opacity=".16"/>
  <rect x="19" y="19" width="28" height="28" rx="7" fill="#fbbf24"/>
  <rect x="53" y="19" width="28" height="28" rx="7" fill="#f97316"/>
  <rect x="19" y="53" width="28" height="28" rx="7" fill="#f97316"/>
  <rect x="53" y="53" width="28" height="28" rx="7" fill="#fbbf24"/>
  <g stroke="#1a2457" stroke-width="4.2" stroke-linecap="round" fill="none">
    <path d="M33 25.5 v15 M25.5 33 h15"/>
    <path d="M59.5 33 h15"/>
    <path d="M27.5 61.5 l11 11 M38.5 61.5 l-11 11"/>
    <path d="M59.5 67 h15"/>
  </g>
  <circle cx="67" cy="60" r="2.5" fill="#1a2457"/>
  <circle cx="67" cy="74" r="2.5" fill="#1a2457"/>
</svg>`;
    return crest();
  }

  // Gold coin used for points.
  function coin(size) {
    const s = size || 16;
    return `<svg class="coin" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.5" fill="#d99a1e"/><circle cx="12" cy="12" r="9" fill="#f7c948" stroke="#c98a1b" stroke-width="1"/><polygon points="${starPoints(12, 12.6, 5.8, 2.5)}" fill="#c98a1b"/></svg>`;
  }

  // Badge medal (silver / gold). Icons: "ninja" = crossed swords making a ×,
  // "wizard" = wizard hat with a ×, anything else = a star. earned === false → greyed out.
  function badge(id, size, earned) {
    const b = (window.DATA && DATA.BADGES && DATA.BADGES[id]) || { tier: "silver", icon: "star" };
    const s = size || 40;
    const gold = b.tier === "gold";
    const c1 = gold ? "#ffe08a" : "#f8fafc", c2 = gold ? "#c98a1b" : "#94a3b8", rim = gold ? "#9a6510" : "#5b6b82";
    const icon = b.icon === "ninja"
      ? `<g stroke-linecap="round">
          <path d="M18 15 40 37M46 15 24 37" stroke="#334155" stroke-width="4.6"/>
          <path d="M18 15 40 37M46 15 24 37" stroke="#e2e8f0" stroke-width="2.6"/>
          <path d="M37 40.5 43.5 34M27 40.5 20.5 34" stroke="#b45309" stroke-width="3.2"/>
          <path d="M40 37 45.5 42.5M24 37 18.5 42.5" stroke="#111827" stroke-width="4"/>
        </g>
        <circle cx="32" cy="28.5" r="10.5" fill="#1e293b"/>
        <rect x="22.5" y="20.5" width="19" height="3.2" rx="1.6" fill="#dc2626"/>
        <path d="M41 21.5c3 -1.5 5 -1 6.5 0.5c-2 0.4 -3.6 1.4 -4.5 3z" fill="#dc2626"/>
        <rect x="23.5" y="25.5" width="17" height="6.2" rx="3.1" fill="#f5cfa6"/>
        <circle cx="28.6" cy="28.6" r="1.5" fill="#111827"/>
        <circle cx="35.4" cy="28.6" r="1.5" fill="#111827"/>
        <path d="M26.6 26.6l3 .8M37.4 26.6l-3 .8" stroke="#111827" stroke-width="1" stroke-linecap="round"/>`
      : b.icon === "wizard"
      ? `<path d="M32 10.5 22.5 36h19z" fill="#6d28d9" stroke="#4c1d95" stroke-width="1.2" stroke-linejoin="round"/>
        <ellipse cx="32" cy="37" rx="13.5" ry="3.4" fill="#4c1d95"/>
        <path d="M29 24.5l6 6M35 24.5l-6 6" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round"/>
        <polygon points="${starPoints(44.5, 17, 3.8, 1.6)}" fill="#fff"/>
        <polygon points="${starPoints(19.5, 23, 2.7, 1.1)}" fill="#fff"/>`
      : `<polygon points="${starPoints(32, 30.5, 11, 4.8)}" fill="${rim}"/>`;
    const gid = gold ? "qaBadgeGold" : "qaBadgeSilver";
    return `<svg class="badge-medal${earned === false ? " locked" : ""}" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <path d="M21 42 15 62l8.5-3.5L28 64l6-19z" fill="#3b82f6"/>
      <path d="M43 42l6 20-8.5-3.5L36 64l-6-19z" fill="#ef4444"/>
      <circle cx="32" cy="30" r="21" fill="url(#${gid})" stroke="${rim}" stroke-width="2.5"/>
      <circle cx="32" cy="30" r="16.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
      ${icon}
    </svg>`;
  }

  // Row of 3 stars, `n` of them lit.
  function stars(n, size) {
    const s = size || 22;
    let out = "";
    for (let i = 0; i < 3; i++) {
      out += `<svg class="star ${i < n ? "on" : "off"}" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><polygon points="${starPoints(12, 12.8, 11, 4.8)}"/></svg>`;
    }
    return `<span class="stars" aria-label="${n} of 3 stars">${out}</span>`;
  }

  window.ART = {
    crest, student, owl, subject, stars, coin, badge,
    player: function (_pose, gender) { return student(gender); }
  };
})();
