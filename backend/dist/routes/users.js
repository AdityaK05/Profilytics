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
router.get('/profile', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
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
    });
    if (!user) {
        return next((0, errorHandler_1.createError)('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: { user }
    });
}));
router.post('/skills', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.body)('name').trim().isLength({ min: 1 }).withMessage('Skill name is required'),
    (0, express_validator_1.body)('level').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).withMessage('Invalid skill level'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { name, level } = req.body;
    const existingSkill = await prisma.skill.findFirst({
        where: {
            studentId: req.user.studentProfile.id,
            name: { equals: name, mode: 'insensitive' }
        }
    });
    if (existingSkill) {
        return next((0, errorHandler_1.createError)('Skill already exists', 400));
    }
    const skill = await prisma.skill.create({
        data: {
            name,
            level,
            studentId: req.user.studentProfile.id
        }
    });
    res.status(201).json({
        status: 'success',
        data: { skill }
    });
}));
router.patch('/skills/:id', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.body)('level').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const skill = await prisma.skill.findUnique({
        where: { id: req.params.id }
    });
    if (!skill) {
        return next((0, errorHandler_1.createError)('Skill not found', 404));
    }
    if (skill.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only update your own skills', 403));
    }
    const updatedSkill = await prisma.skill.update({
        where: { id: req.params.id },
        data: { level: req.body.level }
    });
    res.status(200).json({
        status: 'success',
        data: { skill: updatedSkill }
    });
}));
router.delete('/skills/:id', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const skill = await prisma.skill.findUnique({
        where: { id: req.params.id }
    });
    if (!skill) {
        return next((0, errorHandler_1.createError)('Skill not found', 404));
    }
    if (skill.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only delete your own skills', 403));
    }
    await prisma.skill.delete({
        where: { id: req.params.id }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
}));
router.post('/experiences', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }).withMessage('Job title is required'),
    (0, express_validator_1.body)('company').trim().isLength({ min: 1 }).withMessage('Company name is required'),
    (0, express_validator_1.body)('startDate').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('endDate').optional().isISO8601().withMessage('End date must be valid'),
    (0, express_validator_1.body)('current').optional().isBoolean(),
    (0, express_validator_1.body)('skills').optional().isArray(),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { title, company, location, startDate, endDate, current, description, skills } = req.body;
    if (!current && !endDate) {
        return next((0, errorHandler_1.createError)('End date is required if not current position', 400));
    }
    if (endDate && new Date(startDate) >= new Date(endDate)) {
        return next((0, errorHandler_1.createError)('Start date must be before end date', 400));
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
    });
    res.status(201).json({
        status: 'success',
        data: { experience }
    });
}));
router.patch('/experiences/:id', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.body)('startDate').optional().isISO8601(),
    (0, express_validator_1.body)('endDate').optional().isISO8601(),
    (0, express_validator_1.body)('current').optional().isBoolean(),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const experience = await prisma.experience.findUnique({
        where: { id: req.params.id }
    });
    if (!experience) {
        return next((0, errorHandler_1.createError)('Experience not found', 404));
    }
    if (experience.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only update your own experiences', 403));
    }
    const allowedFields = ['title', 'company', 'location', 'startDate', 'endDate', 'current', 'description', 'skills'];
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            if (field === 'startDate' || field === 'endDate') {
                updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
            }
            else {
                updateData[field] = req.body[field];
            }
        }
    });
    const updatedExperience = await prisma.experience.update({
        where: { id: req.params.id },
        data: updateData
    });
    res.status(200).json({
        status: 'success',
        data: { experience: updatedExperience }
    });
}));
router.delete('/experiences/:id', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const experience = await prisma.experience.findUnique({
        where: { id: req.params.id }
    });
    if (!experience) {
        return next((0, errorHandler_1.createError)('Experience not found', 404));
    }
    if (experience.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only delete your own experiences', 403));
    }
    await prisma.experience.delete({
        where: { id: req.params.id }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
}));
router.post('/projects', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }).withMessage('Project title is required'),
    (0, express_validator_1.body)('technologies').isArray({ min: 1 }).withMessage('At least one technology is required'),
    (0, express_validator_1.body)('githubUrl').optional().isURL().withMessage('GitHub URL must be valid'),
    (0, express_validator_1.body)('liveUrl').optional().isURL().withMessage('Live URL must be valid'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { title, description, technologies, githubUrl, liveUrl, imageUrl, featured } = req.body;
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
    });
    res.status(201).json({
        status: 'success',
        data: { project }
    });
}));
router.patch('/projects/:id', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const project = await prisma.project.findUnique({
        where: { id: req.params.id }
    });
    if (!project) {
        return next((0, errorHandler_1.createError)('Project not found', 404));
    }
    if (project.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only update your own projects', 403));
    }
    const allowedFields = ['title', 'description', 'technologies', 'githubUrl', 'liveUrl', 'imageUrl', 'featured'];
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });
    const updatedProject = await prisma.project.update({
        where: { id: req.params.id },
        data: updateData
    });
    res.status(200).json({
        status: 'success',
        data: { project: updatedProject }
    });
}));
router.delete('/projects/:id', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const project = await prisma.project.findUnique({
        where: { id: req.params.id }
    });
    if (!project) {
        return next((0, errorHandler_1.createError)('Project not found', 404));
    }
    if (project.studentId !== req.user.studentProfile.id) {
        return next((0, errorHandler_1.createError)('You can only delete your own projects', 403));
    }
    await prisma.project.delete({
        where: { id: req.params.id }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
}));
router.post('/saved-jobs', auth_1.authMiddleware, auth_1.requireStudentProfile, [
    (0, express_validator_1.body)('jobId').isString().notEmpty().withMessage('Job ID is required'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { jobId } = req.body;
    const job = await prisma.job.findUnique({
        where: { id: jobId }
    });
    if (!job) {
        return next((0, errorHandler_1.createError)('Job not found', 404));
    }
    const existingSavedJob = await prisma.savedJob.findUnique({
        where: {
            studentId_jobId: {
                studentId: req.user.studentProfile.id,
                jobId: jobId
            }
        }
    });
    if (existingSavedJob) {
        return next((0, errorHandler_1.createError)('Job already saved', 400));
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
    });
    res.status(201).json({
        status: 'success',
        data: { savedJob }
    });
}));
router.get('/saved-jobs', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res) => {
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
    });
    res.status(200).json({
        status: 'success',
        data: { savedJobs }
    });
}));
router.delete('/saved-jobs/:jobId', auth_1.authMiddleware, auth_1.requireStudentProfile, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const savedJob = await prisma.savedJob.findUnique({
        where: {
            studentId_jobId: {
                studentId: req.user.studentProfile.id,
                jobId: req.params.jobId
            }
        }
    });
    if (!savedJob) {
        return next((0, errorHandler_1.createError)('Saved job not found', 404));
    }
    await prisma.savedJob.delete({
        where: {
            studentId_jobId: {
                studentId: req.user.studentProfile.id,
                jobId: req.params.jobId
            }
        }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
}));
router.get('/preferences', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    let preferences = await prisma.userPreferences.findUnique({
        where: { userId: req.user.id }
    });
    if (!preferences) {
        preferences = await prisma.userPreferences.create({
            data: { userId: req.user.id }
        });
    }
    res.status(200).json({
        status: 'success',
        data: { preferences }
    });
}));
router.patch('/preferences', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const allowedFields = [
        'emailNotifications', 'pushNotifications', 'jobAlerts', 'applicationUpdates',
        'aiSuggestions', 'personalizedContent', 'dataCollection',
        'profileVisibility', 'contactPermissions'
    ];
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });
    const preferences = await prisma.userPreferences.upsert({
        where: { userId: req.user.id },
        update: updateData,
        create: {
            userId: req.user.id,
            ...updateData
        }
    });
    res.status(200).json({
        status: 'success',
        data: { preferences }
    });
}));
router.get('/activity', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const [totalApplications, recentApplications, profileViews, savedJobs, messageCount] = await Promise.all([
        prisma.application.count({
            where: {
                student: { userId: req.user.id }
            }
        }),
        prisma.application.count({
            where: {
                student: { userId: req.user.id },
                createdAt: { gte: fromDate }
            }
        }),
        prisma.userAnalytics.count({
            where: {
                userId: req.user.id,
                event: 'profile_view',
                createdAt: { gte: fromDate }
            }
        }),
        prisma.savedJob.count({
            where: {
                student: { userId: req.user.id }
            }
        }),
        prisma.message.count({
            where: {
                userId: req.user.id,
                createdAt: { gte: fromDate }
            }
        })
    ]);
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
    });
}));
exports.default = router;
//# sourceMappingURL=users.js.map