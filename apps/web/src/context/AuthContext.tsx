import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserPublic } from "@session-plan/shared";
import { api, getToken, setToken } from "../lib/api";

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<UserPublic>("/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const res = await api.post<{ token: string; user: UserPublic }>("/auth/login", { email, password });
        setToken(res.token);
        setUser(res.user);
      },
      async register(name, email, password) {
        const res = await api.post<{ token: string; user: UserPublic }>("/auth/register", {
          name,
          email,
          password,
        });
        setToken(res.token);
        setUser(res.user);
      },
      logout() {
        setToken(null);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
