//@ts-nocheck
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { User, Calendar, ListChecks, Edit3, LogOut, Save, BookOpen, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TeacherProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState("");
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem("teacherToken");
      if (!token) return;
      const response = await apiFetch("/api/teacher/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setForm({
          name: data.name || "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          dateOfJoining: data.dateOfJoining ? data.dateOfJoining.slice(0, 10) : "",
          phone: data.phone || "",
          email: data.email || "",
        });
      } else {
        setError("Failed to load profile");
      }
    } catch (e) {
      setError("Failed to load profile");
    }
  }

  function handleEditProfileClick() {
    setIsEditProfileOpen(true);
    setProfileUpdateError("");
    setProfileUpdateSuccess("");
    setForm({
      name: profile?.name || "",
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
      dateOfJoining: profile?.dateOfJoining ? profile.dateOfJoining.slice(0, 10) : "",
      phone: profile?.phone || "",
      email: profile?.email || "",
    });
  }

  function handleProfileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileUpdateError("");
    setProfileUpdateSuccess("");
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem("teacherToken");
      if (!token) return;
      const response = await apiFetch("/api/teacher/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setProfileUpdateSuccess("Profile updated successfully");
        setTimeout(() => {
          setIsEditProfileOpen(false);
          fetchProfile();
        }, 1200);
      } else {
        const err = await response.json();
        setProfileUpdateError(err.message || "Failed to update profile");
      }
    } catch (e) {
      setProfileUpdateError("Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handlePhotoChange(e: any) {
    if (!e.target.files || !e.target.files[0]) return;
    const formData = new FormData();
    formData.append("photo", e.target.files[0]);
    try {
      setUploading(true);
      setPhotoMessage("");
      const token = localStorage.getItem("teacherToken");
      if (!token) return;
      const response = await apiFetch("/api/teacher/profile/photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
        setPhotoMessage("Profile photo updated successfully");
        fetchProfile();
      } else {
        setPhotoMessage("Failed to update photo");
      }
    } catch (e) {
      setPhotoMessage("Failed to update photo");
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("teacherToken");
    navigate("/tlogin");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-800 text-white p-4 min-h-screen">
        <div className="flex items-center mb-8">
          <img src="/ES_logo2.png" alt="EduSage Logo" className="w-20 h-20 mr-2" />
          <h1 className="text-2xl font-bold">EduSage</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li><Link to="/teacher/dashboard"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><ListChecks className="mr-2 h-4 w-4" />Dashboard</Button></Link></li>
            <li><Link to="/teacher/resources"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><BookOpen className="mr-2 h-4 w-4" />Resources</Button></Link></li>
            <li><Link to="/teacher/quizzes"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><FileText className="mr-2 h-4 w-4" />Quizzes</Button></Link></li>
            <li><Link to="/teacher/calendar"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><Calendar className="mr-2 h-4 w-4" />Calendar</Button></Link></li>
            <li><Link to="/teacher/profile"><Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors"><User className="mr-2 h-4 w-4" />Profile</Button></Link></li>
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
                src={profile?.photoUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                alt="Teacher Photo"
                className="w-48 h-48 rounded-full object-cover"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2"
                disabled={uploading}
              >
                <Edit3 size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            {photoMessage && <div className="text-center text-sm mt-2 text-green-600">{photoMessage}</div>}
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold mb-2">
                {profile ? profile.name : "Loading..."}
              </h2>
              <div className="flex justify-center space-x-3">
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
                <p className="font-semibold">Teacher ID:</p>
                <p>{profile ? profile.teacherId : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Name:</p>
                <p>{profile ? profile.name : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Email:</p>
                <p>{profile ? profile.email : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Phone Number:</p>
                <p>{profile ? profile.phone : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Date of Birth:</p>
                <p>{profile ? new Date(profile.dateOfBirth).toLocaleDateString("en-GB") : "Loading..."}</p>
              </div>
              <div>
                <p className="font-semibold">Date of Joining:</p>
                <p>{profile ? new Date(profile.dateOfJoining).toLocaleDateString("en-GB") : "Loading..."}</p>
              </div>
            </div>
          </div>
        </main>
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
                    value={form.name}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
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
                    value={form.phone}
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
                    value={form.dateOfBirth}
                    onChange={handleProfileInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Date of Joining:</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={form.dateOfJoining}
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