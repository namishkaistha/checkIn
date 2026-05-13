import { describe, it, expect } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';
import {
  CheckInSessionProvider,
  useCheckInSession,
} from './CheckInSessionContext';
import type { User } from '../api/types';

function makeUser(id: string, name = `User ${id}`): User {
  return {
    id,
    full_name: name,
    phone_number: `+1415555${id.padStart(4, '0')}`,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <CheckInSessionProvider>{children}</CheckInSessionProvider>;
}

describe('CheckInSessionProvider', () => {
  it('renders its children', () => {
    render(
      <CheckInSessionProvider>
        <p data-testid="child">hello</p>
      </CheckInSessionProvider>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('hello');
  });

  it('starts with a null primary and an empty additionalUsers list', () => {
    const { result } = renderHook(() => useCheckInSession(), { wrapper });
    expect(result.current.primaryUser).toBeNull();
    expect(result.current.additionalUsers).toEqual([]);
  });

  it('setPrimary updates the primary user', () => {
    const { result } = renderHook(() => useCheckInSession(), { wrapper });
    const u = makeUser('1');
    act(() => {
      result.current.setPrimary(u);
    });
    expect(result.current.primaryUser).toEqual(u);
  });

  it('addAdditional appends and dedupes by id', () => {
    const { result } = renderHook(() => useCheckInSession(), { wrapper });
    const u1 = makeUser('1');
    const u2 = makeUser('2');
    act(() => {
      result.current.addAdditional(u1);
      result.current.addAdditional(u2);
      // Same id again — should be a no-op.
      result.current.addAdditional(makeUser('1', 'Different Name'));
    });
    expect(result.current.additionalUsers).toHaveLength(2);
    expect(result.current.additionalUsers.map((u) => u.id)).toEqual(['1', '2']);
  });

  it('removeAdditional filters by id', () => {
    const { result } = renderHook(() => useCheckInSession(), { wrapper });
    const u1 = makeUser('1');
    const u2 = makeUser('2');
    act(() => {
      result.current.addAdditional(u1);
      result.current.addAdditional(u2);
      result.current.removeAdditional('1');
    });
    expect(result.current.additionalUsers).toEqual([u2]);
  });

  it('reset clears primary and additionalUsers', () => {
    const { result } = renderHook(() => useCheckInSession(), { wrapper });
    act(() => {
      result.current.setPrimary(makeUser('p'));
      result.current.addAdditional(makeUser('a'));
      result.current.reset();
    });
    expect(result.current.primaryUser).toBeNull();
    expect(result.current.additionalUsers).toEqual([]);
  });

  it('useCheckInSession throws when called outside the provider', () => {
    // renderHook surfaces hook-thrown errors via result.error; we use a
    // try/catch around a direct render of a probe component to assert the
    // specific message rather than rely on renderHook internals.
    function Probe() {
      useCheckInSession();
      return null;
    }
    // Swallow the expected console.error React emits for the boundary.
    const originalError = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Probe />)).toThrow(
        'useCheckInSession must be used within a CheckInSessionProvider',
      );
    } finally {
      console.error = originalError;
    }
  });

  it('has no a11y violations on a minimal consumer tree', async () => {
    function Consumer() {
      const session = useCheckInSession();
      return (
        <main>
          <h1>Session</h1>
          <p>Primary: {session.primaryUser ? session.primaryUser.full_name : 'none'}</p>
          <p>Additional: {session.additionalUsers.length}</p>
        </main>
      );
    }
    const { container } = render(
      <CheckInSessionProvider>
        <Consumer />
      </CheckInSessionProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
