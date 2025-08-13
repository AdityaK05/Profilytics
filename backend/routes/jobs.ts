import express from 'express'
import { PrismaClient } from '@prisma/client'
import { body, query, validationResult } from 'express-validator'
import { catchAsync, createError } from '../middleware/errorHandler'
import { authMiddleware, optionalAuth, requireEmployerProfile, restrictTo } from '../middleware/auth'
import logger from '../utils/logger'

const router = express.Router()
const prisma = new PrismaClient()

// @desc    Get all jobs with filtering and search
// @route   GET /api/jobs
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty'),
  query('location').optional().trim(),
  query('remote').optional().isBoolean(),
  query('type').optional().isIn(['internship', 'full-time', 'part-time', 'contract']),
  query('salaryMin').optional().isInt({ min: 0 }),
  query('salaryMax').optional().isInt({ min: 0 }),
  query('skills').optional().isArray(),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const {
    page = 1,
    limit = 20,
    search,
    location,
    remote,
    type,
    salaryMin,
    salaryMax,
    skills,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

  // Build where clause
  const where: any = {
    status: 'ACTIVE',
    ...(search && {
      OR: [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { employer: { companyName: { contains: search as string, mode: 'insensitive' } } }
      ]
    }),
    ...(location && { location: { contains: location as string, mode: 'insensitive' } }),
    ...(remote !== undefined && { remote: remote === 'true' }),
    ...(type && { type: type as string }),
    ...(salaryMin && { salary: { gte: parseInt(salaryMin as string) } }),
    ...(salaryMax && { salary: { lte: parseInt(salaryMax as string) } }),
    ...(skills && Array.isArray(skills) && {
      requiredSkills: {
        hasSome: skills as string[]
      }
    })
  }

  // Execute query with pagination
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        employer: {
          select: {
            companyName: true,
            logo: true,
            industry: true,
            verified: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.job.count({ where })
  ])

  // If user is authenticated and is a student, calculate match scores
  let jobsWithMatchScores = jobs
  if (req.user?.role === 'STUDENT' && req.user.studentProfile) {
    jobsWithMatchScores = jobs.map(job => ({
      ...job,
      matchScore: calculateJobMatchScore(job, req.user.studentProfile)
    }))
  }

  res.status(200).json({
    status: 'success',
    data: {
      jobs: jobsWithMatchScores,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  })
}))

// AI matching algorithm (simplified)
function calculateJobMatchScore(job: any, studentProfile: any): number {
  let score = 0
  const factors: string[] = []

  // Skills match (40% weight)
  if (job.requiredSkills && studentProfile.skills) {
    const studentSkills = studentProfile.skills.map((s: any) => s.name.toLowerCase())
    const requiredSkills = job.requiredSkills.map((s: string) => s.toLowerCase())
    const matchingSkills = requiredSkills.filter(skill => 
      studentSkills.some(studentSkill => studentSkill.includes(skill) || skill.includes(studentSkill))
    )
    const skillsScore = (matchingSkills.length / requiredSkills.length) * 40
    score += skillsScore
    factors.push(`Skills: ${matchingSkills.length}/${requiredSkills.length} matched`)
  }

  // Location preference (20% weight)
  if (studentProfile.preferredLocations && job.location) {
    const locationMatch = studentProfile.preferredLocations.some((loc: string) =>
      job.location.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(job.location.toLowerCase())
    )
    if (locationMatch) {
      score += 20
      factors.push('Location: Preferred location match')
    }
  }

  // Salary expectations (20% weight)
  if (studentProfile.expectedSalary && job.salary) {
    const salaryRatio = job.salary / studentProfile.expectedSalary
    if (salaryRatio >= 0.8 && salaryRatio <= 1.5) {
      score += 20 * Math.min(salaryRatio, 1)
      factors.push(`Salary: ${Math.round(salaryRatio * 100)}% of expectation`)
    }
  }

  // Role preference (20% weight)
  if (studentProfile.preferredRoles && job.title) {
    const roleMatch = studentProfile.preferredRoles.some((role: string) =>
      job.title.toLowerCase().includes(role.toLowerCase()) ||
      role.toLowerCase().includes(job.title.toLowerCase())
    )
    if (roleMatch) {
      score += 20
      factors.push('Role: Preferred role match')
    }
  }

  return Math.min(Math.round(score), 100)
}

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', optionalAuth, catchAsync(async (req, res, next) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      employer: {
        select: {
          companyName: true,
          logo: true,
          industry: true,
          verified: true,
          description: true,
          website: true,
          headquarters: true,
          founded: true
        }
      },
      applications: req.user?.role === 'EMPLOYER' ? {
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              },
              skills: true
            }
          }
        }
      } : false,
      _count: {
        select: {
          applications: true
        }
      }
    }
  })

  if (!job) {
    return next(createError('Job not found', 404))
  }

  // Track job view analytics
  if (req.user) {
    await prisma.jobAnalytics.create({
      data: {
        jobId: job.id,
        event: 'view',
        userId: req.user.id,
        metadata: {
          userAgent: req.get('User-Agent'),
          timestamp: new Date()
        }
      }
    }).catch(() => {}) // Fail silently for analytics
  }

  // Calculate match score if user is a student
  let jobWithMatchScore: any = job
  if (req.user?.role === 'STUDENT' && req.user.studentProfile) {
    jobWithMatchScore = {
      ...job,
      matchScore: calculateJobMatchScore(job, req.user.studentProfile)
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      job: jobWithMatchScore
    }
  })
}))

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employers only)
router.post('/', authMiddleware, requireEmployerProfile, [
  body('title').trim().isLength({ min: 1 }).withMessage('Job title is required'),
  body('description').trim().isLength({ min: 50 }).withMessage('Job description must be at least 50 characters'),
  body('type').isIn(['internship', 'full-time', 'part-time', 'contract']).withMessage('Invalid job type'),
  body('requirements').isArray({ min: 1 }).withMessage('At least one requirement is needed'),
  body('responsibilities').isArray({ min: 1 }).withMessage('At least one responsibility is needed'),
  body('requiredSkills').isArray({ min: 1 }).withMessage('At least one skill is required'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const {
    title,
    description,
    requirements,
    responsibilities,
    benefits = [],
    location,
    remote = false,
    type,
    duration,
    salary,
    salaryMax,
    salaryType = 'monthly',
    requiredSkills,
    experienceLevel,
    educationLevel,
    deadline,
    startDate,
    status = 'DRAFT'
  } = req.body

  const job = await prisma.job.create({
    data: {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      location,
      remote,
      type,
      duration,
      salary,
      salaryMax,
      salaryType,
      requiredSkills,
      experienceLevel,
      educationLevel,
      deadline: deadline ? new Date(deadline) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      status,
      employerId: req.user.employerProfile.id,
      ...(status === 'ACTIVE' && { publishedAt: new Date() })
    },
    include: {
      employer: {
        select: {
          companyName: true,
          logo: true,
          industry: true
        }
      }
    }
  })

  logger.info(`New job created: ${title} by ${req.user.employerProfile.companyName}`)

  res.status(201).json({
    status: 'success',
    data: {
      job
    }
  })
}))

// @desc    Update job
// @route   PATCH /api/jobs/:id
// @access  Private (Job owner only)
router.patch('/:id', authMiddleware, requireEmployerProfile, catchAsync(async (req, res, next) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { employer: true }
  })

  if (!job) {
    return next(createError('Job not found', 404))
  }

  if (job.employerId !== req.user.employerProfile.id) {
    return next(createError('You can only update your own jobs', 403))
  }

  const allowedFields = [
    'title', 'description', 'requirements', 'responsibilities', 'benefits',
    'location', 'remote', 'type', 'duration', 'salary', 'salaryMax', 'salaryType',
    'requiredSkills', 'experienceLevel', 'educationLevel', 'deadline', 'startDate', 'status'
  ]

  const updateData: any = {}
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'deadline' || field === 'startDate') {
        updateData[field] = req.body[field] ? new Date(req.body[field]) : null
      } else {
        updateData[field] = req.body[field]
      }
    }
  })

  // Set publishedAt when status changes to ACTIVE
  if (updateData.status === 'ACTIVE' && job.status !== 'ACTIVE') {
    updateData.publishedAt = new Date()
  }

  const updatedJob = await prisma.job.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      employer: {
        select: {
          companyName: true,
          logo: true,
          industry: true
        }
      }
    }
  })

  res.status(200).json({
    status: 'success',
    data: {
      job: updatedJob
    }
  })
}))

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Job owner only)
router.delete('/:id', authMiddleware, requireEmployerProfile, catchAsync(async (req, res, next) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { employer: true }
  })

  if (!job) {
    return next(createError('Job not found', 404))
  }

  if (job.employerId !== req.user.employerProfile.id) {
    return next(createError('You can only delete your own jobs', 403))
  }

  await prisma.job.delete({
    where: { id: req.params.id }
  })

  logger.info(`Job deleted: ${job.title} by ${req.user.employerProfile.companyName}`)

  res.status(204).json({
    status: 'success',
    data: null
  })
}))

// @desc    Get jobs for employer dashboard
// @route   GET /api/jobs/employer/dashboard
// @access  Private (Employers only)
router.get('/employer/dashboard', authMiddleware, requireEmployerProfile, catchAsync(async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { employerId: req.user.employerProfile.id },
    include: {
      _count: {
        select: {
          applications: true
        }
      },
      applications: {
        where: {
          status: 'PENDING'
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  res.status(200).json({
    status: 'success',
    data: {
      jobs
    }
  })
}))

// @desc    Get AI-powered job recommendations for student
// @route   GET /api/jobs/recommendations
// @access  Private (Students only)
router.get('/recommendations', authMiddleware, restrictTo('STUDENT'), catchAsync(async (req, res, next) => {
  if (!req.user.studentProfile) {
    return next(createError('Complete your profile to get recommendations', 400))
  }

  // Get active jobs
  const jobs = await prisma.job.findMany({
    where: { status: 'ACTIVE' },
    include: {
      employer: {
        select: {
          companyName: true,
          logo: true,
          industry: true,
          verified: true
        }
      },
      _count: {
        select: {
          applications: true
        }
      }
    },
    take: 50 // Get more jobs to filter from
  })

  // Calculate match scores and sort
  const jobsWithScores = jobs
    .map(job => ({
      ...job,
      matchScore: calculateJobMatchScore(job, req.user.studentProfile)
    }))
    .filter(job => job.matchScore > 30) // Only show jobs with >30% match
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20) // Return top 20 recommendations

  res.status(200).json({
    status: 'success',
    data: {
      recommendations: jobsWithScores
    }
  })
}))

export default router 