import { useState } from "react";
import {
  GraduationCap,
  FileText,
  Menu,
  BookOpen,
  Users,
  Calendar,
  Bot,
  Bookmark,
  HelpCircle as QuizIcon,
  User,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

const quizzes = [
  {
    id: 1,
    topic: "Array Arcana",
    difficulty: "Novice",
    marks: 30,
    timeLimit: 20,
    points: 50,
  },
  {
    id: 2,
    topic: "Linked List Lore",
    difficulty: "Adept",
    marks: 50,
    timeLimit: 30,
    points: 100,
  },
  {
    id: 3,
    topic: "Stack & Queue Sorcery",
    difficulty: "Adept",
    marks: 40,
    timeLimit: 25,
    points: 80,
  },
  {
    id: 4,
    topic: "Tree & Graph Thaumaturgy",
    difficulty: "Sage",
    marks: 80,
    timeLimit: 45,
    points: 160,
  },
  {
    id: 5,
    topic: "Sorting Spells",
    difficulty: "Adept",
    marks: 60,
    timeLimit: 35,
    points: 120,
  },
  {
    id: 6,
    topic: "Dynamic Programming Divination",
    difficulty: "Sage",
    marks: 100,
    timeLimit: 60,
    points: 200,
  },
];

interface Quiz {
  id: number;
  topic: string;
  difficulty: string;
  marks: number;
  timeLimit: number;
  points: number;
}

export default function QuizInterface() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDifficultyColor = (difficulty: string | undefined) => {
    if (!difficulty) return "text-purple-300";

    switch (difficulty.toLowerCase()) {
      case "novice":
        return "text-green-400";
      case "adept":
        return "text-yellow-400";
      case "sage":
        return "text-red-400";
      default:
        return "text-purple-300";
    }
  };

  return (
    <div className="flex min-h-screen bg-purple-50">
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
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Users className="mr-2 h-4 w-4" />
                  Discussion Forum
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/Resources">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <FileText className="mr-2 h-4 w-4" />
                  Resources
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/quiz">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <QuizIcon className="mr-2 h-4 w-4" />
                  Quizzes
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/profile">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
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
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/ai">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
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
        {/* <header className="bg-purple-700 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center">
              <GraduationCap className="h-10 w-10 text-purple-200" />
              <h1 className="ml-2 text-3xl font-bold text-white">EduSage</h1>
            </div>
            <Button variant="ghost" className="text-white md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </header> */}

        {mobileMenuOpen && (
          <nav className="bg-purple-700 text-white p-4 md:hidden">
            <a href="#" className="block py-2">
              Home
            </a>
            <a href="#" className="block py-2">
              Profile
            </a>
            <a href="#" className="block py-2">
              About Us
            </a>
          </nav>
        )}

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-purple-900 mb-6">Arcane DSA Trials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow duration-300 bg-white border-2 border-purple-200">
                <CardHeader className="bg-purple-100">
                  <CardTitle className="text-purple-800 text-xl">{quiz.topic}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className={`font-semibold ${getDifficultyColor(quiz.difficulty)}`}>Mastery Level: {quiz.difficulty}</p>
                  <div className="mt-2 flex items-center">
                    <Star className="h-5 w-5 text-purple-400 mr-1" />
                    <span className="text-purple-700">{quiz.marks} wisdom points</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <Clock className="h-5 w-5 text-purple-400 mr-1" />
                    <span className="text-purple-700">{quiz.timeLimit} minutes incantation</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setSelectedQuiz(quiz)} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Commence Trial
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>

        <Dialog open={selectedQuiz !== null} onOpenChange={() => setSelectedQuiz(null)}>
          <DialogContent className="bg-purple-50 border-2 border-purple-300">
            <DialogHeader>
              <DialogTitle className="text-purple-800 text-2xl">{selectedQuiz?.topic}</DialogTitle>
              <DialogDescription className="text-purple-600">
                Are you prepared to embark on this mystical journey? You have {selectedQuiz?.timeLimit} minutes to unravel the enigma.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 text-purple-700">
              <p>
                <strong>Mastery Level:</strong>{" "}
                <span className={getDifficultyColor(selectedQuiz?.difficulty)}>{selectedQuiz?.difficulty}</span>
              </p>
              <p>
                <strong>Wisdom Points:</strong> {selectedQuiz?.marks}
              </p>
              <p>
                <strong>Points for Completion:</strong> {selectedQuiz?.points}
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelectedQuiz(null)}>
                Cancel
              </Button>
              <Button className="bg-purple-600 text-white hover:bg-purple-700">Begin Trial</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
