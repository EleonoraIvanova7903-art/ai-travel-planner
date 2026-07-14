"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaCompass,
  FaMapLocationDot,
  FaWallet,
  FaHouse,
} from "react-icons/fa6";
import {
  getAuthErrorMessage,
  registerTraveller,
} from "../../firebase/authService";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!fullName || !email || !password || !confirmPassword) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await registerTraveller({
        fullName,
        email,
        password,
      });

      router.replace("/traveller/account/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`${styles.registerPage} d-flex align-items-center justify-content-center p-0 p-sm-3 p-lg-4`}
    >
      <section className={`${styles.registerShell} container-fluid p-0`}>
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
                    className={`${styles.brandIcon} d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-4 shadow-sm`}
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
                <p className={`${styles.eyebrow} mb-3`}>Create your account</p>

                <h1 className={`${styles.brandTitle} mb-0`}>
                  Start planning trips around your budget.
                </h1>

                <p className={`${styles.brandText} mt-4 mb-0`}>
                  Create an account to save travel plans, compare destinations
                  and build clearer itineraries before booking.
                </p>

                <div className="d-grid gap-3 mt-4">
                  <div
                    className={`${styles.featureItem} d-flex align-items-center gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                    >
                      <FaWallet />
                    </span>

                    <p className={`${styles.featureText} mb-0`}>
                      Plan around your total budget
                    </p>
                  </div>

                  <div
                    className={`${styles.featureItem} d-flex align-items-center gap-3`}
                  >
                    <span
                      className={`${styles.featureIcon} d-inline-flex align-items-center justify-content-center`}
                    >
                      <FaMapLocationDot />
                    </span>

                    <p className={`${styles.featureText} mb-0`}>
                      Compare destinations and travel styles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration form */}
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
                      <FaUserPlus />
                    </span>

                    <div>
                      <p className={`${styles.formLabel} mb-1`}>
                        Traveller account
                      </p>

                      <h2 className={`${styles.formTitle} mb-0`}>
                        Create account
                      </h2>
                    </div>
                  </div>

                  <p className={`${styles.formIntro} mt-3 mb-4`}>
                    Join TravelMind AI and start saving your travel ideas,
                    budget choices and personalised trip plans.
                  </p>

                  <form onSubmit={handleSubmit}>
                    {/* Full name */}
                    <div className="mb-3">
                      <label htmlFor="fullName" className="form-label">
                        Full name
                      </label>

                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>

                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          className="form-control"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

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
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>

                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password"
                          autoComplete="new-password"
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

                    {/* Confirm password */}
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm password
                      </label>

                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>

                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                        />

                        <button
                          type="button"
                          className={`btn ${styles.passwordButton}`}
                          onClick={() =>
                            setShowConfirmPassword(
                              (currentValue) => !currentValue,
                            )
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
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

                    {/* Submit button */}
                    <button
                      type="submit"
                      className={`${styles.submitButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account..." : "Create account"}

                      <FaUserPlus />
                    </button>
                  </form>

                  <div
                    className={`${styles.loginBox} d-flex align-items-center justify-content-center gap-2 flex-wrap mt-4 pt-4`}
                  >
                    <p className={`${styles.loginText} mb-0`}>
                      Already have an account?
                    </p>

                    <Link href="/login" className={styles.loginLink}>
                      Sign in
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
