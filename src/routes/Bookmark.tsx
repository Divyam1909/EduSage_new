"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Bookmark, 
  Trash2, 
  BookOpen, 
  User, 
  FileText, 
  Calendar, 
  Bot, 
  Users,
  HelpCircle as Quiz,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

// Define the type for a bookmarked resource
interface BookmarkItem {
  _id: string;
  fileName: string;
  fileLink: string;
}

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Fetch bookmarked resources from the backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/resources/bookmarked")
      .then((response) => setBookmarks(response.data))
      .catch((error) => console.error("Error fetching bookmarks:", error));
  }, []);

  // Handle delete bookmark
  const handleDeleteBookmark = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/resources/${id}/bookmark`); // Toggle bookmark off
      setBookmarks(bookmarks.filter((bookmark) => bookmark._id !== id));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex">
      {/* Left Sidebar */}
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
                  <Users className="mr-2 h-4 w-4" />
                  Discussion Forum
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/resources">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <FileText className="mr-2 h-4 w-4" />
                  Resources
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/bookmark">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmarks
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/quiz">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Quiz className="mr-2 h-4 w-4" />
                  Quizzes
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/calendar">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/ai">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <Bot className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/profile">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-4xl w-full ml-0"> {/* Left-align the content */}
          <h1 className="text-3xl font-bold text-purple-800 mb-8">My Bookmarks</h1>

          {bookmarks.length === 0 ? (
            <p className="text-left text-gray-500">No bookmarks yet.</p>
          ) : (
            <div className="flex flex-col space-y-2 w-full"> {/* Removed grid to prevent card stretching */}
              {bookmarks.map((bookmark) => (
                <Card key={bookmark._id} className="h-auto py-2 px-4 shadow-md w-full"> {/* Auto height & reduced padding */}
                  <CardContent className="flex justify-between items-center w-full p-2">
                    {/* Left Side: Icon + File Name */}
                    <div className="flex items-center gap-3 w-full">
                      <Bookmark className="h-5 w-5 text-purple-600" />
                      <a 
                        href={bookmark.fileLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-purple-700 hover:underline font-medium truncate w-3/4"
                      >
                        {bookmark.fileName}
                      </a>
                    </div>

                    {/* Right Side: Delete Button */}
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteBookmark(bookmark._id)} 
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
