/**
 * User endpoints: create + lookup by phone.
 *
 * `lookupUser` smooths over the 404 case by resolving with `null` instead of
 * throwing — callers (e.g. PhoneNumberInput) treat "no record" as a valid
 * UI state, not an error. Other failure codes still throw {@link ApiError}.
 */

import { ApiError, request } from './client';
import type { CreateUserRequest, User } from './types';

export async function createUser(
  payload: CreateUserRequest,
  options: { signal?: AbortSignal } = {},
): Promise<User> {
  const init: { signal?: AbortSignal } = {};
  if (options.signal !== undefined) init.signal = options.signal;
  return request<User>('/users', {
    method: 'POST',
    body: {
      full_name: payload.fullName,
      phone_number: payload.phoneNumber,
    },
    ...init,
  });
}

export async function lookupUser(
  phone: string,
  options: { signal?: AbortSignal } = {},
): Promise<User | null> {
  const params = new URLSearchParams({ phone });
  try {
    const init: { signal?: AbortSignal } = {};
    if (options.signal !== undefined) init.signal = options.signal;
    return await request<User>(`/users/lookup?${params.toString()}`, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
