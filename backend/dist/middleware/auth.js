"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensitiveOperationLimit = exports.requireVerifiedEmployer = exports.requireEmployerProfile = exports.requireStudentProfile = exports.requireEmailVerification = exports.optionalAuth = exports.restrictTo = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
exports.authMiddleware = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next((0, errorHandler_1.createError)('You are not logged in! Please log in to get access.', 401));
    }
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
            studentProfile: true,
            employerProfile: true,
        },
    });
    if (!currentUser) {
        return next((0, errorHandler_1.createError)('The user belonging to this token does no longer exist.', 401));
    }
    req.user = currentUser;
    next();
});
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next((0, errorHandler_1.createError)('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
exports.optionalAuth = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                studentProfile: true,
                employerProfile: true,
            },
        });
        if (currentUser) {
            req.user = currentUser;
        }
    }
    catch (error) {
        logger_1.default.warn('Invalid token in optional auth:', error);
    }
    next();
});
const requireEmailVerification = (req, res, next) => {
    if (!req.user?.verified) {
        return next((0, errorHandler_1.createError)('Please verify your email address before accessing this resource.', 403));
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
const requireStudentProfile = (req, res, next) => {
    if (req.user?.role !== 'STUDENT' || !req.user?.studentProfile) {
        return next((0, errorHandler_1.createError)('This resource requires a student profile.', 403));
    }
    next();
};
exports.requireStudentProfile = requireStudentProfile;
const requireEmployerProfile = (req, res, next) => {
    if (req.user?.role !== 'EMPLOYER' || !req.user?.employerProfile) {
        return next((0, errorHandler_1.createError)('This resource requires an employer profile.', 403));
    }
    next();
};
exports.requireEmployerProfile = requireEmployerProfile;
const requireVerifiedEmployer = (req, res, next) => {
    if (req.user?.role !== 'EMPLOYER' || !req.user?.employerProfile?.verified) {
        return next((0, errorHandler_1.createError)('This resource requires a verified employer account.', 403));
    }
    next();
};
exports.requireVerifiedEmployer = requireVerifiedEmployer;
exports.sensitiveOperationLimit = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const userKey = req.user?.id || req.ip;
    const operation = req.route?.path || req.path;
    logger_1.default.info(`Sensitive operation attempted: ${operation} by user ${userKey}`);
    next();
});
exports.default = {
    authMiddleware: exports.authMiddleware,
    restrictTo: exports.restrictTo,
    optionalAuth: exports.optionalAuth,
    requireEmailVerification: exports.requireEmailVerification,
    requireStudentProfile: exports.requireStudentProfile,
    requireEmployerProfile: exports.requireEmployerProfile,
    requireVerifiedEmployer: exports.requireVerifiedEmployer,
    sensitiveOperationLimit: exports.sensitiveOperationLimit,
};
//# sourceMappingURL=auth.js.map