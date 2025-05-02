//@ts-nocheck
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { Users, FileText, BookOpen, Calendar, User, ListChecks, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts';

const SUBJECTS = ["MES", "OS", "CN", "EM-4", "SE"];

export default function TeacherStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAddEditMarkModal, setShowAddEditMarkModal] = useState(false);
  const [editMark, setEditMark] = useState<any>(null);
  const [markForm, setMarkForm] = useState({ subject: "", cia1: "", cia2: "", midSem: "", endSem: "" });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [classGraph, setClassGraph] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchLeaderboard();
    fetchClassGraph();
  }, []);

  async function fetchStudents() {
    try {
      const res = await apiFetch("/api/teacher/students", { headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` } });
      setStudents(await res.json());
    } catch (e) { setError("Failed to load students"); }
  }
  async function fetchLeaderboard() {
    try {
      const res = await apiFetch("/api/teacher/class/leaderboard", { headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` } });
      setLeaderboard(await res.json());
    } catch (e) {}
  }
  async function fetchClassGraph() {
    try {
      const res = await apiFetch("/api/teacher/class/graph", { headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` } });
      setClassGraph(await res.json());
    } catch (e) {}
  }
  async function fetchMarks(rollno: any) {
    try {
      const res = await apiFetch(`/api/teacher/students/${rollno}/marks`, { headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` } });
      setMarks(await res.json());
    } catch (e) { setError("Failed to load marks"); }
  }
  async function fetchQuizAttempts(rollno: any) {
    try {
      const res = await apiFetch(`/api/teacher/students/${rollno}/quizAttempts`, { headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` } });
      setQuizAttempts(await res.json());
    } catch (e) { setError("Failed to load quiz attempts"); }
  }

  function openMarksModal(student: any) {
    setSelectedStudent(student);
    fetchMarks(student.rollno);
    setShowMarksModal(true);
  }
  function openQuizModal(student: any) {
    setSelectedStudent(student);
    fetchQuizAttempts(student.rollno);
    setShowQuizModal(true);
  }
  function openAddEditMarkModal(mark: any) {
    setEditMark(mark);
    setMarkForm(mark ? { ...mark } : { subject: "", cia1: "", cia2: "", midSem: "", endSem: "" });
    setShowAddEditMarkModal(true);
  }
  async function handleSaveMark() {
    if (!selectedStudent) return;
    try {
      const method = editMark ? "PUT" : "POST";
      const url = editMark ? `/api/teacher/students/${selectedStudent.rollno}/marks/${editMark._id}` : `/api/teacher/students/${selectedStudent.rollno}/marks`;
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("teacherToken")}` },
        body: JSON.stringify(markForm),
      });
      if (res.ok) {
        fetchMarks(selectedStudent.rollno);
        setShowAddEditMarkModal(false);
      } else {
        setError("Failed to save mark");
      }
    } catch (e) { setError("Failed to save mark"); }
  }
  async function handleDeleteMark(id: any) {
    if (!selectedStudent) return;
    if (!window.confirm("Delete this mark?")) return;
    try {
      const res = await apiFetch(`/api/teacher/students/${selectedStudent.rollno}/marks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` },
      });
      if (res.ok) fetchMarks(selectedStudent.rollno);
      else setError("Failed to delete mark");
    } catch (e) { setError("Failed to delete mark"); }
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
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Manage Students</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-purple-100">
                <th className="p-2">Name</th>
                <th className="p-2">Roll No</th>
                <th className="p-2">Branch</th>
                <th className="p-2">Semester</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollno} className="border-b">
                  <td className="p-2">{student.name}</td>
                  <td className="p-2">{student.rollno}</td>
                  <td className="p-2">{student.branch}</td>
                  <td className="p-2">{student.sem}</td>
                  <td className="p-2 space-x-2">
                    <Button onClick={() => openMarksModal(student)} size="sm">Marks</Button>
                    <Button onClick={() => openQuizModal(student)} size="sm" variant="outline">Quiz Attempts</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Marks Modal */}
        {showMarksModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
              <button className="absolute top-4 right-4 text-purple-700 text-2xl" onClick={() => setShowMarksModal(false)} aria-label="Close">✕</button>
              <h3 className="text-2xl font-bold mb-6 text-purple-800">Marks for {selectedStudent?.name} ({selectedStudent?.rollno})</h3>
              <Button className="mb-4" onClick={() => openAddEditMarkModal(null)} size="lg">Add Mark</Button>
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full bg-white rounded shadow text-base">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="p-3">Subject</th><th className="p-3">CIA1</th><th className="p-3">CIA2</th><th className="p-3">MidSem</th><th className="p-3">EndSem</th><th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((mark) => (
                      <tr key={mark._id} className="border-b hover:bg-purple-50">
                        <td className="p-3">{mark.subject}</td>
                        <td className="p-3">{mark.cia1}</td>
                        <td className="p-3">{mark.cia2}</td>
                        <td className="p-3">{mark.midSem}</td>
                        <td className="p-3">{mark.endSem}</td>
                        <td className="p-3 space-x-2">
                          <Button size="sm" onClick={() => openAddEditMarkModal(mark)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteMark(mark._id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Add/Edit Mark Modal */}
        {showAddEditMarkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
              <button className="absolute top-4 right-4 text-purple-700 text-2xl" onClick={() => setShowAddEditMarkModal(false)} aria-label="Close">✕</button>
              <h3 className="text-2xl font-bold mb-6 text-purple-800">{editMark ? "Edit Mark" : "Add Mark"}</h3>
              <form className="grid grid-cols-1 gap-4" onSubmit={e => { e.preventDefault(); handleSaveMark(); }}>
                <div>
                  <Label>Subject</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={markForm.subject}
                    onChange={e => setMarkForm(f => ({ ...f, subject: e.target.value }))}
                    required
                  >
                    <option value="">Select Subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CIA1</Label>
                    <Input type="number" value={markForm.cia1} onChange={e => setMarkForm(f => ({ ...f, cia1: e.target.value }))} min={0} max={20} required />
                  </div>
                  <div>
                    <Label>CIA2</Label>
                    <Input type="number" value={markForm.cia2} onChange={e => setMarkForm(f => ({ ...f, cia2: e.target.value }))} min={0} max={20} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>MidSem</Label>
                    <Input type="number" value={markForm.midSem} onChange={e => setMarkForm(f => ({ ...f, midSem: e.target.value }))} min={0} max={30} required />
                  </div>
                  <div>
                    <Label>EndSem</Label>
                    <Input type="number" value={markForm.endSem} onChange={e => setMarkForm(f => ({ ...f, endSem: e.target.value }))} min={0} max={50} required />
                  </div>
                </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                <Button className="mt-4 w-full" type="submit">{editMark ? "Save Changes" : "Add Mark"}</Button>
              </form>
            </div>
          </div>
        )}
        {/* Quiz Attempts Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative overflow-y-auto max-h-[90vh]">
              <button className="absolute top-4 right-4 text-purple-700 text-2xl" onClick={() => setShowQuizModal(false)} aria-label="Close">✕</button>
              <h3 className="text-2xl font-bold mb-6 text-purple-800">Quiz Attempts for {selectedStudent?.name} ({selectedStudent?.rollno})</h3>
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full bg-white rounded shadow text-base">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="p-3">Quiz</th><th className="p-3">Score</th><th className="p-3">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizAttempts.map((attempt) => (
                      <tr key={attempt._id} className="border-b hover:bg-purple-50">
                        <td className="p-3">{attempt.quizId?.title}</td>
                        <td className="p-3">{attempt.totalScore}</td>
                        <td className="p-3">{attempt.timeTaken} s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Graphs for Leaderboard and Class Average Marks */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow p-4">
            <h4 className="text-md font-semibold mb-2 text-purple-700">Leaderboard Line Graph</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={leaderboard.map((s, i) => ({ ...s, index: i + 1 }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={{ fontSize: 12 }} label={{ value: 'Rank', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const s = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded shadow text-sm">
                        <div><span className="font-semibold">{s.name}</span> ({s.rollno})</div>
                        <div>Wisdom Points: <span className="font-semibold">{s.wisdomPoints}</span></div>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="wisdomPoints" stroke="#7c3aed" name="Wisdom Points" strokeWidth={1.5} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <h4 className="text-md font-semibold mb-2 text-purple-700">Class Average Marks by Subject (Line Graph)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={classGraph} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} label={{ value: 'Subject', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const g = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded shadow text-sm">
                        <div><span className="font-semibold">{g._id}</span></div>
                        <div>Avg Marks: <span className="font-semibold">{g.avgMarks?.toFixed(2)}</span></div>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="avgMarks" stroke="#7c3aed" name="Avg Marks" strokeWidth={1.5} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Leaderboard and Class Graph Cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-lg font-bold mb-2 flex items-center text-purple-700"><BarChart2 className="mr-2" />Class Leaderboard</h3>
            <ol className="list-decimal ml-6 text-base">
              {leaderboard.map((s) => (
                <li key={s.rollno} className="mb-1">{s.name} ({s.rollno}) - <span className="font-semibold text-purple-700">{s.wisdomPoints} pts</span></li>
              ))}
            </ol>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-lg font-bold mb-2 flex items-center text-purple-700"><BarChart2 className="mr-2" />Class Average Marks by Subject</h3>
            <ul className="text-base">
              {classGraph.map((g) => (
                <li key={g._id} className="mb-1">{g._id}: <span className="font-semibold text-purple-700">{g.avgMarks?.toFixed(2)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
} 