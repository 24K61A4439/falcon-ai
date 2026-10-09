import { useState, type FormEvent } from "react"
import {
  BellRing,
  Eye,
  EyeOff,
  LockKeyhole,
  Radio,
} from "lucide-react"
import { useNavigate } from "react-router"
import VideoBackground from "@/components/VideoBackground"
import Button from "@/components/ui/Button"
import PhoenixMark from "@/components/ui/PhoenixMark"
import { APP_NAME, DEMO_MODE } from "@/config"
import { resetPassword, signIn, signUp } from "@/lib/auth"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!email.trim()) nextErrors.email = "Enter your email or username."
    else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email."
    if (!password) nextErrors.password = "Enter your password."
    else if (password.length < 6)
      nextErrors.password = "Password must be at least 6 characters."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setLoading(true)
    const result =
      mode === "login"
        ? await signIn({ email, password })
        : await signUp({ email, password })
    setLoading(false)
    if (result.ok && result.session) {
      setSuccess(result.message ?? "Ready. Opening your protected dashboard...")
      window.setTimeout(() => navigate("/app/home"), 450)
    } else if (result.ok) setSuccess(result.message ?? "Check your email.")
    else if (DEMO_MODE) navigate("/app/home")
    else setErrors({ form: result.message })
  }

  const forgotPassword = async () => {
    if (!email) {
      setErrors({
        email: "Enter your email first, then select Forgot Password.",
      })
      return
    }
    const result = await resetPassword(email)
    if (result.ok)
      setSuccess(result.message ?? "Password reset instructions sent.")
    else setErrors({ form: result.message })
  }

  return (
    <div className="login-page">
      <VideoBackground />
      <main className="login-layout">
        <section className="login-hero" aria-labelledby="login-headline">
          <div className="hero-eyebrow">
            <PhoenixMark className="login-phoenix" /> {APP_NAME}
          </div>
          <h1 id="login-headline">
            <span className="headline-mask">
              <span>
                Think <strong>Twice,</strong>
              </span>
            </span>
            <span className="headline-mask">
              <span>
                <strong className="green-text">Transfer Once.</strong>
              </span>
            </span>
          </h1>
          <p>
            Real-time call analysis that spots manipulation in what is said, not
            who is calling.
          </p>
          <div className="trust-chips">
            <span>
              <Radio aria-hidden="true" /> Works on spoofed numbers
            </span>
            <span>
              <LockKeyhole aria-hidden="true" /> Private by design
            </span>
            <span>
              <BellRing aria-hidden="true" /> Alerts family instantly
            </span>
          </div>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          {DEMO_MODE && (
            <div className="demo-banner">
              <span>Demo mode</span> No real account is required
            </div>
          )}
          <h2 id="login-title">{mode === "login" ? "Log in" : "Sign up"}</h2>
          <p className="login-intro">Stay protected during suspicious calls.</p>
          <form onSubmit={submit} noValidate>
            <label htmlFor="email">Email or username</label>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="username"
            />
            {errors.email && (
              <span className="field-error" id="email-error">
                {errors.email}
              </span>
            )}
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="field-error" id="password-error">
                {errors.password}
              </span>
            )}
            <div className="form-options">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-button"
                onClick={forgotPassword}
              >
                Forgot Password
              </button>
            </div>
            {errors.form && (
              <div className="form-error" role="alert">
                {errors.form}
              </div>
            )}
            {success && (
              <div className="form-success" role="status">
                {success}
              </div>
            )}
            <Button type="submit" className="login-button" disabled={loading}>
              {loading
                ? "Checking..."
                : DEMO_MODE
                  ? "Enter demo"
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
            </Button>
          </form>
          <p className="signup-copy">
            <button
              type="button"
              onClick={() => {
                setMode((current) => (current === "login" ? "signup" : "login"))
                setErrors({})
              }}
            >
              {mode === "login" ? "Sign Up" : "Log in"}
            </button>{" "}
            {mode === "login"
              ? "if you don't have an account"
              : "if you already have an account"}
          </p>
        </section>
      </main>
    </div>
  )
}
