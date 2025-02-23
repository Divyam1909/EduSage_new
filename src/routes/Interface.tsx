import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Home,
  Menu,
  MessageSquare,
  PenTool,
  Play,
  HelpCircle,
  BookOpenCheck,
} from "lucide-react";

export default function Interface() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const topics = ["COA", "DLDA", "DSA", "EM", "DBMS"];

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  return (
    <div className="flex h-screen bg-purple-50">
      {/* Sidebar */}
      <div className="w-64 bg-purple-100 p-4 shadow-md">
        <h2 className="text-xl font-bold mb-4 text-purple-800">Topics</h2>
        <ScrollArea className="h-[calc(100vh-100px)]">
          {topics.map((topic) => (
            <Button
              key={topic}
              variant={selectedTopics.includes(topic) ? "default" : "outline"}
              className="w-full justify-start mb-2 bg-purple-200 text-purple-800 hover:bg-purple-300"
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </Button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-purple-200">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-purple-800">EduSage</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-purple-800">
              <Home className="h-5 w-5 mr-2" />
              Home
            </Button>
            <Button variant="ghost" className="text-purple-800">
              <Menu className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
          </div>
        </header>

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
                Practice for your upcoming interviews with our AI-powered
                system. Get real-time feedback and improve your skills.
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
              onClick={() => console.log("AI Help clicked")}
            >
              <MessageSquare className="mr-2 h-6 w-6" />
              AI Help
            </Button>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-purple-800">
                Get instant assistance from our AI tutor. Ask questions, clarify
                concepts, and deepen your understanding of complex topics.
              </p>
              <Button
                className="mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => console.log("Ask AI clicked")}
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
                Prepare for your exams with our comprehensive study materials
                and practice tests. Track your progress and identify areas for
                improvement.
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
            <h3 className="text-xl font-semibold mb-2 text-purple-800">
              Selected Topics:
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
