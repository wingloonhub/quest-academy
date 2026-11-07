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
            { id: "conjunctions", label: "Conjunctions", icon: "🔗", desc: "Joining words — and, but, so, because, if, unless…", levels: [
                { id: "basics", label: "Level 1", desc: "Basic conjunctions — and, but, or", sessionSize: 15, hideCat: true,
                  catLabels: { AND: "and (adding)", BUT: "but (contrast)", OR: "or (choice)" } },
                { id: "reason_result", label: "Level 2", desc: "Reason & result — because, so, since, as", sessionSize: 15, hideCat: true,
                  catLabels: { BECAUSE: "because (reason)", SINCE: "since (reason)", AS: "as (reason)", SO: "so (result)" } },
                { id: "time_conditions", label: "Level 3", desc: "Time & conditions — before, after, when, while, until, if, unless", sessionSize: 15, hideCat: true,
                  catLabels: { BEFORE: "before (comes first)", AFTER: "after (comes later)", WHEN: "when (the moment)", WHILE: "while (at the same time)",
                               UNTIL: "until (up to a point)", IF: "if (condition)", UNLESS: "unless (if not)" } },
                { id: "advanced", label: "Level 4", desc: "Advanced & paired — although, yet, either … or, neither … nor, both … and", sessionSize: 15, hideCat: true,
                  catLabels: { ALTHOUGH: "although (contrast)", THOUGH: "though (contrast)", EVENTHOUGH: "even though (contrast)", YET: "yet (contrast)",
                               EITHEROR: "either … or (choice)", NEITHERNOR: "neither … nor (not either)", BOTHAND: "both … and (the two together)" } }
              ] },
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
        { id: "punctuation",  label: "Punctuation & capitalisation", icon: "❗", desc: "Full stops, commas, question marks and capital letters", topics: [
            { id: "capital_letters", label: "Capital letters", icon: "🔠", desc: "Which words need a capital letter — and why", levels: [
                { id: "level1", label: "Level 1", desc: "Find the word that needs a capital", sessionSize: 10, hideCat: true,
                  catLabels: { START: "First word of a sentence", NAME: "People's names & the word I", PLACE: "Places & landmarks",
                               TIME: "Days & months", SPECIAL: "Languages & festivals" } }
              ] },
            { id: "punctuation_marks", label: "Punctuation", icon: "❓", desc: "Full stops, commas, apostrophes, speech marks and more", levels: [
                { id: "mixed_single", label: "Level 1", desc: "Mixed full stops, questions & exclamation marks", sessionSize: 15, hideCat: true,
                  catLabels: { STATEMENT: "Full stops (statements)", QUESTION: "Question marks", EXCLAIM: "Exclamation marks",
                               SPEECH: "Marks inside speech" } },
                { id: "commas", label: "Level 2", desc: "Commas — lists, opening words and clauses", sessionSize: 15, hideCat: true,
                  catLabels: { LISTS: "Commas in lists", INTRO_WORDS: "Commas after opening words", INTRO_CLAUSES: "Commas after opening clauses", MIXED: "Mixed comma use" } },
                { id: "apostrophes", label: "Level 3", desc: "Apostrophes — contractions and belonging", sessionSize: 15, hideCat: true,
                  catLabels: { CONTRACTIONS: "Contractions", SINGULAR: "Belonging — one owner", PLURAL: "Belonging — more than one owner", MIXED: "Mixed apostrophe use" } },
                { id: "quotation_marks", label: "Level 4", desc: "Quotation marks — direct speech and dialogue", sessionSize: 15, hideCat: true,
                  catLabels: { DIRECT: "Spotting direct speech", BASIC: "Basic quotation marks", DIALOGUE: "Dialogue punctuation", MIXED: "Mixed dialogue" } },
                { id: "colons_semicolons", label: "Level 5", desc: "Colons & semicolons", sessionSize: 15, hideCat: true,
                  catLabels: { COLON_LISTS: "Colons before lists", COLON_EXPLAIN: "Colons before explanations", SEMICOLONS: "Semicolons joining sentences", MIXED: "Colons or semicolons" } },
                { id: "hyphens_dashes", label: "Level 6", desc: "Hyphens, dashes & parentheses", sessionSize: 15, hideCat: true,
                  catLabels: { HYPHENS: "Hyphens joining describing words", BRACKETS: "Brackets for extra information", DASHES: "Dashes for interruptions", MIXED: "Hyphens, dashes & brackets" } }
              ] }
          ] },
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
        { id: "pembentukan_kata",    label: "Pembentukan kata",            icon: "🧱", desc: "Imbuhan, kata majmuk dan kata ganda",                     topics: [
            { id: "kata_dasar", label: "Kata dasar", icon: "🌱", desc: "Kata asal tanpa imbuhan", levels: [
                { id: "gambar1", label: "Level 1", desc: "Kata kerja dasar bergambar", sessionSize: 15, hideCat: true,
                  catLabels: { RUTIN: "Rutin harian", RUMAH: "Kerja rumah", GERAK: "Gerakan", BELAJAR: "Belajar" } },
                { id: "gambar2", label: "Level 2", desc: "Kata kerja dasar bergambar", sessionSize: 15, hideCat: true,
                  catLabels: { BARANG: "Memegang & mengalih barang", SUKAN: "Sukan & permainan", BADAN: "Gerakan badan", CAKAP: "Lihat, dengar & bercakap" } },
                { id: "gambar3", label: "Level 3", desc: "Kata kerja dasar bergambar", sessionSize: 15, hideCat: true,
                  catLabels: { FIKIR: "Berfikir", BARANG: "Barang & hadiah", SOSIAL: "Bersama orang lain", AKTIVITI: "Belajar & aktiviti" } },
                { id: "gambar4", label: "Level 4", desc: "Kata kerja dasar bergambar", sessionSize: 15, hideCat: true,
                  catLabels: { PERASAAN: "Perasaan", DIRI: "Rutin harian", RUMAH: "Kerja rumah", KEBUN: "Berkebun" } }
            ] },
            { id: "imbuhan_awalan", label: "Imbuhan awalan", icon: "⏮️", desc: "Imbuhan di depan kata dasar", levels: [] },
            { id: "imbuhan_akhiran", label: "Imbuhan akhiran", icon: "⏭️", desc: "Imbuhan di belakang kata dasar", levels: [] },
            { id: "imbuhan_apitan", label: "Imbuhan apitan", icon: "↔️", desc: "Imbuhan di depan dan di belakang kata dasar", levels: [] },
            { id: "kata_ganda", label: "Kata ganda", icon: "👯", desc: "Kata yang diulang", levels: [] },
            { id: "kata_majmuk", label: "Kata majmuk", icon: "🧩", desc: "Dua kata yang membawa satu makna", levels: [] },
            { id: "penjodoh_bilangan", label: "Penjodoh bilangan", icon: "🔢", desc: "Kata untuk membilang benda", levels: [] }
          ] },
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
        { id: "number_place_value", label: "Numbers & Place value", icon: "🔢", desc: "Reading, writing, ordering and rounding numbers", topics: [
            { id: "comparing_ordering", label: "Comparing & Ordering Numbers", icon: "⚖️", desc: "Bigger, smaller and putting numbers in order", levels: [
                { id: "level1", label: "Level 1", desc: "Ascending & descending order — 2-, 3- and 4-digit numbers", sessionSize: 15,
                  catLabels: { ASC2: "2-digit numbers · ascending", DESC2: "2-digit numbers · descending",
                               ASC3: "3-digit numbers · ascending", DESC3: "3-digit numbers · descending",
                               ASC4: "4-digit numbers · ascending", DESC4: "4-digit numbers · descending" } },
                { id: "level2", label: "Level 2", desc: "Greater than, less than or equal to (>, <, =)", sessionSize: 15,
                  catLabels: { CMP2: "Comparing 2-digit numbers", CMP3: "Comparing 3-digit numbers", CMP4: "Comparing 4-digit numbers" } }
              ] },
            { id: "odd_even", label: "Odd & Even Numbers", icon: "🧦", desc: "Spotting, counting and using odd and even numbers", levels: [
                { id: "level1", label: "Level 1", desc: "Identify, count, patterns & reasoning", sessionSize: 15,
                  catLabels: { IDENTIFY: "Is it odd or even?", COUNT: "Counting odd & even numbers",
                               PATTERN: "Odd & even number patterns", REASON: "Odd & even reasoning" } }
              ] }
          ] },
        { id: "operations", label: "Operations", icon: "🧮", desc: "Adding, subtracting, multiplying and dividing", topics: [
            { id: "addition", label: "Addition", icon: "+", desc: "Adding numbers, with and without carrying", levels: [
                { id: "level1", label: "Level 1", desc: "2- and 3-digit addition",
                  catLabels: { ADD2: "2-digit addition", ADD3: "3-digit addition" } }
              ] },
            { id: "subtraction", label: "Subtraction", icon: "−", desc: "Taking away and finding the difference", levels: [
                { id: "level1", label: "Level 1", desc: "2- and 3-digit subtraction", sessionSize: 15,
                  catLabels: { SUB2: "2-digit, no borrowing", SUB2B: "2-digit, with borrowing", SUB3: "3-digit, no borrowing", SUB3B: "3-digit, with borrowing" } }
              ] },
            { id: "multiplication", label: "Multiplication", icon: "×", desc: "Times tables and multiplying bigger numbers", levels: [
                { id: "level1", label: "Level 1", desc: "1 digit × 1 digit", sessionSize: 20,
                  catLabels: { T2: "2 times table", T3: "3 times table", T4: "4 times table", T5: "5 times table",
                               T6: "6 times table", T7: "7 times table", T8: "8 times table", T9: "9 times table",
                               T10: "10 times table" } },
                { id: "level2", label: "Level 2", desc: "2 digits × 1 digit", sessionSize: 15,
                  catLabels: { NOCARRY: "Without carrying", CARRY: "With carrying" } }
              ] },
            { id: "division", label: "Division", icon: "÷", desc: "Sharing, grouping and remainders", levels: [
                { id: "level1", label: "Level 1", desc: "Dividing by 2 to 9 (no remainders)", sessionSize: 15,
                  catLabels: { D2: "Dividing by 2", D3: "Dividing by 3", D4: "Dividing by 4", D5: "Dividing by 5",
                               D6: "Dividing by 6", D7: "Dividing by 7", D8: "Dividing by 8", D9: "Dividing by 9" } }
              ] },
            { id: "missing_numbers", label: "Missing numbers", icon: "❓", desc: "Find the number that makes the sum right", levels: [
                { id: "level1a", label: "Level 1a", desc: "3-digit addition & subtraction", sessionSize: 15, hideCat: true,
                  catLabels: { ADD_1: "Addition · first number missing", ADD_2: "Addition · second number missing", ADD_R: "Addition · answer missing",
                               SUB_1: "Subtraction · first number missing", SUB_2: "Subtraction · second number missing", SUB_R: "Subtraction · answer missing" } },
                { id: "level2a", label: "Level 2a", desc: "Multiplication & division (1 to 11 times tables)", sessionSize: 15, hideCat: true,
                  catLabels: { MUL_1: "Multiplication · first number missing", MUL_2: "Multiplication · second number missing", MUL_R: "Multiplication · answer missing",
                               DIV_1: "Division · first number missing", DIV_2: "Division · second number missing", DIV_R: "Division · answer missing" } }
              ] },
            { id: "mixed_operations", label: "Mixed operations", icon: "🔀", desc: "Choosing and combining +, −, × and ÷", levels: [] }
          ] },
        { id: "fdp", label: "Fractions, Decimals & Percentages", icon: "🍕", desc: "Parts of a whole, decimals and percentages",
          // Fractions is one card on the module page that opens its sub-topics.
          groups: [{ id: "fractions_group", label: "Fractions", icon: "🍕", desc: "Parts of a whole — reading, comparing and using fractions" }],
          topics: [
            // Keeps the id "fractions" from when it was the whole Fractions topic, so saved results stay.
            { id: "fractions", group: "fractions_group", label: "Understanding fractions", icon: "🍕", desc: "Parts of a whole — shaded parts, numerators and denominators", levels: [
                { id: "level1", label: "Level 1", desc: "Shaded parts, numerators & denominators", sessionSize: 15, hideCat: true,
                  catLabels: { BAR: "Shaded fraction bars", CIRCLE: "Shaded fraction circles", UNSHADED: "Unshaded fraction bars", NUMDEN: "Numerators & denominators" } },
                { id: "level2", label: "Level 2", desc: "Represent fractions — shade the parts", sessionSize: 15, hideCat: true,
                  catLabels: { BAR: "Shading fraction bars", CIRCLE: "Shading fraction circles", GRID: "Shading fraction grids" } }
              ] },
            { id: "fractions_of_quantities", group: "fractions_group", label: "Fractions of quantities", icon: "🍬", desc: "Finding a fraction of an amount, like ½ of 12", levels: [] },
            { id: "equivalent_fractions", group: "fractions_group", label: "Equivalent fractions", icon: "⚖️", desc: "Different fractions worth the same, like ½ and 2/4", levels: [] },
            { id: "comparing_fractions", group: "fractions_group", label: "Comparing fractions", icon: "🆚", desc: "Which fraction is bigger or smaller", levels: [] },
            { id: "fraction_calculations", group: "fractions_group", label: "Fraction calculations", icon: "➕", desc: "Adding and subtracting fractions", levels: [] },
            { id: "decimals", label: "Decimals", icon: "🔢", desc: "Tenths, hundredths and the decimal point", levels: [] },
            { id: "percentages", label: "Percentages", icon: "💯", desc: "Parts out of 100", levels: [] }
          ] },
        { id: "measurement", label: "Measurement", icon: "📏", desc: "Length, mass, capacity, time and money", topics: [
            { id: "time", label: "Time", icon: "🕒", desc: "Reading clocks — exact times, quarters, minutes past and to", levels: [
                { id: "level1", label: "Level 1", desc: "Reading exact time", sessionSize: 15, hideCat: true,
                  catLabels: { ON5: "Long hand on a number", BETWEEN: "Long hand between the numbers" } },
                { id: "quarters_words", label: "Level 2", desc: "Quarter past, half past & quarter to — in words", sessionSize: 15, hideCat: true,
                  catLabels: { QP: "Quarter past", HP: "Half past", QT: "Quarter to" } },
                { id: "level3_1", label: "Level 3.1", desc: "Minutes past & to — recognition", sessionSize: 15, hideCat: true,
                  catLabels: { PAST: "Minutes past", TO: "Minutes to" } },
                { id: "level3_2", label: "Level 3.2", desc: "Minutes past & to — application", sessionSize: 15, hideCat: true,
                  catLabels: { PAST: "Minutes past", TO: "Minutes to" } }
              ] }
          ] },
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

  /* Quest Arena games. A game takes its questions from a level's bank —
     or, with a kind, makes up fresh numbers every game.
     kind: "odd_even"     → numbers fall from the sky; tap Odd or Even before each one lands;
     kind: "blaster"      → times-table sums fall (tables.from to tables.to on both sides of the ×);
                            type the answer and the blaster shoots the sum before it lands;
     kind: "battle"       → a monster for each level (rounds[].monster) with rounds[].questions lives;
                            a right answer hits it, a wrong one (or the clock) and it hits you
                            with its attack ("punch", "shield" or "web");
     kind: "picture"      → a picture from the banks the game names (banks: [{ topicId, levelId }]);
                            tap the right word of 4 before the clock runs out. A word comes up
                            once a game at most;
     roundName            → what the game calls a round on screen ("Level"; default "Round");
     rounds[].perQuestion → seconds allowed for EACH question — for falling games, the
                            seconds a number takes to fall (running out of time costs
                            a life, like a wrong answer);
     rounds[].badge       → the badge for clearing that round (see BADGES);
     rounds[].points      → { first: bonus for the FIRST win of the round,
                              repeat: points for every win after that }. */
  const GAMES = [
    {
      id: "multiple_blaster",
      subjectId: "maths",
      kind: "blaster",
      label: "Multiple Blaster",
      desc: "Times tables ×2 to ×10",
      icon: "🎯",
      roundName: "Level",
      winText: "You blasted every sum!",
      tables: { from: 2, to: 10 },
      source: { topicId: "operations", levelId: "multiplication.level1" },   // where to practise if the lives run out
      lives: 3,                                                               // for the whole game
      rounds: [
        { questions: 15, perQuestion: 15, badge: "blaster_cadet",   points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 10, badge: "blaster_ace",     points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 5,  badge: "blaster_captain", points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 3,  badge: "master_blaster",  points: { first: 50, repeat: 5 } }
      ]
    },
    {
      id: "meteor_mayhem",
      subjectId: "maths",
      kind: "odd_even",
      label: "Meteor Mayhem",
      desc: "Odd or even?",
      icon: "☄️",
      roundName: "Level",
      winText: "You stopped every meteor!",
      source: { topicId: "number_place_value", levelId: "odd_even.level1" },   // where to practise if the lives run out
      lives: 3,                                                                 // for the whole game
      rounds: [
        { questions: 15, perQuestion: 10, badge: "comet_catcher",   points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 5,  badge: "rocket_ranger",   points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 3,  badge: "galaxy_guardian", points: { first: 50, repeat: 5 } }
      ]
    },
    {
      id: "divide_conquer",
      subjectId: "maths",
      kind: "battle",
      label: "Divide & Conquer",
      desc: "Division ×2 to ×11",
      icon: "🃏",
      roundName: "Level",
      winText: "You conquered every monster!",
      tables: { from: 2, to: 11 },
      source: { topicId: "operations", levelId: "division.level1" },   // where to practise if the lives run out
      lives: 3,                                                         // the player's, for the whole game
      rounds: [
        { questions: 12, perQuestion: 15, monster: { art: "brute",  name: "Hulk",                   attack: "punch" },  badge: "tomb_conqueror",   points: { first: 50, repeat: 5 } },
        { questions: 12, perQuestion: 10, monster: { art: "zombie", name: "Zombie Captain America", attack: "shield" }, badge: "titan_conqueror",  points: { first: 50, repeat: 5 } },
        { questions: 12, perQuestion: 5,  monster: { art: "spider", name: "Zombie Spiderman",       attack: "web" },    badge: "undead_conqueror", points: { first: 50, repeat: 5 } }
      ]
    },
    {
      id: "kilat_kata",
      subjectId: "bahasa",
      kind: "picture",
      label: "Kilat Kata",
      desc: "Lihat gambar, pilih jawapan!",
      icon: "⚡",
      roundName: "Level",
      winText: "You're a Juara Kilat!",
      // The Kata dasar pictures, until the game's own questions arrive.
      banks: [
        { topicId: "pembentukan_kata", levelId: "kata_dasar.gambar1" },
        { topicId: "pembentukan_kata", levelId: "kata_dasar.gambar2" },
        { topicId: "pembentukan_kata", levelId: "kata_dasar.gambar3" },
        { topicId: "pembentukan_kata", levelId: "kata_dasar.gambar4" }
      ],
      source: { topicId: "pembentukan_kata", levelId: "kata_dasar.gambar1" },   // where to practise if the lives run out
      lives: 3,                                                                 // for the whole game
      rounds: [
        { questions: 15, perQuestion: 12, badge: "kancil_cerdik",  points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 10, badge: "helang_tangkas", points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 8,  badge: "harimau_pantas", points: { first: 50, repeat: 5 } },
        { questions: 15, perQuestion: 5,  badge: "juara_kilat",    points: { first: 50, repeat: 5 } }
      ]
    }
  ];
  const BADGES = {
    blaster_cadet:         { label: "Blaster Cadet",         tier: "bronze",  icon: "target",
                             desc: "Cleared Level 1 of Multiple Blaster — shot down 15 falling sums before they landed! 🎯" },
    blaster_ace:           { label: "Blaster Ace",           tier: "silver",  icon: "blaster",
                             desc: "Cleared Level 2 of Multiple Blaster — 15 more sums, falling in just 10 seconds each! ⚡" },
    blaster_captain:       { label: "Blaster Captain",       tier: "gold",    icon: "burst",
                             desc: "Cleared Level 3 of Multiple Blaster — 15 more sums in only 5 seconds each! 💥" },
    master_blaster:        { label: "Master Blaster",        tier: "diamond", icon: "crown",
                             desc: "Cleared Level 4 of Multiple Blaster — 15 sums crashing down in just 3 seconds each! 👑" },
    comet_catcher:         { label: "Comet Catcher",         tier: "bronze", icon: "comet",
                             desc: "Cleared Level 1 of Meteor Mayhem — sorted 15 falling numbers into odd and even before they landed! ☄️" },
    rocket_ranger:         { label: "Rocket Ranger",         tier: "silver", icon: "rocket",
                             desc: "Cleared Level 2 of Meteor Mayhem — 15 more numbers, falling in just 5 seconds each! 🚀" },
    galaxy_guardian:       { label: "Galaxy Guardian",       tier: "gold",   icon: "planet",
                             desc: "Cleared Level 3 of Meteor Mayhem — 15 numbers crashing down in only 3 seconds each! 🪐" },
    // Divide & Conquer's badges are saved under these ids, so they stay when the monsters change.
    tomb_conqueror:        { label: "Hulk Conqueror",        tier: "bronze", icon: "fist",
                             desc: "Cleared Level 1 of Divide & Conquer — knocked out Hulk! 💪" },
    titan_conqueror:       { label: "Shield Conqueror",      tier: "silver", icon: "shield",
                             desc: "Cleared Level 2 of Divide & Conquer — beat Zombie Captain America with just 10 seconds an answer! 🛡️" },
    undead_conqueror:      { label: "Web Conqueror",         tier: "gold",   icon: "web",
                             desc: "Cleared Level 3 of Divide & Conquer — beat Zombie Spiderman with only 5 seconds an answer! 🕸️" },
    kancil_cerdik:         { label: "Kancil Cerdik",         tier: "bronze",  icon: "kancil",
                             desc: "Cleared Level 1 of Kilat Kata — named 15 pictures with 12 seconds each, as clever as Sang Kancil! 🦌" },
    helang_tangkas:        { label: "Helang Tangkas",        tier: "silver",  icon: "eagle",
                             desc: "Cleared Level 2 of Kilat Kata — 15 more pictures in just 10 seconds each, swift as an eagle! 🦅" },
    harimau_pantas:        { label: "Harimau Pantas",        tier: "gold",    icon: "tiger",
                             desc: "Cleared Level 3 of Kilat Kata — 15 pictures in only 8 seconds each, fast as a tiger! 🐅" },
    juara_kilat:           { label: "Juara Kilat",           tier: "diamond", icon: "bolt",
                             desc: "Cleared Level 4 of Kilat Kata — 15 pictures in just 5 seconds each. Lightning champion! ⚡" }
  };

  /* Quest bonus — for EVERY game, now and in future: extra points, paid once, for
     winning all of its levels. STORE works it out from the wins (see questBonus). */
  const QUEST_BONUS = 50;

  /* Games that were replaced. They can't be played and their badges are gone, but the
     points they paid stay in the player's total (the wins are still in "arenaWins"). */
  const RETIRED_GAMES = [
    { id: "beat_the_clock", subjectId: "maths", label: "Beat the Clock", icon: "⏱️",
      rounds: [
        { badge: "times_table_ninja",     points: { first: 50, repeat: 5 } },
        { badge: "multiplication_wizard", points: { first: 60, repeat: 5 } }
      ] }
  ];

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

  /* Replay bonus — for EVERY level, now and in future: once a player's best on a
     level is 100%, each replay scoring minPct or more earns `points` (fixed, not
     multiplied by the subject's points per 1%; none while the subject's points are off). */
  const REPLAY_BONUS = { minPct: 90, points: 5 };

  /* Levels that were removed. Results already done stay in History & Analysis
     and the Parent Report under this name ("subject|module|<topic>.<level>"). */
  const RETIRED = {
    "english|grammar|conjunctions.level1": "Conjunctions · Old Level 1 (removed)",
    "english|punctuation|punctuation_marks.level1": "Punctuation · Old Level 1 (removed)",
    "maths|measurement|time.level2": "Time · Old Level 2 (removed)",
    "bahasa|pembentukan_kata|kata_dasar.level1": "Kata dasar · Old Level 1 (removed)",
    "bahasa|pembentukan_kata|kata_dasar.bergambar": "Kata dasar · Old Level 1, 74 pictures (removed)"
  };

  const byId = (list, id) => (list || []).filter(x => x.id === id)[0] || null;
  function games(subjectId) { return GAMES.filter(g => g.subjectId === subjectId); }
  function game(gameId) { return byId(GAMES, gameId); }
  function anyGame(gameId) { return game(gameId) || byId(RETIRED_GAMES, gameId); }

  function subject(subjectId) { return byId(SUBJECTS, subjectId); }
  // A MODULE (called "topic" in the rest of the code).
  function topic(subjectId, moduleId) { const s = subject(subjectId); return s ? byId(s.modules, moduleId) : null; }
  // A LEVEL, by its "<topic>.<level>" id.
  function level(subjectId, moduleId, levelId) { const m = topic(subjectId, moduleId); return m ? byId(m.levels, levelId) : null; }
  // The TOPICS inside a module, and the levels of one topic.
  function moduleTopics(subjectId, moduleId) { const m = topic(subjectId, moduleId); return (m && m.topics) || []; }
  function moduleTopic(subjectId, moduleId, topicId) { return byId(moduleTopics(subjectId, moduleId), topicId); }
  // A module's topics as its page shows them: a topic on its own, or a group of sub-topics in
  // one card (Fractions → Understanding fractions, Equivalent fractions…).  [{ topic } | { group, topics }]
  function moduleEntries(subjectId, moduleId) {
    const m = topic(subjectId, moduleId), out = [];
    ((m && m.topics) || []).forEach(t => {
      if (!t.group) return out.push({ topic: t });
      let e = out.filter(x => x.group && x.group.id === t.group)[0];
      if (!e) out.push(e = { group: byId(m.groups, t.group) || { id: t.group, label: tidyId(t.group) }, topics: [] });
      e.topics.push(t);
    });
    return out;
  }
  function topicGroup(subjectId, moduleId, groupId) { const m = topic(subjectId, moduleId); return m ? byId(m.groups, groupId) : null; }
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
    return RETIRED[subjectId + "|" + moduleId + "|" + levelId] || String(levelId || "Level").split(".").map(tidyId).join(" · ");
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
    DEFAULT_SESSION_SIZE, SCHOOL_YEARS, SUBJECTS, GAMES, RETIRED_GAMES, BADGES, MOVED, REPLAY_BONUS, QUEST_BONUS, games, game, anyGame,
    subject, topic, level, moduleTopics, moduleTopic, moduleEntries, topicGroup, topicLevels, bank, levelCount, topicCount,
    levelYears, yearTopics, topicLabel, levelLabel, fullLabel, catLabel
  };
})();
