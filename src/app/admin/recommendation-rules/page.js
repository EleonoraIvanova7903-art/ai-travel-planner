"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaChartPie,
  FaCircleCheck,
  FaFloppyDisk,
  FaListOl,
  FaScaleBalanced,
  FaStar,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { mockDestinations } from "@/data/mockDestinations";
import { watchAuthState } from "@/firebase/authService";
import {
  getRecommendationRules,
  updateRecommendationRules,
} from "@/firebase/adminService";
import AdminLayout from "../../../shared/layout/AdminLayout";
import styles from "./recommendation-rules.module.css";

const defaultRecommendationRules = Object.freeze({
  interestMatchWeight: 35,
  budgetFitWeight: 35,
  seasonMatchWeight: 20,
  valueForMoneyWeight: 10,
  featuredDestinations: [
    "lisbon-portugal",
    "malaga-spain",
    "prague-czech-republic",
  ],
  minimumRecommendationCount: 3,
});

const weightFields = [
  {
    name: "interestMatchWeight",
    label: "Interest match weight",
    description:
      "Controls how strongly selected Traveller interests influence the destination score.",
  },
  {
    name: "budgetFitWeight",
    label: "Budget fit weight",
    description:
      "Controls how strongly the estimated cost and available Traveller budget influence the score.",
  },
  {
    name: "seasonMatchWeight",
    label: "Season match weight",
    description:
      "Controls how strongly the selected month matches the recommended travel months.",
  },
  {
    name: "valueForMoneyWeight",
    label: "Value for money weight",
    description:
      "Controls how strongly destination cost efficiency influences its ranking position.",
  },
];

function getValidNumber(value, fallbackValue) {
  if (value === "" || value === null || value === undefined) {
    return fallbackValue;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallbackValue;
}

function normaliseRecommendationRules(data) {
  const validDestinationIds = new Set(
    mockDestinations.map((destination) => destination.destinationId),
  );

  const featuredDestinations = Array.isArray(data?.featuredDestinations)
    ? [...new Set(data.featuredDestinations)].filter((destinationId) =>
        validDestinationIds.has(destinationId),
      )
    : defaultRecommendationRules.featuredDestinations;

  return {
    interestMatchWeight: getValidNumber(
      data?.interestMatchWeight,
      defaultRecommendationRules.interestMatchWeight,
    ),

    budgetFitWeight: getValidNumber(
      data?.budgetFitWeight,
      defaultRecommendationRules.budgetFitWeight,
    ),

    seasonMatchWeight: getValidNumber(
      data?.seasonMatchWeight,
      defaultRecommendationRules.seasonMatchWeight,
    ),

    valueForMoneyWeight: getValidNumber(
      data?.valueForMoneyWeight,
      defaultRecommendationRules.valueForMoneyWeight,
    ),

    featuredDestinations,

    minimumRecommendationCount: getValidNumber(
      data?.minimumRecommendationCount,
      defaultRecommendationRules.minimumRecommendationCount,
    ),
  };
}

function prepareRecommendationRulesForSave(data) {
  const preparedRules = {
    featuredDestinations: Array.isArray(data?.featuredDestinations)
      ? [...new Set(data.featuredDestinations)]
      : [],
  };

  let totalWeight = 0;

  weightFields.forEach((field) => {
    const fieldValue = data?.[field.name];

    if (fieldValue === "" || fieldValue === null || fieldValue === undefined) {
      throw new Error(`${field.label} is required.`);
    }

    const numericValue = Number(fieldValue);

    if (!Number.isFinite(numericValue)) {
      throw new Error(`${field.label} must be a valid number.`);
    }

    if (numericValue < 0 || numericValue > 100) {
      throw new Error(`${field.label} must be between 0% and 100%.`);
    }

    preparedRules[field.name] = numericValue;
    totalWeight += numericValue;
  });

  if (totalWeight !== 100) {
    throw new Error(
      `The four recommendation weights must total exactly 100%. The current total is ${totalWeight}%.`,
    );
  }

  const minimumRecommendationCount = Number(data?.minimumRecommendationCount);

  if (!Number.isInteger(minimumRecommendationCount)) {
    throw new Error("Minimum recommendation count must be a whole number.");
  }

  if (
    minimumRecommendationCount < 1 ||
    minimumRecommendationCount > mockDestinations.length
  ) {
    throw new Error(
      `Minimum recommendation count must be between 1 and ${mockDestinations.length}.`,
    );
  }

  preparedRules.minimumRecommendationCount = minimumRecommendationCount;

  return preparedRules;
}

function getRecommendationRulesErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in with an Admin account to open this page.";
  }

  if (error?.code === "admin/access-denied") {
    return "This account does not have active Admin access.";
  }

  if (error?.code === "profile/not-found") {
    return "The Admin profile could not be found.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Access to the recommendation settings was denied.";
  }

  return error?.message || "Recommendation rules could not be processed.";
}

function scrollToPageTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

export default function RecommendationRulesPage() {
  const [formData, setFormData] = useState(defaultRecommendationRules);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const totalWeight = useMemo(
    () =>
      weightFields.reduce(
        (total, field) => total + Number(formData[field.name] || 0),
        0,
      ),
    [formData],
  );

  const isWeightDistributionValid = totalWeight === 100;

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      setStatusMessage("");
      setErrorMessage("");

      if (!authUser) {
        setErrorMessage("Sign in with an Admin account to open this page.");
        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);

        const savedRules = await getRecommendationRules();

        if (isActive) {
          setFormData(normaliseRecommendationRules(savedRules));
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getRecommendationRulesErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  function handleNumberChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value === "" ? "" : Number(value),
    }));
  }

  function handleFeaturedDestinationChange(event) {
    const { value, checked } = event.target;

    setFormData((currentData) => {
      const currentFeaturedDestinations = Array.isArray(
        currentData.featuredDestinations,
      )
        ? currentData.featuredDestinations
        : [];

      return {
        ...currentData,

        featuredDestinations: checked
          ? [...new Set([...currentFeaturedDestinations, value])]
          : currentFeaturedDestinations.filter(
              (destinationId) => destinationId !== value,
            ),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");
      setErrorMessage("");

      const preparedRules = prepareRecommendationRulesForSave(formData);

      const updatedRules = await updateRecommendationRules(preparedRules);

      setFormData(normaliseRecommendationRules(updatedRules || preparedRules));

      setStatusMessage("Recommendation rules were saved successfully.");

      scrollToPageTop();
    } catch (error) {
      setErrorMessage(getRecommendationRulesErrorMessage(error));
      scrollToPageTop();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout
      pageTitle="Recommendation Rules"
      pageDescription="Manage how TravelMind AI ranks personalised destination recommendations."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div className={`${styles.errorMessage} mb-4`} role="alert">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className={`${styles.successMessage} mb-4`} role="status">
            <FaCircleCheck aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        {isLoading && (
          <div
            className={`${styles.loadingMessage} d-flex align-items-center gap-3 mb-4`}
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>Loading recommendation rules...</span>
          </div>
        )}

        {!isLoading && !errorMessage && (
          <form onSubmit={handleSubmit} aria-busy={isSaving}>
            <div className="row g-4">
              <div className="col-12">
                <section className={styles.pageIntro}>
                  <div className="row g-4 align-items-center">
                    <div className="col-12 col-xl-8">
                      <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                        <span
                          className={`${styles.pageIntroIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                          aria-hidden="true"
                        >
                          <FaScaleBalanced />
                        </span>

                        <div>
                          <p className={`${styles.pageIntroLabel} mb-2`}>
                            Recommendation management
                          </p>

                          <h2 className={`${styles.pageIntroTitle} mb-3`}>
                            Control how destinations are ranked
                          </h2>

                          <p className={`${styles.pageIntroText} mb-0`}>
                            Adjust the balance between Traveller interests,
                            budget suitability, travel season and value for
                            money.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-xl-4">
                      <div className={styles.pageIntroSummary}>
                        <span>Current weight distribution</span>

                        <strong>{totalWeight}%</strong>

                        <p>
                          The four ranking values must equal exactly 100% before
                          the configuration can be saved.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`${styles.summaryCard} h-100`}>
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <p className={styles.summaryLabel}>Weight total</p>

                      <h2 className={styles.summaryValue}>{totalWeight}%</h2>

                      <p className={styles.summaryText}>
                        Required total for ranking criteria
                      </p>
                    </div>

                    <span
                      className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaChartPie />
                    </span>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`${styles.summaryCard} h-100`}>
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <p className={styles.summaryLabel}>
                        Featured destinations
                      </p>

                      <h2 className={styles.summaryValue}>
                        {formData.featuredDestinations.length}
                      </h2>

                      <p className={styles.summaryText}>
                        Destinations with additional priority
                      </p>
                    </div>

                    <span
                      className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaStar />
                    </span>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`${styles.summaryCard} h-100`}>
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <p className={styles.summaryLabel}>
                        Recommendation count
                      </p>

                      <h2 className={styles.summaryValue}>
                        {formData.minimumRecommendationCount}
                      </h2>

                      <p className={styles.summaryText}>
                        Top destinations shown to Travellers
                      </p>
                    </div>

                    <span
                      className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaListOl />
                    </span>
                  </div>
                </section>
              </div>

              <div className="col-12">
                <section className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                      <span
                        className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                        aria-hidden="true"
                      >
                        <FaChartPie />
                      </span>

                      <div>
                        <p className={`${styles.sectionLabel} mb-2`}>
                          Ranking priorities
                        </p>

                        <h2 className={`${styles.sectionTitle} mb-2`}>
                          Recommendation weights
                        </h2>

                        <p className={`${styles.sectionText} mb-0`}>
                          Set the percentage influence of each criterion on the
                          final destination ranking.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsBody}>
                    <div className="row g-4">
                      {weightFields.map((field) => (
                        <div key={field.name} className="col-12 col-md-6">
                          <div className={`${styles.weightCard} h-100`}>
                            <label
                              className={styles.fieldLabel}
                              htmlFor={field.name}
                            >
                              {field.label}
                            </label>

                            <p className={`${styles.fieldText} mb-3`}>
                              {field.description}
                            </p>

                            <div className="input-group">
                              <input
                                id={field.name}
                                name={field.name}
                                type="number"
                                className="form-control"
                                min="0"
                                max="100"
                                step="1"
                                value={formData[field.name]}
                                onChange={handleNumberChange}
                                disabled={isSaving}
                                required
                              />

                              <span className="input-group-text">%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className={`${styles.weightStatus} ${
                        isWeightDistributionValid
                          ? styles.weightStatusValid
                          : styles.weightStatusWarning
                      } mt-4`}
                      role="status"
                    >
                      <span
                        className={`${styles.weightStatusIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        {isWeightDistributionValid ? (
                          <FaCircleCheck />
                        ) : (
                          <FaTriangleExclamation />
                        )}
                      </span>

                      <div>
                        <strong>Current weight total: {totalWeight}%</strong>

                        <p>
                          {isWeightDistributionValid
                            ? "The distribution is valid and ready to save."
                            : "Adjust the values until the total equals exactly 100%."}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12">
                <section className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                      <span
                        className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                        aria-hidden="true"
                      >
                        <FaStar />
                      </span>

                      <div>
                        <p className={`${styles.sectionLabel} mb-2`}>
                          Destination priority
                        </p>

                        <h2 className={`${styles.sectionTitle} mb-2`}>
                          Featured destinations
                        </h2>

                        <p className={`${styles.sectionText} mb-0`}>
                          Give selected destinations priority when two results
                          receive the same recommendation score.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsBody}>
                    <div className="row g-3">
                      {mockDestinations.map((destination) => {
                        const inputId = `featured-${destination.destinationId}`;

                        const isFeatured =
                          formData.featuredDestinations.includes(
                            destination.destinationId,
                          );

                        return (
                          <div
                            key={destination.destinationId}
                            className="col-12 col-md-6 col-xl-4"
                          >
                            <div
                              className={`${styles.destinationOption} ${
                                isFeatured
                                  ? styles.destinationOptionSelected
                                  : ""
                              } h-100`}
                            >
                              <div className="form-check">
                                <input
                                  id={inputId}
                                  type="checkbox"
                                  className="form-check-input"
                                  value={destination.destinationId}
                                  checked={isFeatured}
                                  onChange={handleFeaturedDestinationChange}
                                  disabled={isSaving}
                                />

                                <label
                                  className={styles.destinationLabel}
                                  htmlFor={inputId}
                                >
                                  {destination.city}, {destination.country}
                                </label>
                              </div>

                              <p className={`${styles.destinationText} mb-0`}>
                                {destination.shortDescription}
                              </p>

                              {isFeatured && (
                                <span className={styles.featuredBadge}>
                                  <FaStar aria-hidden="true" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12">
                <section className={styles.settingsCard}>
                  <div className={styles.settingsBody}>
                    <div className="row g-4 align-items-end">
                      <div className="col-12 col-lg-7">
                        <p className={`${styles.sectionLabelLight} mb-2`}>
                          Result settings
                        </p>

                        <label
                          className={styles.resultCountLabel}
                          htmlFor="minimumRecommendationCount"
                        >
                          Number of recommendations
                        </label>

                        <p className={`${styles.resultCountText} mb-3`}>
                          Choose how many top-ranked destinations Travellers see
                          after completing the Trip Planner.
                        </p>

                        <input
                          id="minimumRecommendationCount"
                          name="minimumRecommendationCount"
                          type="number"
                          className="form-control"
                          min="1"
                          max={mockDestinations.length}
                          step="1"
                          value={formData.minimumRecommendationCount}
                          onChange={handleNumberChange}
                          disabled={isSaving}
                          required
                        />

                        <p className={`${styles.rangeText} mt-2 mb-0`}>
                          Available range: 1–{mockDestinations.length}
                        </p>
                      </div>

                      <div className="col-12 col-lg-5">
                        <div className={styles.saveArea}>
                          <div>
                            <p className={`${styles.saveTitle} mb-1`}>
                              Save recommendation settings
                            </p>

                            <p className={`${styles.saveText} mb-0`}>
                              The updated rules will be used for future
                              destination recommendations.
                            </p>
                          </div>

                          <button
                            type="submit"
                            className={`${styles.saveButton} btn w-100`}
                            disabled={isSaving || !isWeightDistributionValid}
                          >
                            {isSaving ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  aria-hidden="true"
                                />
                                Saving rules...
                              </>
                            ) : (
                              <>
                                <FaFloppyDisk
                                  className="me-2"
                                  aria-hidden="true"
                                />
                                Save recommendation rules
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
