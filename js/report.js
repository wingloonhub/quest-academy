/* report.js — progress analytics: mastery status, per-level progress
   reports and the Parent Report. Everything is worked out from the active
   player's finished assessments (STORE.history), so every device signed in
   to the same account shows the same numbers. Assessments left part-way
   (STORE.unfinished) add their answers to weak areas, mistakes and the AI
   report, but never to a score, average, best, mastery or points. */
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

  const count = (n, word) => n + " " + word + (n === 1 ? "" : "s");
  // Newest first, finished and unfinished together (for "recent mistakes").
  const byNewest = (list) => list.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const whenOf = (s) => timeAgo(s.unfinished ? (s.lastTs || s.ts) : s.ts) + (s.unfinished ? " · unfinished" : "");

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
      mastery: mastery(sessions), next: nextStep(sessions),
      unfinished: STORE.unfinished(subjectId, null, topicId, levelId)   // left part-way: weak areas only
    };
    // Weak areas — question types over the most recent attempts (so areas the
    // child has since fixed drop off), weakest first. Assessments left part-way
    // in that time count too: their answers are real answers.
    const recent = sessions.slice(0, AREA_WINDOW);
    const since = sessions.length >= AREA_WINDOW ? recent[recent.length - 1].ts : 0;
    const recentU = out.unfinished.filter(u => u.ts >= since);
    out.areaSpan = recent.length;
    out.areaUnfinished = recentU.length;
    const agg = {};
    recent.concat(recentU).forEach(s => Object.keys(s.byCat || {}).forEach(c => {
      if (!agg[c]) agg[c] = { correct: 0, total: 0 };
      agg[c].correct += s.byCat[c].correct || 0;
      agg[c].total += s.byCat[c].total || 0;
    }));
    out.areas = Object.keys(agg).map(c => {
      const a = agg[c], acc = a.total ? a.correct / a.total : 0;
      return { cat: c, label: DATA.catLabel(subjectId, topicId, levelId, c), correct: a.correct, total: a.total, acc, pct: Math.round(acc * 100) };
    }).sort((a, b) => a.acc - b.acc);
    out.weakAreas = out.areas.filter(a => a.acc < 0.7);
    if (!sessions.length && out.unfinished.length) {   // started, never finished
      out.mastery = Object.assign({}, MASTERY.none, { label: "Not finished yet" });
      out.next = "Finish an assessment to get a starting score (" + count(out.unfinished.length, "assessment") + " left part-way so far).";
    }
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
    const unfinished = byNewest([].concat.apply([], levels.map(l => l.unfinished)));
    // Weak areas across the topic's levels (each level's recent assessments, finished or not).
    const agg = {};
    levels.filter(l => l.attempts > 0 || l.unfinished.length).forEach(l => (l.areas || []).forEach(a => {
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
      sessions, attempts: sessions.length, unfinished,
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
    const lvlName = (l) => DATA.levelName(DATA.level(subjectId, moduleId, l.levelId));
    const practised = ts.levels.filter(l => l.attempts).sort((a, b) => a.avg - b.avg);
    const unfinishedOnly = ts.levels.filter(l => !l.attempts && l.unfinished.length);   // started, never finished
    const notStarted = ts.levels.filter(l => !l.attempts && !l.unfinished.length);
    const mistakes = [];
    byNewest(ts.sessions.concat(ts.unfinished)).slice(0, 3).forEach(s => (s.mistakes || []).forEach(x => {
      if (mistakes.length >= 8) return;
      const l = DATA.level(subjectId, moduleId, s.levelId);
      mistakes.push({ m: x, levelLabel: l ? DATA.levelName(l) : "", when: whenOf(s) });
    }));
    let summary;
    if (!ts.total) summary = "Levels for <b>" + name + "</b> are coming soon.";
    else if (!ts.attempts && !ts.unfinished.length) summary = "No assessments in <b>" + name + "</b> yet — start with Level 1.";
    else {
      summary = ts.weakAreas.length
        ? "Weak at: <b class=\"bad\">" + ts.weakAreas.slice(0, 4).map(a => a.label + " (" + a.pct + "%)").join(", ") + "</b>. Practise these first."
        : "No weak areas in <b>" + name + "</b> — every question type is at 70% or above.";
      if (practised.length > 1) summary += " Weakest level: <b>" + lvlName(practised[0]) + "</b> (" + practised[0].avg + "% average).";
      if (unfinishedOnly.length) summary += " Started but not finished yet: " + unfinishedOnly.map(lvlName).join(", ") + ".";
      if (notStarted.length) summary += " Not started yet: " + notStarted.map(lvlName).join(", ") + ".";
    }
    if (ts.unfinished.length) summary += " <span class=\"muted\">" + count(ts.unfinished.length, "assessment") + " left part-way: " + (ts.unfinished.length === 1 ? "its" : "their") + " answers count towards weak areas, not scores.</span>";
    return Object.assign({}, ts, { name, levelsWeakFirst: practised.concat(unfinishedOnly, notStarted), practised, unfinishedOnly, notStarted, mistakes, summary });
  }

  /* ---------- a whole module (or one group of sub-topics in it): how each topic is doing, weakest first ---------- */
  function moduleReport(subjectId, moduleId, groupId) {
    const m = DATA.topic(subjectId, moduleId), group = groupId ? DATA.topicGroup(subjectId, moduleId, groupId) : null;
    const inOrder = DATA.moduleTopics(subjectId, moduleId).filter(t => !groupId || t.group === groupId).map(t => moduleTopicSummary(subjectId, moduleId, t.id));
    const practised = inOrder.filter(t => t.attempts).sort((a, b) => a.avg - b.avg);
    const unfinishedOnly = inOrder.filter(t => !t.attempts && t.unfinished.length);   // started, never finished
    const notStarted = inOrder.filter(t => !t.attempts && !t.unfinished.length);
    const sessions = [].concat.apply([], inOrder.map(t => t.sessions)).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const unfinished = byNewest([].concat.apply([], inOrder.map(t => t.unfinished)));
    const weakTopics = practised.filter(t => t.avg < 70);
    const areas = [].concat.apply([], practised.concat(unfinishedOnly).map(t => t.areas.map(a => Object.assign({ topicLabel: t.topic.label }, a))))
      .sort((a, b) => a.acc - b.acc);
    const mistakes = [];
    byNewest(sessions.concat(unfinished)).slice(0, 3).forEach(s => (s.mistakes || []).forEach(x => {
      if (mistakes.length >= 8) return;
      const l = DATA.level(subjectId, moduleId, s.levelId);
      mistakes.push({ m: x, topicLabel: l ? l.topicLabel : "", when: whenOf(s) });
    }));
    const name = (group && group.label) || (m && m.label) || "this module";
    let summary;
    if (!inOrder.length) summary = "Topics for <b>" + name + "</b> are coming soon.";
    else if (!practised.length && !unfinishedOnly.length) summary = "No assessments in <b>" + name + "</b> yet — pick a topic and start with Level 1.";
    else if (!practised.length) {
      summary = "No finished assessments in <b>" + name + "</b> yet. Started but not finished: " + unfinishedOnly.map(t => t.topic.label).join(", ") + ".";
      if (notStarted.length) summary += " Not started yet: " + notStarted.map(t => t.topic.label).join(", ") + ".";
    }
    else {
      const w = practised[0];
      summary = weakTopics.length
        ? "Needs the most practice: <b class=\"bad\">" + weakTopics.map(t => t.topic.label + " (" + t.avg + "%)").join(", ") + "</b>."
        : practised.length > 1
          ? "Weakest topic so far: <b>" + w.topic.label + "</b> (" + w.avg + "% average). Every topic practised is at 70% or above — great work!"
          : "<b>" + w.topic.label + "</b> is at " + w.avg + "% on average.";
      if (unfinishedOnly.length) summary += " Started but not finished yet: " + unfinishedOnly.map(t => t.topic.label).join(", ") + ".";
      if (notStarted.length) summary += " Not started yet: " + notStarted.map(t => t.topic.label).join(", ") + ".";
    }
    if (unfinished.length) summary += " <span class=\"muted\">" + count(unfinished.length, "assessment") + " left part-way: " + (unfinished.length === 1 ? "its" : "their") + " answers count towards weak areas, not scores.</span>";
    return {
      module: m, group, inOrder, topics: practised.concat(unfinishedOnly, notStarted), practised, unfinishedOnly, notStarted, weakTopics,
      attempts: sessions.length, unfinished,
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

    const unfinished = STORE.unfinished();
    if (unfinished.length) summary += " <span class=\"muted\">" + count(unfinished.length, "assessment") + " left part-way: " + (unfinished.length === 1 ? "its" : "their") + " answers count towards weak areas and mistakes, not scores.</span>";

    const recent = [];
    for (const h of byNewest(history.slice(0, 6).concat(unfinished)).slice(0, 6)) {
      for (const m of (h.mistakes || [])) {
        recent.push({
          subjectId: h.subjectId,
          label: DATA.fullLabel(h.subjectId, h.topicId, h.levelId),
          q: m.q || "Question", chosen: m.chosen, answer: m.answer, when: whenOf(h)
        });
        if (recent.length >= 12) break;
      }
      if (recent.length >= 12) break;
    }

    return {
      levels, subjects, weakest, summary, recent, totalQ, totalC,
      sessions: history.length, unfinished: unfinished.length,
      overallPct: totalQ ? Math.round(totalC / totalQ * 100) : 0,
      mastered: levels.filter(l => l.mastery.id === "mastered").length
    };
  }

  /* ---------- the facts an AI report is built on ----------
     Worked out here, so no number or question in a report comes from the AI. */
  const REPORT_STATUSES = ["Doing Well", "Needs Practice", "Needs Attention", "Insufficient Evidence"];
  function startingStatus(total, pct) {
    return total < 10 ? "Insufficient Evidence" : pct >= 85 ? "Doing Well" : pct >= 70 ? "Needs Practice" : "Needs Attention";
  }
  const savedAnswers = (h) => (Array.isArray(h.answers) && h.answers.length ? h.answers : (h.mistakes || []).map(m => ({ q: m.q, c: m.chosen, a: m.answer, ok: 0, s: m.sec, cat: m.cat })));
  function reportFacts(subjectId) {
    const history = STORE.history(subjectId), groups = {};
    history.forEach(h => { const k = h.topicId + "|" + h.levelId; (groups[k] = groups[k] || []).push(h); });
    const levels = Object.keys(groups).map(k => {
      const stats = levelStats(subjectId, groups[k][0].topicId, groups[k][0].levelId, groups[k]);
      const pct = stats.totalQ ? Math.round(stats.totalC / stats.totalQ * 100) : 0;
      return { stats, label: stats.label.split(" · ").slice(-2).join(" · "), correct: stats.totalC, total: stats.totalQ, pct, status: startingStatus(stats.totalQ, pct) };
    }).sort((a, b) => a.pct - b.pct).map((l, i) => Object.assign(l, { id: i + 1 }));
    const unfinished = STORE.unfinished(subjectId);
    const wrong = [].concat.apply([], history.concat(unfinished).map(h => savedAnswers(h).filter(a => !a.ok).map(a => ({ question: a.q, answer: a.c, correct: a.a }))));
    const correct = history.reduce((a, h) => a + (h.correct || 0), 0), total = history.reduce((a, h) => a + (h.total || 0), 0);
    return { levels, wrong, unfinished, stats: { assessments: history.length, correct, total, pct: total ? Math.round(correct / total * 100) : 0, unfinished: unfinished.length } };
  }
  // Join Claude's writing to the facts. It picks wrong answers and levels by number,
  // so every question and score shown is one that was really saved.
  const GAP_PRIORITIES = ["High priority", "Practise", "Recheck", "Low priority"];
  function finishReport(raw, facts) {
    const list = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
    const status = {}, notes = {};
    list(raw.levels).forEach(l => {
      if (REPORT_STATUSES.indexOf(l.status) > -1) status[l.id] = l.status;
      notes[l.id] = l.note;
    });
    const scoreOf = (ids) => {
      const levels = facts.levels.filter(l => list(ids).indexOf(l.id) > -1);
      return levels.length ? { correct: levels.reduce((a, l) => a + l.correct, 0), total: levels.reduce((a, l) => a + l.total, 0) } : null;
    };
    return {
      summary: raw.summary || "",
      strengths: list(raw.strengths, 2),
      attention: list(raw.attention, 2),
      evidence_note: raw.evidence_note || "",
      levels: facts.levels.map(l => ({ label: l.label, correct: l.correct, total: l.total, pct: l.pct, status: status[l.id] || l.status, note: notes[l.id] || "" })),
      weaknesses: list(raw.weaknesses).map(w => ({
        topic: w.topic, problem: w.problem, possible_reason: w.possible_reason, how_to_teach: w.how_to_teach, improvement_target: w.improvement_target,
        priority: GAP_PRIORITIES.indexOf(w.priority) > -1 ? w.priority : "Practise",
        score: scoreOf(w.level_ids),
        examples: list(w.example_ids).map(id => facts.wrong[id - 1]).filter(Boolean).slice(0, 2)
      })),
      plan: list(raw.plan, 3),
      since_last: list(raw.since_last)
    };
  }
  // High priority gaps come first. Everything else goes under "Other mistakes".
  function splitGaps(sections) {
    const top = sections.weaknesses.filter(w => w.priority === GAP_PRIORITIES[0]);
    const others = sections.weaknesses.filter(w => w.priority !== GAP_PRIORITIES[0]);
    const n = top.length, word = ["two", "three", "four", "five", "six"][n - 2] || n;
    return { top, others, heading: n === 1 ? "The most important learning gap" : "The " + word + " most important learning gaps" };
  }
  const AI_NOTES = {
    none: "No consistent weakness shows up in these results yet.",
    others: "These deserve practice, but the evidence is not yet enough to conclude they are persistent weaknesses.",
    next: "You'll see whether each weakness is improving, still needs practice, resolved, or not yet reassessed. Similar questions are compared, and progress isn't judged from a single small attempt."
  };

  /* ---------- question types with wrong answers, weakest first ----------
     Worked out from the saved answers, not by AI, up to a report's date. */
  function weakTypes(subjectId, uptoTs) {
    const types = {};
    const typeOf = (level, name) => (types[level + "|" + name] = types[level + "|" + name] || { level, name, right: 0, total: 0, rows: {} });
    const add = (type, m) => {
      const k = m.q + "|" + m.answer, row = type.rows[k] = type.rows[k] || { q: m.q, answer: m.answer, chosen: [], times: 0, secs: [] };
      row.times++;
      if (m.chosen && row.chosen.indexOf(m.chosen) < 0) row.chosen.push(m.chosen);
      if (m.sec != null) row.secs.push(m.sec);
    };
    STORE.history(subjectId).concat(STORE.unfinished(subjectId)).filter(h => !uptoTs || h.ts <= uptoTs).forEach(h => {
      const level = DATA.fullLabel(h.subjectId, h.topicId, h.levelId);
      const name = (cat) => (cat && cat !== "?" ? DATA.catLabel(h.subjectId, h.topicId, h.levelId, cat) : "Other questions");
      Object.keys(h.byCat || {}).forEach(cat => {
        const type = typeOf(level, name(cat));
        type.right += h.byCat[cat].correct || 0;
        type.total += h.byCat[cat].total || 0;
      });
      const full = Array.isArray(h.answers) && h.answers.length > 0;
      (full ? h.answers.filter(a => !a.ok).map(a => ({ q: a.q, chosen: a.c, answer: a.a, sec: a.s, cat: a.cat })) : h.mistakes || []).forEach(m => add(typeOf(level, name(m.cat)), m));
    });
    (DATA.GAMES || []).filter(g => g.subjectId === subjectId).forEach(def => {
      const log = STORE.gameLog(def.id).filter(e => !uptoTs || e.ts <= uptoTs);
      if (!log.some(e => (e.missed || []).length)) return;
      const type = typeOf("Timed game", def.label);
      log.forEach(e => {
        type.right += e.correct || 0;
        type.total += e.answered || 0;
        (e.missed || []).forEach(m => add(type, { q: m.q, chosen: m.slow ? "too slow" : m.c, answer: m.a }));
      });
    });
    const average = (r) => (r.secs.length ? Math.round(r.secs.reduce((a, b) => a + b, 0) / r.secs.length) : null);
    return Object.keys(types).map(k => types[k]).filter(t => Object.keys(t.rows).length).map(t => {
      const rows = Object.keys(t.rows).map(k => Object.assign(t.rows[k], { sec: average(t.rows[k]) })).sort((a, b) => b.times - a.times);
      return Object.assign(t, { rows, pct: t.total ? Math.round(t.right / t.total * 100) : null });
    }).sort((a, b) => (a.pct == null ? 101 : a.pct) - (b.pct == null ? 101 : b.pct) || b.rows.length - a.rows.length);
  }

  /* ---------- one subject's results as text, for its AI report ----------
     Learning results only: no name, email, school year, points or admin notes. */
  function subjectEvidence(subjectId) {
    const s = DATA.subject(subjectId), history = STORE.history(subjectId), facts = reportFacts(subjectId);
    const clean = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim().slice(0, 300);
    const count = (n, word) => n + " " + word + (n === 1 ? "" : "s");
    const where = (h) => DATA.fullLabel(h.subjectId, h.topicId, h.levelId);
    const lines = [
      "REPORT DATE: " + shortDate(Date.now()),
      "A primary school student's results in a quiz app. Scores are the % of questions correct. Each assessment is a random set of questions from that level.",
      MASTERY_RULE,
      "Times such as (12s) show how long an answer took. Older answers don't have them. WRONG lines show the question's type in brackets.",
      "",
      "OVERALL: " + count(facts.stats.assessments, "assessment") + ", " + facts.stats.correct + " of " + facts.stats.total + " questions correct" + (facts.stats.total ? " (" + facts.stats.pct + "%)" : "") + "." +
        (facts.stats.unfinished ? " Also " + count(facts.stats.unfinished, "assessment") + " left part-way (listed at the end; not counted in any score, average or best)." : "")
    ];
    // The last report, so the new one can say what has changed.
    const last = STORE.aiReport(subjectId);
    if (last && last.sections) {
      const then = (last.sections.weaknesses || []).map(w => clean(w.topic || w) + (w.priority ? " (" + w.priority + ")" : ""));
      lines.push("", "LAST REPORT (" + shortDate(last.ts) + ")", "Summary then: " + clean(last.sections.summary || last.sections.overall), "Weaknesses then: " + then.join("; "));
    }
    lines.push("", "LEVELS PRACTISED (weakest first)");
    facts.levels.forEach(row => {
      const l = row.stats, d = DATA.level(l.subjectId, l.topicId, l.levelId);
      const trend = l.attempts < 2 ? "" : l.trend === "up" ? ", improving" : l.trend === "down" ? ", dropping" : ", steady";
      const types = (l.areas || []).map(a => clean(a.label) + " " + a.pct + "% (" + a.correct + " of " + a.total + ")").join(", ");
      const timed = [].concat.apply([], l.sessions.map(h => h.answers || [])).filter(a => a.s != null);
      const pace = (ok) => { const t = timed.filter(a => !!a.ok === ok).map(a => a.s); return t.length ? Math.round(t.reduce((x, y) => x + y, 0) / t.length) + "s" : "no data"; };
      lines.push("- [L" + row.id + "] " + l.label + ": " + row.correct + " of " + row.total + " right (" + row.pct + "%), average " + l.avg + "%, latest " + l.latest + "%, best " + l.best + "%, " + count(l.attempts, "attempt") + trend + ", " + l.mastery.label + "." + (types ? " Recent question types: " + types + "." : "") + (timed.length ? " Average time: right answers " + pace(true) + ", wrong answers " + pace(false) + "." : ""));
    });
    // A level's best score is kept for good, so old work isn't mistaken for work never done.
    const noRecent = [].concat.apply([], s.topics.map(m => topicSummary(subjectId, m.id).levels.filter(l => !l.attempts)));
    const bestOf = (l) => STORE.bestScore(l.subjectId, l.topicId, l.levelId);
    const earlier = noRecent.filter(l => bestOf(l) > 0), notStarted = noRecent.filter(l => !bestOf(l));
    if (earlier.length) lines.push("", "PRACTISED LONG AGO (only the best score is kept)", ...earlier.map(l => "- " + l.label + ": best " + bestOf(l) + "%."));
    if (notStarted.length) lines.push("", "LEVELS NOT STARTED YET", notStarted.map(l => l.label).join("; "));
    const games = (DATA.GAMES || []).filter(g => g.subjectId === subjectId).map(def => ({ def, log: STORE.gameLog(def.id) })).filter(g => g.log.length);
    if (games.length) {
      lines.push("", "TIMED GAMES (3 misses in one level ends the game, and every level starts with 3 lives again; older games only have totals)");
      games.forEach(g => {
        const sum = (k) => g.log.reduce((a, e) => a + (e[k] || 0), 0);
        lines.push("- " + clean(g.def.label) + " (" + clean(g.def.desc) + "): " + count(g.log.length, "game") + ", " + sum("correct") + " of " + sum("answered") + " correct, " + sum("tooSlow") + " too slow.");
        const missed = {};
        g.log.forEach(e => (e.missed || []).forEach(m => { const row = missed[m.q] = missed[m.q] || { q: m.q, a: m.a, said: [], times: 0 }; row.times++; const said = m.slow ? "too slow" : clean(m.c); if (row.said.indexOf(said) < 0) row.said.push(said); }));
        const rows = Object.keys(missed).map(k => missed[k]).sort((a, b) => b.times - a.times).slice(0, 40);
        if (rows.length) lines.push("  Missed: " + rows.map(r => clean(r.q) + " = " + clean(r.a) + " (" + r.said.join(" / ") + (r.times > 1 ? ", " + r.times + " times" : "") + ")").join("; "));
      });
    }
    lines.push("", "SAVED ANSWERS (newest first)");
    let wrongNo = 0;   // the same order as reportFacts(), so a WRONG number finds its question again
    history.forEach(h => {
      const full = Array.isArray(h.answers) && h.answers.length > 0;
      lines.push("", "[" + shortDate(h.ts) + "] " + where(h) + ": " + h.pct + "% (" + h.correct + " of " + h.total + ")" + (full ? "" : ". Only wrong answers were saved"));
      savedAnswers(h).forEach(a => {
        const took = a.s != null ? " (" + a.s + "s)" : "";
        const type = a.cat && a.cat !== "?" ? " (" + clean(DATA.catLabel(h.subjectId, h.topicId, h.levelId, a.cat)) + ")" : "";
        lines.push(a.ok ? "right: " + clean(a.q) + " = " + clean(a.a) + took : "WRONG #" + (++wrongNo) + type + ": " + clean(a.q) + " | answered: " + (clean(a.c) || "nothing") + " | correct: " + clean(a.a) + took);
      });
    });
    if (facts.unfinished.length) {
      lines.push("", "LEFT PART-WAY (newest first). The student stopped before the end, so these are not scores; recent question types above include their answers");
      facts.unfinished.forEach(u => {
        lines.push("", "[" + shortDate(u.ts) + "] " + where(u) + ": stopped after " + u.total + " of " + count(u.planned || u.total, "question") + ", " + u.correct + " right");
        savedAnswers(u).forEach(a => {
          const took = a.s != null ? " (" + a.s + "s)" : "";
          const type = a.cat && a.cat !== "?" ? " (" + clean(DATA.catLabel(u.subjectId, u.topicId, u.levelId, a.cat)) + ")" : "";
          lines.push(a.ok ? "right: " + clean(a.q) + " = " + clean(a.a) + took : "WRONG #" + (++wrongNo) + type + ": " + clean(a.q) + " | answered: " + (clean(a.c) || "nothing") + " | correct: " + clean(a.a) + took);
        });
      });
    }
    // A typed answer could hold the child's name.
    const name = ((STORE.active() || {}).name || "").trim(), text = lines.join("\n");
    return name ? text.replace(new RegExp("\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi"), "the student") : text;
  }

  window.REPORT = { subjectEvidence, reportFacts, finishReport, splitGaps, AI_NOTES, weakTypes, build, band, timeAgo, shortDate, mastery, nextStep, levelStats, topicSummary, moduleTopicSummary, topicReport, moduleReport, MASTERY, MASTERY_RULE };
})();
