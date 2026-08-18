"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "citizen" | "officer" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  /** Officer display name — must match an entry in DEPARTMENTS.officers for queue scoping. */
  officerName?: string;
  department?: string;
  departmentCode?: string;
};

type StoredUser = User & { password: string };

const SESSION_KEY = "civiclens-auth";
const REGISTRY_KEY = "civiclens-users";

/** Seeded demo accounts — one per role. Meena's id matches the seed data so her tickets show. */
export const DEMO_USERS: StoredUser[] = [
  {
    id: "c-meena",
    name: "Meena Sharma",
    email: "meena@bhopal.in",
    phone: "+91 98260 44112",
    role: "citizen",
    password: "demo123",
  },
  {
    id: "o-rsharma",
    name: "R. Sharma",
    email: "rsharma@bmc.gov.in",
    phone: "+91 75540 20031",
    role: "officer",
    officerName: "R. Sharma",
    department: "Public Works — Roads",
    departmentCode: "PWD",
    password: "demo123",
  },
  {
    id: "a-bmc",
    name: "Priya Desai",
    email: "admin@bmc.gov.in",
    phone: "+91 75540 00000",
    role: "admin",
    password: "demo123",
  },
];

export const ROLE_HOME: Record<Role, string> = {
  citizen: "/citizen",
  officer: "/ops/queue",
  admin: "/ops",
};

function readRegistry(): StoredUser[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    const extra = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    // Demo users always present; registry (signups) merged on top by email.
    const byEmail = new Map<string, StoredUser>();
    for (const u of DEMO_USERS) byEmail.set(u.email.toLowerCase(), u);
    for (const u of extra) byEmail.set(u.email.toLowerCase(), u);
    return [...byEmail.values()];
  } catch {
    return [...DEMO_USERS];
  }
}

function writeRegistry(users: StoredUser[]) {
  const extra = users.filter((u) => !DEMO_USERS.some((d) => d.id === u.id));
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(extra));
}

function stripPassword(u: StoredUser): User {
  const { password: _pw, ...rest } = u;
  void _pw;
  return rest;
}

type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: Role;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string; user?: User };
  signup: (input: SignupInput) => { ok: boolean; error?: string; user?: User };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as User;
        // Re-hydrate from registry so profile edits + roles stay canonical.
        const match = readRegistry().find((u) => u.id === stored.id);
        setUser(match ? stripPassword(match) : stored);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const login = useCallback<AuthContextValue["login"]>((email, password) => {
    const match = readRegistry().find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match) return { ok: false, error: "No account with that email." };
    if (match.password !== password) return { ok: false, error: "Wrong password." };
    const clean = stripPassword(match);
    persist(clean);
    return { ok: true, user: clean };
  }, [persist]);

  const signup = useCallback<AuthContextValue["signup"]>((input) => {
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim()) return { ok: false, error: "Name is required." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
    if (input.password.length < 6) return { ok: false, error: "Password needs 6+ characters." };
    const registry = readRegistry();
    if (registry.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: "That email is already registered." };
    }
    const role: Role = input.role ?? "citizen";
    const stored: StoredUser = {
      id: `${role[0]}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name.trim(),
      email,
      phone: input.phone.trim() || "Not provided",
      role,
      password: input.password,
    };
    writeRegistry([...registry, stored]);
    const clean = stripPassword(stored);
    persist(clean);
    return { ok: true, user: clean };
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>((patch) => {
    setUser((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      // Mirror into registry for signup accounts.
      const registry = readRegistry();
      const idx = registry.findIndex((u) => u.id === next.id);
      if (idx >= 0 && !DEMO_USERS.some((d) => d.id === next.id)) {
        registry[idx] = { ...registry[idx], ...patch };
        writeRegistry(registry);
      }
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, signup, logout, updateProfile }),
    [user, loading, login, signup, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
