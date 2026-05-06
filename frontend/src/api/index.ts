/**
 * Public API surface for the FastAPI backend client.
 *
 * Consumers should import from `@/api` (or `../api`) — never from the
 * individual files — so that this barrel can hide internals when needed.
 */

export { ApiError, API_BASE_URL, request } from './client';
export type { RequestOptions } from './client';

export { createUser, lookupUser } from './users';
export { createBatch, approveBatch, getBatch, ApproveBlockedError } from './checkIns';

export type {
  ApproveBatchRequest,
  ApproveBlockedDetail,
  CheckInBatch,
  CheckInBatchApproved,
  CheckInRow,
  CreateBatchRequest,
  CreateUserRequest,
  User,
} from './types';
