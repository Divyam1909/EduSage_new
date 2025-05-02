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

export default function TeacherRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
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
    setError("");

    if (!name || !teacherId || !dateOfBirth || !dateOfJoining || !phone || !email || !password) {
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
      const registrationData = {
        name,
        teacherId,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        dateOfJoining: new Date(dateOfJoining).toISOString(),
        phone,
        email,
        password,
      };
      const response = await apiFetch("/api/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {}
      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/tlogin");
      } else {
        setError(data?.message || "Registration failed");
      }
    } catch (error) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
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
              Teacher Registration
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
            {/* Teacher ID */}
            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input
                id="teacherId"
                type="text"
                placeholder="e.g., T12345"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                onKeyDown={handleKeyPress}
              />
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
            {/* Date of Joining */}
            <div className="space-y-2">
              <Label htmlFor="doj">Date of Joining</Label>
              <Input
                id="doj"
                type="date"
                required
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
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
                to="/tlogin"
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