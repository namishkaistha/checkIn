import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../api/types';

/**
 * Wizard-scoped session state shared across the `/check-in/*` routes. The
 * provider is mounted by `CheckInSessionRoute` (a route-level wrapper) and
 * torn down whenever the user navigates out of the wizard, so refreshing
 * mid-wizard or backing out resets the state by design. The shape carries
 * only what the wizard needs to reconstruct a check-in batch: the primary
 * recipient and any additional household members.
 */
export interface CheckInSessionValue {
  primaryUser: User | null;
  additionalUsers: User[];
  setPrimary: (u: User) => void;
  addAdditional: (u: User) => void;
  /**
   * Remove a household member by their `User.id`. `User.id` is a string
   * (matches the FastAPI schema), even though the planning doc described
   * it as a number; the implementation tracks the real shape.
   */
  removeAdditional: (userId: string) => void;
  reset: () => void;
}

const CheckInSessionContext = createContext<CheckInSessionValue | null>(null);

export interface CheckInSessionProviderProps {
  children: ReactNode;
}

export function CheckInSessionProvider({
  children,
}: CheckInSessionProviderProps) {
  const [primaryUser, setPrimaryUser] = useState<User | null>(null);
  const [additionalUsers, setAdditionalUsers] = useState<User[]>([]);

  const setPrimary = useCallback((u: User) => {
    setPrimaryUser(u);
  }, []);

  const addAdditional = useCallback((u: User) => {
    // Dedup by id — adding the same person twice (e.g. by re-entering
    // their phone number) is a no-op rather than a duplicate row.
    setAdditionalUsers((prev) =>
      prev.some((existing) => existing.id === u.id) ? prev : [...prev, u],
    );
  }, []);

  const removeAdditional = useCallback((userId: string) => {
    setAdditionalUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const reset = useCallback(() => {
    setPrimaryUser(null);
    setAdditionalUsers([]);
  }, []);

  const value = useMemo<CheckInSessionValue>(
    () => ({
      primaryUser,
      additionalUsers,
      setPrimary,
      addAdditional,
      removeAdditional,
      reset,
    }),
    [
      primaryUser,
      additionalUsers,
      setPrimary,
      addAdditional,
      removeAdditional,
      reset,
    ],
  );

  return (
    <CheckInSessionContext.Provider value={value}>
      {children}
    </CheckInSessionContext.Provider>
  );
}

/**
 * Accessor hook for the wizard session. Throws if called outside a
 * `CheckInSessionProvider` so misuse is loud (silent `null` defaults are
 * the worst kind of bug). Pages outside `/check-in/*` should never call
 * this hook.
 */
export function useCheckInSession(): CheckInSessionValue {
  const ctx = useContext(CheckInSessionContext);
  if (ctx === null) {
    throw new Error(
      'useCheckInSession must be used within a CheckInSessionProvider',
    );
  }
  return ctx;
}
