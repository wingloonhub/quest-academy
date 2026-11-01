/* questions/bahasa.js — Bahasa Melayu ASSESSMENT questions, grouped module → topic → level.

   The ids must match js/data.js (subject "bahasa"). Add more as the Tahun 4
   worksheets come in:

   window.QUESTIONS.bahasa = {
     kata_tugas: {                    ← module
       kata_tanya: {                  ← topic
         level1: [                    ← level
           { q: "___ nama adik kamu?", options: ["Bila", "Apakah", "Siapakah", "Mengapa"], answer: 2, cat: "orang" },
           { typed: true, q: "Buku itu ___ oleh Ali. (baca)", word: "dibaca", cat: "kata_pasif" },
           { spelling: true, word: "hadapan", hint: "Lawan bagi 'belakang'", cat: "kata_arah" }
         ]
       }
     }
   };

   Picture questions: pic: "img/<folder>/01.png" shows the picture above the question,
   and its answer word is saved with the result for the reports.

   Same formats as English (see js/questions/english.js). Listen-and-spell
   words are read in a Malay voice (or Indonesian if the device has no Malay
   voice; if it has no voice at all, the word is shown instead).          */
window.QUESTIONS = window.QUESTIONS || {};
window.QUESTIONS.bahasa = {

  pembentukan_kata: {

    kata_dasar: {

      // Kata kerja dasar bergambar: 20 pictures, each in 4 versions. same: keeps a picture to once a test.
      level1: [
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/01.png", options: ["basuh", "siram", "tulis", "masak"], answer: 1, cat: "RUMAH", same: "gambar01" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/02.png", options: ["potong", "tendang", "masak", "makan"], answer: 2, cat: "RUMAH", same: "gambar02" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/03.png", options: ["sapu", "bangun", "baca", "siram"], answer: 2, cat: "BELAJAR", same: "gambar03" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/04.png", options: ["siram", "tanam", "tidur", "tulis"], answer: 3, cat: "BELAJAR", same: "gambar04" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/05.png", options: ["lari", "tangkap", "makan", "masak"], answer: 0, cat: "GERAK", same: "gambar05" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/06.png", options: ["buka", "makan", "tendang", "basuh"], answer: 2, cat: "GERAK", same: "gambar06" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/07.png", options: ["tendang", "tanam", "buka", "baling"], answer: 3, cat: "GERAK", same: "gambar07" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/08.png", options: ["tangkap", "tendang", "gosok", "buka"], answer: 0, cat: "GERAK", same: "gambar08" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/09.png", options: ["sapu", "tulis", "tidur", "baca"], answer: 0, cat: "RUMAH", same: "gambar09" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/10.png", options: ["mop", "gosok", "sapu", "buka"], answer: 0, cat: "RUMAH", same: "gambar10" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/11.png", options: ["bangun", "lipat", "basuh", "mop"], answer: 2, cat: "RUTIN", same: "gambar11" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/12.png", options: ["tanam", "tulis", "gosok", "buka"], answer: 2, cat: "RUTIN", same: "gambar12" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/13.png", options: ["minum", "buka", "makan", "tulis"], answer: 2, cat: "RUTIN", same: "gambar13" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/14.png", options: ["tidur", "makan", "minum", "masak"], answer: 2, cat: "RUTIN", same: "gambar14" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/15.png", options: ["tangkap", "siram", "masak", "tidur"], answer: 3, cat: "RUTIN", same: "gambar15" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/16.png", options: ["siram", "makan", "gosok", "bangun"], answer: 3, cat: "RUTIN", same: "gambar16" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/17.png", options: ["baca", "tidur", "tanam", "sapu"], answer: 2, cat: "RUMAH", same: "gambar17" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/18.png", options: ["potong", "baling", "tulis", "baca"], answer: 0, cat: "BELAJAR", same: "gambar18" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/19.png", options: ["minum", "lipat", "sapu", "tulis"], answer: 1, cat: "RUMAH", same: "gambar19" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/20.png", options: ["minum", "tendang", "basuh", "buka"], answer: 3, cat: "BELAJAR", same: "gambar20" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/01.png", options: ["tidur", "lipat", "basuh", "siram"], answer: 3, cat: "RUMAH", same: "gambar01" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/02.png", options: ["basuh", "siram", "masak", "lari"], answer: 2, cat: "RUMAH", same: "gambar02" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/03.png", options: ["baling", "sapu", "baca", "tulis"], answer: 2, cat: "BELAJAR", same: "gambar03" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/04.png", options: ["sapu", "lipat", "tanam", "tulis"], answer: 3, cat: "BELAJAR", same: "gambar04" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/05.png", options: ["minum", "gosok", "lari", "siram"], answer: 2, cat: "GERAK", same: "gambar05" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/06.png", options: ["tangkap", "siram", "baling", "tendang"], answer: 3, cat: "GERAK", same: "gambar06" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/07.png", options: ["tidur", "baca", "mop", "baling"], answer: 3, cat: "GERAK", same: "gambar07" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/08.png", options: ["lipat", "tangkap", "potong", "basuh"], answer: 1, cat: "GERAK", same: "gambar08" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/09.png", options: ["sapu", "tanam", "minum", "masak"], answer: 0, cat: "RUMAH", same: "gambar09" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/10.png", options: ["tidur", "gosok", "basuh", "mop"], answer: 3, cat: "RUMAH", same: "gambar10" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/11.png", options: ["tendang", "gosok", "sapu", "basuh"], answer: 3, cat: "RUTIN", same: "gambar11" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/12.png", options: ["lipat", "tanam", "gosok", "sapu"], answer: 2, cat: "RUTIN", same: "gambar12" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/13.png", options: ["minum", "makan", "sapu", "baling"], answer: 1, cat: "RUTIN", same: "gambar13" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/14.png", options: ["tulis", "bangun", "minum", "buka"], answer: 2, cat: "RUTIN", same: "gambar14" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/15.png", options: ["sapu", "masak", "tidur", "siram"], answer: 2, cat: "RUTIN", same: "gambar15" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/16.png", options: ["bangun", "minum", "masak", "baca"], answer: 0, cat: "RUTIN", same: "gambar16" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/17.png", options: ["buka", "tanam", "baca", "lari"], answer: 1, cat: "RUMAH", same: "gambar17" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/18.png", options: ["potong", "baca", "gosok", "mop"], answer: 0, cat: "BELAJAR", same: "gambar18" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/19.png", options: ["tendang", "lipat", "lari", "siram"], answer: 1, cat: "RUMAH", same: "gambar19" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/20.png", options: ["mop", "buka", "masak", "bangun"], answer: 1, cat: "BELAJAR", same: "gambar20" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/01.png", options: ["masak", "siram", "gosok", "tendang"], answer: 1, cat: "RUMAH", same: "gambar01" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/02.png", options: ["buka", "tangkap", "masak", "tidur"], answer: 2, cat: "RUMAH", same: "gambar02" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/03.png", options: ["lipat", "baca", "makan", "tidur"], answer: 1, cat: "BELAJAR", same: "gambar03" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/04.png", options: ["makan", "bangun", "tendang", "tulis"], answer: 3, cat: "BELAJAR", same: "gambar04" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/05.png", options: ["lari", "tanam", "makan", "minum"], answer: 0, cat: "GERAK", same: "gambar05" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/06.png", options: ["gosok", "tidur", "tangkap", "tendang"], answer: 3, cat: "GERAK", same: "gambar06" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/07.png", options: ["gosok", "baling", "tanam", "tidur"], answer: 1, cat: "GERAK", same: "gambar07" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/08.png", options: ["tangkap", "sapu", "gosok", "makan"], answer: 0, cat: "GERAK", same: "gambar08" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/09.png", options: ["bangun", "tendang", "sapu", "minum"], answer: 2, cat: "RUMAH", same: "gambar09" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/10.png", options: ["tidur", "siram", "mop", "lipat"], answer: 2, cat: "RUMAH", same: "gambar10" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/11.png", options: ["basuh", "bangun", "baca", "tidur"], answer: 0, cat: "RUTIN", same: "gambar11" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/12.png", options: ["sapu", "lipat", "masak", "gosok"], answer: 3, cat: "RUTIN", same: "gambar12" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/13.png", options: ["makan", "tendang", "lari", "sapu"], answer: 0, cat: "RUTIN", same: "gambar13" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/14.png", options: ["baca", "lipat", "tulis", "minum"], answer: 3, cat: "RUTIN", same: "gambar14" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/15.png", options: ["tidur", "mop", "siram", "tulis"], answer: 0, cat: "RUTIN", same: "gambar15" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/16.png", options: ["gosok", "bangun", "mop", "sapu"], answer: 1, cat: "RUTIN", same: "gambar16" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/17.png", options: ["buka", "lipat", "tanam", "mop"], answer: 2, cat: "RUMAH", same: "gambar17" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/18.png", options: ["lipat", "potong", "lari", "tangkap"], answer: 1, cat: "BELAJAR", same: "gambar18" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/19.png", options: ["mop", "lipat", "sapu", "tulis"], answer: 1, cat: "RUMAH", same: "gambar19" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/20.png", options: ["buka", "masak", "bangun", "baca"], answer: 0, cat: "BELAJAR", same: "gambar20" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/01.png", options: ["lipat", "tidur", "siram", "mop"], answer: 2, cat: "RUMAH", same: "gambar01" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/02.png", options: ["baling", "tangkap", "tendang", "masak"], answer: 3, cat: "RUMAH", same: "gambar02" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/03.png", options: ["baca", "siram", "minum", "mop"], answer: 0, cat: "BELAJAR", same: "gambar03" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/04.png", options: ["tendang", "tulis", "masak", "siram"], answer: 1, cat: "BELAJAR", same: "gambar04" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/05.png", options: ["tidur", "lari", "potong", "buka"], answer: 1, cat: "GERAK", same: "gambar05" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/06.png", options: ["gosok", "basuh", "tendang", "bangun"], answer: 2, cat: "GERAK", same: "gambar06" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/07.png", options: ["baling", "lari", "basuh", "tulis"], answer: 0, cat: "GERAK", same: "gambar07" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/08.png", options: ["tangkap", "tidur", "baling", "potong"], answer: 0, cat: "GERAK", same: "gambar08" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/09.png", options: ["tulis", "sapu", "baca", "mop"], answer: 1, cat: "RUMAH", same: "gambar09" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/10.png", options: ["baling", "makan", "baca", "mop"], answer: 3, cat: "RUMAH", same: "gambar10" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/11.png", options: ["makan", "tangkap", "lari", "basuh"], answer: 3, cat: "RUTIN", same: "gambar11" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/12.png", options: ["lipat", "gosok", "tendang", "tangkap"], answer: 1, cat: "RUTIN", same: "gambar12" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/13.png", options: ["buka", "lari", "makan", "baca"], answer: 2, cat: "RUTIN", same: "gambar13" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/14.png", options: ["masak", "buka", "minum", "bangun"], answer: 2, cat: "RUTIN", same: "gambar14" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/15.png", options: ["tidur", "bangun", "baling", "basuh"], answer: 0, cat: "RUTIN", same: "gambar15" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/16.png", options: ["makan", "tanam", "tulis", "bangun"], answer: 3, cat: "RUTIN", same: "gambar16" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/17.png", options: ["siram", "tanam", "baca", "tendang"], answer: 1, cat: "RUMAH", same: "gambar17" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/18.png", options: ["tulis", "makan", "potong", "basuh"], answer: 2, cat: "BELAJAR", same: "gambar18" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/19.png", options: ["tanam", "lari", "sapu", "lipat"], answer: 3, cat: "RUMAH", same: "gambar19" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_dasar/20.png", options: ["basuh", "buka", "sapu", "makan"], answer: 1, cat: "BELAJAR", same: "gambar20" }
      ]
    }
  }
};
