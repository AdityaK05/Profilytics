"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Sparkles,
  TrendingUp,
  MessageCircle,
  FileText,
  Calendar,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Award,
  Bell,
  Settings,
  LogOut,
  Search,
  Filter,
} from "lucide-react"

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const recentApplications = [
    { id: 1, company: "Google", position: "Software Engineering Intern", status: "Under Review", date: "2 days ago" },
    {
      id: 2,
      company: "Microsoft",
      position: "Product Management Intern",
      status: "Interview Scheduled",
      date: "1 week ago",
    },
    { id: 3, company: "Meta", position: "Data Science Intern", status: "Applied", date: "2 weeks ago" },
  ]

  const recommendedJobs = [
    {
      id: 1,
      company: "Netflix",
      position: "Frontend Developer Intern",
      location: "Los Gatos, CA",
      match: 95,
      skills: ["React", "JavaScript", "TypeScript"],
      posted: "2 days ago",
    },
    {
      id: 2,
      company: "Spotify",
      position: "Machine Learning Intern",
      location: "New York, NY",
      match: 88,
      skills: ["Python", "TensorFlow", "Data Analysis"],
      posted: "1 week ago",
    },
    {
      id: 3,
      company: "Airbnb",
      position: "UX Design Intern",
      location: "San Francisco, CA",
      match: 82,
      skills: ["Figma", "User Research", "Prototyping"],
      posted: "3 days ago",
    },
  ]

  const skillRoadmap = [
    { skill: "React.js", progress: 85, level: "Advanced" },
    { skill: "Node.js", progress: 70, level: "Intermediate" },
    { skill: "Python", progress: 60, level: "Intermediate" },
    { skill: "Machine Learning", progress: 30, level: "Beginner" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-6 lg:px-12 border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Profilytics
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Settings className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">JS</span>
            </div>
            <span className="text-white">John Smith</span>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 p-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back, John!
              </span>
            </h1>
            <p className="text-gray-400">Here's what's happening with your career journey today.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Applications</p>
                        <p className="text-2xl font-bold text-white">12</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Interviews</p>
                        <p className="text-2xl font-bold text-white">3</p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Profile Views</p>
                        <p className="text-2xl font-bold text-white">47</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Skill Score</p>
                        <p className="text-2xl font-bold text-white">85%</p>
                      </div>
                      <Award className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Applications */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Applications</CardTitle>
                    <CardDescription>Track your latest job applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{app.position}</p>
                          <p className="text-gray-400 text-sm">{app.company}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={app.status === "Interview Scheduled" ? "default" : "secondary"}
                            className={
                              app.status === "Interview Scheduled"
                                ? "bg-green-500/20 text-green-400"
                                : app.status === "Under Review"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }
                          >
                            {app.status}
                          </Badge>
                          <p className="text-gray-400 text-xs mt-1">{app.date}</p>
                        </div>
                      </div>
                    ))}
                    <Link href="/applications">
                      <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                        View All Applications
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>Personalized job matches for you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendedJobs.slice(0, 2).map((job) => (
                      <div key={job.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-medium">{job.position}</p>
                            <p className="text-gray-400 text-sm">{job.company}</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400">{job.match}% match</Badge>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm mb-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.location}
                          <Clock className="w-3 h-3 ml-3 mr-1" />
                          {job.posted}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Link href="/jobs">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Explore More Jobs
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Skill Progress */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Skill Development Progress
                  </CardTitle>
                  <CardDescription>Your AI-generated learning roadmap</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {skillRoadmap.map((skill) => (
                      <div key={skill.skill} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{skill.skill}</span>
                          <Badge variant="secondary">{skill.level}</Badge>
                        </div>
                        <Progress value={skill.progress} className="h-2" />
                        <p className="text-gray-400 text-sm">{skill.progress}% complete</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/skills">
                    <Button variant="outline" className="w-full mt-4 border-gray-700 text-white hover:bg-gray-800">
                      View Full Roadmap
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              {/* Job Search */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Find Your Perfect Internship</CardTitle>
                  <CardDescription>AI-powered job matching based on your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for positions, companies, or skills..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {recommendedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold text-lg">{job.position}</h3>
                            <p className="text-gray-400">{job.company}</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400">{job.match}% match</Badge>
                        </div>

                        <div className="flex items-center text-gray-400 text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                          <Clock className="w-4 h-4 ml-4 mr-1" />
                          {job.posted}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            Apply Now
                          </Button>
                          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Save Job
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Application Tracker</CardTitle>
                  <CardDescription>Monitor all your job applications in one place</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{app.position}</h3>
                          <Badge
                            variant={app.status === "Interview Scheduled" ? "default" : "secondary"}
                            className={
                              app.status === "Interview Scheduled"
                                ? "bg-green-500/20 text-green-400"
                                : app.status === "Under Review"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 mb-2">{app.company}</p>
                        <p className="text-gray-500 text-sm">Applied {app.date}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Update Status
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
                    AI-Powered Skill Roadmap
                  </CardTitle>
                  <CardDescription>Personalized learning path to achieve your career goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {skillRoadmap.map((skill) => (
                      <div key={skill.skill} className="p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{skill.skill}</h3>
                          <Badge variant="secondary">{skill.level}</Badge>
                        </div>
                        <Progress value={skill.progress} className="h-3 mb-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{skill.progress}% complete</span>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            Continue Learning
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                    <h3 className="text-white font-semibold mb-2">🎯 Recommended Next Steps</h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Complete the Advanced React course (2 weeks)</li>
                      <li>• Build a full-stack project using Node.js</li>
                      <li>• Start learning Machine Learning fundamentals</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Profile Overview</CardTitle>
                  <CardDescription>Manage your professional profile and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">JS</span>
                      </div>
                      <div>
                        <h3 className="text-white text-xl font-semibold">John Smith</h3>
                        <p className="text-gray-400">Computer Science Student</p>
                        <p className="text-gray-400">Stanford University • Class of 2025</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Contact Information</h4>
                        <div className="space-y-2 text-gray-300">
                          <p>📧 john.smith@stanford.edu</p>
                          <p>📱 (555) 123-4567</p>
                          <p>📍 Palo Alto, CA</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-3">Coding Profiles</h4>
                        <div className="space-y-2 text-gray-300">
                          <p>🏆 LeetCode: 2100+ rating</p>
                          <p>💻 GitHub: 50+ repositories</p>
                          <p>🔥 Codeforces: Expert level</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {["JavaScript", "React", "Node.js", "Python", "Java", "SQL", "Git", "AWS"].map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Chat Button */}
      <Link href="/chat">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full w-14 h-14 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  )
}
