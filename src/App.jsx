import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import QuizInterface from './components/QuizInterface';

const GRADE_SUBJECTS = {
  "Playgroup": ["Languages", "Number Work"],
  "PP1": ["Languages", "Number Work"],
  "PP2": ["Languages", "Number Work"],
  "default": ["English", "Kiswahili", "Math", "Environmental Science", "Pre-Tech", "CRE", "SST", "Integrated Science"]
};

// --- This component uses hooks, so it MUST be inside <Router> ---
const Dashboard = () => {
  const { grade, subject } = useParams();
  const navigate = useNavigate();

  const lookupKey = isNaN(grade) ? grade.charAt(0).toUpperCase() + grade.slice(1) : grade;
  const subjects = GRADE_SUBJECTS[lookupKey] || GRADE_SUBJECTS["default"];

  React.useEffect(() => {
    if (!subject && subjects.length > 0) {
      navigate(`/${grade}/${subjects[0].toLowerCase()}`, { replace: true });
    }
  }, [grade, subject, subjects, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex space-x-6 overflow-x-auto">
          {subjects.map((sub) => (
            <button key={sub} onClick={() => navigate(`/${grade}/${sub.toLowerCase()}`)}
              className={`py-4 px-2 whitespace-nowrap border-b-2 font-bold transition-all ${
                subject?.toLowerCase() === sub.toLowerCase() ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
              }`}>{sub}</button>
          ))}
          <button onClick={() => navigate('/')} className="py-4 px-2 text-red-400 text-sm">Change Grade</button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
            {isNaN(grade) ? grade : `Grade ${grade}`}
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-2 capitalize">{subject}</h2>
        </div>
        <QuizInterface subject={subject} grade={grade} />
      </main>
    </div>
  );
};

const GradeSelection = () => {
  const navigate = useNavigate();
  const grades = ["Playgroup", "PP1", "PP2", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Select Your Grade</h1>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
          {grades.map((g) => (
            <button key={g} onClick={() => navigate(`/${g.toLowerCase()}`)}
              className="p-3 rounded-lg border-2 font-semibold transition-all border-slate-100 hover:border-blue-500 hover:bg-blue-50">
              {isNaN(g) ? g : `Grade ${g}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP: No hooks allowed here! Only the Router setup ---
function App() {
  return (
      <Routes>
        <Route path="/" element={<GradeSelection />} />
        <Route path="/:grade" element={<Dashboard />} />
        <Route path="/:grade/:subject" element={<Dashboard />} />
        <Route path="/:grade/:subject/:strand" element={<Dashboard />} />
      </Routes>
  );
}

export default App;