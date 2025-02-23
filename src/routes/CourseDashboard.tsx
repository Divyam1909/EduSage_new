import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Database, Cpu, PenTool, Book } from "lucide-react";

const courses = [
  {
    name: "Mathematics",
    description:
      "Fundamental mathematical concepts and problem-solving techniques",
    icon: <PenTool className="h-6 w-6" />,
    topics: ["Calculus", "Linear Algebra", "Probability", "Statistics"],
  },
  {
    name: "Data Structures and Algorithms",
    description: "Essential data structures and algorithm design techniques",
    icon: <Code className="h-6 w-6" />,
    topics: [
      "Arrays",
      "Linked Lists",
      "Trees",
      "Graphs",
      "Sorting",
      "Searching",
    ],
  },
  {
    name: "Database Management Systems",
    description: "Principles and practices of database design and management",
    icon: <Database className="h-6 w-6" />,
    topics: ["SQL", "Normalization", "Indexing", "Transactions"],
  },
  {
    name: "Python Programming",
    description: "Learn Python programming language and its applications",
    icon: <BookOpen className="h-6 w-6" />,
    topics: ["Basics", "OOP", "Data Analysis", "Web Development"],
  },
  {
    name: "Computer Organization and Architecture",
    description: "Understanding computer hardware and low-level system design",
    icon: <Cpu className="h-6 w-6" />,
    topics: [
      "Digital Logic",
      "CPU Architecture",
      "Memory Systems",
      "I/O Systems",
    ],
  },
];

export default function CourseDashboard() {
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-800 flex items-center justify-center">
          <Book className="h-8 w-8 mr-2" />
          EduSage
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Card
              key={index}
              className="bg-white hover:shadow-lg transition-all duration-300"
              onMouseEnter={() => setHoveredCourse(index)}
              onMouseLeave={() => setHoveredCourse(null)}
            >
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 rounded-full p-2 text-purple-700">
                    {course.icon}
                  </div>
                  <CardTitle className="text-purple-700">
                    {course.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {hoveredCourse === index ? (
                  <div className="space-y-2">
                    <CardDescription className="text-purple-600">
                      {course.description}
                    </CardDescription>
                    <div className="font-semibold text-purple-700">Topics:</div>
                    <ul className="list-disc list-inside text-purple-500">
                      {course.topics.map((topic, topicIndex) => (
                        <li key={topicIndex}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm h-7">
                    View
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
