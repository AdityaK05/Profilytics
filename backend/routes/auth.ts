import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { body, validationResult } from 'express-validator'
import { catchAsync, createError } from '../middleware/errorHandler'
import { authMiddleware } from '../middleware/auth'
import logger from '../utils/logger'

const router = express.Router()
const prisma = new PrismaClient()

// JWT token generation
const signToken = (id: string, email: string, role: string) => {
  const secret = (process.env.JWT_SECRET || "changeme") as unknown as jwt.Secret
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  return jwt.sign({ id, email, role }, secret, { expiresIn })
}

const createSendToken = (user: any, statusCode: number, res: express.Response) => {
  const token = signToken(user.id, user.email, user.role)
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  }

  res.cookie('jwt', token, cookieOptions)

  // Remove password from output
  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  })
}

// Validation middleware
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('role').isIn(['STUDENT', 'EMPLOYER']).withMessage('Role must be either STUDENT or EMPLOYER'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
]

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', signupValidation, catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { email, password, role, firstName, lastName } = req.body

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return next(createError('User with this email already exists', 400))
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS!) || 12)

  // Create the user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
    },
  })

  logger.info(`New user registered: ${email} with role ${role}`)

  createSendToken(user, 201, res)
}))

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { email, password } = req.body

  // Find user and include profile data
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      studentProfile: true,
      employerProfile: true,
    },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(createError('Incorrect email or password', 401))
  }

  logger.info(`User logged in: ${email}`)

  createSendToken(user, 200, res)
}))

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  logger.info(`User logged out: ${req.user.email}`)

  res.status(200).json({ status: 'success' })
}))

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, catchAsync(async (req, res) => {
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
  })

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  })
}))

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
router.patch('/profile', authMiddleware, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone('any'),
  body('location').optional().trim(),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'location', 'timezone']
  const updateData: any = {}

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field]
    }
  })

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    include: {
      studentProfile: true,
      employerProfile: true,
    },
  })

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  })
}))

// @desc    Create/Update student profile
// @route   POST /api/auth/student-profile
// @access  Private (Students only)
router.post('/student-profile', authMiddleware, [
  body('university').optional().trim(),
  body('major').optional().trim(),
  body('graduationYear').optional().isInt({ min: 2020, max: 2030 }),
  body('gpa').optional().isFloat({ min: 0, max: 4.0 }),
], catchAsync(async (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return next(createError('Only students can create student profiles', 403))
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const {
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
  } = req.body

  // Create or update student profile
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
  })

  res.status(200).json({
    status: 'success',
    data: {
      profile: studentProfile,
    },
  })
}))

// @desc    Create/Update employer profile
// @route   POST /api/auth/employer-profile
// @access  Private (Employers only)
router.post('/employer-profile', authMiddleware, [
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('industry').optional().trim(),
  body('companySize').optional().trim(),
  body('website').optional().isURL(),
], catchAsync(async (req, res, next) => {
  if (req.user.role !== 'EMPLOYER') {
    return next(createError('Only employers can create employer profiles', 403))
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const {
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
  } = req.body

  // Create or update employer profile
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
  })

  res.status(200).json({
    status: 'success',
    data: {
      profile: employerProfile,
    },
  })
}))

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
router.patch('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { currentPassword, newPassword } = req.body

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  })

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return next(createError('Current password is incorrect', 401))
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS!) || 12)

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  })

  logger.info(`Password changed for user: ${req.user.email}`)

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  })
}))

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
router.delete('/account', authMiddleware, [
  body('password').notEmpty().withMessage('Password confirmation is required'),
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400))
  }

  const { password } = req.body

  // Verify password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(createError('Password is incorrect', 401))
  }

  // Delete user (cascade will handle related data)
  await prisma.user.delete({
    where: { id: req.user.id },
  })

  logger.info(`Account deleted for user: ${req.user.email}`)

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully',
  })
}))

export default router 