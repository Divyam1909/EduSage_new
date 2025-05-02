//@ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "../utils/api";

export default function TeacherForgotPasswordPage() {
  const [teacherId, setTeacherId] = useState("");
  const [email, setEmail] = useState("");
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch("/api/teacher/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, email }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsLinkSent(true);
        setSeconds(30);
        setSuccess(data.message || "Password reset link sent!");
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  useEffect(() => {
    let timer;
    if (isLinkSent && seconds > 0) {
      timer = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isLinkSent, seconds]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-purple-800">Forgot Password</CardTitle>
          <CardDescription className="text-center text-purple-600">
            Enter your Teacher ID and email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="teacherId" className="text-purple-700">Teacher ID</Label>
              <Input
                id="teacherId"
                placeholder="Enter your Teacher ID"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isLinkSent && seconds > 0}
            >
              {isLinkSent && seconds > 0 ? `Please wait... (${seconds}s)` : isLinkSent ? "Resend Link" : "Send Reset Link"}
            </Button>
          </form>
          {success && <p className="mt-4 text-center text-green-600">{success}</p>}
          {error && <p className="mt-4 text-center text-red-600">{error}</p>}
          {isLinkSent && seconds > 0 && (
            <p className="mt-4 text-center text-purple-600">
              Please wait {seconds} seconds before you can resend the link.
            </p>
          )}
          <div className="mt-4 text-center">
            <Link
              to="/tlogin"
              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login Page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
