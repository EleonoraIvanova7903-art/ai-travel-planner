"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaArrowRightToBracket,
  FaChartLine,
  FaCompass,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaHouse,
  FaLock,
  FaShieldHalved,
} from "react-icons/fa6";
import { getAuthErrorMessage, loginUser } from "../../firebase/authService";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setFormError("Please enter your email address and password.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const { profile } = await loginUser(email, password);

      if (profile.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/traveller/account/dashboard");
      }

      router.refresh();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={`${styles.loginPage} d-flex align-items-center justify-content-center p-0 p-sm-3 p-lg-4`}
    >
      <section className={`${styles.loginShell} container-fluid p-0`}>
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
                <p className={`${styles.eyebrow} mb-3`}>
                  Intelligent travel planning
                </p>

                <h1 className={`${styles.brandTitle} mb-0`}>
                  Plan smarter journeys with confidence.
                </h1>

                <p className={`${styles.brandText} mt-4 mb-0`}>
                  Access personalised destination recommendations, budget-aware
                  planning and saved trip information from one account.
                </p>

                <div className={`${styles.featureGrid} mt-4`}>
                  <div
                    className={`${styles.featureItem} d-flex align-items-start gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaChartLine />
                    </span>

                    <div>
                      <p className={`${styles.featureTitle} mb-1`}>
                        Budget-aware planning
                      </p>

                      <p className={`${styles.featureText} mb-0`}>
                        Compare travel choices around your available budget.
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
                      <FaShieldHalved />
                    </span>

                    <div>
                      <p className={`${styles.featureTitle} mb-1`}>
                        Personal account access
                      </p>

                      <p className={`${styles.featureText} mb-0`}>
                        Return to saved trips and continue planning securely.
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
                      <FaArrowRightToBracket />
                    </span>

                    <div>
                      <p className={`${styles.formLabel} mb-1`}>
                        Account access
                      </p>

                      <h2 className={`${styles.formTitle} mb-0`}>
                        Welcome back
                      </h2>
                    </div>
                  </div>

                  <p className={`${styles.formIntro} mt-3 mb-4`}>
                    Sign in to continue planning trips based on your budget,
                    interests and preferred travel style.
                  </p>

                  <form onSubmit={handleSubmit}>
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
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                        <label htmlFor="password" className="form-label mb-0">
                          Password
                        </label>

                        <Link
                          href="/forgot-password"
                          className={styles.smallLink}
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock aria-hidden="true" />
                        </span>

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                        />

                        <button
                          type="button"
                          className={`btn ${styles.passwordButton}`}
                          onClick={() =>
                            setShowPassword((currentValue) => !currentValue)
                          }
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          disabled={isSubmitting}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
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
                      {isSubmitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            aria-hidden="true"
                          />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <FaArrowRightToBracket aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>

                  <div
                    className={`${styles.createAccountBox} d-flex align-items-center justify-content-center gap-2 flex-wrap mt-4 pt-4`}
                  >
                    <p className={`${styles.createAccountText} mb-0`}>
                      New to TravelMind AI?
                    </p>

                    <Link href="/register" className={styles.createAccountLink}>
                      Create an account
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
