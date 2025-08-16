"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Sparkles, Send, ArrowLeft, Bot, User, Lightbulb, Target, BookOpen, Briefcase } from "lucide-react"

interface Message {
  id: number
  type: "user" | "ai"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm your AI career assistant. I can help you with career planning, interview preparation, skill development, and job search strategies. What would you like to discuss today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const quickActions = [
    {
      icon: Target,
      title: "Career Planning",
      description: "Get personalized career roadmap",
      prompt: "Help me create a career plan for software engineering",
    },
    {
      icon: Briefcase,
      title: "Interview Prep",
      description: "Practice common interview questions",
      prompt: "Can you help me prepare for technical interviews?",
    },
    {
      icon: BookOpen,
      title: "Skill Development",
      description: "Learn new technologies and skills",
      prompt: "What skills should I learn to become a better developer?",
    },
    {
      icon: Lightbulb,
      title: "Resume Review",
      description: "Get feedback on your resume",
      prompt: "Can you give me tips to improve my resume?",
    },
  ]

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: "ai",
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)

    setInputMessage("")
  }

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("career") || input.includes("plan")) {
      return "Great question! Based on your profile, I recommend focusing on these key areas:\n\n1. **Technical Skills**: Strengthen your foundation in React, Node.js, and cloud technologies\n2. **Projects**: Build 2-3 substantial projects showcasing full-stack capabilities\n3. **Networking**: Connect with professionals in your target companies\n4. **Certifications**: Consider AWS or Google Cloud certifications\n\nWould you like me to create a detailed 6-month roadmap for you?"
    }

    if (input.includes("interview") || input.includes("prep")) {
      return 'I\'d be happy to help you prepare for interviews! Here\'s a comprehensive approach:\n\n**Technical Preparation:**\n- Practice coding problems on LeetCode (aim for 150+ problems)\n- Review system design fundamentals\n- Prepare for behavioral questions using the STAR method\n\n**Common Questions to Practice:**\n- "Tell me about yourself"\n- "Why do you want to work here?"\n- "Describe a challenging project"\n\nWould you like me to simulate a mock interview with you?'
    }

    if (input.includes("skill") || input.includes("learn")) {
      return "Based on current market trends and your profile, here are the most valuable skills to develop:\n\n**High Priority:**\n- TypeScript (essential for modern development)\n- Next.js/React 18 features\n- Docker & Kubernetes\n- GraphQL\n\n**Medium Priority:**\n- Machine Learning basics (Python/TensorFlow)\n- Mobile development (React Native)\n- DevOps practices (CI/CD)\n\n**Emerging Technologies:**\n- AI/ML integration in web apps\n- Web3 development\n- Edge computing\n\nWhich area interests you most?"
    }

    if (input.includes("resume")) {
      return "I'd love to help improve your resume! Here are key tips for a standout tech resume:\n\n**Structure:**\n- Keep it to 1-2 pages\n- Use a clean, ATS-friendly format\n- Include quantifiable achievements\n\n**Technical Section:**\n- List relevant technologies and proficiency levels\n- Include links to GitHub and portfolio\n- Mention notable projects with impact metrics\n\n**Experience:**\n- Use action verbs (Built, Implemented, Optimized)\n- Include specific technologies used\n- Quantify results when possible\n\nWould you like me to review a specific section of your resume?"
    }

    return "That's an interesting question! I'm here to help with your career development. I can assist with:\n\n- Career planning and goal setting\n- Interview preparation and practice\n- Skill development recommendations\n- Resume and portfolio optimization\n- Job search strategies\n- Salary negotiation tips\n\nWhat specific area would you like to explore further?"
  }

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-6 lg:px-12 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/student">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Career Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">Online</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-80px)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-gradient-to-r from-green-500 to-blue-500"
                    }`}
                  >
                    {message.type === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-3xl p-4 rounded-lg ${
                      message.type === "user"
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "bg-gray-800/50 border border-gray-700"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-gray-100">{message.content}</div>
                    <div className="text-xs text-gray-400 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-4">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about your career..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-800 p-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors text-left"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <action.icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{action.title}</p>
                      <p className="text-gray-400 text-xs">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Career path recommendations</li>
                <li>• Interview question practice</li>
                <li>• Skill gap analysis</li>
                <li>• Resume optimization tips</li>
                <li>• Salary negotiation advice</li>
                <li>• Industry trend insights</li>
                <li>• Networking strategies</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
