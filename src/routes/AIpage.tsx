import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BookOpen, Home, Menu, MessageSquare, PenTool, Play, HelpCircle, 
  BookOpenCheck, Users, FileText, PuzzleIcon as Quiz, User, Bookmark, Calendar, 
  GraduationCap,
  Bot
} from 'lucide-react'
import { Link } from "react-router-dom"

export default function Component() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  const topics = ["COA", "DLDA", "DSA", "EM", "DBMS"]

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  return (
    <div className="flex h-screen bg-purple-50">
      {/* Left Side Menu */}
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
                  <HelpCircle className="mr-2 h-4 w-4" />
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
   <h1 className="text-4xl font-bold text-purple-800 mb-6 text-center">
              AI Assistant
            </h1>
        {/* <header className="flex justify-between items-center p-4 bg-purple-800 text-white">
        <div className="flex items-center space-x-4">
                <GraduationCap className="w-8 h-8 mr-2" />
                <h1 className="text-3xl font-bold">EduSage</h1>
              </div>
        </header> */}

        {/* Main content cards, topics, etc. */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                onClick={() => console.log("Start Interview clicked")}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Interview
              </Button>
            </div>
          </div>
          <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            <Button
              className="h-32 text-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-t-lg"
              onClick={() => setIsChatModalOpen(true)}  // Opens the chat modal
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
                onClick={() => setIsChatModalOpen(true)}  // Opens the chat modal
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </div>
          </div>
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

      {/* Chat Modal for AI Help using iframe with shareable URL */}
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
    </div>
  )
}
