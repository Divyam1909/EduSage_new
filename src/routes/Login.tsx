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
// import Custombutton from "@/components/cu  stombutton";

// Student login component for authentication
export default function Login() {
  const navigate = useNavigate();
  
  // State variables for form inputs
  const [rollno, setRollno] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle login authentication
  const handleClick = async () => {
    // Form validation
    if (rollno === "" || password === "") {
      alert("Please enter roll number and password");
      return;
    }
  
    try {
      // Call authentication API endpoint
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollno, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Store auth token and redirect on successful login
        localStorage.setItem("token", data.token);
        navigate("/home");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Server error");
    }
  };
  
  // Handle Enter key press to trigger login
  const handleKeyPress = (e: { key: string; }) => {
    if (e.key === "Enter") {
      handleClick();
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
              onClick={handleClick}
            >
              {/* <Custombutton/> */}
              Log in
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
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
