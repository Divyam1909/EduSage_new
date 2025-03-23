import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Bell,
  Search,
  HelpCircle,
  Users,
  FileText,
  HelpCircle as Quiz,
  User,
  Bookmark,
  Calendar,
  Bot,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate, getInitials, LEVELS, calculateLevel } from "@/lib/utils";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { userData, isLoading, refreshUserData } = useUser();
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjectMarks, setSubjectMarks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [topSages, setTopSages] = useState<any[]>([]);
  const [openSubjects, setOpenSubjects] = useState<{ [key: string]: boolean }>({});
  // Notification related states:
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  // New state for class stats (class average and rank)
  const [classStats, setClassStats] = useState({ classAverageResult: 0, rank: 0 });
  // State to track if more questions should be shown
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Fetch top sages
  const fetchTopSages = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/top-sages");
      const data = await res.json();
      setTopSages(data);
    } catch (err) {
      console.error("Error fetching top sages:", err);
    }
  }, []);

  // Fetch subject marks
  const fetchSubjectMarks = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch("http://localhost:5000/api/user/stats/subject", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const marks = await res.json();
      setSubjectMarks(marks);
    } catch (err) {
      console.error("Error fetching subject marks:", err);
    }
  }, [token]);

  // Fetch questions from backend
  const fetchQuestions = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/questions");
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions!", error);
    }
  }, []);

  // Fetch class results
  const fetchClassResults = useCallback(async () => {
    if (!token || !userData) return;
    
    try {
      const res = await fetch("http://localhost:5000/api/classResults");
      const data = await res.json();
      
      // Calculate user's rank
      const userRollno = userData.rollno;
      let rank = 0;
      data.results.forEach((result: any, index: number) => {
        if (result._id === userRollno) {
          rank = index + 1;
        }
      });
      
      setClassStats({ 
        classAverageResult: data.classAverageResult, 
        rank 
      });
    } catch (err) {
      console.error("Error fetching class results:", err);
    }
  }, [token, userData]);

  // Load all data when component mounts or location changes
  useEffect(() => {
    // Refresh user data if needed from global context
    refreshUserData();
    
    // Fetch other data
    fetchTopSages();
    fetchSubjectMarks();
    fetchQuestions();
  }, [refreshUserData, fetchTopSages, fetchSubjectMarks, fetchQuestions, location.key]);

  // Fetch class results when user data is available
  useEffect(() => {
    if (userData) {
      fetchClassResults();
    }
  }, [userData, fetchClassResults]);

  // Filter questions based on search query
  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Limit displayed questions to first 5 unless showAllQuestions is true
  const displayedQuestions = showAllQuestions 
    ? filteredQuestions 
    : filteredQuestions.slice(0, 5);

  // Compute overall result as an average percentage (each subject out of 120)
  const overallResult = subjectMarks.length > 0
    ? (subjectMarks.reduce(
        (acc, mark) => acc + (mark.cia1 + mark.cia2 + mark.midSem + mark.endSem),
        0
      ) / (subjectMarks.length * 120)) * 100
    : 0;

  // Calculate level info based on experience (using actual wisdom points from user model)
  const experience = userData ? userData.wisdomPoints : 0;
  const levelInfo = calculateLevel(experience);

  // Build user profile object
  const userProfile = {
    name: userData?.name || "User",
    experience,
    wisdomPoints: userData?.wisdomPoints || 0,
    questionsAsked: userData?.questionsAsked || 0,
    questionsAnswered: userData?.questionsAnswered || 0,
    myResult: overallResult,
    classAverageResult: classStats.classAverageResult,
    rank: classStats.rank,
  };

  // Notification polling: Optimize event checking
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // First, check our API for pending notifications
        const pendingRes = await axios.get("http://localhost:5000/api/notifications/pending");
        if (pendingRes.data && pendingRes.data.length > 0) {
          // Process any pending notifications from the server
          pendingRes.data.forEach((notification: any) => {
            setNotifications(prev => {
              // Check if this notification already exists
              const exists = prev.some(n => 
                n.id === notification.id || 
                (n.eventId === notification.eventId && n.type === notification.type)
              );
              if (!exists) {
                // Add the notification with a unique ID and mark as unseen
                return [...prev, {
                  ...notification,
                  id: notification.id || Date.now() + "_" + notification.eventId + "_" + notification.type,
                  seen: false
                }];
              }
              return prev;
            });
            
            // Also add to toasts for immediate visibility
            setToasts(prev => {
              const exists = prev.some(t => 
                t.id === notification.id || 
                (t.eventId === notification.eventId && t.type === notification.type)
              );
              if (!exists) {
                return [...prev, {
                  ...notification,
                  id: notification.id || Date.now() + "_" + notification.eventId + "_" + notification.type,
                  seen: false
                }];
              }
              return prev;
            });
          });
        }
        
        // Then do the regular check for events as a fallback
        const res = await axios.get("http://localhost:5000/api/events");
        const events = res.data;
        const now = new Date();

        // Process notifications in a more concise way
        const processEvents = (events: any[], updateFn: Function, notifType: string) => {
          const newItems: any[] = [];
          
          events.forEach((event: any) => {
            const eventDate = new Date(event.date);
            const isToday = now.toDateString() === eventDate.toDateString();
            const isTomorrow = (() => {
              const dayBefore = new Date(eventDate);
              dayBefore.setDate(eventDate.getDate() - 1);
              return now.toDateString() === dayBefore.toDateString();
            })();
            
            // Add "day before" notification
            if (isTomorrow && notifType === 'notifications' && !event.notificationStatus?.dayBeforeSent) {
              newItems.push({
                id: Date.now() + "_" + event._id + "_dayBefore",
                eventId: event._id,
                message: `Reminder: "${event.title}" is tomorrow.`,
                type: "dayBefore",
                seen: false,
              });
            }
            
            // Add "day of" notification
            if (isToday && !event.notificationStatus?.dayOfSent) {
              newItems.push({
                id: Date.now() + "_" + event._id + "_dayOf",
                eventId: event._id,
                message: `Reminder: "${event.title}" is today.`,
                type: "dayOf",
                seen: false,
              });
            }
            
            // Add "starting now" notification for events with time
            if (event.time && notifType === 'notifications' && !event.notificationStatus?.atTimeSent) {
              const [hours, minutes] = event.time.split(':').map(Number);
              const eventTime = new Date(eventDate);
              eventTime.setHours(hours, minutes, 0, 0);
              
              if (isToday && now >= eventTime && now <= new Date(eventTime.getTime() + 60000)) {
                newItems.push({
                  id: Date.now() + "_" + event._id + "_onTime",
                  eventId: event._id,
                  message: `Event "${event.title}" is starting now.`,
                  type: "onTime",
                  seen: false,
                });
              }
            }
          });
          
          // Update state with new items, avoiding duplicates
          updateFn((prev: any[]) => {
            const existing = new Set(prev.map(item => `${item.eventId}_${item.type}`));
            const filtered = newItems.filter(item => !existing.has(`${item.eventId}_${item.type}`));
            return [...prev, ...filtered];
          });
        };
        
        // Process notifications and toasts
        processEvents(events, setNotifications, 'notifications');
        processEvents(events, setToasts, 'toasts');
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear toasts after 5 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => setToasts([]), 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);
  
  // Handler functions
  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteMark = async (id: string) => {
    if (!token || !id) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/user/stats/subject/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjectMarks(prev => prev.filter(mark => mark._id !== id));
    } catch (error) {
      console.error("Error deleting subject mark!", error);
    }
  };

  const toggleSubjectDropdown = (id: string) => {
    setOpenSubjects(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
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
                  <Quiz className="mr-2 h-4 w-4" />
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-purple-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                placeholder="Search questions..."
              />
              <Button variant="secondary">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Link to="/ask">
                <Button variant="secondary">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Seek Wisdom
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="relative focus:outline-none"
                onClick={() => setShowNotificationPanel(true)}
              >
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.seen).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.seen).length}
                  </span>
                )}
              </button>
              <Link to="/profile">
                <Avatar>
                  <AvatarImage
                    src={userData && userData.photoUrl ? userData.photoUrl : "/placeholder-user.jpg"}
                    alt="User"
                  />
                  <AvatarFallback className="text-black">
                    {userData && userData.name ? getInitials(userData.name) : "AV"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex-1 max-w-7xl my-8 flex px-12 space-x-8">
          {/* Questions Feed */}
          <div className="w-1/2 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Recent Questions</h2>
            <div className="overflow-y-auto mb-4">
              {displayedQuestions.map((question) => (
                <Link key={question._id} to={`/solutions/${question._id}`}>
                  <div className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-purple-600">
                        {question.subject}
                      </span>
                      <span className="text-sm text-gray-500">
                        {question.wisdomPoints} wisdom points
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">
                        Asked on: {formatDate(new Date(question.askedAt))}
                      </span>
                      <span
                        className={`text-sm font-semibold flex items-center ${
                          question.solved ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {question.solved ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        {question.solved ? "Solved" : "Unsolved"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="outline">
                        View Answers ({question.answers || 0})
                      </Button>
                      <Button>Share Wisdom</Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
            >
              <h3 className="text-lg font-semibold">
                {showAllQuestions ? "Show Less" : "More questions..."}
              </h3>
            </Button>
          </div>

          {/* Right Column: Dashboard */}
          <div className="w-1/2 ml-4 flex flex-col space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage
                    src={userData && userData.photoUrl ? userData.photoUrl : "/placeholder-user.jpg"}
                    alt={userProfile.name}
                  />
                  <AvatarFallback>
                    {userData && userData.name ? getInitials(userData.name) : "AV"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {userData && userData.name ? userData.name : "User"}
                  </h2>
                  <p className="text-purple-600">
                    Level: {levelInfo.levelName}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span>Experience</span>
                  <span>{userProfile.experience} pts</span>
                </div>
                <Progress value={levelInfo.progress} className="h-2" />
                <p className="text-sm text-gray-500 mt-1">Progress towards {LEVELS[levelInfo.levelNumber - 1].threshold} pts</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold">{userProfile.wisdomPoints}</p>
                  <p className="text-sm text-gray-500">Wisdom Points</p>
                  <div className="text-xs text-gray-500 mt-1">
                    (Subject marks + Quiz points + Approved answers) 
                  </div>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.questionsAsked}</p>
                  <p className="text-sm text-gray-500">Questions Asked</p>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.questionsAnswered}</p>
                  <p className="text-sm text-gray-500">Questions Answered</p>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.rank}</p>
                  <p className="text-sm text-gray-500">My Rank</p>
                </div>
              </div>
              <div className="bg-purple-100 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-center">Performance</h3>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-800">
                      {userProfile.myResult.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-600 mt-1">My Result</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-800">
                      {userProfile.classAverageResult.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-600 mt-1">Class Average Result</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Sages */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Top Sages</h3>
              {topSages.map((sage, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage
                        src={sage.photoUrl ? sage.photoUrl : "/placeholder-user.jpg"}
                        alt={sage.name}
                      />
                      <AvatarFallback>{sage.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{sage.name}</span>
                  </div>
                  <span className="font-semibold text-sm text-gray-500">
                    {sage.rawWisdomPoints} wisdom points
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Stats Dialog */}
      <Dialog open={Boolean(userData && userData.showStats)} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] mx-auto max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {userData && userData.showDetailedAnalysis ? (
                <>
                  Detailed Analysis
                  <Button
                    variant="ghost"
                    onClick={() => {
                      userData.showDetailedAnalysis = false;
                      refreshUserData();
                    }}
                    className="ml-4 text-sm text-purple-600"
                  >
                    Back to Overview
                  </Button>
                </>
              ) : (
                "Student Stats"
              )}
            </DialogTitle>
          </DialogHeader>
          {!(userData && userData.showDetailedAnalysis) ? (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Overall Result</h3>
                <Progress value={userProfile.myResult} className="w-full bg-purple-200" />
                <p className="text-sm text-right">{userProfile.myResult.toFixed(1)}%</p>
                <Button
                  variant="ghost"
                  className="mt-2 text-purple-600"
                  onClick={() => {
                    userData.showDetailedAnalysis = true;
                    refreshUserData();
                  }}
                >
                  View Detailed Analysis
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Class Average Result</h3>
                <Progress value={userProfile.classAverageResult} className="w-full bg-purple-200" />
                <p className="text-sm text-right">{userProfile.classAverageResult.toFixed(1)}%</p>
                <p className="text-sm text-purple-600">
                  You beat {userProfile.rank ? (userProfile.rank > 0 ? userProfile.rank - 1 : 0) : 0} students.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <h3 className="text-xl font-bold mb-4">Subject Marks</h3>
              <div className="mb-4">
                {subjectMarks.map((mark) => (
                  <div key={mark._id} className="border rounded mb-2">
                    <button
                      onClick={() => mark._id && toggleSubjectDropdown(mark._id)}
                      className="w-full text-left px-4 py-2 bg-purple-100 hover:bg-purple-200 focus:outline-none"
                    >
                      <span className="font-semibold">{mark.subject}</span>
                    </button>
                    {mark._id && openSubjects[mark._id] && (
                      <div className="p-4">
                        <p>CIA 1: {mark.cia1} / 20</p>
                        <p>CIA 2: {mark.cia2} / 20</p>
                        <p>Mid-Semester: {mark.midSem} / 30</p>
                        <p>End-Semester: {mark.endSem} / 50</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              userData.showDetailedAnalysis = false;
                              refreshUserData();
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => mark._id && handleDeleteMark(mark._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="font-bold">Add New Subject Mark</h4>
                <label className="block font-medium mb-1">Subject:</label>
                <select
                  name="subject"
                  onChange={(e) => {}}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="">Select Subject</option>
                  <option value="MES">MES</option>
                  <option value="CN">CN</option>
                  <option value="OS">OS</option>
                  <option value="EM-4">EM-4</option>
                  <option value="SE">SE</option>
                </select>
                <label className="block font-medium mb-1">CIA 1 (out of 20):</label>
                <input
                  type="number"
                  name="cia1"
                  placeholder="Enter CIA 1 marks"
                  min={0}
                  max={20}
                  className="w-full p-2 border rounded mb-2"
                />
                <label className="block font-medium mb-1">CIA 2 (out of 20):</label>
                <input
                  type="number"
                  name="cia2"
                  placeholder="Enter CIA 2 marks"
                  min={0}
                  max={20}
                  className="w-full p-2 border rounded mb-2"
                />
                <label className="block font-medium mb-1">Mid-Semester (out of 30):</label>
                <input
                  type="number"
                  name="midSem"
                  placeholder="Enter mid-sem marks"
                  min={0}
                  max={30}
                  className="w-full p-2 border rounded mb-2"
                />
                <label className="block font-medium mb-1">End-Semester (out of 50):</label>
                <input
                  type="number"
                  name="endSem"
                  placeholder="Enter end-sem marks"
                  min={0}
                  max={50}
                  className="w-full p-2 border rounded mb-2"
                />
                <div className="flex space-x-4 mt-2">
                  <Button>Add</Button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <Button onClick={() => {}}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Toast Notifications */}
      <div className="fixed bottom-4 left-8 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg shadow-2xl border-2 border-white flex items-center"
          >
            <Bell className="w-5 h-5 mr-2" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="fixed bottom-4 right-4 w-1/3 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-purple-800 to-purple-900 text-white shadow-2xl border border-purple-700 p-6 rounded-lg z-50">
          <div className="flex justify-between items-center mb-4 border-b border-purple-700 pb-2">
            <h4 className="text-xl font-bold flex items-center">
              <Bell className="w-6 h-6 mr-2" /> Notifications
            </h4>
            <button
              onClick={() => setShowNotificationPanel(false)}
              className="text-sm text-white hover:text-gray-300 transition"
            >
              Close
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-300">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between bg-purple-700 p-3 rounded-lg mb-3 shadow-md"
              >
                <span className="text-sm">{notification.message}</span>
                <button
                  onClick={() => {
                    if (notification.type === "dayOf") {
                      alert("Today's event reminder cannot be deleted.");
                    } else {
                      handleDeleteNotification(notification.id);
                    }
                  }}
                  className="bg-white text-purple-800 rounded-full p-2 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
