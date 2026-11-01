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

  // The Multiple Blaster cannon, pointing up.
  function blaster() {
    return `<svg viewBox="0 0 44 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="18" y="2" width="8" height="21" rx="3" fill="#e2e8f0" stroke="#475569" stroke-width="1.4"/>
      <circle cx="22" cy="4" r="2.6" fill="#22d3ee"/>
      <path d="M8 40 12 23q10 -7 20 0l4 17z" fill="#38bdf8" stroke="#0c4a6e" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="22" cy="30" r="4.5" fill="#fde68a" stroke="#0c4a6e" stroke-width="1.3"/>
    </svg>`;
  }

  // Divide & Conquer: the player's hero, facing right. gender: "boy" | "girl"
  function hero(gender) {
    const girl = gender === "girl";
    const skin = "#f0c39a", hair = girl ? "#5b2c0e" : "#2b1a0c", tunic = girl ? "#c026d3" : "#2563eb", dark = girl ? "#86198f" : "#1e3a8a", cape = girl ? "#f472b6" : "#ef4444";
    const hairBack = girl
      ? `<path d="M34 34q-8 30 0 52l15-7q-8-18-4-42z" fill="${hair}"/><path d="M36 22q-24 8-20 46 2 10 8 12 8-22 16-40z" fill="${hair}"/><rect x="29" y="19" width="12" height="7" rx="3" fill="#f2c14e" transform="rotate(-25 35 22)"/>`
      : "";
    const hairTop = girl
      ? `<path d="M35 38q-4-28 24-30 28 2 24 30-3-10-12-13-16 6-36 13z" fill="${hair}"/><path d="M44 12l6 7 9-10 9 10 6-7 1 10H43z" fill="#f2c14e" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/>`
      : `<path d="M35 38q-5-30 24-31 29 1 24 31-3-9-9-13l-5 6-6-9-7 8-5-6q-11 4-16 14z" fill="${hair}"/>`;
    return `<svg viewBox="0 0 136 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your hero">
      <path d="M40 66Q12 94 16 130l36-14z" fill="${cape}" stroke="${dark}" stroke-width="1.6" stroke-linejoin="round"/>
      ${hairBack}
      <rect x="42" y="110" width="13" height="26" rx="4" fill="${dark}"/>
      <rect x="62" y="110" width="13" height="26" rx="4" fill="${dark}"/>
      <path d="M38 134h18v9q0 3-3 3H38q-3 0-3-3 0-9 3-9zM61 134h18q6 0 6 9 0 3-3 3H61z" fill="#7c2d12"/>
      <path d="M38 72q0-11 11-11h20q11 0 11 11v42H38z" fill="${tunic}" stroke="${dark}" stroke-width="1.6"/>
      <rect x="37" y="103" width="44" height="8" rx="2" fill="#f2c14e" stroke="#b45309" stroke-width="1"/>
      <circle cx="59" cy="83" r="10" fill="#fde68a" stroke="#b45309" stroke-width="1.2"/>
      <rect x="52" y="81.8" width="14" height="2.6" rx="1.3" fill="#7c2d12"/><circle cx="59" cy="78" r="1.9" fill="#7c2d12"/><circle cx="59" cy="88.2" r="1.9" fill="#7c2d12"/>
      <circle cx="59" cy="38" r="25" fill="${skin}" stroke="#c08a5e" stroke-width="1.2"/>
      ${hairTop}
      <circle cx="63" cy="39" r="3.4" fill="#1b1b2f"/><circle cx="77" cy="39" r="3.4" fill="#1b1b2f"/>
      <circle cx="64.2" cy="37.8" r="1.1" fill="#fff"/><circle cx="78.2" cy="37.8" r="1.1" fill="#fff"/>
      <path d="M57 32.5q5-3 9-.5M73 32q4-2 8 .5" stroke="${hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M64 50q7 6 14 0" stroke="#7c2d12" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g class="df-arm">
        <path d="M72 70 96 76" stroke="${tunic}" stroke-width="13" stroke-linecap="round"/>
        <circle cx="98" cy="76" r="7.5" fill="${skin}" stroke="#c08a5e" stroke-width="1.2"/>
        <g transform="rotate(24 98 76)">
          <rect x="93.5" y="18" width="9" height="50" fill="#e2e8f0" stroke="#475569" stroke-width="1.4"/>
          <path d="M93.5 18 98 8l4.5 10z" fill="#f8fafc" stroke="#475569" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M98 12v54" stroke="#94a3b8" stroke-width="1.2"/>
          <rect x="85" y="66" width="26" height="6" rx="2.5" fill="#f2c14e" stroke="#b45309" stroke-width="1"/>
          <rect x="94.5" y="72" width="7" height="13" rx="2" fill="#7c2d12"/>
        </g>
      </g>
    </svg>`;
  }

  // Divide & Conquer: the monsters, facing left. art: "mummy" | "brute" | "zombie"
  function monster(art) {
    if (art === "mummy") {
      const wrap = "#b9a988";
      return `<svg viewBox="0 0 150 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A mummy">
        <path d="M108 118q22 14 18 44-10-8-26-26z" fill="#e4d8bb" stroke="${wrap}" stroke-width="1.6"/>
        <path d="M58 136h20v30H58zM88 136h20v30H88z" fill="#e8dcc0" stroke="#8a7a5a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M58 146l20-5M58 157l20-6M88 147l20-5M88 158l20-6" stroke="${wrap}" stroke-width="2.4"/>
        <path d="M52 76q0-20 20-20h22q20 0 20 20v62q0 6-6 6H58q-6 0-6-6z" fill="#e8dcc0" stroke="#8a7a5a" stroke-width="2"/>
        <path d="M52 84q30-14 62-6M52 98q30 8 62-8M52 112q30-14 62-4M52 126q30 8 62-6M52 138q30-8 62 2" stroke="${wrap}" stroke-width="3" fill="none"/>
        <path d="M58 72 20 62q-10-2-12 6t8 11l40 12z" fill="#efe5cd" stroke="#8a7a5a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M30 66l-3 15M44 69l-3 16" stroke="${wrap}" stroke-width="2.4"/>
        <path d="M60 94 22 88q-10-1-11 7t9 10l40 6z" fill="#e8dcc0" stroke="#8a7a5a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M33 90l-2 15M47 92l-2 16" stroke="${wrap}" stroke-width="2.4"/>
        <rect x="46" y="8" width="72" height="62" rx="28" fill="#efe5cd" stroke="#8a7a5a" stroke-width="2"/>
        <path d="M48 26q34-12 68 0M47 60q34 10 70-2M46 40l72-8" stroke="${wrap}" stroke-width="3" fill="none"/>
        <path d="M50 37q32-7 64 0v15q-32 8-64 0z" fill="#2b2118"/>
        <circle cx="66" cy="45" r="7" fill="#facc15"/><circle cx="64" cy="45" r="3" fill="#7f1d1d"/>
        <circle cx="96" cy="45" r="5.5" fill="#facc15"/><circle cx="94.5" cy="45" r="2.4" fill="#7f1d1d"/>
        <path d="M116 22q16 6 18 22-10-2-20-10z" fill="#efe5cd" stroke="${wrap}" stroke-width="1.6"/>
      </svg>`;
    }
    if (art === "brute") {
      const g1 = "#4ade80", g2 = "#16a34a", line = "#14532d";
      return `<svg viewBox="0 0 176 176" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A green monster">
        <path d="M64 130h26l-2 34q0 6-6 6H64q-8 0-8-7zM100 130h26l8 33q0 7-8 7h-18q-6 0-6-6z" fill="${g2}" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M60 116h74l6 26-10 8-8-7-8 9-8-8-8 8-8-8-7 8-8-7-10 6-8-9z" fill="#7c3aed" stroke="#4c1d95" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M42 66q0-24 32-26h42q32 2 34 26l-8 36q-4 18-24 18H74q-20 0-24-18z" fill="${g1}" stroke="${line}" stroke-width="2.4"/>
        <path d="M96 48v34M64 76q16 14 32 2 16 12 34-2M78 96h36M82 108h28" stroke="${g2}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M150 62q20 8 20 34l-4 22" stroke="${line}" stroke-width="30" fill="none" stroke-linecap="round"/>
        <path d="M150 62q20 8 20 34l-4 22" stroke="${g1}" stroke-width="25" fill="none" stroke-linecap="round"/>
        <circle cx="164" cy="128" r="17" fill="${g1}" stroke="${line}" stroke-width="2.4"/>
        <path d="M48 62Q18 72 18 100l6 22" stroke="${line}" stroke-width="30" fill="none" stroke-linecap="round"/>
        <path d="M48 62Q18 72 18 100l6 22" stroke="${g1}" stroke-width="25" fill="none" stroke-linecap="round"/>
        <circle cx="24" cy="132" r="19" fill="${g1}" stroke="${line}" stroke-width="2.4"/>
        <path d="M12 124v12M20 118v16M29 118v16" stroke="${g2}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M68 28q0-24 30-24t30 24v14q-2 16-30 18-28-2-30-18z" fill="${g1}" stroke="${line}" stroke-width="2.4"/>
        <path d="M67 28q-3-26 31-27 34 1 31 27l-8-10-8 6-7-8-8 7-7-7-8 7-8-6z" fill="#111827"/>
        <path d="M72 29l19 5M112 34l-14 1" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="83" cy="36" r="3.4" fill="#fff"/><circle cx="82" cy="36" r="1.7" fill="#111827"/>
        <circle cx="106" cy="38" r="3" fill="#fff"/><circle cx="105" cy="38" r="1.5" fill="#111827"/>
        <path d="M78 46h32l-3 8H82z" fill="#fff" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M86 46v8M94 46v8M102 46v8" stroke="${line}" stroke-width="1.4"/>
      </svg>`;
    }
    const skin = "#a3b18a", line = "#3f4f32", suit = "#1e3a8a";
    const star = starPoints(45, 100, 13, 5.6);
    return `<svg viewBox="0 0 160 172" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A zombie with a shield">
      <path d="M66 128h24v36q0 5-5 5H60q-5 0-5-5zM96 128h24l6 36q0 5-5 5h-20q-5 0-5-5z" fill="${suit}" stroke="#172554" stroke-width="2" stroke-linejoin="round"/>
      <path d="M72 150l14 6-6 13h-14zM110 146l12 12-4 11h-12z" fill="#0f172a"/>
      <path d="M60 74q0-18 18-18h30q18 0 18 18v58l-6-6-7 8-7-8-7 8-7-8-7 8-7-8-8 6z" fill="${suit}" stroke="#172554" stroke-width="2" stroke-linejoin="round"/>
      <path d="M60 104h66v8H60zM60 116h66v8H60z" fill="#dc2626"/>
      <polygon points="${starPoints(93, 84, 12, 5.2)}" fill="#f8fafc"/>
      <path d="M124 72q22 8 20 38" stroke="#172554" stroke-width="20" fill="none" stroke-linecap="round"/>
      <circle cx="144" cy="116" r="10" fill="${skin}" stroke="${line}" stroke-width="2"/>
      <path d="M62 8q30-12 54 4 12 12 8 36-4 22-30 24-28-2-34-24-4-22 2-40z" fill="${skin}" stroke="${line}" stroke-width="2.2"/>
      <path d="M64 12l5 9 7-14 6 12 8-14 6 13 8-11 4 13 11-5" stroke="#1f2937" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="76" cy="36" r="9.5" fill="#f8fafc" stroke="${line}" stroke-width="1.8"/><circle cx="73" cy="37" r="3.6" fill="#b91c1c"/>
      <path d="M97 28l11 11M108 28 97 39" stroke="#1f2937" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M68 54l6 4 5-4 6 5 5-5 6 4 6-5-2 10-8 4-14 0-8-5z" fill="#f8fafc" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M112 16l6 8M116 12l-4 8M112 54l8 2M114 50l2 9" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="45" cy="100" r="42" fill="#dc2626" stroke="#7f1d1d" stroke-width="2.4"/>
      <circle cx="45" cy="100" r="33" fill="#f1f5f9"/>
      <circle cx="45" cy="100" r="24" fill="#dc2626"/>
      <circle cx="45" cy="100" r="16.5" fill="#1d4ed8"/>
      <polygon points="${star}" fill="#fff"/>
      <path d="M10 82q10-28 38-32" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  // Divide & Conquer: the scenery behind each monster.
  function arena(art) {
    const scene = art === "mummy"
      ? `<circle cx="312" cy="58" r="30" fill="#fff3c4"/>
         <path d="M28 220 128 92l100 128z" fill="#d9974a"/><path d="M128 92l100 128h-64z" fill="#b8742f"/>
         <path d="M210 220 280 132l70 88z" fill="#e0a55e"/><path d="M280 132l70 88h-44z" fill="#c2833d"/>`
      : art === "brute"
      ? `<circle cx="84" cy="62" r="26" fill="#fda4af" opacity=".8"/>
         <path d="M0 220v-92h44v-22l12 12 10-18v120h24v-76h40v-16l14 14 16-20v98h26v-104h48v30l12-16 10 18v72h22v-64h44v22l14-14 18 12v44z" fill="#312e81"/>
         <path d="M12 142h10v12H12zM58 134h8v12h-8zM102 160h10v12h-10zM176 138h10v12h-10zM196 170h10v12h-10zM288 170h10v12h-10z" fill="#fbbf24"/>`
      : `<circle cx="304" cy="60" r="30" fill="#e7f5c8"/>
         <path d="M48 220v-52q0-20 20-20t20 20v52zM150 220v-40q0-16 16-16t16 16v40z" fill="#475569" stroke="#1e293b" stroke-width="2.5"/>
         <path d="M62 170h12M68 162v20M160 186h12M166 178v20" stroke="#1e293b" stroke-width="3"/>
         <path d="M250 220q-4-60 4-84-16-8-26-26 18 10 28 12 2-16 14-30-4 20 2 34 12-6 24-20-6 22-22 34-6 40 2 80z" fill="#1e293b"/>`;
    return `<svg class="df-scene" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${scene}</svg>`;
  }

  // Badge medal (bronze / silver / gold / diamond). Icons: "target" (bullseye), "blaster"
  // (ray gun), "burst" (a hit with a ×), "crown", "mummy", "fist", "shield", "comet",
  // "rocket", "planet" (ringed), anything else = a star. earned === false → greyed out.
  function badge(id, size, earned) {
    const b = (window.DATA && DATA.BADGES && DATA.BADGES[id]) || { tier: "silver", icon: "star" };
    const s = size || 40;
    const gold = b.tier === "gold", bronze = b.tier === "bronze", diamond = b.tier === "diamond";
    const c1 = gold ? "#ffe08a" : bronze ? "#ffd7b0" : diamond ? "#e0f7ff" : "#f8fafc";
    const c2 = gold ? "#c98a1b" : bronze ? "#b8692f" : diamond ? "#1e9fd6" : "#94a3b8";
    const rim = gold ? "#9a6510" : bronze ? "#7a3e12" : diamond ? "#0b5f8a" : "#5b6b82";
    const icon = b.icon === "target"
      ? `<circle cx="32" cy="30" r="13.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.3"/>
        <circle cx="32" cy="30" r="9.3" fill="#fff"/>
        <circle cx="32" cy="30" r="5.3" fill="#ef4444"/>
        <circle cx="32" cy="30" r="1.9" fill="#fff"/>
        <path d="M32 13.5v6.5M32 40v6.5M15.5 30H22M42 30h6.5" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/>`
      : b.icon === "blaster"
      ? `<g transform="rotate(-18 32 30)">
          <path d="M19.5 35.5 17.5 46h7l2.5-10.5z" fill="#475569" stroke="#1e293b" stroke-width="1.2" stroke-linejoin="round"/>
          <rect x="14" y="23" width="26" height="13" rx="5.5" fill="#38bdf8" stroke="#0c4a6e" stroke-width="1.4"/>
          <rect x="39" y="26" width="8" height="7" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="1.2"/>
          <circle cx="22" cy="29.5" r="2.4" fill="#fde68a"/>
          <circle cx="30" cy="29.5" r="2.4" fill="#fde68a"/>
          <path d="M49.5 29.5H54" stroke="#ef4444" stroke-width="2.6" stroke-linecap="round"/>
        </g>`
      : b.icon === "burst"
      ? `<polygon points="32,12 36.6,21.3 46.1,15.9 42.6,26 52.5,30 42.6,34 46.1,44.1 36.6,38.7 32,48 27.4,38.7 17.9,44.1 21.4,34 11.5,30 21.4,26 17.9,15.9 27.4,21.3" fill="#f97316" stroke="#9a3412" stroke-width="1.3" stroke-linejoin="round"/>
        <circle cx="32" cy="30" r="9" fill="#fde68a"/>
        <path d="M27.8 25.8l8.4 8.4M36.2 25.8l-8.4 8.4" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>`
      : b.icon === "crown"
      ? `<path d="M18 37 15 20l9 7 8-12.5L40 27l9-7-3 17z" fill="#facc15" stroke="#92400e" stroke-width="1.4" stroke-linejoin="round"/>
        <rect x="17.5" y="37" width="29" height="5.5" rx="2" fill="#f59e0b" stroke="#92400e" stroke-width="1.3"/>
        <circle cx="32" cy="29.5" r="4" fill="#ef4444" stroke="#fff" stroke-width="1.4"/>
        <circle cx="15" cy="19.5" r="2" fill="#fff"/>
        <circle cx="32" cy="14" r="2" fill="#fff"/>
        <circle cx="49" cy="19.5" r="2" fill="#fff"/>`
      : b.icon === "mummy"
      ? `<rect x="19" y="14" width="26" height="32" rx="12" fill="#efe5cd" stroke="#8a7a5a" stroke-width="1.3"/>
        <path d="M19.5 23 44 19M19.5 42 44 37M20 33 44 29" stroke="#b9a988" stroke-width="2"/>
        <rect x="21.5" y="25.5" width="21" height="8.5" rx="3" fill="#2b2118"/>
        <circle cx="27.5" cy="29.8" r="2.6" fill="#facc15"/><circle cx="36.5" cy="29.8" r="2.6" fill="#facc15"/>`
      : b.icon === "fist"
      ? `<path d="M19 31q0-9 7-9h15q6 0 6 7v6q0 11-12 11h-5q-11 0-11-10z" fill="#4ade80" stroke="#14532d" stroke-width="1.5"/>
        <path d="M28 22v9M34.5 22v9M41 22v9" stroke="#14532d" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M20 32q9-3 13 2 1 4-4 5" fill="#22c55e" stroke="#14532d" stroke-width="1.5" stroke-linejoin="round"/>`
      : b.icon === "shield"
      ? `<circle cx="32" cy="30" r="15.5" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"/>
        <circle cx="32" cy="30" r="11.8" fill="#f1f5f9"/>
        <circle cx="32" cy="30" r="8.4" fill="#dc2626"/>
        <circle cx="32" cy="30" r="5.9" fill="#1d4ed8"/>
        <polygon points="${starPoints(32, 30.3, 5.2, 2.2)}" fill="#fff"/>`
      : b.icon === "comet"
      ? `<path d="M16.5 14.5C24 19.5 30 24 37 28.5L33 33.5C27.5 27 22 21.5 16.5 14.5z" fill="#fb923c" opacity=".85"/>
        <path d="M21 13C27.5 18.5 32.5 22.5 39 27L37 29.5C31 25 26 19.5 21 13z" fill="#fde68a"/>
        <circle cx="37.5" cy="32.5" r="7" fill="#f97316" stroke="#9a3412" stroke-width="1.4"/>
        <circle cx="35.4" cy="30.4" r="2.3" fill="#fed7aa"/>
        <polygon points="${starPoints(21.5, 38, 3, 1.25)}" fill="#fff"/>`
      : b.icon === "rocket"
      ? `<g transform="rotate(35 32 30)">
          <path d="M28.5 36.5Q32 47 35.5 36.5z" fill="#f59e0b"/>
          <path d="M30.2 36.5Q32 42.5 33.8 36.5z" fill="#fde68a"/>
          <path d="M26.6 30.5 21.5 38.5l5.4-2zM37.4 30.5l5.1 8-5.4-2z" fill="#ef4444" stroke="#991b1b" stroke-width=".8" stroke-linejoin="round"/>
          <path d="M32 11.5C38.2 16.5 39.2 26 37.6 36.5H26.4C24.8 26 25.8 16.5 32 11.5z" fill="#e2e8f0" stroke="#475569" stroke-width="1.3"/>
          <path d="M28.6 15.6Q32 13 35.4 15.6" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="32" cy="24.5" r="3.6" fill="#38bdf8" stroke="#475569" stroke-width="1.2"/>
        </g>`
      : b.icon === "planet"
      ? `<ellipse cx="32" cy="30" rx="16" ry="5.2" fill="none" stroke="#7c3aed" stroke-width="2.6" transform="rotate(-20 32 30)"/>
        <circle cx="32" cy="30" r="9.5" fill="#8b5cf6" stroke="#4c1d95" stroke-width="1.3"/>
        <path d="M25.5 26.5q6.5-3.4 13 0M24.6 31.5q7.4 2.6 14.8 0" stroke="#c4b5fd" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M16 30A16 5.2 0 0 0 48 30" fill="none" stroke="#a78bfa" stroke-width="2.6" stroke-linecap="round" transform="rotate(-20 32 30)"/>
        <polygon points="${starPoints(45, 17.5, 3.2, 1.3)}" fill="#fff"/>
        <polygon points="${starPoints(19.5, 41, 2.5, 1)}" fill="#fff"/>`
      : `<polygon points="${starPoints(32, 30.5, 11, 4.8)}" fill="${rim}"/>`;
    const gid = gold ? "qaBadgeGold" : bronze ? "qaBadgeBronze" : diamond ? "qaBadgeDiamond" : "qaBadgeSilver";
    return `<svg class="badge-medal${earned === false ? " locked" : ""}" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <path d="M21 42 15 62l8.5-3.5L28 64l6-19z" fill="#3b82f6"/>
      <path d="M43 42l6 20-8.5-3.5L36 64l-6-19z" fill="#ef4444"/>
      <circle cx="32" cy="30" r="21" fill="url(#${gid})" stroke="${rim}" stroke-width="2.5"/>
      <circle cx="32" cy="30" r="16.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
      ${icon}
    </svg>`;
  }

  // Fraction picture: a "bar" or "circle" in equal parts, "shaded/parts" of them shaded,
  // going from the left or clockwise from 12. The label never gives the fraction away.
  function fraction(shape, value) {
    const p = String(value).split("/").map(Number), shaded = p[0], parts = p[1];
    const on = "#3068b1", off = "#f7f9fc", line = "#445164";
    const style = (i) => `fill="${i < shaded ? on : off}" stroke="${line}" stroke-width="4" stroke-linejoin="round"`;
    let cells = "";
    if (shape === "bar") {
      const w = 636 / parts;
      for (let i = 0; i < parts; i++) cells += `<rect x="${(12 + i * w).toFixed(2)}" y="12" width="${w.toFixed(2)}" height="88" ${style(i)}/>`;
      return `<svg class="frac-bar" viewBox="0 0 660 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fraction bar">${cells}</svg>`;
    }
    const at = (i) => {
      const a = i / parts * 2 * Math.PI;
      return (120 + 106 * Math.sin(a)).toFixed(2) + " " + (120 - 106 * Math.cos(a)).toFixed(2);
    };
    for (let i = 0; i < parts; i++) cells += `<path d="M120 120L${at(i)}A106 106 0 0 1 ${at(i + 1)}Z" ${style(i)}/>`;
    return `<svg class="frac-circle" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fraction circle">${cells}</svg>`;
  }

  // Clock face showing "h:mm". The short hand moves on between the hours, like a
  // real clock, and the long hand stops just short of the minute marks so they can be counted.
  function clock(time, size) {
    const parts = String(time).split(":").map(Number), h = parts[0], m = parts[1];
    const s = size || 230;
    const at = (deg, r) => {
      const a = deg * Math.PI / 180;
      return (100 + r * Math.sin(a)).toFixed(1) + " " + (100 - r * Math.cos(a)).toFixed(1);
    };
    const line = (deg, r0, r1, colour, width) => {
      const a = at(deg, r0).split(" "), b = at(deg, r1).split(" ");
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/>`;
    };
    let face = "";
    for (let i = 0; i < 60; i++) face += i % 5 ? line(i * 6, 88, 92, "#94a3b8", 1) : line(i * 6, 83, 92, "#475a73", 3);
    for (let i = 1; i <= 12; i++) {
      const p = at(i * 30, 67).split(" ");
      face += `<text x="${p[0]}" y="${p[1]}" dy=".35em" text-anchor="middle" font-size="15" font-weight="700" fill="#1e3a5f">${i}</text>`;
    }
    return `<svg class="clock" width="${s}" height="${s}" viewBox="0 0 200 200" role="img" aria-label="Clock">
      <circle cx="100" cy="100" r="96" fill="#fff" stroke="#2c4a6e" stroke-width="4"/>${face}
      ${line((h % 12) * 30 + m / 2, -6, 46, "#1a3352", 7)}
      ${line(m * 6, -8, 80, "#0e87a3", 3.5)}
      <circle cx="100" cy="100" r="6" fill="#1a3352"/>
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
    crest, student, owl, subject, stars, coin, badge, blaster, hero, monster, arena, clock, fraction,
    player: function (_pose, gender) { return student(gender); }
  };
})();
