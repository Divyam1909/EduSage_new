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

const previousQuestions = [
  "What is the difference between mitosis and meiosis?",
  "How does photosynthesis work?",
  "What are the main causes of World War I?",
  "Can someone explain the theory of relativity?",
];

export default function EnhancedAskQuestion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [subject, setSubject] = useState("");
  const [wisdomPoints, setWisdomPoints] = useState(0); // New state for wisdom points
  const [attachments, setAttachments] = useState<File[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  useEffect(() => {
    if (title.length > 2) {
      const matchedQuestions = previousQuestions.filter((q) =>
        q.toLowerCase().includes(title.toLowerCase())
      );
      setSuggestions(matchedQuestions);
    } else {
      setSuggestions([]);
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (file) =>
          file.type.startsWith("image/") || file.type === "application/pdf"
      );
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (question: string) => {
    setSelectedQuestion(question);
    setShowDialog(true);
  };

  const confirmSuggestion = () => {
    setTitle(selectedQuestion);
    setShowDialog(false);
    alert(`Redirecting to the existing question: ${selectedQuestion}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          details,
          subject,
          wisdomPoints, // Send the assigned wisdom points
        }),
      });
      if (res.ok) {
        alert("Question submitted successfully!");
        // Reset form fields
        setTitle("");
        setDetails("");
        setSubject("");
        setWisdomPoints(0);
        setAttachments([]);
        // Redirect to Home page after submission
        navigate("/Home");
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
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-purple-800 mb-6">
          Ask Your Question
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
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
          <div>
            <Label htmlFor="subject" className="text-purple-800">
              Subject
            </Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math">MES</SelectItem>
                <SelectItem value="science">OS</SelectItem>
                <SelectItem value="history">CN</SelectItem>
                <SelectItem value="literature">SE</SelectItem>
                <SelectItem value="cs">EM-4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* New input for wisdom points */}
          <div>
            <Label htmlFor="wisdomPoints" className="text-purple-800">
              Wisdom Points (optional)
            </Label>
            <Input
              id="wisdomPoints"
              type="number"
              value={wisdomPoints}
              onChange={(e) => setWisdomPoints(Number(e.target.value))}
              placeholder="Assign wisdom points"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="file-upload" className="text-purple-800">
              Attachments (Images or PDFs)
            </Label>
            <div className="mt-1 flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                className="text-purple-600 border-purple-600 hover:bg-purple-100"
                onClick={() =>
                  document.getElementById("file-upload")?.click()
                }
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
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Question
          </Button>
        </form>
      </div>

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
