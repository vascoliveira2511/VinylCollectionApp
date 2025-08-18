"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=password_reset_success');
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className={styles.loginMain}>
        <div className={styles.loginBackground}>
          <div className={styles.loginContainer}>
            <div className={styles.loginHeader}>
              <div className={styles.appLogo}>
                <div className="vinyl-loader">
                  <div className="vinyl-record"></div>
                </div>
              </div>
              <h1 className={styles.appTitle}>Invalid Reset Link</h1>
              <p className={styles.appSubtitle}>
                This password reset link is invalid or has expired
              </p>
            </div>
            
            <div className={styles.loginCard}>
              <div className="title-bar">Reset Link Invalid</div>
              <div className={styles.loginContent}>
                <div className={styles.errorMessage}>
                  Invalid or missing reset token. Please request a new password reset.
                </div>
                
                <div className={styles.loginFooter}>
                  <p>
                    <Link href="/forgot-password" className={styles.signupLink}>
                      Request New Reset Link
                    </Link>
                    {" or "}
                    <Link href="/login" className={styles.signupLink}>
                      Back to Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.loginMain}>
      <div className={styles.loginBackground}>
        <div className={styles.loginContainer}>
          <div className={styles.loginHeader}>
            <div className={styles.appLogo}>
              <div className="vinyl-loader">
                <div className="vinyl-record"></div>
              </div>
            </div>
            <h1 className={styles.appTitle}>Reset Password</h1>
            <p className={styles.appSubtitle}>
              Enter your new password below
            </p>
          </div>

          <div className={styles.loginCard}>
            <div className="title-bar">New Password</div>
            <div className={styles.loginContent}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && (
                <div className={styles.successMessage}>
                  {success}
                  <br />
                  <small>Redirecting to login...</small>
                </div>
              )}

              {!success && (
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="password" className={styles.inputLabel}>
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter new password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className={styles.loginInput}
                      minLength={6}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword" className={styles.inputLabel}>
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className={styles.loginInput}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.loginButton}
                  >
                    {loading ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          className="vinyl-loader"
                          style={{ width: "20px", height: "20px" }}
                        >
                          <div className="vinyl-record"></div>
                        </div>
                        Resetting Password...
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              )}

              <div className={styles.loginFooter}>
                <p>
                  Remember your password?{" "}
                  <Link href="/login" className={styles.signupLink}>
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}