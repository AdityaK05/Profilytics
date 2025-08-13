"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  const jobs = [
    {
      id: 1,
      title: "Software Engineering Intern",
      company: "Google",
      location: "Mountain View, CA",
      type: "Internship",
      duration: "12 weeks",
      salary: "$8,000/month",
      posted: "2 days ago",
      match: 96,
      description: "Join our team to work on cutting-edge technologies and scalable systems.",
      skills: ["JavaScript", "Python", "React", "Node.js"],
      requirements: ["CS/related major", "3.5+ GPA", "Strong coding skills"],
      benefits: ["Housing stipend", "Free meals", "Mentorship program"],
    },
    {
      id: 2,
      title: "Data Science Intern",
      company: "Microsoft",
      location: "Redmond, WA",
      type: "Internship",
      duration: "10 weeks",
      salary: "$7,500/month",
      posted: "5 days ago",
      match: 90,
      description: "Work with real datasets to build predictive models and insights.",
      skills: ["Python", "TensorFlow", "Pandas", "SQL"],
      requirements: ["Statistics/CS major", "Strong math foundation"],
      benefits: ["Mentorship", "Wellness benefits"],
    },
  ] as const

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery = searchQuery
        ? job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchesLocation = locationFilter
        ? job.location.toLowerCase().includes(locationFilter.toLowerCase())
        : true
      const matchesType = typeFilter ? job.type === typeFilter : true
      return matchesQuery && matchesLocation && matchesType
    })
  }, [jobs, searchQuery, locationFilter, typeFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Find Internships</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Search roles or companies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Input
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
            <Input
              placeholder="Type (e.g., Internship)"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filtered.map((job) => (
            <Card key={job.id} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-gray-400">{job.company} • {job.location}</p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">{job.match}% match</Badge>
                </div>
                <p className="text-gray-300">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button>Apply</Button>
                  <Button variant="outline" className="border-gray-700">Save</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
