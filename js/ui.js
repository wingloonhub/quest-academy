/* ui.js — every Quest Academy screen:
     login → players → menu → subject → module → topic → level
     level = Assessment · Progress report   (module page = topics + module report)
   plus results, history & analysis and the parent report. */
(function () {
  "use strict";
  const screen = () => document.getElementById("screen");
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(screen().querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (s) => esc(s).replace(/\n/g, "<br/>");
  const plural = (n, word, many) => n + " " + (n === 1 ? word : (many || word + "s"));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  let current = null;     // redraws the visible screen when the cloud brings new data
  let keyHandler = null;  // physical keyboard for the visible screen (desktop)
  let exam = null;        // the assessment in progress

  function show(html, subjectId) {
    stopGameTimer();
    const el = screen();
    el.dataset.subject = subjectId || "";
    el.innerHTML = html;
    keyHandler = null;
    window.scrollTo(0, 0);
  }

  // Typing on a real keyboard works too (desktop / tablet with keyboard).
  document.addEventListener("keydown", function (e) {
    if (!keyHandler || document.querySelector(".overlay")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (keyHandler(e) === true) e.preventDefault();
  });

  function toast(msg, type) {
    const host = document.getElementById("toast-host");
    const el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function showConfirm(title, body, okLabel, onOk) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="overlay" id="cf"><div class="modal">
        <h2>${esc(title)}</h2><p>${esc(body)}</p>
        <div class="row"><button class="btn ghost" id="cfNo" type="button">Cancel</button><button class="btn primary" id="cfYes" type="button">${esc(okLabel)}</button></div>
      </div></div>`);
    $("#cfNo").onclick = () => $("#cf").remove();
    $("#cfYes").onclick = () => { $("#cf").remove(); onOk(); };
  }

  /* ===================== helpers: scores, stars, mastery ===================== */
  const levelKey = (h) => h.subjectId + "|" + h.topicId + "|" + h.levelId;
  function starsFor(pct) { return pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0; }
  function bestByLevel(hist) {
    const m = {};
    hist.forEach(h => { const k = levelKey(h); if (!m[k] || h.pct > m[k].pct) m[k] = h; });
    return m;
  }
  function totalStars(hist) {
    const m = bestByLevel(hist);
    return Object.keys(m).reduce((a, k) => a + starsFor(m[k].pct), 0);
  }
  function avgPct(list) { return list.length ? Math.round(list.reduce((a, b) => a + (b.pct || 0), 0) / list.length) : null; }
  function accClass(acc) { return acc >= 0.8 ? "tag-strong" : acc >= 0.55 ? "tag-mid" : "tag-weak"; }
  function accColor(acc) { return acc >= 0.8 ? "var(--good)" : acc >= 0.55 ? "var(--gold)" : "var(--bad)"; }
  function pctBand(p) {
    if (p >= 80) return { cls: "tag-strong", txt: "Strong" };
    if (p >= 60) return { cls: "tag-mid", txt: "Improving" };
    return { cls: "tag-weak", txt: "Needs work" };
  }
  function barCard(label, correct, total, sub, flag) {
    const acc = total ? correct / total : 0, pct = Math.round(acc * 100);
    return `<div class="rep-card${flag ? " flagged" : ""}">
      <div class="t"><span>${esc(label)}</span><span class="${accClass(acc)}">${pct}%</span></div>
      <div class="sub">${sub || `${correct} / ${total} correct`}</div>
      <div class="bar"><i style="width:${pct}%;background:${accColor(acc)}"></i></div>
    </div>`;
  }
  function masteryBadge(m, big) {
    return `<span class="mastery ${m.cls}${big ? " big" : ""}">${m.icon} ${esc(m.label)}</span>`;
  }
  function subjectPill(subjectId) {
    const s = DATA.subject(subjectId);
    return s ? `<span class="subj-pill" data-subject="${esc(s.id)}">${esc(s.label)}</span>` : "";
  }
  function fullDate(ts) {
    try {
      return new Date(ts).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) { return new Date(ts).toLocaleString(); }
  }
  function trendMark(t) {
    if (t === "up") return `<span class="trend up">▲ improving</span>`;
    if (t === "down") return `<span class="trend down">▼ latest score dropped</span>`;
    return `<span class="trend flat">— steady</span>`;
  }
  // Two questions count as "the same" when they use the same numbers and have the
  // same answer (6 × 7 and 7 × 6, or two stories that are both 2 groups of 6) —
  // otherwise when their text and answer match. A question can set its own
  // `same` key to override this. No assessment or game ever shows both.
  function sameKey(q) {
    if (q.same) return "k:" + q.same;
    const ans = (Array.isArray(q.fields) ? q.fields.map(f => f.word).join("|")
      : (q.spelling || q.typed || q.order) ? String(q.word)
      : Array.isArray(q.options) ? String(q.options[q.answer]) : "").toLowerCase();
    const nums = (String(q.q || "").match(/\d+/g) || []).map(Number).sort((a, b) => a - b);
    if (nums.length >= 2) return "n:" + nums.join(",") + "=" + ans;
    return "t:" + String(q.q || q.word || "").toLowerCase().replace(/\s+/g, " ").trim() + "=" + ans;
  }
  function uniqueCount(bank) { return new Set(bank.map(sameKey)).size; }

  // Most points an assessment can still pay: (100 − best %) × the subject's
  // points per 1% (set on the admin page). Score 80% once → next time up to 20.
  function maxPoints(subjectId, topicId, levelId) {
    const best = STORE.bestScore(subjectId, topicId, levelId);
    const rate = STORE.rate(subjectId);
    // Once the best is 100%, a replay at 90%+ still pays a fixed bonus (DATA.REPLAY_BONUS).
    const rb = DATA.REPLAY_BONUS;
    return { best: best, rate: rate, max: Math.round((100 - best) * rate), full: Math.round(100 * rate),
             replay: best >= 100 && rate > 0 ? rb.points : 0, replayMin: rb.minPct };
  }

  function sessionSizeFor(level, bank) {
    const allSpelling = bank.every(q => q.spelling);
    const base = (level && level.sessionSize) || (allSpelling ? 10 : DATA.DEFAULT_SESSION_SIZE);
    return Math.min(base, uniqueCount(bank));
  }

  /* ===================== cloud sync badge ===================== */
  function syncBadge() {
    const s = AUTH.sync || {};
    let text, cls;
    if (!AUTH.configured || !AUTH.user) { text = "💾 Saved on this device only"; cls = "local"; }
    else if (s.status === "syncing") { text = "⏳ Saving to the cloud…"; cls = "busy"; }
    else if (s.status === "saved") { text = "☁️ Saved to the cloud · " + REPORT.timeAgo(s.at); cls = "ok"; }
    else if (s.status === "offline") { text = "📴 Offline — will sync when back online"; cls = "warn"; }
    else if (s.status === "error") { text = "⚠️ Cloud sync problem — tap to retry"; cls = "bad"; }
    else { text = "☁️ Cloud sync on"; cls = "ok"; }
    return `<button class="sync-badge ${cls}" id="syncBadge" type="button">${esc(text)}</button>`;
  }
  function wireSyncBadge() {
    const b = $("#syncBadge");
    if (!b) return;
    b.onclick = () => {
      if (AUTH.user) AUTH.syncNow();
      else if (!AUTH.configured) toast("Cloud save turns on after Firebase is set up (README → Step 2).", "");
    };
  }
  function onSync(_sync, changed) {
    const b = $("#syncBadge");
    if (b) { b.outerHTML = syncBadge(); wireSyncBadge(); }
    if (changed) refreshIfIdle();
  }
  function refreshIfIdle() {
    if (exam || document.querySelector(".overlay") || !current) return;
    const y = window.scrollY;
    current();
    window.scrollTo(0, y);
  }

  /* ===================== splash / login ===================== */
  function renderSplash() {
    current = null;
    show(`<div class="center-wrap"><div class="splash">
      <div class="crest">${ART.crest()}</div>
      <div class="title">Quest<br/>Academy</div>
      <div class="spinner"></div>
      <div class="muted">Opening the academy…</div>
    </div></div>`);
  }

  let authMode = "in";
  function renderAuth(errMsg) {
    current = null;
    const localOnly = !AUTH.configured;
    const up = authMode === "up";
    show(`
      <div class="center-wrap"><div class="card auth-card">
        <div class="crest">${ART.crest()}</div>
        <div class="title">Quest<br/>Academy<small>ENGLISH · BAHASA · MATHS</small></div>
        <div class="subtitle">${up ? "Create your academy account" : "Sign in — your progress follows you to every phone and computer"}</div>
        <form id="authForm" autocomplete="on">
          ${up ? `<div class="field"><label for="dn">Student name</label><input id="dn" type="text" placeholder="Type a name" maxlength="24" autocomplete="nickname" required/></div>` : ""}
          <div class="field"><label for="em">Email</label><input id="em" type="email" placeholder="name@example.com" autocomplete="email" required/></div>
          <div class="field"><label for="pw">Password</label>
            <div class="pw-wrap"><input id="pw" type="password" placeholder="At least 6 characters" minlength="6" autocomplete="${up ? "new-password" : "current-password"}" required/><button type="button" class="pw-eye" id="pwEye" aria-label="Show password">👁</button></div>
          </div>
          <button class="btn primary full" type="submit" id="authBtn">${up ? "Create account &amp; start" : "Sign in"}</button>
        </form>
        <div class="err" id="authErr">${esc(errMsg || "")}</div>
        <div class="auth-toggle">
          ${up
            ? `Already have an account? <a id="toIn">Sign in</a>`
            : `New here? <a id="toUp">Create an account</a> &nbsp;·&nbsp; <a id="forgot">Forgot password?</a>`}
        </div>
        ${localOnly ? `<div class="fb-warn"><b>Cloud login isn't set up yet.</b> You can still try the app, but progress is saved on this device only. To turn on email login and the cloud database (same results on every phone and computer), follow <b>README.md → Step 2 (Firebase)</b>, then re-upload.<br/><br/><button class="btn ghost sm" id="guestBtn" type="button">Try it on this device →</button></div>` : ""}
      </div></div>`);

    if ($("#toUp")) $("#toUp").onclick = () => { authMode = "up"; renderAuth(); };
    if ($("#toIn")) $("#toIn").onclick = () => { authMode = "in"; renderAuth(); };
    if ($("#guestBtn")) $("#guestBtn").onclick = () => AUTH.startGuest();
    $("#pwEye").onclick = () => {
      const pw = $("#pw");
      pw.type = pw.type === "password" ? "text" : "password";
      $("#pwEye").textContent = pw.type === "password" ? "👁" : "🙈";
    };
    if ($("#forgot")) $("#forgot").onclick = () => {
      const em = $("#em").value.trim();
      if (!em) { $("#authErr").textContent = "Type your email above first, then tap Forgot password."; return; }
      AUTH.resetPassword(em)
        .then(() => toast("Password reset email sent — check your inbox.", "good"))
        .catch(e => { $("#authErr").textContent = friendly(e); });
    };
    $("#authForm").onsubmit = (e) => {
      e.preventDefault();
      $("#authErr").textContent = "";
      const em = $("#em").value.trim(), pw = $("#pw").value;
      const dn = $("#dn") ? $("#dn").value.trim() : "";
      const btn = $("#authBtn"); btn.disabled = true; btn.textContent = "Please wait…";
      const p = up ? AUTH.signUp(em, pw, dn) : AUTH.signIn(em, pw);
      // On success onAuthStateChanged takes over and opens the menu.
      p.catch(ex => renderAuth(friendly(ex)));
    };
  }

  function friendly(ex) {
    const m = (ex && ex.code) || "";
    if (m.includes("email-already-in-use")) return "That email already has an account — try Sign in instead.";
    if (m.includes("invalid-email")) return "That email address doesn't look right.";
    if (m.includes("weak-password")) return "Password must be at least 6 characters.";
    if (m.includes("wrong-password") || m.includes("invalid-credential") || m.includes("invalid-login-credentials")) return "Email or password is wrong.";
    if (m.includes("user-not-found")) return "No account with that email — create one first.";
    if (m.includes("too-many-requests")) return "Too many tries — wait a minute and try again.";
    if (m.includes("network-request-failed")) return "No internet connection — check your Wi-Fi and try again.";
    return (ex && ex.message) || "Something went wrong.";
  }

  /* ===================== main menu ===================== */
  function subjectCard(s, hist) {
    const sh = hist.filter(h => h.subjectId === s.id);
    const levels = DATA.levelCount(s.id);
    let meta;
    if (!s.topics.length) meta = `<span class="soon-pill">Coming soon</span>`;
    else if (!levels) meta = `<span class="subject-meta">${plural(s.topics.length, "module")}</span><span class="soon-pill">Topics coming soon</span>`;
    else {
      const mastered = s.topics.reduce((a, t) => a + REPORT.topicSummary(s.id, t.id).mastered, 0);
      meta = `<span class="subject-meta">${plural(s.topics.length, "module")} · ${plural(DATA.topicCount(s.id), "topic")}${mastered ? ` · 🏆 ${mastered} mastered` : ""}${sh.length ? ` · average ${avgPct(sh)}%` : ""}</span>`;
    }
    return `<button class="subject-card" data-subject="${esc(s.id)}" type="button">
      <span class="subject-art">${ART.subject(s.id)}</span>
      <span class="subject-text">
        <span class="subject-name">${esc(s.label)}</span>
        <span class="subject-tag">${esc(s.fullLabel ? s.fullLabel + " · " + s.tagline : s.tagline)}</span>
        ${meta}
      </span>
      <span class="subject-go" aria-hidden="true">›</span>
    </button>`;
  }

  function renderMenu() {
    const p = STORE.active();
    if (!p) return route();
    current = renderMenu;
    const hist = STORE.history();
    const stars = totalStars(hist);
    const sum = STORE.pointsSummary();
    const myrRate = STORE.myrPerPoint();      // cash value of 1 point (0 = cash off → no "Worth" line)
    const badgeCount = badgeTotals().got;      // only badges that still exist (not those of replaced games)
    const pendingAll = STORE.profilesList().reduce((n, pl) => n + STORE.redemptions(pl).filter(r => r.status === "pending").length, 0);
    const email = (STORE.state.account || {}).email || "";
    show(`
      <div class="page menu-page">
        <header class="menu-head">
          <div class="menu-crest">${ART.crest()}</div>
          <div class="menu-title">Quest Academy<small>English · Bahasa · Maths</small></div>
        </header>
        <div class="player-chip">
          <div class="player-chip-avatar">${ART.student(p.gender)}</div>
          <div class="player-chip-text">
            <div class="player-chip-hello">${hist.length ? "Welcome back" : "Welcome"}, <b>${esc(p.name)}</b>!</div>
            <div class="muted">${hist.length ? plural(hist.length, "assessment") + " done — keep going!" : "Pick a subject to start your quest"}</div>
          </div>
          <button class="btn ghost sm" id="switch" type="button">Switch</button>
        </div>
        <button class="points-hero clickable" id="pointsBtn" type="button">
          <span class="ph-coin">${ART.coin(64)}</span>
          <span class="ph-main">
            <span class="ph-label">My points</span>
            <span class="ph-num">${sum.available.toLocaleString("en-GB")}</span>
            ${myrRate ? `<span class="ph-value">💵 Worth <b>${MYR(sum.available * myrRate)}</b></span>` : ""}
            <span class="ph-sub">${sum.onHold ? `<span class="ph-hold">🔒 ${sum.onHold.toLocaleString("en-GB")} on hold</span> · ` : ""}${sum.used ? sum.used.toLocaleString("en-GB") + " used · " : ""}${sum.deducted ? sum.deducted.toLocaleString("en-GB") + " deducted · " : ""}${sum.earned.toLocaleString("en-GB")} earned · <u>see history</u></span>
          </span>
          <span class="ph-extra">
            <span>⭐ <b>${stars}</b> ${stars === 1 ? "star" : "stars"}</span>
            <span>🏅 <b>${badgeCount}</b> ${badgeCount === 1 ? "badge" : "badges"}</span>
          </span>
        </button>
        <h2 class="section-h">Choose a subject</h2>
        <div class="subject-grid">${DATA.SUBJECTS.map(s => subjectCard(s, hist)).join("")}</div>
        <div class="menu-cards">
          ${(() => { const t = badgeTotals(); return t.ids.length ? `<button class="trophy-card" id="trophyBtn" type="button">
              <span class="trophy-card-icon">🏆</span>
              <span class="trophy-card-text"><b>Trophy Room</b><small>${t.got} of ${plural(t.ids.length, "badge")} collected</small></span>
              <span class="trophy-card-medals">${t.ids.map(id => ART.badge(id, 34, !!t.earned[id])).join("")}</span>
            </button>` : ""; })()}
          <button class="trophy-card shop-card" id="shopBtn" type="button">
            <span class="trophy-card-icon">🛍️</span>
            <span class="trophy-card-text"><b>Shop</b><small>Spend your ${sum.available.toLocaleString("en-GB")} points${sum.onHold ? " · 🔒 " + sum.onHold.toLocaleString("en-GB") + " on hold" : ""}</small></span>
            <span class="shop-tag">💵 Cash · 🎮 Games</span>
          </button>
        </div>
        <div class="menu-actions">
          <button class="btn" id="report" type="button">📊 Parent Report</button>
          <button class="btn" id="hist" type="button">📈 History &amp; Analysis</button>
          <button class="btn ghost" id="how" type="button">❓ How it works</button>
          <button class="btn ghost" id="snd" type="button">${SOUND.isMuted() ? "🔇 Sound: off" : "🔊 Sound: on"}</button>
        </div>
        <div class="menu-foot">
          ${syncBadge()}
          <div class="row">
            <button class="link-btn" id="adminBtn" type="button">🔒 Admin${pendingAll ? ` · <b class="gold">${plural(pendingAll, "request")} waiting</b>` : ""}</button>
            ${AUTH.user ? `<button class="link-btn" id="out" type="button">Sign out (${esc(email)})</button>`
                        : `<button class="link-btn" id="out" type="button">Back to the login screen</button>`}
          </div>
        </div>
      </div>`);
    $$(".subject-card").forEach(c => { c.onclick = () => renderSubject(c.dataset.subject); });
    $("#adminBtn").onclick = renderAdmin;
    if ($("#trophyBtn")) $("#trophyBtn").onclick = () => renderTrophyRoom(renderMenu);
    $("#shopBtn").onclick = renderShop;
    $("#pointsBtn").onclick = () => renderPointsHistory(renderMenu);
    $("#switch").onclick = () => renderProfileSelect();
    $("#report").onclick = renderReport;
    $("#hist").onclick = () => renderHistory("all", renderMenu);
    $("#how").onclick = renderHow;
    $("#snd").onclick = () => { SOUND.toggleMute(); if (!SOUND.isMuted()) SOUND.play("click"); renderMenu(); };
    $("#out").onclick = () => {
      if (AUTH.user) showConfirm("Sign out?", "Your progress is saved in the cloud. Sign in again on any device to carry on.", "Sign out", () => AUTH.signOut());
      else AUTH.signOut();
    };
    wireSyncBadge();
  }

  function renderHow() {
    current = renderHow;
    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>❓ How it works</h2></div>
      <div class="page narrow prose">
        <p>📚 <b>Pick a subject</b> — English, Bahasa or Maths — then a <b>module</b> (for example English → Grammar), a <b>topic</b> (for example Conjunctions) and a <b>level</b>.</p>
        <p>📊 Every module has a <b>module report</b> (which topics are weakest) and every topic has a <b>topic report</b> (which levels and question types are weakest).</p>
        <p>Every level has two parts:</p>
        <p>📝 <b>Assessment</b> — a short set of questions picked at random from that level, so it's different every time. Tap an answer, type it, or listen and spell. Wrong answers show the correct one before moving on.</p>
        <p>📊 <b>Progress report</b> — every score, how many attempts, the weak areas, the last practice date and the mastery status.</p>
        <p>🏆 <b>Mastery</b> — ${esc(REPORT.MASTERY_RULE)} Along the way a level shows <i>Needs practice</i>, <i>Developing</i> or <i>Almost mastered</i>.</p>
        <p>⭐ <b>Stars</b> — 50% = 1 star, 70% = 2 stars, 90% = 3 stars. Your best score on each level counts.</p>
        <p>${ART.coin(16)} <b>Points</b> — earned by <b>beating your own best score</b> on a level. Every 1% above your old best earns points (a parent sets how many for each subject). Repeating a level without beating your best earns nothing — so aim higher each time! Once you've scored <b>100%</b> on a level, every replay that scores <b>90% or more</b> earns a <b>+5 replay bonus</b>.</p>
        <p>🎮 <b>Quest Arena</b> — games that use what you've learned. In Maths, <b>Beat the Clock</b> gives you 3 lives and 15 times-table questions with 10 seconds each — survive to become a 🥷 <b>Times Table Ninja</b>. Then 15 more with just 5 seconds each to become a 🧙 <b>Multiplication Wizard</b>! Every badge you win lives in the 🏆 <b>Trophy Room</b>. Winning a round also pays points: <b>+50</b> the first time you win Round 1, <b>+60</b> the first time you win Round 2, then <b>+5</b> every time you win a round again. In <b>Meteor Mayhem</b>, numbers fall from the sky — tap <b>Odd</b> or <b>Even</b> before each one lands! Level 1 numbers take 10 seconds to fall, Level 2 take 5 and Level 3 just 3, for the ☄️ <b>Comet Catcher</b>, 🚀 <b>Rocket Ranger</b> and 🪐 <b>Galaxy Guardian</b> badges. Each level pays <b>+50</b> the first time you clear it, then <b>+5</b> every time after.</p>
        <p>🛍️ <b>Shop</b> — spend the points you've earned. <b>Redeem cash</b>: type an amount in MYR and submit; a parent approves it on the admin page. Until then those points are <b>on hold</b> — if it isn't approved, they come back. <b>Video game console</b>: type how many hours you'd like — each hour costs the points a parent sets — and a parent approves it the same way. You can only ask for what your points cover. Tap your points on the menu to see your <b>points history</b>.</p>
        <p>📊 <b>Parent Report</b> — mastery for every module, topic and level across all three subjects, the levels that need help, badges, and recent mistakes.</p>
        <p>☁️ <b>Same results everywhere</b> — sign in with the same email on a phone, tablet or computer and you get the same players, scores and reports. Assessments finished offline are kept and uploaded automatically next time the app is online.</p>
        <div class="row" style="margin-top:18px"><button class="btn primary" id="backBtn" type="button">← Back to the menu</button></div>
      </div>`);
    $("#bk").onclick = renderMenu;
    $("#backBtn").onclick = renderMenu;
  }

  function soonCard(title, text) {
    return `<div class="soon-card">
      <div class="soon-owl">${ART.owl()}</div>
      <div class="soon-badge">Coming soon</div>
      <h2>${esc(title)}</h2>
      <p>${text}</p>
    </div>`;
  }

  /* ===================== subject → Study Mode ===================== *
     Opening a subject asks how to study:
       By Module      → every module → its topics (+ module report) → a topic's levels
       By School Year → Year 1…6 → the levels tagged with that year (data.js `years`)
     `studyCtx` remembers the path so "back" from a level returns to the
     topic page or the year page the child came from. */
  let studyCtx = { subjectId: null, mode: "topic", year: null };
  const STUDY_KEY = "qa_study_";
  function lastStudy(subjectId) { try { return localStorage.getItem(STUDY_KEY + subjectId) || ""; } catch (e) { return ""; } }
  function rememberStudy(subjectId, v) { try { localStorage.setItem(STUDY_KEY + subjectId, v); } catch (e) { } }

  const ICON_BOOK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5.5C4.6 4 8.2 4 12 6c3.8-2 7.4-2 10-.5V19c-2.6-1.5-6.2-1.5-10 .5-3.8-2-7.4-2-10-.5z"/><path d="M12 6v13.5"/></svg>`;
  const ICON_CAP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v4.8c0 1.4 2.7 3.2 6 3.2s6-1.8 6-3.2v-4.8"/><path d="M22 9.5v5.5"/></svg>`;
  const ICON_GAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 11h4M8 9v4"/><path d="M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5z"/></svg>`;

  function subjectHero(subj, hist) {
    return `<div class="subject-hero">
        <div class="subject-hero-art">${ART.subject(subj.id)}</div>
        <div>
          <div class="subject-hero-name">${esc(subj.fullLabel || subj.label)}</div>
          <div class="muted">${esc(subj.tagline)}</div>
          ${hist.length ? `<div class="subject-hero-stats">⭐ ${totalStars(hist)} · ${ART.coin(13)} ${plural(STORE.points(null, subj.id), "point")} · ${plural(hist.length, "assessment")} · average ${avgPct(hist)}%</div>` : ""}
        </div>
      </div>`;
  }

  function renderSubject(subjectId) { renderStudyMode(subjectId); }

  function renderStudyMode(subjectId) {
    const subj = DATA.subject(subjectId);
    if (!subj) return renderMenu();
    current = () => renderStudyMode(subjectId);
    const hist = STORE.history(subjectId);
    const last = lastStudy(subjectId);
    const names = subj.topics.map(t => t.label);
    const topicLine = names.length ? esc(names.slice(0, 3).join(", ")) + (names.length > 3 ? "…" : "") : "Coming soon";
    const readyYears = DATA.SCHOOL_YEARS.filter(y => DATA.yearTopics(subjectId, y).length);
    const arenaGames = DATA.games(subjectId);
    const arenaBadges = [].concat.apply([], arenaGames.map(gm => gm.rounds.map(r => r.badge).filter(Boolean)));
    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>${esc(subj.label)}</h2></div>
      <div class="page narrow">
        ${subjectHero(subj, hist)}
        <div class="study-box">
          <h3 class="study-h">How would you like to study?</h3>
          <div class="study-grid">
            <button class="study-card" id="byTopic" type="button">
              ${last === "topic" ? `<span class="study-last">Last used</span>` : ""}
              <span class="study-icon">${ICON_BOOK}</span>
              <span class="study-title">By Module</span>
              <span class="study-desc">Choose a module and a topic, then work up through its levels.</span>
              <span class="study-eg">${topicLine}</span>
            </button>
            <button class="study-card" id="byYear" type="button">
              ${last.indexOf("year") === 0 ? `<span class="study-last">Last used</span>` : ""}
              <span class="study-icon">${ICON_CAP}</span>
              <span class="study-title">By School Year</span>
              <span class="study-desc">Study topics based on your school year's syllabus.</span>
              <span class="study-eg">Year ${DATA.SCHOOL_YEARS.join(", ")}</span>
              ${readyYears.length ? `<span class="study-ready">Ready now: ${readyYears.map(y => "Year " + y).join(", ")}</span>` : ""}
            </button>
            <button class="study-card" id="byGame" type="button">
              ${last === "game" ? `<span class="study-last">Last used</span>` : ""}
              <span class="study-icon">${ICON_GAME}</span>
              <span class="study-title">Quest Arena</span>
              <span class="study-desc">Play games and battles that use what you've learned.</span>
              ${arenaGames.length
                ? `<span class="study-eg">${esc(arenaGames.map(gm => gm.label).join(", "))}</span>
                   <span class="study-ready">🏅 ${arenaBadges.filter(b => STORE.badges()[b]).length}/${arenaBadges.length} badges</span>`
                : `<span class="study-eg">Battles · Races · Puzzles</span>
                   <span class="soon-pill sm">Coming soon</span>`}
            </button>
          </div>
        </div>
        <button class="btn full" id="histBtn" type="button" style="margin-top:18px">📈 ${esc(subj.label)} history &amp; analysis${hist.length ? ` <span class="muted">· ${plural(hist.length, "assessment")}</span>` : ""}</button>
      </div>`, subjectId);
    $("#bk").onclick = renderMenu;
    $("#byTopic").onclick = () => { rememberStudy(subjectId, "topic"); renderTopicList(subjectId); };
    $("#byYear").onclick = () => { rememberStudy(subjectId, "year"); renderYearList(subjectId); };
    $("#byGame").onclick = () => { rememberStudy(subjectId, "game"); renderArena(subjectId); };
    $("#histBtn").onclick = () => renderHistory(subjectId, () => renderStudyMode(subjectId));
  }

  /* ===================== Quest Arena (games) =====================
     A subject's arena lists its games (DATA.games). A game with no kind asks
     typed questions from a level's bank, each with its own countdown
     (rounds[].perQuestion seconds). A wrong answer — or running out of time —
     costs one of the lives, which last the whole game. Clearing a round earns
     its badge.
     Falling games use the same lives, rounds, points and badges, but the
     question falls from the sky over perQuestion seconds. Kind "odd_even"
     (Meteor Mayhem): tap Odd or Even before the number lands. Kind "blaster"
     (Multiple Blaster): type the answer to a falling sum and it's shot down.
     Kind "battle" (Divide & Conquer): each level is a fight with a monster that
     has rounds[].questions lives, so wrong answers don't move the level on:
     it ends when the monster's lives are gone. A wrong answer, or the clock,
     and the monster hits the player, which costs one of the player's lives.
     Kind "picture" (Kilat Kata): a picture and 4 words; tap the right one before
     the clock runs out. */
  let game = null;          // the run in progress
  let gameTimer = null;
  function stopGameTimer() { if (gameTimer) { clearInterval(gameTimer); gameTimer = null; } }
  const mmss = (ms) => { const sec = Math.max(0, Math.floor(ms / 1000)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); };
  // Answering time, e.g. "42.3s" (or "1:05" past a minute).
  const secs = (ms) => (ms < 60000 ? (Math.max(0, ms) / 1000).toFixed(1) + "s" : mmss(ms));
  const isOddEven = (def) => !!def && def.kind === "odd_even";
  const isBlaster = (def) => !!def && def.kind === "blaster";
  const isBattle = (def) => !!def && def.kind === "battle";
  const isPicture = (def) => !!def && def.kind === "picture";
  const isFalling = (def) => isOddEven(def) || isBlaster(def);
  // These games have no ✓ key: the answer goes in by itself once it's typed.
  const autoAnswers = (def) => isBlaster(def) || isBattle(def);
  // What the game calls a round on screen: "Level", or "Round" if the game doesn't say.
  const roundWord = (def) => (def && def.roundName) || "Round";

  // Meteor Mayhem: n different numbers with 1 to 4 digits (each length picked
  // equally often; 1-digit ones run out sooner, as there are only 9), never
  // more than 3 odd or 3 even in a row.
  function oddEvenNumbers(n) {
    const ranges = [[1, 9], [10, 99], [100, 999], [1000, 9999]];
    const used = new Set(), out = [];
    while (out.length < n) {
      const r = ranges[Math.floor(Math.random() * ranges.length)];
      const v = r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
      const answer = v % 2 ? "Odd" : "Even";
      if (used.has(v) || (out.length >= 3 && out.slice(-3).every(q => q.answer === answer))) continue;
      used.add(v);
      out.push({ text: String(v), answer: answer });
    }
    return out;
  }
  // "4738 is even — it ends in 8." (shown when a number is missed)
  function oddEvenWhy(q) {
    return `${esc(q.text)} is <b>${q.answer.toLowerCase()}</b> — it ends in ${esc(q.text.slice(-1))}.`;
  }

  // Times-table facts for one game, tables.from to tables.to on both sides (so never × 1):
  // `size(r)` facts for each level. Every table comes up in every level, never twice in a
  // row; no product repeats in a level; and a fact never repeats in a game. factKey says
  // which facts count as the same.
  function dealFacts(def, size, factKey) {
    const nums = [];
    for (let n = def.tables.from; n <= def.tables.to; n++) nums.push(n);
    const deal = () => {
      const usedFacts = new Set(), facts = [];
      let last = 0;
      for (const r of def.rounds) {
        const usedProducts = new Set();
        let queue = [];
        for (let i = 0; i < size(r); i++) {
          if (!queue.length) {
            queue = shuffle(nums);
            if (queue[queue.length - 1] === last) queue.reverse();
          }
          const table = last = queue.pop();
          const times = shuffle(nums).filter(t => !usedFacts.has(factKey(table, t)) && !usedProducts.has(table * t))[0];
          if (!times) return null;              // this table has run out late in the game
          usedFacts.add(factKey(table, times));
          usedProducts.add(table * times);
          facts.push({ table, times });
        }
      }
      return facts;
    };
    let facts = deal();
    while (!facts) facts = deal();              // happens now and then, so simply deal again
    return facts;
  }
  // Multiple Blaster: 7 × 8 and 8 × 7 are different sums, but can't share a level (same answer).
  function blasterSums(def) {
    return dealFacts(def, r => r.questions, (a, b) => a + "×" + b)
      .map(f => ({ text: f.table + " × " + f.times, answer: String(f.table * f.times) }));
  }
  // Divide & Conquer: 56 ÷ 7 and 56 ÷ 8 are one fact, so a game only uses one of them.
  // Each level has enough for the monster's lives plus every miss the player can survive.
  function battleSums(def) {
    return dealFacts(def, r => battleSize(def, r), (a, b) => Math.min(a, b) + "×" + Math.max(a, b))
      .map(f => ({ text: (f.table * f.times) + " ÷ " + f.table, answer: String(f.times) }));
  }
  const battleSize = (def, r) => r.questions + def.lives - 1;

  // Kilat Kata: picture questions from the game's banks, in a random order. A word is
  // asked once a game at most, and so is a picture that shares a `same` key.
  function pictureQuestions(def) {
    const need = def.rounds.reduce((n, r) => n + r.questions, 0);
    const pool = shuffle([].concat.apply([], (def.banks || []).map(b => DATA.bank(def.subjectId, b.topicId, b.levelId) || []))
      .filter(q => q.pic && Array.isArray(q.options) && q.options[q.answer] != null));
    const words = new Set(), pics = new Set(), out = [];
    pool.forEach(q => {
      const word = String(q.options[q.answer]), key = q.same || q.pic;
      if (out.length >= need || words.has(word.toLowerCase()) || pics.has(key)) return;
      words.add(word.toLowerCase());
      pics.add(key);
      out.push({ pic: q.pic, options: shuffle(q.options.slice()), answer: word, text: (q.q || "Gambar") + " (gambar: " + word + ")" });
    });
    return out.length === need ? out : null;
  }

  function badgeChip(badgeId, earnedTs, isNew) {
    const b = DATA.BADGES[badgeId] || { label: badgeId };
    return `<span class="badge-chip${earnedTs ? " on" : ""}${isNew ? " new" : ""}">${ART.badge(badgeId, isNew ? 56 : 40, !!earnedTs)}
      <span class="badge-text"><b>${esc(b.label)}</b><small>${isNew ? "NEW BADGE!" : earnedTs ? "Earned " + esc(REPORT.shortDate(earnedTs)) : "Not earned yet"}</small></span></span>`;
  }

  // Best results line for a game, from the player's runs.
  function gameBest(def, log) {
    if (!log.length) return "Not played yet — be the first to try!";
    const parts = [plural(log.length, "game") + " played"];
    const fastest = (round) => {
      const t = log.filter(e => e.cleared >= round && e["r" + round + "Ms"]).map(e => e["r" + round + "Ms"]);
      return t.length ? Math.min.apply(null, t) : null;
    };
    const best = def.rounds.map((r, i) => fastest(i + 1));
    best.forEach((t, i) => { if (t != null) parts.push("fastest " + roundWord(def) + " " + (i + 1) + ": " + secs(t)); });
    if (best.every(t => t == null)) parts.push("best: " + Math.max.apply(null, log.map(e => e.correct || 0)) + " correct");
    return parts.join(" · ");
  }

  // Facts for a game from the level's bank (1-digit × 1-digit only). 6 × 7 and
  // 7 × 6 are ONE fact: each pool entry lists the ways to write it, and a game
  // shows each fact once, written one of those ways at random.
  function gamePool(def) {
    const src = def.source || {};
    const bank = DATA.bank(def.subjectId, src.topicId, src.levelId) || [];
    const facts = {}, order = [];
    bank.forEach(q => {
      const m = String(q.q || "").match(/^\s*(\d+)\s*×\s*(\d+)/);
      if (!m || q.word == null) return;
      const a = +m[1], b = +m[2];
      if (src.maxFactor && (a > src.maxFactor || b > src.maxFactor)) return;
      const key = Math.min(a, b) + "×" + Math.max(a, b);
      if (!facts[key]) { facts[key] = []; order.push(key); }
      const text = a + " × " + b;
      if (!facts[key].some(v => v.text === text)) facts[key].push({ text: text, answer: String(q.word) });
    });
    return order.map(k => facts[k]);
  }

  function renderArena(subjectId) {
    const subj = DATA.subject(subjectId);
    if (!subj) return renderMenu();
    current = () => renderArena(subjectId);
    const list = DATA.games(subjectId);
    const top = `<div class="topbar"><span class="back" id="bk">← Study mode</span><h2>${esc(subj.label)} · Quest Arena</h2></div>`;
    if (!list.length) {
      show(`${top}
        <div class="page narrow">
          ${soonCard("The Quest Arena is being built",
            `Games and battles for <b>${esc(subj.label)}</b> are on the way — use what you've learned to beat challenges and earn badges. Meanwhile, keep levelling up in <b>By Module</b>!`)}
          <div class="row" style="margin-top:18px"><button class="btn primary" id="toTopics" type="button">📚 Go to By Module</button></div>
        </div>`, subjectId);
      $("#bk").onclick = () => renderStudyMode(subjectId);
      $("#toTopics").onclick = () => { rememberStudy(subjectId, "topic"); renderTopicList(subjectId); };
      return;
    }
    const earned = STORE.badges();
    const tiles = list.map(def => {
      const ids = def.rounds.map(r => r.badge).filter(Boolean), got = ids.filter(id => earned[id]).length;
      return `<button class="game-tile${ids.length && got === ids.length ? " done" : ""}" data-game="${esc(def.id)}" type="button">
          <span class="gt-icon">${def.icon || "🎮"}</span>
          <span class="gt-name">${esc(def.label)}</span>
          <span class="gt-stats"><span>🏅 ${got}/${ids.length}</span><span class="gt-pts">${ART.coin(15)} +${pointsToWin(def)}</span></span>
        </button>`;
    }).join("");
    show(`${top}
      <div class="page narrow">
        <div class="game-tiles">${tiles}</div>
        <button class="btn full" id="trophyBtn" type="button" style="margin-top:16px">🏆 Trophy Room — all my badges</button>
      </div>`, subjectId);
    $("#bk").onclick = () => renderStudyMode(subjectId);
    $("#trophyBtn").onclick = () => renderTrophyRoom(() => renderArena(subjectId));
    $$("[data-game]").forEach(b => { b.onclick = () => renderGameIntro(subjectId, b.dataset.game); });
  }

  // What a full run can pay right now: each level's next win, plus the quest bonus if it's still to come.
  function pointsToWin(def) {
    return def.rounds.reduce((n, r, i) => n + STORE.arenaNextPoints(def.id, i), 0) + (STORE.questBonus(def.id) ? 0 : DATA.QUEST_BONUS);
  }

  // "Points you can win": a row for each level, its badge and what it pays.
  function pointsPlan(def) {
    const earned = STORE.badges(), soFar = STORE.arenaPoints(null, null, def.id), pays = def.rounds[0].points || {};
    const rows = def.rounds.map((r, i) => {
      const b = r.badge && DATA.BADGES[r.badge];
      return `<div class="pp-row">
          <span class="pp-medal">${b ? ART.badge(r.badge, 32, !!earned[r.badge]) : ""}</span>
          <span class="pp-name">${roundWord(def)} ${i + 1} · ${r.perQuestion} sec${b ? `<small>${esc(b.label)}</small>` : ""}</span>
          <span class="pp-pts">${ART.coin(18)} +${STORE.arenaNextPoints(def.id, i)}</span>
        </div>`;
    }).join("");
    return `<div class="points-plan">
        <div class="pp-title">Points you can win<small>First win +${pays.first || 0}, then +${pays.repeat || 0}</small></div>
        ${rows}
        <div class="pp-row">
          <span class="pp-medal">🏆</span>
          <span class="pp-name">Win all ${def.rounds.length} ${roundWord(def).toLowerCase()}s<small>Quest bonus, paid once</small></span>
          <span class="pp-pts">${STORE.questBonus(def.id) ? "✓" : `${ART.coin(18)} +${DATA.QUEST_BONUS}`}</span>
        </div>
        <div class="pp-total">Win them all now: <b>+${pointsToWin(def)}</b>${soFar ? ` · earned so far <b>${soFar}</b>` : ""}</div>
      </div>`;
  }

  function renderGameIntro(subjectId, gameId) {
    const def = DATA.game(gameId);
    if (!def) return renderArena(subjectId);
    current = () => renderGameIntro(subjectId, gameId);
    const log = STORE.gameLog(def.id);
    show(`
      <div class="topbar"><span class="back" id="bk">← Quest Arena</span><h2>${def.icon || "🎮"} ${esc(def.label)}</h2></div>
      <div class="page narrow">
        <div class="card wide center game-page">
          <div class="muted">${esc(def.desc)}</div>
          ${isBattle(def) ? `<div class="df-lineup"><span class="df-me">${ART.hero((STORE.active() || {}).gender)}</span><b>VS</b>${def.rounds.map(r => `<span>${ART.monster(r.monster.art)}</span>`).join("")}</div>` : ""}
          <div class="game-lives">${"❤️".repeat(def.lives)} <b>${def.lives} lives</b></div>
          ${pointsPlan(def)}
          ${log.length ? `<div class="muted small">${esc(gameBest(def, log))}</div>` : ""}
          <div class="row" style="margin-top:14px">
            <button class="btn ghost" id="backBtn" type="button">← Back</button>
            <button class="btn primary" id="startBtn" type="button">Start ▶</button>
          </div>
        </div>
      </div>`, subjectId);
    $("#bk").onclick = () => renderArena(subjectId);
    $("#backBtn").onclick = () => renderArena(subjectId);
    $("#startBtn").onclick = () => startGame(subjectId, gameId);
  }

  function startGame(subjectId, gameId) {
    const def = DATA.game(gameId);
    if (!def) return;
    const need = def.rounds.reduce((n, r) => n + r.questions, 0);
    let qs;
    if (isOddEven(def)) qs = oddEvenNumbers(need);
    else if (isBlaster(def)) qs = blasterSums(def);
    else if (isBattle(def)) qs = battleSums(def);
    else if (isPicture(def)) {
      qs = pictureQuestions(def);
      if (!qs) { toast("This game's questions aren't ready yet.", "bad"); return; }
      qs.forEach(q => { new Image().src = q.pic; });   // every picture ready before its turn
    }
    else {
      const pool = gamePool(def);
      if (!pool.length) { toast("This game's questions aren't ready yet.", "bad"); return; }
      let facts = shuffle(pool);
      while (facts.length < need) facts = facts.concat(shuffle(pool));   // only if a game needs more facts than exist
      qs = facts.slice(0, need).map(ways => ways[Math.floor(Math.random() * ways.length)]);
    }
    game = {
      def, subjectId, qs: qs, qi: 0, round: 0, inRound: 0,
      lives: def.lives, correct: 0, answered: 0, tooSlow: 0, cleared: 0, missed: [],
      times: [], roundMs: 0, newBadges: [], points: 0, roundPts: [], questBonus: 0, typed: "", busy: false, over: false,
      qStart: 0, qDeadline: 0, lastTick: 0
    };
    renderGameRound();
  }

  function renderGameRound() {
    const g = game;
    if (!g) return;
    const r = g.def.rounds[g.round];
    const fall = isFalling(g.def), blaster = isBlaster(g.def), battle = isBattle(g.def), picture = isPicture(g.def), auto = autoAnswers(g.def);
    current = null;
    const flash = `<div class="bc-flash" id="bcFlash"></div>`;
    const pad = `<div class="keyboard numeric bc-pad">
          ${["123", "456", "789"].map(row => `<div class="kb-row">${row.split("").map(c => `<button type="button" class="kb-key" data-key="${c}">${c}</button>`).join("")}</div>`).join("")}
          <div class="kb-row"><button type="button" class="kb-key kb-back" data-key="back" aria-label="Delete">⌫</button><button type="button" class="kb-key" data-key="0">0</button>${auto ? "" : `<button type="button" class="kb-key kb-ok" data-key="ok" aria-label="Check">✓</button>`}</div>
        </div>`;
    // Falling games: the question falls down the sky (#bcQ). Otherwise it sits above the number pad.
    const play = battle
      ? `<div class="df-arena ${esc(r.monster.art)} atk-${esc(r.monster.attack)}" id="dfArena">
          ${ART.arena(r.monster.art)}
          <div class="df-hp"><span class="df-name">${esc(r.monster.name)}</span><span class="df-pips" id="dfPips"></span></div>
          <div class="df-ground"></div>
          <div class="df-fighter df-hero" id="dfHero">${ART.hero((STORE.active() || {}).gender)}</div>
          <div class="df-fighter df-foe" id="dfFoe">${ART.monster(r.monster.art)}</div>
          <div class="df-boom" id="dfBoom"><b>💥</b><span>−1</span></div>
          <div class="df-cards" id="dfCards"><i>♦</i><i>♠</i><i>♥</i></div>
          <div class="df-shot">${ART.foeShot(r.monster.attack)}</div>
          ${flash}
        </div>
        <div class="bc-q" id="bcQ"></div>
        <div class="bc-timebar"><i id="bcTime"></i></div>
        <div class="bc-ans" id="bcAns"></div>
        ${pad}`
      : blaster
      ? `<div class="oe-sky mb-sky" id="oeSky">
          <div class="oe-num" id="bcQ"></div>
          <div class="mb-beam" id="mbBeam"></div>
          <div class="mb-gun" id="mbGun">${ART.blaster()}</div>
          <div class="oe-ground"></div>
          ${flash}
        </div>
        <div class="bc-timebar"><i id="bcTime"></i></div>
        <div class="bc-ans" id="bcAns"></div>
        ${pad}`
      : picture
      ? `<div class="kk-pic" id="bcQ"><img id="kkImg" alt="Gambar"/></div>
        <div class="bc-timebar"><i id="bcTime"></i></div>
        ${flash}
        <div class="kk-opts">${[0, 1, 2, 3].map(i => `<button type="button" class="kk-opt" data-opt="${i}"></button>`).join("")}</div>`
      : fall
      ? `<div class="oe-sky" id="oeSky"><div class="oe-num" id="bcQ"></div><div class="oe-ground"></div></div>
        <div class="bc-timebar"><i id="bcTime"></i></div>
        ${flash}
        <div class="oe-btns">
          <button type="button" class="oe-btn odd" data-pick="Odd">Odd</button>
          <button type="button" class="oe-btn even" data-pick="Even">Even</button>
        </div>`
      : `<div class="bc-q" id="bcQ"></div>
        <div class="bc-timebar"><i id="bcTime"></i></div>
        <div class="bc-ans" id="bcAns"></div>
        ${flash}
        ${pad}`;
    show(`
      <div class="topbar"><span class="back" id="bk">✕ Quit</span><h2>${g.def.icon || "🎮"} ${esc(g.def.label)}</h2></div>
      <div class="qwrap bc-wrap${auto ? " mb-wrap" : fall ? " oe-wrap" : ""}${battle ? " df-wrap" : ""}${picture ? " kk-wrap" : ""}">
        <div class="bc-hud">
          <span class="bc-lives" id="bcLives"></span>
          <span class="bc-round">${roundWord(g.def)} ${g.round + 1}${battle ? "" : ` · <b id="bcNum">1</b>/${r.questions}`}</span>
          <span class="bc-clock" id="bcClock">${r.perQuestion}s</span>
        </div>
        ${battle ? "" : `<div class="progress"><i id="bcProg" style="width:0%"></i></div>`}
        ${play}
      </div>`, g.subjectId);
    g.inRound = 0; g.typed = ""; g.busy = false; g.roundMs = 0;
    if (battle) g.qi = g.round * battleSize(g.def, r);   // each level has its own sums, however many the last one used
    $("#bk").onclick = () => {
      showConfirm("Quit the game?", g.cleared ? "Your badge stays, but this run ends here." : "This run won't count.", "Quit", () => {
        if (game !== g || g.over) return;
        if (g.cleared) endGame("quit");
        else { g.over = true; stopGameTimer(); game = null; renderGameIntro(g.subjectId, g.def.id); }
      });
    };
    $$(".bc-pad .kb-key").forEach(b => { b.onclick = () => gamePress(b.dataset.key); });
    $$(".oe-btn").forEach(b => { b.onclick = () => gamePick(b.dataset.pick); });
    $$(".kk-opt").forEach(b => { b.onclick = () => picturePick(+b.dataset.opt); });
    keyHandler = picture
      ? (e) => {
          const i = "1234".indexOf(e.key) > -1 ? +e.key - 1 : "abcd".indexOf(String(e.key).toLowerCase());
          if (i > -1 && e.key.length === 1) { picturePick(i); return true; }
        }
      : isOddEven(g.def)
      ? (e) => {
          if (e.key === "o" || e.key === "O" || e.key === "ArrowLeft") { gamePick("Odd"); return true; }
          if (e.key === "e" || e.key === "E" || e.key === "ArrowRight") { gamePick("Even"); return true; }
        }
      : (e) => {
          if (/^[0-9]$/.test(e.key)) { gamePress(e.key); return true; }
          if (e.key === "Backspace") { gamePress("back"); return true; }
          if (e.key === "Enter") { gamePress("ok"); return true; }
        };
    paintGame();
    stopGameTimer();
    gameTimer = setInterval(tickGame, 50);
    tickGame();
  }

  function heartsHtml(g, breaking) {
    return Array.from({ length: g.def.lives }, (_, i) => `<span class="heart${i < g.lives ? "" : " lost"}${breaking && i === g.lives ? " breaking" : ""}">${i < g.lives ? "❤️" : "🖤"}</span>`).join("");
  }

  // Show the next question and start its clock.
  function paintGame() {
    const g = game; if (!g) return;
    const r = g.def.rounds[g.round], q = g.qs[g.qi];
    $("#bcLives").innerHTML = heartsHtml(g, false);
    if (isBattle(g.def)) {
      paintFoeLives(g, g.inRound);
      $("#dfHero").classList.remove("strike", "hurt");
      $("#dfFoe").classList.remove("strike", "hurt");
      $("#dfBoom").className = "df-boom";
    } else {
      $("#bcNum").textContent = Math.min(g.inRound + 1, r.questions);
      $("#bcProg").style.width = Math.round(g.inRound / r.questions * 100) + "%";
    }
    if (isFalling(g.def)) {
      // Drop the next number from a random spot along the top — it lands just as its clock runs out.
      const el = $("#bcQ"), blaster = isBlaster(g.def);
      el.textContent = q.text;
      el.className = "oe-num";
      el.style.left = (blaster ? 26 + Math.random() * 48 : 18 + Math.random() * 64).toFixed(1) + "%";   // a sum is wider
      if (blaster) $("#mbGun").style.left = $("#mbBeam").style.left = el.style.left;   // the blaster takes aim
      el.style.animation = "none";
      void el.offsetWidth;                      // restart the fall from the top
      el.style.animation = `${blaster ? "mb-fall" : "oe-fall"} ${r.perQuestion}s linear forwards`;
    } else if (isPicture(g.def)) {
      $("#bcQ").className = "kk-pic";
      $("#kkImg").src = q.pic;
      $$(".kk-opt").forEach((b, i) => { b.textContent = q.options[i]; b.className = "kk-opt"; });
    } else $("#bcQ").textContent = q.text + " = ?";
    if (!isOddEven(g.def) && !isPicture(g.def)) {
      const ans = $("#bcAns");
      ans.textContent = g.typed || "?";
      ans.className = "bc-ans" + (g.typed ? "" : " empty");
    }
    $("#bcFlash").innerHTML = "";
    g.qStart = Date.now();
    g.qDeadline = g.qStart + r.perQuestion * 1000;
    g.lastTick = 0;
    tickGame();
  }

  function tickGame() {
    const g = game;
    const el = $("#bcClock"), bar = $("#bcTime");
    if (!g || g.over || !el || !bar) { stopGameTimer(); return; }
    if (g.busy || !g.qDeadline) return;                  // the clock pauses while feedback shows
    const total = g.def.rounds[g.round].perQuestion * 1000;
    const left = g.qDeadline - Date.now();
    el.textContent = Math.max(0, Math.ceil(left / 1000)) + "s";
    bar.style.width = Math.max(0, left / total * 100) + "%";
    const warn = left <= Math.min(3000, total * 0.4);
    el.classList.toggle("warn", warn);
    bar.classList.toggle("warn", warn);
    const sec = Math.ceil(left / 1000);
    if (sec <= 2 && sec > 0 && sec !== g.lastTick) { g.lastTick = sec; SOUND.play("tick"); }
    if (left <= 0) gameTimeout();
  }

  function gamePress(k) {
    const g = game;
    if (!g || g.busy || g.over) return;
    if (k === "ok") return gameSubmit();
    if (k === "back") g.typed = g.typed.slice(0, -1);
    else if (g.typed.length < 3) g.typed += k;
    const ans = $("#bcAns");
    ans.textContent = g.typed || "?";
    ans.className = "bc-ans" + (g.typed ? "" : " empty");
    if (autoAnswers(g.def) && g.typed.length === g.qs[g.qi].answer.length) gameSubmit();
  }

  function gameSubmit() {
    const g = game;
    if (!g || g.busy || g.over || !g.typed) return;
    const q = g.qs[g.qi], blaster = isBlaster(g.def), battle = isBattle(g.def);
    const ok = Number(g.typed) === Number(q.answer);
    g.busy = true;
    g.answered++;
    g.roundMs += Math.max(0, Date.now() - g.qStart);
    g.qDeadline = 0;
    if (blaster) $("#bcQ").style.animationPlayState = "paused";   // the sum stops where it was answered
    if (ok) {
      g.correct++;
      SOUND.play("correct");
      $("#bcAns").classList.add("ok");
      if (battle) return heroHits(g);
      if (blaster) fireBlaster();
      setTimeout(() => gameNext(g), blaster ? 350 : 250);
      return;
    }
    g.missed.push({ q: q.text, a: q.answer, c: g.typed });
    if (blaster) $("#bcQ").classList.add("bad");
    if (battle) battleHit("foe");
    loseLife(g, `${esc(q.text)} = <b>${esc(q.answer)}</b>`);
  }

  // Divide & Conquer: the monster's lives, one gone for each hit.
  function paintFoeLives(g, hits) {
    const lives = g.def.rounds[g.round].questions;
    $("#dfPips").innerHTML = Array.from({ length: lives }, (_, i) => `<i class="${i < lives - hits ? "on" : ""}"></i>`).join("");
  }
  // Someone lands a hit: attacker is "hero" or "foe".
  function battleHit(attacker) {
    const hero = $("#dfHero"), foe = $("#dfFoe"), boom = $("#dfBoom");
    hero.classList.remove("strike", "hurt");
    foe.classList.remove("strike", "hurt");
    void hero.offsetWidth;                      // play it again from the start
    aimShots(hero, foe);
    (attacker === "hero" ? hero : foe).classList.add("strike");
    (attacker === "hero" ? foe : hero).classList.add("hurt");
    boom.className = "df-boom " + (attacker === "hero" ? "on-foe" : "on-hero");
  }
  // Every attack leaves the right hand and lands on its target, on any screen size.
  function aimShots(hero, foe) {
    const arena = $("#dfArena"), box = arena.getBoundingClientRect();
    const him = hero.getBoundingClientRect(), it = foe.getBoundingClientRect();
    arena.style.setProperty("--from", (him.left + him.width * 0.72 - box.left) + "px");
    arena.style.setProperty("--land", (it.left + it.width * 0.4 - box.left) + "px");
    arena.style.setProperty("--hero-at", (him.left + him.width * 0.5 - box.left) + "px");
    arena.style.setProperty("--lunge", (him.right - him.width * 0.05 - it.left) + "px");
    const hand = foe.querySelector(".df-from"); if (!hand) return;
    const held = hand.getBoundingClientRect();
    arena.style.setProperty("--foe-at", (held.left + held.width / 2 - box.left) + "px");
    arena.style.setProperty("--foe-y", (box.bottom - held.top - held.height / 2) + "px");
    arena.style.setProperty("--foe-size", held.width + "px");
  }
  // A right answer: the hero's cards hit the monster, and the last hit knocks it out.
  function heroHits(g) {
    const beaten = g.inRound + 1 >= g.def.rounds[g.round].questions;
    battleHit("hero");
    paintFoeLives(g, g.inRound + 1);
    if (beaten) $("#dfFoe").classList.add("down");
    setTimeout(() => gameNext(g), beaten ? 1500 : 850);
  }

  // Multiple Blaster: shoot the falling sum (the blaster took aim when it dropped).
  function fireBlaster() {
    const el = $("#bcQ"), beam = $("#mbBeam");
    beam.style.height = Math.max(0, $("#mbGun").getBoundingClientRect().top - el.getBoundingClientRect().bottom) + "px";
    beam.classList.remove("fire");
    void beam.offsetWidth;                      // fire again from the start
    beam.classList.add("fire");
    el.classList.add("ok");
  }

  // Meteor Mayhem: Odd or Even tapped for the falling number.
  function gamePick(pick) {
    const g = game;
    if (!g || g.busy || g.over || !g.qDeadline) return;
    const q = g.qs[g.qi], el = $("#bcQ");
    g.busy = true;
    g.answered++;
    g.roundMs += Math.max(0, Date.now() - g.qStart);
    g.qDeadline = 0;
    el.style.animationPlayState = "paused";     // the number stops where it was caught
    if (pick === q.answer) {
      g.correct++;
      SOUND.play("correct");
      el.classList.add("ok");
      setTimeout(() => gameNext(g), 350);
      return;
    }
    g.missed.push({ q: q.text, a: q.answer, c: pick });
    loseLife(g, `✗ ${oddEvenWhy(q)}`);
  }

  // Kilat Kata: one of the 4 words tapped.
  function picturePick(i) {
    const g = game;
    if (!g || g.busy || g.over || !g.qDeadline) return;
    const q = g.qs[g.qi], pick = q.options[i], btns = $$(".kk-opt");
    if (pick == null) return;
    g.busy = true;
    g.answered++;
    g.roundMs += Math.max(0, Date.now() - g.qStart);
    g.qDeadline = 0;
    btns[q.options.indexOf(q.answer)].classList.add("ok");
    if (pick === q.answer) {
      g.correct++;
      SOUND.play("correct");
      setTimeout(() => gameNext(g), 450);
      return;
    }
    btns[i].classList.add("bad");
    g.missed.push({ q: q.text, a: q.answer, c: pick });
    loseLife(g, `✗ It's <b>${esc(q.answer)}</b>`);
  }

  // The question's clock ran out — counts like a wrong answer.
  function gameTimeout() {
    const g = game;
    if (!g || g.busy || g.over) return;
    const q = g.qs[g.qi];
    g.busy = true;
    g.answered++;
    g.tooSlow++;
    g.missed.push({ q: q.text, a: q.answer, slow: 1 });
    g.roundMs += g.def.rounds[g.round].perQuestion * 1000;
    g.qDeadline = 0;
    $("#bcClock").textContent = "0s";
    $("#bcTime").style.width = "0%";
    if (isFalling(g.def)) {
      $("#bcQ").classList.add("landed");
      loseLife(g, `💥 It landed! ${isBlaster(g.def) ? `${esc(q.text)} = <b>${esc(q.answer)}</b>` : oddEvenWhy(q)}`);
    } else if (isPicture(g.def)) {
      $$(".kk-opt")[q.options.indexOf(q.answer)].classList.add("ok");
      loseLife(g, `⏰ Too slow! It's <b>${esc(q.answer)}</b>`);
    } else {
      if (isBattle(g.def)) battleHit("foe");
      loseLife(g, `⏰ Too slow! ${esc(q.text)} = <b>${esc(q.answer)}</b>`);
    }
  }

  function loseLife(g, flashHtml) {
    g.lives--;
    SOUND.play("wrong");
    ($("#bcAns") || $("#bcQ")).classList.add("bad");
    $("#bcFlash").innerHTML = flashHtml;
    $("#bcLives").innerHTML = heartsHtml(g, true);
    if (g.lives <= 0) {
      if (isBattle(g.def)) $("#dfHero").classList.add("down");
      setTimeout(() => { if (game === g && !g.over) endGame("lives"); }, isBattle(g.def) ? 1700 : 1200);
    } else setTimeout(() => gameNext(g, true), 1100);
  }

  function gameNext(g, missed) {
    if (game !== g || g.over) return;
    g.qi++; g.typed = ""; g.busy = false;
    if (!(missed && isBattle(g.def))) g.inRound++;   // a miss doesn't hurt the monster
    const r = g.def.rounds[g.round];
    if (g.inRound >= r.questions) return roundCleared();
    paintGame();
  }

  function roundCleared() {
    const g = game;
    const r = g.def.rounds[g.round];
    g.times[g.round] = g.roundMs;
    stopGameTimer();
    g.cleared = g.round + 1;
    const bonusBefore = STORE.questBonus(g.def.id);
    const gained = STORE.recordArenaWin(g.def.id, g.round);
    g.roundPts[g.round] = gained;
    g.points += gained;
    g.questBonus += STORE.questBonus(g.def.id) - bonusBefore;
    if (r.badge && STORE.awardBadge(r.badge)) g.newBadges.push(r.badge);
    SOUND.play("win");
    if (gained) setTimeout(() => SOUND.play("coin"), 600);
    if (g.round + 1 < g.def.rounds.length) renderRoundBreak();
    else endGame("won");
  }

  // A level is won: a popup with the points earned and one way on, the next level.
  // It's locked, so there's no way out of it, not even the phone's back button.
  function renderRoundBreak() {
    const g = game, pts = g.roundPts[g.round], word = roundWord(g.def);
    document.body.insertAdjacentHTML("beforeend", `
      <div class="overlay" id="roundUp" data-locked><div class="modal">
        <div class="big-emoji">🎉</div>
        <h2>${word} ${g.round + 1} cleared!</h2>
        ${pts ? `<div class="points-won">${ART.coin(30)}<div><b>+${plural(pts, "point")}!</b><span>for winning ${word} ${g.round + 1}</span></div></div>` : ""}
        <div class="row"><button class="btn primary" id="goBtn" type="button">Start ${word} ${g.round + 2} ▶</button></div>
      </div></div>`);
    const go = $("#goBtn");
    go.onclick = () => {
      $("#roundUp").remove();
      if (game !== g) return;
      g.round++;
      renderGameRound();
    };
    go.focus();                                 // Enter starts it on a keyboard
  }

  function endGame(reason) {
    const g = game;
    if (!g || g.over) return;
    g.over = true;
    stopGameTimer();
    const overlay = document.querySelector(".overlay");
    if (overlay) overlay.remove();
    const entry = {
      game: g.def.id, subjectId: g.subjectId, ts: Date.now(),
      cleared: g.cleared, reached: g.round + 1, correct: g.correct, answered: g.answered,
      tooSlow: g.tooSlow, livesLeft: g.lives, points: g.points, reason: reason, missed: g.missed
    };
    g.def.rounds.forEach((r, i) => { entry["r" + (i + 1) + "Ms"] = g.cleared > i ? g.times[i] : null; });   // r1Ms, r2Ms, r3Ms…
    const rec = STORE.recordGame(entry);
    game = null;
    renderGameResult(g, rec, reason);
  }

  function renderGameResult(g, rec, reason) {
    const def = g.def;
    current = null;
    const won = g.cleared >= def.rounds.length;
    const head = won ? (def.winText || "You beat the clock!") : reason === "lives" ? "Out of lives!" : g.cleared ? "Well played!" : "Game over";
    const emoji = won ? "🏆" : reason === "lives" ? "💔" : "👏";
    const earned = STORE.badges();
    const stats = [`<b>${g.correct}</b> correct out of ${g.answered}`];
    if (g.tooSlow) stats.push(isFalling(def) ? `💥 ${g.tooSlow} landed` : `⏰ ${g.tooSlow} too slow`);
    def.rounds.forEach((r, i) => { const t = rec["r" + (i + 1) + "Ms"]; if (t) stats.push(`${roundWord(def)} ${i + 1} in <b>${secs(t)}</b>`); });
    const tip = won ? "Amazing! Can you beat your fastest time?"
      : reason === "lives" ? `Practise the tricky ones in <b>By Module → ${esc(DATA.topicLabel(def.subjectId, def.source.topicId))} → ${esc(DATA.levelLabel(def.subjectId, def.source.topicId, def.source.levelId))}</b>, then come back!`
      : "Come back and try for the next badge!";
    show(`
      <div class="topbar"><span class="back" id="bk">← Quest Arena</span><h2>${def.icon || "🎮"} ${esc(def.label)}</h2></div>
      <div class="page narrow">
        <div class="card wide center results-card">
          <div class="big-emoji">${emoji}</div>
          <h2 class="card-h">${head}</h2>
          <div class="muted" style="font-weight:700;line-height:1.7">${stats.join(" · ")}</div>
          ${g.points
            ? `<div class="points-won">${ART.coin(30)}<div><b>+${plural(g.points, "point")}!</b><span>${g.roundPts.map((p, i) => p ? roundWord(def) + " " + (i + 1) + " +" + p : "").filter(Boolean).join(" · ")}</span></div></div>`
            : `<div class="points-none">${ART.coin(18)} No points this time — win ${roundWord(def)} 1 for <b>+${STORE.arenaNextPoints(def.id, 0)}</b>!</div>`}
          ${g.questBonus ? `<div class="points-won">${ART.coin(30)}<div><b>+${plural(g.questBonus, "bonus point")}!</b><span>🏆 Quest complete — every ${roundWord(def).toLowerCase()} won</span></div></div>` : ""}
          ${g.newBadges.length ? `<div class="badge-won">${g.newBadges.map(id => badgeChip(id, earned[id], true)).join("")}</div>` : ""}
          <div class="game-badges center-row" style="margin-top:14px">${def.rounds.filter(r => r.badge && g.newBadges.indexOf(r.badge) < 0).map(r => badgeChip(r.badge, earned[r.badge])).join("")}</div>
          <div class="summary-box" style="margin-top:16px;text-align:left">${tip}</div>
          <div class="row" style="margin-top:18px">
            <button class="btn ghost" id="arenaBtn" type="button">← Quest Arena</button>
            <button class="btn" id="trophyBtn" type="button">🏆 Trophy Room</button>
            <button class="btn primary" id="againBtn" type="button">🔁 Play again</button>
          </div>
        </div>
      </div>`, def.subjectId);
    if (g.newBadges.length) setTimeout(() => SOUND.play("star"), 500);
    $("#bk").onclick = () => renderArena(def.subjectId);
    $("#arenaBtn").onclick = () => renderArena(def.subjectId);
    $("#trophyBtn").onclick = () => renderTrophyRoom(() => renderArena(def.subjectId));
    $("#againBtn").onclick = () => startGame(def.subjectId, def.id);
  }

  /* ===================== Shop =====================
     Players spend points here. Every purchase is a request a parent approves
     or rejects on the admin page; until then its points are ON HOLD.
     Items: 💵 cash (admin sets MYR per point) and 🎮 video game console time
     (admin sets points per hour). EVERY item must refuse a request that needs
     more points than are available — the form keeps Submit greyed out, and
     STORE.requestRedemption refuses it too. */
  const MYR = (n) => "MYR " + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
  const fmtPts = (n) => (Number(n) || 0).toLocaleString("en-GB");
  const SHOP_ICONS = { cash: "💵", console: "🎮" };
  // 0.5 → "½ hour", 1 → "1 hour", 1.5 → "1½ hours"
  function hoursText(h) {
    const whole = Math.floor(h), half = h - whole >= 0.5;
    return ((whole ? String(whole) : "") + (half ? "½" : "") || "0") + (h === 1 || h === 0.5 ? " hour" : " hours");
  }
  // Points for some console time (half an hour at an odd rate rounds up).
  const consolePoints = (hours, pph) => Math.ceil(hours * pph - 1e-9);
  // Most console time the points cover, in half hours.
  const consoleMaxHours = (available, pph) => (pph ? Math.min(24, Math.floor(available * 2 / pph) / 2) : 0);
  // "Cash MYR 5.00" / "2 hours of video game console time"
  function redemptionText(r) {
    return r.item === "console" ? hoursText(r.hours || 0) + " of video game console time" : (r.label || "Cash") + " " + MYR(r.myr);
  }
  function redemptionRate(r) {
    return r.item === "console" ? plural(r.pph || 0, "point") + " per hour" : "1 point = " + MYR(r.rate);
  }

  function balanceHero(sum, label) {
    return `<div class="points-hero">
        <div class="ph-coin">${ART.coin(56)}</div>
        <div class="ph-main">
          <div class="ph-label">${esc(label || "Points to spend")}</div>
          <div class="ph-num">${fmtPts(sum.available)}</div>
          <div class="ph-sub">${sum.onHold ? `<span class="ph-hold">🔒 ${fmtPts(sum.onHold)} on hold</span> · ` : ""}${sum.used ? fmtPts(sum.used) + " used · " : ""}${sum.deducted ? fmtPts(sum.deducted) + " deducted · " : ""}${fmtPts(sum.earned)} earned in total</div>
        </div>
      </div>`;
  }
  function holdBox(sum) {
    const pending = STORE.redemptions().filter(r => r.status === "pending");
    if (!pending.length) return "";
    return `<div class="hold-box">🔒 <b>${plural(sum.onHold, "point")} on hold</b> — ${pending.map(r => esc(redemptionText(r))).join(", ")} waiting for a parent to approve. These points can't be used until then; if a request isn't approved, its points come back.</div>`;
  }

  function renderShop() {
    current = renderShop;
    const sum = STORE.pointsSummary();
    const rate = STORE.myrPerPoint();
    const cashText = !rate ? "Not switched on yet — ask a parent."
      : `Swap points for real money. <b>1 point = ${MYR(rate)}</b>. Your ${fmtPts(sum.available)} points are worth <b>${MYR(sum.available * rate)}</b>.`;
    const pph = STORE.consolePointsPerHour();
    const maxHours = consoleMaxHours(sum.available, pph);
    const consoleText = !pph ? "Not switched on yet — ask a parent."
      : `Swap points for game time. <b>1 hour = ${plural(pph, "point")}</b>. ` +
        (maxHours >= 0.5 ? `Your points cover up to <b>${hoursText(maxHours)}</b>.` : `You need ${plural(consolePoints(0.5, pph), "point")} for ½ hour.`);
    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>🛍️ Shop</h2></div>
      <div class="page narrow">
        ${balanceHero(sum)}
        ${holdBox(sum)}
        <h3 class="section-h">What would you like?</h3>
        <div class="shop-grid">
          <div class="shop-item">
            <div class="shop-icon">💵</div>
            <div class="shop-name">Redeem cash</div>
            <div class="shop-desc">${cashText}</div>
            <button class="btn primary" id="cashBtn" type="button"${rate && sum.available > 0 ? "" : " disabled"}>${!rate ? "Coming soon" : sum.available > 0 ? "Redeem cash →" : "Earn points first"}</button>
          </div>
          <div class="shop-item">
            <div class="shop-icon">🎮</div>
            <div class="shop-name">Video game console</div>
            <div class="shop-desc">${consoleText}</div>
            <button class="btn primary" id="consoleBtn" type="button"${pph && maxHours >= 0.5 ? "" : " disabled"}>${!pph ? "Coming soon" : maxHours >= 0.5 ? "Get console time →" : "Not enough points yet"}</button>
          </div>
          <div class="shop-item soon">
            <div class="shop-icon">🎁</div>
            <div class="shop-name">More items</div>
            <div class="shop-desc">New things to spend your points on are coming soon.</div>
          </div>
        </div>
        <div class="row" style="margin-top:18px">
          <button class="btn ghost" id="backBtn" type="button">← Menu</button>
          <button class="btn" id="histBtn" type="button">📜 Points history</button>
        </div>
      </div>`);
    $("#bk").onclick = renderMenu;
    $("#backBtn").onclick = renderMenu;
    $("#histBtn").onclick = () => renderPointsHistory(renderShop);
    $("#cashBtn").onclick = renderRedeemCash;
    $("#consoleBtn").onclick = renderRedeemConsole;
  }

  function renderRedeemCash() {
    const rate = STORE.myrPerPoint();
    const sum = STORE.pointsSummary();
    if (!rate || sum.available <= 0) return renderShop();
    current = null;                              // keep what's being typed
    const rateCents = Math.round(rate * 100);
    const maxMyr = sum.available * rate;
    show(`
      <div class="topbar"><span class="back" id="bk">← Shop</span><h2>💵 Redeem cash</h2></div>
      <div class="page narrow">
        <div class="card wide redeem-card">
          <div class="redeem-rate">1 point = <b>${MYR(rate)}</b></div>
          <div class="muted">You have <b>${plural(sum.available, "point")}</b> available — worth up to <b>${MYR(maxMyr)}</b>.</div>
          <div class="field" style="margin-top:16px">
            <label for="myrIn">How much cash would you like?</label>
            <div class="myr-wrap"><span class="myr-prefix">MYR</span><input id="myrIn" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" autocomplete="off"/></div>
          </div>
          <button class="btn ghost sm" id="maxBtn" type="button">Use all my points (${MYR(maxMyr)})</button>
          <div class="redeem-preview" id="preview">Type an amount to see how many points it uses.</div>
          <div class="err" id="redeemErr"></div>
          <div class="row" style="margin-top:6px">
            <button class="btn ghost" id="cancelBtn" type="button">Cancel</button>
            <button class="btn primary" id="submitBtn" type="button" disabled>Submit request</button>
          </div>
          <p class="muted small" style="margin-top:12px;line-height:1.6">A parent has to approve it. Until then the points are <b>on hold</b> and can't be used. If it isn't approved, the points come back.</p>
        </div>
      </div>`);
    const input = $("#myrIn"), submit = $("#submitBtn");
    let want = null;                              // { myr, points } when valid
    const evaluate = () => {
      want = null;
      const raw = input.value.trim();
      const myr = Number(raw);
      let msg = "", preview = "Type an amount to see how many points it uses.";
      if (raw) {
        const cents = Math.round(myr * 100);
        if (!isFinite(myr) || myr <= 0) msg = "Type an amount bigger than MYR 0.00.";
        else if (Math.abs(myr * 100 - cents) > 1e-6) msg = "Use up to 2 decimals, e.g. 5.50.";
        else if (cents % rateCents !== 0) msg = `Amounts go up in steps of ${MYR(rate)} (1 point each).`;
        else {
          const points = cents / rateCents;
          preview = `<b>${MYR(myr)}</b> = ${ART.coin(16)} <b>${plural(points, "point")}</b>`;
          if (points > sum.available) msg = `That needs ${plural(points, "point")} — you only have ${fmtPts(sum.available)} available (up to ${MYR(maxMyr)}).`;
          else want = { myr: cents / 100, points: points };
        }
      }
      $("#preview").innerHTML = preview;
      $("#redeemErr").textContent = msg;
      submit.disabled = !want;
    };
    input.oninput = evaluate;
    $("#maxBtn").onclick = () => { input.value = (Math.round(maxMyr * 100) / 100).toFixed(2); evaluate(); };
    $("#bk").onclick = renderShop;
    $("#cancelBtn").onclick = renderShop;
    submit.onclick = () => {
      if (!want) return;
      const w = want;
      showConfirm(`Redeem ${MYR(w.myr)}?`,
        `This uses ${plural(w.points, "point")}. They'll be on hold until a parent approves. If the parent says no, the points come back to you.`,
        "Yes, submit", () => {
          const r = STORE.requestRedemption({ item: "cash", label: "Cash", myr: w.myr, points: w.points, rate: rate });
          if (!r) { toast("Not enough points available for that amount.", "bad"); renderRedeemCash(); return; }
          SOUND.play("coin");
          renderRedeemDone(r);
        });
    };
    setTimeout(() => { try { input.focus(); } catch (e) { } }, 50);
  }

  // 🎮 Console time: type the hours; points = hours × the parent's points per hour.
  function renderRedeemConsole() {
    const pph = STORE.consolePointsPerHour();
    const sum = STORE.pointsSummary();
    const maxHours = consoleMaxHours(sum.available, pph);
    if (!pph || maxHours < 0.5) return renderShop();
    current = null;                              // keep what's being typed
    const quick = [0.5, 1, 2, 3].filter(h => h < maxHours);
    show(`
      <div class="topbar"><span class="back" id="bk">← Shop</span><h2>🎮 Video game console</h2></div>
      <div class="page narrow">
        <div class="card wide redeem-card">
          <div class="redeem-rate">1 hour = <b>${plural(pph, "point")}</b></div>
          <div class="muted">You have <b>${plural(sum.available, "point")}</b> available — enough for up to <b>${hoursText(maxHours)}</b>.</div>
          <div class="field" style="margin-top:16px">
            <label for="hoursIn">How many hours would you like?</label>
            <div class="myr-wrap"><input id="hoursIn" type="number" inputmode="decimal" min="0.5" step="0.5" placeholder="0" autocomplete="off"/><span class="myr-suffix">hours</span></div>
          </div>
          <div class="row" style="justify-content:flex-start;gap:8px">
            ${quick.map(h => `<button class="btn ghost sm" data-h="${h}" type="button">${hoursText(h)}</button>`).join("")}
            <button class="btn ghost sm" id="maxBtn" type="button">Use all (${hoursText(maxHours)})</button>
          </div>
          <div class="redeem-preview" id="preview">Type the hours to see how many points they use.</div>
          <div class="err" id="redeemErr"></div>
          <div class="row" style="margin-top:6px">
            <button class="btn ghost" id="cancelBtn" type="button">Cancel</button>
            <button class="btn primary" id="submitBtn" type="button" disabled>Submit request</button>
          </div>
          <p class="muted small" style="margin-top:12px;line-height:1.6">A parent has to approve it. Until then the points are <b>on hold</b> and can't be used. If it isn't approved, the points come back.</p>
        </div>
      </div>`);
    const input = $("#hoursIn"), submit = $("#submitBtn");
    let want = null;                              // { hours, points } when valid
    const evaluate = () => {
      want = null;
      const raw = input.value.trim();
      const h = Number(raw);
      let msg = "", preview = "Type the hours to see how many points they use.";
      if (raw) {
        if (!isFinite(h) || h <= 0) msg = "Type a number of hours bigger than 0.";
        else if (Math.abs(h * 2 - Math.round(h * 2)) > 1e-9) msg = "Use whole or half hours, e.g. 1 or 1.5.";
        else if (h > 24) msg = "You can ask for up to 24 hours at a time.";
        else {
          const points = consolePoints(h, pph);
          preview = `<b>${hoursText(h)}</b> = ${ART.coin(16)} <b>${plural(points, "point")}</b>`;
          if (points > sum.available) msg = `That needs ${plural(points, "point")} — you only have ${fmtPts(sum.available)} available (up to ${hoursText(maxHours)}).`;
          else want = { hours: h, points: points };
        }
      }
      $("#preview").innerHTML = preview;
      $("#redeemErr").textContent = msg;
      submit.disabled = !want;
    };
    input.oninput = evaluate;
    $$("[data-h]").forEach(b => { b.onclick = () => { input.value = b.dataset.h; evaluate(); }; });
    $("#maxBtn").onclick = () => { input.value = String(maxHours); evaluate(); };
    $("#bk").onclick = renderShop;
    $("#cancelBtn").onclick = renderShop;
    submit.onclick = () => {
      if (!want) return;
      const w = want;
      showConfirm(`Ask for ${hoursText(w.hours)} of console time?`,
        `This uses ${plural(w.points, "point")}. They'll be on hold until a parent approves. If the parent says no, the points come back to you.`,
        "Yes, submit", () => {
          const r = STORE.requestRedemption({ item: "console", label: "Video game console", hours: w.hours, pph: pph, points: w.points });
          if (!r) { toast("Not enough points available for that.", "bad"); renderRedeemConsole(); return; }
          SOUND.play("coin");
          renderRedeemDone(r);
        });
    };
    setTimeout(() => { try { input.focus(); } catch (e) { } }, 50);
  }

  function renderRedeemDone(r) {
    current = null;
    const sum = STORE.pointsSummary();
    show(`
      <div class="topbar"><span class="back" id="bk">← Shop</span><h2>${SHOP_ICONS[r.item] || "🛍️"} Request sent</h2></div>
      <div class="page narrow">
        <div class="card wide center">
          <div class="big-emoji">🔒</div>
          <h2 class="card-h">${esc(redemptionText(r))} — on hold</h2>
          <p class="muted" style="line-height:1.7">${plural(r.points, "point")} are on hold until a parent approves your request.<br/>If it isn't approved, the points come back to you.</p>
          <div class="kpi-grid three" style="margin-top:14px">
            <div class="kpi-box"><div class="kpi-label">On hold</div><div class="kpi">🔒 ${fmtPts(sum.onHold)}</div></div>
            <div class="kpi-box"><div class="kpi-label">Available</div><div class="kpi">${fmtPts(sum.available)}</div></div>
            <div class="kpi-box"><div class="kpi-label">Earned</div><div class="kpi">${fmtPts(sum.earned)}</div></div>
          </div>
          <div class="row" style="margin-top:18px">
            <button class="btn ghost" id="shopBtn2" type="button">← Shop</button>
            <button class="btn primary" id="histBtn" type="button">📜 Points history</button>
          </div>
        </div>
      </div>`);
    $("#bk").onclick = renderShop;
    $("#shopBtn2").onclick = renderShop;
    $("#histBtn").onclick = () => renderPointsHistory(renderShop);
  }

  /* ---------- Points history: every point earned, on hold, used or returned ---------- */
  function pointsEntries(p) {
    const out = [];
    STORE.pointsLog(p).filter(e => e.pts > 0).forEach(e => out.push({
      ts: e.ts, kind: "earn", amount: e.pts, icon: "📝", subj: e.s,
      title: DATA.fullLabel(e.s, e.t, e.l), sub: e.prev ? "New best: " + e.prev + "% → " + e.pct + "%" : "First score: " + e.pct + "%"
    }));
    let listed = 0;
    STORE.gameLog(null, p).filter(r => r.points > 0).forEach(r => {
      listed += r.points;
      const def = DATA.anyGame(r.game) || { label: r.game, icon: "🎮" };
      out.push({ ts: r.ts, kind: "earn", amount: r.points, icon: def.icon || "🎮", subj: def.subjectId,
        title: def.label, sub: "Quest Arena — won " + plural(r.cleared || 0, roundWord(def).toLowerCase()) });
    });
    DATA.GAMES.forEach(def => {
      const bonus = STORE.questBonus(def.id, p);
      if (!bonus) return;
      listed += bonus;
      out.push({ ts: STORE.badges(p)[def.rounds[def.rounds.length - 1].badge] || 0, kind: "earn", amount: bonus, icon: "🏆", subj: def.subjectId,
        title: def.label, sub: "Quest bonus — every " + roundWord(def).toLowerCase() + " won" });
    });
    const arena = STORE.arenaPoints(p);
    if (arena > listed) out.push({ ts: 0, kind: "earn", amount: arena - listed, icon: "🎮", title: "Earlier Quest Arena wins", sub: "Round bonuses from before this list started" });
    STORE.replayLog(p).filter(e => e.pts > 0).forEach(e => out.push({
      ts: e.ts, kind: "earn", amount: e.pts, icon: "🔁", subj: e.s,
      title: DATA.fullLabel(e.s, e.t, e.l), sub: "Replay bonus — scored " + e.pct + "% (best already 100%)"
    }));
    STORE.bonuses(p).forEach(b => out.push({
      ts: b.ts, kind: "earn", amount: b.points, icon: "⭐",
      title: "Bonus points from a parent", sub: "For: " + b.reason
    }));
    STORE.deductions(p).forEach(d => out.push({
      ts: d.ts, kind: "deduct", amount: d.points, icon: "🔻",
      title: "Points deducted by a parent", sub: "Reason: " + d.reason
    }));
    STORE.redemptions(p).forEach(r => out.push({
      ts: r.ts, kind: r.status, amount: r.points, icon: SHOP_ICONS[r.item] || "🛍️",
      title: redemptionText(r),
      sub: r.status === "pending" ? "🔒 On hold — waiting for a parent to approve"
        : r.status === "approved" ? "✓ Redeemed" + (r.decidedTs ? " on " + REPORT.shortDate(r.decidedTs) : "")
        : "↩ Not approved — points returned" + (r.decidedTs ? " on " + REPORT.shortDate(r.decidedTs) : "")
    }));
    return out.sort((x, y) => (y.ts || 0) - (x.ts || 0));
  }

  function renderPointsHistory(onBack) {
    onBack = onBack || renderMenu;
    current = () => renderPointsHistory(onBack);
    const p = STORE.active() || {};
    const sum = STORE.pointsSummary();
    const rows = pointsEntries(p).map(e => {
      const amt = e.kind === "earn" ? "+" + fmtPts(e.amount)
        : e.kind === "pending" ? "🔒 " + fmtPts(e.amount)
        : e.kind === "approved" || e.kind === "deduct" ? "−" + fmtPts(e.amount)
        : fmtPts(e.amount);
      return `<div class="pl-row pl-${e.kind}">
          <span class="pl-icon">${e.icon}</span>
          <span class="pl-main"><span class="pl-title"><b>${esc(e.title)}</b>${e.subj ? subjectPill(e.subj) : ""}</span><small>${esc(e.sub)}</small>${e.ts ? `<small class="pl-date">${esc(REPORT.shortDate(e.ts))} · ${esc(REPORT.timeAgo(e.ts))}</small>` : ""}</span>
          <span class="pl-amt">${amt}</span>
        </div>`;
    }).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Back</span><h2>📜 Points history</h2></div>
      <div class="page narrow">
        <div class="kpi-grid${sum.deducted ? " five" : ""}">
          <div class="kpi-box"><div class="kpi-label">Earned</div><div class="kpi">${fmtPts(sum.earned)}</div></div>
          <div class="kpi-box hold"><div class="kpi-label">On hold</div><div class="kpi">🔒 ${fmtPts(sum.onHold)}</div></div>
          <div class="kpi-box"><div class="kpi-label">Used</div><div class="kpi">${fmtPts(sum.used)}</div></div>
          ${sum.deducted ? `<div class="kpi-box deducted"><div class="kpi-label">Deducted</div><div class="kpi">−${fmtPts(sum.deducted)}</div></div>` : ""}
          <div class="kpi-box avail"><div class="kpi-label">Available</div><div class="kpi">${fmtPts(sum.available)}</div></div>
        </div>
        <div class="muted small" style="margin-top:8px">Available = earned − on hold − used${sum.deducted ? " − deducted" : ""}.</div>
        ${holdBox(sum)}
        <h3 class="section-h">Every change</h3>
        <div class="pl-list">${rows || `<div class="empty-note">No points yet — beat your best score on a level or win a Quest Arena round to earn some!</div>`}</div>
        <div class="row" style="margin-top:20px"><button class="btn primary" id="backBtn" type="button">← Back</button></div>
      </div>`);
    $("#bk").onclick = onBack;
    $("#backBtn").onclick = onBack;
  }

  /* ===================== Trophy Room — every badge ===================== */
  function badgeGroups() {
    return DATA.GAMES.map(def => ({ def, ids: def.rounds.map(r => r.badge).filter(id => id && DATA.BADGES[id]) }))
      .filter(gr => gr.ids.length);
  }
  function badgeTotals() {
    const earned = STORE.badges();
    const ids = [].concat.apply([], badgeGroups().map(gr => gr.ids));
    return { ids, earned, got: ids.filter(id => earned[id]).length };
  }

  function renderTrophyRoom(onBack) {
    onBack = onBack || renderMenu;
    current = () => renderTrophyRoom(onBack);
    const p = STORE.active() || {};
    const t = badgeTotals();
    const pct = t.ids.length ? Math.round(t.got / t.ids.length * 100) : 0;
    const sections = badgeGroups().map(gr => `<section class="trophy-group">
        <h3 class="section-h">${gr.def.icon || "🎮"} ${esc(gr.def.label)} ${subjectPill(gr.def.subjectId)}</h3>
        <div class="trophy-grid">${gr.ids.map(id => {
          const b = DATA.BADGES[id], ts = t.earned[id];
          return `<div class="trophy${ts ? " on" : ""}">
            ${ART.badge(id, 104, !!ts)}
            <div class="trophy-name">${esc(b.label)}</div>
            <div class="trophy-desc">${esc(b.desc)}</div>
            ${ts ? `<div class="trophy-date">🎉 Earned ${esc(REPORT.shortDate(ts))}</div>`
                 : `<div class="trophy-date locked">🔒 Not earned yet</div>
                    <button class="btn sm" data-play="${esc(gr.def.id)}" type="button">Play ${esc(gr.def.label)} →</button>`}
          </div>`;
        }).join("")}</div>
      </section>`).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Back</span><h2>🏆 Trophy Room</h2></div>
      <div class="page narrow">
        <div class="trophy-hero">
          <div class="player-chip-avatar">${ART.student(p.gender)}</div>
          <div style="flex:1;min-width:0">
            <div class="subject-hero-name">${esc(p.name || "Player")}'s badges</div>
            <div class="muted">${t.got} of ${plural(t.ids.length, "badge")} collected${t.got && t.got === t.ids.length ? " — every one! 🌟" : ""}</div>
            <div class="bar"><i style="width:${pct}%;background:var(--gold)"></i></div>
          </div>
        </div>
        ${sections || `<div class="empty-note">No badges to collect yet.</div>`}
      </div>`);
    $("#bk").onclick = onBack;
    $$("[data-play]").forEach(b => {
      b.onclick = () => { const def = DATA.game(b.dataset.play); if (def) renderGameIntro(def.subjectId, def.id); };
    });
  }

  /* ---------- By Topic ---------- */
  function renderTopicList(subjectId) {
    const subj = DATA.subject(subjectId);
    if (!subj) return renderMenu();
    current = () => renderTopicList(subjectId);
    studyCtx = { subjectId, mode: "topic", year: null };
    const cards = subj.topics.map(t => {
      const sum = REPORT.topicSummary(subjectId, t.id);
      let foot;
      const nTopics = DATA.moduleEntries(subjectId, t.id).length;
      if (!nTopics) foot = `<span class="soon-pill sm">Topics coming soon</span>`;
      else foot = `<span class="topic-hint">${plural(nTopics, "topic")} · ${plural(sum.total, "level")}${sum.mastered ? ` · 🏆 ${sum.mastered}/${sum.total} mastered` : ""}</span>${sum.attempts ? `<span class="topic-best">average ${sum.avg}%</span>` : ""}`;
      return `<button class="topic-card${sum.total ? "" : " pending"}" data-topic="${esc(t.id)}" type="button">
        <span class="topic-top"><span class="topic-icon">${esc(t.icon || "📘")}</span><span class="topic-name">${esc(t.label)}</span></span>
        ${t.desc ? `<span class="topic-desc">${esc(t.desc)}</span>` : ""}
        <span class="topic-foot">${foot}</span>
      </button>`;
    }).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Study mode</span><h2>${esc(subj.label)} · By Module</h2></div>
      <div class="page narrow">
        ${subj.topics.length
          ? `<h3 class="section-h" style="margin-top:4px">Modules</h3><div class="topic-grid">${cards}</div>`
          : soonCard("Modules are on the way", `The ${esc(subj.label)} modules will appear here as soon as the worksheets are added. Each module has topics, each topic has levels, and every level gets an <b>Assessment</b> and a <b>Progress report</b>.`)}
      </div>`, subjectId);
    $("#bk").onclick = () => renderStudyMode(subjectId);
    $$(".topic-card").forEach(card => { card.onclick = () => renderTopic(subjectId, card.dataset.topic); });
  }

  /* ---------- By School Year ---------- */
  function renderYearList(subjectId) {
    const subj = DATA.subject(subjectId);
    if (!subj) return renderMenu();
    current = () => renderYearList(subjectId);
    const cards = DATA.SCHOOL_YEARS.map(y => {
      const groups = DATA.yearTopics(subjectId, y);
      const levels = groups.reduce((n, g) => n + g.levels.length, 0);
      const mastered = groups.reduce((n, g) => n + g.levels.filter(l => REPORT.levelStats(subjectId, g.topic.id, l.id).mastery.id === "mastered").length, 0);
      return `<button class="year-card${levels ? "" : " pending"}" data-year="${y}" type="button">
        <span class="year-num">Year ${y}</span>
        ${levels
          ? `<span class="topic-hint">${plural(levels, "level")}${mastered ? ` · 🏆 ${mastered} mastered` : ""}</span>
             <span class="topic-desc">${esc(groups.map(g => g.topic.label).join(", "))}</span>`
          : `<span class="soon-pill sm">Coming soon</span>`}
      </button>`;
    }).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Study mode</span><h2>${esc(subj.label)} · By School Year</h2></div>
      <div class="page narrow">
        <div class="lead" style="margin-top:4px">Pick a school year to see the levels that match that year's syllabus.</div>
        <div class="year-grid">${cards}</div>
      </div>`, subjectId);
    $("#bk").onclick = () => renderStudyMode(subjectId);
    $$(".year-card").forEach(c => { c.onclick = () => renderYear(subjectId, Number(c.dataset.year)); });
  }

  function renderYear(subjectId, year) {
    const subj = DATA.subject(subjectId);
    if (!subj) return renderMenu();
    current = () => renderYear(subjectId, year);
    studyCtx = { subjectId, mode: "year", year };
    rememberStudy(subjectId, "year:" + year);
    const groups = DATA.yearTopics(subjectId, year);
    const all = [];
    groups.forEach(g => g.levels.forEach(l => all.push(REPORT.levelStats(subjectId, g.topic.id, l.id))));
    const mastered = all.filter(x => x.mastery.id === "mastered").length;
    const sections = groups.map(g => `<section class="year-topic">
        <div class="year-topic-head"><span class="topic-icon">${esc(g.topic.icon || "📘")}</span><span class="topic-name">${esc(g.topic.label)}</span></div>
        <div class="level-list">${g.levels.map(l => levelCard(subjectId, g.topic.id, l.id, true)).join("")}</div>
      </section>`).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← School years</span><h2>${esc(subj.label)} · Year ${year}</h2></div>
      <div class="page narrow">
        <div class="subject-hero">
          <div class="topic-hero-icon year-badge">${year}</div>
          <div>
            <div class="subject-hero-name">Year ${year} ${esc(subj.label)}</div>
            <div class="muted">${groups.length ? plural(groups.length, "module") + " · " + plural(all.length, "level") : "Levels for this year haven't been added yet."}</div>
            ${all.length ? `<div class="subject-hero-stats">🏆 ${mastered}/${all.length} levels mastered</div>` : ""}
          </div>
        </div>
        ${groups.length ? sections : soonCard("Year " + year + " is on the way",
            `Levels for Year ${year} ${esc(subj.label)} will appear here once they're added. Meanwhile, try <b>By Module</b> to see everything that's ready.`)}
      </div>`, subjectId);
    $("#bk").onclick = () => renderYearList(subjectId);
    $$(".level-card").forEach(c => { c.onclick = () => renderLevel(subjectId, c.dataset.topic, c.dataset.level); });
  }

  /* ===================== topic → levels ===================== */
  function maxChip(mp) {
    if (mp.rate <= 0) return "";
    return mp.max > 0
      ? ` · <span class="max-chip">${ART.coin(13)} up to <b>${mp.max}</b> points</span>`
      : mp.replay ? ` · <span class="max-chip">${ART.coin(13)} replay: <b>+${mp.replay}</b> for ${mp.replayMin}%+</span>`
      : ` · <span class="max-chip done">${ART.coin(13)} all points earned</span>`;
  }

  function levelCard(subjectId, topicId, levelId, withTopic) {
    const ls = REPORT.levelStats(subjectId, topicId, levelId);
    const l = DATA.level(subjectId, topicId, levelId);
    const bank = DATA.bank(subjectId, topicId, levelId);
    const parts = [];
    parts.push(bank ? "📝 " + plural(sessionSizeFor(l, bank), "question") : "📝 questions coming soon");
    const name = (withTopic ? l.topicLabel + " · " : "") + l.label + (l.desc ? ": " + l.desc : "");
    return `<button class="level-card" data-topic="${esc(topicId)}" data-level="${esc(levelId)}" type="button">
        <span class="level-head"><span class="level-name">${esc(name)}</span>${masteryBadge(ls.mastery)}</span>
        <span class="level-foot">
          <span class="muted small">${parts.join(" · ")}${bank ? maxChip(maxPoints(subjectId, topicId, levelId)) : ""}</span>
          ${ls.attempts ? `<span class="topic-best">${ART.stars(starsFor(ls.best), 14)} best ${ls.best}% · ${esc(REPORT.timeAgo(ls.lastTs))}</span>` : ""}
        </span>
      </button>`;
  }

  /* ===================== module → topics, and the module report =====================
     (in the code a module is a "topic": topicId = module id — see data.js) */
  // How a topic is doing overall, from its average score.
  function topicBand(ts) {
    if (!ts.attempts) return { txt: "Not started", cls: "tb-none" };
    if (ts.avg < 70) return { txt: "Needs practice", cls: "tb-weak" };
    if (ts.avg < 80) return { txt: "Getting there", cls: "tb-mid" };
    return { txt: "Strong", cls: "tb-strong" };
  }
  const weakList = (areas, n) => areas.slice(0, n).map(a => esc(a.label) + " (" + a.pct + "%)").join(", ");

  // A tappable "📊 … report" card on the module and topic pages — the details open on their own page.
  // Kept apart from the topics/levels (own section, dashed outline, plain button)
  // so it's clear it's a report, not another assessment.
  function reportCard(id, title, text) {
    return `<div class="report-zone">
        <h3 class="section-h">📊 ${esc(title)}</h3>
        <button class="sec-card report-card" id="${id}" type="button">
          <span class="sec-icon">📊</span>
          <span class="sec-body"><span class="sec-text">${esc(text)}</span></span>
          <span class="btn ghost">View report →</span>
        </button>
      </div>`;
  }

  function renderTopic(subjectId, topicId) {
    const subj = DATA.subject(subjectId), m = DATA.topic(subjectId, topicId);
    if (!subj || !m) return renderTopicList(subjectId);
    current = () => renderTopic(subjectId, topicId);
    studyCtx = { subjectId, mode: "topic", year: null };
    const rep = REPORT.moduleReport(subjectId, topicId), entries = DATA.moduleEntries(subjectId, topicId);
    const cards = entries.map(e => {
      if (!e.group) return subTopicCard(rep.inOrder.filter(ts => ts.topic.id === e.topic.id)[0]);
      const gr = REPORT.moduleReport(subjectId, topicId, e.group.id);
      const foot = `<span class="topic-hint">${plural(e.topics.length, "sub-topic")}${gr.totalLevels ? ` · ${plural(gr.totalLevels, "level")}${gr.mastered ? ` · 🏆 ${gr.mastered}/${gr.totalLevels} mastered` : ""}` : ""}</span>${gr.attempts ? `<span class="topic-best">average ${gr.avg}%</span>` : ""}`;
      return topicCard(`data-group="${esc(e.group.id)}"`, e.group, gr.totalLevels, foot);
    }).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Modules</span><h2>${esc(m.label)}</h2></div>
      <div class="page narrow">
        <div class="subject-hero">
          <div class="topic-hero-icon">${esc(m.icon || "📘")}</div>
          <div>
            <div class="subject-hero-name">${esc(m.label)}</div>
            <div class="muted">${esc(m.desc || "")}</div>
            ${rep.totalLevels ? `<div class="subject-hero-stats">${plural(entries.length, "topic")} · 🏆 ${rep.mastered}/${rep.totalLevels} levels mastered${rep.attempts ? ` · ${plural(rep.attempts, "assessment")} · last practised ${esc(REPORT.timeAgo(rep.lastTs))}` : ""}</div>` : ""}
          </div>
        </div>
        ${rep.inOrder.length
          ? `<h3 class="section-h">Topics</h3><div class="topic-grid">${cards}</div>
             ${reportCard("fullRep", "Module report", "Not a test — a report showing which topics are weakest, each topic's scores and weak areas, and recent mistakes.")}`
          : soonCard("Topics are on the way",
              `The <b>${esc(m.label)}</b> topics will appear here once the worksheets are added. Each topic has levels, and every level will have:` +
              `<span class="soon-parts"><span>📝 <b>Assessment</b></span><span>📊 <b>Progress report</b></span></span>`)}
      </div>`, subjectId);
    $("#bk").onclick = () => renderTopicList(subjectId);
    $$("[data-mtopic]").forEach(c => { c.onclick = () => renderModuleTopic(subjectId, topicId, c.dataset.mtopic); });
    $$("[data-group]").forEach(c => { c.onclick = () => renderTopicGroup(subjectId, topicId, c.dataset.group); });
    if ($("#fullRep")) $("#fullRep").onclick = () => renderModuleReport(subjectId, topicId, () => renderTopic(subjectId, topicId));
  }

  // A card on a module or group page: a topic (or a group of sub-topics) and how it's going.
  function topicCard(attrs, t, live, foot) {
    return `<button class="topic-card${live ? "" : " pending"}" ${attrs} type="button">
          <span class="topic-top"><span class="topic-icon">${esc(t.icon || "📘")}</span><span class="topic-name">${esc(t.label)}</span></span>
          ${t.desc ? `<span class="topic-desc">${esc(t.desc)}</span>` : ""}
          <span class="topic-foot">${foot}</span>
        </button>`;
  }
  function subTopicCard(ts) {
    const foot = !ts.total ? `<span class="soon-pill sm">Levels coming soon</span>`
      : `<span class="topic-hint">${plural(ts.total, "level")}${ts.mastered ? ` · 🏆 ${ts.mastered}/${ts.total} mastered` : ""}</span>${ts.attempts ? `<span class="topic-best">average ${ts.avg}%</span>` : ""}`;
    return topicCard(`data-mtopic="${esc(ts.topic.id)}"`, ts.topic, ts.total, foot);
  }

  /* ---------- a group of sub-topics in a module (e.g. Fractions) → its sub-topics ---------- */
  function renderTopicGroup(subjectId, moduleId, groupId) {
    const m = DATA.topic(subjectId, moduleId), gp = DATA.topicGroup(subjectId, moduleId, groupId);
    if (!m || !gp) return renderTopic(subjectId, moduleId);
    current = () => renderTopicGroup(subjectId, moduleId, groupId);
    studyCtx = { subjectId, mode: "topic", year: null };
    const self = () => renderTopicGroup(subjectId, moduleId, groupId);
    const rep = REPORT.moduleReport(subjectId, moduleId, groupId);
    show(`
      <div class="topbar"><span class="back" id="bk">← ${esc(m.label)}</span><h2>${esc(gp.label)}</h2></div>
      <div class="page narrow">
        <div class="subject-hero">
          <div class="topic-hero-icon">${esc(gp.icon || m.icon || "📘")}</div>
          <div>
            <div class="subject-hero-name">${esc(gp.label)}</div>
            <div class="muted">${esc(m.label)}${gp.desc ? " · " + esc(gp.desc) : ""}</div>
            ${rep.totalLevels ? `<div class="subject-hero-stats">${plural(rep.inOrder.length, "sub-topic")} · 🏆 ${rep.mastered}/${rep.totalLevels} levels mastered${rep.attempts ? ` · ${plural(rep.attempts, "assessment")} · last practised ${esc(REPORT.timeAgo(rep.lastTs))}` : ""}</div>` : ""}
          </div>
        </div>
        <h3 class="section-h">Sub-topics</h3><div class="topic-grid">${rep.inOrder.map(subTopicCard).join("")}</div>
        ${reportCard("groupRep", gp.label + " report", "Not a test — a report showing which sub-topics are weakest, each sub-topic's scores and weak areas, and recent mistakes.")}
      </div>`, subjectId);
    $("#bk").onclick = () => renderTopic(subjectId, moduleId);
    $$("[data-mtopic]").forEach(c => { c.onclick = () => renderModuleTopic(subjectId, moduleId, c.dataset.mtopic); });
    $("#groupRep").onclick = () => renderModuleReport(subjectId, moduleId, self, groupId);
  }

  /* ---------- a topic inside a module → its levels ---------- */
  function renderModuleTopic(subjectId, moduleId, topicId) {
    const m = DATA.topic(subjectId, moduleId), t = DATA.moduleTopic(subjectId, moduleId, topicId);
    if (!m || !t) return renderTopic(subjectId, moduleId);
    current = () => renderModuleTopic(subjectId, moduleId, topicId);
    studyCtx = { subjectId, mode: "topic", year: null };
    const ts = REPORT.topicReport(subjectId, moduleId, topicId);
    const self = () => renderModuleTopic(subjectId, moduleId, topicId);
    const gp = t.group ? DATA.topicGroup(subjectId, moduleId, t.group) : null, up = gp ? gp.label : m.label;   // a sub-topic sits in its group
    show(`
      <div class="topbar"><span class="back" id="bk">← ${esc(up)}</span><h2>${esc(t.label)}</h2></div>
      <div class="page narrow">
        <div class="subject-hero">
          <div class="topic-hero-icon">${esc(t.icon || m.icon || "📘")}</div>
          <div>
            <div class="subject-hero-name">${esc(t.label)}</div>
            <div class="muted">${esc(up)}${t.desc ? " · " + esc(t.desc) : ""}</div>
            ${ts.total ? `<div class="subject-hero-stats">🏆 ${ts.mastered}/${ts.total} levels mastered${ts.attempts ? ` · ${plural(ts.attempts, "assessment")} · average ${ts.avg}% · last practised ${esc(REPORT.timeAgo(ts.lastTs))}` : ""}</div>` : ""}
          </div>
        </div>
        ${ts.total
          ? `<h3 class="section-h">Levels</h3><div class="level-list">${ts.levels.map(ls => levelCard(subjectId, moduleId, ls.levelId)).join("")}</div>
             ${reportCard("fullTopicRep", "Topic report", "Not a test — a report showing which question types and levels are weakest, scores for each level and recent mistakes.")}`
          : soonCard("Levels are on the way",
              `The <b>${esc(t.label)}</b> levels will appear here once they're added. Every level will have:` +
              `<span class="soon-parts"><span>📝 <b>Assessment</b></span><span>📊 <b>Progress report</b></span></span>`)}
      </div>`, subjectId);
    $("#bk").onclick = () => (gp ? renderTopicGroup(subjectId, moduleId, gp.id) : renderTopic(subjectId, moduleId));
    $$(".level-card").forEach(c => { c.onclick = () => renderLevel(subjectId, moduleId, c.dataset.level); });
    if ($("#fullTopicRep")) $("#fullTopicRep").onclick = () => renderTopicReport(subjectId, moduleId, topicId, self);
  }

  // Question types as score bars (weak ones flagged).
  function areaCards(areas, prefix) {
    return areas.map(a => barCard((a.acc < 0.7 ? "🎯 " : "") + (prefix ? prefix(a) : "") + a.label, a.correct, a.total,
      `${a.correct} / ${a.total} correct recently`, a.acc < 0.7)).join("");
  }
  // One row per level of a topic, weakest first — tap for the level's progress report.
  function levelReportRows(subjectId, moduleId, rep) {
    return rep.levelsWeakFirst.map(ls => {
      const l = DATA.level(subjectId, moduleId, ls.levelId), b = topicBand(ls);
      return `<button class="mr-row ${b.cls}" data-rlevel="${esc(ls.levelId)}" type="button">
          <span class="mr-top"><span class="mr-name">${esc(l.label)}${l.desc ? `: ${esc(l.desc)}` : ""}</span><span class="mr-tag">${esc(b.txt)}</span></span>
          ${ls.attempts
            ? `<span class="mr-bar"><i style="width:${ls.avg}%"></i></span>
               <span class="mr-meta">average <b>${ls.avg}%</b> · best ${ls.best}% · latest ${ls.latest}% · ${plural(ls.attempts, "assessment")} · ${esc(ls.mastery.icon + " " + ls.mastery.label)} · ${esc(REPORT.timeAgo(ls.lastTs))}</span>
               ${ls.weakAreas.length ? `<span class="mr-weak">🎯 Weak areas: ${weakList(ls.weakAreas, 3)}</span>` : `<span class="mr-ok">✓ No weak areas</span>`}`
            : `<span class="mr-meta">Not started yet.</span>`}
        </button>`;
    }).join("");
  }

  /* ---------- the full topic report: every level and question type, weakest first ---------- */
  function renderTopicReport(subjectId, moduleId, topicId, onBack) {
    const m = DATA.topic(subjectId, moduleId), t = DATA.moduleTopic(subjectId, moduleId, topicId);
    if (!m || !t) return renderTopic(subjectId, moduleId);
    onBack = onBack || (() => renderModuleTopic(subjectId, moduleId, topicId));
    current = () => renderTopicReport(subjectId, moduleId, topicId, onBack);
    const self = () => renderTopicReport(subjectId, moduleId, topicId, onBack);
    const rep = REPORT.topicReport(subjectId, moduleId, topicId);
    const kpis = rep.attempts ? `<div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Assessments</div><div class="kpi">${rep.attempts}</div></div>
        <div class="kpi-box"><div class="kpi-label">Average</div><div class="kpi">${rep.avg}%</div></div>
        <div class="kpi-box"><div class="kpi-label">Best</div><div class="kpi">${rep.best}%</div></div>
        <div class="kpi-box"><div class="kpi-label">Levels mastered</div><div class="kpi">🏆 ${rep.mastered}/${rep.total}</div></div>
        <div class="kpi-box wide"><div class="kpi-label">Last practised</div><div class="kpi sm">${esc(REPORT.shortDate(rep.lastTs))}</div><div class="muted small">${esc(REPORT.timeAgo(rep.lastTs))}</div></div>
      </div>` : "";
    const mistakeCards = rep.mistakes.map(x => `<div class="rep-card">
        <div class="sub ink">${esc(x.m.q || "Question")} <span class="muted small">· ${esc(x.levelLabel)} · ${esc(x.when)}</span></div>
        <div class="sub bad">Answered: <b>${esc(x.m.chosen)}</b></div>
        <div class="sub good">Correct: <b>${esc(x.m.answer)}</b></div>
      </div>`).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Back</span><h2>📊 Topic report</h2></div>
      <div class="page narrow">
        <div class="card wide">
          <div class="hist-head"><div class="hist-name">${esc(t.icon || "")} ${esc(m.label)} · ${esc(t.label)} ${subjectPill(subjectId)}</div></div>
          <div class="summary-box" style="margin-top:10px">${rep.summary}</div>
        </div>
        ${kpis}
        <h3 class="section-h">Levels — weakest first</h3>
        <div class="mr-list">${levelReportRows(subjectId, moduleId, rep) || `<div class="muted">Levels coming soon.</div>`}</div>
        ${rep.areas.length ? `<h3 class="section-h">Weak areas in ${esc(t.label)} <span class="muted small">· every question type, weakest first</span></h3><div class="rep-grid">${areaCards(rep.areas)}</div>` : ""}
        ${mistakeCards ? `<h3 class="section-h">Recent mistakes</h3><div class="rep-grid">${mistakeCards}</div>` : ""}
        <div class="row" style="margin-top:22px"><button class="btn primary" id="backBtn" type="button">← Back</button></div>
      </div>`, subjectId);
    $("#bk").onclick = onBack;
    $("#backBtn").onclick = onBack;
    $$("[data-rlevel]").forEach(c => { c.onclick = () => renderLevelReport(subjectId, moduleId, c.dataset.rlevel, self); });
  }

  /* ---------- the full module report: every topic, weakest first ---------- */
  function renderModuleReport(subjectId, moduleId, onBack, groupId) {
    const m = DATA.topic(subjectId, moduleId), gp = groupId ? DATA.topicGroup(subjectId, moduleId, groupId) : null;
    if (!m) return renderTopicList(subjectId);
    onBack = onBack || (() => renderTopic(subjectId, moduleId));
    current = () => renderModuleReport(subjectId, moduleId, onBack, groupId);
    const self = () => renderModuleReport(subjectId, moduleId, onBack, groupId);
    const rep = REPORT.moduleReport(subjectId, moduleId, groupId);
    // In the whole module's report, a sub-topic says which group it's in.
    const nameOf = (t) => (!gp && t.group ? (DATA.topicGroup(subjectId, moduleId, t.group) || {}).label + " · " : "") + t.label;
    const kpis = rep.attempts ? `<div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Assessments</div><div class="kpi">${rep.attempts}</div></div>
        <div class="kpi-box"><div class="kpi-label">Average</div><div class="kpi">${rep.avg}%</div></div>
        <div class="kpi-box"><div class="kpi-label">Levels mastered</div><div class="kpi">🏆 ${rep.mastered}/${rep.totalLevels}</div></div>
        <div class="kpi-box"><div class="kpi-label">Last practised</div><div class="kpi sm">${esc(REPORT.shortDate(rep.lastTs))}</div><div class="muted small">${esc(REPORT.timeAgo(rep.lastTs))}</div></div>
      </div>` : "";
    const topicCards = rep.topics.map(ts => {
      const b = topicBand(ts);
      const chips = ts.levels.map(ls => {
        const l = DATA.level(subjectId, moduleId, ls.levelId);
        return `<button class="ov-chip ${ls.mastery.cls}" data-rlevel="${esc(ls.levelId)}" title="${esc(l.label + " — " + ls.mastery.label)}" type="button">${esc(l.label.replace(/Level\s*/i, "L"))}${ls.attempts ? " · " + ls.latest + "%" : ""}</button>`;
      }).join("");
      return `<div class="mr-row ${b.cls}">
          <span class="mr-top"><span class="mr-name">${esc(ts.topic.icon || "📘")} ${esc(nameOf(ts.topic))}</span><span class="mr-tag">${esc(b.txt)}</span></span>
          ${ts.attempts
            ? `<span class="mr-bar"><i style="width:${ts.avg}%"></i></span>
               <span class="mr-meta">average <b>${ts.avg}%</b> · best ${ts.best}% · ${plural(ts.attempts, "assessment")} · last practised ${esc(REPORT.timeAgo(ts.lastTs))}</span>`
            : `<span class="mr-meta">Not started yet.</span>`}
          ${chips ? `<span class="ov-levels">${chips}</span>` : `<span class="mr-meta">Levels coming soon.</span>`}
          ${ts.weakAreas.length ? `<span class="mr-weak">🎯 Weak areas: ${weakList(ts.weakAreas, 4)}</span>` : ""}
          ${ts.total ? `<button class="link-btn mr-link" data-trep="${esc(ts.topic.id)}" type="button">📊 ${esc(ts.topic.label)} topic report →</button>` : ""}
        </div>`;
    }).join("");
    const areaCards = rep.areas.slice(0, 8).map(a => barCard((a.acc < 0.7 ? "🎯 " : "") + a.topicLabel + ": " + a.label, a.correct, a.total,
      `${a.correct} / ${a.total} correct recently`, a.acc < 0.7)).join("");
    const mistakeCards = rep.mistakes.map(x => `<div class="rep-card">
        <div class="sub ink">${esc(x.m.q || "Question")} <span class="muted small">· ${esc(x.topicLabel)} · ${esc(x.when)}</span></div>
        <div class="sub bad">Answered: <b>${esc(x.m.chosen)}</b></div>
        <div class="sub good">Correct: <b>${esc(x.m.answer)}</b></div>
      </div>`).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Back</span><h2>📊 ${gp ? esc(gp.label) + " report" : "Module report"}</h2></div>
      <div class="page narrow">
        <div class="card wide">
          <div class="hist-head"><div class="hist-name">${esc((gp || m).icon || "")} ${esc(m.label)}${gp ? " · " + esc(gp.label) : ""} ${subjectPill(subjectId)}</div></div>
          <div class="summary-box" style="margin-top:10px">${rep.summary}</div>
        </div>
        ${kpis}
        <h3 class="section-h">${gp ? "Sub-topics" : "Topics"} — weakest first</h3>
        <div class="mr-list">${topicCards || `<div class="muted">Topics coming soon.</div>`}</div>
        ${areaCards ? `<h3 class="section-h">Weak areas across ${esc((gp || m).label)} <span class="muted small">· weakest first</span></h3><div class="rep-grid">${areaCards}</div>` : ""}
        ${mistakeCards ? `<h3 class="section-h">Recent mistakes</h3><div class="rep-grid">${mistakeCards}</div>` : ""}
        <div class="row" style="margin-top:22px"><button class="btn primary" id="backBtn" type="button">← Back</button></div>
      </div>`, subjectId);
    $("#bk").onclick = onBack;
    $("#backBtn").onclick = onBack;
    $$("[data-rlevel]").forEach(c => { c.onclick = () => renderLevelReport(subjectId, moduleId, c.dataset.rlevel, self); });
    $$("[data-trep]").forEach(c => { c.onclick = () => renderTopicReport(subjectId, moduleId, c.dataset.trep, self); });
  }

  // Where "back" from a level goes: the year page if the child came that way,
  // otherwise the level's topic page.
  function levelBack(subjectId, topicId, levelId) {
    const l = DATA.level(subjectId, topicId, levelId);
    const viaYear = studyCtx.mode === "year" && studyCtx.subjectId === subjectId &&
      DATA.levelYears(l).indexOf(studyCtx.year) > -1;
    return viaYear
      ? { label: "Year " + studyCtx.year, go: () => renderYear(subjectId, studyCtx.year) }
      : l ? { label: l.topicLabel, go: () => renderModuleTopic(subjectId, topicId, l.topicId) }
      : { label: DATA.topicLabel(subjectId, topicId), go: () => renderTopic(subjectId, topicId) };
  }

  /* ===================== level hub: Assessment · Progress report ===================== */
  function renderLevel(subjectId, topicId, levelId) {
    const t = DATA.topic(subjectId, topicId), l = DATA.level(subjectId, topicId, levelId);
    if (!t || !l) return renderTopic(subjectId, topicId);
    current = () => renderLevel(subjectId, topicId, levelId);
    const bank = DATA.bank(subjectId, topicId, levelId);
    const st = REPORT.levelStats(subjectId, topicId, levelId);
    const back = levelBack(subjectId, topicId, levelId);

    let assessInfo;
    if (!bank) assessInfo = "The questions for this level haven't been added yet.";
    else if (l.passageMode) {
      const passages = Object.keys(bank.reduce((m, q) => { if (q.pid) m[q.pid] = 1; return m; }, {})).length;
      assessInfo = `${plural(Math.min(l.passageCount || 3, passages), "passage")} to read, picked from ${passages}. Answer the questions under each one.`;
    } else {
      assessInfo = `${plural(sessionSizeFor(l, bank), "question")} picked at random from ${bank.length}. No timer — take your time.`;
    }
    const best = st.attempts ? `<div class="sec-stat">${ART.stars(starsFor(st.best), 16)} Best <b>${st.best}%</b> · Latest <b>${st.latest}%</b></div>` : "";
    const mp = maxPoints(subjectId, topicId, levelId);
    const pointsLine = !bank ? ""
      : mp.rate <= 0 ? `<div class="max-box off">${ART.coin(24)}<div><div class="max-num">No points right now</div><div class="max-sub">Points are switched off for ${esc(DATA.subject(subjectId).label)} at the moment.</div></div></div>`
      : mp.max <= 0 ? `<div class="max-box done">${ART.coin(24)}<div><div class="max-num">All ${mp.full} points earned!</div><div class="max-sub">Your best is 100%. Every replay that scores ${mp.replayMin}% or more still earns <b>+${mp.replay} points</b>.</div></div></div>`
      : `<div class="max-box">${ART.coin(28)}<div>
          <div class="max-num">Max points: <b>${mp.max}</b></div>
          <div class="max-sub">${mp.best > 0
            ? `Your best is ${mp.best}%. Every 1% above it pays ${ratePhrase(mp.rate)} — score 100% to get all ${mp.max}.`
            : `${ratePhrase(mp.rate)} for every 1% you score — 100% gets all ${mp.max}.`}</div>
        </div></div>`;

    show(`
      <div class="topbar"><span class="back" id="bk">← ${esc(back.label)}</span><h2>${esc(l.topicLabel)} · ${esc(l.label)}</h2></div>
      <div class="page narrow">
        <div class="level-hero">
          <div class="level-hero-top">
            <span class="topic-hero-icon sm">${esc(l.topicIcon || t.icon || "📘")}</span>
            <div style="min-width:0">
              <div class="level-hero-name">${esc(t.label)} · ${esc(l.topicLabel)} · ${esc(l.label)}${l.desc ? `: ${esc(l.desc)}` : ""}</div>
            </div>
          </div>
          <div class="level-hero-mastery">${masteryBadge(st.mastery, true)}<span class="muted small">${esc(st.next)}</span></div>
        </div>

        <div class="section-cards">
          <div class="sec-card">
            <div class="sec-icon">📝</div>
            <div class="sec-body">
              <div class="sec-title">Assessment</div>
              <div class="sec-text">${assessInfo}</div>
              ${best}
              ${pointsLine}
            </div>
            <button class="btn primary" id="goAssess" type="button"${bank ? "" : " disabled"}>${bank ? (st.attempts ? "Try again →" : "Start →") : "Coming soon"}</button>
          </div>
          <div class="sec-card">
            <div class="sec-icon">📊</div>
            <div class="sec-body">
              <div class="sec-title">Progress report</div>
              <div class="sec-text">${st.attempts
                ? `${plural(st.attempts, "attempt")} · average ${st.avg}% · last practised ${esc(REPORT.shortDate(st.lastTs))} (${esc(REPORT.timeAgo(st.lastTs))})${st.weakAreas && st.weakAreas.length ? ` · weak area: <b class="bad">${esc(st.weakAreas[0].label)}</b>` : ""}`
                : "Score history, attempts, weak areas, last practice date and mastery status — it fills in after the first assessment."}</div>
            </div>
            <button class="btn" id="goReport" type="button">View report →</button>
          </div>
        </div>
      </div>`, subjectId);
    const self = () => renderLevel(subjectId, topicId, levelId);
    $("#bk").onclick = back.go;
    $("#goAssess").onclick = () => startSession(subjectId, topicId, levelId);
    $("#goReport").onclick = () => renderLevelReport(subjectId, topicId, levelId, self);
  }

  /* ===================== Progress report for one level ===================== */
  function sparkline(sessions, avg) {
    const vals = sessions.slice().reverse().map(s => s.pct);
    if (vals.length < 2) return "";
    const W = 300, H = 64, pad = 7;
    const stepX = (W - 2 * pad) / (vals.length - 1);
    const y = (v) => (H - pad - (v / 100) * (H - 2 * pad)).toFixed(1);
    const pts = vals.map((v, i) => (pad + i * stepX).toFixed(1) + "," + y(v));
    return `<svg class="sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Scores over time">
        <path d="M0 ${y(80)} L${W} ${y(80)}" stroke="rgba(78,196,106,.45)" stroke-width="1" stroke-dasharray="4 4" fill="none"/>
        <path d="M0 ${y(avg)} L${W} ${y(avg)}" stroke="rgba(242,193,78,.4)" stroke-width="1" stroke-dasharray="2 4" fill="none"/>
        <polyline points="${pts.join(" ")}" stroke="var(--gold)" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
        ${pts.map(pt => { const xy = pt.split(","); return `<circle cx="${xy[0]}" cy="${xy[1]}" r="3.2" fill="#fff"/>`; }).join("")}
      </svg>
      <div class="spark-cap muted">← oldest · newest → &nbsp; <span style="color:#7fd893">- - 80% mastery line</span></div>`;
  }

  function renderLevelReport(subjectId, topicId, levelId, onBack) {
    onBack = onBack || (() => renderLevel(subjectId, topicId, levelId));
    current = () => renderLevelReport(subjectId, topicId, levelId, onBack);
    const st = REPORT.levelStats(subjectId, topicId, levelId);
    const lvl = DATA.level(subjectId, topicId, levelId);
    const self = () => renderLevelReport(subjectId, topicId, levelId, onBack);
    const head = `
      <div class="card wide">
        <div class="hist-head">
          <div class="hist-name">${esc(st.label)} ${subjectPill(subjectId)}</div>
        </div>
        <div class="mastery-block">
          ${masteryBadge(st.mastery, true)}
          <div class="muted small" style="margin-top:6px">${esc(st.next)}</div>
          <div class="muted small" style="margin-top:2px">${esc(REPORT.MASTERY_RULE)}</div>
        </div>
      </div>`;
    const buttons = `<div class="row" style="margin-top:22px">
        <button class="btn ghost" id="backBtn" type="button">← Back</button>
        ${lvl && DATA.bank(subjectId, topicId, levelId) ? `<button class="btn primary" id="assessBtn" type="button">📝 Take the assessment</button>` : ""}
      </div>`;
    const wire = () => {
      $("#bk").onclick = onBack;
      $("#backBtn").onclick = onBack;
      if ($("#assessBtn")) $("#assessBtn").onclick = () => startSession(subjectId, topicId, levelId);
    };
    const top = `<div class="topbar"><span class="back" id="bk">← Back</span><h2>📊 Progress report</h2></div>`;

    if (!st.attempts) {
      show(`${top}<div class="page narrow">${head}
        <div class="empty-note">No assessments yet for this level. After the first one you'll see the score history, number of attempts, weak areas, the last practice date and the mastery status here.</div>
        ${buttons}</div>`, subjectId);
      wire();
      return;
    }

    const kpis = `<div class="kpi-grid">
        <div class="kpi-box"><div class="kpi-label">Attempts</div><div class="kpi">${st.attempts}</div></div>
        <div class="kpi-box"><div class="kpi-label">Best</div><div class="kpi">${st.best}%</div></div>
        <div class="kpi-box"><div class="kpi-label">Average</div><div class="kpi">${st.avg}%</div></div>
        <div class="kpi-box"><div class="kpi-label">Latest</div><div class="kpi">${st.latest}%</div><div class="muted small">${trendMark(st.trend)}</div></div>
        <div class="kpi-box wide"><div class="kpi-label">Last practised</div><div class="kpi sm">${esc(REPORT.shortDate(st.lastTs))}</div><div class="muted small">${esc(REPORT.timeAgo(st.lastTs))} · first tried ${esc(REPORT.shortDate(st.firstTs))}</div></div>
      </div>`;
    const history = st.sessions.map((s, i) => {
      const b = pctBand(s.pct);
      return `<button class="session-row" data-ts="${s.ts}" type="button">
        <span class="session-line"><span class="session-topic">${i === 0 ? "Latest" : "#" + (st.sessions.length - i)} · ${esc(REPORT.shortDate(s.ts))} <span class="muted small">${esc(REPORT.timeAgo(s.ts))}</span></span><span class="${b.cls}">${s.correct}/${s.total} · ${s.pct}%</span></span>
        <span class="session-line"><span>${ART.stars(starsFor(s.pct), 13)}${s.points ? ` <span class="pts-gain">+${s.points} points</span>` : ""}</span><span class="session-more">View details ›</span></span>
      </button>`;
    }).join("");
    const areas = st.areas.length
      ? `<div class="rep-grid">${st.areas.map(a => barCard((a.acc < 0.7 ? "🎯 " : "") + a.label, a.correct, a.total, `${a.correct} / ${a.total} correct in the last ${plural(st.areaSpan, "assessment")}`, a.acc < 0.7)).join("")}</div>`
      : "";
    const weakLine = st.weakAreas.length
      ? `<div class="summary-box" style="margin-bottom:10px">Weak areas: <b class="bad">${st.weakAreas.map(a => esc(a.label) + " (" + a.pct + "%)").join(", ")}</b>. Practise these first.</div>`
      : `<div class="summary-box" style="margin-bottom:10px">No weak areas — every question type is at 70% or above. 👏</div>`;
    const mistakes = [];
    st.sessions.slice(0, 3).forEach(s => (s.mistakes || []).forEach(m => { if (mistakes.length < 8) mistakes.push({ m, when: REPORT.timeAgo(s.ts) }); }));
    const mistakeCards = mistakes.map(({ m, when }) => `<div class="rep-card">
        <div class="sub ink">${esc(m.q || "Question")} <span class="muted small">· ${esc(when)}</span></div>
        <div class="sub bad">Answered: <b>${esc(m.chosen)}</b></div>
        <div class="sub good">Correct: <b>${esc(m.answer)}</b></div>
      </div>`).join("");

    show(`${top}
      <div class="page narrow">
        ${head}
        ${kpis}
        <h3 class="section-h">Score history</h3>
        ${st.attempts >= 2 ? `<div class="card wide center" style="padding:14px">${sparkline(st.sessions, st.avg)}</div><div style="height:10px"></div>` : ""}
        <div class="session-list">${history}</div>
        <h3 class="section-h">Weak areas <span class="muted small">· last ${plural(st.areaSpan, "assessment")}</span></h3>
        ${weakLine}
        ${areas}
        ${mistakeCards ? `<h3 class="section-h">Recent mistakes</h3><div class="rep-grid">${mistakeCards}</div>` : ""}
        ${buttons}
      </div>`, subjectId);
    wire();
    $$(".session-row").forEach(r => { r.onclick = () => renderSessionDetail(subjectId, topicId, levelId, Number(r.dataset.ts), self); });
  }

  /* ===================== assessment engine ===================== */
  function shuffleOpts(q) {
    if (!Array.isArray(q.options) || q.fixedOrder) return Object.assign({}, q);   // fixedOrder: e.g. always Odd, then Even
    const order = shuffle(q.options.map((_, i) => i));
    return Object.assign({}, q, { options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) });
  }
  // n questions, spread across the `cat` groups as evenly as possible.
  function sampleBalanced(bank, n) {
    const byCat = {};
    bank.forEach(q => { const c = q.cat || "?"; (byCat[c] = byCat[c] || []).push(q); });
    Object.keys(byCat).forEach(c => { byCat[c] = shuffle(byCat[c]); });
    const cats = shuffle(Object.keys(byCat));
    const picked = [], used = {};
    let progressed = true;
    while (picked.length < n && progressed) {
      progressed = false;
      for (const c of cats) {
        if (picked.length >= n) break;
        // skip anything that's the same as a question already picked
        while (byCat[c].length && used[sameKey(byCat[c][0])]) byCat[c].shift();
        if (byCat[c].length) {
          const q = byCat[c].shift();
          used[sameKey(q)] = true;
          picked.push(q);
          progressed = true;
        }
      }
    }
    return shuffle(picked).map(shuffleOpts);
  }
  // Whole passages, questions kept in their original order.
  function samplePassages(bank, count) {
    const byPid = {};
    bank.forEach(q => { if (q.pid) (byPid[q.pid] = byPid[q.pid] || []).push(q); });
    const out = [];
    shuffle(Object.keys(byPid)).slice(0, count).forEach(pid => byPid[pid].forEach(q => out.push(shuffleOpts(q))));
    return out;
  }

  function startSession(subjectId, topicId, levelId) {
    const lvl = DATA.level(subjectId, topicId, levelId);
    const bank = DATA.bank(subjectId, topicId, levelId);
    if (!lvl || !bank) { toast("This level's questions haven't been added yet.", "bad"); return; }
    const questions = lvl.passageMode ? samplePassages(bank, lvl.passageCount || 3) : sampleBalanced(bank, sessionSizeFor(lvl, bank));
    if (!questions.length) { toast("No questions found for this level.", "bad"); return; }
    questions.forEach(q => { if (q.pic) new Image().src = q.pic; });   // ready before their turn comes
    exam = { subjectId, topicId, levelId, questions, idx: 0, answers: [], byCat: {}, maxPts: maxPoints(subjectId, topicId, levelId) };
    renderQuestion();
  }

  /* ---------- read a word aloud (listen-and-spell) ---------- */
  let voices = [];
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if ("speechSynthesis" in window) {
    loadVoices();
    try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { }
  }
  function voiceFor(lang) {
    if (!voices.length) loadVoices();
    const want = lang.toLowerCase(), base = want.split("-")[0];
    const norm = (v) => String(v.lang || "").toLowerCase().replace("_", "-");
    return voices.filter(v => norm(v) === want)[0]
      || voices.filter(v => norm(v).indexOf(base) === 0)[0]
      || (base === "ms" ? voices.filter(v => norm(v).indexOf("id") === 0)[0] : null)   // Indonesian is the closest to Malay
      || null;
  }
  function speak(text, lang) {
    if (!("speechSynthesis" in window)) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = voiceFor(lang);
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = lang; }
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- on-screen keyboards (no autocorrect help from the phone) ---------- */
  const LETTER_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  function acceptedAnswers(q) {
    return [q.word].concat(q.alt || []).filter(a => a != null && String(a).trim() !== "").map(String);
  }
  function isNumericAnswers(list) {
    return list.length > 0 && list.every(a => /\d/.test(a) && /^[\d.,:\/\s-]+$/.test(a.trim()));
  }
  // Punctuation options: "!" → big ! + "exclamation mark"; "x / y" → "① x … ② y …" (two sentences).
  // Comparison signs work the same way: ">" → big > + "greater than".
  const MARK_NAMES = { ".": "full stop", "?": "question mark", "!": "exclamation mark", ",": "comma",
                       ">": "greater than", "<": "less than", "=": "equal to" };
  function markHtml(o) {
    const parts = String(o).split(" / ");
    return parts.map((m, i) => `<span class="mark-opt">${parts.length > 1 ? "①②"[i] + " " : ""}<b class="opt-mark">${esc(m)}</b><small>${esc(MARK_NAMES[m] || "")}</small></span>`).join("");
  }
  function markWords(o) {
    const parts = String(o).split(" / ");
    return parts.map((m, i) => (parts.length > 1 ? "①②"[i] + " " : "") + m + " " + (MARK_NAMES[m] || "")).join("  ");
  }

  // shift: add a ⇧ key (questions where the capital letter itself is being tested)
  function keyboardHtml(accepts, numeric, shift) {
    const has = (ch) => accepts.some(a => a.indexOf(ch) > -1);
    const key = (k, label, cls) => `<button type="button" class="kb-key${cls ? " " + cls : ""}" data-key="${esc(k)}">${label || esc(k)}</button>`;
    const back = key("back", "⌫", "kb-back");
    if (numeric) {
      const extras = [".", "/", "-", ":"].filter(has).map(c => key(c)).join("");
      return ["123", "456", "789"].map(r => `<div class="kb-row">${r.split("").map(c => key(c)).join("")}</div>`).join("")
        + `<div class="kb-row">${extras}${key("0")}${back}</div>`;
    }
    const rows = LETTER_ROWS.map((row, i) => `<div class="kb-row">${i === 2 && shift ? key("shift", "⇧", "kb-shift") : ""}${row.split("").map(c => key(c)).join("")}${i === 2 ? back : ""}</div>`);
    const extras = [];
    if (has("'") || has("’")) extras.push(key("'", "'"));
    if (has("-")) extras.push(key("-", "-"));
    if (has(" ")) extras.push(key(" ", "space", "kb-space"));
    if (extras.length) rows.push(`<div class="kb-row">${extras.join("")}</div>`);
    return rows.join("");
  }
  function normText(s) { return String(s == null ? "" : s).toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim(); }
  function sameAnswer(guess, accepts, numeric) {
    const g = normText(guess);
    return accepts.some(a => {
      const t = normText(a);
      if (g === t) return true;
      if (!numeric) return false;
      const gn = g.replace(/[,\s]/g, ""), tn = t.replace(/[,\s]/g, "");
      if (gn === tn) return true;
      const gv = Number(gn), tv = Number(tn);
      return gn !== "" && tn !== "" && isFinite(gv) && isFinite(tv) && gv === tv;
    });
  }

  const PRAISE = ["Correct!", "Brilliant!", "Well done!", "Spot on!", "Great job!", "Nailed it!", "Super!"];

  function renderQuestion() {
    const st = exam;
    if (!st) return;
    const q = st.questions[st.idx];
    if (!q) return renderResults();
    current = null;
    const shownAt = Date.now();
    const subj = DATA.subject(st.subjectId);
    const total = st.questions.length, num = st.idx + 1;
    const correctSoFar = st.answers.filter(a => a.correct).length;
    const kind = q.spelling ? "spell" : Array.isArray(q.fields) ? "multi" : q.order ? "order" : q.shade ? "shade" : q.typed ? "typed" : "mcq";
    const accepts = kind === "mcq" || kind === "multi" || kind === "order" || kind === "shade" ? [] : acceptedAnswers(q);
    const numeric = kind === "typed" && isNumericAnswers(accepts);
    const lvlDef = DATA.level(st.subjectId, st.topicId, st.levelId) || {};
    // hideCat: don't show the question-type tag during the test (it would give the answer away)
    const tag = q.cat && !lvlDef.hideCat ? DATA.catLabel(st.subjectId, st.topicId, st.levelId, q.cat) : "";
    // Several answer boxes (e.g. "Number of groups" + "Items in each group").
    const fieldAcc = kind === "multi" ? q.fields.map(f => [f.word].concat(f.alt || []).filter(a => a != null).map(String)) : [];
    const multiNumeric = kind === "multi" && fieldAcc.every(a => isNumericAnswers(a));
    const passage = q.passage ? `<div class="passage">${fmt(q.passage)}</div>` : "";
    // q.clock: "h:mm" — a clock face is drawn for the question
    // q.bar or q.circle: "shaded/parts" — a fraction picture is drawn for the question
    // q.pic: a picture file shown above the question
    const fracShape = q.bar ? "bar" : q.circle ? "circle" : "";
    const visual = q.clock ? `<div class="q-visual">${ART.clock(q.clock)}</div>`
      : fracShape ? `<div class="q-visual">${ART.fraction(fracShape, q[fracShape])}</div>`
      : q.pic ? `<div class="q-visual q-pic"><img src="${esc(q.pic)}" alt="Gambar"/></div>`
      : q.visual ? `<div class="q-visual">${q.visual}</div>` : "";
    const qText = String(q.q || "");
    const inlineBlank = kind === "typed" && qText.indexOf("___") > -1;
    const actions = `<div class="kb-actions">
        <button class="btn ghost sm" id="clearBtn" type="button" disabled>↺ Clear</button>
        <button class="btn primary" id="submitBtn" type="button" disabled>Check answer ✓</button>
      </div>`;

    let body;
    if (kind === "spell") {
      body = `<div class="spell-block">
          <p class="spell-instr" id="spellInstr">Tap the speaker to hear the word, then spell it with the letters below.</p>
          <button class="btn primary spell-hear" id="hearBtn" type="button">🔊 Hear the word</button>
          ${q.hint ? `<p class="spell-hint">💡 ${esc(q.hint)}</p>` : ""}
          <div class="answer-box" id="ansBox"></div>
          <div class="keyboard" id="kb">${keyboardHtml(accepts, false)}</div>
          ${actions}
        </div>`;
    } else if (kind === "multi") {
      let blankNo = 0;    // blanks in the sentence are numbered to match the boxes (Blank 1, Blank 2)
      body = `${passage}${visual}
        <div class="qtext">${fmt(qText).replace(/_{3,}/g, () => `<span class="blank">${++blankNo}</span>`)}</div>
        <div class="mf-row">${q.fields.map((f, i) => `<button class="mf-box${i === 0 ? " active" : ""}" data-f="${i}" type="button"><span class="mf-label">${esc(f.label)}</span><span class="mf-val" id="mfVal${i}"></span></button>`).join("")}</div>
        <p class="spell-instr">${esc(q.instr || "Tap a box, then type the number.")}</p>
        <div class="keyboard${multiNumeric ? " numeric" : ""}" id="kb">${keyboardHtml([].concat.apply([], fieldAcc), multiNumeric)}</div>
        ${actions}`;
    } else if (kind === "order") {
      // Put numbers in order: tap the tiles into the answer row. No "smallest / largest"
      // hint — knowing what ascending and descending mean is part of the question.
      body = `${passage}${visual}
        <div class="qtext">Put these numbers in <b>${q.order === "desc" ? "descending" : "ascending"} order</b>.</div>
        <div class="ord-slots" style="--n:${q.items.length}">${q.items.map((_, i) => `<button class="ord-slot" data-s="${i}" type="button" id="ordSlot${i}"></button>`).join("")}</div>
        <div class="ord-tray">${q.items.map((v, i) => `<button class="ord-chip" data-c="${i}" type="button">${esc(v)}</button>`).join("")}</div>
        <p class="spell-instr">${esc(q.instr || "Tap the numbers in order. Tap one in the row to send it back.")}</p>
        ${actions}`;
    } else if (kind === "shade") {
      // Represent a fraction: tap parts of the shape to colour them in (tap again to clear one).
      body = `${passage}
        <div class="qtext">${fmt(qText)}</div>
        <div class="q-visual" id="shadeBox">${ART.shadeShape(q)}</div>
        <p class="spell-instr">${esc(q.instr || "Tap the parts to colour them in.")}</p>
        ${actions}`;
    } else if (kind === "typed") {
      const parts = qText.split("___");
      body = `${passage}${visual}
        ${inlineBlank
          ? `<div class="qtext">${fmt(parts[0])}<span class="typed-blank" id="ansBox"></span>${fmt(parts.slice(1).join("___"))}</div>`
          : `<div class="qtext">${fmt(qText)}</div><div class="answer-box" id="ansBox"></div>`}
        <p class="spell-instr">${esc(q.instr || (numeric ? "Type your answer with the number pad." : inlineBlank ? "Type the missing word." : "Type your answer."))}</p>
        <div class="keyboard${numeric ? " numeric" : ""}" id="kb">${keyboardHtml(accepts, numeric, !!q.caseSensitive)}</div>
        ${actions}`;
    } else {
      // q.marks: punctuation questions — an empty blank (a "?" would look like an answer)
      // and each option shown as a big mark with its name.
      const blankHtml = q.marks ? '<span class="blank mark-blank"></span>' : '<span class="blank">?</span>';
      body = `${passage}${visual}
        <div class="qtext">${fmt(qText).replace(/___/g, blankHtml)}</div>
        <div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}" type="button"><span class="letter">${"ABCDEF"[i] || i + 1}</span><span class="opt-text">${q.marks ? markHtml(o) : esc(o)}</span></button>`).join("")}</div>`;
    }

    show(`
      <div class="topbar"><span class="back" id="bk">✕ Quit</span><h2>📝 ${esc(DATA.fullLabel(st.subjectId, st.topicId, st.levelId))}</h2></div>
      <div class="qwrap${q.clock || fracShape || q.pic ? " clock-q" : ""}${q.shade ? " shade-q" : ""}">
        <div class="progress-label"><span>Question ${num} of ${total}</span><span>${st.maxPts && st.maxPts.rate > 0 && st.maxPts.max > 0 ? `<span class="max-chip">${ART.coin(13)} up to <b>${st.maxPts.max}</b> pts</span> · `
          : st.maxPts && st.maxPts.replay ? `<span class="max-chip">${ART.coin(13)} replay: <b>+${st.maxPts.replay}</b> at ${st.maxPts.replayMin}%+</span> · ` : ""}✓ ${correctSoFar} correct</span></div>
        <div class="progress"><i style="width:${Math.round((st.idx / total) * 100)}%"></i></div>
        ${tag ? `<div class="qtag">${esc(tag)}</div>` : ""}
        ${body}
        <div class="feedback" id="fbk" aria-live="polite"></div>
      </div>`, st.subjectId);

    $("#bk").onclick = () => {
      showConfirm("Quit this assessment?", "Your answers in this assessment won't be saved.", "Quit", () => {
        exam = null; renderLevel(st.subjectId, st.topicId, st.levelId);
      });
    };

    let busy = false;
    function next() {
      if (exam !== st) return;
      st.idx++;
      renderQuestion();
    }
    // One place that records an answer — the same for every question type.
    function finish(correct, chosenText, answerText, correctionHtml) {
      busy = true;
      SOUND.play(correct ? "correct" : "wrong");
      const c = q.cat || "?";
      if (!st.byCat[c]) st.byCat[c] = { correct: 0, total: 0 };
      st.byCat[c].total++;
      if (correct) st.byCat[c].correct++;
      const stem = kind === "spell" ? "Spell the word: " + q.word : q.clock ? qText + " (clock showing " + q.clock + ")"
        : fracShape ? qText + " (" + fracShape + ": " + q[fracShape].replace("/", " of ") + " parts shaded)"
        : q.shade ? qText + " (" + q.shade + " of " + (q.shade === "grid" ? q.rows * q.cols : q.parts) + " parts)"
        : q.pic ? qText + " (gambar: " + q.options[q.answer] + ")" : (qText || "Question");
      const sec = Math.min(300, Math.round((Date.now() - shownAt) / 1000));   // capped, in case the page was left open
      st.answers.push({ q, correct, stem, chosenText, answerText, sec });
      const fb = $("#fbk");
      if (correct) {
        fb.innerHTML = `<div class="fb-ok">✅ ${PRAISE[Math.floor(Math.random() * PRAISE.length)]}</div>`;
        keyHandler = null;
        setTimeout(next, 850);
        return;
      }
      const last = st.idx + 1 >= st.questions.length;
      fb.innerHTML = `<div class="fb-bad">${correctionHtml}${q.explain ? `<div class="explain">💡 ${esc(q.explain)}</div>` : ""}</div>
        <button class="btn primary next-btn" id="nextBtn" type="button">${last ? "See my results →" : "Next question →"}</button>`;
      $("#nextBtn").onclick = next;
      try { $("#nextBtn").scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { }
      keyHandler = (e) => { if (e.key === "Enter" || e.key === " ") { next(); return true; } };
    }

    if (kind === "mcq") {
      const choose = (i) => {
        if (busy) return;
        const ok = i === q.answer;
        $$(".opt").forEach(b => { b.disabled = true; });
        const picked = screen().querySelector('.opt[data-i="' + i + '"]');
        if (picked) picked.classList.add(ok ? "opt-ok" : "opt-bad");
        if (!ok) {
          const good = screen().querySelector('.opt[data-i="' + q.answer + '"]');
          if (good) good.classList.add("opt-ok");
        }
        const right = q.options[q.answer];
        finish(ok, q.marks ? markWords(q.options[i]) : q.options[i], q.marks ? markWords(right) : right,
          `❌ The correct answer is ${q.marks ? markHtml(right) : `<b>${esc(right)}</b>`}`);
      };
      $$(".opt").forEach(b => { b.onclick = () => choose(parseInt(b.dataset.i, 10)); });
      keyHandler = (e) => {
        const k = String(e.key || "").toLowerCase();
        let i = k.length === 1 ? "abcdef".indexOf(k) : -1;
        if (i < 0 && /^[1-6]$/.test(k)) i = Number(k) - 1;
        if (i >= 0 && i < q.options.length) { choose(i); return true; }
      };
      return;
    }

    // Several answer boxes: type into the highlighted box; "Next box" moves on.
    if (kind === "multi") {
      const fields = q.fields;
      const vals = fields.map(() => "");
      let active = 0;
      const kb = $("#kb"), clearBtn = $("#clearBtn"), submitBtn = $("#submitBtn");
      const boxes = $$(".mf-box");
      const firstEmpty = () => vals.findIndex(v => !v.trim());
      const paint = () => {
        boxes.forEach((b, i) => {
          b.classList.toggle("active", i === active && !busy);
          $("#mfVal" + i).innerHTML = vals[i] ? esc(vals[i]) : `<span class="placeholder">?</span>`;
        });
        clearBtn.disabled = busy || !vals[active];
        submitBtn.disabled = busy || vals.every(v => !v.trim());
        submitBtn.textContent = firstEmpty() === -1 ? "Check answer ✓" : "Next box →";
      };
      const press = (k) => {
        if (busy) return;
        if (k === "back") vals[active] = vals[active].slice(0, -1);
        else if (vals[active].length < 8) vals[active] += k;
        paint();
      };
      const submit = () => {
        if (busy) return;
        const empty = firstEmpty();
        if (empty > -1) { active = empty; paint(); return; }
        const okEach = vals.map((v, i) => sameAnswer(v, fieldAcc[i], multiNumeric));
        const ok = okEach.every(Boolean);
        kb.querySelectorAll(".kb-key").forEach(b => { b.disabled = true; });
        boxes.forEach((b, i) => { b.disabled = true; b.classList.remove("active"); b.classList.add(okEach[i] ? "ok" : "bad"); });
        clearBtn.disabled = true; submitBtn.disabled = true;
        finish(ok,
          fields.map((f, i) => f.label + ": " + vals[i].trim()).join(", "),
          fields.map((f, i) => f.label + ": " + fieldAcc[i][0]).join(", "),
          "❌ " + fields.map((f, i) => `${esc(f.label)}: <b>${esc(fieldAcc[i][0])}</b>${okEach[i] ? " ✓" : ""}`).join(" · "));
      };
      boxes.forEach((b, i) => { b.onclick = () => { if (!busy) { active = i; paint(); } }; });
      kb.querySelectorAll(".kb-key").forEach(b => { b.onclick = () => press(b.dataset.key); });
      clearBtn.onclick = () => { if (!busy) { vals[active] = ""; paint(); } };
      submitBtn.onclick = submit;
      keyHandler = (e) => {
        if (busy) return;
        if (e.key === "Enter") { submit(); return true; }
        if (e.key === "Tab") { active = (active + (e.shiftKey ? fields.length - 1 : 1)) % fields.length; paint(); return true; }
        if (e.key === "Backspace") { press("back"); return true; }
        const k = String(e.key || "").length === 1 ? e.key.toLowerCase() : "";
        if (k && (multiNumeric ? /[0-9.\/-]/.test(k) : /[a-z' -]/.test(k))) { press(k); return true; }
      };
      paint();
      return;
    }

    // Shade a fraction: any parts will do — what counts is how many.
    if (kind === "shade") {
      const parts = q.shade === "grid" ? q.rows * q.cols : q.parts, want = Number(String(q.word).split("/")[0]);
      const cells = $$("#shadeBox .shade-part"), clearBtn = $("#clearBtn"), submitBtn = $("#submitBtn"), lit = new Set();
      const paint = () => {
        cells.forEach(c => c.classList.toggle("on", lit.has(Number(c.dataset.part))));
        clearBtn.disabled = busy || !lit.size;
        submitBtn.disabled = busy || !lit.size;
      };
      const submit = () => {
        if (busy || !lit.size) return;
        const ok = lit.size === want;
        $("#shadeBox").classList.add("shade-done", ok ? "ok" : "bad");
        clearBtn.disabled = true; submitBtn.disabled = true;
        finish(ok, lit.size + "/" + parts, q.word,
          `❌ You coloured <b>${lit.size}</b> of the ${parts} parts. ${esc(q.word)} is <b>${want}</b> of them, like this:<div class="shade-eg">${ART.shadeShape(q, Array.from({ length: want }, (_, i) => i))}</div>`);
      };
      cells.forEach(c => { c.onclick = () => { if (busy) return; const i = Number(c.dataset.part); if (lit.has(i)) lit.delete(i); else lit.add(i); paint(); }; });
      clearBtn.onclick = () => { if (!busy) { lit.clear(); paint(); } };
      submitBtn.onclick = submit;
      keyHandler = (e) => {
        if (busy) return;
        if (e.key === "Enter") { submit(); return true; }
      };
      paint();
      return;
    }

    // Put in order: each tap fills the next place in the row; tapping a placed number sends it back.
    if (kind === "order") {
      const asc = q.order !== "desc";
      const val = (s) => Number(String(s).replace(/,/g, ""));
      const right = q.items.slice().sort((a, b) => asc ? val(a) - val(b) : val(b) - val(a));
      const sign = asc ? " < " : " > ";
      const slots = $$(".ord-slot"), chips = $$(".ord-chip"), clearBtn = $("#clearBtn"), submitBtn = $("#submitBtn");
      let placed = [];                          // tile numbers, in the order tapped
      const paint = () => {
        slots.forEach((s, i) => {
          const c = placed[i];
          s.innerHTML = c == null ? `<span class="placeholder">${i + 1}</span>` : esc(q.items[c]);
          s.classList.toggle("filled", c != null);
          s.classList.toggle("next", !busy && i === placed.length);
        });
        chips.forEach((b, i) => { const used = placed.indexOf(i) > -1; b.classList.toggle("used", used); b.disabled = busy || used; });
        clearBtn.disabled = busy || !placed.length;
        submitBtn.disabled = busy || placed.length < q.items.length;
      };
      const take = (i) => { if (busy || placed.indexOf(i) > -1 || placed.length >= q.items.length) return; placed.push(i); paint(); };
      const giveBack = (s) => { if (busy || placed[s] == null) return; placed.splice(s, 1); paint(); };
      const submit = () => {
        if (busy || placed.length < q.items.length) return;
        const got = placed.map(i => q.items[i]);
        const okEach = got.map((v, i) => val(v) === val(right[i]));
        slots.forEach((s, i) => { s.disabled = true; s.classList.remove("next"); s.classList.add(okEach[i] ? "ok" : "bad"); });
        chips.forEach(b => { b.disabled = true; });
        clearBtn.disabled = true; submitBtn.disabled = true;
        finish(okEach.every(Boolean), got.join(sign), right.join(sign), `❌ The correct order is <b>${right.map(esc).join(sign)}</b>`);
      };
      chips.forEach(b => { b.onclick = () => take(parseInt(b.dataset.c, 10)); });
      slots.forEach(s => { s.onclick = () => giveBack(parseInt(s.dataset.s, 10)); });
      clearBtn.onclick = () => { if (!busy) { placed = []; paint(); } };
      submitBtn.onclick = submit;
      keyHandler = (e) => {
        if (busy) return;
        if (e.key === "Enter") { submit(); return true; }
        if (e.key === "Backspace") { giveBack(placed.length - 1); return true; }
      };
      paint();
      return;
    }

    // Typed answer or listen-and-spell — letters go into the answer box.
    const box = $("#ansBox"), kb = $("#kb"), clearBtn = $("#clearBtn"), submitBtn = $("#submitBtn");
    const maxLen = Math.max(12, Math.max.apply(null, accepts.map(a => a.length)) + 6);
    const before = inlineBlank ? qText.split("___")[0].trim() : "";
    const capFirst = inlineBlank && (!before || /[.!?:"“]$/.test(before));   // the blank starts a sentence
    // caseSensitive questions test the capital letter itself: there's a ⇧ key,
    // nothing is capitalised for him, and the answer must match exactly.
    const exactCase = kind === "typed" && !!q.caseSensitive;
    let typed = "", shiftOn = false;
    function paint() {
      let shown = typed;
      if (kind === "typed" && !exactCase && (capFirst || typed === "i")) shown = typed.charAt(0).toUpperCase() + typed.slice(1);
      const sk = kb.querySelector('[data-key="shift"]');
      if (sk) sk.classList.toggle("on", shiftOn);
      box.innerHTML = shown ? esc(shown) : `<span class="placeholder">${kind === "spell" ? "Tap letters…" : "?"}</span>`;
      box.classList.toggle("empty", !typed);
      clearBtn.disabled = busy || !typed;
      submitBtn.disabled = busy || !typed.trim();
    }
    function press(k) {
      if (busy) return;
      if (k === "shift") shiftOn = !shiftOn;
      else if (k === "back") typed = typed.slice(0, -1);
      else if (typed.length < maxLen) { typed += shiftOn ? k.toUpperCase() : k; shiftOn = false; }
      paint();
    }
    const tidy = (s) => String(s).replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();
    function submit() {
      if (busy || !typed.trim()) return;
      const ok = exactCase ? accepts.some(a => tidy(a) === tidy(typed)) : sameAnswer(typed, accepts, numeric);
      kb.querySelectorAll(".kb-key").forEach(b => { b.disabled = true; });
      clearBtn.disabled = true; submitBtn.disabled = true;
      box.classList.add(ok ? "ok" : "bad");
      const right = accepts[0];
      let corr;
      if (kind === "spell") corr = `❌ The correct spelling is <b>${esc(right)}</b>`;
      else if (inlineBlank) corr = `❌ The correct answer is <b>${esc(right)}</b><div class="fixed">✔ ${fmt(qText).replace("___", () => "<u>" + esc(right) + "</u>")}</div>`;
      else if (exactCase && sameAnswer(typed, accepts, false)) corr = `❌ Right word — but it needs a capital letter: <b>${esc(right)}</b>`;
      else corr = `❌ The correct answer is <b>${esc(right)}</b>`;
      finish(ok, typed.trim(), right, corr);
    }
    kb.querySelectorAll(".kb-key").forEach(b => { b.onclick = () => press(b.dataset.key); });
    clearBtn.onclick = () => { if (!busy) { typed = ""; paint(); } };
    submitBtn.onclick = submit;
    keyHandler = (e) => {
      if (busy) return;
      if (e.key === "Enter") { submit(); return true; }
      if (e.key === "Backspace") { press("back"); return true; }
      const raw = String(e.key || "").length === 1 ? e.key.replace("’", "'") : "";
      const k = exactCase ? raw : raw.toLowerCase();     // keep the capital the child typed
      if (k && (numeric ? /[0-9.:\/-]/.test(k) : /[a-zA-Z' -]/.test(k))) { press(k); return true; }
    };
    paint();

    if (kind === "spell") {
      const lang = (subj && subj.voice) || "en-GB";
      if (!speak(q.word, lang)) $("#spellInstr").innerHTML = `Spell this word: <b>${esc(q.word)}</b>`;
      $("#hearBtn").onclick = () => { if (!speak(q.word, lang)) toast("This device can't read words aloud.", "bad"); };
    }
  }

  /* ---------- results ---------- */
  function renderResults() {
    const st = exam;
    if (!st) return renderMenu();
    exam = null;
    current = null;
    const total = st.answers.length;
    const correct = st.answers.filter(a => a.correct).length;
    const pct = total ? Math.round(correct / total * 100) : 0;
    const before = REPORT.levelStats(st.subjectId, st.topicId, st.levelId);

    const mistakes = st.answers.filter(a => !a.correct).map(a => ({ q: a.stem, chosen: a.chosenText, answer: a.answerText, cat: a.q.cat || "?", sec: a.sec }));
    const saved = STORE.recordSession({
      subjectId: st.subjectId, topicId: st.topicId, levelId: st.levelId,
      ts: Date.now(), total, correct, byCat: st.byCat, mistakes,
      answers: st.answers.map(a => ({ q: a.stem, c: a.chosenText, a: a.answerText, ok: a.correct ? 1 : 0, cat: a.q.cat || "?", s: a.sec }))
    });
    const after = REPORT.levelStats(st.subjectId, st.topicId, st.levelId);
    const nStars = starsFor(pct);
    const newBest = !!(saved && saved.newBest && saved.prevBest > 0);
    const earned = (saved && saved.points) || 0;
    const myrRate = STORE.myrPerPoint();
    const balance = STORE.pointsSummary().available;
    // Why these points (or none) — shown under the Score / Points earned boxes.
    const replayBonus = (saved && saved.replayBonus) || 0;
    const rb = DATA.REPLAY_BONUS;
    let pointsBox;
    if (replayBonus > 0) {
      pointsBox = `<div class="points-why">🔁 Replay bonus! You'd already scored 100% here, and every replay at ${rb.minPct}% or more earns +${rb.points} points.
        You now have <b>${ART.coin(14)} ${plural(balance, "point")}</b>.</div>`;
    } else if (saved && saved.prevBest >= 100 && saved.rate > 0) {
      pointsBox = `<div class="points-none">No points this time — your best here is already 100%. Score <b>${rb.minPct}% or more</b> on a replay to earn <b>+${rb.points} points</b>.</div>`;
    } else if (earned > 0) {
      pointsBox = `<div class="points-why">${saved.prevBest ? `New best: ${pct}% (was ${saved.prevBest}%) — every 1% above your old best earns points.` : "Your first score on this level — every 1% earns points."}
        You now have <b>${ART.coin(14)} ${plural(balance, "point")}</b>.</div>`;
    } else if (saved && saved.newBest) {
      pointsBox = `<div class="points-none">New best! Points are switched off for ${esc(DATA.subject(st.subjectId).label)} right now.</div>`;
    } else {
      pointsBox = `<div class="points-none">No new points this time — your best is still <b>${saved ? saved.prevBest : 0}%</b>. Beat it to earn more!</div>`;
    }
    const pointsTile = `<div class="rs-box rs-points${earned ? "" : " zero"}">
        <div class="rs-label">Points earned</div>
        <div class="rs-num">${ART.coin(34)}<span>${earned ? "+" + earned.toLocaleString("en-GB") : "0"}</span></div>
        <div class="rs-sub">${earned ? (replayBonus ? "🔁 replay bonus" + (myrRate ? " · 💵 " + MYR(earned * myrRate) : "") : myrRate ? "💵 worth " + MYR(earned * myrRate) : plural(earned, "point")) : "no new points"}</div>
      </div>`;
    const nextMp = maxPoints(st.subjectId, st.topicId, st.levelId);
    pointsBox += nextMp.rate <= 0 ? ""
      : nextMp.max > 0 ? `<div class="max-next">Next try: up to <b>${ART.coin(14)} ${nextMp.max} points</b> — beat ${nextMp.best}% to earn them.</div>`
      : `<div class="max-next">🎉 You've earned all ${nextMp.full} points on this level — every replay at ${nextMp.replayMin}% or more earns <b>${ART.coin(14)} +${nextMp.replay} points</b>!</div>`;
    const justMastered = after.mastery.id === "mastered" && before.mastery.id !== "mastered";
    const masteryUp = after.mastery.rank > before.mastery.rank && before.attempts > 0;
    SOUND.play(pct >= 80 ? "win" : "finish");
    if (nStars) setTimeout(() => SOUND.play("star"), 520);
    if (earned) setTimeout(() => SOUND.play("coin"), 900);

    const head = justMastered ? "Level mastered!" : pct >= 90 ? "Outstanding!" : pct >= 70 ? "Great work!" : pct >= 50 ? "Good effort!" : "Keep going — you'll get there!";
    const rows = Object.keys(st.byCat).map(k => {
      const s = st.byCat[k];
      return { label: DATA.catLabel(st.subjectId, st.topicId, st.levelId, k), correct: s.correct, total: s.total, acc: s.total ? s.correct / s.total : 0 };
    }).sort((a, b) => a.acc - b.acc);
    const weakest = rows[0];
    const advice = weakest && weakest.total >= 2 && weakest.acc < 0.7
      ? `<b>Focus next on:</b> ${esc(weakest.label)} — ${weakest.correct}/${weakest.total} correct.`
      : pct >= 80 ? `<b>Excellent!</b> ${esc(after.next)}`
      : `<b>Keep practising:</b> ${pct}% correct. ${esc(after.next)}`;
    const breakdown = rows.length > 1
      ? `<h3 class="section-h">By question type — weakest first</h3>
         <div class="rep-grid">${rows.map(r => barCard(r.label, r.correct, r.total)).join("")}</div>`
      : "";
    const mistakeCards = mistakes.slice(0, 6).map(m => `<div class="rep-card">
        <div class="sub ink">${esc(m.q)}</div>
        <div class="sub bad">Your answer: <b>${esc(m.chosen)}</b></div>
        <div class="sub good">Correct: <b>${esc(m.answer)}</b></div>
      </div>`).join("");

    show(`
      <div class="topbar"><span class="back" id="bk">← ${esc(DATA.levelLabel(st.subjectId, st.topicId, st.levelId))}</span><h2>Results — ${esc(DATA.fullLabel(st.subjectId, st.topicId, st.levelId))}</h2></div>
      <div class="page narrow">
        <div class="card wide center results-card">
          <div class="results-owl">${ART.owl()}</div>
          <h2 class="card-h">${head}</h2>
          <div class="result-stats">
            <div class="rs-box">
              <div class="rs-label">Score</div>
              <div class="score">${pct}%</div>
              <div class="rs-sub">${correct} / ${total} correct</div>
            </div>
            ${pointsTile}
          </div>
          <div class="results-stars">${ART.stars(nStars, 34)}</div>
          ${newBest ? `<div class="new-best" style="font-weight:800">🎉 New best!</div>` : ""}
          <div style="margin-top:10px">${masteryBadge(after.mastery, true)}${masteryUp && !justMastered ? ` <span class="new-best small">▲ moved up!</span>` : ""}</div>
          ${pointsBox}
          <div class="summary-box" style="margin-top:14px;text-align:left">${advice}</div>
        </div>
        ${breakdown}
        ${mistakeCards ? `<h3 class="section-h">Mistakes to learn from</h3><div class="rep-grid">${mistakeCards}</div>` : ""}
        <div class="row" style="margin-top:22px">
          <button class="btn ghost" id="backBtn" type="button">← Level</button>
          <button class="btn" id="repBtn" type="button">📊 Progress report</button>
          <button class="btn primary" id="againBtn" type="button">🔁 Try again</button>
        </div>
      </div>`, st.subjectId);
    const toLevel = () => renderLevel(st.subjectId, st.topicId, st.levelId);
    $("#bk").onclick = toLevel;
    $("#backBtn").onclick = toLevel;
    $("#repBtn").onclick = () => renderLevelReport(st.subjectId, st.topicId, st.levelId, toLevel);
    $("#againBtn").onclick = () => startSession(st.subjectId, st.topicId, st.levelId);
  }

  /* ===================== history & analysis (all levels) ===================== */
  function renderHistory(filter, onBack) {
    filter = filter || "all";
    onBack = onBack || renderMenu;
    current = () => renderHistory(filter, onBack);
    const self = () => renderHistory(filter, onBack);
    const subjectId = filter === "all" ? null : filter;
    const history = STORE.history(subjectId);
    const chips = [{ id: "all", label: "All subjects" }].concat(DATA.SUBJECTS.map(s => ({ id: s.id, label: s.label })))
      .map(c => `<button class="chip${c.id === filter ? " on" : ""}" data-f="${c.id}" ${c.id !== "all" ? `data-subject="${c.id}"` : ""} type="button">${esc(c.label)}</button>`).join("");
    const top = `<div class="topbar"><span class="back" id="bk">← Back</span><h2>📈 History &amp; Analysis</h2></div>`;

    if (!history.length) {
      show(`${top}
        <div class="page narrow">
          <div class="chips">${chips}</div>
          <div class="card wide center" style="margin-top:16px">
            <div class="big-emoji">📊</div>
            <h2 class="card-h">No assessments yet</h2>
            <p class="muted" style="line-height:1.7">Every finished assessment shows up here — scores, attempts, which levels are improving and which need more practice.</p>
            <div class="row" style="margin-top:16px"><button class="btn primary" id="backBtn" type="button">← Back</button></div>
          </div>
        </div>`, subjectId);
      wireHistoryCommon(onBack);
      return;
    }

    const groups = {};
    history.forEach(h => { (groups[levelKey(h)] = groups[levelKey(h)] || []).push(h); });
    const levels = Object.keys(groups).map(k => {
      const h = groups[k][0];
      return REPORT.levelStats(h.subjectId, h.topicId, h.levelId, groups[k]);
    }).sort((a, b) => a.avg - b.avg);
    const weak = levels.filter(l => l.mastery.rank <= 2).slice(0, 3);
    let summary = `Overall: <b>${avgPct(history)}%</b> across <b>${plural(history.length, "assessment")}</b> in <b>${plural(levels.length, "level")}</b>. `;
    summary += weak.length ? `Needs the most practice: <b class="bad">${weak.map(l => esc(l.label)).join(", ")}</b>.` : "No weak levels — keep it up!";
    summary += `<br/><span class="muted small">👆 Tap a level for its full progress report.</span>`;

    const cards = levels.map(l => {
      const w = l.weakAreas[0];
      return `<button class="hist-card" data-subj="${esc(l.subjectId)}" data-topic="${esc(l.topicId)}" data-level="${esc(l.levelId)}" type="button">
        <span class="hist-head">
          <span class="hist-name">${esc(l.label)} ${subjectId ? "" : subjectPill(l.subjectId)}</span>
          ${masteryBadge(l.mastery)}
        </span>
        <span class="hist-stats">
          <span><b>${l.attempts}</b> ${l.attempts === 1 ? "attempt" : "attempts"}</span>
          <span>Average <b>${l.avg}%</b></span>
          <span>Latest <b>${l.latest}%</b></span>
          <span>Best <b>${l.best}%</b></span>
          <span>Last <b>${esc(REPORT.timeAgo(l.lastTs))}</b></span>
          <span>${trendMark(l.trend)}</span>
        </span>
        ${w ? `<span class="hist-note"><span class="label">🎯 Weak area</span> <b>${esc(w.label)}</b> — ${w.correct}/${w.total} correct (${w.pct}%)</span>`
            : `<span class="hist-note ok"><span class="label">✅ No weak areas</span> every question type ≥ 70%</span>`}
        <span class="hist-suggest"><span class="label">💡 Next</span> ${esc(l.next)}</span>
      </button>`;
    }).join("");

    const recent = history.slice(0, 12).map(h => {
      const band = pctBand(h.pct);
      return `<button class="session-row" data-subj="${esc(h.subjectId)}" data-topic="${esc(h.topicId)}" data-level="${esc(h.levelId)}" data-ts="${h.ts}" type="button">
        <span class="session-line"><span class="session-topic">${esc(DATA.fullLabel(h.subjectId, h.topicId, h.levelId))} ${subjectId ? "" : subjectPill(h.subjectId)}</span><span class="${band.cls}">${h.correct}/${h.total} · ${h.pct}%</span></span>
        <span class="session-line"><span class="muted small">${esc(REPORT.shortDate(h.ts))} · ${esc(REPORT.timeAgo(h.ts))}</span><span class="session-more">View details ›</span></span>
      </button>`;
    }).join("");

    show(`${top}
      <div class="page narrow">
        <div class="chips">${chips}</div>
        <div class="summary-box" style="margin-top:14px">${summary}</div>
        <h3 class="section-h">By level — weakest first</h3>
        <div class="hist-list">${cards}</div>
        <h3 class="section-h">Recent assessments</h3>
        <div class="session-list">${recent}</div>
        <div class="row" style="margin-top:20px">
          <button class="btn primary" id="backBtn" type="button">← Back</button>
        </div>
      </div>`, subjectId);
    wireHistoryCommon(onBack);
    $$(".hist-card").forEach(c => { c.onclick = () => renderLevelReport(c.dataset.subj, c.dataset.topic, c.dataset.level, self); });
    $$(".session-row").forEach(r => { r.onclick = () => renderSessionDetail(r.dataset.subj, r.dataset.topic, r.dataset.level, Number(r.dataset.ts), self); });
  }
  function wireHistoryCommon(onBack) {
    $("#bk").onclick = onBack;
    $("#backBtn").onclick = onBack;
    $$(".chip").forEach(c => { c.onclick = () => renderHistory(c.dataset.f, onBack); });
  }

  /* ---------- one assessment, every question ---------- */
  function renderSessionDetail(subjectId, topicId, levelId, ts, onBack) {
    const s = STORE.history(subjectId, null, topicId, levelId).filter(h => h.ts === ts)[0];
    if (!s) return onBack();
    current = () => renderSessionDetail(subjectId, topicId, levelId, ts, onBack);
    const band = pctBand(s.pct);
    const src = s.byCat || {};
    const rows = Object.keys(src).map(k => ({
      label: DATA.catLabel(subjectId, topicId, levelId, k),
      correct: src[k].correct, total: src[k].total, acc: src[k].total ? src[k].correct / src[k].total : 0
    })).sort((a, b) => a.acc - b.acc);

    const hasFull = Array.isArray(s.answers) && s.answers.length > 0;
    const items = hasFull
      ? s.answers.map(a => ({ q: a.q, chosen: a.c, answer: a.a, ok: !!a.ok }))
      : (s.mistakes || []).map(m => ({ q: m.q, chosen: m.chosen, answer: m.answer, ok: false }));
    const wrongCount = items.filter(i => !i.ok).length;
    function itemsHtml(onlyWrong) {
      const list = items.map((it, i) => ({ it, n: i + 1 })).filter(x => !onlyWrong || !x.it.ok);
      if (!list.length) return `<div class="muted center" style="padding:14px">🎉 No wrong answers in this assessment.</div>`;
      return list.map(({ it, n }) => `<div class="ans-row ${it.ok ? "ans-ok" : "ans-bad"}">
        <div class="ans-head"><span class="ans-num">${hasFull ? "Q" + n : "❌"}</span><span class="ans-q">${esc(it.q || "Question")}</span>${hasFull ? `<span>${it.ok ? "✅" : "❌"}</span>` : ""}</div>
        ${it.ok
          ? `<div class="sub good">Answer: <b>${esc(it.answer)}</b></div>`
          : `<div class="sub bad">Answered: <b>${esc(it.chosen)}</b></div><div class="sub good">Correct: <b>${esc(it.answer)}</b></div>`}
      </div>`).join("");
    }
    show(`
      <div class="topbar"><span class="back" id="bk">← Back</span><h2>Assessment details</h2></div>
      <div class="page narrow">
        <div class="card wide center">
          <div class="hist-name">${esc(DATA.fullLabel(subjectId, topicId, levelId))} ${subjectPill(subjectId)}</div>
          <div class="muted small" style="margin-top:4px">${esc(fullDate(s.ts))} · ${esc(REPORT.timeAgo(s.ts))}</div>
          <div class="score">${s.pct}%</div>
          <div class="results-stars">${ART.stars(starsFor(s.pct), 26)}</div>
          <div class="muted" style="font-weight:700">${s.correct} / ${s.total} correct · <span class="${band.cls}">${band.txt}</span></div>
        </div>
        ${rows.length > 1 ? `<h3 class="section-h">By question type — weakest first</h3><div class="rep-grid">${rows.map(r => barCard(r.label, r.correct, r.total)).join("")}</div>` : ""}
        <h3 class="section-h">${hasFull ? "Every question" : "Mistakes"}</h3>
        ${hasFull ? `<div class="ans-filter">
            <button class="btn sm primary" data-f="all" type="button">All (${items.length})</button>
            <button class="btn sm ghost" data-f="wrong" type="button">Wrong only (${wrongCount})</button>
          </div>` : `<div class="summary-box small" style="margin-bottom:10px">Older assessments keep only the mistakes — the full question list is kept for the 20 most recent ones.</div>`}
        <div class="ans-list" id="ansList">${itemsHtml(false)}</div>
        <div class="row" style="margin-top:22px"><button class="btn ghost" id="backBtn" type="button">← Back</button></div>
      </div>`, subjectId);
    $("#bk").onclick = onBack;
    $("#backBtn").onclick = onBack;
    $$(".ans-filter [data-f]").forEach(btn => {
      btn.onclick = () => {
        $$(".ans-filter [data-f]").forEach(b => { b.classList.toggle("primary", b === btn); b.classList.toggle("ghost", b !== btn); });
        $("#ansList").innerHTML = itemsHtml(btn.dataset.f === "wrong");
      };
    });
  }

  /* ===================== parent report ===================== */
  function renderReport() {
    current = renderReport;
    const self = renderReport;
    const r = REPORT.build();
    const name = (STORE.active() || {}).name || "Player";
    const subjectCards = r.subjects.map(s => `<div class="rep-card subject-rep" data-subject="${esc(s.subject.id)}">
        <div class="t"><span class="subject-rep-name"><span class="subject-rep-art">${ART.subject(s.subject.id)}</span>${esc(s.subject.label)}</span>${s.band ? `<span class="${s.band.cls}">${s.band.txt}</span>` : `<span class="muted small">No assessments yet</span>`}</div>
        ${s.totalQ ? `
          <div class="acc" style="color:${s.band.color}">${s.pct}%</div>
          <div class="sub">${s.totalC} / ${s.totalQ} correct · ${plural(s.sessions, "assessment")} · last ${esc(REPORT.timeAgo(s.lastTs))}</div>
          <div class="bar"><i style="width:${s.pct}%;background:${s.band.color}"></i></div>
        ` : ""}
        <div class="sub" style="margin-top:8px">${ART.coin(13)} <b class="gold">${plural(STORE.points(null, s.subject.id), "point")}</b> · 1% = ${ratePhrase(STORE.rate(s.subject.id))}</div>
        <div class="sub">${!s.subject.topics.length ? "Modules coming soon." : !s.levelsTotal ? plural(s.subject.topics.length, "module") + " · topics coming soon." : `🏆 ${s.levelsMastered} / ${plural(s.levelsTotal, "level")} mastered`}</div>
        ${s.sessions ? `<button class="btn sm ai-btn" data-aireport="${esc(s.subject.id)}" type="button">🤖 AI report${STORE.aiReport(s.subject.id) ? " · " + esc(REPORT.shortDate(STORE.aiReport(s.subject.id).ts)) : ""}</button>` : ""}
      </div>`).join("");

    // Mastery overview — every topic, every level, coloured by mastery.
    const overview = r.subjects.filter(s => s.subject.topics.length).map(s => `
      <div class="ov-subject" data-subject="${esc(s.subject.id)}">
        <div class="ov-subject-name">${esc(s.subject.label)}</div>
        ${s.topics.map(t => `<div class="ov-row">
            <span class="ov-topic">${esc(t.topic.icon || "")} ${esc(t.topic.label)}</span>
            <span class="ov-levels">${t.levels.length
              ? t.levels.map(l => `<button class="ov-chip ${l.mastery.cls}" data-subj="${esc(s.subject.id)}" data-topic="${esc(t.topic.id)}" data-level="${esc(l.levelId)}" title="${esc(l.label + " — " + l.mastery.label)}" type="button">${esc(DATA.levelLabel(s.subject.id, t.topic.id, l.levelId).replace(/Level\s*/i, "L"))}${l.attempts ? " · " + l.latest + "%" : ""}</button>`).join("")
              : `<span class="muted small">topics coming soon</span>`}</span>
          </div>`).join("")}
      </div>`).join("");
    const legend = Object.keys(REPORT.MASTERY).map(k => `<span class="ov-chip ${REPORT.MASTERY[k].cls} legend">${REPORT.MASTERY[k].icon} ${esc(REPORT.MASTERY[k].label)}</span>`).join("");

    const weakCards = r.weakest.map(l => `<button class="rep-card clickable" data-subj="${esc(l.subjectId)}" data-topic="${esc(l.topicId)}" data-level="${esc(l.levelId)}" type="button">
        <div class="t"><span>${esc(l.label)} ${subjectPill(l.subjectId)}</span>${masteryBadge(l.mastery)}</div>
        <div class="sub">${plural(l.attempts, "attempt")} · average ${l.avg}% · latest ${l.latest}% · last ${esc(REPORT.timeAgo(l.lastTs))}</div>
        ${l.weakAreas[0] ? `<div class="sub">🎯 Weak area: <b class="bad">${esc(l.weakAreas[0].label)}</b> (${l.weakAreas[0].pct}%)</div>` : ""}
      </button>`).join("");
    const myBadges = STORE.badges();
    const badgeSection = DATA.GAMES.length ? `<h3 class="section-h">Quest Arena badges</h3>
      <div class="rep-grid">${DATA.GAMES.map(def => `<div class="rep-card">
          <div class="t"><span>${def.icon || "🎮"} ${esc(def.label)} ${subjectPill(def.subjectId)}</span></div>
          <div class="sub">${esc(gameBest(def, STORE.gameLog(def.id)))}</div>
          <div class="sub">${ART.coin(13)} <b class="gold">${plural(STORE.arenaPoints(null, null, def.id), "point")}</b> from this game</div>
          <div class="game-badges" style="margin-top:8px">${def.rounds.filter(r => r.badge).map(r => badgeChip(r.badge, myBadges[r.badge])).join("")}</div>
        </div>`).join("")}</div>` : "";
    const earnedLog = STORE.pointsLog().filter(e => e.pts > 0).slice(-10).reverse();
    const pointsCards = earnedLog.map(e => `<div class="rep-card">
        <div class="t"><span>${esc(DATA.fullLabel(e.s, e.t, e.l))} ${subjectPill(e.s)}</span><span class="pts-gain">+${e.pts}</span></div>
        <div class="sub">${e.prev ? "Best " + e.prev + "% → " + e.pct + "%" : "First score: " + e.pct + "%"} · 1% = ${ratePhrase(e.rate)} · ${esc(REPORT.timeAgo(e.ts))}</div>
      </div>`).join("");
    const recent = r.recent.length
      ? `<h3 class="section-h">Recent mistakes</h3>
         <div class="rep-grid">${r.recent.map(m => `<div class="rep-card">
           <div class="t"><span>${esc(m.label)} ${subjectPill(m.subjectId)}</span><span class="sub">${esc(m.when)}</span></div>
           <div class="sub ink" style="margin-top:8px">${esc(m.q)}</div>
           ${m.chosen ? `<div class="sub bad">Answered: <b>${esc(m.chosen)}</b></div>` : ""}
           ${m.answer ? `<div class="sub good">Correct: <b>${esc(m.answer)}</b></div>` : ""}
         </div>`).join("")}</div>`
      : "";

    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>📊 Parent Report — ${esc(name)}</h2></div>
      <div class="page">
        <div class="summary-box">${r.summary}</div>
        ${r.totalQ ? `<div class="kpis">
            <div><div class="kpi-label">Assessments</div><div class="kpi">${r.sessions}</div></div>
            <div><div class="kpi-label">Questions</div><div class="kpi">${r.totalQ}</div></div>
            <div><div class="kpi-label">Accuracy</div><div class="kpi">${r.overallPct}%</div></div>
            <div><div class="kpi-label">Levels mastered</div><div class="kpi">🏆 ${r.mastered}</div></div>
            <div><div class="kpi-label">Stars</div><div class="kpi">⭐ ${totalStars(STORE.history())}</div></div>
            <div><div class="kpi-label">Points</div><div class="kpi">${ART.coin(22)} ${STORE.points()}</div></div>
          </div>` : ""}
        <h3 class="section-h">By subject</h3>
        <div class="rep-grid">${subjectCards}</div>
        ${overview ? `<h3 class="section-h">Mastery by module &amp; level</h3>
          <div class="ov-legend">${legend}</div>
          <div class="ov-wrap">${overview}</div>
          <div class="muted small" style="margin-top:6px">${esc(REPORT.MASTERY_RULE)} Tap a level for its progress report.</div>` : ""}
        ${weakCards ? `<h3 class="section-h">Levels that need help</h3><div class="rep-grid">${weakCards}</div>` : ""}
        ${badgeSection}
        ${pointsCards ? `<h3 class="section-h">Points earned</h3><div class="rep-grid">${pointsCards}</div>` : ""}
        ${recent}
        <div class="row" style="margin-top:22px">
          <button class="btn ghost" id="backBtn" type="button">← Menu</button>
          <button class="btn primary" id="toHist" type="button">📈 History &amp; Analysis</button>
        </div>
      </div>`);
    $("#bk").onclick = renderMenu;
    $("#backBtn").onclick = renderMenu;
    $("#toHist").onclick = () => renderHistory("all", self);
    $$("[data-level][data-subj]").forEach(b => { b.onclick = () => renderLevelReport(b.dataset.subj, b.dataset.topic, b.dataset.level, self); });
    $$("[data-aireport]").forEach(b => { b.onclick = () => renderAiReport(b.dataset.aireport); });
  }

  /* ===================== AI report for one subject ===================== */
  const aiWriting = {};   // subjects being written right now, so a second tap can't pay twice
  const STATUS_CLASS = { "Doing Well": "st-good", "Needs Practice": "st-mid", "Needs Attention": "st-bad", "Insufficient Evidence": "st-none" };
  const PRIORITY_CLASS = { "High priority": "p-high", "Practise": "p-mid", "Recheck": "p-check", "Low priority": "p-low" };
  const aiLine = (label, text) => `<div class="ai-line"><b>${esc(label)}:</b> ${esc(text)}</div>`;
  const aiList = (title, items) => `<div class="ai-sub">${esc(title)}</div><ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;

  // Detail for anyone who wants it, from the saved answers rather than the AI.
  function aiAppendixHtml(subjectId, rep) {
    const types = REPORT.weakTypes(subjectId, rep.lastTs);
    if (!types.length) return "";
    return `<details class="past-reqs ai-appendix"><summary>Appendix: question types and every wrong answer</summary>
      <p class="muted small">Weakest type first, copied from the saved answers.</p>
      ${types.map(t => `<div class="ai-block"><b>${esc(t.name)}</b>: ${t.pct == null ? plural(t.rows.length, "wrong question") : `${t.right} of ${t.total} right (${t.pct}%)`}<div class="muted small">${esc(t.level)}</div>
        ${t.rows.map(r => `<div class="ai-ex">${esc(r.q)}<span class="bad">Answered: ${esc(r.chosen.join(" / ") || "nothing")}</span><span class="good">Correct: ${esc(r.answer)}</span></div>`).join("")}</div>`).join("")}
    </details>`;
  }

  function aiGapCard(w, n) {
    return `<div class="ai-block ${PRIORITY_CLASS[w.priority] || ""}">
      <div class="ai-card-top"><b>${String(n).padStart(2, "0")}. ${esc(w.topic)}</b><div>${w.score ? `<span>${w.score.correct}/${w.score.total} correct</span>` : ""}<i>${esc(w.priority.toUpperCase())}</i></div></div>
      ${aiLine("Problem", w.problem)}
      ${w.examples.map(e => `${aiLine("Actual question", e.question)}
        <div class="ai-pair"><div class="no"><span>Child's answer</span>${esc(e.answer || "nothing")}</div><div class="yes"><span>Correct answer</span>${esc(e.correct)}</div></div>`).join("")}
      ${aiLine("Possible reason", w.possible_reason)}${aiLine("How to teach", w.how_to_teach)}${aiLine("Improvement target", w.improvement_target)}
    </div>`;
  }

  function aiReportHtml(subjectId, rep) {
    const s = rep.sections, st = rep.stats, gaps = REPORT.splitGaps(s);
    return `
      <div class="ai-kpis">
        <div><b>${st.pct}%</b><span>Overall accuracy</span></div>
        <div><b>${gaps.top.length}</b><span>${gaps.top.length === 1 ? "Top priority" : "Top priorities"}</span></div>
        <div><b>${st.assessments}</b><span>Assessments reviewed</span></div>
      </div>
      <section class="ai-part"><h3 class="section-h">1. Overall Performance</h3>
        <p>${esc(s.summary)}</p>
        <div class="ai-two">
          <div class="ai-box good">${aiList("Top strengths", s.strengths)}</div>
          <div class="ai-box bad">${aiList("Areas needing attention", s.attention)}</div>
        </div>
        <div class="ai-note"><div class="ai-line"><b>Is there enough evidence?</b> ${esc(s.evidence_note)}</div></div>
      </section>
      <section class="ai-part"><h3 class="section-h">2. Performance by Topic</h3>
        <div class="ai-scroll"><table class="ai-table topics"><thead><tr><th>Topic and level</th><th>Result</th><th>Status</th><th>What it tells us</th></tr></thead>
        <tbody>${s.levels.map(l => `<tr><td>${esc(l.label)}</td><td>${l.correct}/${l.total} (${l.pct}%)</td><td class="${STATUS_CLASS[l.status] || ""}">${esc(l.status)}</td><td>${esc(l.note)}</td></tr>`).join("")}</tbody></table></div>
      </section>
      <section class="ai-part"><h3 class="section-h">3. Weakness Analysis</h3>
        ${!s.weaknesses.length ? `<p class="muted">${esc(REPORT.AI_NOTES.none)}</p>` : ""}
        ${gaps.top.length ? `<div class="ai-sub">${esc(gaps.heading)}</div>${gaps.top.map((w, i) => aiGapCard(w, i + 1)).join("")}` : ""}
        ${gaps.others.length ? `<div class="ai-sub ai-gap">Other mistakes &amp; what to practise</div><p class="muted small">${esc(REPORT.AI_NOTES.others)}</p>
          ${gaps.others.map((w, i) => aiGapCard(w, gaps.top.length + i + 1)).join("")}` : ""}
      </section>
      ${s.plan.length ? `<section class="ai-part"><h3 class="section-h">4. Recommended Practice Plan</h3>
        <div class="ai-scroll"><table class="ai-table plan"><thead><tr><th>First</th><th>What to do</th><th>How often</th><th>Reassess</th></tr></thead>
        <tbody>${s.plan.map((p, i) => `<tr><td>${i + 1}. ${esc(p.area)}</td><td>${esc(p.what_to_do)}</td><td data-label="How often">${esc(p.frequency)}</td><td data-label="Reassess">${esc(p.reassess)}</td></tr>`).join("")}</tbody></table></div>
      </section>` : ""}
      ${s.since_last.length ? `<section class="ai-part"><div class="ai-sub">Since the last report</div><div class="ai-scroll"><table class="ai-table"><thead><tr><th>Weakness</th><th>Now</th></tr></thead>
        <tbody>${s.since_last.map(p => `<tr><td>${esc(p.topic)}</td><td>${esc(p.progress)}</td></tr>`).join("")}</tbody></table></div></section>` : ""}
      <div class="ai-note ai-gap">${aiLine("On the next report", REPORT.AI_NOTES.next)}</div>
      ${aiAppendixHtml(subjectId, rep)}`;
  }

  const loading = {};
  function loadScript(src) {
    return loading[src] = loading[src] || new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete loading[src]; reject(new Error("Couldn't load " + src)); };
      document.head.appendChild(s);
    });
  }

  async function downloadAiReport(subjectId) {
    const rep = STORE.aiReport(subjectId), subj = DATA.subject(subjectId);
    if (!rep) return;
    try {
      await loadScript("js/vendor/jspdf.umd.min.js");
      await loadScript("js/report-pdf.js");
      const doc = window.buildReportPdf(window.jspdf.jsPDF, {
        subject: subj.fullLabel || subj.label,
        student: (STORE.active() || {}).name || "",
        date: new Date(rep.ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        stats: rep.stats,
        sections: rep.sections,
        types: REPORT.weakTypes(subjectId, rep.lastTs)
      });
      doc.save(`Quest Academy ${subj.label} report ${new Date(rep.ts).toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      toast("The PDF couldn't be made. Check the internet and try again.", "bad");
    }
  }

  async function makeAiReport(subjectId) {
    if (aiWriting[subjectId]) return;
    aiWriting[subjectId] = true;
    renderAiReport(subjectId);
    try {
      const token = await AUTH.idToken();
      if (!token) throw new Error("Sign in with your account to make a report.");
      const history = STORE.history(subjectId), facts = REPORT.reportFacts(subjectId);
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ subject: DATA.subject(subjectId).fullLabel || DATA.subject(subjectId).label, evidence: REPORT.subjectEvidence(subjectId) })
      }).catch(() => { throw new Error("Couldn't reach the server. Check the internet and try again."); });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sections) throw new Error(data.error || "The report couldn't be made. Try again in a minute.");
      STORE.saveAiReport(subjectId, { format: 3, ts: Date.now(), basedOn: history.length, lastTs: history[0].ts, stats: facts.stats, sections: REPORT.finishReport(data.sections, facts) });
      toast("Report ready.", "good");
    } catch (e) {
      toast(e.message || "The report couldn't be made. Try again in a minute.", "bad");
    }
    aiWriting[subjectId] = false;
    if (current && current.aiSubject === subjectId) renderAiReport(subjectId);
  }

  function renderAiReport(subjectId) {
    const subj = DATA.subject(subjectId);
    if (!subj) return renderReport();
    current = () => renderAiReport(subjectId);
    current.aiSubject = subjectId;
    const rep = STORE.aiReport(subjectId), history = STORE.history(subjectId);
    const newOnes = rep ? history.filter(h => h.ts > rep.lastTs).length : history.length;
    const oldLayout = rep && rep.format !== 3;
    const writing = !!aiWriting[subjectId];
    const action = writing ? `<button class="btn primary" type="button" disabled>✍️ Writing the report…</button><span class="muted small">This can take a minute.</span>`
      : !history.length ? `<span class="muted small">Finish an assessment first.</span>`
      : !rep ? `<button class="btn primary" id="aiGo" type="button">🤖 Generate AI report</button>`
      : newOnes || oldLayout ? `<button class="btn primary" id="aiGo" type="button">🔄 Update report</button><span class="muted small">${oldLayout ? "This report uses the old layout. Update it to get the new one." : plural(newOnes, "new assessment") + " since this report."}</span>`
      : `<span class="muted small">Up to date. You can update it after the next assessment.</span>`;
    show(`
      <div class="topbar"><span class="back" id="bk">← Parent Report</span><h2>🤖 ${esc(subj.label)} AI report</h2></div>
      <div class="page narrow">
        ${rep ? `<div class="summary-box">As of <b>${esc(REPORT.shortDate(rep.ts))}</b>, based on ${plural(rep.basedOn, "assessment")}.</div>` : ""}
        <div class="ai-copy">${action}${rep && !oldLayout && !writing ? `<button class="btn" id="aiPdf" type="button">⬇️ Download PDF</button>` : ""}</div>
        ${rep && !oldLayout ? aiReportHtml(subjectId, rep) : ""}
        <div class="row" style="margin-top:22px"><button class="btn ghost" id="backBtn" type="button">← Parent Report</button></div>
      </div>`, subjectId);
    $("#bk").onclick = renderReport;
    $("#backBtn").onclick = renderReport;
    if ($("#aiPdf")) $("#aiPdf").onclick = () => downloadAiReport(subjectId);
    if ($("#aiGo")) $("#aiGo").onclick = () => showConfirm(`Make a ${subj.label} report?`, "This uses a little of your Anthropic credit, around 10 to 15 US cents.", "Make report", () => makeAiReport(subjectId));
  }

  /* ===================== points helpers ===================== */
  const ratePhrase = (r) => (r === 1 ? "1 point" : r + " points");
  const ptsChip = (n, size) => `<span class="pts">${ART.coin(size || 15)} ${n}</span>`;

  /* ===================== admin (parents only, PIN protected) =====================
     The PIN is stored as a salted SHA-256 hash in the account's cloud settings,
     so the same PIN unlocks the admin page on every device. Creating or
     resetting it first asks for the account password. 5 wrong PINs in a row
     lock the pad for 60 seconds. Leaving the admin page locks it again. */
  let adminUnlocked = false;
  let adminTab = "redemptions";   // the admin tab showing; stays put while the page redraws
  const PIN_FAIL_KEY = "qa_pin_fail";
  function randomHex(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashPin(pin, salt) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
  }
  function pinFails() { try { return JSON.parse(localStorage.getItem(PIN_FAIL_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function setPinFails(v) { try { localStorage.setItem(PIN_FAIL_KEY, JSON.stringify(v)); } catch (e) { } }
  function pinLockMsg() {
    const f = pinFails(), u = f.until && f.until > Date.now() ? f.until : 0;
    return u ? "Too many wrong tries — wait " + Math.ceil((u - Date.now()) / 1000) + " seconds." : "";
  }
  // Checks a PIN against the saved one and counts wrong tries.
  // Returns "" when it's right, otherwise the message to show.
  async function checkPin(pin) {
    const saved = STORE.settings().pin;
    if (saved && (await hashPin(pin, saved.salt)) === saved.hash) { setPinFails({}); return ""; }
    const f = pinFails();
    f.count = (f.count || 0) + 1;
    if (f.count >= 5) { f.until = Date.now() + 60000; f.count = 0; }
    setPinFails(f);
    SOUND.play("wrong");
    return f.until && f.until > Date.now()
      ? "Too many wrong tries — wait 60 seconds."
      : "Wrong PIN — " + plural(5 - f.count, "try", "tries") + " left.";
  }
  function leaveAdmin() { adminUnlocked = false; renderMenu(); }

  function renderAdmin() {
    adminTab = "redemptions";     // coming in from the menu always starts here
    if (!window.crypto || !crypto.subtle) { toast("The admin page needs a secure (https) connection.", "bad"); return; }
    if (!STORE.settings().pin) return renderAdminVerify("setup");
    if (!adminUnlocked) return renderPinEntry();
    renderAdminPage();
  }

  // Number pad for the PIN — the digits show as dots.
  function pinPad(opts) {
    current = null;
    let pin = "";
    show(`
      <div class="topbar"><span class="back" id="bk">${esc(opts.backLabel || "← Menu")}</span><h2>🔒 Admin</h2></div>
      <div class="page narrow">
        <div class="card wide center pin-card">
          <div class="big-emoji">${opts.icon || "🔒"}</div>
          <h2 class="card-h">${esc(opts.title)}</h2>
          <p class="muted">${opts.sub || ""}</p>
          <div class="pin-dots" id="pinDots"></div>
          <div class="err" id="pinErr"></div>
          <div class="keyboard numeric pin-pad">
            ${["123", "456", "789"].map(r => `<div class="kb-row">${r.split("").map(c => `<button type="button" class="kb-key" data-key="${c}">${c}</button>`).join("")}</div>`).join("")}
            <div class="kb-row"><button type="button" class="kb-key kb-back" data-key="back" aria-label="Delete">⌫</button><button type="button" class="kb-key" data-key="0">0</button><button type="button" class="kb-key kb-ok" data-key="ok" aria-label="OK">✓</button></div>
          </div>
          ${opts.footer || ""}
        </div>
      </div>`);
    const paint = () => {
      $("#pinDots").innerHTML = Array.from({ length: Math.max(4, pin.length) }, (_, i) => `<i class="${i < pin.length ? "on" : ""}"></i>`).join("");
    };
    const press = (k) => {
      if (opts.locked && opts.locked()) return;
      if (k === "ok") {
        if (pin.length < 4) { $("#pinErr").textContent = "The PIN needs 4 to 8 digits."; return; }
        const entered = pin; pin = ""; paint();
        opts.onDone(entered);
        return;
      }
      if (k === "back") pin = pin.slice(0, -1);
      else if (pin.length < 8) pin += k;
      $("#pinErr").textContent = "";
      paint();
    };
    $$(".pin-pad .kb-key").forEach(b => { b.onclick = () => press(b.dataset.key); });
    keyHandler = (e) => {
      if (/^[0-9]$/.test(e.key)) { press(e.key); return true; }
      if (e.key === "Backspace") { press("back"); return true; }
      if (e.key === "Enter") { press("ok"); return true; }
    };
    $("#bk").onclick = opts.onBack || leaveAdmin;
    paint();
  }
  const pinLocked = () => { const m = pinLockMsg(); if (m) $("#pinErr").textContent = m; return !!m; };

  function renderPinEntry() {
    pinPad({
      title: "Enter the admin PIN",
      sub: "This page is for parents only.",
      locked: pinLocked,
      footer: `<button class="link-btn" id="forgotPin" type="button">Forgot the PIN?</button>`,
      onDone: async (pin) => {
        const err = await checkPin(pin);
        if (err) { $("#pinErr").textContent = err; return; }
        adminUnlocked = true;
        renderAdminPage();
      }
    });
    $("#forgotPin").onclick = () => renderAdminVerify("reset");
  }

  // Deleting a player asks for the admin PIN again, even with the admin page open.
  function renderDeletePlayer(pl) {
    pinPad({
      icon: "🗑️",
      title: "Delete " + pl.name + "?",
      sub: `Type the admin PIN to delete <b>${esc(pl.name)}</b>. All of ${esc(pl.name)}'s assessments, points, badges and reports will be deleted on every device. This can't be undone.`,
      backLabel: "← Admin",
      onBack: renderAdminPage,
      locked: pinLocked,
      footer: `<button class="btn ghost" id="cancelDel" type="button">Cancel — keep ${esc(pl.name)}</button>`,
      onDone: async (pin) => {
        const err = await checkPin(pin);
        if (err) { $("#pinErr").textContent = err; return; }
        STORE.deleteProfile(pl.id);
        if (!STORE.active() && STORE.profilesList().length) STORE.selectProfile(STORE.profilesList()[0].id);
        toast(pl.name + " was deleted.", "");
        renderAdminPage();
      }
    });
    $("#cancelDel").onclick = renderAdminPage;
  }

  // Before creating or resetting the PIN: confirm the account password.
  function renderAdminVerify(mode) {
    current = null;
    if (!AUTH.user) return renderPinCreate(mode);    // device-only mode has no account password
    const email = (STORE.state.account || {}).email || "";
    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>🔒 Admin</h2></div>
      <div class="page narrow">
        <div class="card wide pin-card">
          <div class="center">
            <div class="big-emoji">🛡️</div>
            <h2 class="card-h">${mode === "reset" ? "Reset the admin PIN" : "Set up the admin page"}</h2>
            <p class="muted" style="line-height:1.6">First, confirm it's you: type the password for <b>${esc(email)}</b>. Then choose a PIN — it unlocks the admin page on every device.</p>
          </div>
          <form id="pwForm" style="margin-top:14px">
            <div class="field"><label for="apw">Account password</label>
              <div class="pw-wrap"><input id="apw" type="password" autocomplete="current-password" required/><button type="button" class="pw-eye" id="pwEye" aria-label="Show password">👁</button></div>
            </div>
            <button class="btn primary full" id="pwBtn" type="submit">Continue →</button>
          </form>
          <div class="err" id="pwErr"></div>
        </div>
      </div>`);
    $("#bk").onclick = leaveAdmin;
    $("#pwEye").onclick = () => {
      const pw = $("#apw");
      pw.type = pw.type === "password" ? "text" : "password";
      $("#pwEye").textContent = pw.type === "password" ? "👁" : "🙈";
    };
    $("#pwForm").onsubmit = (e) => {
      e.preventDefault();
      const btn = $("#pwBtn");
      btn.disabled = true; btn.textContent = "Checking…";
      AUTH.verifyPassword($("#apw").value)
        .then(() => renderPinCreate(mode))
        .catch(ex => {
          const c = (ex && ex.code) || "";
          $("#pwErr").textContent = /wrong-password|invalid-credential|invalid-login/.test(c) ? "That password isn't right." : friendly(ex);
          btn.disabled = false; btn.textContent = "Continue →";
        });
    };
  }

  function renderPinCreate(mode) {
    pinPad({
      icon: "🔑",
      title: mode === "change" ? "Choose a new PIN" : "Choose an admin PIN",
      sub: "4 to 8 digits. Keep it secret from the kids!",
      onDone: (first) => pinPad({
        icon: "🔑",
        title: "Type the PIN again",
        sub: "Just to make sure.",
        onDone: async (second) => {
          if (second !== first) { toast("The two PINs didn't match — try again.", "bad"); renderPinCreate(mode); return; }
          const salt = randomHex(16);
          STORE.setPin({ salt: salt, hash: await hashPin(first, salt) });
          setPinFails({});
          adminUnlocked = true;
          toast("Admin PIN saved — it works on every device.", "good");
          renderAdminPage();
        }
      })
    });
  }

  function renderAdminPage() {
    if (!adminUnlocked) return renderAdmin();
    current = null;     // don't redraw under the parent's fingers while they edit
    const example = (r) => { const n = Math.round(10 * r); return "80% → 90% = <b>" + n + "</b> " + (n === 1 ? "point" : "points"); };
    const rows = DATA.SUBJECTS.map(s => `<div class="rate-row" data-subject="${esc(s.id)}">
        <span class="rate-name"><span class="subject-rep-art">${ART.subject(s.id)}</span>${esc(s.label)}</span>
        <span class="stepper">
          <button class="btn ghost sm" data-step="-0.5" data-s="${esc(s.id)}" type="button" aria-label="Less">−</button>
          <input class="rate-input" id="rate_${esc(s.id)}" type="number" inputmode="decimal" min="0" max="100" step="0.5" value="${STORE.rate(s.id)}" aria-label="${esc(s.label)} points per 1%"/>
          <button class="btn ghost sm" data-step="0.5" data-s="${esc(s.id)}" type="button" aria-label="More">+</button>
        </span>
        <span class="rate-example muted small" id="ex_${esc(s.id)}">${example(STORE.rate(s.id))}</span>
      </div>`).join("");
    const profiles = STORE.profilesList();
    const players = profiles.map(p => {
      const sum = STORE.pointsSummary(p);
      const log = STORE.pointsLog(p).filter(e => e.pts > 0);
      const last = log[log.length - 1];
      return `<div class="rep-card">
        <div class="t"><span>${esc(p.name)}</span>${ptsChip(sum.available, 17)}</div>
        <div class="sub">Available <b>${sum.available}</b> · on hold <b>${sum.onHold}</b> · used <b>${sum.used}</b>${sum.deducted ? ` · deducted <b>${sum.deducted}</b>` : ""} · earned <b>${sum.earned}</b></div>
        <div class="sub">${DATA.SUBJECTS.map(s => esc(s.label) + " " + STORE.points(p, s.id)).join(" · ")}${STORE.bonusPoints(p) ? " · ⭐ Bonus " + STORE.bonusPoints(p) : ""}</div>
        <div class="sub">${last ? "Last earned: +" + last.pts + " on " + esc(DATA.fullLabel(last.s, last.t, last.l)) + ", " + esc(REPORT.timeAgo(last.ts)) : "No assessment points yet."}</div>
        <div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn ghost sm" data-delplayer="${esc(p.id)}" type="button">🗑️ Delete player</button></div>
      </div>`;
    }).join("");
    const myrRate = STORE.myrPerPoint();
    const pphRate = STORE.consolePointsPerHour();
    const bonusList = [];
    profiles.forEach(p => STORE.bonuses(p).forEach(b => bonusList.push({ p, b })));
    bonusList.sort((x, y) => y.b.ts - x.b.ts);
    const deductList = [];
    profiles.forEach(p => STORE.deductions(p).forEach(d => deductList.push({ p, d })));
    deductList.sort((x, y) => y.d.ts - x.d.ts);
    const reqs = [];
    profiles.forEach(p => STORE.redemptions(p).forEach(r => reqs.push({ p, r })));
    const pending = reqs.filter(x => x.r.status === "pending").sort((x, y) => x.r.ts - y.r.ts);
    const decided = reqs.filter(x => x.r.status !== "pending").sort((x, y) => (y.r.decidedTs || 0) - (x.r.decidedTs || 0));
    const reqCard = (x, actions) => `<div class="req-card${x.r.status !== "pending" ? " " + x.r.status : ""}">
        <div class="req-main"><span><b>${esc(x.p.name)}</b> — ${SHOP_ICONS[x.r.item] || "🛍️"} <b>${esc(redemptionText(x.r))}</b></span>
          <small>${plural(x.r.points, "point")} · ${esc(redemptionRate(x.r))} · asked ${esc(REPORT.shortDate(x.r.ts))} (${esc(REPORT.timeAgo(x.r.ts))})${x.r.decidedTs ? " · " + (x.r.status === "approved" ? "approved" : "rejected") + " " + esc(REPORT.shortDate(x.r.decidedTs)) : ""}</small></div>
        ${actions ? `<div class="req-actions">
            <button class="btn ghost sm" data-reject="${esc(x.p.id)}|${esc(x.r.id)}" type="button">✕ Reject</button>
            <button class="btn primary sm" data-approve="${esc(x.p.id)}|${esc(x.r.id)}" type="button">✓ Approve</button>
          </div>` : `<span class="req-status">${x.r.status === "approved" ? "✓ Approved" : "↩ Rejected"}</span>`}
      </div>`;
    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>🔒 Admin</h2></div>
      <div class="page narrow">
        <div class="summary-box">Parents only. Changes are saved to the cloud and apply on every device signed in to this account.</div>
        <div class="admin-tabs" role="tablist" aria-label="Admin sections">
          <button class="admin-tab" id="adminTab_redemptions" data-tab="redemptions" role="tab" aria-controls="adminPanel_redemptions" type="button">Redemptions${pending.length ? `<span class="hold-count">${pending.length}</span>` : ""}</button>
          <button class="admin-tab" id="adminTab_adjustments" data-tab="adjustments" role="tab" aria-controls="adminPanel_adjustments" type="button">Adjustments</button>
          <button class="admin-tab" id="adminTab_setup" data-tab="setup" role="tab" aria-controls="adminPanel_setup" type="button">Setup</button>
        </div>
        <div class="admin-panel" id="adminPanel_redemptions" data-panel="redemptions" role="tabpanel" aria-labelledby="adminTab_redemptions">
        <h3 class="section-h">Redemption requests ${pending.length ? `<span class="hold-count">${pending.length} waiting</span>` : ""}</h3>
        <div class="req-list">${pending.length ? pending.map(x => reqCard(x, true)).join("") : `<div class="muted">No requests waiting.</div>`}</div>
        ${decided.length ? `<details class="past-reqs"><summary>Past requests (${decided.length})</summary><div class="req-list">${decided.slice(0, 30).map(x => reqCard(x, false)).join("")}</div></details>` : ""}
        </div>
        <div class="admin-panel" id="adminPanel_adjustments" data-panel="adjustments" role="tabpanel" aria-labelledby="adminTab_adjustments">
        <h3 class="section-h">⭐ Give bonus points</h3>
        <div class="card wide admin-card">
          ${profiles.length ? `
          <p class="muted small" style="line-height:1.6;margin-bottom:12px">Reward something done outside the app — like reading a book. The points go straight to the player's balance. A reason is required, and the player sees it in their points history.</p>
          <div class="field"><label for="bonusWho">Player</label>
            <select id="bonusWho">${profiles.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></div>
          <div class="field"><label for="bonusPts">Points</label>
            <input id="bonusPts" type="number" inputmode="numeric" min="1" max="10000" step="1" placeholder="e.g. 20" autocomplete="off"/></div>
          <div class="field"><label for="bonusWhy">Reason (required)</label>
            <input id="bonusWhy" type="text" maxlength="120" placeholder="e.g. Read a book" autocomplete="off"/></div>
          <div class="chips">${["Read a book", "Helped at home", "Finished homework", "Good behaviour"].map(r => `<button class="chip" data-why="${esc(r)}" type="button">${esc(r)}</button>`).join("")}</div>
          <div class="err" id="bonusErr"></div>
          <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" id="giveBonus" type="button" disabled>⭐ Give points</button></div>
          ${bonusList.length ? `<details class="past-reqs"${bonusList.length ? " open" : ""}><summary>Bonus points given (${bonusList.length})</summary><div class="req-list">${bonusList.slice(0, 30).map(x => `<div class="req-card approved">
              <div class="req-main"><span><b>${esc(x.p.name)}</b> — ⭐ <b>+${plural(x.b.points, "point")}</b></span>
                <small>For: ${esc(x.b.reason)} · ${esc(REPORT.shortDate(x.b.ts))} (${esc(REPORT.timeAgo(x.b.ts))})</small></div>
              <button class="btn ghost sm" data-unbonus="${esc(x.p.id)}|${esc(x.b.id)}" type="button">Remove</button>
            </div>`).join("")}</div></details>` : ""}`
          : `<div class="muted">Add a player first.</div>`}
        </div>
        <h3 class="section-h">🔻 Deduct points</h3>
        <div class="card wide admin-card">
          ${profiles.length ? `
          <p class="muted small" style="line-height:1.6;margin-bottom:12px">Take points off a player's balance. A reason is required, and the player sees it in their points history. You can deduct up to what the player has available; points on hold can't be deducted.</p>
          <div class="field"><label for="deductWho">Player</label>
            <select id="deductWho">${profiles.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></div>
          <div class="field"><label for="deductPts">Points</label>
            <input id="deductPts" type="number" inputmode="numeric" min="1" step="1" placeholder="e.g. 10" autocomplete="off"/>
            <div class="muted small" id="deductLeft" style="margin-top:6px"></div></div>
          <div class="field"><label for="deductWhy">Reason (required)</label>
            <input id="deductWhy" type="text" maxlength="120" placeholder="e.g. Homework not done" autocomplete="off"/></div>
          <div class="chips">${["Homework not done", "Bad behaviour", "Didn't listen", "Broke a house rule"].map(r => `<button class="chip" data-dwhy="${esc(r)}" type="button">${esc(r)}</button>`).join("")}</div>
          <div class="err" id="deductErr"></div>
          <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" id="takePoints" type="button" disabled>🔻 Deduct points</button></div>
          ${deductList.length ? `<details class="past-reqs" open><summary>Points deducted (${deductList.length})</summary><div class="req-list">${deductList.slice(0, 30).map(x => `<div class="req-card deducted">
              <div class="req-main"><span><b>${esc(x.p.name)}</b> — 🔻 <b>−${plural(x.d.points, "point")}</b></span>
                <small>Reason: ${esc(x.d.reason)} · ${esc(REPORT.shortDate(x.d.ts))} (${esc(REPORT.timeAgo(x.d.ts))})</small></div>
              <button class="btn ghost sm" data-undeduct="${esc(x.p.id)}|${esc(x.d.id)}" type="button">Undo</button>
            </div>`).join("")}</div></details>` : ""}`
          : `<div class="muted">Add a player first.</div>`}
        </div>
        </div>
        <div class="admin-panel" id="adminPanel_setup" data-panel="setup" role="tabpanel" aria-labelledby="adminTab_setup">
        <h3 class="section-h">Points for each 1%</h3>
        <div class="card wide admin-card">
          <p class="muted small" style="line-height:1.6;margin-bottom:12px">Points are paid only when a player <b>beats their own best score</b> on a level: (new best − old best) × the value below. Repeating a level without beating the best earns nothing, so one level can never pay more than 100 × the value.</p>
          <div class="rate-list">${rows}</div>
          <p class="muted small" style="margin-top:12px;line-height:1.6">New values count from the next assessment — points already earned don't change. Set a subject to 0 to switch its points off.<br/>Quest Arena games pay their own fixed points: +50 for the first win of each level, then +5 per level won. Winning every level of a game pays a further +${DATA.QUEST_BONUS}, once.</p>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="saveRates" type="button">💾 Save points values</button></div>
        </div>
        <h3 class="section-h">💵 Cash value of 1 point</h3>
        <div class="card wide admin-card">
          <p class="muted small" style="line-height:1.6;margin-bottom:12px">What one point is worth when a player redeems cash in the Shop. Set it to 0.00 to switch cash redemption off. Requests already waiting keep the value they were made at.</p>
          <div class="myr-wrap admin-myr"><span class="myr-prefix">MYR</span><input id="myrRate" type="number" inputmode="decimal" min="0" step="0.01" value="${myrRate.toFixed(2)}" aria-label="MYR per point"/><span class="myr-suffix">per point</span></div>
          <div class="muted small" id="myrEx" style="margin-top:8px"></div>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="saveMyr" type="button">💾 Save cash value</button></div>
        </div>
        <h3 class="section-h">🎮 Video game console — points per hour</h3>
        <div class="card wide admin-card">
          <p class="muted small" style="line-height:1.6;margin-bottom:12px">How many points one hour of video game console time costs in the Shop. Players ask for whole or half hours, and you approve each request on the Redemptions tab. Set it to 0 to switch console time off. Requests already waiting keep the value they were made at.</p>
          <div class="myr-wrap admin-myr"><input id="pphRate" type="number" inputmode="numeric" min="0" step="1" value="${pphRate}" aria-label="Points per hour"/><span class="myr-suffix">points per hour</span></div>
          <div class="muted small" id="pphEx" style="margin-top:8px"></div>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="savePph" type="button">💾 Save console points</button></div>
        </div>
        <h3 class="section-h">Players &amp; points</h3>
        <div class="rep-grid">${players || `<div class="muted">No players yet.</div>`}</div>
        <h3 class="section-h">Admin PIN</h3>
        <div class="row" style="justify-content:flex-start">
          <button class="btn" id="changePin" type="button">🔑 Change PIN</button>
          <button class="btn ghost" id="lockAdmin" type="button">🔒 Lock admin</button>
        </div>
        </div>
      </div>`);
    const showTab = (tab) => {
      adminTab = tab;
      $$("[data-tab]").forEach(b => { b.classList.toggle("on", b.dataset.tab === tab); b.setAttribute("aria-selected", b.dataset.tab === tab); });
      $$("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== tab; });
    };
    $$("[data-tab]").forEach(b => { b.onclick = () => showTab(b.dataset.tab); });
    showTab(adminTab);
    const read = (id) => { const v = Number($("#rate_" + id).value); return isFinite(v) && v >= 0 ? Math.min(100, Math.round(v * 100) / 100) : 0; };
    const refreshEx = (id) => { $("#ex_" + id).innerHTML = example(read(id)); };
    $$(".stepper [data-step]").forEach(b => {
      b.onclick = () => {
        const id = b.dataset.s;
        $("#rate_" + id).value = Math.max(0, Math.min(100, read(id) + Number(b.dataset.step)));
        refreshEx(id);
      };
    });
    $$(".rate-input").forEach(inp => { inp.oninput = () => refreshEx(inp.id.slice(5)); });
    $("#saveRates").onclick = () => {
      const r = {};
      DATA.SUBJECTS.forEach(s => { r[s.id] = read(s.id); });
      STORE.setRates(r);
      toast("Saved — the new points values apply on every device.", "good");
      renderAdminPage();
    };
    const myrIn = $("#myrRate");
    const readMyr = () => { const v = Number(myrIn.value); return isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0; };
    const myrEx = () => { const v = readMyr(); $("#myrEx").innerHTML = v ? `So <b>100 points = ${MYR(100 * v)}</b> and 1 point = ${MYR(v)}.` : "Cash redemption is <b>off</b>."; };
    myrIn.oninput = myrEx;
    myrEx();
    $("#saveMyr").onclick = () => {
      STORE.setMyrPerPoint(readMyr());
      toast(readMyr() ? "Saved — 1 point = " + MYR(readMyr()) + "." : "Saved — cash redemption is off.", "good");
      renderAdminPage();
    };
    const pphIn = $("#pphRate");
    const readPph = () => { const v = Number(pphIn.value); return isFinite(v) && v > 0 ? Math.min(10000, Math.round(v)) : 0; };
    const pphEx = () => {
      const v = readPph();
      $("#pphEx").innerHTML = v ? `So <b>1 hour = ${plural(v, "point")}</b>, ½ hour = ${plural(consolePoints(0.5, v), "point")} and 2 hours = ${plural(2 * v, "point")}.` : "Console time is <b>off</b>.";
    };
    pphIn.oninput = pphEx;
    pphEx();
    $("#savePph").onclick = () => {
      STORE.setConsolePointsPerHour(readPph());
      toast(readPph() ? "Saved — 1 hour of console time = " + plural(readPph(), "point") + "." : "Saved — console time is off.", "good");
      renderAdminPage();
    };
    // ⭐ Bonus points: whole number + a reason, then confirm.
    if ($("#giveBonus")) {
      const ptsIn = $("#bonusPts"), whyIn = $("#bonusWhy"), give = $("#giveBonus");
      const readBonus = () => {
        const raw = ptsIn.value.trim(), n = Number(raw), why = whyIn.value.replace(/\s+/g, " ").trim();
        let msg = "";
        if (raw && (!isFinite(n) || n < 1 || Math.round(n) !== n)) msg = "Points must be a whole number, 1 or more.";
        else if (n > 10000) msg = "That's a lot — up to 10,000 points at a time.";
        else if (raw && !why) msg = "Type a reason, e.g. “Read a book”.";
        $("#bonusErr").textContent = msg;
        const ok = !msg && raw && why;
        give.disabled = !ok;
        return ok ? { n: n, why: why } : null;
      };
      ptsIn.oninput = readBonus;
      whyIn.oninput = readBonus;
      $$("[data-why]").forEach(c => { c.onclick = () => { whyIn.value = c.dataset.why; readBonus(); }; });
      give.onclick = () => {
        const w = readBonus(); if (!w) return;
        const pl = STORE.state.profiles[$("#bonusWho").value]; if (!pl) return;
        showConfirm(`Give ${plural(w.n, "point")} to ${pl.name}?`, `Reason: “${w.why}”. The points go straight to ${pl.name}'s balance.`, "Give points", () => {
          if (!STORE.addBonus(pl.id, w.n, w.why)) { toast("Couldn't add those points — check the number and the reason.", "bad"); return; }
          toast(`+${plural(w.n, "point")} for ${pl.name} — ${w.why}`, "good");
          renderAdminPage();
        });
      };
    }
    $$("[data-unbonus]").forEach(btn => {
      btn.onclick = () => {
        const [pid, bid] = btn.dataset.unbonus.split("|");
        const pl = STORE.state.profiles[pid], b = pl && STORE.bonuses(pl).filter(x => x.id === bid)[0];
        if (!b) return;
        showConfirm(`Remove ${plural(b.points, "point")} from ${pl.name}?`, `“${b.reason}”, given ${REPORT.shortDate(b.ts)}. The points come off ${pl.name}'s balance.`, "Remove", () => {
          STORE.removeBonus(pid, bid);
          toast("Removed — " + plural(b.points, "point") + " taken back from " + pl.name + ".", "");
          renderAdminPage();
        });
      };
    });
    // 🔻 Deductions: whole number, no more than the player has available, + a reason, then confirm.
    if ($("#takePoints")) {
      const whoIn = $("#deductWho"), ptsIn = $("#deductPts"), whyIn = $("#deductWhy"), take = $("#takePoints");
      const readDeduct = () => {
        const pl = STORE.state.profiles[whoIn.value]; if (!pl) return null;
        const sum = STORE.pointsSummary(pl);
        const raw = ptsIn.value.trim(), n = Number(raw), why = whyIn.value.replace(/\s+/g, " ").trim();
        $("#deductLeft").innerHTML = `${esc(pl.name)} has <b>${plural(sum.available, "point")}</b> available.`;
        let msg = "";
        if (raw && (!isFinite(n) || n < 1 || Math.round(n) !== n)) msg = "Points must be a whole number, 1 or more.";
        else if (n > sum.available) msg = `${pl.name} only has ${plural(sum.available, "point")} available.` + (sum.onHold ? ` ${plural(sum.onHold, "point")} on hold can't be deducted unless you reject that request first.` : "");
        else if (raw && !why) msg = "Type a reason, e.g. “Homework not done”.";
        $("#deductErr").textContent = msg;
        const ok = !msg && raw && why;
        take.disabled = !ok;
        return ok ? { pl: pl, n: n, why: why } : null;
      };
      whoIn.onchange = readDeduct;
      ptsIn.oninput = readDeduct;
      whyIn.oninput = readDeduct;
      $$("[data-dwhy]").forEach(c => { c.onclick = () => { whyIn.value = c.dataset.dwhy; readDeduct(); }; });
      readDeduct();
      take.onclick = () => {
        const w = readDeduct(); if (!w) return;
        showConfirm(`Deduct ${plural(w.n, "point")} from ${w.pl.name}?`, `Reason: “${w.why}”. The points come off ${w.pl.name}'s balance straight away, and ${w.pl.name} will see the reason in the points history.`, "Deduct points", () => {
          if (!STORE.addDeduction(w.pl.id, w.n, w.why)) { toast("Couldn't deduct those points — check the number and the reason.", "bad"); return; }
          toast(`−${plural(w.n, "point")} from ${w.pl.name} — ${w.why}`, "");
          renderAdminPage();
        });
      };
    }
    $$("[data-undeduct]").forEach(btn => {
      btn.onclick = () => {
        const [pid, did] = btn.dataset.undeduct.split("|");
        const pl = STORE.state.profiles[pid], d = pl && STORE.deductions(pl).filter(x => x.id === did)[0];
        if (!d) return;
        showConfirm(`Give ${plural(d.points, "point")} back to ${pl.name}?`, `“${d.reason}”, deducted ${REPORT.shortDate(d.ts)}. The points go back on ${pl.name}'s balance.`, "Give back", () => {
          STORE.removeDeduction(pid, did);
          toast("Undone — " + plural(d.points, "point") + " back to " + pl.name + ".", "good");
          renderAdminPage();
        });
      };
    });
    const findReq =(key) => { const [pid, rid] = key.split("|"); const pl = STORE.state.profiles[pid]; return { pl, r: pl && STORE.redemptions(pl).filter(r => r.id === rid)[0], pid, rid }; };
    $$("[data-approve]").forEach(btn => {
      btn.onclick = () => {
        const x = findReq(btn.dataset.approve); if (!x.r) return;
        const remind = x.r.item === "console" ? `Remember to let ${x.pl.name} play for ${hoursText(x.r.hours || 0)}.` : `Remember to give ${x.pl.name} the cash.`;
        showConfirm(`Approve ${redemptionText(x.r)} for ${x.pl.name}?`, `${plural(x.r.points, "point")} will be used up. ${remind}`, "Approve", () => {
          STORE.decideRedemption(x.pid, x.rid, "approved");
          toast("Approved — " + redemptionText(x.r) + " for " + x.pl.name + ".", "good");
          renderAdminPage();
        });
      };
    });
    $$("[data-reject]").forEach(btn => {
      btn.onclick = () => {
        const x = findReq(btn.dataset.reject); if (!x.r) return;
        showConfirm(`Reject ${redemptionText(x.r)} for ${x.pl.name}?`, `The ${plural(x.r.points, "point")} go back to ${x.pl.name}'s balance.`, "Reject", () => {
          STORE.decideRedemption(x.pid, x.rid, "rejected");
          toast("Rejected — the points went back to " + x.pl.name + ".", "");
          renderAdminPage();
        });
      };
    });
    $$("[data-delplayer]").forEach(btn => {
      btn.onclick = () => {
        const pl = STORE.state.profiles[btn.dataset.delplayer];
        if (pl) renderDeletePlayer(pl);
      };
    });
    $("#changePin").onclick = () => renderPinCreate("change");
    $("#lockAdmin").onclick = leaveAdmin;
    $("#bk").onclick = leaveAdmin;
  }

  /* ===================== players ===================== */
  function renderProfileSelect(opts) {
    current = () => renderProfileSelect();
    const profiles = STORE.profilesList();
    const cards = profiles.map(p => {
      const hist = STORE.history(null, p);
      const avg = avgPct(hist);
      const stars = totalStars(hist);
      const isActive = STORE.state.activeProfileId === p.id;
      return `<div class="profile-card ${isActive ? "active" : ""}" data-pick="${esc(p.id)}" role="button" tabindex="0">
        <div class="profile-mini">${ART.student(p.gender)}</div>
        <div class="profile-name">${esc(p.name)}</div>
        <div class="profile-meta">⭐ ${stars} · ${ART.coin(13)} ${STORE.points(p)} · ${plural(hist.length, "assessment")}${avg != null ? ` · ${avg}%` : ""}</div>
        <div class="profile-actions">
          <button class="btn ghost sm" data-edit="${esc(p.id)}" type="button">Edit</button>
        </div>
      </div>`;
    }).join("");
    const email = (STORE.state.account || {}).email || "";
    show(`
      <div class="topbar">
        ${STORE.active() ? `<span class="back" id="bk">← Menu</span>` : `<span class="muted small" style="padding:4px 8px">${esc(email || "This device")}</span>`}
        <h2>👥 Who's learning today?</h2>
      </div>
      <div class="page narrow">
        <div class="lead">Pick a player or add a new one. Each player has their own progress, stars and reports — on every device.</div>
        <div class="profile-grid">
          ${cards}
          <button class="profile-card add" id="addNew" type="button">
            <span class="profile-avatar plus">+</span>
            <span class="profile-name">Add player</span>
            <span class="profile-meta">Create a new profile</span>
          </button>
        </div>
        ${!STORE.active() ? `<div class="center" style="margin-top:22px">${AUTH.user ? `<button class="link-btn" id="out" type="button">Sign out (${esc(email)})</button>` : `<button class="link-btn" id="out" type="button">Back to the login screen</button>`}</div>` : ""}
      </div>`);
    if ($("#bk")) $("#bk").onclick = renderMenu;
    if ($("#out")) $("#out").onclick = () => AUTH.signOut();

    $$("[data-pick]").forEach(card => {
      const pick = (ev) => {
        if (ev && ev.target && ev.target.closest("button")) return;
        STORE.selectProfile(card.dataset.pick);
        renderMenu();
      };
      card.onclick = pick;
      card.onkeydown = (e) => { if (e.key === "Enter") pick(e); };
    });
    $$("[data-edit]").forEach(b => {
      b.onclick = (ev) => {
        ev.stopPropagation();
        const id = b.dataset.edit;
        const cur = STORE.state.profiles[id]; if (!cur) return;
        editProfileModal("Edit player", cur.name, cur.gender, (name, gender) => {
          if (name == null) return;
          STORE.updateProfile(id, { name, gender });
          renderProfileSelect();
        });
      };
    });
    const addFlow = (prefill) => editProfileModal("Add player", prefill || "", "boy", (name, gender) => {
      if (!name) return;
      STORE.createProfile(name, gender);
      renderMenu();
    });
    $("#addNew").onclick = () => addFlow("");
    // First visit on a new account → open the "Add player" box straight away.
    if (opts && opts.autoAdd && !profiles.length) {
      const acct = STORE.state.account || {};
      addFlow(AUTH.pendingName || acct.displayName || "");
    }
  }

  function editProfileModal(title, initialName, initialGender, onOk) {
    let gender = initialGender === "girl" ? "girl" : "boy";
    document.body.insertAdjacentHTML("beforeend", `
      <div class="overlay" id="pm"><div class="modal" style="max-width:480px">
        <h2>${esc(title)}</h2>
        <div class="field" style="margin-top:14px;text-align:left">
          <label for="pmInput">Player name</label>
          <input id="pmInput" type="text" value="${esc(initialName || "")}" maxlength="24" placeholder="Type a name"/>
        </div>
        <div class="muted small" style="text-align:left;margin:6px 2px 8px">Choose a character:</div>
        <div class="char-picker">
          <button class="char-card ${gender === "boy" ? "active" : ""}" data-g="boy" type="button"><span class="char-art">${ART.student("boy")}</span><span class="char-label">Boy</span></button>
          <button class="char-card ${gender === "girl" ? "active" : ""}" data-g="girl" type="button"><span class="char-art">${ART.student("girl")}</span><span class="char-label">Girl</span></button>
        </div>
        <div class="err" id="pmErr"></div>
        <div class="row"><button class="btn ghost" id="pmNo" type="button">Cancel</button><button class="btn primary" id="pmYes" type="button">Save</button></div>
      </div></div>`);
    const inp = $("#pmInput");
    setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { } }, 30);
    document.querySelectorAll("#pm .char-card").forEach(c => {
      c.onclick = () => {
        gender = c.dataset.g;
        document.querySelectorAll("#pm .char-card").forEach(x => x.classList.toggle("active", x.dataset.g === gender));
      };
    });
    function done(val) {
      if (val === "") { $("#pmErr").textContent = "Please type a name."; inp.focus(); return; }
      $("#pm").remove();
      onOk(val, gender);
    }
    $("#pmNo").onclick = () => { $("#pm").remove(); onOk(null, gender); };
    $("#pmYes").onclick = () => done(inp.value.trim());
    inp.onkeydown = (e) => {
      if (e.key === "Enter") done(inp.value.trim());
      if (e.key === "Escape") { $("#pm").remove(); onOk(null, gender); }
    };
  }

  /* ===================== router ===================== */
  function route() {
    if (!AUTH.ready) return renderSplash();
    const needLogin = AUTH.configured ? !(AUTH.user && AUTH.session) : !AUTH.session;
    if (needLogin) { exam = null; game = null; adminUnlocked = false; return renderAuth(); }
    const profiles = STORE.profilesList();
    if (!profiles.length) return renderProfileSelect({ autoAdd: true });
    if (!STORE.active()) STORE.selectProfile(profiles[0].id);
    renderMenu();
  }

  window.UI = { route, renderMenu, toast, onSync, refreshIfIdle };
})();
