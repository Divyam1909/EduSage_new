import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function Home() {
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // States for the Ask Question form
  const [askSubject, setAskSubject] = useState("");
  const [askTitle, setAskTitle] = useState("");
  const [askDetails, setAskDetails] = useState("");
  const [askWisdomPoints, setAskWisdomPoints] = useState(0);

  // Sample data fetch (this call can be removed if not needed)
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/data/")
      .then((response) => {
        console.log(response.data.message);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  }, []);

  // Fetch logged-in user profile from your backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/profile", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => response.json())
        .then((data) => setUserData(data))
        .catch((error) =>
          console.error("Error fetching profile from backend:", error)
        );
    }
  }, []);

  // Fetch questions from your backend
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

  // Default profile details for the right column
  const userProfile = {
    name: userData && userData.name ? userData.name : "Arjun Varshney",
    level: 5,
    experience: 75,
    wisdomPoints: 450,
    questionsAsked: 12,
    questionsAnswered: 28,
    myResult: 85.5,
    classAverageResult: 72.3,
    rank: 42,
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Utility to compute initials from a name string
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("");

  // Handle Ask Question form submission
  const handleAskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/questions", {
        title: askTitle,
        details: askDetails,
        subject: askSubject,
        wisdomPoints: askWisdomPoints,
      });
      if (res.status === 201) {
        alert("Question submitted successfully");
        fetchQuestions();
        setAskSubject("");
        setAskTitle("");
        setAskDetails("");
        setAskWisdomPoints(0);
        setIsAskModalOpen(false);
      }
    } catch (error) {
      console.error("Error submitting question", error);
      alert("Error submitting question");
    }
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

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-purple-600 text-white p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Input
                className="w-64 cursor-pointer bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                placeholder="Search questions..."
              />
              <Link to="/performance">
                <Button variant="secondary">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </Link>
              <Link to="/ask">
                <Button
                  variant="secondary"
                  onClick={() => setIsAskModalOpen(true)}
                >
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

        {/* Main Content */}
        <main className="flex-1 max-w-6xl my-8 flex px-12 space-x-8">
          {/* Question Feed */}
          <div className="w-1/2 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Recent Questions</h2>
            <div className="flex-2 overflow-y-auto mb-4">
              {questions.map((question) => (
                <div
                  key={question._id}
                  className="bg-white rounded-lg shadow-md p-4 mb-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-purple-600">
                      {question.subject}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.wisdomPoints} wisdom points
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {question.title}
                  </h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      Asked on: {formatDate(new Date(question.askedAt))}
                    </span>
                    <span
                      className={`text-sm font-semibold flex items-center ${
                        question.solved
                          ? "text-green-500"
                          : "text-red-500"
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
                    <Link to="/solutions">
                      <Button>Share Wisdom</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="flex-grow flex items-center justify-center"
            >
              <h3 className="text-lg font-semibold">More questions...</h3>
            </Button>
          </div>

          {/* Right Column: Profile and Top Sages */}
          <div className="w-1/2 space-y-8 flex flex-col">
            <Link to="/profile">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="w-16 h-16 mr-4">
                    <AvatarImage
                      src="/placeholder-user.jpg"
                      alt={userProfile.name}
                    />
                    <AvatarFallback>
                      {userData && userData.name
                        ? getInitials(userData.name)
                        : "AV"}
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
                    <p className="font-semibold">
                      {userProfile.questionsAnswered}
                    </p>
                    <p className="text-sm text-gray-500">
                      Questions Answered
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">{userProfile.rank}</p>
                    <p className="text-sm text-gray-500">My Rank</p>
                  </div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-4 text-center">
                    Performance
                  </h3>
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
                      <p className="text-sm text-purple-600 mt-1">
                        Class Average Result
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Top Sages */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Top Sages</h3>
              {[
                { name: "Arjun", points: 1250 },
                { name: "Gargi", points: 980 },
                { name: "Divyam", points: 875 },
              ].map((user, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center mb-2"
                >
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                  <span className="font-semibold">
                    {user.points} wisdom points
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Ask Question Modal */}
      <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seek Wisdom</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAskSubmit}>
            <Select onValueChange={(value) => setAskSubject(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math">Math</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="literature">Literature</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter your question"
              value={askTitle}
              onChange={(e) => setAskTitle(e.target.value)}
            />
            <Textarea
              placeholder="Provide more details about your inquiry"
              value={askDetails}
              onChange={(e) => setAskDetails(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Wisdom points to offer (1-20)"
              min="1"
              max="20"
              value={askWisdomPoints}
              onChange={(e) => setAskWisdomPoints(Number(e.target.value))}
            />
            <Button type="submit" className="w-full">
              Submit Inquiry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
