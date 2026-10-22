/* data.js — the shape of Quest Academy:

     SUBJECT  (English, Bahasa, Maths — the cards on the main menu)
       └ MODULE   (e.g. English → Grammar, Maths → Operations)
           └ TOPIC    (e.g. Grammar → Conjunctions, Operations → Multiplication)
               └ LEVEL    (Level 1, Level 2, … — added as worksheets come in)
                   ├ Assessment       questions from js/questions/<subject>.js
                   └ Progress report  built automatically from finished assessments
     Every module page also has a MODULE REPORT: how each of its topics is
     going, weakest first.

   To add a level later (example: Grammar → Pronouns → Level 2):
   1. Add it to the topic's `levels` list below:
        { id: "level2", label: "Level 2", desc: "Possessive pronouns — my, your, his, her…" }
   2. Add its questions in js/questions/english.js under  grammar → pronouns → level2
   Nothing else changes — the screens, scoring, progress reports, the module
   report and the Parent Report pick it up automatically.
   A new topic is the same: add { id, label, icon, desc, levels: [...] } to the
   module's `topics`, and its questions under  module → topic → level.

   Each level also says which SCHOOL YEAR(S) it belongs to, for Study Mode →
   "By School Year":   years: [3]   (or several, e.g. years: [3, 4])

   Optional level settings:
     sessionSize: 20                       → questions per assessment (default 10)
     catLabels: { ADD3: "3-digit sums" }   → friendly names for question `cat` codes
     passageMode: true, passageCount: 2    → reading comprehension: whole passages,
                                             questions kept in order
     hideCat: true                         → don't show the question-type tag during
                                             the assessment (when it would give a hint)

   SAVED RESULTS are keyed by  subject | module | "<topic>.<level>"  (e.g.
   english | grammar | conjunctions.level1). Never rename an id that has results
   saved against it — to move a level, add its old → new ids to MOVED below. */
(function () {
  "use strict";

  const DEFAULT_SESSION_SIZE = 10;   // questions per assessment, picked at random from the level
  const SCHOOL_YEARS = [1, 2, 3, 4, 5, 6];   // shown in Study Mode → By School Year

  const SUBJECTS = [
    {
      id: "english",
      label: "English",
      tagline: "Grammar, spelling, reading & writing",
      voice: "en-GB",            // voice used by listen-and-spell questions
      modules: [
        { id: "grammar", label: "Grammar", icon: "🔤", desc: "Word classes and how sentences fit together", topics: [
            { id: "conjunctions", label: "Conjunctions", icon: "🔗", desc: "Joining words — and, but, so, because, if, unless…", levels: [] },
            { id: "pronouns", label: "Pronouns", icon: "🙋", desc: "I, you, he, she, it, we, they — words that stand for nouns", levels: [
                { id: "level1", label: "Level 1", desc: "Write the right pronoun", sessionSize: 15, hideCat: true,
                  catLabels: { I: "I (myself)", YOU: "you (the person I'm talking to)", HE: "he (one boy or man)",
                               SHE: "she (one girl or woman)", IT: "it (one thing or animal)", WE: "we (me and others)",
                               THEY: "they (more than one)" } }
              ] }
          ] },
        { id: "tenses_verbs", label: "Tenses & verbs",               icon: "⏳", desc: "Past, present and future — using verbs correctly",      topics: [] },
        { id: "vocabulary",   label: "Vocabulary",                   icon: "📚", desc: "Word meanings, synonyms and antonyms",                  topics: [] },
        { id: "spelling",     label: "Spelling",                     icon: "🐝", desc: "Spelling rules and tricky words",                       topics: [] },
        { id: "punctuation",  label: "Punctuation & capitalisation", icon: "❗", desc: "Full stops, commas, question marks and capital letters", topics: [] },
        { id: "reading",      label: "Reading comprehension",        icon: "📖", desc: "Read a passage, then answer questions about it",        topics: [] },
        { id: "writing",      label: "Writing",                      icon: "✍️", desc: "Sentences, paragraphs and short pieces of writing",     topics: [] }
      ]
    },
    {
      id: "bahasa",
      label: "Bahasa",
      fullLabel: "Bahasa Melayu",
      tagline: "Tatabahasa, ejaan & kefahaman",
      voice: "ms-MY",
      modules: [
        { id: "kata_nama",           label: "Kata nama & kata ganti nama", icon: "🏷️", desc: "Kata nama am, kata nama khas dan kata ganti nama diri", topics: [] },
        { id: "kata_kerja_adjektif", label: "Kata kerja & adjektif",       icon: "🏃", desc: "Kata kerja aktif dan pasif, serta kata adjektif",         topics: [] },
        { id: "kata_tugas",          label: "Kata tugas",                  icon: "🔗", desc: "Kata hubung, kata sendi nama, kata tanya, kata seru…",   topics: [] },
        { id: "pembentukan_kata",    label: "Pembentukan kata",            icon: "🧱", desc: "Imbuhan, kata majmuk dan kata ganda",                     topics: [] },
        { id: "ayat_tatabahasa",     label: "Ayat & tatabahasa",           icon: "📝", desc: "Jenis ayat, susunan ayat dan tatabahasa",                 topics: [] },
        { id: "ejaan_tanda_baca",    label: "Ejaan & Tanda baca",          icon: "✏️", desc: "Ejaan yang betul, huruf besar dan tanda baca",            topics: [] },
        { id: "pemahaman_kosa_kata", label: "Pemahaman & Kosa kata",       icon: "📖", desc: "Baca petikan, jawab soalan dan tambah kosa kata",         topics: [] },
        { id: "penulisan",           label: "Penulisan",                   icon: "✍️", desc: "Membina ayat, karangan pendek dan surat",                 topics: [] }
      ]
    },
    {
      id: "maths",
      label: "Maths",
      tagline: "Numbers, measures & problem solving",
      voice: "en-GB",
      modules: [
        { id: "number_place_value", label: "Numbers & Place value", icon: "🔢", desc: "Reading, writing, ordering and rounding numbers", topics: [] },
        { id: "operations", label: "Operations", icon: "🧮", desc: "Adding, subtracting, multiplying and dividing", topics: [
            { id: "addition", label: "Addition", icon: "+", desc: "Adding numbers, with and without carrying", levels: [
                { id: "level1", label: "Level 1", desc: "2- and 3-digit addition",
                  catLabels: { ADD2: "2-digit addition", ADD3: "3-digit addition" } }
              ] },
            { id: "subtraction", label: "Subtraction", icon: "−", desc: "Taking away and finding the difference", levels: [] },
            { id: "multiplication", label: "Multiplication", icon: "×", desc: "Times tables and multiplying bigger numbers", levels: [
                { id: "level1", label: "Level 1", desc: "1 digit × 1 digit", sessionSize: 20,
                  catLabels: { T2: "2 times table", T3: "3 times table", T4: "4 times table", T5: "5 times table",
                               T6: "6 times table", T7: "7 times table", T8: "8 times table", T9: "9 times table",
                               T10: "10 times table" } },
                { id: "level2", label: "Level 2", desc: "2 digits × 1 digit", sessionSize: 15,
                  catLabels: { NOCARRY: "Without carrying", CARRY: "With carrying" } }
              ] },
            { id: "division", label: "Division", icon: "÷", desc: "Sharing, grouping and remainders", levels: [] },
            { id: "missing_numbers", label: "Missing numbers", icon: "❓", desc: "Find the number that makes the sum right", levels: [] },
            { id: "mixed_operations", label: "Mixed operations", icon: "🔀", desc: "Choosing and combining +, −, × and ÷", levels: [] }
          ] },
        { id: "fdp", label: "Fractions, Decimals & Percentages", icon: "🍕", desc: "Parts of a whole, decimals and percentages", topics: [] },
        { id: "measurement", label: "Measurement", icon: "📏", desc: "Length, mass, capacity, time and money", topics: [] },
        { id: "geometry", label: "Geometry", icon: "📐", desc: "Shapes, angles, lines and position", topics: [] },
        { id: "statistics_probability", label: "Statistics & probability", icon: "📊", desc: "Tables, charts, graphs and chance", topics: [] },
        { id: "word_problems", label: "Word problems", icon: "🧩", desc: "Picking the right operation for real-life problems", topics: [] },
        { id: "reasoning", label: "Mathematical reasoning", icon: "🧠", desc: "Thinking problems — patterns, logic and equal groups", topics: [
            { id: "equal_groups", label: "Equal groups", icon: "🧺", desc: "Spot the number of groups and how many are in each", levels: [
                { id: "level1", label: "Level 1", desc: "Identify groups & items in each group", sessionSize: 15, hideCat: true,
                  catLabels: { SETUP: "“… are set up. There are … in each one”", EACHOF: "“Each of the … contains …”",
                               EVERY: "“… has …, with … in every one”", PUTIN: "“… are put in each of …” (items first)" } }
              ] }
          ] }
      ]
    }
  ];

  /* The rest of the app works on two lists built here:
       subject.topics → the subject's MODULES (the same list as subject.modules)
       module.levels  → every LEVEL in the module, from all of its topics, with
                        id "<topic>.<level>" (e.g. "conjunctions.level1") plus
                        topicId / topicLabel / topicIcon.
     So in the code a `topicId` is a module id and a `levelId` is "<topic>.<level>". */
  SUBJECTS.forEach(s => {
    s.modules = s.modules || [];
    s.topics = s.modules;
    s.modules.forEach(m => {
      m.topics = m.topics || [];
      m.levels = [];
      m.topics.forEach(t => (t.levels || []).forEach(l => {
        m.levels.push(Object.assign({}, l, { id: t.id + "." + l.id, levelNo: l.id, topicId: t.id, topicLabel: t.label, topicIcon: t.icon }));
      }));
    });
  });

  /* Quest Arena games. A game takes its questions from a level's bank.
     rounds[].perQuestion → seconds allowed for EACH question (running out
                            of time costs a life, like a wrong answer);
     rounds[].badge       → the badge for clearing that round (see BADGES);
     rounds[].points      → { first: bonus for the FIRST win of the round,
                              repeat: points for every win after that }. */
  const GAMES = [
    {
      id: "beat_the_clock",
      subjectId: "maths",
      label: "Beat the Clock",
      desc: "Multiplication · 1 digit × 1 digit",
      icon: "⏱️",
      source: { topicId: "operations", levelId: "multiplication.level1", maxFactor: 9 },   // only 1-digit × 1-digit
      lives: 3,                                                                            // for the whole game
      rounds: [
        { questions: 15, perQuestion: 10, badge: "times_table_ninja",     points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 5,  badge: "multiplication_wizard", points: { first: 60, repeat: 5 } }
      ]
    }
  ];
  const BADGES = {
    times_table_ninja:     { label: "Times Table Ninja",     tier: "silver", icon: "ninja",
                             desc: "Survived Round 1 of Beat the Clock — 15 times-table questions, 10 seconds each, with only 3 lives! 🥷" },
    multiplication_wizard: { label: "Multiplication Wizard", tier: "gold",   icon: "wizard",
                             desc: "Beat Round 2 of Beat the Clock — 15 more times-table questions with just 5 seconds each! 🧙" }
  };

  /* Levels that have moved. Results saved before a move still use the old
     ids, so STORE maps them to the new place whenever it loads or syncs:
     "subject|old module|old level" → [new module, new "<topic>.<level>"]. */
  const MOVED = {
    "english|conjunctions|level1":  ["grammar", "conjunctions.level1"],
    "english|pronouns|level1":      ["grammar", "pronouns.level1"],
    "english|grammar|conjunctions": ["grammar", "conjunctions.level1"],
    "english|grammar|pronouns":     ["grammar", "pronouns.level1"],
    "maths|addition|level1":                   ["operations", "addition.level1"],
    "maths|multiplication|level1":             ["operations", "multiplication.level1"],
    "maths|multiplication|level2":             ["operations", "multiplication.level2"],
    "maths|multiplication|level3":             ["reasoning", "equal_groups.level1"],
    "maths|addition|adding.level1":            ["operations", "addition.level1"],
    "maths|multiplication|multiplying.level1": ["operations", "multiplication.level1"],
    "maths|multiplication|multiplying.level2": ["operations", "multiplication.level2"],
    "maths|multiplication|multiplying.level3": ["reasoning", "equal_groups.level1"]
  };

  const byId = (list, id) => (list || []).filter(x => x.id === id)[0] || null;
  function games(subjectId) { return GAMES.filter(g => g.subjectId === subjectId); }
  function game(gameId) { return byId(GAMES, gameId); }

  function subject(subjectId) { return byId(SUBJECTS, subjectId); }
  // A MODULE (called "topic" in the rest of the code).
  function topic(subjectId, moduleId) { const s = subject(subjectId); return s ? byId(s.modules, moduleId) : null; }
  // A LEVEL, by its "<topic>.<level>" id.
  function level(subjectId, moduleId, levelId) { const m = topic(subjectId, moduleId); return m ? byId(m.levels, levelId) : null; }
  // The TOPICS inside a module, and the levels of one topic.
  function moduleTopics(subjectId, moduleId) { const m = topic(subjectId, moduleId); return (m && m.topics) || []; }
  function moduleTopic(subjectId, moduleId, topicId) { return byId(moduleTopics(subjectId, moduleId), topicId); }
  function topicLevels(subjectId, moduleId, topicId) {
    const m = topic(subjectId, moduleId);
    return ((m && m.levels) || []).filter(l => l.topicId === topicId);
  }

  // Questions for one level — js/questions/<subject>.js → module → topic → level.
  function bank(subjectId, moduleId, levelId) {
    const parts = String(levelId || "").split(".");
    const s = (window.QUESTIONS && window.QUESTIONS[subjectId]) || {};
    const b = ((s[moduleId] || {})[parts[0]] || {})[parts[1]];
    return Array.isArray(b) && b.length ? b : null;
  }
  // School years a level belongs to (accepts years: [3, 4] or year: 3).
  function levelYears(lvl) {
    if (!lvl) return [];
    if (Array.isArray(lvl.years)) return lvl.years.map(Number);
    return lvl.year != null ? [Number(lvl.year)] : [];
  }
  // Study Mode → By School Year: the modules with levels for that year, each
  // with only those levels.  [{ topic: module, levels: [...] }, …]
  function yearTopics(subjectId, year) {
    const s = subject(subjectId);
    if (!s) return [];
    return s.modules.map(m => ({ topic: m, levels: (m.levels || []).filter(l => levelYears(l).indexOf(Number(year)) > -1) }))
      .filter(x => x.levels.length);
  }
  function levelCount(subjectId) {
    const s = subject(subjectId);
    return s ? s.modules.reduce((n, m) => n + (m.levels || []).length, 0) : 0;
  }
  function topicCount(subjectId) {
    const s = subject(subjectId);
    return s ? s.modules.reduce((n, m) => n + (m.topics || []).length, 0) : 0;
  }
  // "level2" → "Level 2", "word_problems" → "Word problems" (for ids no longer in this file)
  function tidyId(id) {
    return String(id).replace(/_/g, " ").replace(/([a-z])(\d)/gi, "$1 $2").replace(/^./, c => c.toUpperCase());
  }
  // Module name, e.g. "Grammar"
  function topicLabel(subjectId, moduleId) {
    const m = topic(subjectId, moduleId);
    return (m && m.label) || tidyId(moduleId || "Module");
  }
  // Topic + level, e.g. "Conjunctions · Level 1"
  function levelLabel(subjectId, moduleId, levelId) {
    const l = level(subjectId, moduleId, levelId);
    if (l) return l.topicLabel + " · " + l.label;
    return String(levelId || "Level").split(".").map(tidyId).join(" · ");
  }
  // Everything, e.g. "Grammar · Conjunctions · Level 1"
  function fullLabel(subjectId, moduleId, levelId) {
    return topicLabel(subjectId, moduleId) + (levelId ? " · " + levelLabel(subjectId, moduleId, levelId) : "");
  }
  function catLabel(subjectId, moduleId, levelId, code) {
    const l = level(subjectId, moduleId, levelId);
    const t = l ? moduleTopic(subjectId, moduleId, l.topicId) : null, m = topic(subjectId, moduleId);
    for (const x of [l, t, m]) if (x && x.catLabels && x.catLabels[code]) return x.catLabels[code];
    if (!code || code === "?") return "General";
    return String(code).replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase());
  }

  window.DATA = {
    DEFAULT_SESSION_SIZE, SCHOOL_YEARS, SUBJECTS, GAMES, BADGES, MOVED, games, game,
    subject, topic, level, moduleTopics, moduleTopic, topicLevels, bank, levelCount, topicCount,
    levelYears, yearTopics, topicLabel, levelLabel, fullLabel, catLabel
  };
})();
