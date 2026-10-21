/* data.js — the shape of Quest Academy:

     SUBJECT  (English, Bahasa, Maths — the cards on the main menu)
       └ TOPIC   (e.g. Maths → Addition, Subtraction, … Word Problems)
           └ LEVEL  (Level 1, Level 2, … — added as worksheets come in)
               ├ Assessment       questions from js/questions/<subject>.js
               ├ Learn            lesson cards from js/learn/<subject>.js
               └ Progress report  built automatically from finished assessments

   To add a level later (example: Addition, Level 1):
   1. Add it to the topic's `levels` list below:
        { id: "level1", label: "Level 1", desc: "Adding 2-digit numbers" }
   2. Add its questions in js/questions/maths.js under  addition → level1
   3. (optional) Add its lesson in js/learn/maths.js under  addition → level1
   Nothing else changes — the screens, scoring, progress reports and the
   Parent Report pick it up automatically.

   Optional level settings:
     sessionSize: 20                       → questions per assessment (default 15)
     catLabels: { ADD3: "3-digit sums" }   → friendly names for question `cat` codes
     passageMode: true, passageCount: 2    → reading comprehension: whole passages,
                                             questions kept in order              */
(function () {
  "use strict";

  const YEAR_LABEL = "Year 4";
  const DEFAULT_SESSION_SIZE = 15;

  const SUBJECTS = [
    {
      id: "english",
      label: "English",
      tagline: "Grammar, spelling, reading & writing",
      voice: "en-GB",            // voice used by listen-and-spell questions
      topics: [
        // Topics go here once the worksheets are in, e.g.
        // { id: "nouns", label: "Nouns", icon: "🏷️", desc: "Common, proper & collective nouns", levels: [] },
      ]
    },
    {
      id: "bahasa",
      label: "Bahasa",
      fullLabel: "Bahasa Melayu",
      tagline: "Tatabahasa, ejaan & kefahaman",
      voice: "ms-MY",
      topics: [
        // { id: "kata_nama", label: "Kata Nama", icon: "🏷️", desc: "Kata nama am & khas", levels: [] },
      ]
    },
    {
      id: "maths",
      label: "Maths",
      tagline: "Numbers, measures & problem solving",
      voice: "en-GB",
      topics: [
        { id: "addition",        label: "Addition",          icon: "+", desc: "Adding numbers and missing numbers",             levels: [] },
        { id: "subtraction",     label: "Subtraction",       icon: "−", desc: "Taking away and finding the difference",         levels: [] },
        { id: "multiplication",  label: "Multiplication",    icon: "×", desc: "Times tables and multiplying bigger numbers",    levels: [] },
        { id: "division",        label: "Division",          icon: "÷", desc: "Sharing, grouping and remainders",               levels: [] },
        { id: "fractions",       label: "Fractions",         icon: "🍕", desc: "Parts of a whole, comparing, fractions of amounts", levels: [] },
        { id: "length",          label: "Length",            icon: "📏", desc: "mm, cm, m and km — measuring and converting",    levels: [] },
        { id: "mass",            label: "Mass (weight)",     icon: "⚖️", desc: "g and kg — weighing, comparing and converting",  levels: [] },
        { id: "capacity_volume", label: "Capacity & volume", icon: "🧪", desc: "ml and l — measuring liquids and converting",    levels: [] },
        { id: "perimeter",       label: "Perimeter",         icon: "🔲", desc: "The distance all the way around a shape",        levels: [] },
        { id: "time",            label: "Time",              icon: "⏰", desc: "Telling the time, durations and calendars",      levels: [] },
        { id: "money",           label: "Money",             icon: "💰", desc: "Coins, notes, totals and change",                levels: [] },
        { id: "word_problems",   label: "Word Problems",     icon: "🧩", desc: "Picking the right operation for real-life problems", levels: [] }
        // Levels are added inside each topic, e.g.
        //   levels: [ { id: "level1", label: "Level 1", desc: "Adding 2-digit numbers" } ]
      ]
    }
  ];

  const byId = (list, id) => (list || []).filter(x => x.id === id)[0] || null;

  function subject(subjectId) { return byId(SUBJECTS, subjectId); }
  function topic(subjectId, topicId) { const s = subject(subjectId); return s ? byId(s.topics, topicId) : null; }
  function level(subjectId, topicId, levelId) { const t = topic(subjectId, topicId); return t ? byId(t.levels, levelId) : null; }

  // Questions for one level — js/questions/<subject>.js → topic → level.
  function bank(subjectId, topicId, levelId) {
    const s = (window.QUESTIONS && window.QUESTIONS[subjectId]) || {};
    const b = (s[topicId] || {})[levelId];
    return Array.isArray(b) && b.length ? b : null;
  }
  // Lesson cards for one level — js/learn/<subject>.js → topic → level.
  function lesson(subjectId, topicId, levelId) {
    const s = (window.LEARN && window.LEARN[subjectId]) || {};
    const l = (s[topicId] || {})[levelId];
    return Array.isArray(l) && l.length ? l : null;
  }
  function levelCount(subjectId) {
    const s = subject(subjectId);
    return s ? s.topics.reduce((n, t) => n + (t.levels || []).length, 0) : 0;
  }
  // "level2" → "Level 2", "word_problems" → "Word problems" (for ids no longer in this file)
  function tidyId(id) {
    return String(id).replace(/_/g, " ").replace(/([a-z])(\d)/gi, "$1 $2").replace(/^./, c => c.toUpperCase());
  }
  function topicLabel(subjectId, topicId) {
    const t = topic(subjectId, topicId);
    return (t && t.label) || tidyId(topicId || "Topic");
  }
  function levelLabel(subjectId, topicId, levelId) {
    const l = level(subjectId, topicId, levelId);
    return (l && l.label) || tidyId(levelId || "Level");
  }
  // "Addition · Level 1"
  function fullLabel(subjectId, topicId, levelId) {
    return topicLabel(subjectId, topicId) + (levelId ? " · " + levelLabel(subjectId, topicId, levelId) : "");
  }
  function catLabel(subjectId, topicId, levelId, code) {
    const l = level(subjectId, topicId, levelId), t = topic(subjectId, topicId);
    if (l && l.catLabels && l.catLabels[code]) return l.catLabels[code];
    if (t && t.catLabels && t.catLabels[code]) return t.catLabels[code];
    if (!code || code === "?") return "General";
    return String(code).replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase());
  }

  window.DATA = {
    YEAR_LABEL, DEFAULT_SESSION_SIZE, SUBJECTS,
    subject, topic, level, bank, lesson, levelCount,
    topicLabel, levelLabel, fullLabel, catLabel
  };
})();
