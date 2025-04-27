//@ts-nocheck
import { useState, useEffect } from "react";
import {
  Bookmark,
  Bot,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  PlusCircle,
  User,
  Users,
  HelpCircle as Quiz,
} from "lucide-react";
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
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import AILoader from "@/components/AILoader";
import { useToast } from "@/components/ToastContainer";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiClient } from "../utils/api";

interface Event {
  id?: string;
  title: string;
  date: string; // ISO string including time if provided
  time?: string;
  details?: string;
  notifications?: {
    dayBefore: boolean;
    dayOf: boolean;
    atTime: boolean;
  };
  notificationStatus?: {
    dayBeforeSent: boolean;
    dayOfSent: boolean;
    atTimeSent: boolean;
  };
}

export default function CalendarComponent() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    details: "",
    notifications: {
      dayBefore: true,
      dayOf: true,
      atTime: true,
    }
  });

  // New states for PDF upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    status: 'idle' | 'uploading' | 'parsing' | 'saving' | 'complete' | 'error';
    message?: string;
  }>({ status: 'idle' });
  
  // New state for PDF events deletion
  const [deletingPdfEvents, setDeletingPdfEvents] = useState(false);

  // Add the toast hook
  const { showToast } = useToast();

  // Add state for confirm dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const getTimeLeft = (eventDate: Date) => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    if (diff < 0) return "Event has already passed.";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} days, ${hours} hours, ${minutes} minutes remaining.`;
  };

  // Fetch events from the backend
  useEffect(() => {
    refreshEvents();
  }, []);

  const refreshEvents = () => {
    apiClient
      .get("/api/events")
      .then((response) => {
        const transformed = response.data.map((ev: any) => ({
          ...ev,
          id: ev._id,
        }));
        setEvents(transformed);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        showToast("Failed to load calendar events", "error");
      });
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      showToast("Title and Date are required!", "error");
      return;
    }
    try {
      // Correctly format the date with time
      let formattedDate;
      if (newEvent.time) {
        formattedDate = `${newEvent.date}T${newEvent.time}:00`;
      } else {
        formattedDate = `${newEvent.date}T00:00:00`;
      }
      
      const eventToAdd = { 
        ...newEvent, 
        date: formattedDate,
        // Only send at-time notifications if time is provided
        notifications: {
          ...newEvent.notifications,
          atTime: newEvent.time ? newEvent.notifications.atTime : false
        }
      };
      const response = await apiClient.post(
        "/api/events",
        eventToAdd
      );
      const addedEvent = { ...response.data, id: response.data._id };
      setEvents((prevEvents) => [...prevEvents, addedEvent]);
      setIsAddEventModalOpen(false);
      setNewEvent({ 
        title: "", 
        date: "", 
        time: "", 
        details: "",
        notifications: {
          dayBefore: true,
          dayOf: true,
          atTime: true,
        }
      });
      setIsEditMode(false);
      showToast("Event added successfully", "success");
    } catch (error) {
      console.error("Error adding event:", error);
      showToast("Failed to add event", "error");
    }
  };

  const handleUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !selectedEvent) {
      showToast("Title and Date are required!", "error");
      return;
    }
    try {
      // Correctly format the date with time
      let formattedDate;
      if (newEvent.time) {
        formattedDate = `${newEvent.date}T${newEvent.time}:00`;
      } else {
        formattedDate = `${newEvent.date}T00:00:00`;
      }
      
      const eventToUpdate = { 
        ...newEvent, 
        date: formattedDate,
        // Only send at-time notifications if time is provided
        notifications: {
          ...newEvent.notifications,
          atTime: newEvent.time ? newEvent.notifications.atTime : false
        }
      };
      const response = await apiClient.put(
        `/api/events/${selectedEvent.id}`,
        eventToUpdate
      );
      const updatedEvent = { ...response.data, id: response.data._id };
      setEvents((prevEvents) =>
        prevEvents.map((ev) => (ev.id === selectedEvent.id ? updatedEvent : ev))
      );
      setIsAddEventModalOpen(false);
      setNewEvent({ 
        title: "", 
        date: "", 
        time: "", 
        details: "",
        notifications: {
          dayBefore: true,
          dayOf: true,
          atTime: true,
        }
      });
      setSelectedEvent(null);
      setIsEditMode(false);
      showToast("Event updated successfully", "success");
    } catch (error) {
      console.error("Error updating event:", error);
      showToast("Failed to update event", "error");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await apiClient.delete(
        `/api/events/${selectedEvent.id}`
      );
      setEvents((prevEvents) =>
        prevEvents.filter((ev) => ev.id !== selectedEvent.id)
      );
      setIsModalOpen(false);
      setSelectedEvent(null);
      showToast("Event deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Failed to delete event", "error");
    }
  };

  // Function to trigger delete confirmation
  const confirmDeleteEvent = () => {
    setDeleteConfirmOpen(true);
  };

  // PDF Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Reset any previous error messages when a new file is selected
      setUploadProgress({ status: 'idle' });
    }
  };

  // Update handleDeletePdfEvents to use the confirmation dialog
  const handleDeletePdfEvents = async () => {    
    setDeletingPdfEvents(true);
    try {
      const response = await apiClient.delete('/api/calendar/pdf-events');
      
      // Check for count first, then deletedCount, then fall back to a generic message
      if (response.data.count !== undefined) {
        showToast(`${response.data.count} PDF-imported events deleted`, "success");
      } else if (response.data.deletedCount !== undefined) {
        showToast(`${response.data.deletedCount} PDF-imported events deleted`, "success");
      } else {
        showToast("PDF-imported events deleted successfully", "success");
      }
      
      // Refresh events after deletion
      refreshEvents();
    } catch (error) {
      console.error('Error deleting PDF events:', error);
      showToast("Failed to delete PDF events", "error");
    } finally {
      setDeletingPdfEvents(false);
    }
  };

  // Function to trigger bulk delete confirmation
  const confirmDeletePdfEvents = () => {
    setBulkDeleteConfirmOpen(true);
  };

  // Update the handleUploadPDF function with better UI feedback
  const handleUploadPDF = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress({ status: 'uploading', message: 'Uploading file...' });
    
    const formData = new FormData();
    formData.append("pdf", selectedFile);
    
    try {
      // Update UI to show we're starting AI processing after upload begins
      setTimeout(() => {
        setUploadProgress({ status: 'parsing', message: 'AI is analyzing your calendar...' });
      }, 1000);
      
      // Let axios automatically set the Content-Type
      const response = await apiClient.post(
        "/api/calendar/upload-pdf",
        formData
      );
      
      setUploadProgress({ status: 'complete' });
      const eventCount = response.data.events?.length || 0;
      showToast(`Successfully imported ${eventCount} events from the PDF`, "success");
      setShowUploadModal(false);
      setSelectedFile(null);
      refreshEvents();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setUploadProgress({ 
        status: 'error', 
        message: `Error uploading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      showToast(`Error uploading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
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
              <Link to="/home">
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
              <Link to="/resources">
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
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-6">
          EduSage Calendar
        </h1>

        {/* Current Date & Time Bar */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 border border-purple-200">
          <p className="text-xl text-purple-600 font-semibold">
            Current Date and Time:{" "}
            {currentDateTime.toLocaleString("en-US", {
              hour12: true,
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Event notifications are available in the Home page notification panel. 
            You'll be notified before events and when they start.
          </p>
        </div>

        {/* Top Buttons: Add Event, Upload & Delete PDF Events */}
        <div className="flex items-center mb-4 space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              // Reset newEvent state when manually adding a new event
              setNewEvent({ title: "", date: "", time: "", details: "", notifications: { dayBefore: true, dayOf: true, atTime: true } });
              setIsAddEventModalOpen(true);
              setIsEditMode(false);
            }}
            className="flex items-center space-x-2"
          >
            <PlusCircle className="w-6 h-6 text-purple-600" />
            <span>Add Event</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2"
          >
            <FileText className="w-6 h-6 text-purple-600" />
            <span>Upload Academic Calendar</span>
          </Button>
          <Button
            variant="outline"
            onClick={confirmDeletePdfEvents}
            disabled={deletingPdfEvents}
            className="flex items-center space-x-2"
          >
            <FileText className="w-6 h-6 text-red-600" />
            <span>{deletingPdfEvents ? "Deleting..." : "Delete PDF Events"}</span>
          </Button>
        </div>

        {/* Month and Year Selection */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
          >
            <ChevronLeft />
          </Button>
          <h2 className="text-lg font-semibold">
            {new Intl.DateTimeFormat("en-US", { month: "long" }).format(
              new Date(selectedYear, selectedMonth)
            )}{" "}
            {selectedYear}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
          >
            <ChevronRight />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 text-center font-bold mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date(selectedYear, selectedMonth, i + 1);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={i}
                className={`flex flex-col h-20 border ${isToday ? 'border-purple-600 bg-purple-50' : 'border-purple-200'} rounded-lg cursor-pointer hover:bg-purple-100 overflow-hidden relative transition-colors duration-200`}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    // If an event exists on this day, open the event details modal.
                    handleEventClick(dayEvents[0]);
                  } else {
                    // If no event exists, pre-fill the date and open the add event modal.
                    const dateObj = new Date(selectedYear, selectedMonth, i + 1);
                    
                    // Format date as YYYY-MM-DD with timezone handling
                    // Use the date parts directly instead of toISOString() to avoid timezone issues
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    
                    setNewEvent({
                      title: "",
                      date: formattedDate,
                      time: "",
                      details: "",
                      notifications: {
                        dayBefore: true,
                        dayOf: true,
                        atTime: true,
                      }
                    });
                    setIsAddEventModalOpen(true);
                    setIsEditMode(false);
                  }
                }}
              >
                <div className={`flex justify-between items-center px-2 py-1 ${isToday ? 'bg-purple-600 text-white' : ''}`}>
                  <span className={`font-semibold ${isToday ? 'text-white' : 'text-gray-700'}`}>{i + 1}</span>
                  {dayEvents.length > 1 && (
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-purple-700 text-white rounded-full">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-1 space-y-1">
                  {dayEvents.length > 0 && (
                    <>
                      {dayEvents.slice(0, 2).map((event, idx) => (
                        <div 
                          key={event.id} 
                          className="text-xs p-1 bg-purple-600 text-white rounded overflow-hidden overflow-ellipsis whitespace-nowrap"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-purple-700 font-medium pl-1">
                          +{dayEvents.length - 2} more...
                        </div>
                      )}
                    </>
                  )}
                </div>
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
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />
            <Input
              type="date"
              className="mb-2"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
            />
            <Input
              type="time"
              placeholder="Event Time (optional)"
              className="mb-2"
              value={newEvent.time}
              onChange={(e) =>
                setNewEvent({ ...newEvent, time: e.target.value })
              }
            />
            <Textarea
              placeholder="Event Details (optional)"
              className="mb-4"
              value={newEvent.details}
              onChange={(e) =>
                setNewEvent({ ...newEvent, details: e.target.value })
              }
            />
            
            {/* Notification Settings */}
            <div className="mb-4 border border-purple-100 rounded-md p-2">
              <h3 className="font-semibold mb-2 text-purple-800">Notification Settings</h3>
              <div className="flex items-center mb-2">
                <Checkbox 
                  id="day-before"
                  checked={newEvent.notifications.dayBefore}
                  onCheckedChange={(checked) => 
                    setNewEvent({
                      ...newEvent,
                      notifications: {
                        ...newEvent.notifications,
                        dayBefore: checked as boolean
                      }
                    })
                  }
                />
                <label htmlFor="day-before" className="ml-2 text-sm">
                  Notify one day before
                </label>
              </div>
              <div className="flex items-center mb-2">
                <Checkbox 
                  id="day-of"
                  checked={newEvent.notifications.dayOf}
                  onCheckedChange={(checked) => 
                    setNewEvent({
                      ...newEvent,
                      notifications: {
                        ...newEvent.notifications,
                        dayOf: checked as boolean
                      }
                    })
                  }
                />
                <label htmlFor="day-of" className="ml-2 text-sm">
                  Notify at 12:00 AM on the day
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="at-time"
                  checked={newEvent.time ? newEvent.notifications.atTime : false}
                  disabled={!newEvent.time}
                  onCheckedChange={(checked) => 
                    setNewEvent({
                      ...newEvent,
                      notifications: {
                        ...newEvent.notifications,
                        atTime: checked as boolean
                      }
                    })
                  }
                />
                <label htmlFor="at-time" className={`ml-2 text-sm ${!newEvent.time ? 'text-gray-400' : ''}`}>
                  Notify at event time {!newEvent.time && "(requires setting event time)"}
                </label>
              </div>
            </div>
            
            <Button
              onClick={isEditMode ? handleUpdateEvent : handleAddEvent}
              className="w-full"
            >
              {isEditMode ? "Update Event" : "Add Event"}
            </Button>
            <Button
              onClick={() => {
                setIsAddEventModalOpen(false);
                setIsEditMode(false);
              }}
              className="w-full mt-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white border border-purple-300 p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">
              {selectedEvent.title}
            </h2>
            <p className="mb-2">
              <strong>Date & Time: </strong>
              {(() => {
                try {
                  const eventDate = new Date(selectedEvent.date);
                  return eventDate.toLocaleString("en-US", {
                    hour12: true,
                    hour: "numeric",
                    minute: "numeric",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                } catch (err) {
                  return "Invalid date";
                }
              })()}
            </p>
            <div className="mb-4 overflow-auto max-h-48 whitespace-pre-line bg-purple-50 p-3 rounded-md text-gray-800">
              {selectedEvent.details}
            </div>
            <p className="mb-4 text-sm text-gray-600">
              {getTimeLeft(new Date(selectedEvent.date))}
            </p>
            
            {/* Show other events on the same day */}
            {(() => {
              const date = new Date(selectedEvent.date);
              const dayEvents = getEventsForDate(date).filter(event => event.id !== selectedEvent.id);
              
              if (dayEvents.length > 0) {
                return (
                  <div className="mb-4">
                    <h3 className="font-semibold text-purple-800 mb-2">
                      Other events on this day ({dayEvents.length}):
                    </h3>
                    <ul className="text-sm bg-purple-50 rounded-md p-2">
                      {dayEvents.map((event) => (
                        <li 
                          key={event.id} 
                          className="mb-2 p-2 hover:bg-purple-100 rounded cursor-pointer transition-colors duration-150"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="font-medium text-purple-800">{event.title}</div>
                          {event.time && (
                            <div className="text-xs text-gray-500 mt-1">
                              Time: {event.time}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  // Format the date as YYYY-MM-DD
                  const dateObj = new Date(selectedEvent.date);
                  
                  // Use the same timezone-safe date formatting as for new events
                  const year = dateObj.getFullYear();
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;
                  
                  setNewEvent({
                    title: selectedEvent.title,
                    date: formattedDate,
                    time: selectedEvent.time || "",
                    details: selectedEvent.details || "",
                    notifications: selectedEvent.notifications || { dayBefore: true, dayOf: true, atTime: true },
                  });
                  setIsEditMode(true);
                  setIsModalOpen(false);
                  setIsAddEventModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button onClick={confirmDeleteEvent} variant="destructive">
                Delete
              </Button>
            </div>
            <Button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-2"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* PDF Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white border border-purple-300 p-6 rounded-lg shadow-xl w-[450px] max-w-[90vw]">
            <h2 className="text-2xl font-bold mb-4 text-purple-800 text-center">
              Upload Academic Calendar PDF
            </h2>
            
            {uploading ? (
              <div className="py-6 px-4">
                <AILoader />
                <div className="text-center text-sm text-purple-700 mt-4">
                  {uploadProgress.status === 'uploading' ? 
                    'Uploading your file to the server...' : 
                    'Our AI is working to extract events from your calendar...'}
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">
                  This may take up to a minute depending on the complexity of your calendar
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 text-sm text-center text-gray-600">
                  Upload your academic calendar PDF to automatically extract events using AI.
                  <br />
                  The system will identify dates, titles, and details from your calendar.
                </div>
                
                <div className="flex flex-col items-center mb-6">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="mb-4 w-full"
                    disabled={uploading}
                  />
                  {selectedFile && (
                    <div className="text-sm text-green-600 font-medium">
                      Ready to upload: {selectedFile.name}
                    </div>
                  )}
                </div>
                
                {uploadProgress.status === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    <div className="font-medium mb-1">Error occurred:</div>
                    {uploadProgress.message}
                  </div>
                )}
              </>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={handleUploadPDF}
                disabled={uploading || !selectedFile}
                className={`flex-1 ${!uploading ? 'bg-purple-700 hover:bg-purple-800' : ''}`}
              >
                {uploading ? 
                  (uploadProgress.status === 'uploading' ? "Uploading..." : "AI Processing...") 
                  : "Upload and Process"}
              </Button>
              <Button
                onClick={() => {
                  if (!uploading) {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadProgress({ status: 'idle' });
                  }
                }}
                disabled={uploading}
                variant="outline"
                className="flex-1"
              >
                {uploading ? "Please Wait..." : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          handleDeleteEvent();
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText="Delete"
        confirmVariant="destructive"
      />
      
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        title="Delete All PDF Events"
        description="Are you sure you want to delete all events imported from PDFs? This action cannot be undone."
        onConfirm={() => {
          setBulkDeleteConfirmOpen(false);
          handleDeletePdfEvents();
        }}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        confirmText="Delete All"
        confirmVariant="destructive"
      />
    </div>
  );
}
