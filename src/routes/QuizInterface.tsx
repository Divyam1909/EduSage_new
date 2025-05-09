//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  Users,
  FileText,
  Calendar,
  Bot,
  Bookmark,
  HelpCircle as QuizIcon,
  User,
  Clock,
  Star,
  Check,
  X,
  AlertTriangle,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

// Define interfaces for our types
interface Question {
  questionText: string;
  isMCQ: boolean;
  options: string[] | string; // during editing it may be a comma–separated string
  correctAnswer: string;
  marks: number;
}

interface Quiz {
  _id?: string;
  title: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  points: number;
  clearable: boolean; // new property to control whether attempts can be cleared
  questions: Question[];
}

interface Attempt {
  _id?: string;
  // quizId can be either a string (if not populated) or a Quiz object
  quizId: Quiz | string | null;
  user: string;
  answers: {
    questionId: number;
    answer: string;
    correct: boolean;
    marksObtained: number;
  }[];
  totalScore: number;
  timeTaken: number;
  submittedAt: string;
  clearable: boolean; // indicates if this attempt can be cleared
}

interface QuizResult {
  totalScore: number;
  timeTaken: number;
  tabViolation?: boolean;
}

export default function QuizInterface() {
  // User state and token retrieval
  const [userData, setUserData] = useState<any>(null);
  const token = localStorage.getItem("token");

  // Main view states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attemptingQuiz, setAttemptingQuiz] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [attemptDetails, setAttemptDetails] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Toast notification state
  const [toast, setToast] = useState<{visible: boolean, message: string, type: 'success' | 'error' | 'warning'}>({
    visible: false,
    message: '',
    type: 'success'
  });

  // Quiz creation states
  const [createQuizMode, setCreateQuizMode] = useState<boolean>(false);
  const [createQuizStep, setCreateQuizStep] = useState<number>(1);
  const [newQuiz, setNewQuiz] = useState<Quiz>({
    title: "",
    topic: "",
    difficulty: "",
    timeLimit: 0,
    points: 0,
    clearable: true, // default is clearable
    questions: [],
  });

  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ title: '', message: '', onConfirm: () => {} });

  // Points validation modal state
  const [isPointsModalOpen, setIsPointsModalOpen] = useState<boolean>(false);
  const [pointsValidationData, setPointsValidationData] = useState<{quizPoints: number, questionMarks: number}>({quizPoints: 0, questionMarks: 0});

  // Attempts view states
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [viewAttempts, setViewAttempts] = useState<boolean>(false);

  // Tab Change End Modal
  const [isTabEndModalOpen, setIsTabEndModalOpen] = useState(false);
  const [tabChangeCount, setTabChangeCount] = useState(0);
  const [isTabWarningModalOpen, setIsTabWarningModalOpen] = useState(false);

  // Update type definition for quiz result to include tabViolation
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Timer state variables
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch user profile similar to Home.tsx so that we have the correct identifier
  useEffect(() => {
    if (token) {
      apiFetch("profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUserData(data))
        .catch((err) => console.error("Error fetching profile:", err));
    }
  }, [token]);

  // Fetch quizzes and attempts on mount
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Make sure fetchAttempts is called when component mounts after user data is loaded
  useEffect(() => {
    if (userData && userData.rollno) {
      fetchAttempts();
    }
  }, [userData]);

  // Ensure attempts are refreshed when view attempts is toggled
  useEffect(() => {
    if (viewAttempts && userData && userData.rollno) {
      fetchAttempts();
    }
  }, [viewAttempts]);

  // When user navigates back from attempts view, refresh quiz list
  useEffect(() => {
    if (!viewAttempts) {
      fetchQuizzes();
    }
  }, [viewAttempts]);

  // Extra safety measure - refresh quizzes after attempts are fetched
  useEffect(() => {
    if (attempts.length > 0) {
      // If we have loaded attempts, refresh available quizzes
      fetchQuizzes();
    }
  }, [attempts.length]);

  // Tab visibility detection
  useEffect(() => {
    // Only monitor tab changes when quiz is in progress
    if (attemptingQuiz && isTimerRunning) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // User switched tabs or minimized window
          const newCount = tabChangeCount + 1;
          setTabChangeCount(newCount);
          
          if (newCount === 1) {
            // First warning
            setIsTabWarningModalOpen(true);
          } else if (newCount >= 2) {
            // Second tab change - end quiz
            console.log("Second tab change detected, ending quiz");
            endQuizDueToTabChange();
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [attemptingQuiz, isTimerRunning, tabChangeCount]);

  const fetchQuizzes = () => {
    apiFetch("api/quizzes", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data: Quiz[]) => setQuizzes(data))
      .catch((err) => console.error("Error fetching quizzes:", err));
  };

  const fetchAttempts = () => {
    if (!userData || !userData.rollno) return;
    
    // Use the user's roll number instead of a hardcoded value
    apiFetch(`api/quizAttempts?user=${userData.rollno}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => setAttempts(data))
      .catch((err) => console.error("Error fetching attempts:", err));
  };

  // Function to end quiz due to tab change
  const endQuizDueToTabChange = () => {
    console.log("Ending quiz due to tab change");
    
    // Stop timer
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Ensure the tab end modal is visible
    setIsTabEndModalOpen(true);
    
    // Calculate time taken and submit the quiz attempt with a penalty
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Ensure all questions have some answer, even if blank
    // This ensures text-type questions also get processed
    const answersWithDefaults = selectedQuiz?.questions.map((_, index) => {
      return {
        questionId: index,
        answer: userAnswers[index] || "", // Use empty string for unanswered questions
      };
    }) || [];
  
    if (userData && selectedQuiz) {
      apiFetch(`api/quizzes/${selectedQuiz._id}/attempt`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          user: userData.rollno, 
          answers: answersWithDefaults, 
          timeTaken,
          tabViolation: true // Flag to indicate tab violation
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Set result with automatic failure or penalty
          setQuizResult({ 
            totalScore: data.totalScore, 
            timeTaken,
            tabViolation: true
          });
          setAttemptDetails(data.attempt.answers);
          setAttemptingQuiz(false);
          
          // Update attempts list to show the new attempt
          fetchAttempts();
        })
        .catch((err) => {
          console.error("Error submitting quiz attempt:", err);
          // Even if the submission fails, we should still end the quiz
          setAttemptingQuiz(false);
          setIsTabEndModalOpen(true);
        });
    } else {
      // If we don't have user data or selected quiz, just terminate the quiz UI
      setAttemptingQuiz(false);
      setSelectedQuiz(null);
    }
  };

  // Timer effect: when attemptingQuiz becomes true, start countdown
  useEffect(() => {
    let timer: any;
    if (attemptingQuiz && selectedQuiz) {
      setRemainingTime(selectedQuiz.timeLimit * 60);
      setIsTimerRunning(true);
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitQuizAttempt();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = timer;
    }
    return () => {
      if (timer) clearInterval(timer);
      setIsTimerRunning(false);
    };
  }, [attemptingQuiz, selectedQuiz]);

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

  // Show toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ visible: true, message, type });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Show confirmation modal function
  const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmAction({ title, message, onConfirm });
    setIsConfirmModalOpen(true);
  };

  // When a quiz is selected from the list
  const handleSelectQuiz = (quiz: Quiz) => {
    // Prevent reattempt if already attempted by this user
    const attempted = attempts.find((a) => {
      const attemptedQuizId =
        (a.quizId && typeof a.quizId === "object" ? a.quizId._id : a.quizId) || "";
      return attemptedQuizId.toString() === quiz._id?.toString();
    });
    if (attempted) {
      showToast("You have already attempted this quiz. Clear your attempt first if you want to try again.", "warning");
      return;
    }
    setSelectedQuiz(quiz);
    setAttemptingQuiz(false);
    setQuizResult(null);
    setUserAnswers(Array(quiz.questions.length).fill(""));
  };

  const startQuizAttempt = () => {
    if (!selectedQuiz) return;
    setAttemptingQuiz(true);
    setStartTime(Date.now());
    setTabChangeCount(0); // Reset tab change count
    setIsTabEndModalOpen(false);
    setIsTabWarningModalOpen(false);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAns = [...userAnswers];
    newAns[index] = answer;
    setUserAnswers(newAns);
  };

  const submitQuizAttempt = () => {
    if (!selectedQuiz || !userData) return;
    
    // Stop timer
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Ensure all questions have some answer, even if blank
    const answersWithDefaults = selectedQuiz.questions.map((_, index) => ({
      questionId: index,
      answer: userAnswers[index] || "", // Use empty string for unanswered questions
    }));
  
    apiFetch(`api/quizzes/${selectedQuiz._id}/attempt`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ user: userData.rollno, answers: answersWithDefaults, timeTaken }),
    })
      .then((res) => res.json())
      .then((data) => {
        setQuizResult({ totalScore: data.totalScore, timeTaken });
        setAttemptDetails(data.attempt.answers);
        setAttemptingQuiz(false);
        fetchAttempts();
      })
      .catch((err) => {
        console.error("Error submitting quiz attempt:", err);
        // Even if submission fails, exit the quiz
        setAttemptingQuiz(false);
      });
  };

  const handleNewQuizDetailChange = (field: keyof Omit<Quiz, "questions" | "_id">, value: any) => {
    setNewQuiz({ ...newQuiz, [field]: value });
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const addNewQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        { questionText: "", isMCQ: true, options: "", correctAnswer: "", marks: 0 },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = newQuiz.questions.filter((_, i) => i !== index);
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const handleSubmitNewQuiz = () => {
    // Process questions: split options string if MCQ
    const processedQuestions = newQuiz.questions.map((q) => ({
      questionText: q.questionText,
      isMCQ: q.isMCQ,
      options: q.isMCQ
        ? (typeof q.options === "string" ? q.options.split(",").map((opt) => opt.trim()) : q.options)
        : [],
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks),
    }));
    
    // Calculate total marks from questions and compare with quiz points
    const totalQuestionMarks = processedQuestions.reduce((sum, q) => sum + Number(q.marks), 0);
    if (totalQuestionMarks !== Number(newQuiz.points)) {
      // Show the modal instead of alert
      setPointsValidationData({
        quizPoints: Number(newQuiz.points),
        questionMarks: totalQuestionMarks
      });
      setIsPointsModalOpen(true);
      return;
    }
    
    const quizToSubmit = { ...newQuiz, questions: processedQuestions };
    apiFetch("api/quizzes", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(quizToSubmit),
    })
      .then((res) => res.json())
      .then((data) => {
        showToast("Quiz created successfully!", "success");
        // Re–fetch quizzes so the new one is visible
        fetchQuizzes();
        setCreateQuizMode(false);
        setCreateQuizStep(1);
        setNewQuiz({ title: "", topic: "", difficulty: "", timeLimit: 0, points: 0, clearable: true, questions: [] });
      })
      .catch((err) => {
        console.error("Error creating quiz:", err);
        showToast("Failed to create quiz. Please try again.", "error");
      });
  };

  // Delete a quiz with confirmation
  const deleteQuiz = (quizId: string) => {
    showConfirmModal(
      "Delete Quiz",
      "Are you sure you want to delete this quiz? This action cannot be undone.",
      () => {
        apiFetch(`api/quizzes/${quizId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then((res) => res.json())
          .then(() => {
            setQuizzes(quizzes.filter((q) => q._id !== quizId));
            showToast("Quiz deleted successfully", "success");
          })
          .catch((err) => {
            console.error("Error deleting quiz:", err);
            showToast("Failed to delete quiz", "error");
          });
      }
    );
  };

  // Clear a single quiz attempt
  const clearAttempt = (attemptId?: string, clearable?: boolean) => {
    if (!attemptId) return;
    if (!clearable) {
      showToast("This attempt cannot be cleared.", "warning");
      return;
    }
    
    showConfirmModal(
      "Clear Attempt",
      "Are you sure you want to clear this attempt? This will allow you to take the quiz again.",
      () => {
        apiFetch(`api/quizAttempts/${attemptId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then((res) => res.json())
          .then(() => {
            fetchAttempts();
            // Also refresh quizzes to update the UI
            fetchQuizzes();
            showToast("Attempt cleared successfully", "success");
          })
          .catch((err) => {
            console.error("Error clearing attempt:", err);
            showToast("Failed to clear attempt", "error");
          });
      }
    );
  };

  // Render functions for different views

  const renderQuizList = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-purple-900">Available Quizzes</h2>
        <div className="space-x-4">
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={() => {
              setCreateQuizMode(true);
              setCreateQuizStep(1);
            }}
          >
            Add Quiz
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setViewAttempts(true)}
          >
            My Attempts
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const attempted = attempts.find((a) => {
            const attemptedQuizId = (a.quizId && typeof a.quizId === "object" ? a.quizId._id : a.quizId) || "";
            return attemptedQuizId.toString() === quiz._id?.toString();
          });
          return (
            <div
              key={quiz._id}
              className={`bg-white border-2 ${attempted ? 'border-gray-300' : 'border-purple-200'} p-4 rounded hover:shadow-lg transition-shadow duration-300`}
            >
              <h3 className="text-purple-800 text-xl mb-1">{quiz.title}</h3>
              <p className="text-sm text-gray-600 mb-2">Topic: {quiz.topic}</p>
              <p className={`font-semibold ${getDifficultyColor(quiz.difficulty)}`}>
                Mastery Level: {quiz.difficulty}
              </p>
              <div className="mt-2 flex items-center">
                <Star className="h-5 w-5 text-purple-400 mr-1" />
                <span className="text-purple-700">{quiz.points} wisdom points</span>
              </div>
              <div className="mt-2 flex items-center">
                <Clock className="h-5 w-5 text-purple-400 mr-1" />
                <span className="text-purple-700">{quiz.timeLimit} minutes incantation</span>
              </div>
              {attempted && (
                <div className="mt-2 bg-yellow-100 p-2 rounded text-sm">
                  <p className="font-medium text-yellow-800">Already attempted</p>
                  <p className="text-yellow-700">Score: {attempted.totalScore}</p>
                </div>
              )}
              <div className="mt-4 flex justify-between">
                <Button
                  className={`${attempted ? 'bg-gray-500' : 'bg-purple-600'} text-white hover:bg-purple-700 flex-1 mr-2`}
                  onClick={() => handleSelectQuiz(quiz)}
                  disabled={!!attempted}
                >
                  {attempted ? "Attempted" : "Commence Trial"}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => deleteQuiz(quiz._id!)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderQuizDetails = () => (
    <div className="bg-purple-50 p-8 min-h-screen">
      <h2 className="text-4xl font-bold text-purple-900 mb-4">{selectedQuiz?.title}</h2>
      <p className="text-purple-700 mb-2">
        <strong>Topic:</strong> {selectedQuiz?.topic}
      </p>
      <p className="text-purple-700 mb-2">
        <strong>Mastery Level:</strong>{" "}
        <span className={getDifficultyColor(selectedQuiz?.difficulty)}>
          {selectedQuiz?.difficulty}
        </span>
      </p>
      <p className="text-purple-700 mb-2">
        <strong>Points for Completion:</strong> {selectedQuiz?.points}
      </p>
      <p className="text-purple-700 mb-2">
        <strong>Total Questions:</strong> {selectedQuiz?.questions.length}
      </p>
      <p className="text-purple-700 mb-4">
        <strong>Time Limit:</strong> {selectedQuiz?.timeLimit} minutes
      </p>
      <div className="flex space-x-4">
        <Button variant="ghost" onClick={backToQuizList}>
          Back
        </Button>
        <Button
          className="bg-purple-600 text-white hover:bg-purple-700"
          onClick={startQuizAttempt}
        >
          Begin Quiz
        </Button>
      </div>
    </div>
  );

  const renderQuizAttempt = () => (
    <div className="bg-purple-50 p-8 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-purple-800">
          {selectedQuiz?.title} - Quiz
        </h2>
        <div className="text-xl font-medium text-purple-700">
          Time Left: {Math.floor(remainingTime / 60)}:
          {("0" + (remainingTime % 60)).slice(-2)}
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuizAttempt();
        }}
      >
        <div className="space-y-6">
          {selectedQuiz?.questions.map((q, index) => (
            <div key={index} className="bg-white p-4 rounded shadow mb-4">
              <p className="font-semibold mb-2">
                {index + 1}. {q.questionText}
              </p>
              <div className="space-y-2">
                {q.isMCQ &&
                q.options &&
                (Array.isArray(q.options)
                  ? q.options.length > 0
                  : typeof q.options === "string" && q.options.trim() !== "") ? (
                  (typeof q.options === "string"
                    ? q.options.split(",").map((opt) => opt.trim())
                    : q.options
                  ).map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={userAnswers[index] === option}
                        onChange={() => handleAnswerChange(index, option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))
                ) : (
                  <input
                    type="text"
                    placeholder="Your Answer"
                    value={userAnswers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-4 mt-6">
          <Button variant="ghost" onClick={() => { setAttemptingQuiz(false); setSelectedQuiz(null); }}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submitQuizAttempt}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            Submit Answers
          </Button>
        </div>
      </form>
    </div>
  );

  const renderQuizResult = () => (
    <div className="bg-purple-50 p-8 min-h-screen">
      <h2 className="text-3xl font-bold text-purple-800 mb-4">Quiz Completed</h2>
      {quizResult && (quizResult as any).tabViolation && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Tab Change Violation Detected</p>
          <p>Your quiz was automatically submitted due to changing tabs more than once.</p>
        </div>
      )}
      <p className="text-purple-700 mb-2">
        <strong>Total Score:</strong> {quizResult?.totalScore}
      </p>
      <p className="text-purple-700 mb-4">
        <strong>Time Taken:</strong> {quizResult?.timeTaken} seconds
      </p>
      <div className="space-y-4">
        {selectedQuiz?.questions.map((q, index) => {
          const userAns = userAnswers[index];
          const questionAttemptDetails = attemptDetails.find((a) => a.questionId === index);
          const isCorrect = questionAttemptDetails?.correct;
          const isUnanswered = !userAns || userAns.trim() === '';
          
          return (
            <div key={index} className="flex items-center">
              <div className="w-10">
                {isCorrect ? <Check className="text-green-500" /> : <X className="text-red-500" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {index + 1}. {q.questionText}
                </p>
                {isUnanswered ? (
                  <p className="text-red-500 italic">Not answered</p>
                ) : (
                  <p>Your Answer: {userAns}</p>
                )}
                <p>Correct Answer: {q.correctAnswer}</p>
                <p>
                  Marks: {isCorrect ? q.marks : 0} / {q.marks}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex space-x-4">
        <Button
          className="bg-purple-600 text-white hover:bg-purple-700"
          onClick={backToQuizList}
        >
          Back to Quizzes
        </Button>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => {
            setViewAttempts(true);
            setQuizResult(null);
            setSelectedQuiz(null);
          }}
        >
          View All Attempts
        </Button>
      </div>
    </div>
  );

  const renderCreateQuiz = () => (
    <div className="bg-purple-50 p-8 min-h-screen">
      <h2 className="text-3xl font-bold text-purple-800 mb-4">Create New Quiz</h2>
      {createQuizStep === 1 ? (
        <div className="space-y-4">
          <label className="block font-medium mb-1">Quiz Title:</label>
          <input
            type="text"
            placeholder="Quiz Title"
            value={newQuiz.title}
            onChange={(e) => handleNewQuizDetailChange("title", e.target.value)}
            className="w-full p-2 border rounded"
          />
          <label className="block font-medium mb-1">Topic:</label>
          <input
            type="text"
            placeholder="Topic"
            value={newQuiz.topic}
            onChange={(e) => handleNewQuizDetailChange("topic", e.target.value)}
            className="w-full p-2 border rounded"
          />
          <label className="block font-medium mb-1">Difficulty Level:</label>
          <select
            value={newQuiz.difficulty}
            onChange={(e) => handleNewQuizDetailChange("difficulty", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Difficulty</option>
            <option value="novice">Novice</option>
            <option value="adept">Adept</option>
            <option value="sage">Sage</option>
          </select>
          <label className="block font-medium mb-1">Time Limit (minutes):</label>
          <input
            type="number"
            placeholder="Time Limit (minutes)"
            value={newQuiz.timeLimit}
            onChange={(e) => handleNewQuizDetailChange("timeLimit", Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
          <label className="block font-medium mb-1">Points for Completion:</label>
          <input
            type="number"
            placeholder="Points for Completion"
            value={newQuiz.points}
            onChange={(e) => handleNewQuizDetailChange("points", Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
          <label className="block font-medium mb-1">Allow clearing attempts:</label>
          <input
            type="checkbox"
            checked={newQuiz.clearable}
            onChange={(e) => handleNewQuizDetailChange("clearable", e.target.checked)}
            className="mb-4"
          />
          <div className="flex justify-end">
            <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => setCreateQuizStep(2)}>
              Next
            </Button>
          </div>
          <div className="flex justify-start mt-4">
            <Button variant="ghost" onClick={() => setCreateQuizMode(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-bold">Questions (provide details for each):</p>
          {newQuiz.questions.map((q, index) => (
            <div key={index} className="border p-4 rounded mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Question {index + 1}</span>
                <Button variant="ghost" onClick={() => removeQuestion(index)}>
                  Remove
                </Button>
              </div>
              <label className="block font-medium mb-1">Question Text:</label>
              <input
                type="text"
                placeholder="Question Text"
                value={q.questionText}
                onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <label className="block font-medium mb-1">Question Type:</label>
              <div className="flex items-center space-x-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`qtype-${index}`}
                    checked={q.isMCQ === true}
                    onChange={() => handleQuestionChange(index, "isMCQ", true)}
                  />
                  <span className="ml-1">Multiple Choice</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`qtype-${index}`}
                    checked={q.isMCQ === false}
                    onChange={() => handleQuestionChange(index, "isMCQ", false)}
                  />
                  <span className="ml-1">Text Answer</span>
                </label>
              </div>
              {q.isMCQ && (
                <>
                  <label className="block font-medium mb-1">Options (comma separated):</label>
                  <input
                    type="text"
                    placeholder="Options (comma separated)"
                    value={typeof q.options === "string" ? q.options : (q.options as string[]).join(", ")}
                    onChange={(e) => handleQuestionChange(index, "options", e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                  />
                </>
              )}
              <label className="block font-medium mb-1">Correct Answer:</label>
              <input
                type="text"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <label className="block font-medium mb-1">Marks:</label>
              <input
                type="number"
                placeholder="Marks"
                value={q.marks}
                onChange={(e) => handleQuestionChange(index, "marks", Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          <Button variant="outline" onClick={addNewQuestion}>
            Add Another Question
          </Button>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setCreateQuizStep(1)}>
              Back
            </Button>
            <Button
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={handleSubmitNewQuiz}
            >
              Submit Quiz
            </Button>
          </div>
          <div className="flex justify-start mt-4">
            <Button variant="ghost" onClick={() => setCreateQuizMode(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAttemptsView = () => (
    <div className="bg-purple-50 p-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-4xl font-bold text-purple-900">My Quiz Attempts</h2>
          <Button
            variant="outline"
            className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
            onClick={() => {
              showConfirmModal(
                "Clear All Attempts",
                "Are you sure you want to clear all clearable attempts? This cannot be undone.",
                () => {
                  apiFetch(`api/quizAttempts/clearAll?user=${userData.rollno}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  })
                    .then((res) => res.json())
                    .then(() => {
                      showToast("All clearable attempts cleared successfully!", "success");
                      fetchAttempts();
                      // Also refresh quizzes to update the UI
                      fetchQuizzes();
                    })
                    .catch((err) => {
                      console.error("Error clearing all attempts:", err);
                      showToast("Failed to clear attempts", "error");
                    });
                }
              )
            }}
          >
            Clear All History
          </Button>
        </div>
        <Button
          className="bg-gray-600 text-white hover:bg-gray-700"
          onClick={() => setViewAttempts(false)}
        >
          Back
        </Button>
      </div>
      {attempts.length === 0 ? (
        <p className="text-purple-700">No quiz attempts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-purple-200 text-center">
                <th className="px-4 py-2 border">Quiz Title</th>
                <th className="px-4 py-2 border">Score</th>
                <th className="px-4 py-2 border">Time Taken (s)</th>
                <th className="px-4 py-2 border">Attempted At</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, idx) => (
                <tr key={idx} className="text-center">
                  <td className="px-4 py-2 border">
                    {attempt.quizId && typeof attempt.quizId === "object" ? attempt.quizId.title : "N/A"}
                  </td>
                  <td className="px-4 py-2 border">{attempt.totalScore}</td>
                  <td className="px-4 py-2 border">{attempt.timeTaken}</td>
                  <td className="px-4 py-2 border">
                    {new Date(attempt.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border">
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => clearAttempt(attempt._id, attempt.clearable)}
                      disabled={!attempt.clearable}
                    >
                      Clear
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Add rendering for the warning modal
  const renderTabWarningModal = () => (
    isTabWarningModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-bold text-yellow-600 mb-4">⚠️ Warning: Tab Change Detected</h3>
          <p className="mb-4">
            You have changed tabs or minimized the window. This is your first warning.
          </p>
          <p className="mb-4 font-bold">
            If you change tabs again, your quiz attempt will be automatically submitted.
          </p>
          <Button
            className="bg-yellow-600 text-white hover:bg-yellow-700 w-full"
            onClick={() => setIsTabWarningModalOpen(false)}
          >
            I Understand
          </Button>
        </div>
      </div>
    )
  );

  // Add rendering for the tab end modal with ability to view attempts
  const renderTabEndModal = () => (
    isTabEndModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-bold text-red-600 mb-4">Quiz Terminated</h3>
          <p className="mb-4">
            Your quiz has been automatically submitted due to multiple tab changes.
          </p>
          <p className="mb-4 font-bold">
            Changing tabs during a quiz is not allowed to maintain academic integrity.
          </p>
          <div className="flex space-x-3">
            <Button
              className="bg-purple-600 text-white hover:bg-purple-700 flex-1"
              onClick={() => {
                setIsTabEndModalOpen(false);
                backToQuizList();
              }}
            >
              Close
            </Button>
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 flex-1"
              onClick={() => {
                setIsTabEndModalOpen(false);
                setViewAttempts(true);
                setSelectedQuiz(null);
                setQuizResult(null);
              }}
            >
              View Attempts
            </Button>
          </div>
        </div>
      </div>
    )
  );

  // Render points validation modal
  const renderPointsValidationModal = () => (
    isPointsModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-xl font-bold text-yellow-600">Points Mismatch</h3>
          </div>
          <p className="mb-6 text-gray-700">
            The total points for the quiz ({pointsValidationData.quizPoints}) do not match the sum of question marks ({pointsValidationData.questionMarks}). Please adjust the points to match the sum of question marks.
          </p>
          <div className="flex space-x-3">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 flex-1"
              onClick={() => setIsPointsModalOpen(false)}
            >
              I Understand
            </Button>
          </div>
        </div>
      </div>
    )
  );

  // Render confirmation modal
  const renderConfirmModal = () => (
    isConfirmModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center mb-4">
            <Trash2 className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-xl font-bold text-red-600">{confirmAction.title}</h3>
          </div>
          <p className="mb-6 text-gray-700">{confirmAction.message}</p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700 flex-1"
              onClick={() => {
                confirmAction.onConfirm();
                setIsConfirmModalOpen(false);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    )
  );

  // Render toast notification
  const renderToast = () => (
    toast.visible && (
      <div className={`fixed bottom-4 right-4 max-w-md w-full p-4 rounded-lg shadow-lg z-50 flex items-center ${
        toast.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' :
        toast.type === 'error' ? 'bg-red-100 border-l-4 border-red-500' :
        'bg-yellow-100 border-l-4 border-yellow-500'
      }`}>
        {toast.type === 'success' ? (
          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
        ) : toast.type === 'error' ? (
          <X className="h-6 w-6 text-red-500 mr-3" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
        )}
        <p className={`${
          toast.type === 'success' ? 'text-green-800' :
          toast.type === 'error' ? 'text-red-800' :
          'text-yellow-800'
        }`}>
          {toast.message}
        </p>
      </div>
    )
  );

  // Update the function for going back to quiz list to ensure quiz availability is refreshed
  const backToQuizList = () => {
    setSelectedQuiz(null);
    setAttemptingQuiz(false);
    setQuizResult(null);
    fetchQuizzes();
    fetchAttempts();
  };

  return (
    <div className="flex min-h-screen bg-purple-50">
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
                  <Users className="mr-2 h-4 w-4" /> Discussion Forum
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/resources">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <FileText className="mr-2 h-4 w-4" /> Resources
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/bookmark">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/quiz">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <QuizIcon className="mr-2 h-4 w-4" /> Quizzes
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/calendar">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Calendar className="mr-2 h-4 w-4" /> Calendar
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/ai">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Bot className="mr-2 h-4 w-4" /> AI Assistant
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/profile">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="flex-1">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {viewAttempts
            ? renderAttemptsView()
            : createQuizMode
            ? renderCreateQuiz()
            : selectedQuiz
            ? attemptingQuiz
              ? renderQuizAttempt()
              : quizResult
              ? renderQuizResult()
              : renderQuizDetails()
            : renderQuizList()}
        </main>
      </div>
      {renderTabWarningModal()}
      {renderTabEndModal()}
      {renderPointsValidationModal()}
      {renderConfirmModal()}
      {renderToast()}
    </div>
  );
}
