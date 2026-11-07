/* art.js — inline SVG artwork for Quest Academy: the academy crest, student
   avatars (boy / girl), the owl mascot, the three subject badges and stars. */
(function () {
  "use strict";

  // Points of a 5-pointed star centred on (cx, cy).
  // A spider web in a 100 × 100 box: spokes and sagging rings.
  function webPath() {
    const at = (r, i) => [50 + r * Math.sin(i * Math.PI / 4), 50 - r * Math.cos(i * Math.PI / 4)].map(n => n.toFixed(1)).join(" ");
    const ring = (r) => "M" + at(r, 0) + [1, 2, 3, 4, 5, 6, 7, 8].map(i => "Q" + at(r * 0.8, i - 0.5) + " " + at(r, i)).join("");
    return [0, 1, 2, 3, 4, 5, 6, 7].map(i => "M50 50L" + at(48, i)).join("") + ring(18) + ring(32) + ring(46);
  }

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

  // Divide & Conquer: the player's hero, facing right: a card thrower in a long coat. gender: "boy" | "girl"
  function hero(gender) {
    const girl = gender === "girl";
    const skin = "#f0c39a", cowl = "#1c1730", suit = "#2a2140", glow = "#ff2fd6";
    const hair = girl ? "#a8431c" : "#7a3e1d", coat = girl ? "#7b2f6b" : "#7c4a1e", coatDark = girl ? "#571f4c" : "#54300f";
    const lining = girl ? "#c0559f" : "#b27a3c", plate = girl ? "#f472b6" : "#db2777", boot = girl ? "#7c3aed" : "#2563eb";
    const hairBack = girl
      ? `<path d="M37 30Q14 62 22 100q10 8 24 2-10-34 0-68z" fill="${hair}" stroke="#6e2a12" stroke-width="1.2" stroke-linejoin="round"/>`
      : "";
    const card = (deg) => `<g transform="rotate(${deg} 106 86)"><rect x="98" y="50" width="16" height="24" rx="2.5" fill="#fff" stroke="${glow}" stroke-width="2"/><path d="M106 56l4 6-4 6-4-6z" fill="${glow}"/></g>`;
    return `<svg viewBox="0 0 136 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your hero">
      <path d="M46 60Q10 92 6 138q11-7 16 1 8-8 15 0 8-8 16-1l9-24z" fill="${coat}" stroke="${coatDark}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M46 72Q24 98 19 128q8-4 13 1 7-7 14-2z" fill="${lining}"/>
      ${hairBack}
      <path d="M39 100h40l-1 36H62l-3-20-3 20H40z" fill="${suit}"/>
      <path d="M43 113h9l-1 20h-7zM66 113h9l-1 20h-7z" fill="${plate}"/>
      <path d="M38 130h18v13q0 3-3 3H38q-3 0-3-3 0-13 3-13zM61 130h16q8 2 8 13 0 3-3 3H61z" fill="${boot}" stroke="#172554" stroke-width="1.2"/>
      <path d="M38 72q0-11 11-11h20q11 0 11 11v36H38z" fill="${suit}" stroke="#14101f" stroke-width="1.6"/>
      <path d="M44 64h30q4 14 2 28-17 13-34 0-2-14 2-28z" fill="${plate}" stroke="#14101f" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M49 69h12q-8 5-14 15-1-8 2-15z" fill="#fff" opacity=".28"/>
      <rect x="52" y="80.8" width="14" height="2.6" rx="1.3" fill="#fff"/><circle cx="59" cy="76" r="1.9" fill="#fff"/><circle cx="59" cy="88.2" r="1.9" fill="#fff"/>
      <rect x="37" y="102" width="44" height="7" rx="2" fill="#f2c14e" stroke="#b45309" stroke-width="1"/>
      <path d="M38 62q-7 3-7 13l-1 52q8 4 15-1l4-66z" fill="${coat}" stroke="${coatDark}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M80 62q6 4 6 12l1 36q-5 3-9 0l-4-46z" fill="${coat}" stroke="${coatDark}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M33 62 40 46l10 16-6 6zM85 62l-7-16-10 16 6 6z" fill="${coatDark}" stroke="#2f1a07" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M38 27Q20 30 21 52q2 8 8 11-2-12 5-19 2 10 7 15z" fill="${hair}" stroke="#4a2410" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="59" cy="38" r="25.5" fill="${cowl}" stroke="#000" stroke-width="1.2"/>
      <ellipse cx="67" cy="42" rx="16.5" ry="19" fill="${skin}" stroke="${plate}" stroke-width="2.6"/>
      <path d="M35 28Q27 13 40 15 35 3 49 8 51-1 61 6 70-1 74 9 86 7 81 17 91 21 82 29 71 15 58 15 45 15 35 28z" fill="${hair}" stroke="#4a2410" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M67 16q7 4 6 13-5-3-7-9M56 15q3 6 1 12-5-4-5-10" fill="${hair}" stroke="#4a2410" stroke-width="1" stroke-linejoin="round"/>
      <ellipse cx="62.5" cy="41" rx="4.8" ry="4.6" fill="#14101f"/><ellipse cx="76.5" cy="41" rx="4.8" ry="4.6" fill="#14101f"/>
      <circle cx="63.8" cy="41" r="2.5" fill="#ff2d55"/><circle cx="77.8" cy="41" r="2.5" fill="#ff2d55"/>
      <circle cx="64.7" cy="39.8" r=".9" fill="#fff"/><circle cx="78.7" cy="39.8" r=".9" fill="#fff"/>
      <path d="M57 34q5-2 10 .5M72 34.5q5-2.5 9.5-.5" stroke="#4a2410" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M64 53q8 3 14-3" stroke="${girl ? "#be185d" : "#7c2d12"}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g class="df-arm">
        <path d="M72 72 102 86" stroke="${coat}" stroke-width="13" stroke-linecap="round"/>
        <path d="M95 77l-5 11" stroke="${coatDark}" stroke-width="2.4" stroke-linecap="round"/>
        <g class="df-fan">
          <circle cx="106" cy="64" r="28" fill="${glow}" opacity=".16"/><circle cx="106" cy="64" r="19" fill="${glow}" opacity=".24"/>
          ${card(-26)}${card(0)}${card(26)}
        </g>
        <circle cx="105" cy="87" r="7.5" fill="${suit}" stroke="#14101f" stroke-width="1.2"/>
        <path d="M100 82v-3M104 81v-4M108 81v-4M111.5 83v-3" stroke="${skin}" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  // The zombie's shield, in its hand and when it flies.
  function capShield() {
    return `<circle class="df-from" cx="45" cy="100" r="42" fill="#dc2626" stroke="#7f1d1d" stroke-width="2.4"/>
      <circle cx="45" cy="100" r="33" fill="#f1f5f9"/>
      <circle cx="45" cy="100" r="24" fill="#dc2626"/>
      <circle cx="45" cy="100" r="16.5" fill="#1d4ed8"/>
      <polygon points="${starPoints(45, 100, 13, 5.6)}" fill="#fff"/>
      <path d="M10 82q10-28 38-32" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }

  // Divide & Conquer: the monsters, facing left. art: "brute" | "zombie" | "spider"
  function monster(art) {
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
        <g class="df-punch">
        <path d="M48 62Q18 72 18 100l6 22" stroke="${line}" stroke-width="30" fill="none" stroke-linecap="round"/>
        <path d="M48 62Q18 72 18 100l6 22" stroke="${g1}" stroke-width="25" fill="none" stroke-linecap="round"/>
        <circle cx="24" cy="132" r="19" fill="${g1}" stroke="${line}" stroke-width="2.4"/>
        <path d="M12 124v12M20 118v16M29 118v16" stroke="${g2}" stroke-width="2.6" stroke-linecap="round"/>
        </g>
        <path d="M68 28q0-24 30-24t30 24v14q-2 16-30 18-28-2-30-18z" fill="${g1}" stroke="${line}" stroke-width="2.4"/>
        <path d="M67 28q-3-26 31-27 34 1 31 27l-8-10-8 6-7-8-8 7-7-7-8 7-8-6z" fill="#111827"/>
        <path d="M72 29l19 5M112 34l-14 1" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="83" cy="36" r="3.4" fill="#fff"/><circle cx="82" cy="36" r="1.7" fill="#111827"/>
        <circle cx="106" cy="38" r="3" fill="#fff"/><circle cx="105" cy="38" r="1.5" fill="#111827"/>
        <path d="M78 46h32l-3 8H82z" fill="#fff" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M86 46v8M94 46v8M102 46v8" stroke="${line}" stroke-width="1.4"/>
      </svg>`;
    }
    if (art === "spider") {
      const red = "#dc2626", blue = "#1d4ed8", dark = "#7f1d1d", navy = "#172554", skin = "#a3b18a", line = "#3f4f32";
      return `<svg viewBox="0 0 160 172" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A zombie in a spider suit">
        <path d="M124 72q22 8 20 38" stroke="${dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
        <path d="M124 72q22 8 20 38" stroke="${red}" stroke-width="16" fill="none" stroke-linecap="round"/>
        <circle cx="144" cy="116" r="10" fill="${skin}" stroke="${line}" stroke-width="2"/>
        <path d="M66 126h24v38q0 5-5 5H60q-5 0-5-5zM96 126h24l6 38q0 5-5 5h-20q-5 0-5-5z" fill="${blue}" stroke="${navy}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M57 148h32v16q0 5-5 5H60q-5 0-5-5zM96 148h28l2 16q0 5-5 5h-20q-5 0-5-5z" fill="${red}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M68 132l14 2-3 11-12-2zM106 130l10 4-1 10-9-3z" fill="${skin}" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M60 74q0-18 18-18h30q18 0 18 18v56H60z" fill="${blue}" stroke="${navy}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M68 56h50l8 18-2 16-16 12 2 28H78l2-28-16-12-4-16z" fill="${red}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M93 84 93 56M93 84 72 58M93 84l21-26M93 84 62 76M93 84l31-8M93 84 66 92M93 84l27 8M93 84 84 128M93 84l10 44M78 72q15 8 30 0M72 86q21 14 42 0" stroke="#450a0a" stroke-width="1.2" fill="none"/>
        <ellipse cx="93" cy="84" rx="4" ry="8" fill="#111827"/>
        <path d="M93 80 83 72M93 80l10-8M93 84H81M93 84h12M93 88l-10 8M93 88l10 8" stroke="#111827" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M108 104l11 2-3 13-11-5z" fill="${skin}" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M62 8q30-12 54 4 12 12 8 36-4 22-30 24-28-2-34-24-4-22 2-40z" fill="${red}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M78 40 64 6M78 40 90 2M78 40 58 22M78 40 56 44M78 40 62 62M78 40l10 32M63 22q10 8 22-4M60 42q12 10 28 2M66 56q12 4 24 0" stroke="#450a0a" stroke-width="1.2" fill="none"/>
        <path d="M94 2 89 12l8 6-7 8 8 8-7 9 7 8-5 9 6 11q24-4 27-24 4-24-8-36-10-8-24-8z" fill="${skin}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M60 28q14-6 25 8-2 14-14 15-13-3-11-23z" fill="#f8fafc" stroke="#111827" stroke-width="3.4" stroke-linejoin="round"/>
        <circle cx="108" cy="34" r="9" fill="#f8fafc" stroke="${line}" stroke-width="1.8"/><circle cx="105" cy="35" r="3.6" fill="#b91c1c"/>
        <path d="M94 56l5 3 5-4 5 4 6-4-2 9-8 3-9-1z" fill="#f8fafc" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M116 16l6 8M120 12l-4 8M116 54l7 2M118 50l2 9" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M66 70Q42 70 22 84" stroke="${dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
        <path d="M66 70Q42 70 22 84" stroke="${red}" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M44 62l4 16M34 66l6 15" stroke="#450a0a" stroke-width="1.2"/>
        <circle class="df-from" cx="16" cy="88" r="10" fill="${skin}" stroke="${line}" stroke-width="2"/>
        <path d="M11 82 4 74M8 87 0 84" stroke="${skin}" stroke-width="4.5" stroke-linecap="round"/>
      </svg>`;
    }
    const skin = "#a3b18a", line = "#3f4f32", suit = "#1e3a8a";
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
      <g class="df-shield">${capShield()}</g>
    </svg>`;
  }

  // Divide & Conquer: what a monster sends flying. attack: "shield" | "web" ("punch" sends nothing).
  function foeShot(attack) {
    if (attack === "shield") return `<span class="df-fly"><svg viewBox="2 57 86 86" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${capShield()}</svg></span>`;
    if (attack === "web") return `<i class="df-strand"></i><span class="df-splat"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${webPath()}" fill="none" stroke="#f8fafc" stroke-width="2.6" stroke-linecap="round"/></svg></span>`;
    return "";
  }

  // Divide & Conquer: the scenery behind each monster.
  function arena(art) {
    const scene = art === "spider"
      ? `<circle cx="74" cy="62" r="30" fill="#f1f5f9" opacity=".92"/>
         <g transform="translate(250 -46) scale(1.5)" opacity=".2"><path d="${webPath()}" fill="none" stroke="#fff" stroke-width="1.4"/></g>
         <path d="M0 220v-74h52v-26h44v44h42v-76h52v60h46v-30h58v48h48v-90h58v144z" fill="#0b1224"/>
         <path d="M14 164h9v11h-9zM34 184h9v11h-9zM66 136h9v11h-9zM152 112h9v11h-9zM170 150h9v11h-9zM252 150h9v11h-9zM292 176h9v11h-9zM344 122h9v11h-9zM370 160h9v11h-9z" fill="#fbbf24"/>`      : art === "brute"
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
  // (ray gun), "burst" (a hit with a ×), "crown", "fist", "shield", "web", "comet",
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
      : b.icon === "web"
      ? `<circle cx="32" cy="30" r="15.5" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"/>
        <path d="${webPath()}" transform="translate(16 14) scale(.32)" fill="none" stroke="#fff" stroke-width="4"/>`
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
      : b.icon === "kancil"
      ? `<path d="M22.5 22 17 12.5q-1.5 7 3.5 12.5z" fill="#b45309" stroke="#78350f" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M41.5 22 47 12.5q1.5 7-3.5 12.5z" fill="#b45309" stroke="#78350f" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M21 17.5q1 4.5 2.6 6M43 17.5q-1 4.5-2.6 6" stroke="#fcd9b6" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <path d="M32 18c-8.5 0-12 6-11 12.5 1 6 5 11.5 11 14.5 6-3 10-8.5 11-14.5C44 24 40.5 18 32 18z" fill="#d97706" stroke="#78350f" stroke-width="1.4"/>
        <path d="M27 35q5 9 10 0q-1.5-4.5-5-4.5T27 35z" fill="#fde7c7"/>
        <ellipse cx="32" cy="38.6" rx="3.2" ry="2.3" fill="#1f2937"/>
        <circle cx="26.8" cy="28.4" r="2.7" fill="#1f2937"/><circle cx="37.2" cy="28.4" r="2.7" fill="#1f2937"/>
        <circle cx="27.6" cy="27.5" r=".9" fill="#fff"/><circle cx="38" cy="27.5" r=".9" fill="#fff"/>`
      : b.icon === "eagle"
      ? `<path d="M15.5 37q2-15 12-19l8 4q-8 6-8 17z" fill="#92400e" stroke="#451a03" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M24.5 38q-1-14 9-18.5 9-2 13.5 5.5 2 4-1 6.5l-7 1.5q-5 1-7 6.5z" fill="#f8fafc" stroke="#475569" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M43.5 25.5q6 .5 6.5 6.5-2.6-2.4-6-1.8z" fill="#facc15" stroke="#a16207" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M40.5 30.5q4.5-.2 7.2 1.2" stroke="#a16207" stroke-width="1" fill="none"/>
        <circle cx="38.4" cy="24.6" r="2.3" fill="#1f2937"/><circle cx="39.1" cy="23.9" r=".8" fill="#fff"/>
        <path d="M34.5 21.5q3.5-1.6 6.6.4" stroke="#475569" stroke-width="1.4" stroke-linecap="round" fill="none"/>`
      : b.icon === "tiger"
      ? `<circle cx="20.5" cy="18.5" r="4.6" fill="#f97316" stroke="#7c2d12" stroke-width="1.3"/>
        <circle cx="43.5" cy="18.5" r="4.6" fill="#f97316" stroke="#7c2d12" stroke-width="1.3"/>
        <circle cx="20.5" cy="18.5" r="2" fill="#fde7c7"/><circle cx="43.5" cy="18.5" r="2" fill="#fde7c7"/>
        <ellipse cx="32" cy="30.5" rx="14" ry="12.8" fill="#f97316" stroke="#7c2d12" stroke-width="1.4"/>
        <path d="M32 17.8v4.4M28 18.6l1.2 3.6M36 18.6l-1.2 3.6M18.6 27.5h4.6M18.4 32.4l4.3-.8M45.4 27.5h-4.6M45.6 32.4l-4.3-.8" stroke="#1f2937" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M24.5 37q0-6 7.5-6t7.5 6q-1 5.6-7.5 5.6T24.5 37z" fill="#fff7ed"/>
        <path d="M29.2 33.2h5.6L32 36.4z" fill="#1f2937"/>
        <path d="M32 36.4v2.3M32 38.7q-2 1.7-3.6.3M32 38.7q2 1.7 3.6.3" stroke="#1f2937" stroke-width="1.1" stroke-linecap="round" fill="none"/>
        <circle cx="26.4" cy="27.4" r="2.2" fill="#1f2937"/><circle cx="37.6" cy="27.4" r="2.2" fill="#1f2937"/>
        <circle cx="27.1" cy="26.7" r=".8" fill="#fff"/><circle cx="38.3" cy="26.7" r=".8" fill="#fff"/>`
      : b.icon === "bolt"
      ? `<polygon points="35.5,11.5 19.5,33 30,33 26.5,48.5 44.5,25.5 33.5,25.5" fill="#facc15" stroke="#a16207" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="33,16 24.5,29.5 31,29.5" fill="#fef9c3" opacity=".9"/>
        <polygon points="${starPoints(46.5, 15.5, 3, 1.25)}" fill="#fff"/>
        <polygon points="${starPoints(17.5, 42, 2.4, 1)}" fill="#fff"/>`
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
  // Represent a fraction: a bar, circle or grid in equal parts that the child taps to shade.
  // q: { shade: "bar" | "circle" | "grid", parts, rows, cols }; on: the parts already shaded.
  function shadeShape(q, on) {
    const lit = new Set(on || []), cls = (i) => `class="shade-part${lit.has(i) ? " on" : ""}" data-part="${i}"`;
    let cells = "", box;
    if (q.shade === "bar") {
      const w = 636 / q.parts;
      for (let i = 0; i < q.parts; i++) cells += `<rect ${cls(i)} x="${(12 + i * w).toFixed(2)}" y="12" width="${w.toFixed(2)}" height="88"/>`;
      box = "0 0 660 112";
    } else if (q.shade === "grid") {
      for (let r = 0; r < q.rows; r++) for (let c = 0; c < q.cols; c++) cells += `<rect ${cls(r * q.cols + c)} x="${12 + c * 100}" y="${12 + r * 68}" width="100" height="68"/>`;
      box = `0 0 ${q.cols * 100 + 24} ${q.rows * 68 + 24}`;
    } else {
      const at = (i) => { const a = i / q.parts * 2 * Math.PI; return (120 + 106 * Math.sin(a)).toFixed(2) + " " + (120 - 106 * Math.cos(a)).toFixed(2); };
      for (let i = 0; i < q.parts; i++) cells += `<path ${cls(i)} d="M120 120L${at(i)}A106 106 0 0 1 ${at(i + 1)}Z"/>`;
      box = "0 0 240 240";
    }
    return `<svg class="shade-shape shade-${q.shade}" viewBox="${box}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shape to shade">${cells}</svg>`;
  }

  /* ---------- tap-the-picture questions ----------
     A picture with parts the child taps; the part tapped lights up. The face is Wing's own
     picture, the version of "Bahagian-Bahagian Muka dan Kepala" without its labels.
     Its map says which part each spot is (red = the part's number in `order` × 16), and each
     part in `lit` has a highlight mask, muka-01.png … in that order. */
  const TAP_PICTURES = {
    face: {
      src: "img/anggota/muka.webp", map: "img/anggota/muka-map.png", ratio: "640 / 784",
      order: ["leher", "muka", "telinga", "dahi", "pipi", "rambut", "kening", "mata", "bulu_mata", "hidung", "dagu", "mulut", "bibir", "lidah", "gigi"],
      lit: ["kepala", "rambut", "dahi", "telinga", "kening", "bulu_mata", "mata", "pipi", "hidung", "dagu", "leher", "bibir", "gigi", "mulut", "lidah"],
      names: { kepala: "kepala", rambut: "rambut", dahi: "dahi", kening: "kening", bulu_mata: "bulu mata", mata: "mata", telinga: "telinga",
        pipi: "pipi", hidung: "hidung", bibir: "bibir", gigi: "gigi", mulut: "mulut", lidah: "lidah", dagu: "dagu", leher: "leher", muka: "muka" },
      // A part inside another: asked for the outer one, a tap on the inner one counts as it.
      // "muka" is plain skin: it only counts for the whole head.
      parents: { rambut: ["kepala"], dahi: ["kepala"], kening: ["kepala"], bulu_mata: ["kepala"], mata: ["kepala"], telinga: ["kepala"], pipi: ["kepala"],
        hidung: ["kepala"], dagu: ["kepala"], muka: ["kepala"], mulut: ["kepala"], bibir: ["mulut", "kepala"], gigi: ["mulut", "kepala"], lidah: ["mulut", "kepala"] }
    }
  };
  function tapPicture(name) {
    const p = TAP_PICTURES[name];
    if (!p) return "";
    const base = p.src.replace(/\.\w+$/, "");
    return `<div class="tap-photo" style="aspect-ratio:${p.ratio}"><img src="${p.src}" alt="Gambar" draggable="false"/>${p.lit.map((part, i) => {
      const url = base + "-" + String(i + 1).padStart(2, "0") + ".png";
      return `<i class="tap-hl" data-part="${part}" style="-webkit-mask-image:url(${url});mask-image:url(${url})"></i>`;
    }).join("")}</div>`;
  }
  // The part names, which part sits inside which, and the map, for marking a tap.
  const tapParts = (name) => TAP_PICTURES[name] || null;

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
    crest, student, owl, subject, stars, coin, badge, blaster, hero, monster, foeShot, arena, clock, fraction, shadeShape, tapPicture, tapParts,
    player: function (_pose, gender) { return student(gender); }
  };
})();
