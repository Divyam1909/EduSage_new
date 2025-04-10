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
} from "lucide-react";
import { Link } from "react-router-dom";
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
  const { userData, refreshUserData } = useUser();
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

  // Calculate total marks for each subject
  const calculateTotalMarks = (mark: SubjectMarks) => {
    return mark.cia1 + mark.cia2 + mark.midSem + mark.endSem;
  };

  // Format percentage to 1 decimal place
  const formatPercentage = (value: number) => {
    return (value).toFixed(1) + "%";
  };

  // Calculate overall percentage
  const overallPercentage = subjectMarks.length > 0
    ? (subjectMarks.reduce((acc, mark) => acc + calculateTotalMarks(mark), 0) / (subjectMarks.length * 120)) * 100
    : 0;

  // Find user's rank in class results
  const currentUserRank = userData && classResults?.results
    ? classResults.results.findIndex(result => result._id === userData.rollno) + 1
    : 0;

  // Calculate students beat count
  const studentsBeat = (classResults?.totalStudents && currentUserRank)
    ? classResults.totalStudents - currentUserRank
    : 0;

  // Fetch subject marks and class results
  useEffect(() => {
    const fetchSubjectMarksAndResults = async () => {
      try {
        // Get the token from local storage
        const token = localStorage.getItem("token");
        if (!token || !userData) {
          return;
        }

        // Initialize form data from user data if available
        if (userData) {
          setFormData({
            subject: "",
            cia1: 0,
            cia2: 0,
            midSem: 0,
            endSem: 0,
          });

          if (userData.photoUrl) {
            setProfilePhoto(userData.photoUrl);
          }
        }

        // Fetch subject marks for the current user
        const subjectMarksResponse = await fetch("http://localhost:5000/api/user/stats/subject", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (subjectMarksResponse.ok) {
          const marks = await subjectMarksResponse.json();
          setSubjectMarks(marks);
        } else {
          console.error("Error fetching subject marks");
        }

        // Fetch class results from endpoint
        const classResultsResponse = await fetch("http://localhost:5000/api/classResults", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (classResultsResponse.ok) {
          const results = await classResultsResponse.json();
          setClassResults(results);
        } else {
          console.error("Error fetching class results");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchSubjectMarksAndResults();
  }, [userData]);

  // Trigger file input click when edit icon is clicked
  const handleEditPhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file change and upload photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const photoData = new FormData();
    photoData.append("photo", file);

    fetch("http://localhost:5000/api/profile/photo", {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: photoData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.photoUrl) {
          setProfilePhoto(data.photoUrl);
          refreshUserData();
        }
      })
      .catch((error) => console.error("Error uploading photo:", error));
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

  const handleAddMark = () => {
    const exists = subjectMarks.some(
      (mark) =>
        mark.subject.toLowerCase() === formData.subject.toLowerCase() &&
        formData.subject !== ""
    );
    if (exists) {
      alert("This subject already exists. Please edit the existing record.");
      return;
    }
    fetch("http://localhost:5000/api/user/stats/subject", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((newMark) => {
        setSubjectMarks([...subjectMarks, newMark]);
        setFormData({ subject: "", cia1: 0, cia2: 0, midSem: 0, endSem: 0 });
        
        // Refresh user data to show updated wisdom points
        refreshUserData();
      })
      .catch((err) => console.error("Error adding mark:", err));
  };

  const handleUpdateMark = () => {
    if (!selectedSubject || !selectedSubject._id) return;
    fetch(`http://localhost:5000/api/user/stats/subject/${selectedSubject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((updatedMark) => {
        setSubjectMarks(
          subjectMarks.map((mark) => (mark._id === updatedMark._id ? updatedMark : mark))
        );
        setSelectedSubject(null);
        setFormData({ subject: "", cia1: 0, cia2: 0, midSem: 0, endSem: 0 });
        
        // Refresh user data to show updated wisdom points
        refreshUserData();
      })
      .catch((err) => console.error("Error updating mark:", err));
  };

  const handleDeleteMark = (id: string) => {
    fetch(`http://localhost:5000/api/user/stats/subject/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => res.json())
      .then(() => {
        setSubjectMarks(subjectMarks.filter((mark) => mark._id !== id));
        
        // Refresh user data to show updated wisdom points
        refreshUserData();
      })
      .catch((err) => console.error("Error deleting mark:", err));
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
              <Button
                onClick={() => setIsStatsOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Check my stats
              </Button>
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
                    <LineChart data={[{ name: "Average", value: classResults?.classAverageResult || 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-right">
                    {formatPercentage(classResults?.classAverageResult || 0)}
                  </p>
                  <p className="text-sm text-purple-600 font-semibold">
                    You beat {studentsBeat} out of {classResults?.totalStudents || 0} students.
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
      </div>
    </div>
  );
}

