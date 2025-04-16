import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BookOpen, Home, Menu, MessageSquare, PenTool, Play, HelpCircle, 
  BookOpenCheck, Users, FileText, PuzzleIcon as Quiz, User, Bookmark, Calendar, 
  GraduationCap,
  Bot,
  Loader2,
  Mic,
  Video
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
import VideoRecorder from "@/components/VideoRecorder"

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
  interviewMode: 'video' | 'chat';
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  overallFeedback: any;
  status: 'setup' | 'questions' | 'feedback' | 'complete';
  isLoading: boolean;
  error: string | null;
}

// Add TypeScript definition for Botpress WebChat
declare global {
  interface Window {
    botpressWebChat: {
      init: (config: any) => void;
      sendEvent: (event: any) => void;
    }
  }
}

// Main component for the AI Assistant page that provides AI-powered learning tools
export default function Component() {
  // State for managing selected topics and chat modal visibility
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  
  // Chat iframe reference
  const chatIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Add a new confirmation modal state and media check state
  const [isStopConfirmationOpen, setIsStopConfirmationOpen] = useState(false);
  const [mediaCheckPassed, setMediaCheckPassed] = useState(false);
  const [invalidFields, setInvalidFields] = useState<{jobRole?: string, techStack?: string}>({});
  
  // Interview state
  const [interviewData, setInterviewData] = useState<InterviewData>({
    jobRole: '',
    techStack: '',
    experience: 'entry-level',
    interviewMode: 'chat',
    questions: [],
    currentQuestionIndex: 0,
    overallFeedback: null,
    status: 'setup',
    isLoading: false,
    error: null
  })

  // Response mode state (text, audio, or video)
  const [responseMode, setResponseMode] = useState<'text' | 'audio' | 'video'>('text');
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
  const [responseTranscript, setResponseTranscript] = useState('');

  // List of available topics for filtering AI resources
  const topics = ["COA", "DLDA", "DSA", "EM", "DBMS"]

  // Add Botpress script once when component mounts
  useEffect(() => {
    if (!document.getElementById('botpress-script-inject')) {
      const injectScript = document.createElement('script');
      injectScript.id = 'botpress-script-inject';
      injectScript.src = 'https://cdn.botpress.cloud/webchat/v2.3/inject.js';
      injectScript.async = true;
      document.body.appendChild(injectScript);
    }
    
    if (!document.getElementById('botpress-script-custom')) {
      const customScript = document.createElement('script');
      customScript.id = 'botpress-script-custom';
      customScript.src = 'https://files.bpcontent.cloud/2025/04/16/01/20250416010833-Z5K25VNT.js';
      customScript.async = true;
      document.body.appendChild(customScript);
    }
    
    return () => {
      // Clean up scripts if component unmounts
      const injectScript = document.getElementById('botpress-script-inject');
      const customScript = document.getElementById('botpress-script-custom');
      if (injectScript) injectScript.remove();
      if (customScript) customScript.remove();
    };
  }, []);

  // Function to initialize and open Botpress chat
  const openBotpressChat = () => {
    setIsChatModalOpen(true);
    
    // If Botpress window object exists, initialize it
    if (window.botpressWebChat) {
      window.botpressWebChat.init({
        botId: '7357020a-ba8e-40e9-a9ef-4d51cb5b00e8',
        hostUrl: 'https://cdn.botpress.cloud/webchat/v2.3',
        messagingUrl: 'https://messaging.botpress.cloud',
        clientId: '7357020a-ba8e-40e9-a9ef-4d51cb5b00e8',
        botName: 'EduSage AI Assistant',
        avatarUrl: '/ES_logo2.png',
        stylesheet: 'https://webchat-styler-css.botpress.app/prod/code/7b9fed71-b7ce-4aca-a03a-3172b38ff768/v39134/style.css',
        useSessionStorage: true,
        showConversationsButton: false,
        enableTranscriptDownload: false,
        closeOnEscape: true,
        showHeaderIcon: true
      });
    }
  };

  // Add window.botpressWebChat type definition
  useEffect(() => {
    // Add type declaration for Botpress
    window.botpressWebChat = window.botpressWebChat || {};
  }, []);

  // Handler to add or remove topics from the selected list
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  // Add this function to validate the job role and tech stack
  const validateInterviewInputs = () => {
    const errors: {jobRole?: string, techStack?: string} = {};
    
    // Common tech skills/languages/frameworks
    const validTechStacks = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby', 'php',
      'react', 'angular', 'vue', 'svelte', 'node', 'express', 'django', 'flask', 'spring', 'asp.net',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git',
      'mongodb', 'mysql', 'postgresql', 'sql server', 'oracle', 'redis', 'elasticsearch',
      'machine learning', 'data science', 'artificial intelligence', 'deep learning', 'nlp',
      'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'material-ui', 'chakra-ui',
      'devops', 'security', 'blockchain', 'graphql', 'rest api', 'microservices'
    ];
    
    // Common job roles in tech
    const validJobRoles = [
      'frontend developer', 'backend developer', 'fullstack developer', 'web developer', 
      'software engineer', 'software developer', 'mobile developer', 'ios developer', 'android developer',
      'data scientist', 'data analyst', 'data engineer', 'machine learning engineer', 'ai engineer',
      'devops engineer', 'site reliability engineer', 'cloud engineer', 'security engineer',
      'qa engineer', 'test engineer', 'automation engineer', 'database administrator', 'dba',
      'product manager', 'project manager', 'scrum master', 'agile coach', 'ui designer', 'ux designer',
      'ui/ux designer', 'graphic designer', 'technical writer', 'content developer',
      'systems administrator', 'network engineer', 'it support', 'helpdesk technician',
      'blockchain developer', 'game developer', 'ar/vr developer', 'embedded systems engineer'
    ];
    
    // Check if the job role is valid (case insensitive)
    const jobRoleLower = interviewData.jobRole.toLowerCase().trim();
    if (!interviewData.jobRole) {
      errors.jobRole = "Job role is required";
    } else if (!validJobRoles.some(role => jobRoleLower.includes(role))) {
      errors.jobRole = "Please enter a valid job role";
    }
    
    // Check if at least one valid tech stack is mentioned
    const techStackLower = interviewData.techStack.toLowerCase().trim();
    if (!interviewData.techStack) {
      errors.techStack = "Tech stack is required";
    } else if (!validTechStacks.some(tech => techStackLower.includes(tech))) {
      errors.techStack = "Please enter valid technologies or skills";
    }
    
    setInvalidFields(errors);
    return Object.keys(errors).length === 0;
  };

  // Add this function to check audio/video devices
  const checkMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Audio and video tracks obtained successfully
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      if (!audioTrack || !videoTrack) {
        throw new Error("Missing required media tracks");
      }
      
      // Show a preview to the user so they can verify their camera and mic
      const videoPreview = document.getElementById('media-check-preview') as HTMLVideoElement;
      if (videoPreview) {
        videoPreview.srcObject = stream;
        videoPreview.play();
      }
      
      setMediaCheckPassed(true);
      return true;
    } catch (error) {
      console.error('Media device check failed:', error);
      setMediaCheckPassed(false);
      return false;
    }
  };

  // Handle starting the interview with validation
  const handleStartInterview = async () => {
    // First validate the inputs
    if (!validateInterviewInputs()) {
      return;
    }
    
    // For video interviews, check media devices
    if (interviewData.interviewMode === 'video') {
      const mediaOk = await checkMediaDevices();
      if (!mediaOk) {
        setInterviewData({
          ...interviewData,
          error: "Camera or microphone access failed. Please check your device permissions."
        });
        return;
      }
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

      // Set appropriate response mode based on interview mode
      if (interviewData.interviewMode === 'video') {
        setResponseMode('video');
      } else {
        setResponseMode('text'); // Default to text for chat mode
      }

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
      setResponseTranscript(analysis.transcript);
    }
  };

  // Handle video recording complete
  const handleVideoAnalysisComplete = (analysis: any) => {
    setVideoAnalysis(analysis);
    if (analysis.transcript) {
      setResponseTranscript(analysis.transcript);
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
        answer: responseTranscript
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
      setResponseTranscript('');
      setResponseMode('text');
    } catch (error) {
      console.error('Error processing audio answer:', error);
      setInterviewData({
        ...interviewData,
        isLoading: false,
        error: "Failed to process your answer. Please try again."
      });
    }
  };

  // Add this helper function just before the handleSubmitVideoAnswer function
  // This ensures all camera and microphone resources are properly released
  const stopAllMediaTracks = () => {
    console.log("Stopping all media tracks");
    
    // First, stop any tracks from video elements with srcObject
    const allVideoElements = document.querySelectorAll('video');
    allVideoElements.forEach(video => {
      if (video.srcObject instanceof MediaStream) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
        video.srcObject = null;
        video.load(); // Force reload to clear any buffered content
      }
    });
    
    // Also check for any audio elements with srcObject
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      if (audio.srcObject instanceof MediaStream) {
        const stream = audio.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        audio.srcObject = null;
      }
    });
    
    // Finally, try to get any active user media and stop those tracks too
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        // This error is expected if no media is active, so we can ignore it
      });
  };

  // Handle submitting an answer from video recording
  const handleSubmitVideoAnswer = async () => {
    if (!videoAnalysis) {
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
        answer: responseTranscript
      };

      // Use the AI analysis as evaluation
      const evaluation = {
        score: videoAnalysis.score,
        strengths: videoAnalysis.strengths,
        weaknesses: videoAnalysis.weaknesses,
        feedback: videoAnalysis.feedback,
        nonverbal_assessment: videoAnalysis.nonverbal_assessment || "No nonverbal assessment available",
        visual_assessment: videoAnalysis.visual_assessment || "No visual assessment available"
      };

      // Update the question with the evaluation
      updatedQuestions[interviewData.currentQuestionIndex] = {
        ...updatedQuestions[interviewData.currentQuestionIndex],
        evaluation
      };

      // Check if this was the last question
      const isLastQuestion = interviewData.currentQuestionIndex === interviewData.questions.length - 1;

      // Reset video states for next question - do this BEFORE changing the question
      setVideoAnalysis(null);
      setResponseTranscript('');
      
      // Clear any video playback elements
      const videosElements = document.querySelectorAll('video[controls]');
      videosElements.forEach(video => {
        if (video.parentElement && !video.hasAttribute('ref')) {
          // Hide the entire review section to clean up the UI
          video.parentElement.style.display = 'none';
        }
      });
      
      // Also clear any transcript display elements
      const transcriptElements = document.querySelectorAll('.transcript-container');
      transcriptElements.forEach(elem => {
        if (elem.parentElement) {
          elem.parentElement.style.display = 'none';
        }
      });

      if (isLastQuestion) {
        // If it's the last question, stop all camera streams before generating feedback
        stopAllMediaTracks();

        // Hide the video recorder completely after last question
        const videoRecorderContainer = document.querySelector('.video-preview')?.closest('.flex.flex-col');
        if (videoRecorderContainer instanceof HTMLElement) {
          videoRecorderContainer.style.display = 'none';
        }
        
        // First update UI to show we're generating feedback
        setInterviewData({
          ...interviewData,
          questions: updatedQuestions,
          status: 'feedback',
          isLoading: true
        });
        
        try {
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

          // Once feedback is ready, update to complete state
          setInterviewData(prevState => ({
            ...prevState,
            overallFeedback: feedback,
            status: 'complete',
            isLoading: false
          }));
        } catch (error) {
          console.error('Error generating feedback:', error);
          setInterviewData(prevState => ({
            ...prevState,
            error: "Failed to generate feedback. Please try again.",
            isLoading: false
          }));
        }
      } else {
        // Move to the next question AFTER clearing states
        setInterviewData({
          ...interviewData,
          questions: updatedQuestions,
          currentQuestionIndex: interviewData.currentQuestionIndex + 1,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error processing video answer:', error);
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
      interviewMode: 'chat',
      questions: [],
      currentQuestionIndex: 0,
      overallFeedback: null,
      status: 'setup',
      isLoading: false,
      error: null
    });
    setResponseMode('text');
    setAudioAnalysis(null);
    setVideoAnalysis(null);
    setResponseTranscript('');
  };

  // Add a useEffect hook to monitor the interviewData.status changes and close camera when feedback is complete
  // Place this near other useEffect hooks in the component
  useEffect(() => {
    // When the interview status changes to 'complete', ensure all media tracks are stopped
    if (interviewData.status === 'complete') {
      console.log("Interview complete, stopping all media tracks");
      stopAllMediaTracks();
      
      // Hide any video container elements
      const videoContainers = document.querySelectorAll('.video-preview');
      videoContainers.forEach(container => {
        const parentElement = container.closest('.flex.flex-col');
        if (parentElement instanceof HTMLElement) {
          parentElement.style.display = 'none';
        }
      });
    }
  }, [interviewData.status]);

  // Now create a collapsible component that we'll use for the feedback sections
  const CollapsibleSection = ({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
      <div className="border border-purple-200 rounded-lg mb-4 overflow-hidden">
        <button 
          className="w-full p-3 bg-purple-50 flex justify-between items-center text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h4 className="font-medium text-purple-800">{title}</h4>
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </button>
        <div className={`transition-all duration-300 ${isOpen ? 'max-h-screen opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    );
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
              onClick={openBotpressChat}
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
                onClick={openBotpressChat}
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

      {/* Chat Modal for AI Help - Updated with new Botpress integration */}
      {isChatModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-800 text-white">
              <div className="flex items-center">
                <img src="/ES_logo2.png" alt="EduSage" className="w-8 h-8 mr-2" />
                <h2 className="text-xl font-bold">EduSage AI Assistant</h2>
              </div>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-purple-700"
                onClick={() => {
                  setIsChatModalOpen(false);
                  // Reset chat if needed
                  if (window.botpressWebChat && window.botpressWebChat.sendEvent) {
                    window.botpressWebChat.sendEvent({ type: 'hide' });
                  }
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="flex-1 bg-gray-50 relative">
              {/* Botpress container - styled to match EduSage design */}
              <div 
                id="botpress-webchat-container"
                className="w-full h-full"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  // Using CSS variables through inline style object
                  // These will be picked up by the Botpress webchat
                  '--bp-bot-message-bg-color': '#9333ea',
                  '--bp-bot-message-text-color': 'white',
                  '--bp-user-message-bg-color': '#e9d5ff',
                  '--bp-user-message-text-color': '#4b5563',
                  '--bp-header-bg-color': '#9333ea',
                  '--bp-header-text-color': 'white',
                } as React.CSSProperties} 
              />

              {/* Fallback for older browsers or if script fails to load */}
              <iframe
                ref={chatIframeRef}
                src={`https://cdn.botpress.cloud/webchat/v2.3/index.html?botId=7357020a-ba8e-40e9-a9ef-4d51cb5b00e8&hostUrl=https://cdn.botpress.cloud/webchat/v2.3&messagingUrl=https://messaging.botpress.cloud&clientId=7357020a-ba8e-40e9-a9ef-4d51cb5b00e8`}
                id="botpress-webchat-iframe"
                className="w-full h-full border-none"
                style={{ display: 'none' }}
                title="EduSage AI Chatbot"
              />
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-purple-800">AI Interview Practice</h2>
              {interviewData.status !== 'complete' && (
                <Button 
                  variant={interviewData.status === 'setup' ? 'ghost' : 'destructive'}
                  className={interviewData.status !== 'setup' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                  onClick={() => {
                    if (interviewData.status === 'setup') {
                      // If in setup stage, just close without confirmation
                      stopAllMediaTracks();
                      setIsInterviewModalOpen(false);
                      resetInterview();
                    } else {
                      // If interview in progress, show confirmation
                      setIsStopConfirmationOpen(true);
                    }
                  }}
                >
                  {interviewData.status === 'setup' ? 'Close' : 'Stop Interview'}
                </Button>
              )}
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
                      className={invalidFields.jobRole ? "border-red-500" : ""}
                    />
                    {invalidFields.jobRole && (
                      <p className="text-red-500 text-sm mt-1">{invalidFields.jobRole}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="techStack">Technologies / Skills</Label>
                    <Input 
                      id="techStack"
                      value={interviewData.techStack}
                      onChange={(e) => setInterviewData({...interviewData, techStack: e.target.value})}
                      placeholder="e.g., React, Node.js, Python"
                      className={invalidFields.techStack ? "border-red-500" : ""}
                    />
                    {invalidFields.techStack && (
                      <p className="text-red-500 text-sm mt-1">{invalidFields.techStack}</p>
                    )}
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
                  
                  <div className="space-y-2">
                    <Label>Interview Format</Label>
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant={interviewData.interviewMode === 'chat' ? 'default' : 'outline'}
                        className={interviewData.interviewMode === 'chat' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        onClick={() => setInterviewData({...interviewData, interviewMode: 'chat'})}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat Interview
                      </Button>
                      <Button
                        type="button"
                        variant={interviewData.interviewMode === 'video' ? 'default' : 'outline'}
                        className={interviewData.interviewMode === 'video' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        onClick={() => setInterviewData({...interviewData, interviewMode: 'video'})}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Video Interview
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {interviewData.interviewMode === 'chat' 
                        ? 'Chat interview allows you to respond with text or audio.' 
                        : 'Video interview requires you to respond with video, providing both verbal and non-verbal feedback.'}
                    </p>
                  </div>
                  
                  {/* Add media check for video interviews */}
                  {interviewData.interviewMode === 'video' && (
                    <div className="mt-4 p-4 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-3">Camera and Microphone Check</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Please verify that your camera and microphone are working correctly before starting the interview.
                      </p>
                      
                      <div className="flex flex-col items-center mb-4">
                        <video 
                          id="media-check-preview" 
                          className="w-full max-w-md h-60 bg-gray-100 rounded mb-2 object-cover"
                          muted
                          playsInline
                        ></video>
                        
                        <Button
                          className="bg-purple-500 hover:bg-purple-600 text-white"
                          onClick={checkMediaDevices}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Check Camera & Mic
                        </Button>
                        
                        {mediaCheckPassed && (
                          <p className="text-green-600 text-sm mt-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Camera and microphone are working
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleStartInterview}
                    disabled={interviewData.isLoading || (interviewData.interviewMode === 'video' && !mediaCheckPassed)}
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
                  
                  {/* Toggle between response modes based on interview mode */}
                  {interviewData.interviewMode === 'chat' ? (
                    <div className="flex items-center space-x-2 mb-4">
                      <button
                        onClick={() => setResponseMode('text')}
                        className={`px-4 py-2 rounded-lg flex items-center ${responseMode === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        <span>Text</span>
                      </button>
                      <button
                        onClick={() => setResponseMode('audio')}
                        className={`px-4 py-2 rounded-lg flex items-center ${responseMode === 'audio' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        <Mic className="mr-1 h-4 w-4" />
                        <span>Audio</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-purple-100 p-3 rounded-lg mb-4">
                      <div className="flex items-center text-purple-800">
                        <Video className="mr-2 h-5 w-5" />
                        <span className="font-medium">Video Interview Mode</span>
                      </div>
                      <p className="text-sm text-purple-700 mt-1">
                        In video interview mode, your responses will be recorded with both video and audio to provide comprehensive feedback on your presentation and communication skills.
                      </p>
                    </div>
                  )}
                  
                  {interviewData.interviewMode === 'chat' && responseMode === 'text' && (
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
                  )}
                  
                  {interviewData.interviewMode === 'chat' && responseMode === 'audio' && (
                    // Audio response
                    <div className="space-y-4">
                      <AudioRecorder
                        question={interviewData.questions[interviewData.currentQuestionIndex].question}
                        onRecordingComplete={handleAudioAnalysisComplete}
                        onTranscriptReceived={setResponseTranscript}
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

                  {interviewData.interviewMode === 'video' && (
                    // Video response - only option for video interview mode
                    <div className="space-y-4">
                      <VideoRecorder
                        key={`question-${interviewData.currentQuestionIndex}`}
                        question={interviewData.questions[interviewData.currentQuestionIndex].question}
                        onRecordingComplete={handleVideoAnalysisComplete}
                        onTranscriptReceived={setResponseTranscript}
                        questionIndex={interviewData.currentQuestionIndex}
                      />
                      
                      {videoAnalysis && (
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={handleSubmitVideoAnswer}
                          disabled={interviewData.isLoading || !videoAnalysis}
                        >
                          {interviewData.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Submit Video Response'
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Feedback Generation Screen */}
              {interviewData.status === 'feedback' && (
                <div className="flex flex-col items-center justify-center space-y-8 py-12" data-state="feedback">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-purple-800 mb-4">
                      Interview Complete!
                    </h3>
                    <p className="text-lg text-purple-700 mb-6">
                      Thank you for completing your {interviewData.interviewMode} interview for the {interviewData.jobRole} position.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6 w-full max-w-xl">
                    <div className="flex items-center justify-center mb-4">
                      <Loader2 className="w-10 h-10 text-purple-600 animate-spin mr-4" />
                      <div>
                        <h4 className="text-lg font-medium text-purple-800">Generating Your Assessment</h4>
                        <p className="text-sm text-purple-600">
                          Our AI is analyzing your interview responses and preparing detailed feedback...
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-6">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Analyzing:</span> Communication style, technical knowledge, problem-solving approach
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Evaluating:</span> Strengths, areas for improvement, and overall performance
                      </p>
                      {interviewData.interviewMode === 'video' && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Processing:</span> Visual presentation, body language, and non-verbal communication
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Interview Feedback */}
              {interviewData.status === 'complete' && interviewData.overallFeedback && (
                <div className="space-y-6 relative">
                  {/* Fixed close button at the top */}
                  <div className="sticky top-0 right-0 flex justify-end z-10 mb-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 p-0 shadow-md flex items-center justify-center"
                      onClick={() => setIsInterviewModalOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-purple-800 text-center">Interview Assessment Report</h3>
                  
                  <div className="bg-purple-50 p-6 rounded-lg">
                    {/* Add interview mode indicator */}
                    <div className="flex items-center justify-end mb-2">
                      <span className="px-3 py-1 rounded-full bg-purple-200 text-purple-800 text-sm flex items-center">
                        {interviewData.interviewMode === 'video' ? (
                          <>
                            <Video className="mr-1 h-3 w-3" />
                            Video Interview
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Chat Interview
                          </>
                        )}
                      </span>
                    </div>
                  
                    {/* Overall Score Section */}
                    <CollapsibleSection title="Overall Performance" defaultOpen={true}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                          <div className="text-3xl font-bold text-purple-800">
                            {interviewData.overallFeedback.overall_score?.total || interviewData.overallFeedback.overall_score || 0}/10
                          </div>
                          <div className="text-sm text-gray-600">Total Score</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-purple-700">
                            {interviewData.overallFeedback.overall_score?.technical_knowledge || '—'}/10
                          </div>
                          <div className="text-sm text-gray-600">Technical</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-purple-700">
                            {interviewData.overallFeedback.overall_score?.communication || '—'}/10
                          </div>
                          <div className="text-sm text-gray-600">Communication</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-purple-700">
                            {interviewData.overallFeedback.overall_score?.problem_solving || '—'}/10
                          </div>
                          <div className="text-sm text-gray-600">Problem Solving</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-purple-700">
                            {interviewData.overallFeedback.overall_score?.culture_fit || '—'}/10
                          </div>
                          <div className="text-sm text-gray-600">Culture Fit</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <p className="text-purple-800 font-medium mb-1">Summary</p>
                        <p className="text-gray-700">{interviewData.overallFeedback.summary}</p>
                      </div>
                    </CollapsibleSection>
                    
                    {/* Strengths and Weaknesses */}
                    <CollapsibleSection title="Strengths & Areas for Improvement">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-purple-700 mb-3 flex items-center">
                            <span className="inline-block w-6 h-6 rounded-full bg-green-100 text-green-700 mr-2 flex items-center justify-center text-xs">+</span>
                            Key Strengths
                          </h4>
                          <ul className="space-y-2">
                            {interviewData.overallFeedback.key_strengths.map((strength: string, index: number) => (
                              <li key={index} className="bg-white p-3 rounded-lg border-l-4 border-green-400">
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-purple-700 mb-3 flex items-center">
                            <span className="inline-block w-6 h-6 rounded-full bg-amber-100 text-amber-700 mr-2 flex items-center justify-center text-xs">!</span>
                            Areas for Improvement
                          </h4>
                          <ul className="space-y-2">
                            {interviewData.overallFeedback.key_weaknesses.map((weakness: string, index: number) => (
                              <li key={index} className="bg-white p-3 rounded-lg border-l-4 border-amber-400">
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CollapsibleSection>
                    
                    {/* Competency Assessment */}
                    <CollapsibleSection title="Detailed Assessment">
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-purple-100">
                          <p className="text-purple-800 font-medium mb-1">Technical Competence</p>
                          <p className="text-gray-700">{interviewData.overallFeedback.technical_competence}</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-purple-100">
                          <p className="text-purple-800 font-medium mb-1">Communication Skills</p>
                          <p className="text-gray-700">{interviewData.overallFeedback.communication_skills}</p>
                        </div>
                        
                        {/* Display visual assessment if available */}
                        {interviewData.overallFeedback.visual_presentation && (
                          <div className="bg-white p-4 rounded-lg border border-purple-100">
                            <p className="text-purple-800 font-medium mb-1">Visual Presentation</p>
                            <p className="text-gray-700">{interviewData.overallFeedback.visual_presentation}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                    
                    {/* Question-by-Question Feedback */}
                    <CollapsibleSection title="Question-by-Question Feedback">
                      <div className="space-y-4">
                        {interviewData.questions.map((question, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-purple-100 mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-purple-800">Question {index + 1}</h4>
                              {question.evaluation && (
                                <span className="px-2 py-1 bg-purple-100 rounded text-purple-800 text-sm">
                                  Score: {question.evaluation.score?.overall || question.evaluation.score || 0}/10
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-700 mb-3">{question.question}</p>
                            
                            {question.answer && (
                              <div className="mb-3">
                                <p className="text-purple-800 font-medium text-sm mb-1">Your Answer:</p>
                                <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">{question.answer}</p>
                              </div>
                            )}
                            
                            {question.evaluation && (
                              <div>
                                <p className="text-purple-800 font-medium text-sm mb-1">Feedback:</p>
                                <p className="text-gray-700 text-sm">
                                  {question.evaluation.feedback?.summary || question.evaluation.feedback}
                                </p>
                                
                                {question.evaluation.feedback?.improvement_tips && (
                                  <div className="mt-2">
                                    <p className="text-purple-700 text-xs font-medium mb-1">Improvement Tips:</p>
                                    <ul className="list-disc pl-5 text-xs text-gray-600">
                                      {question.evaluation.feedback.improvement_tips.map((tip: string, tipIndex: number) => (
                                        <li key={tipIndex}>{tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                    
                    {/* Specific Feedback */}
                    {interviewData.overallFeedback.question_specific_feedback && (
                      <CollapsibleSection title="Question-Specific Insights">
                        <div className="space-y-3">
                          {interviewData.overallFeedback.question_specific_feedback.map((feedback: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-purple-100">
                              <p className="text-purple-800 font-medium mb-1">Question {feedback.question_number}</p>
                              <p className="text-gray-700 mb-2"><span className="font-medium">Highlights:</span> {feedback.highlights}</p>
                              <p className="text-gray-700"><span className="font-medium">Improvement:</span> {feedback.improvement}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {/* Improvement Tips */}
                    <CollapsibleSection title="Interview Strategy & Preparation">
                      <div className="space-y-4">
                        {/* Interview Strategy Tips */}
                        <div className="bg-white p-4 rounded-lg border border-purple-100">
                          <p className="text-purple-800 font-medium mb-2">Interview Strategy Tips</p>
                          <ul className="space-y-2">
                            {(interviewData.overallFeedback.interview_strategy_tips || interviewData.overallFeedback.recommendations || []).map((tip: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-5 h-5 rounded-full bg-purple-100 text-purple-800 mr-2 flex-shrink-0 flex items-center justify-center text-xs">{index + 1}</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Preparation Recommendations */}
                        {interviewData.overallFeedback.preparation_recommendations && (
                          <div className="bg-white p-4 rounded-lg border border-purple-100">
                            <p className="text-purple-800 font-medium mb-2">Preparation Recommendations</p>
                            <ul className="space-y-2">
                              {interviewData.overallFeedback.preparation_recommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0 flex items-center justify-center text-xs">
                                    <BookOpen className="h-3 w-3" />
                                  </span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                    
                    {/* Hire Recommendation */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-purple-700 mb-3">Hire Recommendation</h4>
                      <div className="flex justify-center">
                        <div className={`
                          px-6 py-3 rounded-full font-bold text-lg 
                          ${interviewData.overallFeedback.hire_recommendation.includes('Strong') ? 'bg-green-100 text-green-800' : 
                            interviewData.overallFeedback.hire_recommendation.includes('Hire') ? 'bg-blue-100 text-blue-800' : 
                            interviewData.overallFeedback.hire_recommendation.includes('Consider') ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}
                        `}>
                          {interviewData.overallFeedback.hire_recommendation}
                        </div>
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
      
      {/* Stop Interview Confirmation Popup */}
      {isStopConfirmationOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-purple-800 mb-4">Stop Interview?</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to stop the interview? Your progress will be lost and you'll need to start over.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsStopConfirmationOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => {
                  stopAllMediaTracks();
                  setIsStopConfirmationOpen(false);
                  setIsInterviewModalOpen(false);
                  resetInterview();
                }}
              >
                Stop Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
