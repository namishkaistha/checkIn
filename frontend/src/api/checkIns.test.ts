import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from './client';
import { approveBatch, ApproveBlockedError, createBatch, getBatch } from './checkIns';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

const userJane = {
  id: 'u1',
  full_name: 'Jane Doe',
  phone_number: '+15551234567',
  created_at: '2026-01-01T00:00:00Z',
};

describe('checkIns API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createBatch', () => {
    it('POSTs snake_case body and returns the pending batch', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(201, {
          batch_id: 'b1',
          rows: [{ user: userJane, blocked: false, last_check_in_at: null }],
          any_blocked: false,
        }),
      );

      const batch = await createBatch({
        pickedUpByPhone: '+15551234567',
        alsoForPhones: ['+15557654321'],
      });

      expect(batch.batch_id).toBe('b1');
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/check-ins');
      expect(JSON.parse(init.body as string)).toEqual({
        picked_up_by_phone: '+15551234567',
        also_for_phones: ['+15557654321'],
      });
    });

    it('throws ApiError(400) for invalid phone', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(400, { detail: 'Invalid phone number' }),
      );

      await expect(
        createBatch({ pickedUpByPhone: 'bad', alsoForPhones: [] }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('throws ApiError(404) when recipient not registered', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(404, { detail: 'Recipient not registered' }),
      );

      await expect(
        createBatch({ pickedUpByPhone: '+15550000000', alsoForPhones: [] }),
      ).rejects.toMatchObject({
        status: 404,
        detail: 'Recipient not registered',
      });
    });
  });

  describe('approveBatch', () => {
    it('POSTs override and returns the approved batch on 200', async () => {
      const approved = {
        batch_id: 'b1',
        rows: [{ user: userJane, blocked: false, last_check_in_at: null }],
        approved_at: '2026-01-02T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(200, approved));

      const result = await approveBatch('b1', { override: false });
      expect(result).toEqual(approved);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/check-ins/b1/approve');
      expect(JSON.parse(init.body as string)).toEqual({ override: false });
    });

    it('throws ApproveBlockedError with rows on 422', async () => {
      const blockedRows = [
        {
          user: userJane,
          blocked: true,
          last_check_in_at: '2026-01-01T00:00:00Z',
        },
      ];
      fetchMock.mockResolvedValueOnce(
        jsonResponse(422, {
          detail: {
            message: 'One or more recipients are within the 7-day window.',
            rows: blockedRows,
          },
        }),
      );

      const error = await approveBatch('b1', { override: false }).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ApproveBlockedError);
      expect(error).toBeInstanceOf(ApiError);
      const blocked = error as ApproveBlockedError;
      expect(blocked.status).toBe(422);
      expect(blocked.rows).toEqual(blockedRows);
      expect(blocked.apiMessage).toContain('7-day window');
    });

    it('throws plain ApiError(404) for unknown batch', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(404, { detail: 'Batch not found' }),
      );

      const error = await approveBatch('missing', { override: true }).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ApiError);
      expect(error).not.toBeInstanceOf(ApproveBlockedError);
      expect((error as ApiError).status).toBe(404);
    });

    it('url-encodes the batch id', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          batch_id: 'a/b',
          rows: [],
          approved_at: '2026-01-02T00:00:00Z',
        }),
      );
      await approveBatch('a/b', { override: false });
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/check-ins/a%2Fb/approve');
    });
  });

  describe('getBatch', () => {
    it('returns a pending batch shape', async () => {
      const pending = {
        batch_id: 'b1',
        rows: [{ user: userJane, blocked: false, last_check_in_at: null }],
        any_blocked: false,
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(200, pending));

      const result = await getBatch('b1');
      expect(result).toEqual(pending);
    });

    it('returns an approved batch shape', async () => {
      const approved = {
        batch_id: 'b1',
        rows: [{ user: userJane, blocked: false, last_check_in_at: null }],
        approved_at: '2026-01-02T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(200, approved));

      const result = await getBatch('b1');
      expect('approved_at' in result).toBe(true);
    });

    it('throws ApiError(404) for unknown batch', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(404, { detail: 'Batch not found' }),
      );

      await expect(getBatch('missing')).rejects.toMatchObject({ status: 404 });
    });
  });
});
