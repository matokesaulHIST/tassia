import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const QuizInterface = ({ subject, grade, strand }) => {
  const [strands, setStrands] = useState({}); // Stores questions grouped by strand
  const [strandNames, setStrandNames] = useState([]); // List of strand names
  const [currentStrandIndex, setCurrentStrandIndex] = useState(0); // Navigation state
  
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState(null);

  const API_BASE_URL = "https://histbooks.onrender.com";

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!subject || !grade) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/questions/${grade}/${subject}`);
        
        let fetchedData = response.data;

        // 1. If a specific strand is requested via URL, filter the data first
        if (strand) {
          fetchedData = fetchedData.filter(q => 
            q.strand?.toLowerCase() === strand.toLowerCase().replace(/-/g, ' ')
          );
        }

        // 2. Group the (potentially filtered) questions by strand
        const grouped = fetchedData.reduce((acc, q) => {
          const strandName = q.strand || "General";
          if (!acc[strandName]) acc[strandName] = [];
          acc[strandName].push(q);
          return acc;
        }, {});

        setStrands(grouped);
        setStrandNames(Object.keys(grouped));
        setCurrentStrandIndex(0); 
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Could not load questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [subject, grade, strand]);

  const currentStrandName = strandNames[currentStrandIndex];
  const currentQuestions = strands[currentStrandName] || [];

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const generatePDF = (breakdown) => {
    if (!breakdown || breakdown.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Assessment Marking Scheme", 14, 20);
      doc.setFontSize(12);
      doc.text(`Subject: ${subject.toUpperCase()} | Strand: ${currentStrandName}`, 14, 30);
      doc.text(`Grade: ${grade} | Date: ${new Date().toLocaleDateString()}`, 14, 37);

      const tableRows = breakdown.map((item, index) => [
        index + 1,
        item.question || "N/A",
        item.correctAnswer || "N/A"
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['#', 'Question', 'Correct Answer']],
        body: tableRows,
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`${subject}_${currentStrandName}_Results.pdf`);
    } catch (err) {
      toast.error("Failed to generate PDF.");
    }
  };

  const handleSubmit = async () => {
    const currentQuestionIds = currentQuestions.map(q => q._id);
    const answeredCurrent = currentQuestionIds.some(id => answers[id]);

    if (!answeredCurrent) {
      toast.error("Please answer the questions for this strand!");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentAnswers = {};
      currentQuestionIds.forEach(id => {
        if (answers[id]) currentAnswers[id] = answers[id];
      });

      const response = await axios.post(`${API_BASE_URL}/grade-quiz`, { answers: currentAnswers });
      setResults(response.data);
      setShowModal(true);
      
      toast.success(`${currentStrandName} Completed!`);
      generatePDF(response.data.breakdown);
    } catch (error) {
      toast.error('Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStrand = () => {
    setShowModal(false);
    setCurrentStrandIndex(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Strands...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <Toaster position="top-center" />
      
      {/* 3. Empty State: Show this if no questions exist after filtering */}
      {strandNames.length === 0 ? (
        <div className="text-center p-20 bg-white border-2 border-dashed rounded-3xl text-slate-400">
           <div className="text-5xl mb-4">🔍</div>
           <p className="text-xl font-medium">No questions found for this selection.</p>
           <p className="text-sm">If your URL is okay, sit tight we're updating questions for {subject} {strand ? `(${strand})` : ''}</p>
        </div>
      ) : (
        <>
          {/* Strand Progress Header */}
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider">Current Strand</p>
            <h2 className="text-2xl font-black text-slate-800">{currentStrandName}</h2>
            <div className="w-full bg-slate-200 h-2 mt-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500" 
                style={{ width: `${((currentStrandIndex + 1) / strandNames.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-6">
            {currentQuestions.map((q, index) => (
              <div key={q._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-lg font-bold text-slate-800 mb-4">{index + 1}. {q.questionText}</p>
                {q.isTypeOpen ? (
                  <input
                    type="text"
                    className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type answer..."
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                ) : (
                  <div className="grid gap-3">
                    {q.options?.map((opt) => (
                      <label key={opt} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[q._id] === opt ? "bg-blue-50 border-blue-500" : "bg-white border-slate-100"}`}>
                        <input type="radio" name={q._id} className="hidden" onChange={() => handleAnswerChange(q._id, opt)} />
                        <span className={`w-4 h-4 rounded-full border-2 mr-3 ${answers[q._id] === opt ? "bg-blue-600 border-blue-600" : "bg-white"}`} />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full py-5 rounded-2xl font-black text-xl mt-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-all"
          >
            {isSubmitting ? "GRADING..." : `SUBMIT ${currentStrandName.toUpperCase()}`}
          </button>
        </>
      )}

      {/* Results Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800">{currentStrandName} Results</h3>
            <div className="my-6">
              <span className="text-6xl font-black text-blue-600">{results?.score}</span>
              <span className="text-2xl text-slate-300">/{results?.total}</span>
            </div>

            {currentStrandIndex < strandNames.length - 1 ? (
              <button 
                onClick={handleNextStrand} 
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"
              >
                CONTINUE TO NEXT TOPIC
                <span>→</span>
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-green-600 font-bold">🎉 All strands completed!</p>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold"
                >
                  FINISH ASSESSMENT
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface;