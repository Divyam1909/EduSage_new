//@ts-nocheck
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { BookOpen, Calendar, User, ListChecks, FileText } from "lucide-react";

const SUBJECTS = ["MES", "OS", "CN", "EM-4", "SE"];
const DIFFICULTY = ["Novice", "Adept", "Sage"];

interface Question {
  questionText: string;
  isMCQ: boolean;
  options: string[];
  correctAnswer: string;
  marks: number;
}

export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    topic: SUBJECTS[0],
    difficulty: DIFFICULTY[0],
    timeLimit: 10,
    points: 10,
    questions: [] as Question[],
    clearable: true,
  });
  const [questionForm, setQuestionForm] = useState<Question>({
    questionText: "",
    isMCQ: true,
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 1,
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchQuizzes(); }, []);

  async function fetchQuizzes() {
    try {
      const res = await apiFetch("/api/quizzes");
      setQuizzes(await res.json());
    } catch (e) { setError("Failed to load quizzes"); }
  }
  function openModal(quiz: any = null) {
    setEditQuiz(quiz);
    if (quiz) {
      setForm({
        title: quiz.title,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        timeLimit: quiz.timeLimit,
        points: quiz.points,
        questions: quiz.questions,
        clearable: quiz.clearable ?? true,
      });
    } else {
      setForm({
        title: "",
        topic: SUBJECTS[0],
        difficulty: DIFFICULTY[0],
        timeLimit: 10,
        points: 10,
        questions: [],
        clearable: true,
      });
    }
    setShowModal(true);
    setEditingQuestionIndex(null);
    setQuestionForm({ questionText: "", isMCQ: true, options: ["", "", "", ""], correctAnswer: "", marks: 1 });
  }
  async function handleSave() {
    try {
      if (form.questions.length === 0) {
        setError("Add at least one question");
        return;
      }
      const totalMarks = form.questions.reduce((sum, q) => sum + Number(q.marks), 0);
      if (totalMarks !== Number(form.points)) {
        setError(`Total marks (${totalMarks}) must match quiz points (${form.points})`);
        return;
      }
      const method = editQuiz ? "PUT" : "POST";
      const url = editQuiz ? `/api/quizzes/${editQuiz._id}` : "/api/quizzes";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        fetchQuizzes();
        setShowModal(false);
      } else {
        setError("Failed to save quiz");
      }
    } catch (e) { setError("Failed to save quiz"); }
  }
  async function handleDelete(id: any) {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      const res = await apiFetch(`/api/quizzes/${id}`, { method: "DELETE" });
      if (res.ok) fetchQuizzes();
      else setError("Failed to delete quiz");
    } catch (e) { setError("Failed to delete quiz"); }
  }
  function handleAddQuestion() {
    if (!questionForm.questionText || !questionForm.correctAnswer) {
      setError("Question text and correct answer are required");
      return;
    }
    if (questionForm.isMCQ && questionForm.options.some(opt => !opt)) {
      setError("All MCQ options are required");
      return;
    }
    if (editingQuestionIndex !== null) {
      // Edit existing
      const updated = [...form.questions];
      updated[editingQuestionIndex] = { ...questionForm };
      setForm({ ...form, questions: updated });
      setEditingQuestionIndex(null);
    } else {
      setForm({ ...form, questions: [...form.questions, { ...questionForm }] });
    }
    setQuestionForm({ questionText: "", isMCQ: true, options: ["", "", "", ""], correctAnswer: "", marks: 1 });
    setError("");
  }
  function handleEditQuestion(idx: number) {
    setEditingQuestionIndex(idx);
    setQuestionForm({ ...form.questions[idx] });
  }
  function handleDeleteQuestion(idx: number) {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== idx) });
    setEditingQuestionIndex(null);
    setError("");
  }

  return (
    <div className="flex min-h-screen bg-purple-50">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-800 text-white p-4 min-h-screen">
        <div className="flex items-center mb-8">
          <img src="/ES_logo2.png" alt="EduSage Logo" className="w-20 h-20 mr-2" />
          <h1 className="text-2xl font-bold">EduSage</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li><Link to="/teacher/dashboard"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><ListChecks className="mr-2 h-4 w-4" />Dashboard</Button></Link></li>
            <li><Link to="/teacher/resources"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><BookOpen className="mr-2 h-4 w-4" />Resources</Button></Link></li>
            <li><Link to="/teacher/quizzes"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><FileText className="mr-2 h-4 w-4" />Quizzes</Button></Link></li>
            <li><Link to="/teacher/calendar"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><Calendar className="mr-2 h-4 w-4" />Calendar</Button></Link></li>
            <li><Link to="/teacher/profile"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><User className="mr-2 h-4 w-4" />Profile</Button></Link></li>
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Manage Quizzes</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Button className="mb-4" onClick={() => openModal()}>Add Quiz</Button>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-purple-100">
                <th className="p-2">Title</th>
                <th className="p-2">Topic</th>
                <th className="p-2">Difficulty</th>
                <th className="p-2">Points</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz._id} className="border-b">
                  <td className="p-2">{quiz.title}</td>
                  <td className="p-2">{quiz.topic}</td>
                  <td className="p-2">{quiz.difficulty}</td>
                  <td className="p-2">{quiz.points}</td>
                  <td className="p-2 space-x-2">
                    <Button onClick={() => openModal(quiz)} size="sm">Edit</Button>
                    <Button onClick={() => handleDelete(quiz._id)} size="sm" variant="destructive">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative overflow-y-auto max-h-[90vh]">
              <button className="absolute top-4 right-4 text-purple-700 text-2xl" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
              <h3 className="text-2xl font-bold mb-6 text-purple-800">{editQuiz ? "Edit Quiz" : "Add Quiz"}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <select className="w-full p-2 border rounded" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <select className="w-full p-2 border rounded" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                      {DIFFICULTY.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Time Limit (minutes)</Label>
                    <Input type="number" value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Points</Label>
                    <Input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} />
                  </div>
                  <div className="flex items-center mt-6">
                    <input type="checkbox" checked={form.clearable} onChange={e => setForm(f => ({ ...f, clearable: e.target.checked }))} />
                    <Label className="ml-2">Allow clearing attempts</Label>
                  </div>
                </div>
                <hr className="my-4" />
                <h4 className="font-bold text-lg mb-2">Questions</h4>
                <div className="space-y-2">
                  {form.questions.map((q, idx) => (
                    <div key={idx} className="border p-3 rounded-lg mb-2 bg-purple-50">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                        <span className="font-semibold">Q{idx + 1}: {q.questionText}</span>
                        <span className="space-x-2 mt-2 md:mt-0">
                          <Button size="sm" variant="outline" onClick={() => handleEditQuestion(idx)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteQuestion(idx)}>Delete</Button>
                        </span>
                      </div>
                      <div className="text-sm">Type: <span className="font-semibold">{q.isMCQ ? "MCQ" : "Text"}</span></div>
                      {q.isMCQ && <div className="text-sm">Options: <span className="font-semibold">{q.options.join(", ")}</span></div>}
                      <div className="text-sm">Correct: <span className="font-semibold">{q.correctAnswer}</span></div>
                      <div className="text-sm">Marks: <span className="font-semibold">{q.marks}</span></div>
                    </div>
                  ))}
                </div>
                <div className="border p-4 rounded-lg mt-4 bg-purple-50">
                  <Label className="font-semibold text-base mb-2 block">{editingQuestionIndex !== null ? "Edit Question" : "Add Question"}</Label>
                  <Input className="mb-2" placeholder="Question Text" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} />
                  <div className="flex items-center mb-2 space-x-6">
                    <label className="flex items-center"><input type="radio" checked={questionForm.isMCQ} onChange={() => setQuestionForm(f => ({ ...f, isMCQ: true }))} className="mr-2" /> MCQ</label>
                    <label className="flex items-center"><input type="radio" checked={!questionForm.isMCQ} onChange={() => setQuestionForm(f => ({ ...f, isMCQ: false, options: ["", "", "", ""] }))} className="mr-2" /> Text</label>
                  </div>
                  {questionForm.isMCQ && (
                    <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {questionForm.options.map((opt, i) => (
                        <Input key={i} className="mb-1" placeholder={`Option ${i + 1}`} value={opt} onChange={e => setQuestionForm(f => ({ ...f, options: f.options.map((o, idx) => idx === i ? e.target.value : o) }))} />
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Correct Answer</Label>
                      <Input className="mb-2" placeholder="Correct Answer" value={questionForm.correctAnswer} onChange={e => setQuestionForm(f => ({ ...f, correctAnswer: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Marks</Label>
                      <Input type="number" className="mb-2" value={questionForm.marks} onChange={e => setQuestionForm(f => ({ ...f, marks: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <Button size="sm" className="mt-2 w-full" onClick={handleAddQuestion}>{editingQuestionIndex !== null ? "Save Question" : "Add Question"}</Button>
                </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                <div className="flex justify-end gap-4 mt-6">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button className="bg-purple-700 text-white" onClick={handleSave}>{editQuiz ? "Save Changes" : "Add Quiz"}</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 