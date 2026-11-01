/* report-pdf.js — turns a subject's AI report into a PDF to download.

   The detailed wrong answers go in an appendix after the main report. It's made
   on this device, so the child's name can appear on it without ever being sent
   anywhere. Loaded, with jsPDF, only when a parent taps Download. */
(function () {
  "use strict";
  const PAGE_W = 210, PAGE_H = 297, MARGIN = 16, BODY = PAGE_W - MARGIN * 2, BOTTOM = PAGE_H - 21;
  const INK = [26, 36, 87], TEXT = [40, 44, 60], MUTED = [105, 112, 134], ACCENT = [190, 130, 20], LINE = [221, 226, 235], BAND = [243, 245, 250], WHITE = [255, 255, 255];
  const BAD = [176, 44, 38], GOOD = [28, 120, 66], WARN = [176, 112, 16], BLUE = [48, 92, 156];
  const BAD_TINT = [253, 241, 238], BAD_EDGE = [246, 222, 217], GOOD_TINT = [235, 247, 240], GOOD_EDGE = [208, 232, 221], WARN_TINT = [253, 245, 230], BLUE_TINT = [234, 241, 251];
  const STATUS_COLOR = { "Doing Well": GOOD, "Needs Practice": WARN, "Needs Attention": BAD, "Insufficient Evidence": MUTED };
  const PRIORITY_LOOK = { "High priority": [BAD, BAD_TINT], "Practise": [WARN, WARN_TINT], "Recheck": [BLUE, BLUE_TINT], "Low priority": [MUTED, BAND] };
  const TOPIC_COLS = [{ title: "Topic and level", w: 56 }, { title: "Result", w: 28 }, { title: "Status", w: 38 }, { title: "What it tells us", w: 56 }];
  const PLAN_COLS = [{ title: "First", w: 40 }, { title: "What to do", w: 82 }, { title: "How often", w: 28 }, { title: "Reassess", w: 28 }];
  const SINCE_COLS = [{ title: "Weakness", w: 128 }, { title: "Now", w: 50 }];
  const TYPE_COLS = [{ title: "Question type", w: 78 }, { title: "Level", w: 66 }, { title: "Right", w: 34 }];
  const WRONG_COLS = [{ title: "Question", w: 78 }, { title: "Answered", w: 36 }, { title: "Correct", w: 34 }, { title: "Missed", w: 16 }, { title: "Secs", w: 14 }];
  const SIZE = 10, LINE_H = 5, BASE = 3.6, PAD = 6, ROW_GAP = 2.2, CARD_GAP = 4;

  // The built-in PDF fonts only have Western letters, so swap or drop anything else.
  function plain(t) {
    return String(t == null ? "" : t)
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—−]/g, "-").replace(/…/g, "...").replace(/→/g, "->")
      .replace(/[^\x20-\x7E\xA0-\xFF\s]/g, "").replace(/\s+/g, " ").trim();
  }

  window.buildReportPdf = function (jsPDF, report) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const s = report.sections, st = report.stats, gaps = REPORT.splitGaps(s);
    let y = MARGIN;   // the top of whatever is drawn next

    const font = (size, weight, color) => { doc.setFont("helvetica", weight || "normal"); doc.setFontSize(size); doc.setTextColor.apply(doc, color || TEXT); };
    const newPage = () => { doc.addPage(); y = MARGIN; };
    const room = (needed) => { if (y + needed > BOTTOM) { newPage(); return true; } return false; };
    const wrap = (text, width, size, weight) => { font(size, weight); return doc.splitTextToSize(plain(text), width); };
    const fill = (color) => doc.setFillColor.apply(doc, color);
    const edge = (color) => { doc.setDrawColor.apply(doc, color); doc.setLineWidth(0.25); };
    function box(x, top, w, h, tint, border) { fill(tint); edge(border); doc.roundedRect(x, top, w, h, 1.2, 1.2, "FD"); }
    function rule() { edge(LINE); doc.line(MARGIN, y, PAGE_W - MARGIN, y); }

    function write(text, size, weight, color, after) {
      const lines = wrap(text, BODY, size, weight), high = size * 0.5;
      font(size, weight, color);
      lines.forEach(line => { room(high); doc.text(line, MARGIN, y + size * 0.36); y += high; });
      y += after || 0;
    }
    function heading(title, keepWith) {
      room(18 + keepWith);
      y += y > MARGIN ? 9 : 0;
      font(14, "bold", INK);
      doc.text(plain(title), MARGIN, y + 5);
      y += 7.5;
      doc.setDrawColor.apply(doc, ACCENT);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 5.5;
    }
    function subheading(title, keepWith) {
      room(10 + keepWith);
      font(11.5, "bold", INK);
      doc.text(plain(title), MARGIN, y + 4.2);
      y += 8;
    }

    function summaryBand(cards) {
      const w = BODY / cards.length, h = 24;
      box(MARGIN, y, BODY, h, BAND, LINE);
      cards.forEach((c, i) => {
        const x = MARGIN + i * w;
        if (i) doc.line(x, y, x, y + h);
        font(21, "bold", INK);
        doc.text(plain(c.value), x + 6, y + 11);
        font(9, "normal", MUTED);
        doc.text(plain(c.label), x + 6, y + 18.5);
      });
      y += h;
    }

    // Two boxes side by side, each with a title and bullet points.
    function twoBoxes(boxes) {
      const gap = 4, w = (BODY - gap) / 2, inner = w - PAD * 2 - 3.5;
      boxes.forEach(b => { b.lines = b.items.map(i => wrap(i, inner, SIZE)); });
      const high = (b) => b.lines.reduce((a, lines) => a + lines.length * LINE_H + 1.6, 0) + LINE_H + 2.5 + 9;
      const h = Math.max(high(boxes[0]), high(boxes[1]));
      room(h);
      boxes.forEach((b, i) => {
        const x = MARGIN + i * (w + gap);
        let top = y + 4.5;
        box(x, y, w, h, b.tint, b.border);
        font(SIZE, "bold", b.color);
        doc.text(plain(b.title), x + PAD, top + BASE);
        top += LINE_H + 2.5;
        b.lines.forEach(lines => {
          fill(b.color);
          doc.circle(x + PAD + 0.8, top + BASE - 1.1, 0.65, "F");
          font(SIZE, "normal", TEXT);
          lines.forEach(line => { doc.text(line, x + PAD + 3.5, top + BASE); top += LINE_H; });
          top += 1.6;
        });
      });
      y += h;
    }

    // A bold label with its text running straight on after it.
    function flow(label, text, width) {
      font(SIZE, "bold");
      const lead = doc.getTextWidth(label + " "), lines = [];
      font(SIZE, "normal");
      let line = "", space = width - lead;
      plain(text).split(" ").forEach(word => {
        const next = line ? line + " " + word : word;
        if (doc.getTextWidth(next) <= space) line = next;
        else { lines.push(line); line = word; space = width; }
      });
      lines.push(line);
      return { label, lead, lines };
    }
    function drawFlow(row, x) {
      font(SIZE, "bold", INK);
      doc.text(plain(row.label), x, y + BASE);
      font(SIZE, "normal", TEXT);
      row.lines.forEach((line, i) => { doc.text(line, x + (i ? 0 : row.lead), y + BASE); y += LINE_H; });
    }
    function noteBox(label, text) {
      const row = flow(label, text, BODY - PAD * 2), h = row.lines.length * LINE_H + 9;
      room(h);
      box(MARGIN, y, BODY, h, BAND, LINE);
      y += 4.5;
      drawFlow(row, MARGIN + PAD);
      y += 4.5;
    }

    // The child's answer and the correct answer, side by side.
    function answerPair(e, x, width) {
      const half = width / 2, inset = 3.5, cells = [
        { title: "Child's answer", text: e.answer || "nothing", tint: BAD_TINT, border: BAD_EDGE, color: BAD },
        { title: "Correct answer", text: e.correct, tint: GOOD_TINT, border: GOOD_EDGE, color: GOOD }
      ];
      cells.forEach(c => { c.lines = wrap(c.text, half - inset * 2, SIZE); });
      const high = Math.max(cells[0].lines.length, cells[1].lines.length) * LINE_H + 9.2;
      return {
        h: high + 3,
        draw() {
          cells.forEach((c, i) => {
            const left = x + i * half;
            box(left, y, half, high, c.tint, c.border);
            font(8.5, "normal", MUTED);
            doc.text(c.title, left + inset, y + 5.4);
            font(SIZE, "normal", c.color);
            c.lines.forEach((line, n) => doc.text(line, left + inset, y + 10.6 + n * LINE_H));
          });
          y += high + 3;
        }
      };
    }

    // A card stays together and moves whole to a new page if it can't fit. Each step knows its height.
    const cardHeight = (c) => c.steps.reduce((a, step) => a + step.h, 0) + PAD * 2;
    function card(c) {
      const h = cardHeight(c), whole = h <= BOTTOM - MARGIN;
      if (whole) {
        room(h);
        box(MARGIN, y, BODY, h, WHITE, LINE);
        fill(c.color);
        doc.rect(MARGIN, y + 0.6, 1.4, h - 1.2, "F");
      }
      y += PAD;
      c.steps.forEach(step => { if (!whole) room(step.h); step.draw(); });
      y += PAD;
    }
    function gapCard(w, n) {
      const x = MARGIN + PAD + 1, inner = BODY - PAD * 2 - 1, steps = [], look = PRIORITY_LOOK[w.priority];
      const label = w.priority.toUpperCase(), score = w.score ? w.score.correct + "/" + w.score.total + " correct" : "";
      font(8, "bold");
      const pill = doc.getTextWidth(label) + 6;
      font(9.5, "normal");
      const scoreW = score ? doc.getTextWidth(score) + 3.5 : 0;
      const title = wrap(String(n).padStart(2, "0") + ". " + w.topic, inner - pill - scoreW - 6, 12, "bold");
      const titleH = title.length * 6 + 2.4;
      steps.push({ h: titleH, draw() {
        font(12, "bold", INK);
        title.forEach((line, i) => doc.text(plain(line), x, y + 4.4 + i * 6));
        fill(look[1]);
        doc.roundedRect(x + inner - pill, y, pill, 5.6, 2.8, 2.8, "F");
        font(8, "bold", look[0]);
        doc.text(label, x + inner - pill / 2, y + 3.9, { align: "center" });
        if (score) { font(9.5, "normal", MUTED); doc.text(score, x + inner - pill - 3.5, y + 4.1, { align: "right" }); }
        y += titleH;
      } });
      const row = (name, text, gap) => {
        const r = flow(name, text, inner);
        steps.push({ h: r.lines.length * LINE_H + gap, draw() { drawFlow(r, x); y += gap; } });
      };
      row("Problem:", w.problem, ROW_GAP);
      w.examples.forEach(e => {
        row("Actual question:", e.question, ROW_GAP);
        steps.push(answerPair(e, x, inner));
      });
      row("Possible reason:", w.possible_reason, 1.6);
      row("How to teach:", w.how_to_teach, 1.6);
      row("Improvement target:", w.improvement_target, 0);
      return { steps, color: look[0] };
    }

    function tableHead(cols) {
      fill(INK);
      doc.rect(MARGIN, y, BODY, 8.5, "F");
      font(9.5, "bold", WHITE);
      let x = MARGIN + 3;
      cols.forEach(c => { doc.text(c.title, x, y + 5.6); x += c.w; });
      y += 8.5;
    }
    function tableRow(cols, texts, striped, styleOf) {
      const cells = texts.map((t, i) => wrap(t, cols[i].w - 5, 9.5));
      const high = Math.max.apply(null, cells.map(c => c.length)) * 4.7 + 4;
      if (room(high)) tableHead(cols);
      if (striped) { fill(BAND); doc.rect(MARGIN, y, BODY, high, "F"); }
      let x = MARGIN + 3;
      cells.forEach((lines, i) => {
        const look = styleOf ? styleOf(i) : ["normal", TEXT];
        font(9.5, look[0], look[1]);
        lines.forEach((line, n) => doc.text(line, x, y + 5.3 + n * 4.7));
        x += cols[i].w;
      });
      y += high;
    }

    write("QUEST ACADEMY / " + report.subject.toUpperCase(), 9, "bold", ACCENT, 1.5);
    write("Learning Progress Report", 23, "bold", INK, 1.5);
    write([report.student, report.date, "Based on " + st.assessments + " assessment" + (st.assessments === 1 ? "" : "s")].filter(Boolean).join(" | "), 10.5, "normal", MUTED, 6);
    summaryBand([
      { value: st.pct + "%", label: "Overall accuracy" },
      { value: String(gaps.top.length), label: gaps.top.length === 1 ? "Top priority" : "Top priorities" },
      { value: String(st.assessments), label: "Assessments reviewed" }
    ]);

    heading("1. Overall Performance", 12);
    write(s.summary, SIZE, "normal", TEXT, 5);
    twoBoxes([
      { title: "Top strengths", items: s.strengths, color: GOOD, tint: GOOD_TINT, border: GOOD_EDGE },
      { title: "Areas needing attention", items: s.attention, color: BAD, tint: BAD_TINT, border: BAD_EDGE }
    ]);
    y += 4;
    noteBox("Is there enough evidence?", s.evidence_note);

    heading("2. Performance by Topic", 20);
    tableHead(TOPIC_COLS);
    s.levels.forEach((l, i) => tableRow(TOPIC_COLS, [l.label, l.correct + "/" + l.total + " (" + l.pct + "%)", l.status, l.note], i % 2 === 1,
      (c) => (c === 2 ? ["bold", STATUS_COLOR[l.status] || TEXT] : ["normal", TEXT])));
    rule();

    const topCards = gaps.top.map((w, i) => gapCard(w, i + 1));
    const otherCards = gaps.others.map((w, i) => gapCard(w, topCards.length + i + 1));
    const firstCard = topCards[0] || otherCards[0];
    heading("3. Weakness Analysis", firstCard ? cardHeight(firstCard) + 8 : 10);
    if (!firstCard) write(REPORT.AI_NOTES.none, SIZE, "normal", MUTED);
    if (topCards.length) subheading(gaps.heading, cardHeight(topCards[0]));
    topCards.forEach((c, i) => { if (i) y += CARD_GAP; card(c); });
    if (otherCards.length) {
      if (topCards.length) y += 8;
      subheading("Other mistakes & what to practise", 8 + cardHeight(otherCards[0]));
      write(REPORT.AI_NOTES.others, 9.5, "normal", MUTED, 3.5);
      otherCards.forEach((c, i) => { if (i) y += CARD_GAP; card(c); });
    }

    if (s.plan.length) {
      heading("4. Recommended Practice Plan", 20);
      tableHead(PLAN_COLS);
      s.plan.forEach((p, i) => tableRow(PLAN_COLS, [(i + 1) + ". " + p.area, p.what_to_do, p.frequency, p.reassess], i % 2 === 1, (c) => (c === 0 ? ["bold", INK] : ["normal", TEXT])));
      rule();
    }
    if (s.since_last.length) {
      y += 8;
      subheading("Since the last report", 20);
      tableHead(SINCE_COLS);
      s.since_last.forEach((p, i) => tableRow(SINCE_COLS, [p.topic, p.progress], i % 2 === 1, (c) => (c === 1 ? ["bold", p.progress === "Resolved" || p.progress === "Improving" ? GOOD : p.progress === "Still needs practice" ? WARN : MUTED] : ["normal", TEXT])));
      rule();
    }
    y += 7;
    noteBox("On the next report:", REPORT.AI_NOTES.next);

    if (report.types.length) {
      const score = (t) => (t.pct == null ? t.rows.length + " wrong" : t.right + " of " + t.total + " (" + t.pct + "%)");
      newPage();
      heading("Appendix (optional): question types and every wrong answer", 0);
      write("Copied from the answers the app saved, not written by AI. Weakest type first. Missed is how many times it went wrong. Secs is the average seconds taken, where saved. Older assessments only keep up to 8 wrong answers each.", 9.5, "normal", MUTED, 6);
      tableHead(TYPE_COLS);
      report.types.forEach((t, i) => tableRow(TYPE_COLS, [t.name, t.level, score(t)], i % 2 === 1, (c) => (c === 0 ? ["bold", INK] : c === 2 ? ["bold", BAD] : ["normal", MUTED])));
      rule();
      y += 10;
      report.types.forEach(t => {
        room(34);
        write(t.name + ": " + score(t), 11, "bold", INK, 1);
        write(t.level, 9.5, "normal", MUTED, 3);
        tableHead(WRONG_COLS);
        t.rows.forEach((row, i) => tableRow(WRONG_COLS, [row.q, row.chosen.join(" / ") || "nothing", row.answer, String(row.times), row.sec == null ? "-" : String(row.sec)], i % 2 === 1,
          (c) => [c === 3 && row.times > 1 ? "bold" : "normal", c === 1 ? BAD : c === 2 ? GOOD : TEXT]));
        rule();
        y += 10;
      });
    }

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      y = PAGE_H - 14.5;
      rule();
      font(8, "normal", MUTED);
      doc.text("Written by Claude (AI) from saved results. Use it as a guide alongside what you know about your child.", MARGIN, PAGE_H - 10);
      doc.text("Page " + i + " of " + pages, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
    }
    return doc;
  };
})();
