//@ts-nocheck
import { useState } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Book,
  Monitor,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Teacher interface for managing educational resources
export default function TeacherInterface() {
  // Initial state with sample topics and resources
  const [topics, setTopics] = useState([
    {
      name: "Arrays and Strings",
      expanded: true,
      resources: [
        { type: "pdf", name: "Array Basics PDF" },
        { type: "note", name: "String Manipulation Notes" },
        { type: "ppt", name: "Two Pointer Technique PPT" },
        { type: "video", name: "Sliding Window Video" },
      ],
    },
    { name: "Linked Lists", expanded: false, resources: [] },
    { name: "Trees and Graphs", expanded: false, resources: [] },
    { name: "Sorting and Searching", expanded: false, resources: [] },
    { name: "Dynamic Programming", expanded: false, resources: [] },
  ]);

  // State for form inputs
  const [newTopic, setNewTopic] = useState("");
  const [newResource, setNewResource] = useState({ type: "pdf", name: "" });

  // Add a new topic to the list
  const addTopic = () => {
    if (newTopic) {
      setTopics([
        ...topics,
        { name: newTopic, expanded: false, resources: [] },
      ]);
      setNewTopic("");
    }
  };

  // Toggle a topic's expanded state
  const toggleTopic = (index: number) => {
    const newTopics = [...topics];
    newTopics[index].expanded = !newTopics[index].expanded;
    setTopics(newTopics);
  };

  // Add a new resource to a specific topic
  const addResource = (topicIndex: number) => {
    if (newResource.name) {
      const newTopics = [...topics];
      newTopics[topicIndex].resources.push(newResource);
      setTopics(newTopics);
      setNewResource({ type: "pdf", name: "" });
    }
  };

  // Remove a resource from a topic
  const removeResource = (topicIndex: number, resourceIndex: number) => {
    const newTopics = [...topics];
    newTopics[topicIndex].resources.splice(resourceIndex, 1);
    setTopics(newTopics);
  };

  // Get the appropriate icon for a resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "note":
        return <Book className="w-4 h-4" />;
      case "ppt":
        return <Monitor className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header with navigation */}
      <header className="bg-purple-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EduSage</h1>
          <nav>
            <Button variant="ghost" className="text-white">
              Home
            </Button>
            <Button variant="ghost" className="text-white">
              Profile
            </Button>
            <Button variant="ghost" className="text-white">
              About Us
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto mt-8 p-4">
        <h2 className="text-3xl font-bold text-purple-800 mb-6">
          Educational Resources Management
        </h2>

        {/* Add new topic form */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-purple-700 mb-2">
            Add New Topic
          </h3>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter new topic name"
              className="flex-grow"
            />
            <Button
              onClick={addTopic}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>

        {/* Topics and resources lists */}
        {topics.map((topic, topicIndex) => (
          <Card key={topicIndex} className="mb-4">
            {/* Topic header with expand/collapse button */}
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-purple-700">
                {topic.name}
              </CardTitle>
              <Button variant="ghost" onClick={() => toggleTopic(topicIndex)}>
                {topic.expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CardHeader>
            {topic.expanded && (
              <CardContent>
                {/* Add new resource form */}
                <div className="mb-4">
                  <h4 className="font-semibold text-purple-600 mb-2">
                    Add New Resource
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={newResource.type}
                      onChange={(e) =>
                        setNewResource({ ...newResource, type: e.target.value })
                      }
                      className="border rounded p-2"
                    >
                      <option value="pdf">PDF</option>
                      <option value="note">Note</option>
                      <option value="ppt">PPT</option>
                      <option value="video">Video</option>
                    </select>
                    <Input
                      type="text"
                      value={newResource.name}
                      onChange={(e) =>
                        setNewResource({ ...newResource, name: e.target.value })
                      }
                      placeholder="Enter resource name"
                      className="flex-grow"
                    />
                    <Button
                      onClick={() => addResource(topicIndex)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
                {/* Resources list */}
                <ul>
                  {topic.resources.map((resource, resourceIndex) => (
                    <li
                      key={resourceIndex}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <span className="flex items-center">
                        {getResourceIcon(resource.type)}
                        <span className="ml-2">{resource.name}</span>
                      </span>
                      <div>
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-red-600 hover:text-red-800"
                          onClick={() =>
                            removeResource(topicIndex, resourceIndex)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-purple-600 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>EduSage - Empowering minds through knowledge</p>
        </div>
      </footer>
    </div>
  );
}
