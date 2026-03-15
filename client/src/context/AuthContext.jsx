import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api, { getStoredToken, setStoredToken } from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function restoreSession(currentToken) {
    if (!currentToken) {
      setUser(null);
      setBooting(false);
      return;
    }

    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data?.user ?? null);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    restoreSession(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login({ email, password }) {
    const res = await api.post("/api/auth/login", { email, password });
    const nextToken = res.data?.token;
    const nextUser = res.data?.user;

    if (!nextToken || !nextUser) {
      throw new Error("Invalid login response.");
    }

    setStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }

  async function register({ name, email, password, role, domainId }) {
    const res = await api.post("/api/auth/register", { name, email, password, role, domainId });
    const nextToken = res.data?.token;
    const nextUser = res.data?.user;

    if (!nextToken || !nextUser) {
      throw new Error("Invalid register response.");
    }

    setStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }

  function logout() {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, booting, isAuthenticated: !!user, login, register, logout }),
    [user, token, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

