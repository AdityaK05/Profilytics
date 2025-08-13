import express from 'express'
import { PrismaClient } from '@prisma/client'
import { body, query, validationResult } from 'express-validator'
import { catchAsync, createError } from '../middleware/errorHandler'
import { authMiddleware, requireStudentProfile, requireEmployerProfile, restrictTo } from '../middleware/auth'
import logger from '../utils/logger'

const router = express.Router()
const prisma = new PrismaClient()

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Students only)
router.post('/', authMiddleware, requireStudentProfile, [
  body('jobId').isString().notEmpty().withMessage('Job ID is required'),
  body('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('Cover letter cannot exceed 2000 characters'),
  body('resumeUrl').optional().isURL().withMessage('Resume URL must be valid'),
  body('portfolioUrl').optional().isURL().withMessage('Portfolio URL must be valid'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { jobId, coverLetter, resumeUrl, portfolioUrl } = req.body

  // Check if job exists and is active
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { employer: true }
  })

  if (!job) {
    return next(createError('Job not found', 404))
  }

  if (job.status !== 'ACTIVE') {
    return next(createError('This job is no longer accepting applications', 400))
  }

  // Check if deadline has passed
  if (job.deadline && job.deadline < new Date()) {
    return next(createError('Application deadline has passed', 400))
  }

  // Check if user already applied
  const existingApplication = await prisma.application.findUnique({
    where: {
      studentId_jobId: {
        studentId: req.user.studentProfile.id,
        jobId: jobId
      }
    }
  })

  if (existingApplication) {
    return next(createError('You have already applied for this job', 400))
  }

  // Calculate AI match score
  const matchScore = calculateApplicationMatchScore(job, req.user.studentProfile)
  const matchReasons = generateMatchReasons(job, req.user.studentProfile)

  // Create application
  const application = await prisma.application.create({
    data: {
      studentId: req.user.studentProfile.id,
      jobId: jobId,
      employerId: job.employerId,
      coverLetter,
      resumeUrl: resumeUrl || req.user.studentProfile.resumeUrl,
      portfolioUrl: portfolioUrl || req.user.studentProfile.portfolioUrl,
      matchScore,
      matchReasons,
      status: 'PENDING'
    },
    include: {
      job: {
        include: {
          employer: {
            select: { companyName: true }
          }
        }
      },
      student: {
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      }
    }
  })

  // Create notification for employer
  await prisma.notification.create({
    data: {
      userId: job.employer.userId,
      title: 'New Job Application',
      message: `${req.user.firstName} ${req.user.lastName} applied for ${job.title}`,
      type: 'application_received',
      metadata: {
        applicationId: application.id,
        jobId: job.id,
        studentId: req.user.studentProfile.id
      }
    }
  }).catch(() => {}) // Fail silently

  logger.info(`New application: ${req.user.firstName} ${req.user.lastName} applied for ${job.title} at ${job.employer.companyName}`)

  res.status(201).json({
    status: 'success',
    data: {
      application
    }
  })
}))

// AI matching functions
function calculateApplicationMatchScore(job: any, studentProfile: any): number {
  let score = 0

  // Skills match (50% weight)
  if (job.requiredSkills && studentProfile.skills && studentProfile.skills.length > 0) {
    const studentSkills = studentProfile.skills.map((s: any) => s.name.toLowerCase())
    const requiredSkills = job.requiredSkills.map((s: string) => s.toLowerCase())
    const matchingSkills = requiredSkills.filter((skill: string) => 
      studentSkills.some((studentSkill: string) => 
        studentSkill.includes(skill) || skill.includes(studentSkill)
      )
    )
    score += (matchingSkills.length / requiredSkills.length) * 50
  }

  // Experience level match (20% weight)
  if (studentProfile.experiences && studentProfile.experiences.length > 0) {
    score += 20
  }

  // Education match (15% weight)
  if (studentProfile.university && studentProfile.gpa) {
    score += 10
    if (studentProfile.gpa >= 3.5) score += 5
  }

  // GitHub activity (15% weight)
  if (studentProfile.githubContributions > 100) score += 10
  if (studentProfile.publicRepos > 5) score += 5

  return Math.min(Math.round(score), 100)
}

function generateMatchReasons(job: any, studentProfile: any): string[] {
  const reasons: string[] = []

  if (job.requiredSkills && studentProfile.skills) {
    const studentSkills = studentProfile.skills.map((s: any) => s.name.toLowerCase())
    const requiredSkills = job.requiredSkills.map((s: string) => s.toLowerCase())
    const matchingSkills = requiredSkills.filter((skill: string) => 
      studentSkills.some((studentSkill: string) => studentSkill.includes(skill))
    )
    if (matchingSkills.length > 0) {
      reasons.push(`Strong skill match: ${matchingSkills.slice(0, 3).join(', ')}`)
    }
  }

  if (studentProfile.gpa >= 3.5) {
    reasons.push(`High academic performance (GPA: ${studentProfile.gpa})`)
  }

  if (studentProfile.leetcodeRating > 1800) {
    reasons.push(`Strong coding skills (LeetCode: ${studentProfile.leetcodeRating})`)
  }

  if (studentProfile.githubContributions > 200) {
    reasons.push(`Active open source contributor`)
  }

  return reasons
}

// @desc    Get user's applications
// @route   GET /api/applications
// @access  Private (Students only)
router.get('/', authMiddleware, requireStudentProfile, [
  query('status').optional().isIn(['PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { status, page = 1, limit = 20 } = req.query
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

  const where: any = {
    studentId: req.user.studentProfile.id,
    ...(status && { status: status as string })
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: {
          include: {
            employer: {
              select: {
                companyName: true,
                logo: true,
                industry: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.application.count({ where })
  ])

  res.status(200).json({
    status: 'success',
    data: {
      applications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  })
}))

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Application owner or job employer)
router.get('/:id', authMiddleware, catchAsync(async (req, res, next) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: {
        include: {
          employer: {
            select: {
              companyName: true,
              logo: true,
              industry: true,
              userId: true
            }
          }
        }
      },
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          skills: true,
          experiences: true,
          projects: true,
          certifications: true,
          education: true
        }
      }
    }
  })

  if (!application) {
    return next(createError('Application not found', 404))
  }

  // Check authorization
  const isStudent = req.user.role === 'STUDENT' && req.user.studentProfile?.id === application.studentId
  const isEmployer = req.user.role === 'EMPLOYER' && req.user.employerProfile?.id === application.employerId
  
  if (!isStudent && !isEmployer) {
    return next(createError('You can only view your own applications or applications to your jobs', 403))
  }

  // Mark as viewed by employer
  if (isEmployer && !application.viewedByEmployer) {
    await prisma.application.update({
      where: { id: req.params.id },
      data: {
        viewedByEmployer: true,
        viewedAt: new Date()
      }
    }).catch(() => {}) // Fail silently
  }

  res.status(200).json({
    status: 'success',
    data: {
      application
    }
  })
}))

// @desc    Update application status (Employers only)
// @route   PATCH /api/applications/:id/status
// @access  Private (Job employers only)
router.patch('/:id/status', authMiddleware, requireEmployerProfile, [
  body('status').isIn(['UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED']).withMessage('Invalid status'),
  body('feedback').optional().trim().isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters'),
  body('interviewDate').optional().isISO8601().withMessage('Interview date must be valid'),
  body('interviewType').optional().isIn(['phone', 'video', 'in-person']).withMessage('Invalid interview type'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: { include: { employer: true } },
      student: { include: { user: true } }
    }
  })

  if (!application) {
    return next(createError('Application not found', 404))
  }

  if (application.employerId !== req.user.employerProfile.id) {
    return next(createError('You can only update applications for your jobs', 403))
  }

  const { status, feedback, interviewDate, interviewType, interviewNotes } = req.body

  const updatedApplication = await prisma.application.update({
    where: { id: req.params.id },
    data: {
      status,
      feedback,
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
      interviewType,
      interviewNotes,
      respondedAt: new Date()
    },
    include: {
      job: {
        include: {
          employer: {
            select: { companyName: true }
          }
        }
      }
    }
  })

  // Create notification for student
  const notificationMessages = {
    'UNDER_REVIEW': 'Your application is now under review',
    'INTERVIEW_SCHEDULED': 'Interview scheduled for your application',
    'REJECTED': 'Application status updated',
    'ACCEPTED': 'Congratulations! Your application has been accepted'
  }

  await prisma.notification.create({
    data: {
      userId: application.student.user.id,
      title: 'Application Status Update',
      message: `${notificationMessages[status as keyof typeof notificationMessages]} for ${application.job.title} at ${application.job.employer.companyName}`,
      type: 'application_update',
      metadata: {
        applicationId: application.id,
        jobId: application.jobId,
        status
      }
    }
  }).catch(() => {}) // Fail silently

  logger.info(`Application status updated: ${application.id} to ${status} by ${req.user.employerProfile.companyName}`)

  res.status(200).json({
    status: 'success',
    data: {
      application: updatedApplication
    }
  })
}))

// @desc    Withdraw application (Students only)
// @route   PATCH /api/applications/:id/withdraw
// @access  Private (Application owner only)
router.patch('/:id/withdraw', authMiddleware, requireStudentProfile, catchAsync(async (req, res, next) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: { include: { employer: true } }
    }
  })

  if (!application) {
    return next(createError('Application not found', 404))
  }

  if (application.studentId !== req.user.studentProfile.id) {
    return next(createError('You can only withdraw your own applications', 403))
  }

  if (application.status === 'WITHDRAWN') {
    return next(createError('Application is already withdrawn', 400))
  }

  if (application.status === 'ACCEPTED') {
    return next(createError('Cannot withdraw an accepted application', 400))
  }

  const updatedApplication = await prisma.application.update({
    where: { id: req.params.id },
    data: {
      status: 'WITHDRAWN',
      respondedAt: new Date()
    }
  })

  logger.info(`Application withdrawn: ${application.id} by ${req.user.firstName} ${req.user.lastName}`)

  res.status(200).json({
    status: 'success',
    data: {
      application: updatedApplication
    }
  })
}))

// @desc    Get applications for employer dashboard
// @route   GET /api/applications/employer/dashboard
// @access  Private (Employers only)
router.get('/employer/dashboard', authMiddleware, requireEmployerProfile, [
  query('status').optional().isIn(['PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN']),
  query('jobId').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { status, jobId, page = 1, limit = 20 } = req.query
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

  const where: any = {
    employerId: req.user.employerProfile.id,
    ...(status && { status: status as string }),
    ...(jobId && { jobId: jobId as string })
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            title: true,
            type: true
          }
        },
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            },
            skills: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.application.count({ where })
  ])

  res.status(200).json({
    status: 'success',
    data: {
      applications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  })
}))

// @desc    Get application analytics for employer
// @route   GET /api/applications/employer/analytics
// @access  Private (Employers only)
router.get('/employer/analytics', authMiddleware, requireEmployerProfile, catchAsync(async (req, res) => {
  const employerId = req.user.employerProfile.id

  // Get application statistics
  const [
    totalApplications,
    pendingApplications,
    interviewsScheduled,
    acceptedApplications,
    applicationsByJob,
    applicationsByMonth
  ] = await Promise.all([
    prisma.application.count({ where: { employerId } }),
    prisma.application.count({ where: { employerId, status: 'PENDING' } }),
    prisma.application.count({ where: { employerId, status: 'INTERVIEW_SCHEDULED' } }),
    prisma.application.count({ where: { employerId, status: 'ACCEPTED' } }),
    prisma.application.groupBy({
      by: ['jobId'],
      where: { employerId },
      _count: true,
      orderBy: { _count: { jobId: 'desc' } },
      take: 10
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM applications 
      WHERE "employerId" = ${employerId}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `
  ])

  // Calculate conversion rate
  const conversionRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalApplications,
        pendingApplications,
        interviewsScheduled,
        acceptedApplications,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      applicationsByJob,
      applicationsByMonth
    }
  })
}))

export default router 