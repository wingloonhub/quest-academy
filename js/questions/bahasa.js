/* questions/bahasa.js — Bahasa Melayu ASSESSMENT questions, grouped topic → level.

   The topic and level ids must match js/data.js (subject "bahasa").
   Empty for now — add them as the Tahun 4 worksheets come in:

   window.QUESTIONS.bahasa = {
     kata_tanya: {
       level1: [
         { q: "___ nama adik kamu?", options: ["Bila", "Apakah", "Siapakah", "Mengapa"], answer: 2, cat: "orang" },
         { typed: true, q: "Buku itu ___ oleh Ali. (baca)", word: "dibaca", cat: "kata_pasif" },
         { spelling: true, word: "hadapan", hint: "Lawan bagi 'belakang'", cat: "kata_arah" }
       ]
     }
   };

   Same formats as English (see js/questions/english.js). Listen-and-spell
   words are read in a Malay voice (or Indonesian if the device has no Malay
   voice; if it has no voice at all, the word is shown instead).          */
window.QUESTIONS = window.QUESTIONS || {};
window.QUESTIONS.bahasa = {};
