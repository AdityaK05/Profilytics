"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const signToken = (id, email, role) => {
    const secret = (process.env.JWT_SECRET || "changeme");
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d');
    return jsonwebtoken_1.default.sign({ id, email, role }, secret, { expiresIn });
};
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id, user.email, user.role);
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    };
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};
const signupValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
    (0, express_validator_1.body)('role').isIn(['STUDENT', 'EMPLOYER']).withMessage('Role must be either STUDENT or EMPLOYER'),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
router.post('/signup', signupValidation, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { email, password, role, firstName, lastName } = req.body;
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return next((0, errorHandler_1.createError)('User with this email already exists', 400));
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role,
            firstName,
            lastName,
        },
    });
    logger_1.default.info(`New user registered: ${email} with role ${role}`);
    createSendToken(user, 201, res);
}));
router.post('/login', loginValidation, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            studentProfile: true,
            employerProfile: true,
        },
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        return next((0, errorHandler_1.createError)('Incorrect email or password', 401));
    }
    logger_1.default.info(`User logged in: ${email}`);
    createSendToken(user, 200, res);
}));
router.post('/logout', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    logger_1.default.info(`User logged out: ${req.user.email}`);
    res.status(200).json({ status: 'success' });
}));
router.get('/me', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
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
                },
            },
            employerProfile: true,
        },
    });
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
}));
router.patch('/profile', auth_1.authMiddleware, [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any'),
    (0, express_validator_1.body)('location').optional().trim(),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const allowedFields = ['firstName', 'lastName', 'phone', 'location', 'timezone'];
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        include: {
            studentProfile: true,
            employerProfile: true,
        },
    });
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
}));
router.post('/student-profile', auth_1.authMiddleware, [
    (0, express_validator_1.body)('university').optional().trim(),
    (0, express_validator_1.body)('major').optional().trim(),
    (0, express_validator_1.body)('graduationYear').optional().isInt({ min: 2020, max: 2030 }),
    (0, express_validator_1.body)('gpa').optional().isFloat({ min: 0, max: 4.0 }),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (req.user.role !== 'STUDENT') {
        return next((0, errorHandler_1.createError)('Only students can create student profiles', 403));
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { university, major, graduationYear, gpa, degree, githubUsername, leetcodeUsername, codeforcesUsername, preferredLocations, preferredRoles, expectedSalary, resumeUrl, portfolioUrl, linkedinUrl, } = req.body;
    const studentProfile = await prisma.studentProfile.upsert({
        where: { userId: req.user.id },
        update: {
            university,
            major,
            graduationYear,
            gpa,
            degree,
            githubUsername,
            leetcodeUsername,
            codeforcesUsername,
            preferredLocations,
            preferredRoles,
            expectedSalary,
            resumeUrl,
            portfolioUrl,
            linkedinUrl,
        },
        create: {
            userId: req.user.id,
            university,
            major,
            graduationYear,
            gpa,
            degree,
            githubUsername,
            leetcodeUsername,
            codeforcesUsername,
            preferredLocations,
            preferredRoles,
            expectedSalary,
            resumeUrl,
            portfolioUrl,
            linkedinUrl,
        },
        include: {
            skills: true,
            experiences: true,
            projects: true,
        },
    });
    res.status(200).json({
        status: 'success',
        data: {
            profile: studentProfile,
        },
    });
}));
router.post('/employer-profile', auth_1.authMiddleware, [
    (0, express_validator_1.body)('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
    (0, express_validator_1.body)('industry').optional().trim(),
    (0, express_validator_1.body)('companySize').optional().trim(),
    (0, express_validator_1.body)('website').optional().isURL(),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (req.user.role !== 'EMPLOYER') {
        return next((0, errorHandler_1.createError)('Only employers can create employer profiles', 403));
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { companyName, companySize, industry, website, description, headquarters, founded, position, department, phoneNumber, } = req.body;
    const employerProfile = await prisma.employerProfile.upsert({
        where: { userId: req.user.id },
        update: {
            companyName,
            companySize,
            industry,
            website,
            description,
            headquarters,
            founded,
            position,
            department,
            phoneNumber,
        },
        create: {
            userId: req.user.id,
            companyName,
            companySize,
            industry,
            website,
            description,
            headquarters,
            founded,
            position,
            department,
            phoneNumber,
        },
    });
    res.status(200).json({
        status: 'success',
        data: {
            profile: employerProfile,
        },
    });
}));
router.patch('/change-password', auth_1.authMiddleware, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });
    if (!user || !(await bcryptjs_1.default.compare(currentPassword, user.password))) {
        return next((0, errorHandler_1.createError)('Current password is incorrect', 401));
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
    });
    logger_1.default.info(`Password changed for user: ${req.user.email}`);
    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
    });
}));
router.delete('/account', auth_1.authMiddleware, [
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password confirmation is required'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { password } = req.body;
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        return next((0, errorHandler_1.createError)('Password is incorrect', 401));
    }
    await prisma.user.delete({
        where: { id: req.user.id },
    });
    logger_1.default.info(`Account deleted for user: ${req.user.email}`);
    res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully',
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map