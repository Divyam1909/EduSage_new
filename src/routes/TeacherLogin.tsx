//@ts-nocheck
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
// import Custombutton from "@/components/custombutton";

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [teacherId, setTeacherId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiFetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, password }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem("teacherToken", data.token);
        navigate("/teacher/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setError("Server error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <BookOpen className="h-8 w-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-purple-600">EduSage</h1>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Teacher Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input
                id="teacherId"
                name="teacherId"
                type="text"
                placeholder="e.g., T12345"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                onKeyDown={handleKeyPress} // Trigger handleLogin on Enter
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress} // Trigger handleLogin on Enter
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleLogin}
              disabled={isSubmitting}
            >
              {/* <Custombutton/> */}
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
            <div className="flex items-center justify-between w-full text-sm">
              <Link
                className="text-purple-600 hover:text-purple-700 hover:underline flex items-center"
                to="/tforgot"
              >
                <KeyRound className="h-4 w-4 mr-1" />
                Forgot password?
              </Link>
              <Link to="/tregister" className="text-purple-700 hover:underline text-sm">New teacher? Sign up</Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
