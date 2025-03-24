import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Upload, Send, Image, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";

// Sample previous questions for demonstrating similar question detection
const previousQuestions = [
  "What is the difference between mitosis and meiosis?",
  "How does photosynthesis work?",
  "What are the main causes of World War I?",
  "Can someone explain the theory of relativity?",
];

// Component for submitting new questions to the discussion forum with enhanced features
export default function EnhancedAskQuestion() {
  const navigate = useNavigate();
  const { refreshUserData } = useUser();
  
  // Form state variables
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // State for similar question suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  // Filter for similar questions when title changes
  useEffect(() => {
    if (title.length > 2) {
      setSuggestions(previousQuestions.filter(q => 
        q.toLowerCase().includes(title.toLowerCase())
      ));
    } else {
      setSuggestions([]);
    }
  }, [title]);

  // Handle file attachment uploads (only images and PDFs)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith("image/") || file.type === "application/pdf"
      );
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Remove a specific file from attachments
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Handle when user clicks on a suggested similar question
  const handleSuggestionClick = (question: string) => {
    setSelectedQuestion(question);
    setShowDialog(true);
  };

  // Handle confirmation to view an existing similar question
  const confirmSuggestion = () => {
    setTitle(selectedQuestion);
    setShowDialog(false);
    alert(`Redirecting to the existing question: ${selectedQuestion}`);
  };

  // Submit the new question to the backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to ask a question.");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, details, subject }),
      });
      
      if (res.ok) {
        // Refresh user data to update questionsAsked count
        await refreshUserData();
        alert("Question submitted successfully!");
        setTitle("");
        setDetails("");
        setSubject("");
        setAttachments([]);
        navigate("/home");
      } else {
        alert("Error submitting question");
      }
    } catch (error) {
      console.error("Error submitting question", error);
      alert("Error submitting question");
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      {/* Main form card */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-purple-800 mb-6">
          Ask Your Question
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Question title with similar question suggestions */}
          <div>
            <Label htmlFor="title" className="text-purple-800">
              Question Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a clear, concise title for your question"
              className="mt-1"
            />
            {suggestions.length > 0 && (
              <ul className="mt-2 border border-purple-200 rounded-md">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 hover:bg-purple-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Question details textarea */}
          <div>
            <Label htmlFor="details" className="text-purple-800">
              Question Details
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context or details about your question"
              className="mt-1 h-32"
            />
          </div>
          
          {/* Subject selection dropdown */}
          <div>
            <Label htmlFor="subject" className="text-purple-800">
              Subject
            </Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MES">MES</SelectItem>
                <SelectItem value="OS">OS</SelectItem>
                <SelectItem value="CN">CN</SelectItem>
                <SelectItem value="SE">SE</SelectItem>
                <SelectItem value="EM-4">EM-4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* File attachments section */}
          <div>
            <Label htmlFor="file-upload" className="text-purple-800">
              Attachments (Images or PDFs)
            </Label>
            <div className="mt-1 flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                className="text-purple-600 border-purple-600 hover:bg-purple-100"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <Input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
              <span className="text-sm text-gray-500">
                {attachments.length} file(s) selected
              </span>
            </div>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-purple-100 p-2 rounded"
                  >
                    <span className="flex items-center text-sm text-purple-800 truncate">
                      {file.type.startsWith("image/") ? (
                        <Image className="h-4 w-4 mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 hover:text-purple-800"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Question
          </Button>
        </form>
      </div>

      {/* Similar question dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Similar Question Found</DialogTitle>
            <DialogDescription>
              We found a similar question that has already been asked. Would you
              like to view its solution instead?
            </DialogDescription>
          </DialogHeader>
          <p className="py-4 font-medium text-purple-800">{selectedQuestion}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Continue with my question
            </Button>
            <Button onClick={confirmSuggestion}>View existing solution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
