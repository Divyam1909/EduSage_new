  import { useState, useEffect } from "react";
  import axios from "axios";
  import {
    GraduationCap,
    FileText,
    Menu,
    BookOpen,
    Users,
    Calendar,
    Bot,
    Bookmark,
    BookmarkCheck,
    HelpCircle as Quiz,
    User,
    Pencil,
    Trash2,
  } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Link } from "react-router-dom";

  // Define the type for resources
  interface Resource {
    _id?: string;
    fileName: string;
    courseName: string;
    fileLink: string;
    bookmarked: boolean;
  }

  export default function Resources() {
    const [fileName, setFileName] = useState("");
    const [courseName, setCourseName] = useState("");
    const [fileLink, setFileLink] = useState("");
    const [resources, setResources] = useState<Resource[]>([]);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

    const courses = [
      "Arrays and Strings",
      "Linked Lists",
      "Trees and Graphs",
      "Sorting and Searching",
      "Dynamic Programming",
    ];

    // Fetch resources from the backend on component mount
    useEffect(() => {
      axios
        .get("http://localhost:5000/api/resources")
        .then((response) => setResources(response.data))
        .catch((error) => console.error("Error fetching resources:", error));
    }, []);

    // Handle form submission to add/edit a resource
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!fileName || !courseName || !fileLink) {
        alert("Please fill all fields");
        return;
      }

      const newResource: Resource = {
        fileName, courseName, fileLink,
        bookmarked: false
      };

      try {
        if (editingResource) {
          // Update existing resource
          const response = await axios.put(`http://localhost:5000/api/resources/${editingResource._id}`, newResource);
          setResources(resources.map((res) => (res._id === editingResource._id ? response.data : res)));
          setEditingResource(null);
        } else {
          // Add new resource
          const response = await axios.post("http://localhost:5000/api/resources", newResource);
          setResources([...resources, response.data]);
        }

        setFileName("");
        setCourseName("");
        setFileLink("");
      } catch (error) {
        console.error("Error saving resource:", error);
      }
    };
    
    // Handle delete confirmation
    const handleDeleteClick = (resource: Resource) => {
      setResourceToDelete(resource);
      setShowDeleteModal(true);
    };
    
    // Handle delete resource
    const handleDeleteConfirm = async () => {
      if (!resourceToDelete) return;
    
      try {
        await axios.delete(`http://localhost:5000/api/resources/${resourceToDelete._id}`);
        setResources(resources.filter((res) => res._id !== resourceToDelete._id));
        setShowDeleteModal(false);
        setResourceToDelete(null);
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    };
    

    // Handle edit resource
    const handleEdit = (resource: Resource) => {
      setEditingResource(resource);
      setFileName(resource.fileName);
      setCourseName(resource.courseName);
      setFileLink(resource.fileLink);
    };

    const toggleTopic = (index: number) => {
      setExpandedTopic(expandedTopic === index ? null : index);
    };


    // Handle bookmark toggle
    const handleBookmark = async (id: string | undefined) => {
      if (!id) return;
      
      try {
        const response = await axios.put(`http://localhost:5000/api/resources/${id}/bookmark`);
        setResources(resources.map((res) => (res._id === id ? response.data : res)));
      } catch (error) {
        console.error("Error bookmarking resource:", error);
      }
    };

    return (
      <div className="flex min-h-screen bg-purple-50">
        {/* Left Side Menu */}
        <aside className="w-64 bg-purple-800 text-white p-4">
          <div className="flex items-center mb-8">
          <img src="/ES_logo.png" alt="Your Logo" className="w-20 h-20 mr-2" />
            <h1 className="text-2xl font-bold">EduSage</h1>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <Link to="/Home">
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
                    <Quiz className="mr-2 h-4 w-4" />
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
            {/* <header className="bg-purple-800 text-white p-4">
              <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <GraduationCap className="w-8 h-8 mr-2" />
                  <h1 className="text-3xl font-bold">EduSage</h1>
                </div>
                <Button
                  variant="ghost"
                  className="text-white md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </header> */}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && resourceToDelete && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
                <h2 className="text-xl font-bold text-purple-800 mb-4">Confirm Deletion</h2>
                <p className="text-gray-600">Are you sure you want to delete <strong>{resourceToDelete.fileName}</strong>?</p>
                
                <div className="mt-6 flex justify-center space-x-4">
                  <Button onClick={() => setShowDeleteModal(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleDeleteConfirm} variant="destructive">
                    Yes, Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          <main className="flex-grow container mx-auto p-4">
            <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">
              Educational Resources
            </h2>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold mb-2">{editingResource ? "Edit Resource" : "Upload New Resource"}</h3>
              <input
                type="text"
                placeholder="File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="border p-2 w-full mb-2"
              />
              <select
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="border p-2 w-full mb-2"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="File Link"
                value={fileLink}
                onChange={(e) => setFileLink(e.target.value)}
                className="border p-2 w-full mb-2"
              />
              <Button type="submit">{editingResource ? "Update Resource" : "Upload"}</Button>
            </form>

            {/* Display Resources */}
            <h3 className="text-2xl font-bold text-purple-800 mb-4">Available Resources</h3>
            <ul className="space-y-2">
              {resources.map((resource) => (
                <li key={resource._id} className="border p-2 rounded-lg bg-white shadow-md flex justify-between items-center">
                <div>
                  <strong>{resource.fileName}</strong> - {resource.courseName} - 
                  <a href={resource.fileLink} target="_blank" className="text-blue-500 ml-1"> View</a>
                </div>
                <div className="flex space-x-2 items-center">
                  <Button onClick={() => handleBookmark(resource._id)} variant="outline">
                    {resource.bookmarked ? <BookmarkCheck className="h-5 w-5 text-green-600" /> : <Bookmark className="h-5 w-5" />}
                  </Button>
                  <Button onClick={() => handleEdit(resource)} variant="outline">
                    <Pencil className="h-5 w-5 text-blue-600" />
                  </Button>
                  <Button onClick={() => handleDeleteClick(resource)} variant="outline">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </Button>
                </div>
              </li>

              ))}
            </ul>
          </main>
        </div>
      </div>
    );
  }
