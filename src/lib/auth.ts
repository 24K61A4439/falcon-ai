import { supabase } from "./supabase"

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthSession {
  userId: string
  email: string
  expiresAt: string
}

export type AuthResult =
  | { ok: true; session: AuthSession | null; message?: string }
  | {
      ok: false
      code: "AUTH_ERROR"
      message: string
    }

const toSession = (
  session:
    | {
        user: { id: string; email?: string }
        expires_at?: number
      }
    | null,
): AuthSession | null => {
  if (!session?.user.email) return null
  return {
    userId: session.user.id,
    email: session.user.email,
    expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
  }
}

export async function signIn(
  credentials: AuthCredentials,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword(credentials)
  if (error) return { ok: false, code: "AUTH_ERROR", message: error.message }
  return { ok: true, session: toSession(data.session) }
}

export async function signUp(
  credentials: AuthCredentials,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp(credentials)
  if (error) return { ok: false, code: "AUTH_ERROR", message: error.message }
  return {
    ok: true,
    session: toSession(data.session),
    message: data.session
      ? "Your account is ready."
      : "Check your email to confirm your account, then log in.",
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return toSession(data.session)
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
  if (error) return { ok: false, code: "AUTH_ERROR", message: error.message }
  return {
    ok: true,
    session: null,
    message: "Password reset instructions were sent to your email.",
  }
}
