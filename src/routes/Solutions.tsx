//@ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
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
  CheckCircle,
  Award
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "../utils/api";

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
  approved?: boolean;
}

// Define the Question type with wisdomPoints
interface Question {
  _id: string;
  title: string;
  subject: string;
  wisdomPoints: number;
  askedAt: string;
  solved?: boolean;
  askedBy: string;
  approvedAnswerId?: string;
}

export default function Solutions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshUserData } = useUser();
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
  // For deleting questions
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // For current user
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Helper functions for auth and API calls
  const getToken = useCallback(() => localStorage.getItem("token"), []);
  
  const getCurrentUser = useCallback(async () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const res = await apiFetch("profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setCurrentUser(data.rollno);
      return data.rollno;
    } catch (err) {
      console.error("Error fetching user data:", err);
      return null;
    }
  }, [getToken]);

  // Load user data
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  // Fetch question details from backend
  const fetchQuestion = useCallback(async () => {
    if (!id) return;
    
    try {
      const res = await apiFetch(`api/questions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching question", error);
      setLoading(false);
    }
  }, [id]);

  // Fetch answers for the question from backend
  const fetchAnswers = useCallback(async () => {
    if (!id) return;
    
    try {
      const res = await apiFetch(`api/questions/${id}/answers`);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data);
      }
    } catch (error) {
      console.error("Error fetching answers", error);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
  }, [fetchQuestion, fetchAnswers]);

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

  // Submit a new answer to backend
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAnswer.trim()) {
      alert("Please enter your answer");
      return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to submit an answer");
      navigate("/login");
      return;
    }
    
    try {
      const res = await apiFetch(`api/questions/${id}/answers`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
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
        
        // Refresh user data from context to update questionsAnswered count
        await refreshUserData();
      } else {
        alert("Error submitting answer");
      }
    } catch (error) {
      console.error("Error submitting answer", error);
      alert("Error submitting answer");
    }
  };

  // Update an existing answer via backend
  const handleUpdateAnswer = async (answerId: string) => {
    const token = getToken();
    if (!token) {
      alert("You must be logged in to update an answer");
      return;
    }
    
    try {
      const res = await apiFetch(`api/answers/${answerId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editingAnswerContent,
          attachments: editingAttachments,
        }),
      });
      
      if (res.ok) {
        const updatedAnswer = await res.json();
        setAnswers(answers.map((ans) => (ans._id === answerId ? updatedAnswer : ans)));
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

  // Delete an answer via backend
  const handleDeleteAnswer = async (answerId: string) => {
    const token = getToken();
    if (!token) {
      alert("You must be logged in to delete an answer");
      return;
    }
    
    try {
      const res = await apiFetch(`api/answers/${answerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAnswers(answers.filter((ans) => ans._id !== answerId));
        
        // If this was the approved answer, mark question as unsolved
        if (question?.approvedAnswerId === answerId) {
          setQuestion({...question, solved: false, approvedAnswerId: undefined});
        }
        
        // Refresh user data to update questions answered count
        await refreshUserData();
      } else {
        alert("Error deleting answer");
      }
    } catch (error) {
      console.error("Error deleting answer", error);
      alert("Error deleting answer");
    }
  };

  // Delete a question and all its answers
  const handleDeleteQuestion = async () => {
    const token = getToken();
    if (!token) {
      alert("You must be logged in to delete a question");
      return;
    }
    
    try {
      const res = await apiFetch(`api/questions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Refresh user data to update question counts and wisdom points
        await refreshUserData();
        alert("Question deleted successfully");
        navigate("/home");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Could not delete question"}`);
      }
    } catch (error) {
      console.error("Error deleting question", error);
      alert("Error deleting question");
    }
  };

  // Approve an answer (only available to the question owner)
  const handleApproveAnswer = async (answerId: string) => {
    const token = getToken();
    if (!token) {
      alert("You must be logged in to approve an answer");
      return;
    }
    
    try {
      const res = await apiFetch(`api/questions/${id}/approve/${answerId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Update local question and answers state
        setQuestion({...question!, solved: true, approvedAnswerId: answerId});
        setAnswers(answers.map(ans => 
          ans._id === answerId 
            ? {...ans, approved: true} 
            : {...ans, approved: false}
        ));
        
        // Refresh user data to update wisdom points in UI
        await refreshUserData();
        
        alert("Answer approved successfully");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Could not approve answer"}`);
      }
    } catch (error) {
      console.error("Error approving answer", error);
      alert("Error approving answer");
    }
  };

  // Derived state for question ownership and answer display
  const isQuestionOwner = question?.askedBy === currentUser;
  
  // Sort answers to show approved answers first, then by date
  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.approved) return -1;
    if (b.approved) return 1;
    return new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime();
  });

  // Toggle display of all answers or only the first answer
  const displayedAnswers = showAllAnswers ? sortedAnswers : sortedAnswers.slice(0, 1);

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
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-purple-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold ml-4">Solutions</h1>
          </div>
          {isQuestionOwner && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete Question
            </Button>
          )}
        </header>
        <main className="container mx-auto p-4">
          {question && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{question.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Subject:</strong> {question.subject}</p>
                <p><strong>Wisdom Points:</strong> {question.wisdomPoints}</p>
                <p><strong>Asked By:</strong> {question.askedBy}</p>
                <p className="text-sm text-gray-500">
                  Asked on: {formatDate(new Date(question.askedAt))}
                </p>
                <p className={`text-sm mt-2 flex items-center ${question.solved ? "text-green-600" : "text-orange-600"}`}>
                  {question.solved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Solved
                    </>
                  ) : (
                    <>
                      <QuizIcon className="w-4 h-4 mr-1" />
                      Awaiting solution
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          <h2 className="text-xl font-semibold mb-4">Solutions:</h2>
          {displayedAnswers.map((answer) => (
            <Card 
              key={answer._id} 
              className={`mb-4 ${answer.approved ? "border-2 border-green-500" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${answer.user}`}
                      />
                      <AvatarFallback>{answer.user[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{answer.user}</span>
                  </div>
                  {answer.approved && (
                    <div className="flex items-center text-green-600">
                      <Award className="w-5 h-5 mr-1" />
                      <span className="font-medium">Approved Solution</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingAnswerId === answer._id ? (
                  <>
                    <Textarea
                      value={editingAnswerContent}
                      onChange={(e) => setEditingAnswerContent(e.target.value)}
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
                        onClick={() => editingAnswerId && handleUpdateAnswer(editingAnswerId)}
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
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                {/* Allow the answer creator to edit/delete their own answer */}
                {currentUser === answer.user && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingAnswerId(answer._id || "");
                        setEditingAnswerContent(answer.content);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => answer._id && handleDeleteAnswer(answer._id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {/* Allow question owner to approve an answer */}
                {isQuestionOwner && !answer.approved && !question?.solved && (
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => answer._id && handleApproveAnswer(answer._id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Solution
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}

          {answers.length > 1 && (
            <Button variant="ghost" onClick={() => setShowAllAnswers(!showAllAnswers)}>
              {showAllAnswers ? "Show Less" : "Show All Answers"}
            </Button>
          )}

          {!answers.find((a) => a.user === currentUser) && !showAnswerForm && (
            <Button className="mt-4" onClick={() => setShowAnswerForm(true)}>
              Add Your Answer
            </Button>
          )}

          {showAnswerForm && (
            <form onSubmit={handleSubmitAnswer} className="mt-4">
              <Textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={4}
                placeholder="Write your answer here..."
                className="mb-2"
              />
              <Input type="file" multiple onChange={handleFileUpload} className="mb-2" />
              <div className="flex space-x-2">
                <Button type="submit">Submit Answer</Button>
                <Button variant="ghost" onClick={() => setShowAnswerForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </main>
      </div>
      
      {/* Delete Question Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All answers to this question will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
