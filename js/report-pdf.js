/* report-pdf.js — turns a subject's AI report into a PDF to download.

   It's made on this device, so the child's name can appear on it without ever
   being sent anywhere. Loaded, with jsPDF, only when a parent taps Download. */
(function () {
  "use strict";
  const PAGE_W = 210, PAGE_H = 297, MARGIN = 18, BODY = PAGE_W - MARGIN * 2, FOOT = 16;
  const INK = [26, 36, 87], TEXT = [40, 44, 60], MUTED = [105, 112, 134], ACCENT = [190, 130, 20], LINE = [221, 224, 233], STRIPE = [245, 246, 250], BAD = [176, 44, 38], GOOD = [28, 120, 66];
  const COLS = [
    { title: "Question", w: 80 },
    { title: "Answered", w: 34 },
    { title: "Correct", w: 32 },
    { title: "Missed", w: 15 },
    { title: "Secs", w: 13 }
  ];

  // The built-in PDF fonts only have Western letters, so swap or drop anything else.
  function plain(t) {
    return String(t == null ? "" : t)
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—−]/g, "-").replace(/…/g, "...").replace(/→/g, "->")
      .replace(/[^\x20-\x7E\xA0-\xFF\s]/g, "").replace(/\s+/g, " ").trim();
  }

  window.buildReportPdf = function (jsPDF, report) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = MARGIN;
    const style = (size, weight, color) => { doc.setFont("helvetica", weight || "normal"); doc.setFontSize(size); doc.setTextColor.apply(doc, color || TEXT); };
    const room = (needed) => { if (y + needed > PAGE_H - FOOT) { doc.addPage(); y = MARGIN; return true; } return false; };
    function write(text, x, width, size, weight, color, gap) {
      style(size, weight, color);
      const lineH = size * 0.45;
      doc.splitTextToSize(plain(text), width).forEach(line => { room(lineH); doc.text(line, x, y); y += lineH; });
      y += gap || 0;
    }
    function heading(title) {
      room(16);
      y += 3;
      write(title, MARGIN, BODY, 13, "bold", INK, 0.6);
      doc.setDrawColor.apply(doc, ACCENT);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y - 3, PAGE_W - MARGIN, y - 3);
      y += 2;
    }
    function bullet(item) {
      room(6);
      doc.setFillColor.apply(doc, ACCENT);
      doc.circle(MARGIN + 1, y - 1.3, 0.7, "F");
      if (typeof item === "string") return write(item, MARGIN + 5, BODY - 5, 10.5, "normal", TEXT, 1.4);
      write(item.area + (item.how_often ? " (" + item.how_often + ")" : ""), MARGIN + 5, BODY - 5, 10.5, "bold", INK, 0.3);
      write(item.detail, MARGIN + 5, BODY - 5, 10.5, "normal", TEXT, 1.6);
    }
    function tableHead() {
      doc.setFillColor.apply(doc, INK);
      doc.rect(MARGIN, y - 4, BODY, 6.2, "F");
      style(9, "bold", [255, 255, 255]);
      let x = MARGIN + 1.5;
      COLS.forEach(c => { doc.text(c.title, x, y); x += c.w; });
      y += 6;
    }
    function tableRow(row, shaded) {
      const cells = [row.q, row.chosen.join(" / ") || "nothing", row.answer, String(row.times), row.sec == null ? "-" : String(row.sec)]
        .map((t, i) => doc.splitTextToSize(plain(t), COLS[i].w - 3));
      const high = Math.max.apply(null, cells.map(c => c.length)) * 3.9 + 2;
      if (room(high)) { y += 4; tableHead(); }
      if (shaded) { doc.setFillColor.apply(doc, STRIPE); doc.rect(MARGIN, y - 3.4, BODY, high, "F"); }
      let x = MARGIN + 1.5;
      cells.forEach((lines, i) => {
        style(9, i === 3 && row.times > 1 ? "bold" : "normal", i === 1 ? BAD : i === 2 ? GOOD : TEXT);
        doc.text(lines, x, y);
        x += COLS[i].w;
      });
      y += high;
    }

    write("Quest Academy", MARGIN, BODY, 10, "bold", ACCENT, 5);
    write(report.subject + " report", MARGIN, BODY, 21, "bold", INK, 1.5);
    write("As of " + report.date + ", based on " + report.basedOn, MARGIN, BODY, 10.5, "normal", MUTED, 0.6);
    if (report.student) write("Student: " + report.student, MARGIN, BODY, 10.5, "normal", MUTED, 0.6);

    report.parts.forEach(part => {
      heading(part.title);
      if (typeof part.value === "string") return write(part.value, MARGIN, BODY, 10.5, "normal", TEXT, 1.4);
      if (!part.value || !part.value.length) return write("Nothing to report here yet.", MARGIN, BODY, 10.5, "normal", MUTED, 1.4);
      part.value.forEach(bullet);
    });

    if (report.wrong.length) {
      doc.addPage();
      y = MARGIN;
      heading("Details of the wrong answers");
      write("Copied from the answers the app saved, not written by AI. Most repeated first. Missed is how many times it went wrong. Secs is the average seconds taken, where saved. Older assessments only keep up to 8 wrong answers each.", MARGIN, BODY, 9.5, "normal", MUTED, 3);
      report.wrong.forEach(level => {
        room(20);
        write(level.label + " (" + level.rows.length + ")", MARGIN, BODY, 10.5, "bold", INK, 2.6);
        tableHead();
        level.rows.forEach((row, i) => tableRow(row, i % 2 === 1));
        y += 5;
      });
    }

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      style(8, "normal", MUTED);
      doc.text("Written by Claude (AI) from saved results. Use it as a guide alongside what you know about your child.", MARGIN, PAGE_H - 9);
      doc.text("Page " + i + " of " + pages, PAGE_W - MARGIN, PAGE_H - 9, { align: "right" });
    }
    return doc;
  };
})();
