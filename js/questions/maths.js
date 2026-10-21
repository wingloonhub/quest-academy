/* questions/maths.js — Maths ASSESSMENT questions, grouped topic → level.

   The topic and level ids must match js/data.js. Empty for now — levels are
   added as the Year 4 worksheets come in. Example shape:

   window.QUESTIONS.maths = {
     addition: {
       level1: [
         { q: "What is 46 + 35?", options: ["81", "71", "711", "82"], answer: 0, cat: "ADD2" },
         { typed: true, q: "347 + 285 = ___", word: "632", cat: "ADD3" }
       ],
       level2: [ ... ]
     },
     fractions: {
       level1: [ ... ]
     }
   };

   Question formats:
   1. Multiple choice — `answer` is the index of the right option (0-based).
      Options are shuffled each time, so their order here doesn't matter.
   2. Typed answer — { typed: true, q: "... ___ ...", word: "632" }
      When every accepted answer is a number, decimal or fraction (e.g. "3/8"),
      the child gets a NUMBER PAD; otherwise a letter keyboard.
      `alt: ["..."]` lists other accepted answers.
   3. Pictures — add `visual: "<svg …>…</svg>"` to show a drawing above the
      question (shapes for perimeter, clocks for time, scales for mass…).

   Optional on any question:
     cat:     short code used by the Progress report's "weak areas"
              (name it nicely with catLabels on the level in data.js)
     explain: a sentence shown after a wrong answer                         */
window.QUESTIONS = window.QUESTIONS || {};
window.QUESTIONS.maths = {
  // addition: {
  //   level1: [
  //     { q: "...", options: ["...", "...", "...", "..."], answer: 0, cat: "ADD2" }
  //   ]
  // }
};
