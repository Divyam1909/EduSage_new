"use client"

import { useState } from 'react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Activity, Award, Dumbbell, Flame, Heart, Trophy, TrendingUp, User, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"

const performanceData = {
  overall: [
    { date: "2023-05-01", score: 65 },
    { date: "2023-05-08", score: 68 },
    { date: "2023-05-15", score: 75 },
    { date: "2023-05-22", score: 72 },
    { date: "2023-05-29", score: 80 },
    { date: "2023-06-05", score: 85 },
  ],
  speed: [
    { date: "2023-05-01", score: 70 },
    { date: "2023-05-08", score: 72 },
    { date: "2023-05-15", score: 75 },
    { date: "2023-05-22", score: 78 },
    { date: "2023-05-29", score: 80 },
    { date: "2023-06-05", score: 82 },
  ],
  strength: [
    { date: "2023-05-01", score: 60 },
    { date: "2023-05-08", score: 65 },
    { date: "2023-05-15", score: 70 },
    { date: "2023-05-22", score: 72 },
    { date: "2023-05-29", score: 75 },
    { date: "2023-06-05", score: 78 },
  ],
  endurance: [
    { date: "2023-05-01", score: 55 },
    { date: "2023-05-08", score: 60 },
    { date: "2023-05-15", score: 65 },
    { date: "2023-05-22", score: 70 },
    { date: "2023-05-29", score: 75 },
    { date: "2023-06-05", score: 80 },
  ],
}

const recentActivities = [
  { 
    date: "2023-06-05", 
    activity: "5km Run", 
    duration: "25 mins", 
    improvement: "+2%", 
    icon: <Activity className="h-4 w-4" />,
    details: "Completed a 5km run in the park. Pace was slightly better than last time.",
    mood: "Energized",
    calories: 300,
  },
  { 
    date: "2023-06-03", 
    activity: "Weight Training", 
    duration: "45 mins", 
    improvement: "+5%", 
    icon: <Dumbbell className="h-4 w-4" />,
    details: "Focused on upper body. Increased weights for bench press and shoulder press.",
    mood: "Strong",
    calories: 200,
  },
  { 
    date: "2023-06-01", 
    activity: "Swimming", 
    duration: "30 mins", 
    improvement: "+3%", 
    icon: <Flame className="h-4 w-4" />,
    details: "Practiced freestyle and breaststroke. Improved breathing technique.",
    mood: "Refreshed",
    calories: 250,
  },
]

const achievements = [
  { title: "Speed Demon", description: "Ran 100m in under 12 seconds", icon: <Flame className="h-6 w-6 text-yellow-500" /> },
  { title: "Iron Lifter", description: "Bench pressed 100kg", icon: <Dumbbell className="h-6 w-6 text-gray-500" /> },
  { title: "Marathon Master", description: "Completed first marathon", icon: <Award className="h-6 w-6 text-blue-500" /> },
]

export default function Component() {
  const [selectedMetric, setSelectedMetric] = useState("overall")

  const getChartColor = (metric) => {
    switch (metric) {
      case "speed": return "hsl(var(--chart-2))"
      case "strength": return "hsl(var(--chart-3))"
      case "endurance": return "hsl(var(--chart-4))"
      default: return "hsl(var(--chart-1))"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Tracking</h1>
        <Avatar className="h-12 w-12">
          <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85/100</div>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72 bpm</div>
            <p className="text-xs text-muted-foreground">Resting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Best</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5km in 22:30</div>
            <p className="text-xs text-muted-foreground">Achieved on June 1, 2023</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>Track your progress across different metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overall" onValueChange={setSelectedMetric}>
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="speed">Speed</TabsTrigger>
              <TabsTrigger value="strength">Strength</TabsTrigger>
              <TabsTrigger value="endurance">Endurance</TabsTrigger>
            </TabsList>
            <TabsContent value={selectedMetric}>
              <ChartContainer
                config={{
                  score: {
                    label: "Score",
                    color: getChartColor(selectedMetric),
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {selectedMetric === "overall" ? (
                    <BarChart data={performanceData[selectedMetric]}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" fill={`var(--color-score)`} />
                    </BarChart>
                  ) : (
                    <LineChart data={performanceData[selectedMetric]}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="score" stroke={`var(--color-score)`} strokeWidth={2} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Carousel className="w-full max-w-xs">
              <CarouselContent>
                {recentActivities.map((activity, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col items-center p-6">
                          <Avatar className="h-12 w-12 mb-4">
                            <AvatarFallback>{activity.icon}</AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold text-lg mb-2">{activity.activity}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{activity.date}</p>
                          <Badge variant="secondary">{activity.duration}</Badge>
                          <p className="mt-4 font-medium text-green-500">{activity.improvement}</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="mt-4">View Details</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>{activity.activity}</DialogTitle>
                                <DialogDescription>{activity.date}</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-medium">Duration:</span>
                                  <span className="col-span-3">{activity.duration}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-medium">Improvement:</span>
                                  <span className="col-span-3 text-green-500">{activity.improvement}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-medium">Details:</span>
                                  <span className="col-span-3">{activity.details}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-medium">Mood:</span>
                                  <span className="col-span-3">{activity.mood}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="font-medium">Calories:</span>
                                  <span className="col-span-3">{activity.calories} kcal</span>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    {achievement.icon}
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}