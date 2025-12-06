import { useMemo } from "react";

type User = { email: string };

export function useAuth() {
  // Pretend we're always logged in (no login flow)
  const user: User = { email: "you@local.dev" };
  const isAuthenticated = true; // Set to true to allow access to the app
  const isLoading = false;

  async function login(_email: string, _password: string) {
    // no-op
    return user;
  }

  async function logout() {
    // no-op
    return;
  }

  return { user, isAuthenticated, isLoading, login, logout };
}

// Optional provider so existing code keeps working
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
