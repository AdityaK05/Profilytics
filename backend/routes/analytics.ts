import express from 'express'
import { PrismaClient } from '@prisma/client'
import { query, validationResult } from 'express-validator'
import { catchAsync, createError } from '../middleware/errorHandler'
import { authMiddleware, requireEmployerProfile, restrictTo } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// @desc    Get dashboard analytics for employers
// @route   GET /api/analytics/employer/dashboard
// @access  Private (Employers only)
router.get('/employer/dashboard', authMiddleware, requireEmployerProfile, catchAsync(async (req, res) => {
  const employerId = req.user.employerProfile.id
  const { period = '30' } = req.query
  
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - parseInt(period as string))

  const [
    totalJobs,
    activeJobs,
    totalApplications,
    newApplications,
    interviewsScheduled,
    hiredCandidates,
    topPerformingJobs,
    applicationsByStatus,
    applicationTrends
  ] = await Promise.all([
    // Total jobs posted
    prisma.job.count({
      where: { employerId }
    }),
    
    // Currently active jobs
    prisma.job.count({
      where: { employerId, status: 'ACTIVE' }
    }),
    
    // Total applications received
    prisma.application.count({
      where: { employerId }
    }),
    
    // New applications in period
    prisma.application.count({
      where: { 
        employerId,
        createdAt: { gte: fromDate }
      }
    }),
    
    // Interviews scheduled
    prisma.application.count({
      where: { 
        employerId,
        status: 'INTERVIEW_SCHEDULED'
      }
    }),
    
    // Hired candidates
    prisma.application.count({
      where: { 
        employerId,
        status: 'ACCEPTED'
      }
    }),
    
    // Top performing jobs
    prisma.job.findMany({
      where: { employerId },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: {
        applications: {
          _count: 'desc'
        }
      },
      take: 5
    }),
    
    // Applications by status
    prisma.application.groupBy({
      by: ['status'],
      where: { employerId },
      _count: true
    }),
    
    // Application trends over time
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM applications 
      WHERE "employerId" = ${employerId}
        AND "createdAt" >= ${fromDate}
      GROUP BY date
      ORDER BY date
    `
  ])

  // Calculate metrics
  const conversionRate = totalApplications > 0 ? (hiredCandidates / totalApplications) * 100 : 0
  const responseRate = totalApplications > 0 ? ((interviewsScheduled + hiredCandidates) / totalApplications) * 100 : 0

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalJobs,
        activeJobs,
        totalApplications,
        newApplications,
        interviewsScheduled,
        hiredCandidates,
        conversionRate: Math.round(conversionRate * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100
      },
      topPerformingJobs,
      applicationsByStatus,
      applicationTrends,
      period: `${period} days`
    }
  })
}))

// @desc    Get job performance analytics
// @route   GET /api/analytics/jobs/:jobId
// @access  Private (Job owner only)
router.get('/jobs/:jobId', authMiddleware, requireEmployerProfile, catchAsync(async (req, res, next) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.jobId },
    include: { employer: true }
  })

  if (!job) {
    return next(createError('Job not found', 404))
  }

  if (job.employerId !== req.user.employerProfile.id) {
    return next(createError('You can only view analytics for your own jobs', 403))
  }

  const [
    totalApplications,
    applicationsByStatus,
    topSkills,
    universityDistribution,
    applicationTrends,
    averageMatchScore,
    viewsAnalytics
  ] = await Promise.all([
    // Total applications
    prisma.application.count({
      where: { jobId: req.params.jobId }
    }),
    
    // Applications by status
    prisma.application.groupBy({
      by: ['status'],
      where: { jobId: req.params.jobId },
      _count: true
    }),
    
    // Top skills of applicants
    prisma.$queryRaw`
      SELECT s.name, COUNT(*) as count
      FROM applications a
      JOIN student_profiles sp ON a."studentId" = sp.id
      JOIN skills s ON sp.id = s."studentId"
      WHERE a."jobId" = ${req.params.jobId}
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 10
    `,
    
    // University distribution
    prisma.$queryRaw`
      SELECT sp.university, COUNT(*) as count
      FROM applications a
      JOIN student_profiles sp ON a."studentId" = sp.id
      WHERE a."jobId" = ${req.params.jobId}
        AND sp.university IS NOT NULL
      GROUP BY sp.university
      ORDER BY count DESC
      LIMIT 10
    `,
    
    // Application trends
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM applications
      WHERE "jobId" = ${req.params.jobId}
      GROUP BY date
      ORDER BY date
    `,
    
    // Average match score
    prisma.application.aggregate({
      where: { 
        jobId: req.params.jobId,
        matchScore: { not: null }
      },
      _avg: { matchScore: true }
    }),
    
    // Views analytics
    prisma.jobAnalytics.groupBy({
      by: ['event'],
      where: { jobId: req.params.jobId },
      _count: true
    })
  ])

  res.status(200).json({
    status: 'success',
    data: {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        createdAt: job.createdAt
      },
      metrics: {
        totalApplications,
        averageMatchScore: averageMatchScore._avg.matchScore || 0,
        applicationsByStatus,
        topSkills,
        universityDistribution,
        applicationTrends,
        viewsAnalytics
      }
    }
  })
}))

// @desc    Get student analytics
// @route   GET /api/analytics/student/dashboard
// @access  Private (Students only)
router.get('/student/dashboard', authMiddleware, restrictTo('STUDENT'), catchAsync(async (req, res, next) => {
  if (!req.user.studentProfile) {
    return next(createError('Student profile required', 400))
  }

  const studentId = req.user.studentProfile.id
  const { period = '30' } = req.query
  
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - parseInt(period as string))

  const [
    totalApplications,
    recentApplications,
    applicationsByStatus,
    averageMatchScore,
    profileViews,
    savedJobs,
    interviewsScheduled,
    applicationTrends,
    topMatchingSkills
  ] = await Promise.all([
    // Total applications
    prisma.application.count({
      where: { studentId }
    }),
    
    // Recent applications
    prisma.application.count({
      where: { 
        studentId,
        createdAt: { gte: fromDate }
      }
    }),
    
    // Applications by status
    prisma.application.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true
    }),
    
    // Average match score
    prisma.application.aggregate({
      where: { 
        studentId,
        matchScore: { not: null }
      },
      _avg: { matchScore: true }
    }),
    
    // Profile views
    prisma.userAnalytics.count({
      where: {
        userId: req.user.id,
        event: 'profile_view',
        createdAt: { gte: fromDate }
      }
    }),
    
    // Saved jobs
    prisma.savedJob.count({
      where: { studentId }
    }),
    
    // Interviews scheduled
    prisma.application.count({
      where: { 
        studentId,
        status: 'INTERVIEW_SCHEDULED'
      }
    }),
    
    // Application trends
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM applications
      WHERE "studentId" = ${studentId}
        AND "createdAt" >= ${fromDate}
      GROUP BY date
      ORDER BY date
    `,
    
    // Top skills that got matches
    prisma.$queryRaw`
      SELECT unnest(j."requiredSkills") as skill, AVG(a."matchScore") as avg_score
      FROM applications a
      JOIN jobs j ON a."jobId" = j.id
      WHERE a."studentId" = ${studentId}
        AND a."matchScore" IS NOT NULL
      GROUP BY skill
      ORDER BY avg_score DESC
      LIMIT 10
    `
  ])

  // Calculate success rate
  const acceptedApplications = applicationsByStatus.find(s => s.status === 'ACCEPTED')?._count || 0
  const successRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalApplications,
        recentApplications,
        profileViews,
        savedJobs,
        interviewsScheduled,
        averageMatchScore: Math.round((averageMatchScore._avg.matchScore || 0) * 100) / 100,
        successRate: Math.round(successRate * 100) / 100
      },
      applicationsByStatus,
      applicationTrends,
      topMatchingSkills,
      period: `${period} days`
    }
  })
}))

// @desc    Track user event (for analytics)
// @route   POST /api/analytics/track
// @access  Private
router.post('/track', authMiddleware, catchAsync(async (req, res) => {
  const { event, metadata = {} } = req.body

  if (!event) {
    return res.status(400).json({
      status: 'fail',
      message: 'Event name is required'
    })
  }

  // Track the event
  await prisma.userAnalytics.create({
    data: {
      userId: req.user.id,
      event,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  }).catch(() => {}) // Fail silently for analytics

  res.status(200).json({
    status: 'success',
    message: 'Event tracked successfully'
  })
}))

// @desc    Get platform-wide analytics (Admin only)
// @route   GET /api/analytics/platform
// @access  Private (Admin only)
router.get('/platform', authMiddleware, restrictTo('ADMIN'), [
  query('period').optional().isInt({ min: 1, max: 365 })
], catchAsync(async (req, res) => {
  const { period = '30' } = req.query
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - parseInt(period as string))

  const [
    totalUsers,
    newUsers,
    totalJobs,
    newJobs,
    totalApplications,
    newApplications,
    usersByRole,
    topCompanies,
    topUniversities,
    platformActivity
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // New users in period
    prisma.user.count({
      where: { createdAt: { gte: fromDate } }
    }),
    
    // Total jobs
    prisma.job.count(),
    
    // New jobs in period
    prisma.job.count({
      where: { createdAt: { gte: fromDate } }
    }),
    
    // Total applications
    prisma.application.count(),
    
    // New applications in period
    prisma.application.count({
      where: { createdAt: { gte: fromDate } }
    }),
    
    // Users by role
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    }),
    
    // Top companies by job postings
    prisma.$queryRaw`
      SELECT ep."companyName", COUNT(j.id) as job_count
      FROM employer_profiles ep
      LEFT JOIN jobs j ON ep.id = j."employerId"
      GROUP BY ep."companyName"
      ORDER BY job_count DESC
      LIMIT 10
    `,
    
    // Top universities by student count
    prisma.$queryRaw`
      SELECT university, COUNT(*) as student_count
      FROM student_profiles
      WHERE university IS NOT NULL
      GROUP BY university
      ORDER BY student_count DESC
      LIMIT 10
    `,
    
    // Platform activity trends
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        'users' as type,
        COUNT(*) as count
      FROM users
      WHERE "createdAt" >= ${fromDate}
      GROUP BY date
      
      UNION ALL
      
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        'jobs' as type,
        COUNT(*) as count
      FROM jobs
      WHERE "createdAt" >= ${fromDate}
      GROUP BY date
      
      UNION ALL
      
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        'applications' as type,
        COUNT(*) as count
      FROM applications
      WHERE "createdAt" >= ${fromDate}
      GROUP BY date
      
      ORDER BY date, type
    `
  ])

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalUsers,
        newUsers,
        totalJobs,
        newJobs,
        totalApplications,
        newApplications
      },
      usersByRole,
      topCompanies,
      topUniversities,
      platformActivity,
      period: `${period} days`
    }
  })
}))

export default router 