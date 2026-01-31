import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Install this: npm install jspdf-autotable

export const downloadReport = (breakdown, score, total, subject, grade) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text(`${subject} Assessment Report`, 14, 20);
  doc.setFontSize(12);
  doc.text(`Grade: ${grade} | Score: ${score} / ${total}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

  // Table of Results
  const tableData = breakdown.map((item, index) => [
    index + 1,
    item.question,
    item.userAnswer || "No Answer",
    item.correctAnswer,
    item.isCorrect ? "✅" : "❌"
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['#', 'Question', 'Your Answer', 'Correct Answer', 'Result']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] } // Slate-800
  });

  doc.save(`${subject}_Grade${grade}_Report.pdf`);
};