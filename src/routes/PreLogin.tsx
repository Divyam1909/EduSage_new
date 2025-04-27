//@ts-nocheck
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { Link } from "react-router-dom";

// Pre-login landing page that allows users to choose between student and teacher login
export default function Component() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-100 to-purple-200">
      {/* Application header with logo */}
      <header className="w-full bg-purple-700 p-6 flex items-center justify-center shadow-lg">
        <BookOpen className="text-white mr-3" size={40} />
        <h1 className="text-3xl font-bold text-white">EduSage</h1>
      </header>

      {/* Main content area with login options */}
      <main className="flex-grow flex flex-col items-center justify-center p-8">
        <h2 className="text-5xl font-bold text-purple-800 mb-16 text-center">Choose a login</h2>

        {/* Login options container */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          {/* Student login option with tooltip */}
          <div className="relative group">
            <Link to="/login">
              <Button
                className="w-56 h-24 text-2xl bg-purple-600 hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Student
              </Button>
            </Link>

            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-purple-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
              Access your courses, assignments, and grades
            </div>
          </div>

          {/* Teacher login option with tooltip */}
          <div className="relative group">
            <Link to="/tlogin">
              <Button
                className="w-56 h-24 text-2xl bg-purple-600 hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Teacher
              </Button>
            </Link>

            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-purple-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
              Manage classes, create assignments, and track student progress
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}