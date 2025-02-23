import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [rollNo, setRollNo] = useState("");
  const [isLinkSent, setIsLinkSent] = useState(false); // State to track if the reset link is sent
  const [seconds, setSeconds] = useState(0); // State to track the countdown timer

  const handleSubmit = (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    setIsLinkSent(true); // Mark the link as sent
    setSeconds(5); // Start the 30-second countdown
    alert("Password reset link successfully sent!");
  };

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (isLinkSent && seconds > 0) {
      // Set up the countdown
      timer = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      // Stop the timer when countdown ends
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
            Enter your roll number to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="rollNo" className="text-purple-700">Roll Number</Label>
              <Input
                id="rollNo"
                placeholder="Enter your roll number"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isLinkSent && seconds > 0} // Disable the button during the countdown
            >
              {isLinkSent && seconds > 0 ? `Please wait... (${seconds}s)` : isLinkSent ? "Resend Link" : "Send Reset Link"}
            </Button>
          </form>
          {isLinkSent && seconds > 0 && (
            <p className="mt-4 text-center text-purple-600">
              Please wait {seconds} seconds before you can resend the link.
            </p>
          )}
          <div className="mt-4 text-center">
            <Link
              to="/"
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
