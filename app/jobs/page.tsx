"use client"

import { useState } from "react"

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
      company: "Microsoft",\
      location: "
