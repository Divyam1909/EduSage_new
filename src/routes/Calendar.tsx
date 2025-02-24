import { useState, useEffect } from "react";
import { Bookmark, Bot, Calendar, ChevronLeft, ChevronRight, FileText, PlusCircle, User, Users, HelpCircle as Quiz} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

interface Event {
  id?: string;
  title: string;
  date: string; // ISO string including time if provided
  time?: string; // original time input (optional)
  details?: string;
}

export default function Component() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false); // for event details modal
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false); // for add/edit modal
  const [isEditMode, setIsEditMode] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", details: "" });

  // Helper to compute time left from now until eventDateTime
  const getTimeLeft = (eventDate: Date) => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    if (diff < 0) {
      return "Event has already passed.";
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} days, ${hours} hours, ${minutes} minutes remaining.`;
  };

  useEffect(() => {
    axios.get("http://localhost:5000/api/events")
      .then((response) => {
        // Transform _id to id if needed
        const transformed = response.data.map((ev: any) => ({ ...ev, id: ev._id }));
        setEvents(transformed);
      })
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      alert("Title and Date are required!");
      return;
    }
    try {
      const timePart = newEvent.time ? "T" + newEvent.time : "T00:00:00";
      const formattedDate = new Date(newEvent.date + timePart).toISOString();
      const eventToAdd = { ...newEvent, date: formattedDate };
      const response = await axios.post("http://localhost:5000/api/events", eventToAdd);
      const addedEvent = { ...response.data, id: response.data._id };
      setEvents((prevEvents) => [...prevEvents, addedEvent]);
      setIsAddEventModalOpen(false);
      setNewEvent({ title: "", date: "", time: "", details: "" });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !selectedEvent) {
      alert("Title and Date are required!");
      return;
    }
    try {
      const timePart = newEvent.time ? "T" + newEvent.time : "T00:00:00";
      const formattedDate = new Date(newEvent.date + timePart).toISOString();
      const eventToUpdate = { ...newEvent, date: formattedDate };
      const response = await axios.put(`http://localhost:5000/api/events/${selectedEvent.id}`, eventToUpdate);
      const updatedEvent = { ...response.data, id: response.data._id };
      setEvents((prevEvents) =>
        prevEvents.map((ev) => (ev.id === selectedEvent.id ? updatedEvent : ev))
      );
      setIsAddEventModalOpen(false);
      setNewEvent({ title: "", date: "", time: "", details: "" });
      setSelectedEvent(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${selectedEvent.id}`);
      setEvents((prevEvents) => prevEvents.filter((ev) => ev.id !== selectedEvent.id));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-purple-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-purple-800 text-white p-4">
        <div className="flex items-center mb-8">
        <img src="/ES_logo2.png" alt="Your Logo" className="w-20 h-20 mr-2" />
          <h1 className="text-2xl font-bold">EduSage</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-white hover:text-black transition-colors"
              >
                <Users className="mr-2 h-4 w-4" />
                Discussion Forum
              </Button>
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
      <div className="flex-1 flex flex-col p-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-6">EduSage Calendar</h1>

        {/* Current Date & Time Bar (12-hr format) */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 border border-purple-200">
          <p className="text-xl text-purple-600 font-semibold">
            Current Date and Time: {currentDateTime.toLocaleString("en-US", { 
              hour12: true, 
              hour: "numeric", 
              minute: "numeric", 
              second: "numeric", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>

        {/* Add Event Button */}
        <div className="flex items-center mb-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsAddEventModalOpen(true);
              setIsEditMode(false);
            }}
            className="flex items-center space-x-2"
          >
            <PlusCircle className="w-6 h-6 text-purple-600" />
            <span>Add Event</span>
          </Button>
        </div>

        {/* Month and Year Selection */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1))}>
            <ChevronLeft />
          </Button>
          <h2 className="text-lg font-semibold">
            {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(selectedYear, selectedMonth))} {selectedYear}
          </h2>
          <Button variant="outline" onClick={() => setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1))}>
            <ChevronRight />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 text-center font-bold mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>

        {/* Calendar */}
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date(selectedYear, selectedMonth, i + 1);
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={i}
                className="flex flex-col items-center h-16 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50"
                onClick={() => {
                  if (dayEvents.length) {
                    handleEventClick(dayEvents[0]);
                  }
                }}
              >
                <span className="mb-1">{i + 1}</span>
                {dayEvents.map((event) => (
                  <div key={event.id} className="text-xs p-1 bg-purple-600 text-white rounded">
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border border-purple-300 p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">
              {isEditMode ? "Edit Event" : "Add New Event"}
            </h2>
            <Input
              type="text"
              placeholder="Event Title"
              className="mb-2"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <Input
              type="date"
              className="mb-2"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <Input
              type="time"
              placeholder="Event Time (optional)"
              className="mb-2"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            />
            <Textarea
              placeholder="Event Details (optional)"
              className="mb-2"
              value={newEvent.details}
              onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })}
            />
            <Button onClick={isEditMode ? handleUpdateEvent : handleAddEvent} className="w-full">
              {isEditMode ? "Update Event" : "Add Event"}
            </Button>
            <Button onClick={() => { setIsAddEventModalOpen(false); setIsEditMode(false); }} className="w-full mt-2">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border border-purple-300 p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">{selectedEvent.title}</h2>
            <p className="mb-2">
              <strong>Date & Time: </strong>
              {new Date(selectedEvent.date).toLocaleString("en-US", {
                hour12: true,
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mb-4">{selectedEvent.details}</p>
            {/* Display time left until event */}
            <p className="mb-4 text-sm text-gray-600">
              {getTimeLeft(new Date(selectedEvent.date))}
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  setNewEvent({
                    title: selectedEvent.title,
                    date: selectedEvent.date.substring(0, 10),
                    time: selectedEvent.time || "",
                    details: selectedEvent.details || ""
                  });
                  setIsEditMode(true);
                  setIsModalOpen(false);
                  setIsAddEventModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button onClick={handleDeleteEvent} variant="destructive">
                Delete
              </Button>
            </div>
            <Button onClick={() => setIsModalOpen(false)} className="w-full mt-2">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
