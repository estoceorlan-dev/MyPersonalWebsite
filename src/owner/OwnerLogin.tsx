import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Lock } from "lucide-react";
import { usePortfolio, getApiUrl } from "../context/PortfolioContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { navigateTo } from "../utils/router";

export const OWNER_TOKEN_KEY = "portfolio-owner-token-v1";
export const OWNER_EMAIL_KEY = "portfolio-owner-email-v1";

export default function OwnerLogin({
  onAuthenticated,
}: {
  onAuthenticated: (token: string, email: string) => void;
}) {
  const { content } = usePortfolio();
  const { personal } = content;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your owner email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.token) {
        setError(payload.error || "Invalid email or password.");
        return;
      }

      try {
        localStorage.setItem(OWNER_TOKEN_KEY, payload.token);
        localStorage.setItem(
          OWNER_EMAIL_KEY,
          payload.owner?.email || trimmedEmail,
        );
      } catch {
        // Ignore storage errors
      }

      onAuthenticated(payload.token, payload.owner?.email || trimmedEmail);
      navigateTo("/owner");
    } catch {
      setError("Unable to reach the authentication server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="owner-shell">
      <header className="site-header">
        <div className="container nav-inner">
          <a
            className="brand"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigateTo("/");
            }}
            aria-label="Back to portfolio"
          >
            <span className="monogram">
              {personal.monogram}
              <span>.</span>
            </span>
            <span className="brand-caption">
              owner
              <br />
              portal
            </span>
          </a>
          <div className="nav-actions">
            <ThemeToggle />
            <a
              href="/"
              className="button button-secondary"
              onClick={(event) => {
                event.preventDefault();
                navigateTo("/");
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to portfolio</span>
            </a>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="owner-login-main container"
        tabIndex={-1}
      >
        <section
          className="owner-login-card"
          aria-labelledby="owner-login-heading"
        >
          <h1 id="owner-login-heading" className="owner-login-title">
            Manage your <span>portfolio</span>.
          </h1>
          <p className="owner-login-subtitle">
            Sign in with your owner email and password to update sections and
            upload a new resume or portrait.
          </p>

          <form onSubmit={handleSubmit} className="owner-login-form" noValidate>
            <div className="form-field field-wide">
              <label htmlFor="owner-email">
                Owner email address <span aria-hidden="true">*</span>
              </label>
              <input
                id="owner-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                placeholder="estoce.orlan@gmail.com"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="form-field field-wide">
              <label htmlFor="owner-password">
                Password <span aria-hidden="true">*</span>
              </label>
              <div className="owner-password-wrap">
                <input
                  id="owner-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  className="owner-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="owner-alert owner-alert-error" role="alert">
                {error}
              </div>
            )}

            <div className="owner-login-actions">
              <span className="owner-login-note">
                <Lock size={13} /> Encrypted JWT session
              </span>
              <button
                type="submit"
                className="button button-primary"
                disabled={submitting}
              >
                <span>
                  {submitting ? "Signing in…" : "Sign in to dashboard"}
                </span>
                <ArrowUpRight size={17} />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
