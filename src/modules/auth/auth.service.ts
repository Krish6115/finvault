/**
 * ──────────────────────────────────────────────
 * FinVault — Auth Service
 * ──────────────────────────────────────────────
 *
 * Contains all authentication business logic:
 * user registration, login verification, and
 * current user retrieval.
 *
 * Why a separate service layer?
 * Controllers should only handle HTTP concerns
 * (parsing requests, sending responses). Business
 * logic belongs in services so it can be:
 *   1. Reused across different controllers or contexts
 *   2. Unit tested without HTTP overhead
 *   3. Kept independent of the transport layer
 *
 * Security decisions documented inline:
 *   - Passwords hashed with bcrypt (cost factor 12)
 *   - Role hardcoded to VIEWER on public registration
 *   - Soft-deleted users blocked from login
 *   - Password excluded from all user returns
 * ──────────────────────────────────────────────
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config';
import { AppError } from '../../utils/apiError';
import { RegisterInput, LoginInput } from './auth.schema';

/** Fields to return when exposing user data (password always excluded) */
const USER_SELECT_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Generates a signed JWT token for the given user.
 *
 * The token contains only the user's ID — role and status
 * are fetched fresh from the database on each authenticated
 * request (see auth middleware) to ensure changes take
 * effect immediately without requiring re-login.
 */
function generateToken(userId: string): string {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign({ id: userId }, env.JWT_SECRET, options);
}

/**
 * Registers a new user account.
 *
 * SECURITY: The role is hardcoded to VIEWER regardless of input.
 * Only an Admin can promote users to higher roles through the
 * user management endpoints. This prevents privilege escalation
 * through the public registration endpoint.
 *
 * @param input - Validated registration data (name, email, password)
 * @returns The created user data and a JWT token
 * @throws AppError(409) if the email is already registered
 */
export async function registerUser(input: RegisterInput) {
  const { name, email, password } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'VIEWER',   // Always VIEWER — no role from input
      status: 'ACTIVE',
    },
    select: USER_SELECT_FIELDS,
  });

  const token = generateToken(user.id);

  return { user, token };
}

/**
 * Authenticates a user with email and password.
 *
 * Security considerations:
 *   - Uses a generic "Invalid credentials" message for both
 *     wrong email and wrong password to prevent user enumeration
 *   - Checks for soft-deleted users (deletedAt is not null)
 *   - Checks for inactive accounts before allowing login
 *
 * @param input - Validated login data (email, password)
 * @returns The authenticated user data and a JWT token
 * @throws AppError(401) if credentials are invalid
 * @throws AppError(403) if the account is deactivated
 */
export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status === 'INACTIVE') {
    throw new AppError(
      'Your account has been deactivated. Please contact an administrator.',
      403,
    );
  }

  const token = generateToken(user.id);

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Retrieves the current authenticated user's profile.
 *
 * Called by the GET /me endpoint after JWT authentication.
 * The password is excluded from the response via the
 * select fields.
 *
 * @param userId - The authenticated user's ID (from JWT)
 * @returns The user's profile data
 * @throws AppError(404) if the user no longer exists
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: USER_SELECT_FIELDS,
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
}
