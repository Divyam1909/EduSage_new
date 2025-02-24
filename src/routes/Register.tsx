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

  const handleRegister = async () => {
    // Check if any field is empty
    if (
      !name ||
      !rollno ||
      !branch ||
      !sem ||
      !dateOfBirth ||
      !phone ||
      !email ||
      !password ||
      !retypePassword
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== retypePassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rollno,
          branch,
          sem: Number(sem),
          dateOfBirth,
          phone,
          email,
          password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong.");
    }
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      handleRegister();
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
              <Input
                id="branch"
                type="text"
                placeholder="Your branch"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {/* Semester */}
            <div className="space-y-2">
              <Label htmlFor="sem">Semester</Label>
              <Input
                id="sem"
                type="number"
                placeholder="Semester"
                required
                value={sem}
                onChange={(e) => setSem(e.target.value)}
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
                type="password"
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
                type="password"
                required
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                onKeyDown={handleKeyPress}
              />
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
              onClick={handleRegister}
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
