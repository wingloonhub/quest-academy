/* questions/english.js — English ASSESSMENT questions, grouped module → topic → level.

   The ids must match js/data.js (subject "english").
   Add more modules, topics and levels as the worksheets come in:

   window.QUESTIONS.english = {
     grammar: {                    ← module
       conjunctions: {             ← topic
         level1: [ ...questions... ]   ← level
       }
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
const PRONOUN_RULES = {
  I: "Use “I” when you talk about yourself. “I” is always a capital letter.",
  YOU: "Use “you” for the person you are talking to.",
  HE: "Use “he” for one boy or man.",
  SHE: "Use “she” for one girl or woman.",
  IT: "Use “it” for one thing or animal.",
  WE: "Use “we” for yourself and others together — “… and I” becomes “we”.",
  THEY: "Use “they” for more than one person, animal or thing."
};
window.QUESTIONS.english = {

  grammar: {

    // Grammar → Pronouns → Level 1 — write ONE pronoun (I, you, he, she, it, we, they); 15 picked at random per assessment.
    // Source: Materials/English/Pronouns/Level 1 - Quest_Academy_80_Pronouns_One_Word_Answers.docx
    // Answers are typed on the letter keyboard and checked without caring about capitals; a blank
    // that starts a sentence shows a capital letter. Q78 (the nurse) also accepts "He".
    pronouns: {
      level1: [
        { typed: true, q: "Adam is riding his bicycle. ___ is wearing a helmet.", word: "He", cat: "HE" },
        { typed: true, q: "Adam and Ben are playing chess. ___ are taking turns.", word: "They", cat: "THEY" },
        { typed: true, q: "Sara likes to draw. ___ uses coloured pencils.", word: "She", cat: "SHE" },
        { typed: true, q: "My sister and I are making sandwiches. ___ will share them.", word: "We", cat: "WE" },
        { typed: true, q: "The cat is sleeping on the sofa. ___ looks comfortable.", word: "It", cat: "IT" },
        { typed: true, q: "Teacher, are ___ going to show us the picture?", word: "you", cat: "YOU" },
        { typed: true, q: "My name is Daniel. ___ am eight years old.", word: "I", cat: "I" },
        { typed: true, q: "My father cooks dinner on Sundays. ___ makes delicious noodles.", word: "He", cat: "HE" },
        { typed: true, q: "My parents are shopping. ___ will be home soon.", word: "They", cat: "THEY" },
        { typed: true, q: "My mother is a doctor. ___ helps sick people.", word: "She", cat: "SHE" },
        { typed: true, q: "Dad and I went fishing. ___ caught two fish.", word: "We", cat: "WE" },
        { typed: true, q: "My phone needs charging. ___ has a low battery.", word: "It", cat: "IT" },
        { typed: true, q: "Ryan, did ___ bring your homework?", word: "you", cat: "YOU" },
        { typed: true, q: "I am speaking about myself. ___ like reading comics.", word: "I", cat: "I" },
        { typed: true, q: "Ben has a new backpack. ___ takes it to school.", word: "He", cat: "HE" },
        { typed: true, q: "The children are singing. ___ know all the words.", word: "They", cat: "THEY" },
        { typed: true, q: "The girl won the race. ___ ran very quickly.", word: "She", cat: "SHE" },
        { typed: true, q: "My friends and I are cleaning the classroom. ___ are working together.", word: "We", cat: "WE" },
        { typed: true, q: "The bus is late today. ___ has not arrived yet.", word: "It", cat: "IT" },
        { typed: true, q: "Mum, can ___ help me tie my shoes?", word: "you", cat: "YOU" },
        { typed: true, q: "My name is Aisha. ___ live near the school.", word: "I", cat: "I" },
        { typed: true, q: "The king waved to the crowd. ___ smiled warmly.", word: "He", cat: "HE" },
        { typed: true, q: "Three birds landed on the roof. ___ flew away together.", word: "They", cat: "THEY" },
        { typed: true, q: "Mrs Tan reads us stories. ___ has a big book collection.", word: "She", cat: "SHE" },
        { typed: true, q: "Mum and I planted a tree. ___ water it every day.", word: "We", cat: "WE" },
        { typed: true, q: "The apple fell from the tree. ___ rolled onto the grass.", word: "It", cat: "IT" },
        { typed: true, q: "Excuse me, sir. Are ___ waiting for this bus?", word: "you", cat: "YOU" },
        { typed: true, q: "I am introducing myself. ___ have two pets.", word: "I", cat: "I" },
        { typed: true, q: "Mr Lim teaches mathematics. ___ explains each step.", word: "He", cat: "HE" },
        { typed: true, q: "Sara and Nina are cousins. ___ visit each other often.", word: "They", cat: "THEY" },
        { typed: true, q: "My sister plays badminton. ___ practises every Friday.", word: "She", cat: "SHE" },
        { typed: true, q: "My brother and I love puzzles. ___ solve them after dinner.", word: "We", cat: "WE" },
        { typed: true, q: "This book is very interesting. ___ has colourful pictures.", word: "It", cat: "IT" },
        { typed: true, q: "Lisa, have ___ seen my ruler?", word: "you", cat: "YOU" },
        { typed: true, q: "My name is Ethan. ___ enjoy cycling.", word: "I", cat: "I" },
        { typed: true, q: "My brother enjoys swimming. ___ goes to the pool weekly.", word: "He", cat: "HE" },
        { typed: true, q: "The teachers are in a meeting. ___ will return later.", word: "They", cat: "THEY" },
        { typed: true, q: "The queen entered the hall. ___ wore a golden crown.", word: "She", cat: "SHE" },
        { typed: true, q: "Our class and I are visiting the museum. ___ are excited.", word: "We", cat: "WE" },
        { typed: true, q: "The moon is bright tonight. ___ lights up the sky.", word: "It", cat: "IT" },
        { typed: true, q: "Dad, will ___ read me a story?", word: "you", cat: "YOU" },
        { typed: true, q: "I am writing about my day. ___ woke up early.", word: "I", cat: "I" },
        { typed: true, q: "The boy lost his pencil. ___ looked under the table.", word: "He", cat: "HE" },
        { typed: true, q: "The puppies are barking. ___ want to go outside.", word: "They", cat: "THEY" },
        { typed: true, q: "Aunt Mei bakes bread. ___ shares it with neighbours.", word: "She", cat: "SHE" },
        { typed: true, q: "My cousins and I built a sandcastle. ___ took a photo of it.", word: "We", cat: "WE" },
        { typed: true, q: "The bicycle has a flat tyre. ___ needs repairing.", word: "It", cat: "IT" },
        { typed: true, q: "Auntie, do ___ want some tea?", word: "you", cat: "YOU" },
        { typed: true, q: "My name is Hana. ___ can play the violin.", word: "I", cat: "I" },
        { typed: true, q: "The policeman stopped the traffic. ___ helped the children cross.", word: "He", cat: "HE" },
        { typed: true, q: "My shoes are muddy. ___ need cleaning.", word: "They", cat: "THEY" },
        { typed: true, q: "Grandma is planting roses. ___ loves gardening.", word: "She", cat: "SHE" },
        { typed: true, q: "Grandma and I are baking cookies. ___ need more flour.", word: "We", cat: "WE" },
        { typed: true, q: "My pencil case is blue. ___ has two zips.", word: "It", cat: "IT" },
        { typed: true, q: "Hello, Sam! Are ___ ready for the quiz?", word: "you", cat: "YOU" },
        { typed: true, q: "I am telling you my favourite colour. ___ like green.", word: "I", cat: "I" },
        { typed: true, q: "Grandpa waters the plants. ___ does it every morning.", word: "He", cat: "HE" },
        { typed: true, q: "The boys finished their homework. ___ went outside to play.", word: "They", cat: "THEY" },
        { typed: true, q: "Nina forgot her umbrella. ___ got wet in the rain.", word: "She", cat: "SHE" },
        { typed: true, q: "My team and I practised hard. ___ are ready for the match.", word: "We", cat: "WE" },
        { typed: true, q: "The cake smells delicious. ___ is cooling on the table.", word: "It", cat: "IT" },
        { typed: true, q: "Miss Lee, could ___ explain the question again?", word: "you", cat: "YOU" },
        { typed: true, q: "My name is Amir. ___ want to be a pilot.", word: "I", cat: "I" },
        { typed: true, q: "Uncle Ravi drives a bus. ___ starts work early.", word: "He", cat: "HE" },
        { typed: true, q: "Two buses arrived together. ___ stopped near the gate.", word: "They", cat: "THEY" },
        { typed: true, q: "The actress waved to her fans. ___ thanked them.", word: "She", cat: "SHE" },
        { typed: true, q: "My neighbour and I picked up litter. ___ kept the park clean.", word: "We", cat: "WE" },
        { typed: true, q: "The puppy is hungry. ___ is waiting for its food.", word: "It", cat: "IT" },
        { typed: true, q: "Grandpa, did ___ enjoy the movie?", word: "you", cat: "YOU" },
        { typed: true, q: "I am describing my lunch. ___ ate rice and chicken.", word: "I", cat: "I" },
        { typed: true, q: "The prince opened the door. ___ greeted the guests.", word: "He", cat: "HE" },
        { typed: true, q: "The girls made a poster. ___ displayed it in class.", word: "They", cat: "THEY" },
        { typed: true, q: "Priya paints beautiful pictures. ___ hangs them in her room.", word: "She", cat: "SHE" },
        { typed: true, q: "The clock stopped working. ___ needs a new battery.", word: "It", cat: "IT" },
        { typed: true, q: "Ben, are ___ coming to my birthday party?", word: "you", cat: "YOU" },
        { typed: true, q: "Jason is practising the piano. ___ has a concert tomorrow.", word: "He", cat: "HE" },
        { typed: true, q: "The books are on the shelf. ___ belong to the library.", word: "They", cat: "THEY" },
        { typed: true, q: "The nurse checked my temperature. ___ was very kind.", word: "She", alt: ["He"], cat: "SHE",
          explain: "A nurse can be a man or a woman, so “he” and “she” are both right." },
        { typed: true, q: "The flower is opening. ___ looks beautiful.", word: "It", cat: "IT" },
        { typed: true, q: "Sara, can ___ pass me the glue?", word: "you", cat: "YOU" }
      ].map(q => Object.assign({ instr: "Type ONE pronoun: I, you, he, she, it, we or they.", explain: PRONOUN_RULES[q.cat] }, q))
    }
  }

};

