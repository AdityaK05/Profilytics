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
router.get('/', auth_1.optionalAuth, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty'),
    (0, express_validator_1.query)('location').optional().trim(),
    (0, express_validator_1.query)('remote').optional().isBoolean(),
    (0, express_validator_1.query)('type').optional().isIn(['internship', 'full-time', 'part-time', 'contract']),
    (0, express_validator_1.query)('salaryMin').optional().isInt({ min: 0 }),
    (0, express_validator_1.query)('salaryMax').optional().isInt({ min: 0 }),
    (0, express_validator_1.query)('skills').optional().isArray(),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { page = 1, limit = 20, search, location, remote, type, salaryMin, salaryMax, skills, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
        status: 'ACTIVE',
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { employer: { companyName: { contains: search, mode: 'insensitive' } } }
            ]
        }),
        ...(location && { location: { contains: location, mode: 'insensitive' } }),
        ...(remote !== undefined && { remote: remote === 'true' }),
        ...(type && { type: type }),
        ...(salaryMin && { salary: { gte: parseInt(salaryMin) } }),
        ...(salaryMax && { salary: { lte: parseInt(salaryMax) } }),
        ...(skills && Array.isArray(skills) && {
            requiredSkills: {
                hasSome: skills
            }
        })
    };
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
                [sortBy]: sortOrder
            },
            skip,
            take: parseInt(limit)
        }),
        prisma.job.count({ where })
    ]);
    let jobsWithMatchScores = jobs;
    if (req.user?.role === 'STUDENT' && req.user.studentProfile) {
        jobsWithMatchScores = jobs.map(job => ({
            ...job,
            matchScore: calculateJobMatchScore(job, req.user.studentProfile)
        }));
    }
    res.status(200).json({
        status: 'success',
        data: {
            jobs: jobsWithMatchScores,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));
function calculateJobMatchScore(job, studentProfile) {
    let score = 0;
    const factors = [];
    if (job.requiredSkills && studentProfile.skills) {
        const studentSkills = studentProfile.skills.map((s) => s.name.toLowerCase());
        const requiredSkills = job.requiredSkills.map((s) => s.toLowerCase());
        const matchingSkills = requiredSkills.filter(skill => studentSkills.some(studentSkill => studentSkill.includes(skill) || skill.includes(studentSkill)));
        const skillsScore = (matchingSkills.length / requiredSkills.length) * 40;
        score += skillsScore;
        factors.push(`Skills: ${matchingSkills.length}/${requiredSkills.length} matched`);
    }
    if (studentProfile.preferredLocations && job.location) {
        const locationMatch = studentProfile.preferredLocations.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(job.location.toLowerCase()));
        if (locationMatch) {
            score += 20;
            factors.push('Location: Preferred location match');
        }
    }
    if (studentProfile.expectedSalary && job.salary) {
        const salaryRatio = job.salary / studentProfile.expectedSalary;
        if (salaryRatio >= 0.8 && salaryRatio <= 1.5) {
            score += 20 * Math.min(salaryRatio, 1);
            factors.push(`Salary: ${Math.round(salaryRatio * 100)}% of expectation`);
        }
    }
    if (studentProfile.preferredRoles && job.title) {
        const roleMatch = studentProfile.preferredRoles.some((role) => job.title.toLowerCase().includes(role.toLowerCase()) ||
            role.toLowerCase().includes(job.title.toLowerCase()));
        if (roleMatch) {
            score += 20;
            factors.push('Role: Preferred role match');
        }
    }
    return Math.min(Math.round(score), 100);
}
router.get('/:id', auth_1.optionalAuth, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
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
    });
    if (!job) {
        return next((0, errorHandler_1.createError)('Job not found', 404));
    }
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
        }).catch(() => { });
    }
    let jobWithMatchScore = job;
    if (req.user?.role === 'STUDENT' && req.user.studentProfile) {
        jobWithMatchScore = {
            ...job,
            matchScore: calculateJobMatchScore(job, req.user.studentProfile)
        };
    }
    res.status(200).json({
        status: 'success',
        data: {
            job: jobWithMatchScore
        }
    });
}));
router.post('/', auth_1.authMiddleware, auth_1.requireEmployerProfile, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }).withMessage('Job title is required'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 50 }).withMessage('Job description must be at least 50 characters'),
    (0, express_validator_1.body)('type').isIn(['internship', 'full-time', 'part-time', 'contract']).withMessage('Invalid job type'),
    (0, express_validator_1.body)('requirements').isArray({ min: 1 }).withMessage('At least one requirement is needed'),
    (0, express_validator_1.body)('responsibilities').isArray({ min: 1 }).withMessage('At least one responsibility is needed'),
    (0, express_validator_1.body)('requiredSkills').isArray({ min: 1 }).withMessage('At least one skill is required'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { title, description, requirements, responsibilities, benefits = [], location, remote = false, type, duration, salary, salaryMax, salaryType = 'monthly', requiredSkills, experienceLevel, educationLevel, deadline, startDate, status = 'DRAFT' } = req.body;
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
    });
    logger_1.default.info(`New job created: ${title} by ${req.user.employerProfile.companyName}`);
    res.status(201).json({
        status: 'success',
        data: {
            job
        }
    });
}));
router.patch('/:id', auth_1.authMiddleware, auth_1.requireEmployerProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { employer: true }
    });
    if (!job) {
        return next((0, errorHandler_1.createError)('Job not found', 404));
    }
    if (job.employerId !== req.user.employerProfile.id) {
        return next((0, errorHandler_1.createError)('You can only update your own jobs', 403));
    }
    const allowedFields = [
        'title', 'description', 'requirements', 'responsibilities', 'benefits',
        'location', 'remote', 'type', 'duration', 'salary', 'salaryMax', 'salaryType',
        'requiredSkills', 'experienceLevel', 'educationLevel', 'deadline', 'startDate', 'status'
    ];
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            if (field === 'deadline' || field === 'startDate') {
                updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
            }
            else {
                updateData[field] = req.body[field];
            }
        }
    });
    if (updateData.status === 'ACTIVE' && job.status !== 'ACTIVE') {
        updateData.publishedAt = new Date();
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
    });
    res.status(200).json({
        status: 'success',
        data: {
            job: updatedJob
        }
    });
}));
router.delete('/:id', auth_1.authMiddleware, auth_1.requireEmployerProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { employer: true }
    });
    if (!job) {
        return next((0, errorHandler_1.createError)('Job not found', 404));
    }
    if (job.employerId !== req.user.employerProfile.id) {
        return next((0, errorHandler_1.createError)('You can only delete your own jobs', 403));
    }
    await prisma.job.delete({
        where: { id: req.params.id }
    });
    logger_1.default.info(`Job deleted: ${job.title} by ${req.user.employerProfile.companyName}`);
    res.status(204).json({
        status: 'success',
        data: null
    });
}));
router.get('/employer/dashboard', auth_1.authMiddleware, auth_1.requireEmployerProfile, (0, errorHandler_1.catchAsync)(async (req, res) => {
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
    });
    res.status(200).json({
        status: 'success',
        data: {
            jobs
        }
    });
}));
router.get('/recommendations', auth_1.authMiddleware, (0, auth_1.restrictTo)('STUDENT'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.user.studentProfile) {
        return next((0, errorHandler_1.createError)('Complete your profile to get recommendations', 400));
    }
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
        take: 50
    });
    const jobsWithScores = jobs
        .map(job => ({
        ...job,
        matchScore: calculateJobMatchScore(job, req.user.studentProfile)
    }))
        .filter(job => job.matchScore > 30)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);
    res.status(200).json({
        status: 'success',
        data: {
            recommendations: jobsWithScores
        }
    });
}));
exports.default = router;
//# sourceMappingURL=jobs.js.map