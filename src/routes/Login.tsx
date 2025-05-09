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
// import Custombutton from "@/components/cu  stombutton";

// Student login component for authentication
export default function Login() {
  const navigate = useNavigate();
  
  // State for form fields and error messages
  const [rollno, setRollno] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Handle login authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setDebugInfo("Attempting login...");

    try {
      console.log("Sending login request with credentials:", { rollno });
      
      // Call authentication API endpoint
      const response = await apiFetch("login", {
        method: "POST",
        body: JSON.stringify({ rollno, password }),
      });
      
      setDebugInfo("Received response");
      
      // Parse the response
      const data = await response.json();
      
      console.log("Login response:", data);
      
      if (data.token) {
        setDebugInfo("Login successful, saving token");
        localStorage.setItem("token", data.token);
        navigate("/home");
      } else {
        setError(data.message || "Invalid credentials");
        setDebugInfo("Login failed: " + (data.message || "No error message"));
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Server error occurred. Please try again later.");
      setDebugInfo(`Error details: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Enter key press to trigger login
  const handleKeyPress = (e: { key: string; }) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex flex-col">
      {/* Header with logo */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <BookOpen className="h-8 w-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-purple-600">EduSage</h1>
        </div>
      </header>

      {/* Main login form */}
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Student Login
            </CardTitle>
            {error && <div className="text-red-600 text-center">{error}</div>}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Roll Number field */}
            <div className="space-y-2">
              <Label htmlFor="rollno">Roll Number</Label>
              <Input
                id="rollno"
                name="rollno"
                type="text"
                placeholder="e.g., 5023165"
                required
                value={rollno}
                onChange={(e) => setRollno(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>

            {/* Show password option */}
            <div className="flex items-center mt-2">
              <Checkbox
                id="show-password"
                checked={showPassword}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") {
                    setShowPassword(checked);
                  }
                }}
              />
              <Label htmlFor="show-password" className="ml-2 text-sm">
                Show Password
              </Label>
            </div>

            {/* Remember me option */}
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

          {/* Form controls */}
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
            <div className="flex items-center justify-between w-full text-sm">
              <Link
                className="text-purple-600 hover:text-purple-700 hover:underline flex items-center"
                to="/forgot"
              >
                <KeyRound className="h-4 w-4 mr-1" />
                Forgot password?
              </Link>
              <Link to="/register"
                className="text-purple-600 hover:text-purple-700 hover:underline"
              >
                New student? Sign up
              </Link>
            </div>
            {/* Debug info in dev mode only */}
            {import.meta.env.DEV && debugInfo && (
              <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-700 rounded">
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
