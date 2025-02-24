import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  FileText,
  HelpCircle as Quiz,
  User,
  Bookmark,
  Calendar,
  Bot,
} from "lucide-react";
import { Link } from "react-router-dom";

interface SubjectMarks {
  subject: string;
  cia1: number;
  cia2: number;
  midSem: number;
  endSem: number;
}

export default function ProfilePage() {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/profile", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
      })
        .then((response) => response.json())
        .then((data) => setUserData(data))
        .catch((error) => console.error("Error fetching profile:", error));
    }
  }, []);

  const handleViewAnalysisClick = () => {
    setShowDetailedAnalysis(true);
  };

  const handleBackToStatsClick = () => {
    setShowDetailedAnalysis(false);
    setSelectedSubject(null); // Reset selected subject when going back
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
  };

  // Mock data for detailed marks
  const subjectMarks: SubjectMarks[] = [
    {
      subject: "COA",
      cia1: 18,
      cia2: 17,
      midSem: 40,
      endSem: 80,
    },
    {
      subject: "DSA",
      cia1: 19,
      cia2: 18,
      midSem: 45,
      endSem: 85,
    },
    {
      subject: "DLDA",
      cia1: 16,
      cia2: 18,
      midSem: 42,
      endSem: 78,
    },
    {
      subject: "Maths",
      cia1: 20,
      cia2: 19,
      midSem: 48,
      endSem: 90,
    },
    {
      subject: "DBMS",
      cia1: 17,
      cia2: 18,
      midSem: 40,
      endSem: 75,
    },
    {
      subject: "Python",
      cia1: 19,
      cia2: 20,
      midSem: 47,
      endSem: 88,
    },
    {
      subject: "Lab",
      cia1: 19,
      cia2: 18,
      midSem: 45,
      endSem: 85,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Side Menu */}
      <aside className="w-64 bg-purple-800 text-white p-4">
        <div className="flex items-center mb-8">
        <img src="/ES_logo2.png" alt="Your Logo" className="w-20 h-20 mr-2" />
          <h1 className="text-2xl font-bold">EduSage</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/home">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Discussion Forum
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/Resources">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Resources
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/quiz">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <Quiz className="mr-2 h-4 w-4" />
                  Quizzes
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/profile">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/bookmark">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmarks
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/calendar">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/ai">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-white hover:text-black transition-colors"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        {/* <header className="bg-purple-800 text-white p-4">
          <div className="container mx-auto flex items-center">
            <BookOpen className="w-8 h-8 mr-2" />
            <h1 className="text-2xl font-bold">EduSage</h1>
          </div>
        </header> */}

        {/* Main content */}
        <main className="container mx-auto mt-8 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-6">
              <img
                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                alt="Student Photo"
                className="w-48 h-48 rounded-full object-cover mb-4 md:mb-0 md:mr-6"
              />
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">
                  {userData ? userData.name : "Loading..."}
                </h2>
                <Button
                  onClick={() => setIsStatsOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Check my stats
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Roll No.:</p>
                <p>{userData ? userData.rollno : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Name:</p>
                <p>{userData ? userData.name : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Branch:</p>
                <p>{userData ? userData.branch : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Semester:</p>
                <p>{userData ? userData.sem : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Email:</p>
                <p>{userData ? userData.email : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Phone Number:</p>
                <p>{userData ? userData.phone : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Date of Birth:</p>
                <p>
                  {userData
                    ? new Date(userData.dateOfBirth).toLocaleDateString()
                    : "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Dialog for stats */}
        <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Student Stats</DialogTitle>
            </DialogHeader>
            {!showDetailedAnalysis ? (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Overall Result</h3>
                  <Progress value={85} className="w-full bg-purple-200" />
                  <p className="text-sm text-right">85%</p>
                  <Button
                    variant="ghost"
                    className="mt-2 text-purple-600"
                    onClick={handleViewAnalysisClick}
                  >
                    View Detailed Analysis
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Class Average Result</h3>
                  <Progress value={75} className="w-full bg-purple-200" />
                  <p className="text-sm text-right">75%</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold">CIA Average</h3>
                    <Progress value={80} className="w-full bg-purple-200" />
                    <p className="text-sm text-right">80%</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Mid Sem Average</h3>
                    <Progress value={70} className="w-full bg-purple-200" />
                    <p className="text-sm text-right">70%</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">End Sem Average</h3>
                    <Progress value={90} className="w-full bg-purple-200" />
                    <p className="text-sm text-right">90%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  variant="ghost"
                  className="text-purple-600"
                  onClick={handleBackToStatsClick}
                >
                  Back to Stats
                </Button>
                <h3 className="font-semibold text-xl mt-4">
                  Detailed Marks Analysis for {selectedSubject}
                </h3>
                <div className="mt-2">
                  {subjectMarks
                    .filter((subject) => subject.subject === selectedSubject)
                    .map((subject) => (
                      <div key={subject.subject} className="mb-4">
                        <p>CIA 1: {subject.cia1}</p>
                        <p>CIA 2: {subject.cia2}</p>
                        <p>Mid Sem: {subject.midSem}</p>
                        <p>End Sem: {subject.endSem}</p>
                      </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {subjectMarks.map((subject) => (
                    <Button
                      key={subject.subject}
                      className="bg-purple-600 text-white"
                      onClick={() => {
                        handleSubjectClick(subject.subject);
                      }}
                    >
                      {subject.subject}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
