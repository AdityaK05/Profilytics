"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    };
    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    },
});
const generateFileName = (originalName, prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path_1.default.extname(originalName);
    return `${prefix}${timestamp}-${random}${extension}`;
};
async function uploadToCloudStorage(buffer, fileName, contentType) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return `https://profilytics-uploads.s3.amazonaws.com/${fileName}`;
}
router.post('/avatar', auth_1.authMiddleware, upload.single('avatar'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next((0, errorHandler_1.createError)('No file uploaded', 400));
    }
    try {
        const processedBuffer = await (0, sharp_1.default)(req.file.buffer)
            .resize(400, 400, {
            fit: 'cover',
            position: 'center'
        })
            .jpeg({ quality: 90 })
            .toBuffer();
        const fileName = generateFileName(req.file.originalname, 'avatar-');
        const imageUrl = await uploadToCloudStorage(processedBuffer, fileName, 'image/jpeg');
        await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar: imageUrl }
        });
        logger_1.default.info(`Avatar uploaded for user: ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            data: {
                url: imageUrl,
                message: 'Avatar uploaded successfully'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Avatar upload error:', error);
        return next((0, errorHandler_1.createError)('Failed to process and upload avatar', 500));
    }
}));
router.post('/resume', auth_1.authMiddleware, upload.single('resume'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next((0, errorHandler_1.createError)('No file uploaded', 400));
    }
    if (req.user.role !== 'STUDENT') {
        return next((0, errorHandler_1.createError)('Only students can upload resumes', 403));
    }
    try {
        const fileName = generateFileName(req.file.originalname, 'resume-');
        const resumeUrl = await uploadToCloudStorage(req.file.buffer, fileName, req.file.mimetype);
        await prisma.studentProfile.update({
            where: { userId: req.user.id },
            data: { resumeUrl }
        });
        await prisma.userAnalytics.create({
            data: {
                userId: req.user.id,
                event: 'resume_upload',
                metadata: {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype
                }
            }
        }).catch(() => { });
        logger_1.default.info(`Resume uploaded for user: ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            data: {
                url: resumeUrl,
                message: 'Resume uploaded successfully'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Resume upload error:', error);
        return next((0, errorHandler_1.createError)('Failed to upload resume', 500));
    }
}));
router.post('/logo', auth_1.authMiddleware, upload.single('logo'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next((0, errorHandler_1.createError)('No file uploaded', 400));
    }
    if (req.user.role !== 'EMPLOYER') {
        return next((0, errorHandler_1.createError)('Only employers can upload company logos', 403));
    }
    try {
        const processedBuffer = await (0, sharp_1.default)(req.file.buffer)
            .resize(200, 200, {
            fit: 'inside',
            withoutEnlargement: true
        })
            .png({ quality: 90 })
            .toBuffer();
        const fileName = generateFileName(req.file.originalname, 'logo-');
        const logoUrl = await uploadToCloudStorage(processedBuffer, fileName, 'image/png');
        await prisma.employerProfile.update({
            where: { userId: req.user.id },
            data: { logo: logoUrl }
        });
        logger_1.default.info(`Company logo uploaded for user: ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            data: {
                url: logoUrl,
                message: 'Company logo uploaded successfully'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Logo upload error:', error);
        return next((0, errorHandler_1.createError)('Failed to process and upload logo', 500));
    }
}));
router.post('/project-image', auth_1.authMiddleware, upload.single('image'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next((0, errorHandler_1.createError)('No file uploaded', 400));
    }
    if (req.user.role !== 'STUDENT') {
        return next((0, errorHandler_1.createError)('Only students can upload project images', 403));
    }
    try {
        const processedBuffer = await (0, sharp_1.default)(req.file.buffer)
            .resize(800, 600, {
            fit: 'inside',
            withoutEnlargement: true
        })
            .jpeg({ quality: 85 })
            .toBuffer();
        const fileName = generateFileName(req.file.originalname, 'project-');
        const imageUrl = await uploadToCloudStorage(processedBuffer, fileName, 'image/jpeg');
        logger_1.default.info(`Project image uploaded for user: ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            data: {
                url: imageUrl,
                message: 'Project image uploaded successfully'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Project image upload error:', error);
        return next((0, errorHandler_1.createError)('Failed to process and upload project image', 500));
    }
}));
router.post('/verification', auth_1.authMiddleware, upload.single('document'), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next((0, errorHandler_1.createError)('No file uploaded', 400));
    }
    if (req.user.role !== 'EMPLOYER') {
        return next((0, errorHandler_1.createError)('Only employers can upload verification documents', 403));
    }
    try {
        const fileName = generateFileName(req.file.originalname, 'verification-');
        const documentUrl = await uploadToCloudStorage(req.file.buffer, fileName, req.file.mimetype);
        await prisma.employerProfile.update({
            where: { userId: req.user.id },
            data: { verificationDoc: documentUrl }
        });
        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
        });
        for (const admin of adminUsers) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: 'New Employer Verification',
                    message: `${req.user.employerProfile?.companyName || 'Company'} submitted verification documents`,
                    type: 'employer_verification',
                    metadata: {
                        employerId: req.user.employerProfile?.id,
                        documentUrl
                    }
                }
            }).catch(() => { });
        }
        logger_1.default.info(`Verification document uploaded for employer: ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            data: {
                url: documentUrl,
                message: 'Verification document uploaded successfully. It will be reviewed by our team.'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Verification document upload error:', error);
        return next((0, errorHandler_1.createError)('Failed to upload verification document', 500));
    }
}));
router.post('/multiple', auth_1.authMiddleware, upload.array('files', 5), (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return next((0, errorHandler_1.createError)('No files uploaded', 400));
    }
    try {
        const uploadPromises = req.files.map(async (file) => {
            let processedBuffer = file.buffer;
            let contentType = file.mimetype;
            if (file.mimetype.startsWith('image/')) {
                processedBuffer = await (0, sharp_1.default)(file.buffer)
                    .resize(1200, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                    .jpeg({ quality: 85 })
                    .toBuffer();
                contentType = 'image/jpeg';
            }
            const fileName = generateFileName(file.originalname, 'multi-');
            const url = await uploadToCloudStorage(processedBuffer, fileName, contentType);
            return {
                originalName: file.originalname,
                url,
                size: file.size,
                type: file.mimetype
            };
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        logger_1.default.info(`Multiple files uploaded for user: ${req.user.id}, count: ${uploadedFiles.length}`);
        res.status(200).json({
            status: 'success',
            data: {
                files: uploadedFiles,
                message: `${uploadedFiles.length} files uploaded successfully`
            }
        });
    }
    catch (error) {
        logger_1.default.error('Multiple files upload error:', error);
        return next((0, errorHandler_1.createError)('Failed to upload files', 500));
    }
}));
router.get('/stats', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));
    const uploadStats = await prisma.userAnalytics.groupBy({
        by: ['event'],
        where: {
            userId,
            event: {
                in: ['resume_upload', 'avatar_upload', 'logo_upload', 'project_image_upload']
            },
            createdAt: { gte: fromDate }
        },
        _count: true
    });
    const totalUploads = uploadStats.reduce((sum, stat) => sum + stat._count, 0);
    res.status(200).json({
        status: 'success',
        data: {
            totalUploads,
            uploadsByType: uploadStats,
            period: `${period} days`
        }
    });
}));
router.delete('/:type', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const { type } = req.params;
    try {
        switch (type) {
            case 'avatar':
                await prisma.user.update({
                    where: { id: req.user.id },
                    data: { avatar: null }
                });
                break;
            case 'resume':
                if (req.user.role !== 'STUDENT') {
                    return next((0, errorHandler_1.createError)('Only students can delete resumes', 403));
                }
                await prisma.studentProfile.update({
                    where: { userId: req.user.id },
                    data: { resumeUrl: null }
                });
                break;
            case 'logo':
                if (req.user.role !== 'EMPLOYER') {
                    return next((0, errorHandler_1.createError)('Only employers can delete logos', 403));
                }
                await prisma.employerProfile.update({
                    where: { userId: req.user.id },
                    data: { logo: null }
                });
                break;
            default:
                return next((0, errorHandler_1.createError)('Invalid file type', 400));
        }
        logger_1.default.info(`${type} deleted for user: ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            message: `${type} deleted successfully`
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting ${type}:`, error);
        return next((0, errorHandler_1.createError)(`Failed to delete ${type}`, 500));
    }
}));
router.use((error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'fail',
                message: 'File too large. Maximum size allowed is 10MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status: 'fail',
                message: 'Too many files. Maximum 5 files allowed.'
            });
        }
    }
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
    next(error);
});
exports.default = router;
//# sourceMappingURL=upload.js.map