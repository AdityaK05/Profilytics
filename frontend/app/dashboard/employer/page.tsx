"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Sparkles,
  Users,
  Building2,
  TrendingUp,
  FileText,
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Award,
  Target,
} from "lucide-react"

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const topCandidates = [
    {
      id: 1,
      name: "Sarah Chen",
      university: "MIT",
      major: "Computer Science",
      gpa: "3.9",
      leetcodeRating: 2200,
      skills: ["React", "Python", "Machine Learning"],
      match: 96,
      experience: "2 internships",
    },
    {
      id: 2,
      name: "Alex Rodriguez",
      university: "Stanford",
      major: "Software Engineering",
      gpa: "3.8",
      leetcodeRating: 1950,
      skills: ["Java", "Spring Boot", "AWS"],
      match: 92,
      experience: "1 internship",
    },
    {
      id: 3,
      name: "Emily Johnson",
      university: "UC Berkeley",
      major: "Data Science",
      gpa: "3.85",
      leetcodeRating: 1800,
      skills: ["Python", "TensorFlow", "SQL"],
      match: 89,
      experience: "Research projects",
    },
  ]

  const activeJobs = [
    {
      id: 1,
      title: "Software Engineering Intern",
      department: "Engineering",
      applications: 45,
      posted: "1 week ago",
      status: "Active",
    },
    {
      id: 2,
      title: "Data Science Intern",
      department: "Analytics",
      applications: 32,
      posted: "3 days ago",
      status: "Active",
    },
    {
      id: 3,
      title: "Product Management Intern",
      department: "Product",
      applications: 28,
      posted: "5 days ago",
      status: "Active",
    },
  ]

  const recentApplications = [
    {
      id: 1,
      candidate: "Michael Zhang",
      position: "Software Engineering Intern",
      university: "Carnegie Mellon",
      appliedDate: "2 hours ago",
      status: "New",
    },
    {
      id: 2,
      candidate: "Jessica Liu",
      position: "Data Science Intern",
      university: "Harvard",
      appliedDate: "5 hours ago",
      status: "Under Review",
    },
    {
      id: 3,
      candidate: "David Kim",
      position: "Product Management Intern",
      university: "Yale",
      appliedDate: "1 day ago",
      status: "Shortlisted",
    },
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">TC</span>
            </div>
            <span className="text-white">TechCorp</span>
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
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Employer Dashboard
              </span>
            </h1>
            <p className="text-gray-400">Find and manage top talent with AI-powered insights.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active Jobs</p>
                        <p className="text-2xl font-bold text-white">8</p>
                      </div>
                      <FileText className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Applications</p>
                        <p className="text-2xl font-bold text-white">156</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Interviews Scheduled</p>
                        <p className="text-2xl font-bold text-white">12</p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Avg. Match Score</p>
                        <p className="text-2xl font-bold text-white">87%</p>
                      </div>
                      <Target className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top AI-Matched Candidates */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                      Top AI-Matched Candidates
                    </CardTitle>
                    <CardDescription>Candidates ranked by our AI matching algorithm</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topCandidates.slice(0, 3).map((candidate) => (
                      <div key={candidate.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-medium">{candidate.name}</p>
                            <p className="text-gray-400 text-sm">
                              {candidate.university} • {candidate.major}
                            </p>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-400">{candidate.match}% match</Badge>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm mb-2">
                          <Award className="w-3 h-3 mr-1" />
                          GPA: {candidate.gpa} • LeetCode: {candidate.leetcodeRating}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Link href="/candidates">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        View All Candidates
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Recent Applications */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Applications</CardTitle>
                    <CardDescription>Latest candidate applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{app.candidate}</p>
                          <p className="text-gray-400 text-sm">{app.position}</p>
                          <p className="text-gray-500 text-xs">
                            {app.university} • {app.appliedDate}
                          </p>
                        </div>
                        <Badge
                          variant={app.status === "New" ? "default" : "secondary"}
                          className={
                            app.status === "New"
                              ? "bg-blue-500/20 text-blue-400"
                              : app.status === "Shortlisted"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                    <Link href="/applications">
                      <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                        View All Applications
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Active Job Postings */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Active Job Postings
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Post New Job
                    </Button>
                  </CardTitle>
                  <CardDescription>Manage your current job openings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{job.title}</h3>
                          <Badge className="bg-green-500/20 text-green-400">{job.status}</Badge>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm mb-3">
                          <Building2 className="w-4 h-4 mr-1" />
                          {job.department}
                          <Clock className="w-4 h-4 ml-4 mr-1" />
                          Posted {job.posted}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">{job.applications} applications</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-white hover:bg-gray-800"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-white hover:bg-gray-800"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              {/* Candidate Search */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">AI-Powered Candidate Search</CardTitle>
                  <CardDescription>Find the perfect candidates using advanced AI matching</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search by skills, university, or experience..."
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      <Filter className="w-4 h-4 mr-2" />
                      Advanced Filters
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {topCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold text-lg">{candidate.name}</h3>
                            <p className="text-gray-400">
                              {candidate.university} • {candidate.major}
                            </p>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-400">{candidate.match}% match</Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="text-gray-300 text-sm">
                            <p>🎓 GPA: {candidate.gpa}</p>
                            <p>💻 LeetCode: {candidate.leetcodeRating}+</p>
                          </div>
                          <div className="text-gray-300 text-sm">
                            <p>💼 Experience: {candidate.experience}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {candidate.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            View Profile
                          </Button>
                          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Contact
                          </Button>
                          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Job Management
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Job
                    </Button>
                  </CardTitle>
                  <CardDescription>Manage all your job postings and requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold text-lg">{job.title}</h3>
                          <Badge className="bg-green-500/20 text-green-400">{job.status}</Badge>
                        </div>

                        <div className="flex items-center text-gray-400 text-sm mb-3">
                          <Building2 className="w-4 h-4 mr-1" />
                          {job.department}
                          <Clock className="w-4 h-4 ml-4 mr-1" />
                          Posted {job.posted}
                          <Users className="w-4 h-4 ml-4 mr-1" />
                          {job.applications} applications
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            View Applications
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Edit Job
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Analytics
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
                  <CardTitle className="text-white">Application Management</CardTitle>
                  <CardDescription>Review and manage candidate applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{app.candidate}</h3>
                          <Badge
                            variant={app.status === "New" ? "default" : "secondary"}
                            className={
                              app.status === "New"
                                ? "bg-blue-500/20 text-blue-400"
                                : app.status === "Shortlisted"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 mb-1">{app.position}</p>
                        <p className="text-gray-500 text-sm mb-3">
                          {app.university} • Applied {app.appliedDate}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            Review Application
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            Schedule Interview
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

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Recruitment Analytics
                  </CardTitle>
                  <CardDescription>AI-powered insights into your hiring process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">Application Conversion Rate</h3>
                      <p className="text-3xl font-bold text-green-400">23%</p>
                      <p className="text-gray-400 text-sm">+5% from last month</p>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">Average Time to Hire</h3>
                      <p className="text-3xl font-bold text-blue-400">18 days</p>
                      <p className="text-gray-400 text-sm">-3 days from last month</p>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">Top Source Universities</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-white">1. Stanford University</p>
                        <p className="text-gray-300">2. MIT</p>
                        <p className="text-gray-300">3. UC Berkeley</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                    <h3 className="text-white font-semibold mb-2">🤖 AI Insights</h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Candidates with 2000+ LeetCode rating have 40% higher success rate</li>
                      <li>• CS majors from top 10 universities show best performance</li>
                      <li>• Applications received on Tuesdays have highest quality scores</li>
                    </ul>
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
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full w-14 h-14 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  )
}
