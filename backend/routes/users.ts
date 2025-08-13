import express from 'express'
import { PrismaClient } from '@prisma/client'
import { body, param, validationResult } from 'express-validator'
import { catchAsync, createError } from '../middleware/errorHandler'
import { authMiddleware, requireStudentProfile, restrictTo } from '../middleware/auth'
import logger from '../utils/logger'

const router = express.Router()
const prisma = new PrismaClient()

// @desc    Get user profile with all details
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authMiddleware, catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      studentProfile: {
        include: {
          skills: true,
          experiences: true,
          projects: true,
          certifications: true,
          education: true,
          applications: {
            include: {
              job: {
                include: {
                  employer: {
                    select: { companyName: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          savedJobs: {
            include: {
              job: {
                include: {
                  employer: {
                    select: { companyName: true, logo: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      },
      employerProfile: {
        include: {
          jobs: {
            include: {
              _count: {
                select: { applications: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    }
  })

  if (!user) {
    return next(createError('User not found', 404))
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  })
}))

// Skills Management Routes

// @desc    Add skill to student profile
// @route   POST /api/users/skills
// @access  Private (Students only)
router.post('/skills', authMiddleware, requireStudentProfile, [
  body('name').trim().isLength({ min: 1 }).withMessage('Skill name is required'),
  body('level').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).withMessage('Invalid skill level'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { name, level } = req.body

  // Check if skill already exists
  const existingSkill = await prisma.skill.findFirst({
    where: {
      studentId: req.user.studentProfile.id,
      name: { equals: name, mode: 'insensitive' }
    }
  })

  if (existingSkill) {
    return next(createError('Skill already exists', 400))
  }

  const skill = await prisma.skill.create({
    data: {
      name,
      level,
      studentId: req.user.studentProfile.id
    }
  })

  res.status(201).json({
    status: 'success',
    data: { skill }
  })
}))

// @desc    Update skill
// @route   PATCH /api/users/skills/:id
// @access  Private (Skill owner only)
router.patch('/skills/:id', authMiddleware, requireStudentProfile, [
  param('id').isString().notEmpty(),
  body('level').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const skill = await prisma.skill.findUnique({
    where: { id: req.params.id }
  })

  if (!skill) {
    return next(createError('Skill not found', 404))
  }

  if (skill.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only update your own skills', 403))
  }

  const updatedSkill = await prisma.skill.update({
    where: { id: req.params.id },
    data: { level: req.body.level }
  })

  res.status(200).json({
    status: 'success',
    data: { skill: updatedSkill }
  })
}))

// @desc    Delete skill
// @route   DELETE /api/users/skills/:id
// @access  Private (Skill owner only)
router.delete('/skills/:id', authMiddleware, requireStudentProfile, catchAsync(async (req, res, next) => {
  const skill = await prisma.skill.findUnique({
    where: { id: req.params.id }
  })

  if (!skill) {
    return next(createError('Skill not found', 404))
  }

  if (skill.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only delete your own skills', 403))
  }

  await prisma.skill.delete({
    where: { id: req.params.id }
  })

  res.status(204).json({
    status: 'success',
    data: null
  })
}))

// Experience Management Routes

// @desc    Add experience
// @route   POST /api/users/experiences
// @access  Private (Students only)
router.post('/experiences', authMiddleware, requireStudentProfile, [
  body('title').trim().isLength({ min: 1 }).withMessage('Job title is required'),
  body('company').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('End date must be valid'),
  body('current').optional().isBoolean(),
  body('skills').optional().isArray(),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { title, company, location, startDate, endDate, current, description, skills } = req.body

  // Validate dates
  if (!current && !endDate) {
    return next(createError('End date is required if not current position', 400))
  }

  if (endDate && new Date(startDate) >= new Date(endDate)) {
    return next(createError('Start date must be before end date', 400))
  }

  const experience = await prisma.experience.create({
    data: {
      title,
      company,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      current: !!current,
      description,
      skills: skills || [],
      studentId: req.user.studentProfile.id
    }
  })

  res.status(201).json({
    status: 'success',
    data: { experience }
  })
}))

// @desc    Update experience
// @route   PATCH /api/users/experiences/:id
// @access  Private (Experience owner only)
router.patch('/experiences/:id', authMiddleware, requireStudentProfile, [
  param('id').isString().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('current').optional().isBoolean(),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const experience = await prisma.experience.findUnique({
    where: { id: req.params.id }
  })

  if (!experience) {
    return next(createError('Experience not found', 404))
  }

  if (experience.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only update your own experiences', 403))
  }

  const allowedFields = ['title', 'company', 'location', 'startDate', 'endDate', 'current', 'description', 'skills']
  const updateData: any = {}

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'startDate' || field === 'endDate') {
        updateData[field] = req.body[field] ? new Date(req.body[field]) : null
      } else {
        updateData[field] = req.body[field]
      }
    }
  })

  const updatedExperience = await prisma.experience.update({
    where: { id: req.params.id },
    data: updateData
  })

  res.status(200).json({
    status: 'success',
    data: { experience: updatedExperience }
  })
}))

// @desc    Delete experience
// @route   DELETE /api/users/experiences/:id
// @access  Private (Experience owner only)
router.delete('/experiences/:id', authMiddleware, requireStudentProfile, catchAsync(async (req, res, next) => {
  const experience = await prisma.experience.findUnique({
    where: { id: req.params.id }
  })

  if (!experience) {
    return next(createError('Experience not found', 404))
  }

  if (experience.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only delete your own experiences', 403))
  }

  await prisma.experience.delete({
    where: { id: req.params.id }
  })

  res.status(204).json({
    status: 'success',
    data: null
  })
}))

// Project Management Routes

// @desc    Add project
// @route   POST /api/users/projects
// @access  Private (Students only)
router.post('/projects', authMiddleware, requireStudentProfile, [
  body('title').trim().isLength({ min: 1 }).withMessage('Project title is required'),
  body('technologies').isArray({ min: 1 }).withMessage('At least one technology is required'),
  body('githubUrl').optional().isURL().withMessage('GitHub URL must be valid'),
  body('liveUrl').optional().isURL().withMessage('Live URL must be valid'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { title, description, technologies, githubUrl, liveUrl, imageUrl, featured } = req.body

  const project = await prisma.project.create({
    data: {
      title,
      description,
      technologies,
      githubUrl,
      liveUrl,
      imageUrl,
      featured: !!featured,
      studentId: req.user.studentProfile.id
    }
  })

  res.status(201).json({
    status: 'success',
    data: { project }
  })
}))

// @desc    Update project
// @route   PATCH /api/users/projects/:id
// @access  Private (Project owner only)
router.patch('/projects/:id', authMiddleware, requireStudentProfile, catchAsync(async (req, res, next) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id }
  })

  if (!project) {
    return next(createError('Project not found', 404))
  }

  if (project.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only update your own projects', 403))
  }

  const allowedFields = ['title', 'description', 'technologies', 'githubUrl', 'liveUrl', 'imageUrl', 'featured']
  const updateData: any = {}

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field]
    }
  })

  const updatedProject = await prisma.project.update({
    where: { id: req.params.id },
    data: updateData
  })

  res.status(200).json({
    status: 'success',
    data: { project: updatedProject }
  })
}))

// @desc    Delete project
// @route   DELETE /api/users/projects/:id
// @access  Private (Project owner only)
router.delete('/projects/:id', authMiddleware, requireStudentProfile, catchAsync(async (req, res, next) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id }
  })

  if (!project) {
    return next(createError('Project not found', 404))
  }

  if (project.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only delete your own projects', 403))
  }

  await prisma.project.delete({
    where: { id: req.params.id }
  })

  res.status(204).json({
    status: 'success',
    data: null
  })
}))

// Saved Jobs Management

// @desc    Save a job
// @route   POST /api/users/saved-jobs
// @access  Private (Students only)
router.post('/saved-jobs', authMiddleware, requireStudentProfile, [
  body('jobId').isString().notEmpty().withMessage('Job ID is required'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { jobId } = req.body

  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id: jobId }
  })

  if (!job) {
    return next(createError('Job not found', 404))
  }

  // Check if already saved
  const existingSavedJob = await prisma.savedJob.findUnique({
    where: {
      studentId_jobId: {
        studentId: req.user.studentProfile.id,
        jobId: jobId
      }
    }
  })

  if (existingSavedJob) {
    return next(createError('Job already saved', 400))
  }

  const savedJob = await prisma.savedJob.create({
    data: {
      studentId: req.user.studentProfile.id,
      jobId: jobId
    },
    include: {
      job: {
        include: {
          employer: {
            select: { companyName: true, logo: true }
          }
        }
      }
    }
  })

  res.status(201).json({
    status: 'success',
    data: { savedJob }
  })
}))

// @desc    Get saved jobs
// @route   GET /api/users/saved-jobs
// @access  Private (Students only)
router.get('/saved-jobs', authMiddleware, requireStudentProfile, catchAsync(async (req, res) => {
  const savedJobs = await prisma.savedJob.findMany({
    where: { studentId: req.user.studentProfile.id },
    include: {
      job: {
        include: {
          employer: {
            select: { companyName: true, logo: true, industry: true }
          },
          _count: {
            select: { applications: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.status(200).json({
    status: 'success',
    data: { savedJobs }
  })
}))

// @desc    Remove saved job
// @route   DELETE /api/users/saved-jobs/:jobId
// @access  Private (Students only)
router.delete('/saved-jobs/:jobId', authMiddleware, requireStudentProfile, catchAsync(async (req, res, next) => {
  const savedJob = await prisma.savedJob.findUnique({
    where: {
      studentId_jobId: {
        studentId: req.user.studentProfile.id,
        jobId: req.params.jobId
      }
    }
  })

  if (!savedJob) {
    return next(createError('Saved job not found', 404))
  }

  await prisma.savedJob.delete({
    where: {
      studentId_jobId: {
        studentId: req.user.studentProfile.id,
        jobId: req.params.jobId
      }
    }
  })

  res.status(204).json({
    status: 'success',
    data: null
  })
}))

// User Preferences

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
router.get('/preferences', authMiddleware, catchAsync(async (req, res) => {
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId: req.user.id }
  })

  if (!preferences) {
    // Create default preferences
    preferences = await prisma.userPreferences.create({
      data: { userId: req.user.id }
    })
  }

  res.status(200).json({
    status: 'success',
    data: { preferences }
  })
}))

// @desc    Update user preferences
// @route   PATCH /api/users/preferences
// @access  Private
router.patch('/preferences', authMiddleware, catchAsync(async (req, res) => {
  const allowedFields = [
    'emailNotifications', 'pushNotifications', 'jobAlerts', 'applicationUpdates',
    'aiSuggestions', 'personalizedContent', 'dataCollection',
    'profileVisibility', 'contactPermissions'
  ]

  const updateData: any = {}
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field]
    }
  })

  const preferences = await prisma.userPreferences.upsert({
    where: { userId: req.user.id },
    update: updateData,
    create: {
      userId: req.user.id,
      ...updateData
    }
  })

  res.status(200).json({
    status: 'success',
    data: { preferences }
  })
}))

// Analytics and Activity

// @desc    Get user activity summary
// @route   GET /api/users/activity
// @access  Private
router.get('/activity', authMiddleware, catchAsync(async (req, res) => {
  const { days = 30 } = req.query
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - parseInt(days as string))

  const [
    totalApplications,
    recentApplications,
    profileViews,
    savedJobs,
    messageCount
  ] = await Promise.all([
    // Total applications
    prisma.application.count({
      where: {
        student: { userId: req.user.id }
      }
    }),
    
    // Recent applications
    prisma.application.count({
      where: {
        student: { userId: req.user.id },
        createdAt: { gte: fromDate }
      }
    }),
    
    // Profile views (from analytics)
    prisma.userAnalytics.count({
      where: {
        userId: req.user.id,
        event: 'profile_view',
        createdAt: { gte: fromDate }
      }
    }),
    
    // Saved jobs count
    prisma.savedJob.count({
      where: {
        student: { userId: req.user.id }
      }
    }),
    
    // Chat messages count
    prisma.message.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: fromDate }
      }
    })
  ])

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalApplications,
        recentApplications,
        profileViews,
        savedJobs,
        messageCount
      },
      period: `${days} days`
    }
  })
}))

export default router 