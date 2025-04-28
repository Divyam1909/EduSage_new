//@ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  
  // New state variables for additional fields
  const [name, setName] = useState("");
  const [rollno, setRollno] = useState("");
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Form validation
    if (!name || !email || !rollno || !password || !branch || !sem || !dateOfBirth || !phone) {
      setError("All fields are required");
      setIsSubmitting(false);
      return;
    }
    
    if (password !== retypePassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Submitting registration form...");
      
      // Format the date properly
      let formattedDate;
      try {
        formattedDate = new Date(dateOfBirth).toISOString();
      } catch (error) {
        console.error("Date formatting error:", error);
        setError("Invalid date format. Please check the date field.");
        setIsSubmitting(false);
        return;
      }
      
      // Build the registration data
      const registrationData = {
        name, 
        email, 
        rollno, 
        password,
        branch,
        sem: parseInt(sem),
        dateOfBirth: formattedDate,
        phone,
        realPassword: password
      };
      
      console.log("Registration data prepared (with sensitive info redacted):", {
        ...registrationData,
        password: "[REDACTED]",
        realPassword: "[REDACTED]"
      });
      
      // Call registration API endpoint
      const response = await apiFetch("register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      // Try to get response data
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response:", jsonError);
      }
      
      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        if (data?.missingFields) {
          setError(`Registration failed: Missing ${data.missingFields.join(", ")}`);
        } else {
          setError(data?.message || "Registration failed");
        }
        console.error("Registration error:", data);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      handleSubmit(e);
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
              Student Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Roll Number */}
            <div className="space-y-2">
              <Label htmlFor="rollno">Roll Number</Label>
              <Input
                id="rollno"
                type="text"
                placeholder="e.g., 5023165"
                required
                value={rollno}
                onChange={(e) => setRollno(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <select
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="block w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select your branch</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="EXTC">EXTC</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>
            {/* Semester */}
            <div className="space-y-2">
              <Label htmlFor="sem">Semester</Label>
              <select
                id="sem"
                value={sem}
                onChange={(e) => setSem(e.target.value)}
                required
                className="block w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select your semester</option>
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                placeholder="Your phone number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email ID</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Retype Password */}
            <div className="space-y-2">
              <Label htmlFor="retypePassword">Retype Password</Label>
              <Input
                id="retypePassword"
                type={showPassword ? "text" : "password"}
                required
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
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

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center space-x-2">
              <Checkbox id="agree" />
              <label
                htmlFor="agree"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Sign Up
            </Button>
            <div className="flex items-center justify-center w-full text-sm">
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 hover:underline"
              >
                Already registered? Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
