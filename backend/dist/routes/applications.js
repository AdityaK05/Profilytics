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
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post('/', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.body)('jobId').isString().notEmpty().withMessage('Job ID is required'),
    (0, express_validator_1.body)('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('Cover letter cannot exceed 2000 characters'),
    (0, express_validator_1.body)('resumeUrl').optional().isURL().withMessage('Resume URL must be valid'),
    (0, express_validator_1.body)('portfolioUrl').optional().isURL().withMessage('Portfolio URL must be valid'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { jobId, coverLetter, resumeUrl, portfolioUrl } = req.body;
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { employer: true }
    });
    if (!job) {
        return next((0, errorHandler_1.createError)('Job not found', 404));
    }
    if (job.status !== 'ACTIVE') {
        return next((0, errorHandler_1.createError)('This job is no longer accepting applications', 400));
    }
    if (job.deadline && job.deadline < new Date()) {
        return next((0, errorHandler_1.createError)('Application deadline has passed', 400));
    }
    const existingApplication = await prisma.application.findUnique({
        where: {
            studentId_jobId: {
                studentId: req.user.studentProfile.id,
                jobId: jobId
            }
        }
    });
    if (existingApplication) {
        return next((0, errorHandler_1.createError)('You have already applied for this job', 400));
    }
    const matchScore = calculateApplicationMatchScore(job, req.user.studentProfile);
    const matchReasons = generateMatchReasons(job, req.user.studentProfile);
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
    });
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
    }).catch(() => { });
    logger_1.default.info(`New application: ${req.user.firstName} ${req.user.lastName} applied for ${job.title} at ${job.employer.companyName}`);
    res.status(201).json({
        status: 'success',
        data: {
            application
        }
    });
}));
function calculateApplicationMatchScore(job, studentProfile) {
    let score = 0;
    if (job.requiredSkills && studentProfile.skills && studentProfile.skills.length > 0) {
        const studentSkills = studentProfile.skills.map((s) => s.name.toLowerCase());
        const requiredSkills = job.requiredSkills.map((s) => s.toLowerCase());
        const matchingSkills = requiredSkills.filter((skill) => studentSkills.some((studentSkill) => studentSkill.includes(skill) || skill.includes(studentSkill)));
        score += (matchingSkills.length / requiredSkills.length) * 50;
    }
    if (studentProfile.experiences && studentProfile.experiences.length > 0) {
        score += 20;
    }
    if (studentProfile.university && studentProfile.gpa) {
        score += 10;
        if (studentProfile.gpa >= 3.5)
            score += 5;
    }
    if (studentProfile.githubContributions > 100)
        score += 10;
    if (studentProfile.publicRepos > 5)
        score += 5;
    return Math.min(Math.round(score), 100);
}
function generateMatchReasons(job, studentProfile) {
    const reasons = [];
    if (job.requiredSkills && studentProfile.skills) {
        const studentSkills = studentProfile.skills.map((s) => s.name.toLowerCase());
        const requiredSkills = job.requiredSkills.map((s) => s.toLowerCase());
        const matchingSkills = requiredSkills.filter((skill) => studentSkills.some((studentSkill) => studentSkill.includes(skill)));
        if (matchingSkills.length > 0) {
            reasons.push(`Strong skill match: ${matchingSkills.slice(0, 3).join(', ')}`);
        }
    }
    if (studentProfile.gpa >= 3.5) {
        reasons.push(`High academic performance (GPA: ${studentProfile.gpa})`);
    }
    if (studentProfile.leetcodeRating > 1800) {
        reasons.push(`Strong coding skills (LeetCode: ${studentProfile.leetcodeRating})`);
    }
    if (studentProfile.githubContributions > 200) {
        reasons.push(`Active open source contributor`);
    }
    return reasons;
}
router.get('/', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.query)('status').optional().isIn(['PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
        studentId: req.user.studentProfile.id,
        ...(status && { status: status })
    };
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
            take: parseInt(limit)
        }),
        prisma.application.count({ where })
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            applications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));
router.get('/:id', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
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
    });
    if (!application) {
        return next((0, errorHandler_1.createError)('Application not found', 404));
    }
    const isStudent = req.user.role === 'STUDENT' && req.user.studentProfile?.id === application.studentId;
    const isEmployer = req.user.role === 'EMPLOYER' && req.user.employerProfile?.id === application.employerId;
    if (!isStudent && !isEmployer) {
        return next((0, errorHandler_1.createError)('You can only view your own applications or applications to your jobs', 403));
    }
    if (isEmployer && !application.viewedByEmployer) {
        await prisma.application.update({
            where: { id: req.params.id },
            data: {
                viewedByEmployer: true,
                viewedAt: new Date()
            }
        }).catch(() => { });
    }
    res.status(200).json({
        status: 'success',
        data: {
            application
        }
    });
}));
router.patch('/:id/status', auth_1.authMiddleware, auth_1.requireEmployerProfile, [
    (0, express_validator_1.body)('status').isIn(['UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED']).withMessage('Invalid status'),
    (0, express_validator_1.body)('feedback').optional().trim().isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters'),
    (0, express_validator_1.body)('interviewDate').optional().isISO8601().withMessage('Interview date must be valid'),
    (0, express_validator_1.body)('interviewType').optional().isIn(['phone', 'video', 'in-person']).withMessage('Invalid interview type'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
            job: { include: { employer: true } },
            student: { include: { user: true } }
        }
    });
    if (!application) {
        return next((0, errorHandler_1.createError)('Application not found', 404));
    }
    if (application.employerId !== req.user.employerProfile.id) {
        return next((0, errorHandler_1.createError)('You can only update applications for your jobs', 403));
    }
    const { status, feedback, interviewDate, interviewType, interviewNotes } = req.body;
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
    });
    const notificationMessages = {
        'UNDER_REVIEW': 'Your application is now under review',
        'INTERVIEW_SCHEDULED': 'Interview scheduled for your application',
        'REJECTED': 'Application status updated',
        'ACCEPTED': 'Congratulations! Your application has been accepted'
    };
    await prisma.notification.create({
        data: {
            userId: application.student.user.id,
            title: 'Application Status Update',
            message: `${notificationMessages[status]} for ${application.job.title} at ${application.job.employer.companyName}`,
            type: 'application_update',
            metadata: {
                applicationId: application.id,
                jobId: application.jobId,
                status
            }
        }
    }).catch(() => { });
    logger_1.default.info(`Application status updated: ${application.id} to ${status} by ${req.user.employerProfile.companyName}`);
    res.status(200).json({
        status: 'success',
        data: {
            application: updatedApplication
        }
    });
}));
router.patch('/:id/withdraw', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
            job: { include: { employer: true } }
        }
    });
    if (!application) {
        return next((0, errorHandler_1.createError)('Application not found', 404));
    }
    if (application.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only withdraw your own applications', 403));
    }
    if (application.status === 'WITHDRAWN') {
        return next((0, errorHandler_1.createError)('Application is already withdrawn', 400));
    }
    if (application.status === 'ACCEPTED') {
        return next((0, errorHandler_1.createError)('Cannot withdraw an accepted application', 400));
    }
    const updatedApplication = await prisma.application.update({
        where: { id: req.params.id },
        data: {
            status: 'WITHDRAWN',
            respondedAt: new Date()
        }
    });
    logger_1.default.info(`Application withdrawn: ${application.id} by ${req.user.firstName} ${req.user.lastName}`);
    res.status(200).json({
        status: 'success',
        data: {
            application: updatedApplication
        }
    });
}));
router.get('/employer/dashboard', auth_1.authMiddleware, auth_1.requireEmployerProfile, [
    (0, express_validator_1.query)('status').optional().isIn(['PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN']),
    (0, express_validator_1.query)('jobId').optional().isString(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { status, jobId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
        employerId: req.user.employerProfile.id,
        ...(status && { status: status }),
        ...(jobId && { jobId: jobId })
    };
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
            take: parseInt(limit)
        }),
        prisma.application.count({ where })
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            applications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));
router.get('/employer/analytics', auth_1.authMiddleware, auth_1.requireEmployerProfile, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const employerId = req.user.employerProfile.id;
    const [totalApplications, pendingApplications, interviewsScheduled, acceptedApplications, applicationsByJob, applicationsByMonth] = await Promise.all([
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
        prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM applications 
      WHERE "employerId" = ${employerId}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `
    ]);
    const conversionRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;
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
    });
}));
exports.default = router;
//# sourceMappingURL=applications.js.map