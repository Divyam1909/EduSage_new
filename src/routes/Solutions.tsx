"use client";

import { Key, useState } from "react";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Plus,
  Bot,
  Calendar,
  FileText,
  Users,
  BookOpen,
  Bookmark,
  HelpCircle as Quiz,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

// Define the Answer type
interface Answer {
  id: number;
  user: string;
  content: string;
  points: number;
  likes: number;
  comments: number;
  attachments?: File[]; // Optional attachments property
}

// Define the Question type with wisdomPoints
interface Question {
  id: number;
  title: string;
  subject: string;
  answers: Answer[];
  wisdomPoints: number;
}

// Initial mock data for a single question and its answers
const initialQuestion: Question = {
  id: 1,
  title: "What is the time complexity of QuickSort?",
  subject: "Data Structures and Algorithms",
  wisdomPoints: 0,
  answers: [
    {
      id: 1,
      user: "Alice",
      content:
        "The average time complexity of QuickSort is O(n log n). It works efficiently on large datasets due to its divide-and-conquer approach. However, in the worst case, its time complexity is O(n^2) when the pivot selection is poor.",
      points: 5,
      likes: 12,
      comments: 3,
      attachments: [],
    },
    {
      id: 2,
      user: "Bob",
      content:
        "QuickSort is typically faster than MergeSort because of better cache performance. Although its worst-case is O(n^2), the randomized version helps avoid this in most practical scenarios, making it O(n log n) on average.",
      points: 4,
      likes: 8,
      comments: 1,
      attachments: [],
    },
  ],
};

export default function Component() {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(
    initialQuestion
  );
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");
  const [answers, setAnswers] = useState(currentQuestion.answers);
  const [attachments, setAttachments] = useState<File[]>([]);

  const displayedAnswers = showAllAnswers ? answers : answers.slice(0, 1);

  // Update the handleFileUpload function
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  const handleSubmitAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newAnswer.trim() || attachments.length > 0) {
      const newAnswerObj: Answer = {
        id: answers.length + 1,
        user: "You", // In a real app, use the logged-in user's name
        content: newAnswer,
        points: 0,
        likes: 0,
        comments: 0,
        attachments,
      };
      const updatedAnswers = [...answers, newAnswerObj];
      setAnswers(updatedAnswers);
      // Optionally, update the currentQuestion as well if needed
      setNewAnswer("");
      setShowAnswerForm(false);
      setAttachments([]);
    }
  };

  // Function to share wisdom (add wisdom points to the question)
  const shareWisdom = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/questions/${currentQuestion.id}/wisdom`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wisdomPoints: 1 }),
        }
      );
      if (res.ok) {
        const updatedQuestion = await res.json();
        // Update local state with the new wisdomPoints value
        setCurrentQuestion({
          ...currentQuestion,
          wisdomPoints: updatedQuestion.wisdomPoints,
        });
      } else {
        alert("Error sharing wisdom");
      }
    } catch (error) {
      console.error("Error sharing wisdom", error);
      alert("Error sharing wisdom");
    }
  };

  return (
    <div className="flex min-h-screen bg-purple-50">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-800 text-white p-4">
        <div className="flex items-center mb-8">
          <BookOpen className="w-8 h-8 mr-2" />
          <h1 className="text-2xl font-bold">EduSage</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/Home">
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
        <header className="bg-purple-700 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">EduSage</h1>
          </div>
        </header>
        <main className="container mx-auto p-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{currentQuestion.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Subject:</strong> {currentQuestion.subject}
              </p>
              <p>
                <strong>Wisdom Points:</strong> {currentQuestion.wisdomPoints}
              </p>
              <Button
                onClick={shareWisdom}
                className="mt-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                Share Wisdom
              </Button>
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold mb-4">Solutions:</h2>
          {displayedAnswers.map((answer) => (
            <Card key={answer.id} className="mb-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/6.x/initials/svg?seed=${answer.user}`}
                    />
                    <AvatarFallback>{answer.user[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{answer.user}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p>{answer.content}</p>
                {answer.attachments?.length ? (
                  <div className="mt-2">
                    {answer.attachments.map(
                      (file: File, index: Key | null | undefined) => (
                        <div key={index} className="flex gap-2">
                          <FileText className="w-4 h-4" /> {file.name}
                        </div>
                      )
                    )}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {answer.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {answer.comments}
                  </Button>
                </div>
                <div className="flex items-center">
                  <span className="mr-1">Accuracy:</span>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < answer.points
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}

          {/* Buttons for showing answers and submitting answers */}
          <div className="flex justify-between items-center mt-4">
            {!showAllAnswers && answers.length > 1 && (
              <Button
                onClick={() => setShowAllAnswers(true)}
                className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Show All Answers
              </Button>
            )}
            {showAnswerForm ? (
              <form onSubmit={handleSubmitAnswer} className="flex-grow">
                <Textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Write your answer..."
                  rows={3}
                  className="mb-2"
                />
                <div className="flex items-center mb-2">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    multiple
                    className="border rounded p-2 mr-2"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowAnswerForm(false)}
                    variant="ghost"
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Submit Answer
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                onClick={() => setShowAnswerForm(true)}
                variant="outline"
                className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <Plus className="mr-2" />
                Answer this question
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
