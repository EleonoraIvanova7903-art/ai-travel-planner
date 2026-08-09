"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import {
  FaArrowLeft,
  FaClock,
  FaCompass,
  FaEnvelope,
  FaHouse,
  FaKey,
  FaPaperPlane,
  FaShieldHalved,
} from "react-icons/fa6";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  function handleChange(event) {
    setEmail(event.target.value);

    if (formError) {
      setFormError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setFormError("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setFormError("");
    setSuccessMessage("");
    setIsSending(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);

      setSuccessMessage(
        "Password reset email sent. Please check your inbox and follow the link to create a new password.",
      );

      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/user-not-found") {
        setSuccessMessage(
          "If an account exists with this email address, a password reset link will be sent.",
        );
        setEmail("");
        return;
      }

      if (error.code === "auth/invalid-email") {
        setFormError("Please enter a valid email address.");
        return;
      }

      if (error.code === "auth/too-many-requests") {
        setFormError(
          "Too many password reset requests. Please try again later.",
        );
        return;
      }

      if (error.code === "auth/network-request-failed") {
        setFormError(
          "Network error. Please check your internet connection and try again.",
        );
        return;
      }

      setFormError("Password reset email could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main
      className={`${styles.forgotPage} d-flex align-items-center justify-content-center p-0 p-sm-3 p-lg-4`}
    >
      <section className={`${styles.forgotShell} container-fluid p-0`}>
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
                  Recover access to your travel plans.
                </h1>

                <p className={`${styles.brandText} mt-4 mb-0`}>
                  Enter the email connected to your TravelMind AI account and
                  continue planning after resetting your password.
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
                        Secure account recovery
                      </p>

                      <p className={`${styles.featureText} mb-0`}>
                        Use the email address connected to your account.
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
                      <FaClock />
                    </span>

                    <div>
                      <p className={`${styles.featureTitle} mb-1`}>
                        Return to your plans
                      </p>

                      <p className={`${styles.featureText} mb-0`}>
                        Continue working with saved trips and recommendations.
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
                      <FaKey />
                    </span>

                    <div>
                      <p className={`${styles.formLabel} mb-1`}>
                        Password reset
                      </p>

                      <h2 className={`${styles.formTitle} mb-0`}>
                        Forgot password
                      </h2>
                    </div>
                  </div>

                  <p className={`${styles.formIntro} mt-3 mb-4`}>
                    Enter your account email address and we will send you a
                    password reset link.
                  </p>

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email address
                      </label>

                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope aria-hidden="true" />
                        </span>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={isSending}
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

                    {successMessage && (
                      <div
                        className="alert alert-success mb-3"
                        role="status"
                        aria-live="polite"
                      >
                        {successMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`${styles.submitButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
                      disabled={isSending}
                    >
                      {isSending ? "Sending..." : "Send reset link"}

                      {!isSending && <FaPaperPlane aria-hidden="true" />}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
