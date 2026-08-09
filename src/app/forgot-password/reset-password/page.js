"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import {
  FaArrowLeft,
  FaCircleCheck,
  FaCompass,
  FaHouse,
  FaKey,
  FaLock,
  FaShieldHalved,
} from "react-icons/fa6";
import { auth } from "../../../firebase/firebase";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const [actionCode, setActionCode] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [pageStatus, setPageStatus] = useState("checking");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function verifyResetLink() {
      const searchParams = new URLSearchParams(window.location.search);

      const mode = searchParams.get("mode");
      const oobCode = searchParams.get("oobCode");

      if (mode !== "resetPassword" || !oobCode) {
        setPageStatus("error");
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);

        setActionCode(oobCode);
        setAccountEmail(email);
        setPageStatus("ready");
      } catch (error) {
        console.error("Password reset link verification failed:", error);
        setPageStatus("error");
      }
    }

    verifyResetLink();
  }, []);

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (formError) {
      setFormError("");
    }
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);

    if (formError) {
      setFormError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!password) {
      setFormError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (!confirmPassword) {
      setFormError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await confirmPasswordReset(auth, actionCode, password);

      setPassword("");
      setConfirmPassword("");
      setPageStatus("success");
    } catch (error) {
      console.error("Password reset failed:", error);

      if (
        error.code === "auth/expired-action-code" ||
        error.code === "auth/invalid-action-code"
      ) {
        setPageStatus("error");
        return;
      }

      if (error.code === "auth/weak-password") {
        setFormError("Please choose a stronger password.");
        return;
      }

      setFormError("Your password could not be changed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={`${styles.resetPage} d-flex align-items-center justify-content-center p-0 p-sm-3 p-lg-4`}
    >
      <section className={`${styles.resetShell} container-fluid p-0`}>
        <div className="row g-0 h-100">
          <div className="col-12 col-lg-5">
            <div
              className={`${styles.brandPanel} d-flex flex-column justify-content-between p-4 p-md-5 h-100`}
            >
              <div
                className={`${styles.panelTop} d-flex align-items-center justify-content-between gap-3 flex-wrap`}
              >
                <Link
                  href="/"
                  className={`${styles.brandLink} d-inline-flex align-items-center gap-2`}
                >
                  <span
                    className={`${styles.brandIcon} d-inline-flex align-items-center justify-content-center`}
                    aria-hidden="true"
                  >
                    <FaCompass />
                  </span>

                  <span>TravelMind AI</span>
                </Link>

                <Link
                  href="/"
                  className={`${styles.homeLink} d-inline-flex align-items-center justify-content-center gap-2`}
                >
                  <FaHouse aria-hidden="true" />
                  Home
                </Link>
              </div>

              <div className={`${styles.brandContent} mt-5`}>
                <p className={`${styles.eyebrow} mb-3`}>Account recovery</p>

                <h1 className={`${styles.brandTitle} mb-0`}>
                  Create a new password and continue your journey.
                </h1>

                <p className={`${styles.brandText} mt-4 mb-0`}>
                  Secure your TravelMind AI account with a new password and
                  return to your saved trips, recommendations and travel plans.
                </p>

                <div className={`${styles.featureGrid} mt-4`}>
                  <div
                    className={`${styles.featureItem} d-flex align-items-start gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaShieldHalved />
                    </span>

                    <div>
                      <p className={`${styles.featureTitle} mb-1`}>
                        Secure password reset
                      </p>

                      <p className={`${styles.featureText} mb-0`}>
                        Your reset link is verified before your password can be
                        changed.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`${styles.featureItem} d-flex align-items-start gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaKey />
                    </span>

                    <div>
                      <p className={`${styles.featureTitle} mb-1`}>
                        Return to your account
                      </p>

                      <p className={`${styles.featureText} mb-0`}>
                        Sign in with your new password after the reset is
                        complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className={`${styles.brandFooter} mt-5 mb-0`}>
                Personalised travel planning powered by TravelMind AI.
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div
              className={`${styles.formPanel} d-flex align-items-center justify-content-center p-3 p-md-5 h-100`}
            >
              <div className={styles.formCard}>
                <div className={styles.formCardBody}>
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className={`${styles.formIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      {pageStatus === "success" ? <FaCircleCheck /> : <FaKey />}
                    </span>

                    <div>
                      <p className={`${styles.formLabel} mb-1`}>
                        Password reset
                      </p>

                      <h2 className={`${styles.formTitle} mb-0`}>
                        {pageStatus === "success"
                          ? "Password changed"
                          : "Create new password"}
                      </h2>
                    </div>
                  </div>

                  {pageStatus === "checking" && (
                    <div className={`${styles.statusBox} mt-4`}>
                      <div
                        className={`${styles.spinner} spinner-border`}
                        role="status"
                        aria-hidden="true"
                      />

                      <p className={`${styles.formIntro} mb-0`}>
                        Checking your password reset link...
                      </p>
                    </div>
                  )}

                  {pageStatus === "error" && (
                    <>
                      <div
                        className="alert alert-danger mt-4 mb-4"
                        role="alert"
                      >
                        This password reset link is invalid or has expired.
                        Please request a new password reset email.
                      </div>

                      <Link
                        href="/forgot-password"
                        className={`${styles.submitButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
                      >
                        Request new reset link
                      </Link>

                      <div
                        className={`${styles.loginBox} d-flex align-items-center justify-content-center mt-4 pt-4`}
                      >
                        <Link
                          href="/login"
                          className={`${styles.loginLink} d-inline-flex align-items-center gap-2`}
                        >
                          <FaArrowLeft aria-hidden="true" />
                          Back to login
                        </Link>
                      </div>
                    </>
                  )}

                  {pageStatus === "ready" && (
                    <>
                      <p className={`${styles.formIntro} mt-3 mb-2`}>
                        Enter a new password for your account.
                      </p>

                      <div className={`${styles.emailBox} mb-4`}>
                        {accountEmail}
                      </div>

                      <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-3">
                          <label htmlFor="password" className="form-label">
                            New password
                          </label>

                          <div className="input-group">
                            <span className="input-group-text">
                              <FaLock aria-hidden="true" />
                            </span>

                            <input
                              id="password"
                              name="password"
                              type="password"
                              className="form-control"
                              value={password}
                              onChange={handlePasswordChange}
                              placeholder="Enter new password"
                              autoComplete="new-password"
                              disabled={isSubmitting}
                            />
                          </div>

                          <p className={`${styles.passwordHint} mt-2 mb-0`}>
                            Use at least 6 characters.
                          </p>
                        </div>

                        <div className="mb-3">
                          <label
                            htmlFor="confirmPassword"
                            className="form-label"
                          >
                            Confirm password
                          </label>

                          <div className="input-group">
                            <span className="input-group-text">
                              <FaLock aria-hidden="true" />
                            </span>

                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              className="form-control"
                              value={confirmPassword}
                              onChange={handleConfirmPasswordChange}
                              placeholder="Confirm new password"
                              autoComplete="new-password"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {formError && (
                          <div
                            className="alert alert-danger mb-3"
                            role="alert"
                            aria-live="polite"
                          >
                            {formError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className={`${styles.submitButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting
                            ? "Changing password..."
                            : "Change password"}

                          {!isSubmitting && <FaKey aria-hidden="true" />}
                        </button>
                      </form>

                      <div
                        className={`${styles.loginBox} d-flex align-items-center justify-content-center mt-4 pt-4`}
                      >
                        <Link
                          href="/login"
                          className={`${styles.loginLink} d-inline-flex align-items-center gap-2`}
                        >
                          <FaArrowLeft aria-hidden="true" />
                          Back to login
                        </Link>
                      </div>
                    </>
                  )}

                  {pageStatus === "success" && (
                    <>
                      <div
                        className="alert alert-success mt-4 mb-4"
                        role="status"
                        aria-live="polite"
                      >
                        Your password has been changed successfully. You can now
                        sign in with your new password.
                      </div>

                      <Link
                        href="/login"
                        className={`${styles.submitButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
                      >
                        Go to login
                        <FaArrowLeft aria-hidden="true" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
