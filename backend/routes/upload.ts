import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { catchAsync, createError } from '../middleware/errorHandler'
import { authMiddleware } from '../middleware/auth'
import logger from '../utils/logger'

const router = express.Router()
const prisma = new PrismaClient()

// Configure multer for file uploads
const storage = multer.memoryStorage()

const fileFilter = (req: any, file: any, cb: any) => {
  // Define allowed file types
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  }

  if (allowedTypes[file.mimetype as keyof typeof allowedTypes]) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
})

// Helper function to generate unique filename
const generateFileName = (originalName: string, prefix: string = '') => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const extension = path.extname(originalName)
  return `${prefix}${timestamp}-${random}${extension}`
}

// Helper function to upload to cloud storage (AWS S3 simulation)
async function uploadToCloudStorage(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  // In a real implementation, this would upload to AWS S3, Google Cloud Storage, etc.
  // For demo purposes, we'll simulate cloud upload and return a URL
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Return simulated cloud URL
  return `https://profilytics-uploads.s3.amazonaws.com/${fileName}`
}

// @desc    Upload profile picture
// @route   POST /api/upload/avatar
// @access  Private
router.post('/avatar', authMiddleware, upload.single('avatar'), catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded', 400))
  }

  try {
    // Process image with sharp (resize, optimize)
    const processedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Generate filename
    const fileName = generateFileName(req.file.originalname, 'avatar-')

    // Upload to cloud storage
    const imageUrl = await uploadToCloudStorage(processedBuffer, fileName, 'image/jpeg')

    // Update user profile
    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: imageUrl }
    })

    logger.info(`Avatar uploaded for user: ${req.user.id}`)

    res.status(200).json({
      status: 'success',
      data: {
        url: imageUrl,
        message: 'Avatar uploaded successfully'
      }
    })

  } catch (error) {
    logger.error('Avatar upload error:', error)
    return next(createError('Failed to process and upload avatar', 500))
  }
}))

// @desc    Upload resume
// @route   POST /api/upload/resume
// @access  Private (Students only)
router.post('/resume', authMiddleware, upload.single('resume'), catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded', 400))
  }

  if (req.user.role !== 'STUDENT') {
    return next(createError('Only students can upload resumes', 403))
  }

  try {
    // Generate filename
    const fileName = generateFileName(req.file.originalname, 'resume-')

    // Upload to cloud storage
    const resumeUrl = await uploadToCloudStorage(req.file.buffer, fileName, req.file.mimetype)

    // Update student profile
    await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data: { resumeUrl }
    })

    // Track analytics
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
    }).catch(() => {}) // Fail silently

    logger.info(`Resume uploaded for user: ${req.user.id}`)

    res.status(200).json({
      status: 'success',
      data: {
        url: resumeUrl,
        message: 'Resume uploaded successfully'
      }
    })

  } catch (error) {
    logger.error('Resume upload error:', error)
    return next(createError('Failed to upload resume', 500))
  }
}))

// @desc    Upload company logo
// @route   POST /api/upload/logo
// @access  Private (Employers only)
router.post('/logo', authMiddleware, upload.single('logo'), catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded', 400))
  }

  if (req.user.role !== 'EMPLOYER') {
    return next(createError('Only employers can upload company logos', 403))
  }

  try {
    // Process image with sharp (resize, optimize)
    const processedBuffer = await sharp(req.file.buffer)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 90 })
      .toBuffer()

    // Generate filename
    const fileName = generateFileName(req.file.originalname, 'logo-')

    // Upload to cloud storage
    const logoUrl = await uploadToCloudStorage(processedBuffer, fileName, 'image/png')

    // Update employer profile
    await prisma.employerProfile.update({
      where: { userId: req.user.id },
      data: { logo: logoUrl }
    })

    logger.info(`Company logo uploaded for user: ${req.user.id}`)

    res.status(200).json({
      status: 'success',
      data: {
        url: logoUrl,
        message: 'Company logo uploaded successfully'
      }
    })

  } catch (error) {
    logger.error('Logo upload error:', error)
    return next(createError('Failed to process and upload logo', 500))
  }
}))

// @desc    Upload project images
// @route   POST /api/upload/project-image
// @access  Private (Students only)
router.post('/project-image', authMiddleware, upload.single('image'), catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded', 400))
  }

  if (req.user.role !== 'STUDENT') {
    return next(createError('Only students can upload project images', 403))
  }

  try {
    // Process image with sharp (resize, optimize)
    const processedBuffer = await sharp(req.file.buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Generate filename
    const fileName = generateFileName(req.file.originalname, 'project-')

    // Upload to cloud storage
    const imageUrl = await uploadToCloudStorage(processedBuffer, fileName, 'image/jpeg')

    logger.info(`Project image uploaded for user: ${req.user.id}`)

    res.status(200).json({
      status: 'success',
      data: {
        url: imageUrl,
        message: 'Project image uploaded successfully'
      }
    })

  } catch (error) {
    logger.error('Project image upload error:', error)
    return next(createError('Failed to process and upload project image', 500))
  }
}))

// @desc    Upload verification documents (for employers)
// @route   POST /api/upload/verification
// @access  Private (Employers only)
router.post('/verification', authMiddleware, upload.single('document'), catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded', 400))
  }

  if (req.user.role !== 'EMPLOYER') {
    return next(createError('Only employers can upload verification documents', 403))
  }

  try {
    // Generate filename
    const fileName = generateFileName(req.file.originalname, 'verification-')

    // Upload to cloud storage
    const documentUrl = await uploadToCloudStorage(req.file.buffer, fileName, req.file.mimetype)

    // Update employer profile
    await prisma.employerProfile.update({
      where: { userId: req.user.id },
      data: { verificationDoc: documentUrl }
    })

    // Create notification for admin review
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

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
      }).catch(() => {}) // Fail silently
    }

    logger.info(`Verification document uploaded for employer: ${req.user.id}`)

    res.status(200).json({
      status: 'success',
      data: {
        url: documentUrl,
        message: 'Verification document uploaded successfully. It will be reviewed by our team.'
      }
    })

  } catch (error) {
    logger.error('Verification document upload error:', error)
    return next(createError('Failed to upload verification document', 500))
  }
}))

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple', authMiddleware, upload.array('files', 5), catchAsync(async (req, res, next) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next(createError('No files uploaded', 400))
  }

  try {
    const uploadPromises = req.files.map(async (file) => {
      let processedBuffer = file.buffer
      let contentType = file.mimetype

      // Process images
      if (file.mimetype.startsWith('image/')) {
        processedBuffer = await sharp(file.buffer)
          .resize(1200, 800, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer()
        contentType = 'image/jpeg'
      }

      const fileName = generateFileName(file.originalname, 'multi-')
      const url = await uploadToCloudStorage(processedBuffer, fileName, contentType)

      return {
        originalName: file.originalname,
        url,
        size: file.size,
        type: file.mimetype
      }
    })

    const uploadedFiles = await Promise.all(uploadPromises)

    logger.info(`Multiple files uploaded for user: ${req.user.id}, count: ${uploadedFiles.length}`)

    res.status(200).json({
      status: 'success',
      data: {
        files: uploadedFiles,
        message: `${uploadedFiles.length} files uploaded successfully`
      }
    })

  } catch (error) {
    logger.error('Multiple files upload error:', error)
    return next(createError('Failed to upload files', 500))
  }
}))

// @desc    Get upload statistics
// @route   GET /api/upload/stats
// @access  Private
router.get('/stats', authMiddleware, catchAsync(async (req, res) => {
  const userId = req.user.id
  const { period = '30' } = req.query
  
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - parseInt(period as string))

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
  })

  const totalUploads = uploadStats.reduce((sum, stat) => sum + stat._count, 0)

  res.status(200).json({
    status: 'success',
    data: {
      totalUploads,
      uploadsByType: uploadStats,
      period: `${period} days`
    }
  })
}))

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:type
// @access  Private
router.delete('/:type', authMiddleware, catchAsync(async (req, res, next) => {
  const { type } = req.params

  try {
    switch (type) {
      case 'avatar':
        await prisma.user.update({
          where: { id: req.user.id },
          data: { avatar: null }
        })
        break

      case 'resume':
        if (req.user.role !== 'STUDENT') {
          return next(createError('Only students can delete resumes', 403))
        }
        await prisma.studentProfile.update({
          where: { userId: req.user.id },
          data: { resumeUrl: null }
        })
        break

      case 'logo':
        if (req.user.role !== 'EMPLOYER') {
          return next(createError('Only employers can delete logos', 403))
        }
        await prisma.employerProfile.update({
          where: { userId: req.user.id },
          data: { logo: null }
        })
        break

      default:
        return next(createError('Invalid file type', 400))
    }

    logger.info(`${type} deleted for user: ${req.user.id}`)

    res.status(200).json({
      status: 'success',
      message: `${type} deleted successfully`
    })

  } catch (error) {
    logger.error(`Error deleting ${type}:`, error)
    return next(createError(`Failed to delete ${type}`, 500))
  }
}))

// Error handling middleware for multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'fail',
        message: 'File too large. Maximum size allowed is 10MB.'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'fail',
        message: 'Too many files. Maximum 5 files allowed.'
      })
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'fail',
      message: error.message
    })
  }

  next(error)
})

export default router 