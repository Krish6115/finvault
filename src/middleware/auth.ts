/**
 * ──────────────────────────────────────────────
 * FinVault — JWT Authentication Middleware
 * ──────────────────────────────────────────────
 *
 * Verifies the JWT token from the Authorization header,
 * loads the full user from the database, and attaches
 * the authenticated user to `req.user`.
 *
 * Why load the user from the database?
 * JWT tokens are stateless — they contain the user data
 * at the time of issuance. But a user's role or status
 * may change after the token was issued. By loading the
 * latest user record, we ensure that:
 *   1. Deactivated users are immediately blocked
 *   2. Role changes take effect without re-login
 *   3. Soft-deleted users cannot access the system
 *
 * Token format: Authorization: Bearer <token>
 *
 * Usage:
 *   router.get('/protected', authenticate, handler);
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiError';
import { AuthUser, Role, Status } from '../types';

/** Shape of the decoded JWT payload */
interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware.
 *
 * Extracts and verifies the JWT from the Authorization header,
 * fetches the current user state from the database, and
 * attaches it to the request for downstream handlers.
 *
 * Rejects the request if:
 *   - No token is provided
 *   - The token is invalid or expired
 *   - The user no longer exists (soft-deleted)
 *   - The user account is inactive
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Authentication required. Please provide a valid Bearer token.',
        401,
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token is missing.', 401);
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired. Please log in again.', 401);
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token. Please log in again.', 401);
      }
      throw new AppError('Token verification failed.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError('User account no longer exists.', 401);
    }

    if (user.status === 'INACTIVE') {
      throw new AppError(
        'Your account has been deactivated. Please contact an administrator.',
        403,
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      status: user.status as Status,
    };

    next();
  } catch (error) {
    next(error);
  }
}
