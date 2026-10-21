/* learn/maths.js — Maths LEARN lessons, grouped topic → level (same ids as
   js/data.js). Each lesson is a short deck of cards the child swipes through
   before (or after) the assessment. Empty for now. Example shape:

   window.LEARN.maths = {
     addition: {
       level1: [
         { title: "What is addition?",
           text: "Adding means putting groups together to find how many altogether.",
           example: "23 + 14 = 37",
           tip: "Start with the ones, then the tens." },
         { title: "Column addition",
           text: "Line the numbers up so the ones are under the ones.\nAdd the ones first. If they make 10 or more, carry the ten.",
           visual: "<svg viewBox='0 0 120 80'>…</svg>",
           example: "  46\n+ 35\n----\n  81" }
       ]
     }
   };

   Card fields (all optional except title):
     title    — the heading
     text     — the explanation (use \n for a new line)
     example  — a worked example, shown in a box (monospaced, keeps spacing)
     visual   — an SVG drawing
     tip      — a short "remember" hint                                      */
window.LEARN = window.LEARN || {};
window.LEARN.maths = {};
