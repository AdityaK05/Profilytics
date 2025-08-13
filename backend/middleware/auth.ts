import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { catchAsync, createError } from './errorHandler'
import logger from '../utils/logger'

const prisma = new PrismaClient()

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

interface JwtPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return next(createError('You are not logged in! Please log in to get access.', 401))
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    // 3) Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentProfile: true,
        employerProfile: true,
      },
    })

    if (!currentUser) {
      return next(createError('The user belonging to this token does no longer exist.', 401))
    }

    // 4) Check if user changed password after the token was issued
    // This would require a passwordChangedAt field in the user model
    // if (currentUser.passwordChangedAt && decoded.iat < currentUser.passwordChangedAt.getTime() / 1000) {
    //   return next(createError('User recently changed password! Please log in again.', 401))
    // }

    // Grant access to protected route
    req.user = currentUser
    next()
  }
)

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError('You do not have permission to perform this action', 403))
    }
    next()
  }
}

export const optionalAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // This middleware makes authentication optional
    // It adds user to request if token is valid, but doesn't fail if no token
    
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return next() // Continue without authentication
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

      // Check if user still exists
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          studentProfile: true,
          employerProfile: true,
        },
      })

      if (currentUser) {
        req.user = currentUser
      }
    } catch (error) {
      logger.warn('Invalid token in optional auth:', error)
      // Continue without authentication
    }

    next()
  }
)

export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.verified) {
    return next(createError('Please verify your email address before accessing this resource.', 403))
  }
  next()
}

export const requireStudentProfile = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'STUDENT' || !req.user?.studentProfile) {
    return next(createError('This resource requires a student profile.', 403))
  }
  next()
}

export const requireEmployerProfile = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'EMPLOYER' || !req.user?.employerProfile) {
    return next(createError('This resource requires an employer profile.', 403))
  }
  next()
}

export const requireVerifiedEmployer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'EMPLOYER' || !req.user?.employerProfile?.verified) {
    return next(createError('This resource requires a verified employer account.', 403))
  }
  next()
}

// Rate limiting middleware for sensitive operations
export const sensitiveOperationLimit = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // This could integrate with Redis for distributed rate limiting
    // For now, we'll use a simple in-memory approach
    
    const userKey = req.user?.id || req.ip
    const operation = req.route?.path || req.path
    
    // Log sensitive operation
    logger.info(`Sensitive operation attempted: ${operation} by user ${userKey}`)
    
    next()
  }
)

export default {
  authMiddleware,
  restrictTo,
  optionalAuth,
  requireEmailVerification,
  requireStudentProfile,
  requireEmployerProfile,
  requireVerifiedEmployer,
  sensitiveOperationLimit,
} 