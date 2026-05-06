import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from './client';
import { createUser, lookupUser } from './users';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

describe('users API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createUser', () => {
    it('POSTs snake_case body and resolves with the created user (201)', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(201, {
          id: 'u1',
          full_name: 'Jane Doe',
          phone_number: '+15551234567',
          created_at: '2026-01-01T00:00:00Z',
        }),
      );

      const user = await createUser({
        fullName: 'Jane Doe',
        phoneNumber: '+15551234567',
      });

      expect(user.id).toBe('u1');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/users');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({
        full_name: 'Jane Doe',
        phone_number: '+15551234567',
      });
    });

    it('throws ApiError(400) for invalid phone', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(400, { detail: 'Invalid phone number' }),
      );

      await expect(
        createUser({ fullName: 'Jane', phoneNumber: 'bad' }),
      ).rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        detail: 'Invalid phone number',
      });
    });

    it('throws ApiError(409) for duplicates', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(409, { detail: 'User with this phone number already exists' }),
      );

      const error = await createUser({
        fullName: 'Jane',
        phoneNumber: '+15551234567',
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
    });
  });

  describe('lookupUser', () => {
    it('returns the user on 200', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          id: 'u1',
          full_name: 'Jane Doe',
          phone_number: '+15551234567',
          created_at: '2026-01-01T00:00:00Z',
        }),
      );

      const user = await lookupUser('+15551234567');
      expect(user?.full_name).toBe('Jane Doe');

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        'http://localhost:8000/users/lookup?phone=%2B15551234567',
      );
    });

    it('resolves to null on 404 (instead of throwing)', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(404, { detail: 'User not found' }),
      );

      const user = await lookupUser('+15550000000');
      expect(user).toBeNull();
    });

    it('throws ApiError on 400 (invalid phone)', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(400, { detail: 'Invalid phone number' }),
      );

      await expect(lookupUser('garbage')).rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
      });
    });

    it('forwards an AbortSignal to fetch', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(404, { detail: 'nope' }));

      const controller = new AbortController();
      await lookupUser('+15551234567', { signal: controller.signal });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.signal).toBe(controller.signal);
    });
  });
});
