//@ts-nocheck
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, FileText, BookOpen, Calendar, User, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "../utils/api";

export default function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("teacherToken");
        if (!token) return;
        const response = await apiFetch("/api/teacher/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTeacherName(data.name || "");
        }
      } catch (e) {}
    }
    fetchProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-purple-50">
      {/* Left Sidebar */}
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
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Teacher Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/teacher/students">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center hover:bg-purple-100 transition">
              <Users className="h-8 w-8 text-purple-700 mb-2" />
              <span className="font-semibold text-lg text-purple-800">Manage Students</span>
            </div>
          </Link>
          <Link to="/teacher/resources">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center hover:bg-purple-100 transition">
              <FileText className="h-8 w-8 text-purple-700 mb-2" />
              <span className="font-semibold text-lg text-purple-800">Resources</span>
            </div>
          </Link>
          <Link to="/teacher/quizzes">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center hover:bg-purple-100 transition">
              <BookOpen className="h-8 w-8 text-purple-700 mb-2" />
              <span className="font-semibold text-lg text-purple-800">Quizzes</span>
            </div>
          </Link>
        </div>
        {/* Personalized welcome message */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-purple-700 mb-4">
            {teacherName ? `Welcome, ${teacherName}!` : "Welcome to the Teacher Portal!"}
          </h3>
          <p className="text-purple-600">
            Use the sidebar to navigate between dashboard, calendar, resources, quizzes, and profile. Use the cards above to manage students, resources, and quizzes.
          </p>
        </div>
      </main>
    </div>
  );
} 