//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  FileText,
  HelpCircle as Quiz,
  User,
  Bookmark,
  Calendar,
  Bot,
  Edit3,
  LogOut,
  Save,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "../utils/api";

interface SubjectMarks {
  _id?: string;
  subject: string;
  cia1: number;
  cia2: number;
  midSem: number;
  endSem: number;
}

interface ClassResults {
  classAverageResult: number;
  results: { _id: string; overall: number }[];
  totalStudents: number;
}

export default function ProfilePage() {
  const { userData, refreshUserData, userRankData, fetchUserRankings } = useUser();
  const navigate = useNavigate();
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectMarks | null>(null);
  const [subjectMarks, setSubjectMarks] = useState<SubjectMarks[]>([]);
  const [formData, setFormData] = useState<SubjectMarks>({
    subject: "",
    cia1: 0,
    cia2: 0,
    midSem: 0,
    endSem: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [editID, setEditID] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState("/placeholder-user.jpg");
  const [classResults, setClassResults] = useState<ClassResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [markError, setMarkError] = useState("");
  const [markMessage, setMarkMessage] = useState("");
  const [submittingMark, setSubmittingMark] = useState(false);
  const [editMarkError, setEditMarkError] = useState("");
  const [editMarkMessage, setEditMarkMessage] = useState("");
  const [editingSubject, setEditingSubject] = useState<SubjectMarks | null>(null);
  const [editingMarkType, setEditingMarkType] = useState("");
  const [editingMarkValue, setEditingMarkValue] = useState("");
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    branch: "",
    sem: "",
    email: "",
    phone: "",
    dateOfBirth: ""
  });
  const [profileUpdateError, setProfileUpdateError] = useState("");
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Calculate total marks for each subject
  const calculateTotalMarks = (mark: SubjectMarks) => {
    return mark.cia1 + mark.cia2 + mark.midSem + mark.endSem;
  };

  // Format percentage to 1 decimal place
  const formatPercentage = (value: number) => {
    if (isNaN(value) || value === undefined) return "0.0%";
    return (value).toFixed(1) + "%";
  };

  // Calculate overall percentage
  const overallPercentage = subjectMarks.length > 0
    ? (subjectMarks.reduce((acc, mark) => acc + calculateTotalMarks(mark), 0) / (subjectMarks.length * 120)) * 100
    : 0;

  // Calculate students beat count based on userRankData from context
  const studentsBeat = userRankData.rank > 0 && userData 
    ? userRankData.rank - 1 
    : 0;

  // Initialize token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch subject marks and class results
  useEffect(() => {
    // Function to fetch user data
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Get token
        const tokenFromStorage = localStorage.getItem("token");
        if (!tokenFromStorage) {
          setIsLoading(false);
          return;
        }
        
        // Set token in state to ensure it's available for other functions
        setToken(tokenFromStorage);
        
        // Fetch academic marks data
        const subjectMarksResponse = await apiFetch("api/user/stats/subject", {
          headers: {
            Authorization: `Bearer ${tokenFromStorage}`,
          },
        });

        if (subjectMarksResponse.ok) {
          const marksData = await subjectMarksResponse.json();
          setSubjectMarks(marksData || []);
        } else {
          setSubjectMarks([]);
        }

        // Fetch class results
        const classResultsResponse = await apiFetch("api/classResults", {
          headers: {
            Authorization: `Bearer ${tokenFromStorage}`,
          },
        });

        if (classResultsResponse.ok) {
          const classData = await classResultsResponse.json();
          setClassResults(classData || { classAverageResult: 0, results: [], totalStudents: 0 });
        } else {
          setClassResults(null);
        }
        
        // Fetch user rankings with context function to ensure consistency
        fetchUserRankings();
        
      } catch (error) {
        setSubjectMarks([]);
        setClassResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (userData) {
      fetchUserData();
    }
  }, [userData, fetchUserRankings]);

  // Update profile photo when userData changes
  useEffect(() => {
    if (userData && userData.photoUrl) {
      setProfilePhoto(userData.photoUrl);
    } else {
      setProfilePhoto("/placeholder-user.jpg");
    }
  }, [userData]);

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const formData = new FormData();
    formData.append("photo", e.target.files[0]);

    try {
      setUploading(true);
      
      // Get the authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        setPhotoMessage("Authentication error - please log in again");
        return;
      }
      
      const response = await apiFetch("api/profile/photo", {
        method: "POST",
        // Add the Authorization header with token
        headers: {
          Authorization: `Bearer ${token}`
        },
        // Don't set Content-Type for FormData - the browser will set it automatically
        body: formData,
      });

      if (response.ok) {
        // Refresh user data to get updated photo URL
        refreshUserData();
        setPhotoMessage("Photo updated successfully");
      } else {
        const errorData = await response.text();
        setPhotoMessage(errorData || "Failed to update photo");
      }
    } catch (error) {
      setPhotoMessage("Error uploading photo");
    } finally {
      setUploading(false);
    }
  };

  // Handle mark entry
  const handleAddMark = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject) {
      setMarkError("Please select a subject");
      return;
    }

    try {
      setSubmittingMark(true);
      const response = await apiFetch("api/user/stats/subject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: formData.subject,
          cia1: formData.cia1,
          cia2: formData.cia2,
          midSem: formData.midSem,
          endSem: formData.endSem
        }),
      });

      if (response.ok) {
        setMarkMessage("Mark added successfully");
        setSubjectMarks([...subjectMarks, await response.json()]);
        setSelectedSubject(null);
        setFormData({ subject: "", cia1: 0, cia2: 0, midSem: 0, endSem: 0 });
        
        // Refresh user data and rankings
        refreshUserData();
        fetchUserRankings();
      } else {
        setMarkError("Failed to add mark");
      }
    } catch (error) {
      setMarkError("Error adding mark");
    } finally {
      setSubmittingMark(false);
    }
  };

  // Handle mark update
  const handleUpdateMark = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !selectedSubject) {
      setEditMarkError("Please fill all fields");
      return;
    }

    try {
      const response = await apiFetch(`api/user/stats/subject/${selectedSubject._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: formData.subject,
          cia1: formData.cia1,
          cia2: formData.cia2,
          midSem: formData.midSem,
          endSem: formData.endSem
        }),
      });

      if (response.ok) {
        const updatedMark = await response.json();
        setSubjectMarks(
          subjectMarks.map((mark) =>
            mark._id === updatedMark._id ? updatedMark : mark
          )
        );
        setEditMarkMessage("Mark updated successfully");
        setEditingSubject(null);
        setEditingMarkType("");
        setEditingMarkValue("");
        
        // Refresh user data and rankings
        refreshUserData();
        fetchUserRankings();
      } else {
        setEditMarkError("Failed to update mark");
      }
    } catch (error) {
      setEditMarkError("Error updating mark");
    }
  };

  // Handle mark deletion
  const handleDeleteMark = async (id: string) => {
    try {
      const response = await apiFetch(`api/user/stats/subject/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSubjectMarks(subjectMarks.filter((mark) => mark._id !== id));
        setMarkMessage("Mark deleted successfully");
        
        // Refresh user data and rankings
        refreshUserData();
        fetchUserRankings();
      } else {
        setMarkError("Failed to delete mark");
      }
    } catch (error) {
      setMarkError("Error deleting mark");
    }
  };

  // Trigger file input click when edit icon is clicked
  const handleEditPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleViewAnalysisClick = () => {
    setShowDetailedAnalysis(true);
  };

  // Back button in detailed analysis to return to overall results
  const handleBackToStatsClick = () => {
    setShowDetailedAnalysis(false);
    setSelectedSubject(null);
    setFormData({ subject: "", cia1: 0, cia2: 0, midSem: 0, endSem: 0 });
  };

  const handleSubjectClick = (mark: SubjectMarks) => {
    setSelectedSubject(mark);
    setFormData(mark);
  };

  // Toggle dropdown for a subject's detailed view
  const toggleSubjectDropdown = (id: string) => {
    setEditMode((prev) => !prev);
    setEditID(id);
  };

  // Use dropdown for subject selection in form
  const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, subject: e.target.value });
  };

  // Validate inputs so that values do not exceed the limits
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let num = Number(value);
    if (name === "cia1" || name === "cia2") {
      if (num > 20) num = 20;
    } else if (name === "midSem") {
      if (num > 30) num = 30;
    } else if (name === "endSem") {
      if (num > 50) num = 50;
    }
    setFormData({ ...formData, [name]: name === "subject" ? value : num });
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Initialize profile form data when userData changes
  useEffect(() => {
    if (userData) {
      setProfileFormData({
        name: userData.name || "",
        branch: userData.branch || "",
        sem: userData.sem?.toString() || "",
        email: userData.email || "",
        phone: userData.phone || "",
        // Format date to YYYY-MM-DD for input field
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : ""
      });
    }
  }, [userData]);

  // Handle profile field changes
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setProfileUpdateError("");
    setProfileUpdateSuccess("");
    
    // Validate form data
    if (!profileFormData.name || !profileFormData.branch || !profileFormData.sem || 
        !profileFormData.email || !profileFormData.phone) {
      setProfileUpdateError("All fields are required");
      return;
    }
    
    try {
      setUpdatingProfile(true);
      
      const response = await apiFetch("api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileFormData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileUpdateSuccess("Profile updated successfully");
        
        // Close the dialog after a delay
        setTimeout(() => {
          setIsEditProfileOpen(false);
          // Refresh user data to reflect changes
          refreshUserData();
        }, 1500);
      } else {
        const errorData = await response.json();
        setProfileUpdateError(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileUpdateError("An error occurred while updating your profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Open edit profile dialog
  const handleEditProfileClick = () => {
    setIsEditProfileOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
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
      <div className="flex-1">
        <main className="container mx-auto mt-8 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto relative">
            {/* Profile Photo with edit overlay */}
            <div className="relative w-48 h-48 mx-auto">
              <img
                src={profilePhoto}
                alt="Student Photo"
                className="w-48 h-48 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite error loops
                  target.src = "/placeholder-user.jpg";
                }}
              />
              <button
                onClick={handleEditPhotoClick}
                className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2"
              >
                <Edit3 size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold mb-2">
                {userData ? userData.name : "Loading..."}
              </h2>
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => setIsStatsOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Check my stats
                </Button>
                <Button
                  onClick={handleEditProfileClick}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="font-semibold">Roll No.:</p>
                <p>{userData ? userData.rollno : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Name:</p>
                <p>{userData ? userData.name : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Branch:</p>
                <p>{userData ? userData.branch : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Semester:</p>
                <p>{userData ? userData.sem : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Email:</p>
                <p>{userData ? userData.email : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Phone Number:</p>
                <p>{userData ? userData.phone : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Date of Birth:</p>
                <p>
                  {userData
                    ? new Date(userData.dateOfBirth).toLocaleDateString("en-GB")
                    : "Loading..."}
                </p>
              </div>
              <div>
                <p className="font-semibold">Wisdom Points:</p>
                <p>{userData ? userData.wisdomPoints : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Questions Asked:</p>
                <p>{userData ? userData.questionsAsked : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Questions Answered:</p>
                <p>{userData ? userData.questionsAnswered : "Loading..."}</p>
              </div>
            </div>
          </div>
        </main>

        {/* Stats Dialog */}
        <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] mx-auto max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {showDetailedAnalysis ? (
                  <>
                    Detailed Analysis
                    <Button
                      variant="ghost"
                      onClick={handleBackToStatsClick}
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
            {!showDetailedAnalysis ? (
              <div className="grid gap-4 py-4">
                <p className="text-sm text-gray-500 mb-2">
                  Your wisdom points are automatically updated whenever you add subject marks, submit quizzes, or get answers approved.
                </p>
                <div className="space-y-2">
                  <h3 className="font-semibold">Overall Result</h3>
                  {subjectMarks.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={subjectMarks.map((mark) => ({
                        subject: mark.subject,
                        total: calculateTotalMarks(mark),
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis domain={[0, 120]} />
                        <Tooltip formatter={(value) => `${value} / 120`} />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 italic">No data available</p>
                  )}
                  <div className="bg-purple-600 text-white text-sm font-bold text-center py-2 px-4 rounded w-28">
                    {formatPercentage(overallPercentage)}
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-2 text-purple-600"
                    onClick={handleViewAnalysisClick}
                  >
                    View Detailed Analysis
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Class Average Result</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[
                      { 
                        name: "Class Average", 
                        value: classResults?.classAverageResult || 0 
                      },
                      { 
                        name: "My Result", 
                        value: overallPercentage || 0 
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => isNaN(Number(value)) ? "0%" : `${Number(value).toFixed(1)}%`} />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-right">
                    {formatPercentage(classResults?.classAverageResult || 0)}
                  </p>
                  <p className="text-sm text-purple-600 font-semibold">
                    {userRankData.rank > 0 
                      ? `You are ranked #${userRankData.rank} out of ${userRankData.totalUsers} students (based on wisdom points).`
                      : "Add subject marks, answer questions, or take quizzes to earn wisdom points and get ranked."}
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
                        onClick={() => toggleSubjectDropdown(mark._id!)}
                        className="w-full text-left px-4 py-2 bg-purple-100 hover:bg-purple-200 focus:outline-none"
                      >
                        <span className="font-semibold">{mark.subject}</span>
                      </button>
                      {editMode && editID === mark._id && (
                        <div className="p-4">
                          <p>CIA 1: {mark.cia1} / 20</p>
                          <p>CIA 2: {mark.cia2} / 20</p>
                          <p>Mid-Semester: {mark.midSem} / 30</p>
                          <p>End-Semester: {mark.endSem} / 50</p>
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" onClick={() => handleSubjectClick(mark)}>
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteMark(mark._id!)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold">
                    {selectedSubject ? "Edit Subject Mark" : "Add New Subject Mark"}
                  </h4>
                  <label className="block font-medium mb-1">Subject:</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleSubjectSelect}
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
                    value={formData.cia1}
                    onChange={handleInputChange}
                    placeholder="Enter CIA 1 marks"
                    min={0}
                    max={20}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <label className="block font-medium mb-1">CIA 2 (out of 20):</label>
                  <input
                    type="number"
                    name="cia2"
                    value={formData.cia2}
                    onChange={handleInputChange}
                    placeholder="Enter CIA 2 marks"
                    min={0}
                    max={20}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <label className="block font-medium mb-1">Mid-Semester (out of 30):</label>
                  <input
                    type="number"
                    name="midSem"
                    value={formData.midSem}
                    onChange={handleInputChange}
                    placeholder="Enter mid-sem marks"
                    min={0}
                    max={30}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <label className="block font-medium mb-1">End-Semester (out of 50):</label>
                  <input
                    type="number"
                    name="endSem"
                    value={formData.endSem}
                    onChange={handleInputChange}
                    placeholder="Enter end-sem marks"
                    min={0}
                    max={50}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <div className="flex space-x-4 mt-2">
                    {selectedSubject ? (
                      <>
                        <Button onClick={handleUpdateMark}>Update</Button>
                        <Button variant="outline" onClick={handleBackToStatsClick}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAddMark}>Add</Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              <Button onClick={() => setIsStatsOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-[500px] mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProfileUpdate} className="py-4">
              {profileUpdateError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {profileUpdateError}
                </div>
              )}
              {profileUpdateSuccess && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                  {profileUpdateSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-medium mb-1">Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={profileFormData.name}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Branch:</label>
                  <input
                    type="text"
                    name="branch"
                    value={profileFormData.branch}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Semester:</label>
                  <select
                    name="sem"
                    value={profileFormData.sem}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={profileFormData.email}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileFormData.phone}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Date of Birth:</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileFormData.dateOfBirth}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

