"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/employer/dashboard', auth_1.authMiddleware, auth_1.requireEmployerProfile, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const employerId = req.user.employerProfile.id;
    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));
    const [totalJobs, activeJobs, totalApplications, newApplications, interviewsScheduled, hiredCandidates, topPerformingJobs, applicationsByStatus, applicationTrends] = await Promise.all([
        prisma.job.count({
            where: { employerId }
        }),
        prisma.job.count({
            where: { employerId, status: 'ACTIVE' }
        }),
        prisma.application.count({
            where: { employerId }
        }),
        prisma.application.count({
            where: {
                employerId,
                createdAt: { gte: fromDate }
            }
        }),
        prisma.application.count({
            where: {
                employerId,
                status: 'INTERVIEW_SCHEDULED'
            }
        }),
        prisma.application.count({
            where: {
                employerId,
                status: 'ACCEPTED'
            }
        }),
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
        prisma.application.groupBy({
            by: ['status'],
            where: { employerId },
            _count: true
        }),
        prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM applications 
      WHERE "employerId" = ${employerId}
        AND "createdAt" >= ${fromDate}
      GROUP BY date
      ORDER BY date
    `
    ]);
    const conversionRate = totalApplications > 0 ? (hiredCandidates / totalApplications) * 100 : 0;
    const responseRate = totalApplications > 0 ? ((interviewsScheduled + hiredCandidates) / totalApplications) * 100 : 0;
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
    });
}));
router.get('/jobs/:jobId', auth_1.authMiddleware, auth_1.requireEmployerProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.jobId },
        include: { employer: true }
    });
    if (!job) {
        return next((0, errorHandler_1.createError)('Job not found', 404));
    }
    if (job.employerId !== req.user.employerProfile.id) {
        return next((0, errorHandler_1.createError)('You can only view analytics for your own jobs', 403));
    }
    const [totalApplications, applicationsByStatus, topSkills, universityDistribution, applicationTrends, averageMatchScore, viewsAnalytics] = await Promise.all([
        prisma.application.count({
            where: { jobId: req.params.jobId }
        }),
        prisma.application.groupBy({
            by: ['status'],
            where: { jobId: req.params.jobId },
            _count: true
        }),
        prisma.$queryRaw `
      SELECT s.name, COUNT(*) as count
      FROM applications a
      JOIN student_profiles sp ON a."studentId" = sp.id
      JOIN skills s ON sp.id = s."studentId"
      WHERE a."jobId" = ${req.params.jobId}
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 10
    `,
        prisma.$queryRaw `
      SELECT sp.university, COUNT(*) as count
      FROM applications a
      JOIN student_profiles sp ON a."studentId" = sp.id
      WHERE a."jobId" = ${req.params.jobId}
        AND sp.university IS NOT NULL
      GROUP BY sp.university
      ORDER BY count DESC
      LIMIT 10
    `,
        prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM applications
      WHERE "jobId" = ${req.params.jobId}
      GROUP BY date
      ORDER BY date
    `,
        prisma.application.aggregate({
            where: {
                jobId: req.params.jobId,
                matchScore: { not: null }
            },
            _avg: { matchScore: true }
        }),
        prisma.jobAnalytics.groupBy({
            by: ['event'],
            where: { jobId: req.params.jobId },
            _count: true
        })
    ]);
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
    });
}));
router.get('/student/dashboard', auth_1.authMiddleware, (0, auth_1.restrictTo)('STUDENT'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.user.studentProfile) {
        return next((0, errorHandler_1.createError)('Student profile required', 400));
    }
    const studentId = req.user.studentProfile.id;
    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));
    const [totalApplications, recentApplications, applicationsByStatus, averageMatchScore, profileViews, savedJobs, interviewsScheduled, applicationTrends, topMatchingSkills] = await Promise.all([
        prisma.application.count({
            where: { studentId }
        }),
        prisma.application.count({
            where: {
                studentId,
                createdAt: { gte: fromDate }
            }
        }),
        prisma.application.groupBy({
            by: ['status'],
            where: { studentId },
            _count: true
        }),
        prisma.application.aggregate({
            where: {
                studentId,
                matchScore: { not: null }
            },
            _avg: { matchScore: true }
        }),
        prisma.userAnalytics.count({
            where: {
                userId: req.user.id,
                event: 'profile_view',
                createdAt: { gte: fromDate }
            }
        }),
        prisma.savedJob.count({
            where: { studentId }
        }),
        prisma.application.count({
            where: {
                studentId,
                status: 'INTERVIEW_SCHEDULED'
            }
        }),
        prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM applications
      WHERE "studentId" = ${studentId}
        AND "createdAt" >= ${fromDate}
      GROUP BY date
      ORDER BY date
    `,
        prisma.$queryRaw `
      SELECT unnest(j."requiredSkills") as skill, AVG(a."matchScore") as avg_score
      FROM applications a
      JOIN jobs j ON a."jobId" = j.id
      WHERE a."studentId" = ${studentId}
        AND a."matchScore" IS NOT NULL
      GROUP BY skill
      ORDER BY avg_score DESC
      LIMIT 10
    `
    ]);
    const acceptedApplications = applicationsByStatus.find(s => s.status === 'ACCEPTED')?._count || 0;
    const successRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;
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
    });
}));
router.post('/track', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { event, metadata = {} } = req.body;
    if (!event) {
        return res.status(400).json({
            status: 'fail',
            message: 'Event name is required'
        });
    }
    await prisma.userAnalytics.create({
        data: {
            userId: req.user.id,
            event,
            metadata,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }
    }).catch(() => { });
    res.status(200).json({
        status: 'success',
        message: 'Event tracked successfully'
    });
}));
router.get('/platform', auth_1.authMiddleware, (0, auth_1.restrictTo)('ADMIN'), [
    (0, express_validator_1.query)('period').optional().isInt({ min: 1, max: 365 })
], (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));
    const [totalUsers, newUsers, totalJobs, newJobs, totalApplications, newApplications, usersByRole, topCompanies, topUniversities, platformActivity] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
            where: { createdAt: { gte: fromDate } }
        }),
        prisma.job.count(),
        prisma.job.count({
            where: { createdAt: { gte: fromDate } }
        }),
        prisma.application.count(),
        prisma.application.count({
            where: { createdAt: { gte: fromDate } }
        }),
        prisma.user.groupBy({
            by: ['role'],
            _count: true
        }),
        prisma.$queryRaw `
      SELECT ep."companyName", COUNT(j.id) as job_count
      FROM employer_profiles ep
      LEFT JOIN jobs j ON ep.id = j."employerId"
      GROUP BY ep."companyName"
      ORDER BY job_count DESC
      LIMIT 10
    `,
        prisma.$queryRaw `
      SELECT university, COUNT(*) as student_count
      FROM student_profiles
      WHERE university IS NOT NULL
      GROUP BY university
      ORDER BY student_count DESC
      LIMIT 10
    `,
        prisma.$queryRaw `
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
    ]);
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
    });
}));
exports.default = router;
//# sourceMappingURL=analytics.js.map