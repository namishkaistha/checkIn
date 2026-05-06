/**
 * Check-in batch endpoints.
 *
 * The 422 from POST /check-ins/{id}/approve is special-cased into a typed
 * {@link ApproveBlockedError}: the UI needs to render the blocked rows so the
 * volunteer can choose to approve anyway, so we attach `rows` directly to the
 * error rather than forcing each caller to re-parse `error.detail`.
 */

import { ApiError, request } from './client';
import type {
  ApproveBatchRequest,
  ApproveBlockedDetail,
  CheckInBatch,
  CheckInBatchApproved,
  CheckInRow,
  CreateBatchRequest,
} from './types';

/**
 * Thrown when POST /check-ins/{id}/approve returns 422 because one or more
 * recipients are within the dedup window. Carries the rows that triggered
 * the block so the UI can show "approve anyway".
 */
export class ApproveBlockedError extends ApiError {
  rows: CheckInRow[];
  apiMessage: string;

  constructor(detail: ApproveBlockedDetail) {
    super(422, detail, detail.message);
    this.name = 'ApproveBlockedError';
    this.rows = detail.rows;
    this.apiMessage = detail.message;
  }
}

function isApproveBlockedDetail(value: unknown): value is ApproveBlockedDetail {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['message'] === 'string' &&
    Array.isArray(obj['rows'])
  );
}

export async function createBatch(
  payload: CreateBatchRequest,
  options: { signal?: AbortSignal } = {},
): Promise<CheckInBatch> {
  const init: { signal?: AbortSignal } = {};
  if (options.signal !== undefined) init.signal = options.signal;
  return request<CheckInBatch>('/check-ins', {
    method: 'POST',
    body: {
      picked_up_by_phone: payload.pickedUpByPhone,
      also_for_phones: payload.alsoForPhones,
    },
    ...init,
  });
}

export async function approveBatch(
  batchId: string,
  payload: ApproveBatchRequest,
  options: { signal?: AbortSignal } = {},
): Promise<CheckInBatchApproved> {
  const init: { signal?: AbortSignal } = {};
  if (options.signal !== undefined) init.signal = options.signal;
  try {
    return await request<CheckInBatchApproved>(
      `/check-ins/${encodeURIComponent(batchId)}/approve`,
      {
        method: 'POST',
        body: { override: payload.override },
        ...init,
      },
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 422 &&
      isApproveBlockedDetail(error.detail)
    ) {
      throw new ApproveBlockedError(error.detail);
    }
    throw error;
  }
}

/**
 * Returns either a pending {@link CheckInBatch} or an approved
 * {@link CheckInBatchApproved}. Discriminate by the presence of `approved_at`.
 */
export async function getBatch(
  batchId: string,
  options: { signal?: AbortSignal } = {},
): Promise<CheckInBatch | CheckInBatchApproved> {
  const init: { signal?: AbortSignal } = {};
  if (options.signal !== undefined) init.signal = options.signal;
  return request<CheckInBatch | CheckInBatchApproved>(
    `/check-ins/${encodeURIComponent(batchId)}`,
    init,
  );
}
