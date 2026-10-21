/* questions/english.js — English ASSESSMENT questions, grouped topic → level.

   The topic and level ids must match js/data.js (subject "english").
   Empty for now — add them as the Year 4 worksheets come in:

   window.QUESTIONS.english = {
     nouns: {
       level1: [ ...questions... ]
     }
   };

   Every question format the app understands:

   1. Multiple choice — `answer` is the index of the right option (0-based).
        { q: "Choose the noun: The ___ barked loudly.",
          options: ["dog", "quickly", "blue", "run"], answer: 0, cat: "common" }

   2. Typed answer — on-screen keyboard (the phone's autocorrect can't help).
      Put ___ where the word goes. `alt` lists other accepted answers.
        { typed: true, q: "Adam is my brother. ___ is nine years old.", word: "He", cat: "S" }

   3. Listen and spell — the word is read aloud (British English voice).
        { spelling: true, word: "because", hint: "Starts with 'be'", cat: "tricky_words" }

   4. Reading comprehension — give every question from one story the same
      `pid` and `passage`, and set passageMode: true on the level in data.js.
        { pid: "fox1", passage: "Mr Fox lived in a hole...", q: "Where did Mr Fox live?",
          options: ["In a hole", "In a tree", "In a house", "In a cave"], answer: 0, cat: "F" }

   Optional on any question:
     cat:     short code used by the Progress report's "weak areas"
     explain: a sentence shown after a wrong answer                         */
window.QUESTIONS = window.QUESTIONS || {};
window.QUESTIONS.english = {};
