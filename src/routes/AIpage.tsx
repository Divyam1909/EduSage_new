import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BookOpen, Home, Menu, MessageSquare, PenTool, Play, HelpCircle, 
  BookOpenCheck, Users, FileText, PuzzleIcon as Quiz, User, Bookmark, Calendar, 
  GraduationCap,
  Bot,
  Loader2
} from 'lucide-react'
import { Link } from "react-router-dom"
import { 
  generateInterviewQuestions, 
  evaluateInterviewResponse, 
  generateOverallFeedback 
} from "@/utils/gemini"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import AudioRecorder from "@/components/AudioRecorder"

// Types for interview data
interface InterviewQuestion {
  id: number;
  question: string;
  type: string;
  answer?: string;
  evaluation?: any;
}

interface InterviewData {
  jobRole: string;
  techStack: string;
  experience: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  overallFeedback: any;
  status: 'setup' | 'questions' | 'feedback' | 'complete';
  isLoading: boolean;
  error: string | null;
}

// Main component for the AI Assistant page that provides AI-powered learning tools
export default function Component() {
  // State for managing selected topics and chat modal visibility
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  
  // Interview state
  const [interviewData, setInterviewData] = useState<InterviewData>({
    jobRole: '',
    techStack: '',
    experience: 'entry-level',
    questions: [],
    currentQuestionIndex: 0,
    overallFeedback: null,
    status: 'setup',
    isLoading: false,
    error: null
  })

  // New state for audio mode
  const [useAudioResponse, setUseAudioResponse] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [audioTranscript, setAudioTranscript] = useState('');

  // List of available topics for filtering AI resources
  const topics = ["COA", "DLDA", "DSA", "EM", "DBMS"]

  // Handler to add or remove topics from the selected list
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  // Handle starting the interview
  const handleStartInterview = async () => {
    if (!interviewData.jobRole || !interviewData.techStack) {
      setInterviewData({
        ...interviewData,
        error: "Please fill in all required fields"
      });
      return;
    }

    setInterviewData({
      ...interviewData,
      isLoading: true,
      error: null
    });

    try {
      const questions = await generateInterviewQuestions(
        interviewData.jobRole,
        interviewData.techStack,
        interviewData.experience
      );

      setInterviewData({
        ...interviewData,
        questions,
        status: 'questions',
        isLoading: false
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      setInterviewData({
        ...interviewData,
        isLoading: false,
        error: "Failed to generate interview questions. Please try again."
      });
    }
  };

  // Handle audio recording complete
  const handleAudioAnalysisComplete = (analysis: any) => {
    setAudioAnalysis(analysis);
    if (analysis.transcript) {
      setAudioTranscript(analysis.transcript);
    }
  };

  // Handle submitting an answer from audio recording
  const handleSubmitAudioAnswer = async () => {
    if (!audioAnalysis) {
      return;
    }

    const currentQuestion = interviewData.questions[interviewData.currentQuestionIndex];
    
    setInterviewData({
      ...interviewData,
      isLoading: true
    });

    try {
      // Save the answer from transcript
      const updatedQuestions = [...interviewData.questions];
      updatedQuestions[interviewData.currentQuestionIndex] = {
        ...currentQuestion,
        answer: audioTranscript
      };

      // Use the AI analysis as evaluation
      const evaluation = {
        score: audioAnalysis.score,
        strengths: audioAnalysis.strengths,
        weaknesses: audioAnalysis.weaknesses,
        feedback: audioAnalysis.feedback,
        nonverbal_assessment: audioAnalysis.nonverbal_assessment || "No nonverbal assessment available"
      };

      // Update the question with the evaluation
      updatedQuestions[interviewData.currentQuestionIndex] = {
        ...updatedQuestions[interviewData.currentQuestionIndex],
        evaluation
      };

      // Check if this was the last question
      const isLastQuestion = interviewData.currentQuestionIndex === interviewData.questions.length - 1;

      if (isLastQuestion) {
        // Generate overall feedback
        const questionAnswers = updatedQuestions.map(q => ({
          question: q.question,
          answer: q.answer || '',
          evaluation: q.evaluation
        }));

        const feedback = await generateOverallFeedback(
          interviewData.jobRole,
          interviewData.techStack,
          interviewData.experience,
          questionAnswers
        );

        setInterviewData({
          ...interviewData,
          questions: updatedQuestions,
          overallFeedback: feedback,
          status: 'complete',
          isLoading: false
        });
      } else {
        // Move to the next question
        setInterviewData({
          ...interviewData,
          questions: updatedQuestions,
          currentQuestionIndex: interviewData.currentQuestionIndex + 1,
          isLoading: false
        });
      }
      
      // Reset audio states for next question
      setAudioAnalysis(null);
      setAudioTranscript('');
      setUseAudioResponse(false);
    } catch (error) {
      console.error('Error processing audio answer:', error);
      setInterviewData({
        ...interviewData,
        isLoading: false,
        error: "Failed to process your answer. Please try again."
      });
    }
  };

  // Handle submitting an answer to a question
  const handleSubmitAnswer = async (answer: string) => {
    if (!answer.trim()) {
      return;
    }

    const currentQuestion = interviewData.questions[interviewData.currentQuestionIndex];
    
    setInterviewData({
      ...interviewData,
      isLoading: true
    });

    try {
      // Save the answer
      const updatedQuestions = [...interviewData.questions];
      updatedQuestions[interviewData.currentQuestionIndex] = {
        ...currentQuestion,
        answer
      };

      // Get evaluation for this answer
      const evaluation = await evaluateInterviewResponse(
        interviewData.jobRole,
        interviewData.techStack,
        currentQuestion.question,
        answer
      );

      // Update the question with the evaluation
      updatedQuestions[interviewData.currentQuestionIndex] = {
        ...updatedQuestions[interviewData.currentQuestionIndex],
        evaluation
      };

      // Check if this was the last question
      const isLastQuestion = interviewData.currentQuestionIndex === interviewData.questions.length - 1;

      if (isLastQuestion) {
        // Generate overall feedback
        const questionAnswers = updatedQuestions.map(q => ({
          question: q.question,
          answer: q.answer || '',
          evaluation: q.evaluation
        }));

        const feedback = await generateOverallFeedback(
          interviewData.jobRole,
          interviewData.techStack,
          interviewData.experience,
          questionAnswers
        );

        setInterviewData({
          ...interviewData,
          questions: updatedQuestions,
          overallFeedback: feedback,
          status: 'complete',
          isLoading: false
        });
      } else {
        // Move to the next question
        setInterviewData({
          ...interviewData,
          questions: updatedQuestions,
          currentQuestionIndex: interviewData.currentQuestionIndex + 1,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      setInterviewData({
        ...interviewData,
        isLoading: false,
        error: "Failed to process your answer. Please try again."
      });
    }
  };

  // Reset the interview state
  const resetInterview = () => {
    setInterviewData({
      jobRole: '',
      techStack: '',
      experience: 'entry-level',
      questions: [],
      currentQuestionIndex: 0,
      overallFeedback: null,
      status: 'setup',
      isLoading: false,
      error: null
    });
  };

  return (
    <div className="flex h-screen bg-purple-50">
      {/* Left Side Navigation Menu */}
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
                  <HelpCircle className="mr-2 h-4 w-4" />
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <h1 className="text-4xl font-bold text-purple-800 mb-6 text-center">
              AI Assistant
            </h1>

        {/* Main content cards displaying AI features */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Interview Practice Card */}
          <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            <Button
              className="h-32 text-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-t-lg"
              onClick={() => console.log("Interviews clicked")}
            >
              <PenTool className="mr-2 h-6 w-6" />
              Interviews
            </Button>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-purple-800">
                Practice for your upcoming interviews with our AI-powered system. Get real-time feedback and improve your skills.
              </p>
              <Button 
                className="mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => setIsInterviewModalOpen(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Interview
              </Button>
            </div>
          </div>

          {/* AI Help Card */}
          <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            <Button
              className="h-32 text-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-t-lg"
              onClick={() => setIsChatModalOpen(true)}
            >
              <MessageSquare className="mr-2 h-6 w-6" />
              AI Help
            </Button>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-purple-800">
                Get instant assistance from our AI tutor. Ask questions, clarify concepts, and deepen your understanding.
              </p>
              <Button 
                className="mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => setIsChatModalOpen(true)}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </div>
          </div>

          {/* Test Preparation Card */}
          <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            <Button
              className="h-32 text-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-t-lg"
              onClick={() => console.log("Test Prep clicked")}
            >
              <BookOpen className="mr-2 h-6 w-6" />
              Test Prep
            </Button>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-purple-800">
                Prepare for your exams with our comprehensive study materials and practice tests. Track your progress and identify areas for improvement.
              </p>
              <Button 
                className="mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => console.log("Begin Preparation clicked")}
              >
                <BookOpenCheck className="mr-2 h-4 w-4" />
                Begin Preparation
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Topics Display */}
        {selectedTopics.length > 0 && (
          <div className="p-4 bg-purple-100 shadow-inner">
            <h3 className="text-xl font-semibold mb-2 text-purple-800">Selected Topics:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTopics.map((topic) => (
                <span key={topic} className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal for AI Help - Uses iframe with external chatbot */}
      {isChatModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-purple-800">AI Chatbot</h2>
              <Button variant="ghost" onClick={() => setIsChatModalOpen(false)}>Close</Button>
            </div>
            <iframe
              src="https://cdn.botpress.cloud/webchat/v2.3/shareable.html?configUrl=https://files.bpcontent.cloud/2024/12/08/16/20241208164025-EJ1B789D.json"
              title="AI Chatbot"
              className="w-full h-full"
              frameBorder="0"
            />
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-purple-800">AI Interview Practice</h2>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsInterviewModalOpen(false);
                  resetInterview();
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="p-6">
              {/* Interview Setup Form */}
              {interviewData.status === 'setup' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-purple-800">Let's set up your interview practice</h3>
                  
                  {interviewData.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                      {interviewData.error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobRole">Job Role / Position</Label>
                    <Input 
                      id="jobRole"
                      value={interviewData.jobRole}
                      onChange={(e) => setInterviewData({...interviewData, jobRole: e.target.value})}
                      placeholder="e.g., Frontend Developer, Data Scientist"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="techStack">Technologies / Skills</Label>
                    <Input 
                      id="techStack"
                      value={interviewData.techStack}
                      onChange={(e) => setInterviewData({...interviewData, techStack: e.target.value})}
                      placeholder="e.g., React, Node.js, Python"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <select
                      id="experience"
                      value={interviewData.experience}
                      onChange={(e) => setInterviewData({...interviewData, experience: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2"
                    >
                      <option value="entry-level">Entry Level</option>
                      <option value="mid-level">Mid Level</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleStartInterview}
                    disabled={interviewData.isLoading}
                  >
                    {interviewData.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Preparing Interview...
                      </>
                    ) : (
                      'Start Interview'
                    )}
                  </Button>
                </div>
              )}
              
              {/* Interview Questions */}
              {interviewData.status === 'questions' && interviewData.questions.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-purple-800">
                      Interview Question {interviewData.currentQuestionIndex + 1} of {interviewData.questions.length}
                    </h3>
                    <span className="text-sm text-purple-600 font-medium">
                      {interviewData.questions[interviewData.currentQuestionIndex].type} question
                    </span>
                  </div>
                  
                  <Progress value={(interviewData.currentQuestionIndex / interviewData.questions.length) * 100} />
                  
                  {interviewData.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                      {interviewData.error}
                    </div>
                  )}
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-lg font-medium">
                      {interviewData.questions[interviewData.currentQuestionIndex].question}
                    </p>
                  </div>
                  
                  {/* Toggle between text and audio response */}
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={() => setUseAudioResponse(false)}
                      className={`px-4 py-2 rounded-lg ${!useAudioResponse ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Text Response
                    </button>
                    <button
                      onClick={() => setUseAudioResponse(true)}
                      className={`px-4 py-2 rounded-lg ${useAudioResponse ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Audio Response
                    </button>
                  </div>
                  
                  {!useAudioResponse ? (
                    // Text response
                    <div className="space-y-2">
                      <Label htmlFor="answer">Your Answer</Label>
                      <Textarea 
                        id="answer"
                        placeholder="Type your answer here..."
                        rows={5}
                        className="w-full"
                      />
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={(e) => {
                          const textarea = document.getElementById('answer') as HTMLTextAreaElement;
                          handleSubmitAnswer(textarea.value);
                        }}
                        disabled={interviewData.isLoading}
                      >
                        {interviewData.isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Submit Answer'
                        )}
                      </Button>
                    </div>
                  ) : (
                    // Audio response
                    <div className="space-y-4">
                      <AudioRecorder
                        question={interviewData.questions[interviewData.currentQuestionIndex].question}
                        onRecordingComplete={handleAudioAnalysisComplete}
                        onTranscriptReceived={setAudioTranscript}
                      />
                      
                      {audioAnalysis && (
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={handleSubmitAudioAnswer}
                          disabled={interviewData.isLoading || !audioAnalysis}
                        >
                          {interviewData.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Submit Audio Response'
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Interview Feedback */}
              {interviewData.status === 'complete' && interviewData.overallFeedback && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-purple-800 text-center">Interview Assessment Report</h3>
                  
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-medium">Overall Score:</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-purple-800 mr-2">
                          {interviewData.overallFeedback.overall_score}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-purple-700 mb-1">Summary</h4>
                        <p>{interviewData.overallFeedback.summary}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-purple-700 mb-1">Key Strengths</h4>
                        <ul className="list-disc pl-5">
                          {interviewData.overallFeedback.key_strengths.map((strength: string, index: number) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-purple-700 mb-1">Areas for Improvement</h4>
                        <ul className="list-disc pl-5">
                          {interviewData.overallFeedback.key_weaknesses.map((weakness: string, index: number) => (
                            <li key={index}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-purple-700 mb-1">Technical Competence</h4>
                        <p>{interviewData.overallFeedback.technical_competence}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-purple-700 mb-1">Communication Skills</h4>
                        <p>{interviewData.overallFeedback.communication_skills}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-purple-700 mb-1">Recommendations</h4>
                        <p>{interviewData.overallFeedback.recommendations}</p>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-purple-700 mb-1">Hire Recommendation</h4>
                        <p className="font-bold">{interviewData.overallFeedback.hire_recommendation}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={resetInterview}
                    >
                      Try Another Interview
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsInterviewModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
