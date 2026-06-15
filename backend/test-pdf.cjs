const PDFDocument = require('pdfkit');
async function run() {
  console.log("Starting PDF test...");
  try {
    const doc = new PDFDocument();
    doc.registerFont('TestFont', 'non-existent-font.ttf');
    console.log("Registered font successfully.");
    doc.font('TestFont').text('Hello World');
    console.log("Wrote text successfully.");
    doc.end();
  } catch(e) {
    console.error("Caught error:", e.message);
  }
}
run();
