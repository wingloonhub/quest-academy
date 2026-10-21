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

   Each level also says which SCHOOL YEAR(S) it belongs to, for Study Mode →
   "By School Year":   years: [3]   (or several, e.g. years: [3, 4])

   Optional level settings:
     sessionSize: 20                       → questions per assessment (default 10)
     catLabels: { ADD3: "3-digit sums" }   → friendly names for question `cat` codes
     passageMode: true, passageCount: 2    → reading comprehension: whole passages,
                                             questions kept in order
     hideCat: true                         → don't show the question-type tag during
                                             the assessment (when it would give a hint) */
(function () {
  "use strict";

  const YEAR_LABEL = "Year 4";
  const DEFAULT_SESSION_SIZE = 10;   // questions per assessment, picked at random from the level
  const SCHOOL_YEARS = [1, 2, 3, 4, 5, 6];   // shown in Study Mode → By School Year

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
        { id: "addition",        label: "Addition",          icon: "+", desc: "Adding numbers and missing numbers",             levels: [
            { id: "level1", label: "Level 1", desc: "2- and 3-digit addition",
              catLabels: { ADD2: "2-digit addition", ADD3: "3-digit addition" } }
          ] },
        { id: "subtraction",     label: "Subtraction",       icon: "−", desc: "Taking away and finding the difference",         levels: [] },
        { id: "multiplication",  label: "Multiplication",    icon: "×", desc: "Times tables and multiplying bigger numbers",    levels: [
            { id: "level1", label: "Level 1", desc: "1 digit × 1 digit", sessionSize: 20,
              catLabels: { T2: "2 times table", T3: "3 times table", T4: "4 times table", T5: "5 times table",
                           T6: "6 times table", T7: "7 times table", T8: "8 times table", T9: "9 times table",
                           T10: "10 times table" } },
            { id: "level2", label: "Level 2", desc: "2 digits × 1 digit", sessionSize: 15,
              catLabels: { NOCARRY: "Without carrying", CARRY: "With carrying" } },
            { id: "level3", label: "Level 3", desc: "Identify groups & items in each group", sessionSize: 15, hideCat: true,
              catLabels: { SETUP: "“… are set up. There are … in each one”", EACHOF: "“Each of the … contains …”",
                           EVERY: "“… has …, with … in every one”", PUTIN: "“… are put in each of …” (items first)" } }
          ] },
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
        //   levels: [ { id: "level1", label: "Level 1", desc: "Adding 2-digit numbers", years: [3] } ]
      ]
    }
  ];

  /* Quest Arena games. A game takes its questions from a level's bank.
     rounds[].perQuestion → seconds allowed for EACH question (running out
                            of time costs a life, like a wrong answer);
     rounds[].badge       → the badge for clearing that round (see BADGES). */
  const GAMES = [
    {
      id: "beat_the_clock",
      subjectId: "maths",
      label: "Beat the Clock",
      desc: "Multiplication · 1 digit × 1 digit",
      icon: "⏱️",
      source: { topicId: "multiplication", levelId: "level1", maxFactor: 9 },   // only 1-digit × 1-digit
      lives: 3,                                                                 // for the whole game
      rounds: [
        { questions: 15, perQuestion: 10, badge: "times_table_ninja" },
        { questions: 15, perQuestion: 5,  badge: "multiplication_wizard" }
      ]
    }
  ];
  const BADGES = {
    times_table_ninja:     { label: "Times Table Ninja",     tier: "silver", icon: "ninja",
                             desc: "Survived Round 1 of Beat the Clock — 15 times-table questions, 10 seconds each, with only 3 lives! 🥷" },
    multiplication_wizard: { label: "Multiplication Wizard", tier: "gold",   icon: "wizard",
                             desc: "Beat Round 2 of Beat the Clock — 15 more times-table questions with just 5 seconds each! 🧙" }
  };

  const byId = (list, id) => (list || []).filter(x => x.id === id)[0] || null;
  function games(subjectId) { return GAMES.filter(g => g.subjectId === subjectId); }
  function game(gameId) { return byId(GAMES, gameId); }

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
  // School years a level belongs to (accepts years: [3, 4] or year: 3).
  function levelYears(lvl) {
    if (!lvl) return [];
    if (Array.isArray(lvl.years)) return lvl.years.map(Number);
    return lvl.year != null ? [Number(lvl.year)] : [];
  }
  // Study Mode → By School Year: the topics with levels for that year, each
  // with only those levels.  [{ topic, levels: [...] }, …]
  function yearTopics(subjectId, year) {
    const s = subject(subjectId);
    if (!s) return [];
    return s.topics.map(t => ({ topic: t, levels: (t.levels || []).filter(l => levelYears(l).indexOf(Number(year)) > -1) }))
      .filter(x => x.levels.length);
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
    YEAR_LABEL, DEFAULT_SESSION_SIZE, SCHOOL_YEARS, SUBJECTS, GAMES, BADGES, games, game,
    subject, topic, level, bank, lesson, levelCount, levelYears, yearTopics,
    topicLabel, levelLabel, fullLabel, catLabel
  };
})();
