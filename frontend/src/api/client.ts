/**
 * Base fetch wrapper for the FastAPI backend.
 *
 * - Resolves base URL from `VITE_API_BASE_URL`, defaulting to localhost:8000
 *   for the dev workflow.
 * - Returns parsed JSON for any 2xx response; throws `ApiError` otherwise so
 *   callers can branch on `error.status` and the typed `error.detail` body.
 * - Accepts an optional `AbortSignal` so consumers (e.g. PhoneNumberInput's
 *   debounced lookup) can cancel in-flight requests on unmount or input change.
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** JSON-serializable body. */
  body?: unknown;
  /** Optional cancellation signal forwarded to fetch. */
  signal?: AbortSignal;
  /** Override base URL — exposed for tests. */
  baseUrl?: string;
}

function buildUrl(path: string, baseUrl: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const trimmedBase = baseUrl.replace(/\/$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

async function parseBody(response: Response): Promise<unknown> {
  // FastAPI returns JSON for both success and HTTPException details. Defensive:
  // on an empty body (204 etc.) treat as null.
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Issue an HTTP request and return the parsed JSON response.
 *
 * Throws {@link ApiError} for any non-2xx status; the body is surfaced via
 * `error.detail` so callers can read FastAPI's `{ detail: ... }` payload.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, signal, baseUrl = API_BASE_URL } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  let serializedBody: string | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    serializedBody = JSON.stringify(body);
  }

  const init: RequestInit = { method, headers };
  if (serializedBody !== undefined) init.body = serializedBody;
  if (signal !== undefined) init.signal = signal;

  const response = await fetch(buildUrl(path, baseUrl), init);
  const parsed = await parseBody(response);

  if (!response.ok) {
    // FastAPI conventionally wraps errors as `{ detail: ... }`. Surface the
    // inner detail so callers don't have to unwrap, but keep raw on the error
    // for cases where `detail` is itself a structured payload.
    const detail =
      parsed !== null && typeof parsed === 'object' && 'detail' in parsed
        ? (parsed as { detail: unknown }).detail
        : parsed;
    throw new ApiError(response.status, detail);
  }

  return parsed as T;
}
