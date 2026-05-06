/**
 * TypeScript types mirroring backend Pydantic schemas.
 *
 * Source: ../../backend/app/schemas.py — keep in sync if the backend
 * contract changes. ISO-8601 datetime strings are returned verbatim from
 * FastAPI; we keep them as `string` here rather than parsing eagerly.
 */

export interface User {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

export interface CheckInRow {
  user: User;
  blocked: boolean;
  last_check_in_at: string | null;
}

/** Pending batch returned from POST /check-ins (and GET while pending). */
export interface CheckInBatch {
  batch_id: string;
  rows: CheckInRow[];
  any_blocked: boolean;
}

/** Approved batch returned from POST /check-ins/{id}/approve and GET when approved. */
export interface CheckInBatchApproved {
  batch_id: string;
  rows: CheckInRow[];
  approved_at: string;
}

// ---------- Request types ---------------------------------------------------

export interface CreateUserRequest {
  fullName: string;
  phoneNumber: string;
}

export interface CreateBatchRequest {
  pickedUpByPhone: string;
  alsoForPhones: string[];
}

export interface ApproveBatchRequest {
  override: boolean;
}

// ---------- Error helpers ---------------------------------------------------

/** Shape of the 422 detail returned by POST /check-ins/{id}/approve. */
export interface ApproveBlockedDetail {
  message: string;
  rows: CheckInRow[];
}
