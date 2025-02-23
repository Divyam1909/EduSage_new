import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Users, FileText, HelpCircle as Quiz, User, Bookmark, Calendar, Bot } from "lucide-react";
import { Link } from "react-router-dom";

interface Event {
  id: number;
  date: Date;
  title: string;
  isImportant: boolean;
  details: string;
  color: string;
}

export default function Component() {
  const [currentDate] = useState(new Date());
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const today = new Date();
    const sampleEvents: Event[] = [
      {
        id: 1,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        title: "Final Exams",
        isImportant: true,
        details: "Final examinations for all subjects. Make sure to check the detailed schedule.",
        color: "bg-purple-600",
      },
      {
        id: 2,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9),
        title: "College Fest",
        isImportant: true,
        details: "Annual college festival with various cultural and technical events.",
        color: "bg-purple-600",
      },
      {
        id: 3,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
        title: "Workshop on AI",
        isImportant: true,
        details: "A one-day workshop on Artificial Intelligence and its applications.",
        color: "bg-purple-600",
      },
    ];
    setEvents(sampleEvents);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true); // Open the modal
  };

  const handleDateClick = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]); // Get the first event for the date
      setIsModalOpen(true); // Open the modal
    }
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isImportantDate = dayEvents.length > 0; // Check if there are important events

      days.push(
        <div
          key={day}
          className={`flex flex-col justify-between items-center h-16 border border-purple-200 rounded-lg ${
            isToday ? "bg-purple-100" : ""
          } ${isImportantDate ? "cursor-pointer hover:bg-purple-50" : "cursor-default"}`} // Make date clickable only if there are events
          onClick={() => isImportantDate && handleDateClick(date)} // Click only if it's an important date
        >
          <span className={`mb-1 ${isToday ? "font-bold text-purple-800" : ""}`}>{day}</span>
          <div className="w-full">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate text-white ${event.color} mb-1 cursor-pointer`}
                onClick={() => handleEventClick(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-purple-50 flex">
      {/* Left Side Menu */}
      <aside className="w-64 bg-purple-800 text-white p-4">
        <div className="flex items-center mb-8">
          <BookOpen className="w-8 h-8 mr-2" />
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
              <Link to="/Resources">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
                  <FileText className="mr-2 h-4 w-4" />
                  Resources
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
              <Link to="/profile">
                <Button variant="ghost" className="w-full justify-start hover:bg-white hover:text-black transition-colors">
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
          </ul>
        </nav>
      </aside>

      {/* Calendar Section */}
      <div className="flex-1 flex flex-col p-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-6">EduSage Calendar</h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <p className="text-xl text-purple-600 font-semibold">Current Date and Time: {currentDateTime.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button variant="outline" onClick={prevMonth}>
                <ChevronLeft />
              </Button>
              <h2 className="mx-4 text-lg font-semibold">
                {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(selectedYear, selectedMonth))}{" "}
                {selectedYear}
              </h2>
              <Button variant="outline" onClick={nextMonth}>
                <ChevronRight />
              </Button>
            </div>
            <Select onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={i} value={`${currentDate.getFullYear() - i}`}>
                    {currentDate.getFullYear() - i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={`${i}`}>
                    {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(selectedYear, i))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-7 gap-4">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Modal for Event Details */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">{selectedEvent?.title}</h2>
            <p className="mb-4">{selectedEvent?.details}</p>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
