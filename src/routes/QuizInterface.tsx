import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

export default function QuizInterface() {
  // User state and token retrieval
  const [userData, setUserData] = useState<any>(null);
  const token = localStorage.getItem("token");

  // Main view states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attemptingQuiz, setAttemptingQuiz] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<{ totalScore: number; timeTaken: number } | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);

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

  // Attempts view states
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [viewAttempts, setViewAttempts] = useState<boolean>(false);

  // Fetch user profile similar to Home.tsx so that we have the correct identifier
  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/profile", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
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

  // Fetch attempts using the logged-in user's roll number (if available)
  useEffect(() => {
    if (userData && userData.rollno) {
      fetchAttempts();
    }
  }, [userData]);

  const fetchQuizzes = () => {
    fetch("http://localhost:5000/api/quizzes")
      .then((res) => res.json())
      .then((data: Quiz[]) => setQuizzes(data))
      .catch((err) => console.error("Error fetching quizzes:", err));
  };

  const fetchAttempts = () => {
    // Use the user's roll number instead of a hardcoded value
    fetch(`http://localhost:5000/api/quizAttempts?user=${userData.rollno}`)
      .then((res) => res.json())
      .then((data) => setAttempts(data))
      .catch((err) => console.error("Error fetching attempts:", err));
  };

  // Timer effect: when attemptingQuiz becomes true, start countdown
  useEffect(() => {
    let timer: any;
    if (attemptingQuiz && selectedQuiz) {
      setRemainingTime(selectedQuiz.timeLimit * 60);
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
    }
    return () => clearInterval(timer);
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

  // When a quiz is selected from the list
  const handleSelectQuiz = (quiz: Quiz) => {
    // Prevent reattempt if already attempted by this user
    const attempted = attempts.find((a) => {
      const attemptedQuizId =
        (a.quizId && typeof a.quizId === "object" ? a.quizId._id : a.quizId) || "";
      return attemptedQuizId.toString() === quiz._id?.toString();
    });
    if (attempted) {
      alert("You have already attempted this quiz.");
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
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAns = [...userAnswers];
    newAns[index] = answer;
    setUserAnswers(newAns);
  };

  const submitQuizAttempt = () => {
    if (!selectedQuiz || !userData) return;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answersPayload = userAnswers.map((answer, index) => ({
      questionId: index,
      answer: answer.trim(),
    }));
  
    fetch(`http://localhost:5000/api/quizzes/${selectedQuiz._id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Use the logged-in user's roll number here
      body: JSON.stringify({ user: userData.rollno, answers: answersPayload, timeTaken }),
    })
      .then((res) => res.json())
      .then((data) => {
        setQuizResult({ totalScore: data.totalScore, timeTaken });
        setAttemptDetails(data.attempt.answers);
        setAttemptingQuiz(false);
        fetchAttempts();
      })
      .catch((err) => console.error("Error submitting quiz attempt:", err));
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
    const quizToSubmit = { ...newQuiz, questions: processedQuestions };
    fetch("http://localhost:5000/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quizToSubmit),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Quiz created successfully!");
        // Re–fetch quizzes so the new one is visible
        fetchQuizzes();
        setCreateQuizMode(false);
        setCreateQuizStep(1);
        setNewQuiz({ title: "", topic: "", difficulty: "", timeLimit: 0, points: 0, clearable: true, questions: [] });
      })
      .catch((err) => console.error("Error creating quiz:", err));
  };

  // Delete a quiz with confirmation
  const deleteQuiz = (quizId: string) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          setQuizzes(quizzes.filter((q) => q._id !== quizId));
        })
        .catch((err) => console.error("Error deleting quiz:", err));
    }
  };

  // Clear a single quiz attempt
  const clearAttempt = (attemptId?: string, clearable?: boolean) => {
    if (!attemptId) return;
    if (!clearable) {
      alert("This attempt cannot be cleared.");
      return;
    }
    if (window.confirm("Are you sure you want to clear this attempt?")) {
      fetch(`http://localhost:5000/api/quizAttempts/${attemptId}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          fetchAttempts();
        })
        .catch((err) => console.error("Error clearing attempt:", err));
    }
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
              className="bg-white border-2 border-purple-200 p-4 rounded hover:shadow-lg transition-shadow duration-300"
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
              <div className="mt-4 flex justify-between">
                <Button
                  className="bg-purple-600 text-white hover:bg-purple-700 flex-1 mr-2"
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
        <Button variant="ghost" onClick={() => setSelectedQuiz(null)}>
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
      <p className="text-purple-700 mb-2">
        <strong>Total Score:</strong> {quizResult?.totalScore}
      </p>
      <p className="text-purple-700 mb-4">
        <strong>Time Taken:</strong> {quizResult?.timeTaken} seconds
      </p>
      <div className="space-y-4">
        {selectedQuiz?.questions.map((q, index) => {
          const userAns = userAnswers[index];
          const isCorrect = attemptDetails.find((a) => a.questionId === index)?.correct;
          return (
            <div key={index} className="flex items-center">
              <div className="w-10">
                {isCorrect ? <Check className="text-green-500" /> : <X className="text-red-500" />}
              </div>
              <div>
                <p className="font-semibold">
                  {index + 1}. {q.questionText}
                </p>
                <p>Your Answer: {userAns}</p>
                <p>Correct Answer: {q.correctAnswer}</p>
                <p>
                  Marks: {isCorrect ? q.marks : 0} / {q.marks}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <Button
          className="bg-purple-600 text-white hover:bg-purple-700"
          onClick={() => {
            setQuizResult(null);
            setSelectedQuiz(null);
          }}
        >
          Close
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
              if (window.confirm("Are you sure you want to clear all attempts?")) {
                fetch(`http://localhost:5000/api/quizAttempts/clearAll?user=${userData.rollno}`, { method: "DELETE" })
                  .then((res) => res.json())
                  .then(() => {
                    alert("All clearable attempts cleared successfully!");
                    fetchAttempts();
                  })
                  .catch((err) => console.error("Error clearing all attempts:", err));
              }
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
              <Link to="/Resources">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <FileText className="mr-2 h-4 w-4" /> Resources
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
              <Link to="/profile">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <User className="mr-2 h-4 w-4" /> Profile
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
    </div>
  );
}
