/* ui.js — every Quest Academy screen:
     login → players → menu → subject → topic → level
     level = Assessment · Learn · Progress report
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
  function sessionSizeFor(level, bank) {
    const allSpelling = bank.every(q => q.spelling);
    const base = (level && level.sessionSize) || (allSpelling ? 10 : DATA.DEFAULT_SESSION_SIZE);
    return Math.min(base, bank.length);
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
        <div class="title">Quest<br/>Academy<small>${esc(DATA.YEAR_LABEL.toUpperCase())} · ENGLISH · BAHASA · MATHS</small></div>
        <div class="subtitle">${up ? "Create your academy account" : "Sign in — your progress follows you to every phone and computer"}</div>
        <form id="authForm" autocomplete="on">
          ${up ? `<div class="field"><label for="dn">Student name</label><input id="dn" type="text" placeholder="e.g. Preston" maxlength="24" autocomplete="nickname" required/></div>` : ""}
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
    else if (!levels) meta = `<span class="subject-meta">${plural(s.topics.length, "topic")}</span><span class="soon-pill">Levels coming soon</span>`;
    else {
      const mastered = s.topics.reduce((a, t) => a + REPORT.topicSummary(s.id, t.id).mastered, 0);
      meta = `<span class="subject-meta">${plural(s.topics.length, "topic")} · ${plural(levels, "level")}${mastered ? ` · 🏆 ${mastered} mastered` : ""}${sh.length ? ` · avg ${avgPct(sh)}%` : ""}</span>`;
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
    const points = STORE.points();
    const email = (STORE.state.account || {}).email || "";
    show(`
      <div class="page menu-page">
        <header class="menu-head">
          <div class="menu-crest">${ART.crest()}</div>
          <div class="menu-title">Quest Academy<small>${esc(DATA.YEAR_LABEL)} · English · Bahasa · Maths</small></div>
        </header>
        <div class="player-chip">
          <div class="player-chip-avatar">${ART.student(p.gender)}</div>
          <div class="player-chip-text">
            <div class="player-chip-hello">${hist.length ? "Welcome back" : "Welcome"}, <b>${esc(p.name)}</b>!</div>
            <div class="muted">${stars || points ? `⭐ ${plural(stars, "star")} · ${ART.coin(14)} <b class="gold">${plural(points, "point")}</b>` : "Pick a subject to start your quest"}${hist.length ? ` · ${plural(hist.length, "assessment")}` : ""}</div>
          </div>
          <button class="btn ghost sm" id="switch" type="button">Switch</button>
        </div>
        <h2 class="section-h">Choose a subject</h2>
        <div class="subject-grid">${DATA.SUBJECTS.map(s => subjectCard(s, hist)).join("")}</div>
        <div class="menu-actions">
          <button class="btn" id="report" type="button">📊 Parent Report</button>
          <button class="btn" id="hist" type="button">📈 History &amp; Analysis</button>
          <button class="btn ghost" id="how" type="button">❓ How it works</button>
          <button class="btn ghost" id="snd" type="button">${SOUND.isMuted() ? "🔇 Sound: off" : "🔊 Sound: on"}</button>
        </div>
        <div class="menu-foot">
          ${syncBadge()}
          <div class="row">
            <button class="link-btn" id="adminBtn" type="button">🔒 Admin</button>
            ${AUTH.user ? `<button class="link-btn" id="out" type="button">Sign out (${esc(email)})</button>`
                        : `<button class="link-btn" id="out" type="button">Back to the login screen</button>`}
          </div>
        </div>
      </div>`);
    $$(".subject-card").forEach(c => { c.onclick = () => renderSubject(c.dataset.subject); });
    $("#adminBtn").onclick = renderAdmin;
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
        <p>📚 <b>Pick a subject</b> — English, Bahasa or Maths — then a <b>topic</b> (for example Maths → Fractions), then a <b>level</b>.</p>
        <p>Every level has three parts:</p>
        <p>📝 <b>Assessment</b> — a short set of questions picked at random from that level, so it's different every time. Tap an answer, type it, or listen and spell. Wrong answers show the correct one before moving on.</p>
        <p>📖 <b>Learn</b> — lesson cards that explain the idea with worked examples. Read them before the assessment, or come back after a tricky one.</p>
        <p>📊 <b>Progress report</b> — every score, how many attempts, the weak areas, the last practice date and the mastery status.</p>
        <p>🏆 <b>Mastery</b> — ${esc(REPORT.MASTERY_RULE)} Along the way a level shows <i>Needs practice</i>, <i>Developing</i> or <i>Almost mastered</i>.</p>
        <p>⭐ <b>Stars</b> — 50% = 1 star, 70% = 2 stars, 90% = 3 stars. Your best score on each level counts.</p>
        <p>${ART.coin(16)} <b>Points</b> — earned by <b>beating your own best score</b> on a level. Every 1% above your old best earns points (a parent sets how many for each subject). Repeating a level without beating your best earns nothing — so aim higher each time!</p>
        <p>📊 <b>Parent Report</b> — mastery for every topic and level across all three subjects, the levels that need help, and recent mistakes.</p>
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
       By Topic       → every topic → its levels
       By School Year → Year 1…6 → the levels tagged with that year (data.js `years`)
     `studyCtx` remembers the path so "back" from a level returns to the
     topic page or the year page the child came from. */
  let studyCtx = { subjectId: null, mode: "topic", year: null };
  const STUDY_KEY = "qa_study_";
  function lastStudy(subjectId) { try { return localStorage.getItem(STUDY_KEY + subjectId) || ""; } catch (e) { return ""; } }
  function rememberStudy(subjectId, v) { try { localStorage.setItem(STUDY_KEY + subjectId, v); } catch (e) { } }

  const ICON_BOOK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5.5C4.6 4 8.2 4 12 6c3.8-2 7.4-2 10-.5V19c-2.6-1.5-6.2-1.5-10 .5-3.8-2-7.4-2-10-.5z"/><path d="M12 6v13.5"/></svg>`;
  const ICON_CAP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v4.8c0 1.4 2.7 3.2 6 3.2s6-1.8 6-3.2v-4.8"/><path d="M22 9.5v5.5"/></svg>`;

  function subjectHero(subj, hist) {
    return `<div class="subject-hero">
        <div class="subject-hero-art">${ART.subject(subj.id)}</div>
        <div>
          <div class="subject-hero-name">${esc(subj.fullLabel || subj.label)}</div>
          <div class="muted">${esc(subj.tagline)}</div>
          ${hist.length ? `<div class="subject-hero-stats">⭐ ${totalStars(hist)} · ${ART.coin(13)} ${plural(STORE.points(null, subj.id), "point")} · ${plural(hist.length, "assessment")} · avg ${avgPct(hist)}%</div>` : ""}
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
              <span class="study-title">By Topic</span>
              <span class="study-desc">Choose a specific topic and progress from basic to advanced.</span>
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
          </div>
        </div>
        <button class="btn full" id="histBtn" type="button" style="margin-top:18px">📈 ${esc(subj.label)} history &amp; analysis${hist.length ? ` <span class="muted">· ${plural(hist.length, "assessment")}</span>` : ""}</button>
      </div>`, subjectId);
    $("#bk").onclick = renderMenu;
    $("#byTopic").onclick = () => { rememberStudy(subjectId, "topic"); renderTopicList(subjectId); };
    $("#byYear").onclick = () => { rememberStudy(subjectId, "year"); renderYearList(subjectId); };
    $("#histBtn").onclick = () => renderHistory(subjectId, () => renderStudyMode(subjectId));
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
      if (!sum.total) foot = `<span class="soon-pill sm">Levels coming soon</span>`;
      else foot = `<span class="topic-hint">${plural(sum.total, "level")}${sum.mastered ? ` · 🏆 ${sum.mastered}/${sum.total} mastered` : ""}</span>${sum.attempts ? `<span class="topic-best">avg ${sum.avg}%</span>` : ""}`;
      return `<button class="topic-card${sum.total ? "" : " pending"}" data-topic="${esc(t.id)}" type="button">
        <span class="topic-top"><span class="topic-icon">${esc(t.icon || "📘")}</span><span class="topic-name">${esc(t.label)}</span></span>
        ${t.desc ? `<span class="topic-desc">${esc(t.desc)}</span>` : ""}
        <span class="topic-foot">${foot}</span>
      </button>`;
    }).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Study mode</span><h2>${esc(subj.label)} · By Topic</h2></div>
      <div class="page narrow">
        ${subj.topics.length
          ? `<h3 class="section-h" style="margin-top:4px">Topics</h3><div class="topic-grid">${cards}</div>`
          : soonCard("Topics are on the way", `The ${esc(subj.label)} topics will appear here as soon as the worksheets are added. Each topic will have its own levels, and every level gets an <b>Assessment</b>, a <b>Learn</b> lesson and a <b>Progress report</b>.`)}
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
        <div class="level-list">${g.levels.map(l => levelCard(subjectId, g.topic.id, l.id)).join("")}</div>
      </section>`).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← School years</span><h2>${esc(subj.label)} · Year ${year}</h2></div>
      <div class="page narrow">
        <div class="subject-hero">
          <div class="topic-hero-icon year-badge">${year}</div>
          <div>
            <div class="subject-hero-name">Year ${year} ${esc(subj.label)}</div>
            <div class="muted">${groups.length ? plural(groups.length, "topic") + " · " + plural(all.length, "level") : "Levels for this year haven't been added yet."}</div>
            ${all.length ? `<div class="subject-hero-stats">🏆 ${mastered}/${all.length} levels mastered</div>` : ""}
          </div>
        </div>
        ${groups.length ? sections : soonCard("Year " + year + " is on the way",
            `Levels for Year ${year} ${esc(subj.label)} will appear here once they're added. Meanwhile, try <b>By Topic</b> to see everything that's ready.`)}
      </div>`, subjectId);
    $("#bk").onclick = () => renderYearList(subjectId);
    $$(".level-card").forEach(c => { c.onclick = () => renderLevel(subjectId, c.dataset.topic, c.dataset.level); });
  }

  /* ===================== topic → levels ===================== */
  function levelCard(subjectId, topicId, levelId) {
    const ls = REPORT.levelStats(subjectId, topicId, levelId);
    const l = DATA.level(subjectId, topicId, levelId);
    const bank = DATA.bank(subjectId, topicId, levelId);
    const lesson = DATA.lesson(subjectId, topicId, levelId);
    const parts = [];
    parts.push(bank ? "📝 " + plural(sessionSizeFor(l, bank), "question") : "📝 questions coming soon");
    parts.push(lesson ? "📖 " + lesson.length + "-card lesson" : "📖 lesson coming soon");
    return `<button class="level-card" data-topic="${esc(topicId)}" data-level="${esc(levelId)}" type="button">
        <span class="level-head"><span class="level-name">${esc(l.label)}</span>${masteryBadge(ls.mastery)}</span>
        ${l.desc ? `<span class="topic-desc">${esc(l.desc)}</span>` : ""}
        <span class="level-foot">
          <span class="muted small">${parts.join(" · ")}</span>
          ${ls.attempts ? `<span class="topic-best">${ART.stars(starsFor(ls.best), 14)} best ${ls.best}% · ${esc(REPORT.timeAgo(ls.lastTs))}</span>` : ""}
        </span>
      </button>`;
  }

  function renderTopic(subjectId, topicId) {
    const subj = DATA.subject(subjectId), t = DATA.topic(subjectId, topicId);
    if (!subj || !t) return renderTopicList(subjectId);
    current = () => renderTopic(subjectId, topicId);
    studyCtx = { subjectId, mode: "topic", year: null };
    const sum = REPORT.topicSummary(subjectId, topicId);
    show(`
      <div class="topbar"><span class="back" id="bk">← Topics</span><h2>${esc(t.label)}</h2></div>
      <div class="page narrow">
        <div class="subject-hero">
          <div class="topic-hero-icon">${esc(t.icon || "📘")}</div>
          <div>
            <div class="subject-hero-name">${esc(t.label)}</div>
            <div class="muted">${esc(t.desc || "")}</div>
            ${sum.total ? `<div class="subject-hero-stats">🏆 ${sum.mastered}/${sum.total} levels mastered${sum.attempts ? ` · ${plural(sum.attempts, "assessment")} · last practised ${esc(REPORT.timeAgo(sum.lastTs))}` : ""}</div>` : ""}
          </div>
        </div>
        ${sum.total
          ? `<h3 class="section-h">Levels</h3><div class="level-list">${sum.levels.map(ls => levelCard(subjectId, topicId, ls.levelId)).join("")}</div>`
          : soonCard("Levels are on the way",
              `The <b>${esc(t.label)}</b> levels will appear here once they're added. Every level will have:` +
              `<span class="soon-parts"><span>📝 <b>Assessment</b></span><span>📖 <b>Learn</b></span><span>📊 <b>Progress report</b></span></span>`)}
      </div>`, subjectId);
    $("#bk").onclick = () => renderTopicList(subjectId);
    $$(".level-card").forEach(c => { c.onclick = () => renderLevel(subjectId, topicId, c.dataset.level); });
  }

  // Where "back" from a level goes: the year page if the child came that way.
  function levelBack(subjectId, topicId, levelId) {
    const viaYear = studyCtx.mode === "year" && studyCtx.subjectId === subjectId &&
      DATA.levelYears(DATA.level(subjectId, topicId, levelId)).indexOf(studyCtx.year) > -1;
    return viaYear
      ? { label: "Year " + studyCtx.year, go: () => renderYear(subjectId, studyCtx.year) }
      : { label: DATA.topicLabel(subjectId, topicId), go: () => renderTopic(subjectId, topicId) };
  }

  /* ===================== level hub: Assessment · Learn · Progress ===================== */
  function renderLevel(subjectId, topicId, levelId) {
    const t = DATA.topic(subjectId, topicId), l = DATA.level(subjectId, topicId, levelId);
    if (!t || !l) return renderTopic(subjectId, topicId);
    current = () => renderLevel(subjectId, topicId, levelId);
    const bank = DATA.bank(subjectId, topicId, levelId);
    const lesson = DATA.lesson(subjectId, topicId, levelId);
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
    const bestEver = STORE.bestScore(subjectId, topicId, levelId);
    const rate = STORE.rate(subjectId);
    const left = Math.round((100 - bestEver) * rate);
    const pointsLine = !bank || rate <= 0 ? ""
      : bestEver >= 100 ? `<div class="sec-stat pts-line">${ART.coin(16)} All the points on this level are earned — 100%!</div>`
      : bestEver > 0 ? `<div class="sec-stat pts-line">${ART.coin(16)} Beat your best (${bestEver}%) to earn up to <b>${left}</b> more points</div>`
      : `<div class="sec-stat pts-line">${ART.coin(16)} Earn up to <b>${left}</b> points — ${ratePhrase(rate)} for every 1%</div>`;

    show(`
      <div class="topbar"><span class="back" id="bk">← ${esc(back.label)}</span><h2>${esc(l.label)}</h2></div>
      <div class="page narrow">
        <div class="level-hero">
          <div class="level-hero-top">
            <span class="topic-hero-icon sm">${esc(t.icon || "📘")}</span>
            <div style="min-width:0">
              <div class="level-hero-name">${esc(t.label)} · ${esc(l.label)}</div>
              ${l.desc ? `<div class="muted">${esc(l.desc)}</div>` : ""}
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
            <div class="sec-icon">📖</div>
            <div class="sec-body">
              <div class="sec-title">Learn</div>
              <div class="sec-text">${lesson ? `A ${lesson.length}-card lesson with worked examples. Read it before the assessment, or come back after a tricky one.` : "The lesson for this level hasn't been added yet."}</div>
            </div>
            <button class="btn" id="goLearn" type="button"${lesson ? "" : " disabled"}>${lesson ? "Open lesson →" : "Coming soon"}</button>
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
    $("#goLearn").onclick = () => renderLearn(subjectId, topicId, levelId, 0);
    $("#goReport").onclick = () => renderLevelReport(subjectId, topicId, levelId, self);
  }

  /* ===================== Learn — lesson cards ===================== */
  function renderLearn(subjectId, topicId, levelId, idx) {
    const cards = DATA.lesson(subjectId, topicId, levelId);
    if (!cards) return renderLevel(subjectId, topicId, levelId);
    idx = Math.max(0, Math.min(idx || 0, cards.length - 1));
    current = () => renderLearn(subjectId, topicId, levelId, idx);
    const c = cards[idx] || {};
    const last = idx === cards.length - 1;
    const hasBank = !!DATA.bank(subjectId, topicId, levelId);
    show(`
      <div class="topbar"><span class="back" id="bk">← ${esc(DATA.levelLabel(subjectId, topicId, levelId))}</span><h2>📖 Learn · ${esc(DATA.fullLabel(subjectId, topicId, levelId))}</h2></div>
      <div class="qwrap">
        <div class="progress-label"><span>Card ${idx + 1} of ${cards.length}</span><span>${esc(DATA.topicLabel(subjectId, topicId))}</span></div>
        <div class="dots">${cards.map((_, i) => `<i class="${i === idx ? "on" : i < idx ? "done" : ""}"></i>`).join("")}</div>
        <div class="lesson-card">
          <h2 class="lesson-title">${esc(c.title || "")}</h2>
          ${c.visual ? `<div class="q-visual">${c.visual}</div>` : ""}
          ${c.text ? `<div class="lesson-text">${fmt(c.text)}</div>` : ""}
          ${c.example ? `<div class="lesson-example"><span class="label">Example</span><pre>${esc(c.example)}</pre></div>` : ""}
          ${c.tip ? `<div class="lesson-tip">💡 ${fmt(c.tip)}</div>` : ""}
        </div>
        <div class="lesson-nav">
          <button class="btn ghost" id="prevBtn" type="button"${idx === 0 ? " disabled" : ""}>← Back</button>
          ${last
            ? (hasBank ? `<button class="btn primary" id="doneBtn" type="button">Start the assessment →</button>` : `<button class="btn primary" id="doneBtn" type="button">Finish ✓</button>`)
            : `<button class="btn primary" id="nextBtn" type="button">Next →</button>`}
        </div>
      </div>`, subjectId);
    const go = (i) => renderLearn(subjectId, topicId, levelId, i);
    $("#bk").onclick = () => renderLevel(subjectId, topicId, levelId);
    $("#prevBtn").onclick = () => go(idx - 1);
    if ($("#nextBtn")) $("#nextBtn").onclick = () => go(idx + 1);
    if ($("#doneBtn")) $("#doneBtn").onclick = () => hasBank ? startSession(subjectId, topicId, levelId) : renderLevel(subjectId, topicId, levelId);
    keyHandler = (e) => {
      if (e.key === "ArrowRight" && !last) { go(idx + 1); return true; }
      if (e.key === "ArrowLeft" && idx > 0) { go(idx - 1); return true; }
    };
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
        ${lvl && DATA.lesson(subjectId, topicId, levelId) ? `<button class="btn" id="learnBtn" type="button">📖 Learn</button>` : ""}
        ${lvl && DATA.bank(subjectId, topicId, levelId) ? `<button class="btn primary" id="assessBtn" type="button">📝 Take the assessment</button>` : ""}
      </div>`;
    const wire = () => {
      $("#bk").onclick = onBack;
      $("#backBtn").onclick = onBack;
      if ($("#learnBtn")) $("#learnBtn").onclick = () => renderLearn(subjectId, topicId, levelId, 0);
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
      ? `<div class="summary-box" style="margin-bottom:10px">Weak areas: <b class="bad">${st.weakAreas.map(a => esc(a.label) + " (" + a.pct + "%)").join(", ")}</b>. Practise these first — the Learn lesson is a good place to start.</div>`
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
    if (!Array.isArray(q.options)) return Object.assign({}, q);
    const order = shuffle(q.options.map((_, i) => i));
    return Object.assign({}, q, { options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) });
  }
  // n questions, spread across the `cat` groups as evenly as possible.
  function sampleBalanced(bank, n) {
    const byCat = {};
    bank.forEach(q => { const c = q.cat || "?"; (byCat[c] = byCat[c] || []).push(q); });
    Object.keys(byCat).forEach(c => { byCat[c] = shuffle(byCat[c]); });
    const cats = shuffle(Object.keys(byCat));
    const picked = [];
    let progressed = true;
    while (picked.length < n && progressed) {
      progressed = false;
      for (const c of cats) {
        if (picked.length >= n) break;
        if (byCat[c].length) { picked.push(byCat[c].shift()); progressed = true; }
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
    exam = { subjectId, topicId, levelId, questions, idx: 0, answers: [], byCat: {} };
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
    return list.length > 0 && list.every(a => /\d/.test(a) && /^[\d.,\/\s-]+$/.test(a.trim()));
  }
  function keyboardHtml(accepts, numeric) {
    const has = (ch) => accepts.some(a => a.indexOf(ch) > -1);
    const key = (k, label, cls) => `<button type="button" class="kb-key${cls ? " " + cls : ""}" data-key="${esc(k)}">${label || esc(k)}</button>`;
    const back = key("back", "⌫", "kb-back");
    if (numeric) {
      const extras = [".", "/", "-"].filter(has).map(c => key(c)).join("");
      return ["123", "456", "789"].map(r => `<div class="kb-row">${r.split("").map(c => key(c)).join("")}</div>`).join("")
        + `<div class="kb-row">${extras}${key("0")}${back}</div>`;
    }
    const rows = LETTER_ROWS.map((row, i) => `<div class="kb-row">${row.split("").map(c => key(c)).join("")}${i === 2 ? back : ""}</div>`);
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
    const subj = DATA.subject(st.subjectId);
    const total = st.questions.length, num = st.idx + 1;
    const correctSoFar = st.answers.filter(a => a.correct).length;
    const kind = q.spelling ? "spell" : q.typed ? "typed" : "mcq";
    const accepts = kind === "mcq" ? [] : acceptedAnswers(q);
    const numeric = kind === "typed" && isNumericAnswers(accepts);
    const tag = q.cat ? DATA.catLabel(st.subjectId, st.topicId, st.levelId, q.cat) : "";
    const passage = q.passage ? `<div class="passage">${fmt(q.passage)}</div>` : "";
    const visual = q.visual ? `<div class="q-visual">${q.visual}</div>` : "";
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
    } else if (kind === "typed") {
      const parts = qText.split("___");
      body = `${passage}${visual}
        ${inlineBlank
          ? `<div class="qtext">${fmt(parts[0])}<span class="typed-blank" id="ansBox"></span>${fmt(parts.slice(1).join("___"))}</div>`
          : `<div class="qtext">${fmt(qText)}</div><div class="answer-box" id="ansBox"></div>`}
        <p class="spell-instr">${esc(q.instr || (numeric ? "Type your answer with the number pad." : inlineBlank ? "Type the missing word." : "Type your answer."))}</p>
        <div class="keyboard${numeric ? " numeric" : ""}" id="kb">${keyboardHtml(accepts, numeric)}</div>
        ${actions}`;
    } else {
      body = `${passage}${visual}
        <div class="qtext">${fmt(qText).replace(/___/g, '<span class="blank">?</span>')}</div>
        <div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}" type="button"><span class="letter">${"ABCDEF"[i] || i + 1}</span><span class="opt-text">${esc(o)}</span></button>`).join("")}</div>`;
    }

    show(`
      <div class="topbar"><span class="back" id="bk">✕ Quit</span><h2>📝 ${esc(DATA.fullLabel(st.subjectId, st.topicId, st.levelId))}</h2></div>
      <div class="qwrap">
        <div class="progress-label"><span>Question ${num} of ${total}</span><span>✓ ${correctSoFar} correct</span></div>
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
      const stem = kind === "spell" ? "Spell the word: " + q.word : (qText || "Question");
      st.answers.push({ q, correct, stem, chosenText, answerText });
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
        finish(ok, q.options[i], q.options[q.answer], `❌ The correct answer is <b>${esc(q.options[q.answer])}</b>`);
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

    // Typed answer or listen-and-spell — letters go into the answer box.
    const box = $("#ansBox"), kb = $("#kb"), clearBtn = $("#clearBtn"), submitBtn = $("#submitBtn");
    const maxLen = Math.max(12, Math.max.apply(null, accepts.map(a => a.length)) + 6);
    const before = inlineBlank ? qText.split("___")[0].trim() : "";
    const capFirst = inlineBlank && (!before || /[.!?:"“]$/.test(before));   // the blank starts a sentence
    let typed = "";
    function paint() {
      let shown = typed;
      if (kind === "typed" && (capFirst || typed === "i")) shown = typed.charAt(0).toUpperCase() + typed.slice(1);
      box.innerHTML = shown ? esc(shown) : `<span class="placeholder">${kind === "spell" ? "Tap letters…" : "?"}</span>`;
      box.classList.toggle("empty", !typed);
      clearBtn.disabled = busy || !typed;
      submitBtn.disabled = busy || !typed.trim();
    }
    function press(k) {
      if (busy) return;
      if (k === "back") typed = typed.slice(0, -1);
      else if (typed.length < maxLen) typed += k;
      paint();
    }
    function submit() {
      if (busy || !typed.trim()) return;
      const ok = sameAnswer(typed, accepts, numeric);
      kb.querySelectorAll(".kb-key").forEach(b => { b.disabled = true; });
      clearBtn.disabled = true; submitBtn.disabled = true;
      box.classList.add(ok ? "ok" : "bad");
      const right = accepts[0];
      let corr;
      if (kind === "spell") corr = `❌ The correct spelling is <b>${esc(right)}</b>`;
      else if (inlineBlank) corr = `❌ The correct answer is <b>${esc(right)}</b><div class="fixed">✔ ${fmt(qText).replace("___", () => "<u>" + esc(right) + "</u>")}</div>`;
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
      const k = String(e.key || "").length === 1 ? e.key.toLowerCase().replace("’", "'") : "";
      if (k && (numeric ? /[0-9.\/-]/.test(k) : /[a-z' -]/.test(k))) { press(k); return true; }
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

    const mistakes = st.answers.filter(a => !a.correct).map(a => ({ q: a.stem, chosen: a.chosenText, answer: a.answerText, cat: a.q.cat || "?" }));
    const saved = STORE.recordSession({
      subjectId: st.subjectId, topicId: st.topicId, levelId: st.levelId,
      ts: Date.now(), total, correct, byCat: st.byCat, mistakes,
      answers: st.answers.map(a => ({ q: a.stem, c: a.chosenText, a: a.answerText, ok: a.correct ? 1 : 0, cat: a.q.cat || "?" }))
    });
    const after = REPORT.levelStats(st.subjectId, st.topicId, st.levelId);
    const nStars = starsFor(pct);
    const newBest = !!(saved && saved.newBest && saved.prevBest > 0);
    const earned = (saved && saved.points) || 0;
    let pointsBox;
    if (earned > 0) {
      pointsBox = `<div class="points-won">${ART.coin(30)}<div><b>+${plural(earned, "point")}!</b><span>${saved.prevBest ? "New best: " + pct + "% (was " + saved.prevBest + "%)" : "Your first score on this level"}</span></div></div>`;
    } else if (saved && saved.newBest) {
      pointsBox = `<div class="points-none">New best! Points are switched off for ${esc(DATA.subject(st.subjectId).label)} right now.</div>`;
    } else {
      pointsBox = `<div class="points-none">${ART.coin(18)} No new points this time — your best is still <b>${saved ? saved.prevBest : 0}%</b>. Beat it to earn more!</div>`;
    }
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
          <div class="score">${pct}%</div>
          <div class="results-stars">${ART.stars(nStars, 34)}</div>
          <div class="muted" style="font-weight:700">${correct} / ${total} correct${newBest ? ` · <span class="new-best">🎉 New best!</span>` : ""}</div>
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
          <span>Avg <b>${l.avg}%</b></span>
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

    const clearLabel = subjectId ? `🗑️ Clear ${DATA.subject(subjectId).label} history` : "🗑️ Clear all history";
    show(`${top}
      <div class="page narrow">
        <div class="chips">${chips}</div>
        <div class="summary-box" style="margin-top:14px">${summary}</div>
        <h3 class="section-h">By level — weakest first</h3>
        <div class="hist-list">${cards}</div>
        <h3 class="section-h">Recent assessments</h3>
        <div class="session-list">${recent}</div>
        <div class="row" style="margin-top:20px">
          <button class="btn ghost sm" id="clearBtn" type="button">${clearLabel}</button>
          <button class="btn primary" id="backBtn" type="button">← Back</button>
        </div>
      </div>`, subjectId);
    wireHistoryCommon(onBack);
    $("#clearBtn").onclick = () => {
      const p = STORE.active();
      showConfirm(subjectId ? `Clear ${DATA.subject(subjectId).label} history?` : "Clear all history?",
        `Every recorded assessment${subjectId ? " for this subject" : ""} for ${p ? p.name : "this player"} will be deleted on all devices. This can't be undone.`,
        "Clear", () => { STORE.clearHistory(subjectId || "all"); self(); });
    };
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
        <div class="sub">${!s.subject.topics.length ? "Topics coming soon." : !s.levelsTotal ? plural(s.subject.topics.length, "topic") + " · levels coming soon." : `🏆 ${s.levelsMastered} / ${plural(s.levelsTotal, "level")} mastered`}</div>
      </div>`).join("");

    // Mastery overview — every topic, every level, coloured by mastery.
    const overview = r.subjects.filter(s => s.subject.topics.length).map(s => `
      <div class="ov-subject" data-subject="${esc(s.subject.id)}">
        <div class="ov-subject-name">${esc(s.subject.label)}</div>
        ${s.topics.map(t => `<div class="ov-row">
            <span class="ov-topic">${esc(t.topic.icon || "")} ${esc(t.topic.label)}</span>
            <span class="ov-levels">${t.levels.length
              ? t.levels.map(l => `<button class="ov-chip ${l.mastery.cls}" data-subj="${esc(s.subject.id)}" data-topic="${esc(t.topic.id)}" data-level="${esc(l.levelId)}" title="${esc(l.label + " — " + l.mastery.label)}" type="button">${esc(DATA.levelLabel(s.subject.id, t.topic.id, l.levelId).replace(/^Level\s*/i, "L"))}${l.attempts ? " · " + l.latest + "%" : ""}</button>`).join("")
              : `<span class="muted small">levels coming soon</span>`}</span>
          </div>`).join("")}
      </div>`).join("");
    const legend = Object.keys(REPORT.MASTERY).map(k => `<span class="ov-chip ${REPORT.MASTERY[k].cls} legend">${REPORT.MASTERY[k].icon} ${esc(REPORT.MASTERY[k].label)}</span>`).join("");

    const weakCards = r.weakest.map(l => `<button class="rep-card clickable" data-subj="${esc(l.subjectId)}" data-topic="${esc(l.topicId)}" data-level="${esc(l.levelId)}" type="button">
        <div class="t"><span>${esc(l.label)} ${subjectPill(l.subjectId)}</span>${masteryBadge(l.mastery)}</div>
        <div class="sub">${plural(l.attempts, "attempt")} · avg ${l.avg}% · latest ${l.latest}% · last ${esc(REPORT.timeAgo(l.lastTs))}</div>
        ${l.weakAreas[0] ? `<div class="sub">🎯 Weak area: <b class="bad">${esc(l.weakAreas[0].label)}</b> (${l.weakAreas[0].pct}%)</div>` : ""}
      </button>`).join("");
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
        ${overview ? `<h3 class="section-h">Mastery by topic &amp; level</h3>
          <div class="ov-legend">${legend}</div>
          <div class="ov-wrap">${overview}</div>
          <div class="muted small" style="margin-top:6px">${esc(REPORT.MASTERY_RULE)} Tap a level for its progress report.</div>` : ""}
        ${weakCards ? `<h3 class="section-h">Levels that need help</h3><div class="rep-grid">${weakCards}</div>` : ""}
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
  function leaveAdmin() { adminUnlocked = false; renderMenu(); }

  function renderAdmin() {
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
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>🔒 Admin</h2></div>
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
    $("#bk").onclick = leaveAdmin;
    paint();
  }

  function renderPinEntry() {
    const lockedUntil = () => { const f = pinFails(); return f.until && f.until > Date.now() ? f.until : 0; };
    pinPad({
      title: "Enter the admin PIN",
      sub: "This page is for parents only.",
      locked: () => {
        const u = lockedUntil();
        if (u) $("#pinErr").textContent = "Too many wrong tries — wait " + Math.ceil((u - Date.now()) / 1000) + " seconds.";
        return !!u;
      },
      footer: `<button class="link-btn" id="forgotPin" type="button">Forgot the PIN?</button>`,
      onDone: async (pin) => {
        const saved = STORE.settings().pin;
        if (saved && (await hashPin(pin, saved.salt)) === saved.hash) {
          setPinFails({});
          adminUnlocked = true;
          renderAdminPage();
          return;
        }
        const f = pinFails();
        f.count = (f.count || 0) + 1;
        if (f.count >= 5) { f.until = Date.now() + 60000; f.count = 0; }
        setPinFails(f);
        SOUND.play("wrong");
        $("#pinErr").textContent = f.until && f.until > Date.now()
          ? "Too many wrong tries — wait 60 seconds."
          : "Wrong PIN — " + plural(5 - f.count, "try", "tries") + " left.";
      }
    });
    $("#forgotPin").onclick = () => renderAdminVerify("reset");
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
    const players = STORE.profilesList().map(p => {
      const log = STORE.pointsLog(p).filter(e => e.pts > 0);
      const last = log[log.length - 1];
      return `<div class="rep-card">
        <div class="t"><span>${esc(p.name)}</span>${ptsChip(STORE.points(p), 17)}</div>
        <div class="sub">${DATA.SUBJECTS.map(s => esc(s.label) + " " + STORE.points(p, s.id)).join(" · ")}</div>
        <div class="sub">${last ? "Last earned: +" + last.pts + " on " + esc(DATA.fullLabel(last.s, last.t, last.l)) + ", " + esc(REPORT.timeAgo(last.ts)) : "No points yet."}</div>
      </div>`;
    }).join("");
    show(`
      <div class="topbar"><span class="back" id="bk">← Menu</span><h2>🔒 Admin</h2></div>
      <div class="page narrow">
        <div class="summary-box">Parents only. Changes are saved to the cloud and apply on every device signed in to this account.</div>
        <h3 class="section-h">Points for each 1%</h3>
        <div class="card wide admin-card">
          <p class="muted small" style="line-height:1.6;margin-bottom:12px">Points are paid only when a player <b>beats their own best score</b> on a level: (new best − old best) × the value below. Repeating a level without beating the best earns nothing, so one level can never pay more than 100 × the value.</p>
          <div class="rate-list">${rows}</div>
          <p class="muted small" style="margin-top:12px;line-height:1.6">New values count from the next assessment — points already earned don't change. Set a subject to 0 to switch its points off.</p>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="saveRates" type="button">💾 Save points values</button></div>
        </div>
        <h3 class="section-h">Points so far</h3>
        <div class="rep-grid">${players || `<div class="muted">No players yet.</div>`}</div>
        <h3 class="section-h">Admin PIN</h3>
        <div class="row" style="justify-content:flex-start">
          <button class="btn" id="changePin" type="button">🔑 Change PIN</button>
          <button class="btn ghost" id="lockAdmin" type="button">🔒 Lock admin</button>
        </div>
      </div>`);
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
          ${profiles.length > 1 ? `<button class="btn ghost sm" data-delete="${esc(p.id)}" type="button">Delete</button>` : ""}
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
    $$("[data-delete]").forEach(b => {
      b.onclick = (ev) => {
        ev.stopPropagation();
        const id = b.dataset.delete;
        const cur = STORE.state.profiles[id];
        showConfirm("Delete " + ((cur && cur.name) || "this player") + "?",
          "All of this player's assessments and reports will be deleted on every device. The account stays.",
          "Delete", () => { STORE.deleteProfile(id); renderProfileSelect(); });
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
          <input id="pmInput" type="text" value="${esc(initialName || "")}" maxlength="24" placeholder="e.g. Preston"/>
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
    if (needLogin) { exam = null; adminUnlocked = false; return renderAuth(); }
    const profiles = STORE.profilesList();
    if (!profiles.length) return renderProfileSelect({ autoAdd: true });
    if (!STORE.active()) STORE.selectProfile(profiles[0].id);
    renderMenu();
  }

  window.UI = { route, renderMenu, toast, onSync, refreshIfIdle };
})();
