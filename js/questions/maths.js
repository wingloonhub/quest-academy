/* questions/maths.js — Maths ASSESSMENT questions, grouped topic → level.

   The topic and level ids must match js/data.js. Each assessment picks 10
   questions at random from the level's bank — an even mix of the question
   types (the `cat` codes), in a random order — so it's different every time.

   Question formats:
   1. Multiple choice — `answer` is the index of the right option (0-based).
      Options are shuffled each time, so their order here doesn't matter.
        { q: "What is 46 + 35?", options: ["81", "71", "711", "82"], answer: 0, cat: "ADD2" }
   2. Typed answer — { typed: true, q: "... ___ ...", word: "632" }
      When every accepted answer is a number, decimal or fraction (e.g. "3/8"),
      the child gets a NUMBER PAD; otherwise a letter keyboard.
      `alt: ["..."]` lists other accepted answers.
   3. Pictures — add `visual: "<svg …>…</svg>"` to show a drawing above the
      question (shapes for perimeter, clocks for time, scales for mass…).

   Optional on any question:
     cat:     short code used by the Progress report's "weak areas"
              (name it nicely with catLabels on the level in data.js)
     explain: shown after a wrong answer                                    */
window.QUESTIONS = window.QUESTIONS || {};
window.QUESTIONS.maths = {

  addition: {
    // Level 1 — 2- and 3-digit addition.
    // Source: Materials/Maths/Quest_Academy_50_Addition_Questions_Answers.docx
    // (answer key checked: all 50 correct). Explanations use the column method.
    level1: [
      // Part A — 2-digit addition (worksheet Q1–25)
      { typed: true, q: "24 + 35 = ___", word: "59", cat: "ADD2",
        explain: "Ones: 4 + 5 = 9. Tens: 2 + 3 = 5. So 24 + 35 = 59." },
      { typed: true, q: "47 + 28 = ___", word: "75", cat: "ADD2",
        explain: "Ones: 7 + 8 = 15, write 5 and carry 1. Tens: 4 + 2 + 1 carried = 7. So 47 + 28 = 75." },
      { typed: true, q: "63 + 14 = ___", word: "77", cat: "ADD2",
        explain: "Ones: 3 + 4 = 7. Tens: 6 + 1 = 7. So 63 + 14 = 77." },
      { typed: true, q: "58 + 37 = ___", word: "95", cat: "ADD2",
        explain: "Ones: 8 + 7 = 15, write 5 and carry 1. Tens: 5 + 3 + 1 carried = 9. So 58 + 37 = 95." },
      { typed: true, q: "32 + 46 = ___", word: "78", cat: "ADD2",
        explain: "Ones: 2 + 6 = 8. Tens: 3 + 4 = 7. So 32 + 46 = 78." },
      { typed: true, q: "76 + 19 = ___", word: "95", cat: "ADD2",
        explain: "Ones: 6 + 9 = 15, write 5 and carry 1. Tens: 7 + 1 + 1 carried = 9. So 76 + 19 = 95." },
      { typed: true, q: "45 + 23 = ___", word: "68", cat: "ADD2",
        explain: "Ones: 5 + 3 = 8. Tens: 4 + 2 = 6. So 45 + 23 = 68." },
      { typed: true, q: "69 + 17 = ___", word: "86", cat: "ADD2",
        explain: "Ones: 9 + 7 = 16, write 6 and carry 1. Tens: 6 + 1 + 1 carried = 8. So 69 + 17 = 86." },
      { typed: true, q: "81 + 16 = ___", word: "97", cat: "ADD2",
        explain: "Ones: 1 + 6 = 7. Tens: 8 + 1 = 9. So 81 + 16 = 97." },
      { typed: true, q: "38 + 54 = ___", word: "92", cat: "ADD2",
        explain: "Ones: 8 + 4 = 12, write 2 and carry 1. Tens: 3 + 5 + 1 carried = 9. So 38 + 54 = 92." },
      { typed: true, q: "27 + 65 = ___", word: "92", cat: "ADD2",
        explain: "Ones: 7 + 5 = 12, write 2 and carry 1. Tens: 2 + 6 + 1 carried = 9. So 27 + 65 = 92." },
      { typed: true, q: "56 + 38 = ___", word: "94", cat: "ADD2",
        explain: "Ones: 6 + 8 = 14, write 4 and carry 1. Tens: 5 + 3 + 1 carried = 9. So 56 + 38 = 94." },
      { typed: true, q: "72 + 25 = ___", word: "97", cat: "ADD2",
        explain: "Ones: 2 + 5 = 7. Tens: 7 + 2 = 9. So 72 + 25 = 97." },
      { typed: true, q: "49 + 43 = ___", word: "92", cat: "ADD2",
        explain: "Ones: 9 + 3 = 12, write 2 and carry 1. Tens: 4 + 4 + 1 carried = 9. So 49 + 43 = 92." },
      { typed: true, q: "83 + 18 = ___", word: "101", cat: "ADD2",
        explain: "Ones: 3 + 8 = 11, write 1 and carry 1. Tens: 8 + 1 + 1 carried = 10, write 0 and carry 1. Hundreds: write the carried 1. So 83 + 18 = 101." },
      { typed: true, q: "64 + 29 = ___", word: "93", cat: "ADD2",
        explain: "Ones: 4 + 9 = 13, write 3 and carry 1. Tens: 6 + 2 + 1 carried = 9. So 64 + 29 = 93." },
      { typed: true, q: "35 + 57 = ___", word: "92", cat: "ADD2",
        explain: "Ones: 5 + 7 = 12, write 2 and carry 1. Tens: 3 + 5 + 1 carried = 9. So 35 + 57 = 92." },
      { typed: true, q: "78 + 16 = ___", word: "94", cat: "ADD2",
        explain: "Ones: 8 + 6 = 14, write 4 and carry 1. Tens: 7 + 1 + 1 carried = 9. So 78 + 16 = 94." },
      { typed: true, q: "46 + 47 = ___", word: "93", cat: "ADD2",
        explain: "Ones: 6 + 7 = 13, write 3 and carry 1. Tens: 4 + 4 + 1 carried = 9. So 46 + 47 = 93." },
      { typed: true, q: "59 + 32 = ___", word: "91", cat: "ADD2",
        explain: "Ones: 9 + 2 = 11, write 1 and carry 1. Tens: 5 + 3 + 1 carried = 9. So 59 + 32 = 91." },
      { typed: true, q: "67 + 25 = ___", word: "92", cat: "ADD2",
        explain: "Ones: 7 + 5 = 12, write 2 and carry 1. Tens: 6 + 2 + 1 carried = 9. So 67 + 25 = 92." },
      { typed: true, q: "84 + 19 = ___", word: "103", cat: "ADD2",
        explain: "Ones: 4 + 9 = 13, write 3 and carry 1. Tens: 8 + 1 + 1 carried = 10, write 0 and carry 1. Hundreds: write the carried 1. So 84 + 19 = 103." },
      { typed: true, q: "39 + 48 = ___", word: "87", cat: "ADD2",
        explain: "Ones: 9 + 8 = 17, write 7 and carry 1. Tens: 3 + 4 + 1 carried = 8. So 39 + 48 = 87." },
      { typed: true, q: "75 + 18 = ___", word: "93", cat: "ADD2",
        explain: "Ones: 5 + 8 = 13, write 3 and carry 1. Tens: 7 + 1 + 1 carried = 9. So 75 + 18 = 93." },
      { typed: true, q: "56 + 67 = ___", word: "123", cat: "ADD2",
        explain: "Ones: 6 + 7 = 13, write 3 and carry 1. Tens: 5 + 6 + 1 carried = 12, write 2 and carry 1. Hundreds: write the carried 1. So 56 + 67 = 123." },

      // Part B — 3-digit addition (worksheet Q26–50)
      { typed: true, q: "124 + 235 = ___", word: "359", cat: "ADD3",
        explain: "Ones: 4 + 5 = 9. Tens: 2 + 3 = 5. Hundreds: 1 + 2 = 3. So 124 + 235 = 359." },
      { typed: true, q: "347 + 128 = ___", word: "475", cat: "ADD3",
        explain: "Ones: 7 + 8 = 15, write 5 and carry 1. Tens: 4 + 2 + 1 carried = 7. Hundreds: 3 + 1 = 4. So 347 + 128 = 475." },
      { typed: true, q: "563 + 214 = ___", word: "777", cat: "ADD3",
        explain: "Ones: 3 + 4 = 7. Tens: 6 + 1 = 7. Hundreds: 5 + 2 = 7. So 563 + 214 = 777." },
      { typed: true, q: "458 + 376 = ___", word: "834", cat: "ADD3",
        explain: "Ones: 8 + 6 = 14, write 4 and carry 1. Tens: 5 + 7 + 1 carried = 13, write 3 and carry 1. Hundreds: 4 + 3 + 1 carried = 8. So 458 + 376 = 834." },
      { typed: true, q: "632 + 145 = ___", word: "777", cat: "ADD3",
        explain: "Ones: 2 + 5 = 7. Tens: 3 + 4 = 7. Hundreds: 6 + 1 = 7. So 632 + 145 = 777." },
      { typed: true, q: "276 + 189 = ___", word: "465", cat: "ADD3",
        explain: "Ones: 6 + 9 = 15, write 5 and carry 1. Tens: 7 + 8 + 1 carried = 16, write 6 and carry 1. Hundreds: 2 + 1 + 1 carried = 4. So 276 + 189 = 465." },
      { typed: true, q: "415 + 263 = ___", word: "678", cat: "ADD3",
        explain: "Ones: 5 + 3 = 8. Tens: 1 + 6 = 7. Hundreds: 4 + 2 = 6. So 415 + 263 = 678." },
      { typed: true, q: "689 + 147 = ___", word: "836", cat: "ADD3",
        explain: "Ones: 9 + 7 = 16, write 6 and carry 1. Tens: 8 + 4 + 1 carried = 13, write 3 and carry 1. Hundreds: 6 + 1 + 1 carried = 8. So 689 + 147 = 836." },
      { typed: true, q: "731 + 168 = ___", word: "899", cat: "ADD3",
        explain: "Ones: 1 + 8 = 9. Tens: 3 + 6 = 9. Hundreds: 7 + 1 = 8. So 731 + 168 = 899." },
      { typed: true, q: "358 + 254 = ___", word: "612", cat: "ADD3",
        explain: "Ones: 8 + 4 = 12, write 2 and carry 1. Tens: 5 + 5 + 1 carried = 11, write 1 and carry 1. Hundreds: 3 + 2 + 1 carried = 6. So 358 + 254 = 612." },
      { typed: true, q: "427 + 365 = ___", word: "792", cat: "ADD3",
        explain: "Ones: 7 + 5 = 12, write 2 and carry 1. Tens: 2 + 6 + 1 carried = 9. Hundreds: 4 + 3 = 7. So 427 + 365 = 792." },
      { typed: true, q: "546 + 278 = ___", word: "824", cat: "ADD3",
        explain: "Ones: 6 + 8 = 14, write 4 and carry 1. Tens: 4 + 7 + 1 carried = 12, write 2 and carry 1. Hundreds: 5 + 2 + 1 carried = 8. So 546 + 278 = 824." },
      { typed: true, q: "812 + 156 = ___", word: "968", cat: "ADD3",
        explain: "Ones: 2 + 6 = 8. Tens: 1 + 5 = 6. Hundreds: 8 + 1 = 9. So 812 + 156 = 968." },
      { typed: true, q: "394 + 487 = ___", word: "881", cat: "ADD3",
        explain: "Ones: 4 + 7 = 11, write 1 and carry 1. Tens: 9 + 8 + 1 carried = 18, write 8 and carry 1. Hundreds: 3 + 4 + 1 carried = 8. So 394 + 487 = 881." },
      { typed: true, q: "675 + 218 = ___", word: "893", cat: "ADD3",
        explain: "Ones: 5 + 8 = 13, write 3 and carry 1. Tens: 7 + 1 + 1 carried = 9. Hundreds: 6 + 2 = 8. So 675 + 218 = 893." },
      { typed: true, q: "239 + 356 = ___", word: "595", cat: "ADD3",
        explain: "Ones: 9 + 6 = 15, write 5 and carry 1. Tens: 3 + 5 + 1 carried = 9. Hundreds: 2 + 3 = 5. So 239 + 356 = 595." },
      { typed: true, q: "784 + 129 = ___", word: "913", cat: "ADD3",
        explain: "Ones: 4 + 9 = 13, write 3 and carry 1. Tens: 8 + 2 + 1 carried = 11, write 1 and carry 1. Hundreds: 7 + 1 + 1 carried = 9. So 784 + 129 = 913." },
      { typed: true, q: "463 + 358 = ___", word: "821", cat: "ADD3",
        explain: "Ones: 3 + 8 = 11, write 1 and carry 1. Tens: 6 + 5 + 1 carried = 12, write 2 and carry 1. Hundreds: 4 + 3 + 1 carried = 8. So 463 + 358 = 821." },
      { typed: true, q: "527 + 486 = ___", word: "1013", cat: "ADD3",
        explain: "Ones: 7 + 6 = 13, write 3 and carry 1. Tens: 2 + 8 + 1 carried = 11, write 1 and carry 1. Hundreds: 5 + 4 + 1 carried = 10, write 0 and carry 1. Thousands: write the carried 1. So 527 + 486 = 1013." },
      { typed: true, q: "695 + 137 = ___", word: "832", cat: "ADD3",
        explain: "Ones: 5 + 7 = 12, write 2 and carry 1. Tens: 9 + 3 + 1 carried = 13, write 3 and carry 1. Hundreds: 6 + 1 + 1 carried = 8. So 695 + 137 = 832." },
      { typed: true, q: "348 + 275 = ___", word: "623", cat: "ADD3",
        explain: "Ones: 8 + 5 = 13, write 3 and carry 1. Tens: 4 + 7 + 1 carried = 12, write 2 and carry 1. Hundreds: 3 + 2 + 1 carried = 6. So 348 + 275 = 623." },
      { typed: true, q: "756 + 168 = ___", word: "924", cat: "ADD3",
        explain: "Ones: 6 + 8 = 14, write 4 and carry 1. Tens: 5 + 6 + 1 carried = 12, write 2 and carry 1. Hundreds: 7 + 1 + 1 carried = 9. So 756 + 168 = 924." },
      { typed: true, q: "589 + 324 = ___", word: "913", cat: "ADD3",
        explain: "Ones: 9 + 4 = 13, write 3 and carry 1. Tens: 8 + 2 + 1 carried = 11, write 1 and carry 1. Hundreds: 5 + 3 + 1 carried = 9. So 589 + 324 = 913." },
      { typed: true, q: "476 + 389 = ___", word: "865", cat: "ADD3",
        explain: "Ones: 6 + 9 = 15, write 5 and carry 1. Tens: 7 + 8 + 1 carried = 16, write 6 and carry 1. Hundreds: 4 + 3 + 1 carried = 8. So 476 + 389 = 865." },
      { typed: true, q: "867 + 145 = ___", word: "1012", cat: "ADD3",
        explain: "Ones: 7 + 5 = 12, write 2 and carry 1. Tens: 6 + 4 + 1 carried = 11, write 1 and carry 1. Hundreds: 8 + 1 + 1 carried = 10, write 0 and carry 1. Thousands: write the carried 1. So 867 + 145 = 1012." }
    ]
  }

};
