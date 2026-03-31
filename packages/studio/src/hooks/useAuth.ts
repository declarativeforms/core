import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  storeAuth,
  type AuthUser,
} from "@/lib/auth";

let listeners: Array<() => void> = [];
let cachedSnapshot = {
  token: getStoredToken(),
  user: getStoredUser(),
};

function emitChange() {
  cachedSnapshot = {
    token: getStoredToken(),
    user: getStoredUser(),
  };

  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return cachedSnapshot;
}

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const login = useCallback((token: string, user: AuthUser) => {
    storeAuth(token, user);
    emitChange();
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    emitChange();
  }, []);

  const isAuthenticated = useMemo(() => Boolean(state.token), [state.token]);

  return {
    token: state.token,
    user: state.user,
    isAuthenticated,
    login,
    logout,
  };
}
