//@ts-nocheck
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { FileText, Calendar, User, ListChecks, BookOpen } from "lucide-react";

export default function TeacherResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editResource, setEditResource] = useState<any>(null);
  const [form, setForm] = useState({ fileName: "", courseName: "", fileLink: "" });
  const [error, setError] = useState("");

  useEffect(() => { fetchResources(); }, []);

  async function fetchResources() {
    try {
      const res = await apiFetch("/api/resources");
      setResources(await res.json());
    } catch (e) { setError("Failed to load resources"); }
  }
  function openModal(resource: any = null) {
    setEditResource(resource);
    setForm(resource ? { ...resource } : { fileName: "", courseName: "", fileLink: "" });
    setShowModal(true);
  }
  async function handleSave() {
    try {
      const method = editResource ? "PUT" : "POST";
      const url = editResource ? `/api/resources/${editResource._id}` : "/api/resources";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        fetchResources();
        setShowModal(false);
      } else {
        setError("Failed to save resource");
      }
    } catch (e) { setError("Failed to save resource"); }
  }
  async function handleDelete(id: any) {
    if (!window.confirm("Delete this resource?")) return;
    try {
      const res = await apiFetch(`/api/resources/${id}`, { method: "DELETE" });
      if (res.ok) fetchResources();
      else setError("Failed to delete resource");
    } catch (e) { setError("Failed to delete resource"); }
  }

  return (
    <div className="flex min-h-screen bg-purple-50">
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
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Manage Resources</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Button className="mb-4" onClick={() => openModal()}>Add Resource</Button>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-purple-100">
                <th className="p-2">File Name</th>
                <th className="p-2">Course Name</th>
                <th className="p-2">File Link</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource._id} className="border-b">
                  <td className="p-2">{resource.fileName}</td>
                  <td className="p-2">{resource.courseName}</td>
                  <td className="p-2"><a href={resource.fileLink} target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">View</a></td>
                  <td className="p-2 space-x-2">
                    <Button onClick={() => openModal(resource)} size="sm">Edit</Button>
                    <Button onClick={() => handleDelete(resource._id)} size="sm" variant="destructive">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-purple-700" onClick={() => setShowModal(false)}>✕</button>
              <h3 className="text-lg font-bold mb-4">{editResource ? "Edit Resource" : "Add Resource"}</h3>
              <div className="space-y-2">
                <Label>File Name</Label>
                <Input value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} />
                <Label>Course Name</Label>
                <Input value={form.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} />
                <Label>File Link</Label>
                <Input value={form.fileLink} onChange={e => setForm(f => ({ ...f, fileLink: e.target.value }))} />
              </div>
              <Button className="mt-4 w-full" onClick={handleSave}>{editResource ? "Save Changes" : "Add Resource"}</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 