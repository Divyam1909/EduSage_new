import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Bell,
  Search,
  HelpCircle,
  Users,
  FileText,
  HelpCircle as Quiz,
  User,
  Bookmark,
  Calendar,
  Bot,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Helper to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Helper to compute initials from a name string
const getInitials = (name: string) =>
  name.split(" ").map((word) => word[0]).join("");

export default function Home() {
  const [userData, setUserData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjectMarks, setSubjectMarks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [topSages, setTopSages] = useState<any[]>([]);
  const [openSubjects, setOpenSubjects] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch logged-in user profile, top sages, and subject marks from backend
  useEffect(() => {
    if (token) {
      // Fetch user profile
      fetch("http://localhost:5000/profile", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      })
        .then((res) => res.json())
        .then((data) => setUserData(data))
        .catch((err) => console.error("Error fetching profile:", err));

      // Fetch top three sages
      fetch("http://localhost:5000/api/top-sages")
        .then((res) => res.json())
        .then((data) => setTopSages(data))
        .catch((err) => console.error("Error fetching top sages:", err));

      // Fetch subject marks for current user
      fetch("http://localhost:5000/api/user/stats/subject", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      })
        .then((res) => res.json())
        .then((marks) => setSubjectMarks(marks))
        .catch((err) => console.error("Error fetching subject marks:", err));
    }
  }, [token]);

  // Fetch questions from backend
  const fetchQuestions = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/questions");
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions!", error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter questions based on search query
  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute wisdom points as the sum of marks from all subjects
  const computedWisdomPoints = subjectMarks.reduce(
    (acc, mark) => acc + (mark.cia1 + mark.cia2 + mark.midSem + mark.endSem),
    0
  );

  // Compute overall result as an average percentage (each subject out of 120)
  const overallResult =
    subjectMarks.length > 0
      ? (subjectMarks.reduce(
          (acc, mark) => acc + (mark.cia1 + mark.cia2 + mark.midSem + mark.endSem),
          0
        ) /
          (subjectMarks.length * 120)) *
        100
      : 0;

  // Build a profile object for the dashboard.
  const userProfile = {
    name: userData && userData.name ? userData.name : "User",
    level: userData && userData.level ? userData.level : 1,
    experience: userData && userData.experience ? userData.experience : 0,
    wisdomPoints: computedWisdomPoints,
    questionsAsked: userData && userData.questionsAsked ? userData.questionsAsked : 0,
    questionsAnswered: userData && userData.questionsAnswered ? userData.questionsAnswered : 0,
    myResult: overallResult,
    classAverageResult: userData && userData.classAverageResult ? userData.classAverageResult : 0,
    rank: userData && userData.rank ? userData.rank : 0,
  };

  // Delete a subject mark
  const handleDeleteMark = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/user/stats/subject/${id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      setSubjectMarks(subjectMarks.filter((mark) => mark._id !== id));
    } catch (error) {
      console.error("Error deleting subject mark!", error);
    }
  };

  // Toggle visibility for subject details in the collapsible dropdown
  const toggleSubjectDropdown = (id: string) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Side Menu */}
      <aside className="w-64 bg-purple-800 text-white p-4">
        <div className="flex items-center mb-8">
          <img src="/ES_logo2.png" alt="Your Logo" className="w-20 h-20 mr-2" />
          <h1 className="text-2xl font-bold">EduSage</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-white hover:text-black transition-colors"
              >
                <Users className="mr-2 h-4 w-4" />
                Discussion Forum
              </Button>
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-purple-600 text-white p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                placeholder="Search questions..."
              />
              <Button variant="secondary">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Link to="/ask">
                <Button variant="secondary">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Seek Wisdom
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6" />
              <Link to="/profile">
                <Avatar>
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback className="text-black">
                    {userData && userData.name ? getInitials(userData.name) : "AV"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex-1 max-w-6xl my-8 flex px-12 space-x-8">
          {/* Questions Feed */}
          <div className="w-1/2 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Recent Questions</h2>
            <div className="overflow-y-auto mb-4">
              {filteredQuestions.map((question) => (
                <Link key={question._id} to={`/solutions/${question._id}`}>
                  <div className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-purple-600">
                        {question.subject}
                      </span>
                      <span className="text-sm text-gray-500">
                        {question.wisdomPoints} wisdom points
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">
                        Asked on: {formatDate(new Date(question.askedAt))}
                      </span>
                      <span
                        className={`text-sm font-semibold flex items-center ${
                          question.solved ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {question.solved ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        {question.solved ? "Solved" : "Unsolved"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="outline">
                        View Answers ({question.answers || 0})
                      </Button>
                      <Button>Share Wisdom</Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Button variant="outline" className="flex items-center justify-center">
              <h3 className="text-lg font-semibold">More questions...</h3>
            </Button>
          </div>

          {/* Right Column: Dashboard */}
          <div className="w-1/2 space-y-8 flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage src="/placeholder-user.jpg" alt={userProfile.name} />
                  <AvatarFallback>
                    {userData && userData.name ? getInitials(userData.name) : "AV"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {userData && userData.name ? userData.name : "User"}
                  </h2>
                  <p className="text-purple-600">
                    Level {userProfile.level} Sage
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span>Experience</span>
                  <span>{userProfile.experience}/100</span>
                </div>
                <Progress value={userProfile.experience} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold">{userProfile.wisdomPoints}</p>
                  <p className="text-sm text-gray-500">Wisdom Points</p>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.questionsAsked}</p>
                  <p className="text-sm text-gray-500">Questions Asked</p>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.questionsAnswered}</p>
                  <p className="text-sm text-gray-500">Questions Answered</p>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.rank}</p>
                  <p className="text-sm text-gray-500">My Rank</p>
                </div>
              </div>
              <div className="bg-purple-100 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-center">Performance</h3>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-800">
                      {userProfile.myResult.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-600 mt-1">My Result</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-800">
                      {userProfile.classAverageResult.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-600 mt-1">Class Average Result</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Sages */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Top Sages</h3>
              {topSages.map((sage, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarFallback>{sage.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{sage.name}</span>
                  </div>
                  <span className="font-semibold">
                    {sage.wisdomPoints} wisdom points
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Stats Dialog */}
      <Dialog open={Boolean(userData && userData.showStats)} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] mx-auto max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {userData && userData.showDetailedAnalysis ? (
                <>
                  Detailed Analysis
                  <Button variant="ghost" onClick={() => {
                    userData.showDetailedAnalysis = false;
                    setUserData({ ...userData });
                  }} className="ml-4 text-sm text-purple-600">
                    Back to Overview
                  </Button>
                </>
              ) : (
                "Student Stats"
              )}
            </DialogTitle>
          </DialogHeader>
          {!(userData && userData.showDetailedAnalysis) ? (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Overall Result</h3>
                <Progress value={userProfile.myResult} className="w-full bg-purple-200" />
                <p className="text-sm text-right">{userProfile.myResult.toFixed(1)}%</p>
                <Button variant="ghost" className="mt-2 text-purple-600" onClick={() => {
                  userData.showDetailedAnalysis = true;
                  setUserData({ ...userData });
                }}>
                  View Detailed Analysis
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Class Average Result</h3>
                <Progress value={userProfile.classAverageResult} className="w-full bg-purple-200" />
                <p className="text-sm text-right">{userProfile.classAverageResult.toFixed(1)}%</p>
                <p className="text-sm text-purple-600">
                  You beat {userProfile.rank ? (userProfile.rank > 0 ? userProfile.rank - 1 : 0) : 0} students.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <h3 className="text-xl font-bold mb-4">Subject Marks</h3>
              {/* Collapsible Dropdown for each subject */}
              <div className="mb-4">
                {subjectMarks.map((mark) => (
                  <div key={mark._id} className="border rounded mb-2">
                    <button
                      onClick={() => mark._id && toggleSubjectDropdown(mark._id)}
                      className="w-full text-left px-4 py-2 bg-purple-100 hover:bg-purple-200 focus:outline-none"
                    >
                      <span className="font-semibold">{mark.subject}</span>
                    </button>
                    {mark._id && openSubjects[mark._id] && (
                      <div className="p-4">
                        <p>CIA 1: {mark.cia1} / 20</p>
                        <p>CIA 2: {mark.cia2} / 20</p>
                        <p>Mid-Semester: {mark.midSem} / 30</p>
                        <p>End-Semester: {mark.endSem} / 50</p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" onClick={() => {
                            // In a complete integration, you'd set up an edit handler here.
                            userData.showDetailedAnalysis = false;
                            setUserData({ ...userData });
                          }}>
                            Edit
                          </Button>
                          <Button variant="destructive" onClick={() => mark._id && handleDeleteMark(mark._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Form for adding/editing subject mark */}
              <div className="space-y-2">
                <h4 className="font-bold">Add New Subject Mark</h4>
                <label className="block font-medium mb-1">Subject:</label>
                <select
                  name="subject"
                  onChange={(e) => {}}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="">Select Subject</option>
                  <option value="MES">MES</option>
                  <option value="CN">CN</option>
                  <option value="OS">OS</option>
                  <option value="EM-4">EM-4</option>
                  <option value="SE">SE</option>
                </select>
                <label className="block font-medium mb-1">CIA 1 (out of 20):</label>
                <input
                  type="number"
                  name="cia1"
                  placeholder="Enter CIA 1 marks"
                  min={0}
                  max={20}
                  className="w-full p-2 border rounded mb-2"
                />
                <label className="block font-medium mb-1">CIA 2 (out of 20):</label>
                <input
                  type="number"
                  name="cia2"
                  placeholder="Enter CIA 2 marks"
                  min={0}
                  max={20}
                  className="w-full p-2 border rounded mb-2"
                />
                <label className="block font-medium mb-1">Mid-Semester (out of 30):</label>
                <input
                  type="number"
                  name="midSem"
                  placeholder="Enter mid-sem marks"
                  min={0}
                  max={30}
                  className="w-full p-2 border rounded mb-2"
                />
                <label className="block font-medium mb-1">End-Semester (out of 50):</label>
                <input
                  type="number"
                  name="endSem"
                  placeholder="Enter end-sem marks"
                  min={0}
                  max={50}
                  className="w-full p-2 border rounded mb-2"
                />
                <div className="flex space-x-4 mt-2">
                  <Button>Add</Button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <Button onClick={() => {}}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
