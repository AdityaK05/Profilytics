"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, Users, Building2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [studentData, setStudentData] = useState({ email: "", password: "" })
  const [employerData, setEmployerData] = useState({ email: "", password: "" })

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Student login:", studentData)
    router.push("/dashboard/student")
  }

  const handleEmployerLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Employer login:", employerData)
    router.push("/dashboard/employer")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-6 lg:px-12">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Profilytics
          </span>
        </Link>

        <Link href="/">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-6">
        <div className="max-w-md mx-auto w-full">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-400">Sign in to your Profilytics account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="student" className="data-[state=active]:bg-blue-600">
                    <Users className="w-4 h-4 mr-2" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="employer" className="data-[state=active]:bg-purple-600">
                    <Building2 className="w-4 h-4 mr-2" />
                    Employer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-email">Email</Label>
                      <Input
                        id="student-email"
                        type="email"
                        value={studentData.email}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, email: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password">Password</Label>
                      <Input
                        id="student-password"
                        type="password"
                        value={studentData.password}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, password: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Sign In as Student
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="employer">
                  <form onSubmit={handleEmployerLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employer-email">Email</Label>
                      <Input
                        id="employer-email"
                        type="email"
                        value={employerData.email}
                        onChange={(e) => setEmployerData((prev) => ({ ...prev, email: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employer-password">Password</Label>
                      <Input
                        id="employer-password"
                        type="password"
                        value={employerData.password}
                        onChange={(e) => setEmployerData((prev) => ({ ...prev, password: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Sign In as Employer
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="text-center mt-6 space-y-2">
                <Link href="/auth/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Forgot your password?
                </Link>
                <p className="text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
