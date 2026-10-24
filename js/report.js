/* report.js — progress analytics: mastery status, per-level progress
   reports and the Parent Report. Everything is worked out from the active
   player's finished assessments (STORE.history), so every device signed in
   to the same account shows the same numbers. */
(function () {
  "use strict";

  /* ---------- mastery ----------
     Based on the most recent assessments of one level (newest first). */
  const AREA_WINDOW = 5;   // weak areas look at the last 5 assessments
  const MASTERY_RULE = "Mastered = a 100% score, or the last 3 assessments in a row all at 80% or more.";
  const MASTERY = {
    none:       { id: "none",       label: "Not started",     icon: "⚪", cls: "m-none",       rank: 0 },
    learning:   { id: "learning",   label: "Needs practice",  icon: "🌱", cls: "m-learning",   rank: 1 },
    developing: { id: "developing", label: "Developing",      icon: "📈", cls: "m-developing", rank: 2 },
    secure:     { id: "secure",     label: "Almost mastered", icon: "🌟", cls: "m-secure",     rank: 3 },
    mastered:   { id: "mastered",   label: "Mastered",        icon: "🏆", cls: "m-mastered",   rank: 4 }
  };
  function mastery(sessions) {
    if (!sessions || !sessions.length) return MASTERY.none;
    const last3 = sessions.slice(0, 3);
    const avg3 = last3.reduce((a, s) => a + (s.pct || 0), 0) / last3.length;
    if (sessions[0].pct >= 100) return MASTERY.mastered;                       // a perfect score
    if (last3.length === 3 && last3.every(s => s.pct >= 80)) return MASTERY.mastered;
    if (avg3 >= 80 && sessions[0].pct >= 80) return MASTERY.secure;
    if (avg3 >= 60) return MASTERY.developing;
    return MASTERY.learning;
  }
  // What the child needs to do next to move up a mastery step.
  function nextStep(sessions) {
    const m = mastery(sessions);
    if (m.id === "none") return "Take the first assessment to get a starting score.";
    if (m.id === "mastered") return "Level mastered — move on to the next level, and come back now and then to keep it fresh.";
    let streak = 0;
    for (const s of sessions) { if (s.pct >= 80) streak++; else break; }
    const need = 3 - streak;
    return "Score 100%, or 80% or more " + (need === 1 ? "1 more time" : need + " times in a row") + ", to master this level.";
  }

  function band(acc, attempts) {
    if (attempts < 4) return { txt: "Needs more practice", cls: "tag-mid", color: "#f2c14e" };
    if (acc >= 0.8)   return { txt: "Strong", cls: "tag-strong", color: "#4ec46a" };
    if (acc >= 0.55)  return { txt: "Improving", cls: "tag-mid", color: "#f2c14e" };
    return              { txt: "Weak — focus here", cls: "tag-weak", color: "#e2554d" };
  }

  function timeAgo(ts) {
    const s = Math.max(1, (Date.now() - ts) / 1000);
    if (s < 60)     return "just now";
    if (s < 3600)   return Math.floor(s / 60) + " min ago";
    if (s < 86400)  return Math.floor(s / 3600) + " h ago";
    if (s < 604800) { const d = Math.floor(s / 86400); return d + (d === 1 ? " day ago" : " days ago"); }
    const w = Math.floor(s / 604800); return w + (w === 1 ? " week ago" : " weeks ago");
  }
  function shortDate(ts) {
    try { return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return new Date(ts).toDateString(); }
  }

  /* ---------- one level ---------- */
  function levelStats(subjectId, topicId, levelId, sessions) {
    sessions = sessions || STORE.history(subjectId, null, topicId, levelId);
    const out = {
      subjectId, topicId, levelId,
      label: DATA.fullLabel(subjectId, topicId, levelId),
      attempts: sessions.length, sessions,
      mastery: mastery(sessions), next: nextStep(sessions)
    };
    if (!sessions.length) return out;
    const scores = sessions.map(s => s.pct);
    out.latest = scores[0];
    out.best = Math.max.apply(null, scores);
    out.worst = Math.min.apply(null, scores);
    out.avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    out.lastTs = sessions[0].ts;
    out.firstTs = sessions[sessions.length - 1].ts;
    const prior = scores.slice(1);
    const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : out.latest;
    out.trend = out.latest > priorAvg ? "up" : out.latest < priorAvg ? "down" : "flat";
    out.totalQ = sessions.reduce((a, s) => a + (s.total || 0), 0);
    out.totalC = sessions.reduce((a, s) => a + (s.correct || 0), 0);
    // Weak areas — question types over the most recent attempts (so areas the
    // child has since fixed drop off), weakest first.
    const recent = sessions.slice(0, AREA_WINDOW);
    out.areaSpan = recent.length;
    const agg = {};
    recent.forEach(s => Object.keys(s.byCat || {}).forEach(c => {
      if (!agg[c]) agg[c] = { correct: 0, total: 0 };
      agg[c].correct += s.byCat[c].correct || 0;
      agg[c].total += s.byCat[c].total || 0;
    }));
    out.areas = Object.keys(agg).map(c => {
      const a = agg[c], acc = a.total ? a.correct / a.total : 0;
      return { cat: c, label: DATA.catLabel(subjectId, topicId, levelId, c), correct: a.correct, total: a.total, acc, pct: Math.round(acc * 100) };
    }).sort((a, b) => a.acc - b.acc);
    out.weakAreas = out.areas.filter(a => a.acc < 0.7);
    return out;
  }

  /* ---------- one topic (all its levels) ---------- */
  function topicSummary(subjectId, topicId) {
    const t = DATA.topic(subjectId, topicId);
    const levels = ((t && t.levels) || []).map(l => levelStats(subjectId, topicId, l.id));
    const sessions = STORE.history(subjectId, null, topicId);
    return {
      levels,
      total: levels.length,
      mastered: levels.filter(l => l.mastery.id === "mastered").length,
      started: levels.filter(l => l.attempts > 0).length,
      attempts: sessions.length,
      lastTs: sessions.length ? sessions[0].ts : 0,
      avg: sessions.length ? Math.round(sessions.reduce((a, s) => a + s.pct, 0) / sessions.length) : null
    };
  }

  /* ---------- one topic inside a module (all of its levels) ---------- */
  function moduleTopicSummary(subjectId, moduleId, topicId) {
    const levels = DATA.topicLevels(subjectId, moduleId, topicId).map(l => levelStats(subjectId, moduleId, l.id));
    const sessions = [].concat.apply([], levels.map(l => l.sessions)).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const started = levels.filter(l => l.attempts > 0);
    // Weak areas across the topic's levels (each level's recent assessments).
    const agg = {};
    started.forEach(l => (l.areas || []).forEach(a => {
      const g = agg[a.label] = agg[a.label] || { label: a.label, correct: 0, total: 0 };
      g.correct += a.correct;
      g.total += a.total;
    }));
    const areas = Object.keys(agg).map(k => {
      const a = agg[k], acc = a.total ? a.correct / a.total : 0;
      return Object.assign(a, { acc, pct: Math.round(acc * 100) });
    }).sort((a, b) => a.acc - b.acc);
    return {
      topic: DATA.moduleTopic(subjectId, moduleId, topicId),
      levels, total: levels.length,
      mastered: levels.filter(l => l.mastery.id === "mastered").length,
      started: started.length,
      sessions, attempts: sessions.length,
      lastTs: sessions.length ? sessions[0].ts : 0,
      avg: sessions.length ? Math.round(sessions.reduce((a, s) => a + s.pct, 0) / sessions.length) : null,
      best: started.length ? Math.max.apply(null, started.map(l => l.best)) : null,
      areas, weakAreas: areas.filter(a => a.acc < 0.7)
    };
  }

  /* ---------- a topic's report: each level weakest first, and the question
     types (e.g. "unless", "they") the child is weak at across the topic ---------- */
  function topicReport(subjectId, moduleId, topicId) {
    const ts = moduleTopicSummary(subjectId, moduleId, topicId);
    const name = (ts.topic && ts.topic.label) || "this topic";
    const lvlName = (l) => { const d = DATA.level(subjectId, moduleId, l.levelId); return d ? d.label : "Level"; };
    const practised = ts.levels.filter(l => l.attempts).sort((a, b) => a.avg - b.avg);
    const notStarted = ts.levels.filter(l => !l.attempts);
    const mistakes = [];
    ts.sessions.slice(0, 3).forEach(s => (s.mistakes || []).forEach(x => {
      if (mistakes.length >= 8) return;
      const l = DATA.level(subjectId, moduleId, s.levelId);
      mistakes.push({ m: x, levelLabel: l ? l.label : "", when: timeAgo(s.ts) });
    }));
    let summary;
    if (!ts.total) summary = "Levels for <b>" + name + "</b> are coming soon.";
    else if (!ts.attempts) summary = "No assessments in <b>" + name + "</b> yet — start with Level 1.";
    else {
      summary = ts.weakAreas.length
        ? "Weak at: <b class=\"bad\">" + ts.weakAreas.slice(0, 4).map(a => a.label + " (" + a.pct + "%)").join(", ") + "</b>. Practise these first."
        : "No weak areas in <b>" + name + "</b> — every question type is at 70% or above.";
      if (practised.length > 1) summary += " Weakest level: <b>" + lvlName(practised[0]) + "</b> (" + practised[0].avg + "% average).";
      if (notStarted.length) summary += " Not started yet: " + notStarted.map(lvlName).join(", ") + ".";
    }
    return Object.assign({}, ts, { name, levelsWeakFirst: practised.concat(notStarted), practised, notStarted, mistakes, summary });
  }

  /* ---------- a whole module: how each topic is doing, weakest first ---------- */
  function moduleReport(subjectId, moduleId) {
    const m = DATA.topic(subjectId, moduleId);
    const inOrder = DATA.moduleTopics(subjectId, moduleId).map(t => moduleTopicSummary(subjectId, moduleId, t.id));
    const practised = inOrder.filter(t => t.attempts).sort((a, b) => a.avg - b.avg);
    const notStarted = inOrder.filter(t => !t.attempts);
    const sessions = [].concat.apply([], inOrder.map(t => t.sessions)).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const weakTopics = practised.filter(t => t.avg < 70);
    const areas = [].concat.apply([], practised.map(t => t.areas.map(a => Object.assign({ topicLabel: t.topic.label }, a))))
      .sort((a, b) => a.acc - b.acc);
    const mistakes = [];
    sessions.slice(0, 3).forEach(s => (s.mistakes || []).forEach(x => {
      if (mistakes.length >= 8) return;
      const l = DATA.level(subjectId, moduleId, s.levelId);
      mistakes.push({ m: x, topicLabel: l ? l.topicLabel : "", when: timeAgo(s.ts) });
    }));
    const name = (m && m.label) || "this module";
    let summary;
    if (!inOrder.length) summary = "Topics for <b>" + name + "</b> are coming soon.";
    else if (!practised.length) summary = "No assessments in <b>" + name + "</b> yet — pick a topic and start with Level 1.";
    else {
      const w = practised[0];
      summary = weakTopics.length
        ? "Needs the most practice: <b class=\"bad\">" + weakTopics.map(t => t.topic.label + " (" + t.avg + "%)").join(", ") + "</b>."
        : practised.length > 1
          ? "Weakest topic so far: <b>" + w.topic.label + "</b> (" + w.avg + "% average). Every topic practised is at 70% or above — great work!"
          : "<b>" + w.topic.label + "</b> is at " + w.avg + "% on average.";
      if (notStarted.length) summary += " Not started yet: " + notStarted.map(t => t.topic.label).join(", ") + ".";
    }
    return {
      module: m, inOrder, topics: practised.concat(notStarted), practised, notStarted, weakTopics,
      attempts: sessions.length,
      avg: sessions.length ? Math.round(sessions.reduce((a, s) => a + s.pct, 0) / sessions.length) : null,
      lastTs: sessions.length ? sessions[0].ts : 0,
      mastered: inOrder.reduce((n, t) => n + t.mastered, 0),
      totalLevels: inOrder.reduce((n, t) => n + t.total, 0),
      areas, mistakes, summary
    };
  }

  /* ---------- the whole Parent Report ---------- */
  function build() {
    const history = STORE.history();
    // Every level that has been assessed at least once (plus levels that no longer exist in data.js).
    const groups = {};
    history.forEach(h => { const k = h.subjectId + "|" + h.topicId + "|" + h.levelId; (groups[k] = groups[k] || []).push(h); });
    const levels = Object.keys(groups).map(k => {
      const h = groups[k][0];
      return levelStats(h.subjectId, h.topicId, h.levelId, groups[k]);
    });
    const totalQ = history.reduce((a, h) => a + (h.total || 0), 0);
    const totalC = history.reduce((a, h) => a + (h.correct || 0), 0);
    const weakest = levels.filter(l => l.mastery.rank <= 2).sort((a, b) => a.avg - b.avg).slice(0, 5);

    const subjects = DATA.SUBJECTS.map(s => {
      const sh = history.filter(h => h.subjectId === s.id);
      const q = sh.reduce((a, h) => a + (h.total || 0), 0);
      const c = sh.reduce((a, h) => a + (h.correct || 0), 0);
      const acc = q ? c / q : 0;
      const topics = s.topics.map(t => Object.assign({ topic: t }, topicSummary(s.id, t.id)));
      return {
        subject: s, sessions: sh.length, totalQ: q, totalC: c,
        pct: q ? Math.round(acc * 100) : null, band: q ? band(acc, q) : null,
        lastTs: sh.length ? sh[0].ts : 0,
        levelsTotal: DATA.levelCount(s.id),
        levelsMastered: topics.reduce((a, t) => a + t.mastered, 0),
        topics
      };
    });

    let summary;
    if (!totalQ) {
      summary = "No assessments finished yet. Once your child completes an assessment in <b>English</b>, <b>Bahasa</b> or <b>Maths</b>, this report fills itself in — on every device signed in to this account.";
    } else if (weakest.length) {
      summary = "Overall accuracy <b>" + Math.round(totalC / totalQ * 100) + "%</b> across <b>" + totalQ + "</b> questions. " +
        "Levels that need the most help: <b>" + weakest.slice(0, 3).map(l => l.label).join(", ") + "</b>.";
    } else {
      summary = "Overall accuracy <b>" + Math.round(totalC / totalQ * 100) + "%</b> across <b>" + totalQ + "</b> questions. " +
        "Every level practised so far is almost mastered or better — great work!";
    }

    const recent = [];
    for (const h of history.slice(0, 6)) {
      for (const m of (h.mistakes || [])) {
        recent.push({
          subjectId: h.subjectId,
          label: DATA.fullLabel(h.subjectId, h.topicId, h.levelId),
          q: m.q || "Question", chosen: m.chosen, answer: m.answer, when: timeAgo(h.ts)
        });
        if (recent.length >= 12) break;
      }
      if (recent.length >= 12) break;
    }

    return {
      levels, subjects, weakest, summary, recent, totalQ, totalC,
      sessions: history.length,
      overallPct: totalQ ? Math.round(totalC / totalQ * 100) : 0,
      mastered: levels.filter(l => l.mastery.id === "mastered").length
    };
  }

  window.REPORT = { build, band, timeAgo, shortDate, mastery, nextStep, levelStats, topicSummary, moduleTopicSummary, topicReport, moduleReport, MASTERY, MASTERY_RULE };
})();
