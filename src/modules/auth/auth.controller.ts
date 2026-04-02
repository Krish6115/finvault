/**
 * ──────────────────────────────────────────────
 * FinVault — Auth Controller
 * ──────────────────────────────────────────────
 *
 * Handles HTTP request/response for authentication
 * endpoints. Each handler delegates business logic
 * to the auth service and formats the response using
 * the standardized ApiResponse utility.
 *
 * Why wrap handlers in try/catch?
 * Express does not automatically catch errors in async
 * handlers. Without try/catch, unhandled promise rejections
 * would crash the server instead of returning a proper
 * error response. Each handler catches errors and forwards
 * them to the global error handler via next().
 * ──────────────────────────────────────────────
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/apiError';
import * as authService from './auth.service';

/**
 * POST /api/v1/auth/register
 *
 * Creates a new user account with VIEWER role.
 * Returns the user profile and a JWT token for
 * immediate authenticated access.
 *
 * Status 201: Account created successfully
 * Status 409: Email already registered (from service)
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user, token } = await authService.registerUser(req.body);

    res.status(201).json(
      ApiResponse.success('Account created successfully.', { user, token }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticates a user with email and password.
 * Returns the user profile and a fresh JWT token.
 *
 * Status 200: Login successful
 * Status 401: Invalid credentials (from service)
 * Status 403: Account deactivated (from service)
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user, token } = await authService.loginUser(req.body);

    res.status(200).json(
      ApiResponse.success('Login successful.', { user, token }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Requires a valid JWT token in the Authorization header.
 *
 * Status 200: Profile retrieved successfully
 * Status 401: Not authenticated (from auth middleware)
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.user is guaranteed to exist here because the
    // authenticate middleware runs before this handler
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json(
      ApiResponse.success('User profile retrieved.', { user }),
    );
  } catch (error) {
    next(error);
  }
}
