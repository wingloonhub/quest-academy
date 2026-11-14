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

      // Kata kerja dasar bergambar, sheets 1 and 2. same: keeps one word to once a test.
      gambar1: [
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/01.png", options: ["Makan", "Pakai", "Belajar", "Ketawa"], answer: 0, cat: "RUTIN", same: "gambar01" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/02.png", options: ["Nyanyi", "Minum", "Panjat", "Sapu"], answer: 1, cat: "RUTIN", same: "gambar02" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/03.png", options: ["Susun", "Mandi", "Tidur", "Siram"], answer: 2, cat: "RUTIN", same: "gambar03" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/04.png", options: ["Tarik", "Bangun", "Bangga", "Jemur"], answer: 1, cat: "RUTIN", same: "gambar04" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/05.png", options: ["Marah", "Sepak", "Tanam", "Baca"], answer: 3, cat: "BELAJAR", same: "gambar05" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/06.png", options: ["Berenang", "Lihat", "Lap", "Tulis"], answer: 3, cat: "BELAJAR", same: "gambar06" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/07.png", options: ["Takut", "Lari", "Senyum", "Minum"], answer: 1, cat: "GERAK", same: "gambar07" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/08.png", options: ["Senyum", "Sapu", "Buka", "Jawab"], answer: 1, cat: "RUMAH", same: "gambar08" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/09.png", options: ["Tanya", "Jawab", "Masak", "Pujuk"], answer: 2, cat: "RUMAH", same: "gambar09" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/10.png", options: ["Peluk", "Gembira", "Siram", "Lupa"], answer: 2, cat: "RUMAH", same: "gambar10" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/11.png", options: ["Kongsi", "Tulis", "Mandi", "Lipat"], answer: 2, cat: "RUTIN", same: "gambar11" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/12.png", options: ["Gosok", "Jawab", "Makan", "Mandi"], answer: 0, cat: "RUTIN", same: "gambar12" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/13.png", options: ["Menari", "Beri", "Jumpa", "Pakai"], answer: 3, cat: "RUTIN", same: "gambar13" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/14.png", options: ["Sikat", "Tolak", "Basuh", "Buka"], answer: 3, cat: "RUMAH", same: "gambar14" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/15.png", options: ["Panjat", "Jemur", "Fikir", "Tidur"], answer: 1, cat: "RUMAH", same: "gambar15" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/16.png", options: ["Baja", "Lipat", "Sikat", "Terkejut"], answer: 1, cat: "RUMAH", same: "gambar16" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/17.png", options: ["Nyanyi", "Siram", "Mandi", "Susun"], answer: 3, cat: "RUMAH", same: "gambar17" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/18.png", options: ["Menangis", "Buka", "Tangkap", "Sapu"], answer: 1, cat: "RUMAH", same: "gambar14" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/19.png", options: ["Tangkap", "Duduk", "Tutup", "Gosok"], answer: 2, cat: "RUMAH", same: "gambar19" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/20.png", options: ["Sepak", "Kongsi", "Tolak", "Masak"], answer: 2, cat: "GERAK", same: "gambar20" }
      ],

      // Kata kerja dasar bergambar, sheets 3 and 4. Every answer is a different word.
      gambar2: [
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/21.png", options: ["Jumpa", "Tulis", "Tarik", "Letak"], answer: 2, cat: "BARANG", same: "gambar21" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/22.png", options: ["Kayuh", "Susun", "Ikat", "Angkat"], answer: 3, cat: "BARANG", same: "gambar22" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/23.png", options: ["Tepuk", "Sepak", "Masak", "Letak"], answer: 3, cat: "BARANG", same: "gambar23" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/24.png", options: ["Bantu", "Pegang", "Lipat", "Jawab"], answer: 1, cat: "BARANG", same: "gambar24" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/25.png", options: ["Sikat", "Gosok", "Menari", "Tangkap"], answer: 3, cat: "SUKAN", same: "gambar25" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/26.png", options: ["Terkejut", "Main", "Mandi", "Sepak"], answer: 3, cat: "SUKAN", same: "gambar26" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/27.png", options: ["Bantu", "Turun", "Gembira", "Baling"], answer: 3, cat: "SUKAN", same: "gambar27" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/28.png", options: ["Peluk", "Pandu", "Kayuh", "Baca"], answer: 2, cat: "SUKAN", same: "gambar28" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/29.png", options: ["Pujuk", "Sikat", "Pandu", "Bantu"], answer: 2, cat: "SUKAN", same: "gambar29" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/30.png", options: ["Sepak", "Tepuk", "Cakap", "Berenang"], answer: 3, cat: "SUKAN", same: "gambar30" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/31.png", options: ["Lompat", "Mandi", "Kayuh", "Menangis"], answer: 0, cat: "BADAN", same: "gambar31" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/32.png", options: ["Lari", "Panjat", "Bingung", "Jemur"], answer: 1, cat: "BADAN", same: "gambar32" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/33.png", options: ["Baja", "Senyum", "Beri", "Turun"], answer: 3, cat: "BADAN", same: "gambar33" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/34.png", options: ["Beri", "Duduk", "Belajar", "Penat"], answer: 1, cat: "BADAN", same: "gambar34" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/35.png", options: ["Angkat", "Berdiri", "Minum", "Tutup"], answer: 1, cat: "BADAN", same: "gambar35" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/36.png", options: ["Tanya", "Takut", "Gunting", "Lihat"], answer: 3, cat: "CAKAP", same: "gambar36" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/37.png", options: ["Dengar", "Bangga", "Bingung", "Ingat"], answer: 0, cat: "CAKAP", same: "gambar37" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/38.png", options: ["Cakap", "Marah", "Potong", "Kayuh"], answer: 0, cat: "CAKAP", same: "gambar38" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/39.png", options: ["Pandu", "Panjat", "Basuh", "Tanya"], answer: 3, cat: "CAKAP", same: "gambar39" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/40.png", options: ["Sepak", "Nyanyi", "Gosok", "Jawab"], answer: 3, cat: "CAKAP", same: "gambar40" }
      ],

      // Kata kerja dasar bergambar, sheets 5 and 6. 45 and 55 are left out: their pictures fit a second choice too.
      gambar3: [
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/41.png", options: ["Lari", "Nyanyi", "Fikir", "Lihat"], answer: 2, cat: "FIKIR", same: "gambar41" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/42.png", options: ["Pegang", "Tolak", "Sapu", "Ingat"], answer: 3, cat: "FIKIR", same: "gambar42" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/43.png", options: ["Terkejut", "Lihat", "Berdiri", "Lupa"], answer: 3, cat: "FIKIR", same: "gambar43" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/44.png", options: ["Beri", "Cari", "Lupa", "Lipat"], answer: 1, cat: "FIKIR", same: "gambar44" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/46.png", options: ["Tolak", "Potong", "Hilang", "Menangis"], answer: 2, cat: "BARANG", same: "gambar46" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/47.png", options: ["Ambil", "Melompat", "Baja", "Kering"], answer: 0, cat: "BARANG", same: "gambar47" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/48.png", options: ["Tebang", "Beri", "Susun", "Lihat"], answer: 1, cat: "BARANG", same: "gambar48" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/49.png", options: ["Terima", "Siram", "Gosok", "Hilang"], answer: 0, cat: "BARANG", same: "gambar49" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/50.png", options: ["Kongsi", "Gosok", "Cabut", "Pandu"], answer: 0, cat: "BARANG", same: "gambar50" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/51.png", options: ["Bantu", "Bawa", "Main", "Pegang"], answer: 0, cat: "SOSIAL", same: "gambar51" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/52.png", options: ["Pujuk", "Jumpa", "Nasihat", "Jemur"], answer: 0, cat: "SOSIAL", same: "gambar52" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/53.png", options: ["Lupa", "Marah", "Terima", "Lari"], answer: 1, cat: "SOSIAL", same: "gambar53" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/54.png", options: ["Tangkap", "Nasihat", "Tanya", "Masak"], answer: 1, cat: "SOSIAL", same: "gambar54" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/56.png", options: ["Belajar", "Basuh", "Tangkap", "Jemur"], answer: 0, cat: "AKTIVITI", same: "gambar56" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/57.png", options: ["Potong", "Latih", "Sikat", "Tulis"], answer: 1, cat: "AKTIVITI", same: "gambar57" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/58.png", options: ["Menari", "Baja", "Main", "Melompat"], answer: 2, cat: "AKTIVITI", same: "gambar58" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/59.png", options: ["Ingat", "Tangkap", "Senyum", "Nyanyi"], answer: 3, cat: "AKTIVITI", same: "gambar59" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/60.png", options: ["Fikir", "Buka", "Menari", "Sepak"], answer: 2, cat: "AKTIVITI", same: "gambar60" }
      ],

      // Kata kerja dasar bergambar, sheets 7 and 8. 63, 67, 68 and 69 are left out: their pictures show a different action.
      gambar4: [
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/61.png", options: ["Lipat", "Potong", "Ketawa", "Tepuk"], answer: 2, cat: "PERASAAN", same: "gambar61" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/62.png", options: ["Terkejut", "Cakap", "Menangis", "Ketuk"], answer: 2, cat: "PERASAAN", same: "gambar62" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/64.png", options: ["Gembira", "Cari", "Nyanyi", "Peluk"], answer: 0, cat: "PERASAAN", same: "gambar64" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/65.png", options: ["Angkat", "Bangga", "Siram", "Lompat"], answer: 1, cat: "PERASAAN", same: "gambar65" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/66.png", options: ["Takut", "Sepak", "Siram", "Tanam"], answer: 0, cat: "PERASAAN", same: "gambar66" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/70.png", options: ["Peluk", "Penat", "Berenang", "Bangun"], answer: 1, cat: "PERASAAN", same: "gambar70" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/71.png", options: ["Panjat", "Lap", "Bosan", "Tanya"], answer: 1, cat: "RUMAH", same: "gambar71" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/72.png", options: ["Pandu", "Jemur", "Basuh", "Bosan"], answer: 2, cat: "RUMAH", same: "gambar72" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/73.png", options: ["Lihat", "Minum", "Dengar", "Letak"], answer: 1, cat: "DIRI", same: "gambar73" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/74.png", options: ["Kayuh", "Lupa", "Sikat", "Buka"], answer: 2, cat: "DIRI", same: "gambar74" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/75.png", options: ["Duduk", "Bosan", "Ikat", "Gosok"], answer: 2, cat: "RUMAH", same: "gambar75" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/76.png", options: ["Tarik", "Tepuk", "Tanam", "Main"], answer: 2, cat: "KEBUN", same: "gambar76" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/77.png", options: ["Baja", "Gembira", "Lompat", "Bingung"], answer: 0, cat: "KEBUN", same: "gambar77" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/78.png", options: ["Sepak", "Jumpa", "Siram", "Ingat"], answer: 2, cat: "KEBUN", same: "gambar78" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/79.png", options: ["Potong", "Tanam", "Bangga", "Baling"], answer: 0, cat: "KEBUN", same: "gambar79" },
          { q: "Apakah perbuatan dalam gambar?", pic: "img/kata_kerja/80.png", options: ["Buka", "Marah", "Cari", "Ketuk"], answer: 3, cat: "RUMAH", same: "gambar80" }
      ]
    }
  },

  pemahaman_kosa_kata: {

    anggota_badan: {

      // Muka & Kepala, from Wing's labelled picture "Bahagian-Bahagian Muka dan Kepala": 15 parts, all asked
      // every test. The face is drawn by ART.tapPicture("face") without its labels; `part` is the shape to tap.
      // Level 1: the word in Bahasa, tap the part.
      level1: [
          { tap: "face", part: "kepala", q: "Di manakah kepala?", word: "kepala", same: "kepala", cat: "KEPALA" },
          { tap: "face", part: "rambut", q: "Di manakah rambut?", word: "rambut", same: "rambut", cat: "KEPALA" },
          { tap: "face", part: "dahi", q: "Di manakah dahi?", word: "dahi", same: "dahi", cat: "KEPALA" },
          { tap: "face", part: "telinga", q: "Di manakah telinga?", word: "telinga", same: "telinga", cat: "KEPALA" },
          { tap: "face", part: "kening", q: "Di manakah kening?", word: "kening", same: "kening", cat: "MATA" },
          { tap: "face", part: "bulu_mata", q: "Di manakah bulu mata?", word: "bulu mata", same: "bulu_mata", cat: "MATA" },
          { tap: "face", part: "mata", q: "Di manakah mata?", word: "mata", same: "mata", cat: "MATA" },
          { tap: "face", part: "pipi", q: "Di manakah pipi?", word: "pipi", same: "pipi", cat: "MUKA" },
          { tap: "face", part: "hidung", q: "Di manakah hidung?", word: "hidung", same: "hidung", cat: "MUKA" },
          { tap: "face", part: "dagu", q: "Di manakah dagu?", word: "dagu", same: "dagu", cat: "MUKA" },
          { tap: "face", part: "leher", q: "Di manakah leher?", word: "leher", same: "leher", cat: "MUKA" },
          { tap: "face", part: "bibir", q: "Di manakah bibir?", word: "bibir", same: "bibir", cat: "MULUT" },
          { tap: "face", part: "gigi", q: "Di manakah gigi?", word: "gigi", same: "gigi", cat: "MULUT" },
          { tap: "face", part: "mulut", q: "Di manakah mulut?", word: "mulut", same: "mulut", cat: "MULUT" },
          { tap: "face", part: "lidah", q: "Di manakah lidah?", word: "lidah", same: "lidah", cat: "MULUT" }
      ],

      // Level 2: the word in English, tap the part and write it in Bahasa.
      level2: [
          { tap: "face", write: true, part: "kepala", q: "head", word: "kepala", same: "kepala", cat: "KEPALA" },
          { tap: "face", write: true, part: "rambut", q: "hair", word: "rambut", same: "rambut", cat: "KEPALA" },
          { tap: "face", write: true, part: "dahi", q: "forehead", word: "dahi", same: "dahi", cat: "KEPALA" },
          { tap: "face", write: true, part: "telinga", q: "ear", word: "telinga", same: "telinga", cat: "KEPALA" },
          { tap: "face", write: true, part: "kening", q: "eyebrow", word: "kening", same: "kening", cat: "MATA" },
          { tap: "face", write: true, part: "bulu_mata", q: "eyelashes", word: "bulu mata", same: "bulu_mata", cat: "MATA" },
          { tap: "face", write: true, part: "mata", q: "eye", word: "mata", same: "mata", cat: "MATA" },
          { tap: "face", write: true, part: "pipi", q: "cheek", word: "pipi", same: "pipi", cat: "MUKA" },
          { tap: "face", write: true, part: "hidung", q: "nose", word: "hidung", same: "hidung", cat: "MUKA" },
          { tap: "face", write: true, part: "dagu", q: "chin", word: "dagu", same: "dagu", cat: "MUKA" },
          { tap: "face", write: true, part: "leher", q: "neck", word: "leher", same: "leher", cat: "MUKA" },
          { tap: "face", write: true, part: "bibir", q: "lips", word: "bibir", same: "bibir", cat: "MULUT" },
          { tap: "face", write: true, part: "gigi", q: "teeth", word: "gigi", same: "gigi", cat: "MULUT" },
          { tap: "face", write: true, part: "mulut", q: "mouth", word: "mulut", same: "mulut", cat: "MULUT" },
          { tap: "face", write: true, part: "lidah", q: "tongue", word: "lidah", same: "lidah", cat: "MULUT" }
      ]
    },

    hari_dalam_seminggu: {

      // Level 1 — the 7 days: choose the Bahasa word for the English day (7 choices, shuffled for every
      // question), or hear the day and spell it. same: the day, so each day comes up once a test — 7
      // questions, a mix of both kinds. spellFirst (data.js): the spelling ones come first, so the choices
      // (all 7 days, spelled out) can't show how to spell them.
      level1: [
        // Choose: English → Bahasa Melayu
        { q: "Monday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 4, same: "isnin", cat: "PILIH",
          explain: "Monday = Isnin. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        { q: "Tuesday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 2, same: "selasa", cat: "PILIH",
          explain: "Tuesday = Selasa. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        { q: "Wednesday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 6, same: "rabu", cat: "PILIH",
          explain: "Wednesday = Rabu. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        { q: "Thursday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 0, same: "khamis", cat: "PILIH",
          explain: "Thursday = Khamis. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        { q: "Friday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 3, same: "jumaat", cat: "PILIH",
          explain: "Friday = Jumaat. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        { q: "Saturday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 5, same: "sabtu", cat: "PILIH",
          explain: "Saturday = Sabtu. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        { q: "Sunday = ___", options: ["Khamis", "Ahad", "Selasa", "Jumaat", "Isnin", "Sabtu", "Rabu"], answer: 1, same: "ahad", cat: "PILIH",
          explain: "Sunday = Ahad. Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad = Monday to Sunday." },
        // Hear and spell (read aloud in Malay)
        { spelling: true, word: "Isnin", same: "isnin", cat: "EJA",
          explain: "Isnin (Monday) is spelled I-S-N-I-N." },
        { spelling: true, word: "Selasa", same: "selasa", cat: "EJA",
          explain: "Selasa (Tuesday) is spelled S-E-L-A-S-A." },
        { spelling: true, word: "Rabu", same: "rabu", cat: "EJA",
          explain: "Rabu (Wednesday) is spelled R-A-B-U." },
        { spelling: true, word: "Khamis", same: "khamis", cat: "EJA",
          explain: "Khamis (Thursday) is spelled K-H-A-M-I-S." },
        { spelling: true, word: "Jumaat", same: "jumaat", cat: "EJA",
          explain: "Jumaat (Friday) is spelled J-U-M-A-A-T." },
        { spelling: true, word: "Sabtu", same: "sabtu", cat: "EJA",
          explain: "Sabtu (Saturday) is spelled S-A-B-T-U." },
        { spelling: true, word: "Ahad", same: "ahad", cat: "EJA",
          explain: "Ahad (Sunday) is spelled A-H-A-D." }
      ]
    }
  }
};
