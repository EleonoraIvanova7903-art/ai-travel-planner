"use client";

import { useState } from "react";
import Link from "next/link";
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

  const handleChange = (event) => {
    setEmail(event.target.value);

    if (formError) {
      setFormError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setFormError("Please enter your email address.");
      return;
    }

    /*
      Firebase password reset will be connected later.
      sendPasswordResetEmail will send the reset link to the user's email.
    */

    setFormError("");
    setSuccessMessage(
      "If an account exists with this email address, a password reset link will be sent.",
    );
  };

  return (
    <main
      className={`${styles.forgotPage} d-flex align-items-center justify-content-center p-0 p-sm-3 p-lg-4`}
    >
      <section className={`${styles.forgotShell} container-fluid p-0`}>
        <div className="row g-0 h-100">
          {/* Brand panel */}
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
                  >
                    <FaCompass />
                  </span>

                  <span>TravelMind AI</span>
                </Link>

                <Link
                  href="/"
                  className={`${styles.homeLink} d-inline-flex align-items-center justify-content-center gap-2`}
                >
                  <FaHouse />
                  Home
                </Link>
              </div>

              <div className={`${styles.brandContent} mt-5`}>
                <p className={`${styles.eyebrow} mb-3`}>Account recovery</p>

                <h1 className={`${styles.brandTitle} mb-0`}>
                  Reset your password and continue planning.
                </h1>

                <p className={`${styles.brandText} mt-4 mb-0`}>
                  Enter the email address linked to your TravelMind AI account
                  and continue your trip planning after resetting your password.
                </p>

                <div className="d-grid gap-3 mt-4">
                  <div
                    className={`${styles.featureItem} d-flex align-items-center gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                    >
                      <FaShieldHalved />
                    </span>

                    <p className={`${styles.featureText} mb-0`}>
                      Secure account access
                    </p>
                  </div>

                  <div
                    className={`${styles.featureItem} d-flex align-items-center gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                    >
                      <FaClock />
                    </span>

                    <p className={`${styles.featureText} mb-0`}>
                      Return to your saved plans
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password reset form */}
          <div className="col-12 col-lg-7">
            <div
              className={`${styles.formPanel} d-flex align-items-center justify-content-center p-3 p-md-5 h-100`}
            >
              <div className={`${styles.formCard} card bg-white`}>
                <div className="card-body p-4 p-md-5">
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className={`${styles.formIcon} d-inline-flex align-items-center justify-content-center`}
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
                    Enter your email address and we will prepare a password
                    reset request for your account.
                  </p>

                  <form onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email address
                      </label>

                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope />
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
                        />
                      </div>
                    </div>

                    {/* Error message */}
                    {formError && (
                      <div
                        className="alert alert-danger mb-3"
                        role="alert"
                        aria-live="polite"
                      >
                        {formError}
                      </div>
                    )}

                    {/* Success message */}
                    {successMessage && (
                      <div
                        className="alert alert-success mb-3"
                        role="status"
                        aria-live="polite"
                      >
                        {successMessage}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      className={`${styles.submitButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
                    >
                      Send reset link
                      <FaPaperPlane />
                    </button>
                  </form>

                  <div
                    className={`${styles.loginBox} d-flex align-items-center justify-content-center mt-4 pt-4`}
                  >
                    <Link
                      href="/login"
                      className={`${styles.loginLink} d-inline-flex align-items-center gap-2`}
                    >
                      <FaArrowLeft />
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
