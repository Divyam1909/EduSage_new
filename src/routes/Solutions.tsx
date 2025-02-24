"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Plus,
  FileText,
  Users,
  BookOpen,
  Bookmark,
  HelpCircle as QuizIcon,
  User,
  Edit,
  Trash,
  ArrowLeft,
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
import { Input } from "@/components/ui/input";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

// Define the Answer type
interface Answer {
  _id?: string;
  user: string;
  content: string;
  answeredAt: string;
  points: number;
  likes: number;
  comments: number;
  attachments?: File[];
}

// Define the Question type with wisdomPoints
interface Question {
  _id: string;
  title: string;
  subject: string;
  wisdomPoints: number;
  askedAt: string;
}

export default function Solutions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  // For editing answers
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState("");
  const [editingAttachments, setEditingAttachments] = useState<File[]>([]);

  // Fetch question details
  const fetchQuestion = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
      }
    } catch (error) {
      console.error("Error fetching question", error);
    }
  };

  // Fetch answers for the question
  const fetchAnswers = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${id}/answers`);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data);
      }
    } catch (error) {
      console.error("Error fetching answers", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchQuestion();
      fetchAnswers();
    }
  }, [id]);

  // Check if current user ("You") already answered
  const userAnswer = answers.find((a) => a.user === "You");

  // Handle file uploads for new answer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  // Handle file uploads for editing answer
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setEditingAttachments([...editingAttachments, ...Array.from(files)]);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newAnswer.trim() || attachments.length > 0) {
      try {
        const res = await fetch(`http://localhost:5000/api/questions/${id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: "You", // Replace with actual logged-in user info if available
            content: newAnswer,
            attachments,
          }),
        });
        if (res.ok) {
          const addedAnswer = await res.json();
          setAnswers([addedAnswer, ...answers]);
          setNewAnswer("");
          setShowAnswerForm(false);
          setAttachments([]);
        } else {
          alert("Error submitting answer");
        }
      } catch (error) {
        console.error("Error submitting answer", error);
        alert("Error submitting answer");
      }
    }
  };

  const handleUpdateAnswer = async (answerId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/answers/${answerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editingAnswerContent,
          attachments: editingAttachments,
        }),
      });
      if (res.ok) {
        const updatedAnswer = await res.json();
        setAnswers(
          answers.map((ans) => (ans._id === answerId ? updatedAnswer : ans))
        );
        setEditingAnswerId(null);
        setEditingAnswerContent("");
        setEditingAttachments([]);
      } else {
        alert("Error updating answer");
      }
    } catch (error) {
      console.error("Error updating answer", error);
      alert("Error updating answer");
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/answers/${answerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnswers(answers.filter((ans) => ans._id !== answerId));
      } else {
        alert("Error deleting answer");
      }
    } catch (error) {
      console.error("Error deleting answer", error);
      alert("Error deleting answer");
    }
  };

  const displayedAnswers = showAllAnswers ? answers : answers.slice(0, 1);

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
              <Link to="/resources">
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
                  <QuizIcon className="mr-2 h-4 w-4" />
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
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
                  <QuizIcon className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-purple-700 text-white p-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold ml-4">Solutions</h1>
        </header>
        <main className="container mx-auto p-4">
          {question && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{question.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Subject:</strong> {question.subject}
                </p>
                <p>
                  <strong>Wisdom Points:</strong> {question.wisdomPoints}
                </p>
                <p className="text-sm text-gray-500">
                  Asked on: {formatDate(new Date(question.askedAt))}
                </p>
              </CardContent>
            </Card>
          )}

          <h2 className="text-xl font-semibold mb-4">Solutions:</h2>
          {displayedAnswers.map((answer) => (
            <Card key={answer._id} className="mb-4">
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
                {editingAnswerId === answer._id ? (
                  <>
                    <Textarea
                      value={editingAnswerContent}
                      onChange={(e) =>
                        setEditingAnswerContent(e.target.value)
                      }
                      rows={3}
                      className="mb-2"
                    />
                    <Input
                      type="file"
                      onChange={handleEditFileUpload}
                      multiple
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingAnswerId(null);
                          setEditingAnswerContent("");
                          setEditingAttachments([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          editingAnswerId && handleUpdateAnswer(editingAnswerId)
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{answer.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Answered on: {formatDate(new Date(answer.answeredAt))}
                    </p>
                    {answer.attachments?.length ? (
                      <div className="mt-2">
                        {answer.attachments.map((file: File, index) => (
                          <div key={index} className="flex gap-2">
                            <FileText className="w-4 h-4" /> {file.name}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
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
                {answer.user === "You" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAnswerId(answer._id!);
                        setEditingAnswerContent(answer.content);
                        setEditingAttachments(answer.attachments || []);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => answer._id && handleDeleteAnswer(answer._id)}
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}

          {/* Only show "Answer this question" button if user hasn't answered yet */}
          {!userAnswer && !showAnswerForm && (
            <Button
              onClick={() => setShowAnswerForm(true)}
              variant="outline"
              className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <Plus className="mr-2" />
              Answer this question
            </Button>
          )}

          {showAnswerForm && (
            <form onSubmit={handleSubmitAnswer} className="mt-4">
              <Textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Write your answer..."
                rows={3}
                className="mb-2"
              />
              <div className="flex items-center mb-2">
                <Input
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
                <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                  Submit Answer
                </Button>
              </div>
            </form>
          )}

          {answers.length > 1 && !showAllAnswers && (
            <Button
              onClick={() => setShowAllAnswers(true)}
              className="bg-purple-600 text-white hover:bg-purple-700 transition-colors mt-4"
            >
              Show All Answers
            </Button>
          )}
        </main>
      </div>
    </div>
  );
}
