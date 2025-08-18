"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginMain}>
      <div className={styles.loginContainer}>
          <div className={styles.loginHeader}>
            <div className={styles.appLogo}>
              <div className="vinyl-loader">
                <div className="vinyl-record"></div>
              </div>
            </div>
            <h1 className={styles.appTitle}>Forgot Password</h1>
            <p className={styles.appSubtitle}>
              We'll send you a reset link
            </p>
          </div>

          <div className={styles.loginCard}>
            <div className="title-bar">Password Reset</div>
            <div className={styles.loginContent}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && (
                <div className={styles.successMessage}>
                  {success}
                  <br />
                  <small>Check your email and click the reset link.</small>
                </div>
              )}

              {!success && (
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.inputLabel}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        Sending Reset Link...
                      </div>
                    ) : (
                      "Send Reset Link"
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
                  {" or "}
                  <Link href="/signup" className={styles.signupLink}>
                    Create account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}