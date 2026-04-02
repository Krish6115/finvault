/**
 * ──────────────────────────────────────────────
 * FinVault — User Service
 * ──────────────────────────────────────────────
 *
 * Business logic for user management operations.
 * All functions in this module are intended for
 * Admin-only access, enforced at the route level.
 *
 * Key design decisions:
 *   - Password is NEVER included in any response
 *   - Soft-deleted users are excluded from listings
 *   - Soft delete preserves audit trails while
 *     disabling user access
 *   - Offset-based pagination for simplicity and
 *     compatibility with frontend table components
 *   - Self-deletion is prevented to avoid orphaned data
 * ──────────────────────────────────────────────
 */

import { prisma } from '../../config/database';
import { AppError } from '../../utils/apiError';
import { GetUsersQuery, UpdateUserInput } from './user.schema';
import { PaginationMeta } from '../../types';

/**
 * Fields to select when returning user data.
 * Password is explicitly excluded for security.
 */
const USER_SAFE_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Retrieves a paginated list of all active (non-deleted) users.
 *
 * Uses offset-based pagination (page + limit) which maps
 * naturally to table-based UI components. The total count
 * and page metadata are included for frontend navigation.
 *
 * @param query - Validated pagination parameters (page, limit)
 * @returns Paginated user list with metadata
 */
export async function getUsers(query: GetUsersQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  // Run count and data queries in parallel for performance
  const [total, users] = await Promise.all([
    prisma.user.count({
      where: { deletedAt: null },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: USER_SAFE_FIELDS,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return { users, meta };
}

/**
 * Retrieves a single user by their ID.
 *
 * Only returns non-deleted users. Throws a 404 if the user
 * doesn't exist or has been soft-deleted.
 *
 * @param id - The user's UUID
 * @returns The user's profile data (without password)
 * @throws AppError(404) if user not found
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: USER_SAFE_FIELDS,
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
}

/**
 * Updates a user's role or status.
 *
 * Only the fields provided in the input are updated —
 * Prisma ignores undefined fields in the data object.
 *
 * Prevents self-modification to avoid an Admin accidentally
 * removing their own access or locking themselves out.
 *
 * @param id          - The target user's UUID
 * @param input       - Fields to update (role, status)
 * @param requesterId - The ID of the Admin making the change
 * @returns The updated user data
 * @throws AppError(404) if user not found
 * @throws AppError(400) if trying to modify own account
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
  requesterId: string,
) {
  // Prevent admins from modifying their own role/status
  if (id === requesterId) {
    throw new AppError(
      'You cannot modify your own role or status. Ask another admin.',
      400,
    );
  }

  // Verify the target user exists and is not deleted
  const existingUser = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existingUser) {
    throw new AppError('User not found.', 404);
  }

  // Update only the provided fields
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(input.role && { role: input.role }),
      ...(input.status && { status: input.status }),
    },
    select: USER_SAFE_FIELDS,
  });

  return updatedUser;
}

/**
 * Soft-deletes a user by setting their deletedAt timestamp
 * and changing their status to INACTIVE.
 *
 * Why soft delete?
 * In financial systems, hard-deleting user records would
 * break referential integrity with financial records and
 * destroy audit trails. Soft deletion preserves the data
 * while effectively disabling the user's access.
 *
 * What happens after soft delete:
 *   1. User is excluded from all list queries (deletedAt filter)
 *   2. Login is blocked (deletedAt check in auth service)
 *   3. Active JWT tokens are invalidated (auth middleware DB check)
 *   4. Financial records remain intact for auditing
 *
 * @param id          - The target user's UUID
 * @param requesterId - The ID of the Admin performing the deletion
 * @returns The soft-deleted user data
 * @throws AppError(404) if user not found
 * @throws AppError(400) if trying to delete own account
 */
export async function deleteUser(id: string, requesterId: string) {
  // Prevent admins from deleting themselves
  if (id === requesterId) {
    throw new AppError(
      'You cannot delete your own account. Ask another admin.',
      400,
    );
  }

  // Verify the target user exists and is not already deleted
  const existingUser = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existingUser) {
    throw new AppError('User not found.', 404);
  }

  // Soft delete: mark as deleted and deactivate
  const deletedUser = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'INACTIVE',
    },
    select: USER_SAFE_FIELDS,
  });

  return deletedUser;
}
