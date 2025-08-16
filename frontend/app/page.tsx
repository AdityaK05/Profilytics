"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Brain,
  Users,
  Target,
  Zap,
  TrendingUp,
  MessageCircle,
  Filter,
  ArrowRight,
  Sparkles,
  Code,
  Play,
  Menu,
  X,
} from "lucide-react"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const studentFeatures = [
    {
      icon: Target,
      title: "Personalized Recommendations",
      description: "AI-powered internship matching based on your skills and interests",
    },
    {
      icon: TrendingUp,
      title: "Skill Roadmaps",
      description: "AI-generated learning paths to bridge your skill gaps",
    },
    {
      icon: Users,
      title: "Peer Connections",
      description: "Connect with like-minded students and build your network",
    },
    {
      icon: MessageCircle,
      title: "AI Career Chatbot",
      description: "24/7 guidance on career planning and interview prep",
    },
  ]

  const employerFeatures = [
    {
      icon: Brain,
      title: "Smart Candidate Ranking",
      description: "AI evaluation based on coding profiles and experience",
    },
    {
      icon: Code,
      title: "Profile Analysis",
      description: "Automatic assessment of LeetCode, GFG, and Codeforces profiles",
    },
    {
      icon: Filter,
      title: "Intelligent Filtering",
      description: "Advanced filtering by skills with smart matching",
    },
    {
      icon: Zap,
      title: "Automated Sorting",
      description: "Save hours with ML-powered candidate evaluation",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Profilytics
            </span>
          </Link>

          <div className="hidden md:flex space-x-12 font-semibold text-gray-300 tracking-wide">
            {["Jobs", "About", "Contact"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="relative px-1 pb-1 hover:text-white transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex space-x-4 items-center">
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:border-blue-500 transition"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition"
            aria-label="Toggle Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md shadow-inner flex flex-col items-center py-10 space-y-8 text-xl font-semibold">
            {["Jobs", "About", "Contact"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-gray-300 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 max-w-7xl mx-auto px-6 md:px-12 text-center select-none">
        <Badge className="inline-flex items-center mb-8 bg-blue-900/80 text-blue-400 border border-blue-600 rounded-full px-6 py-2 text-sm tracking-wide font-medium shadow-lg">
          <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
          AI-Powered Career Platform
        </Badge>

        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">
          Future of <br /> Career Discovery
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-300 mb-14 leading-relaxed tracking-wide">
          Connect students with dream internships and help employers find top talent through AI-powered
          matching, smart candidate evaluation, and personalized career guidance.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/auth/signup" passHref>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-12 py-5 text-lg font-semibold shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition-transform"
            >
              <Play className="w-6 h-6" />
              Start Your Journey
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800 px-12 py-5 text-lg font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            Watch Demo
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 pb-20">
        {/* Students Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl hover:shadow-blue-600/50 transition-shadow transform hover:-translate-y-1 hover:scale-[1.03] duration-300 cursor-default p-8">
          <h2 className="text-3xl font-extrabold mb-8 text-blue-400 bg-gradient-to-r from-blue-300 to-purple-500 bg-clip-text text-transparent">
            For Students
          </h2>
          <ul className="space-y-6">
            {studentFeatures.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start space-x-5">
                <div className="mt-1 text-blue-400">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="text-gray-300 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Employers Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl hover:shadow-purple-600/50 transition-shadow transform hover:-translate-y-1 hover:scale-[1.03] duration-300 cursor-default p-8">
          <h2 className="text-3xl font-extrabold mb-8 text-purple-400 bg-gradient-to-r from-purple-300 to-pink-500 bg-clip-text text-transparent">
            For Employers
          </h2>
          <ul className="space-y-6">
            {employerFeatures.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start space-x-5">
                <div className="mt-1 text-purple-400">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="text-gray-300 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
