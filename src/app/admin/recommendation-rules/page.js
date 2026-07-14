"use client";

import { useEffect, useMemo, useState } from "react";
import { FaChartPie, FaFloppyDisk, FaListOl, FaStar } from "react-icons/fa6";
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
      "Controls how strongly the selected Traveller interests influence the destination score.",
  },
  {
    name: "budgetFitWeight",
    label: "Budget fit weight",
    description:
      "Controls how strongly the estimated trip cost and available Traveller budget influence the score.",
  },
  {
    name: "seasonMatchWeight",
    label: "Season match weight",
    description:
      "Controls how strongly the selected travel month matches the recommended months for the destination.",
  },
  {
    name: "valueForMoneyWeight",
    label: "Value for money weight",
    description:
      "Controls how strongly the relative cost efficiency of the destination influences its position.",
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
    return "Firestore access was denied. Check the published Firestore rules.";
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
          <div className="alert alert-danger mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="alert alert-success mb-4" role="status">
            {statusMessage}
          </div>
        )}

        {isLoading && (
          <div className="alert alert-light border mb-4" role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Loading recommendation rules...
          </div>
        )}

        {!isLoading && !errorMessage && (
          <form onSubmit={handleSubmit} aria-busy={isSaving}>
            <div className="row g-4">
              <div className="col-12 col-md-4">
                <section className={`card h-100 ${styles.handoverCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className="small text-secondary fw-bold text-uppercase mb-2">
                          Weight total
                        </p>

                        <h2 className="h3 fw-bold text-dark mb-1">
                          {totalWeight}%
                        </h2>

                        <p className="text-secondary mb-0">
                          The four ranking weights must equal 100%.
                        </p>
                      </div>

                      <span
                        className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 flex-shrink-0"
                        style={{
                          width: "3rem",
                          height: "3rem",
                        }}
                        aria-hidden="true"
                      >
                        <FaChartPie />
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`card h-100 ${styles.handoverCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className="small text-secondary fw-bold text-uppercase mb-2">
                          Featured destinations
                        </p>

                        <h2 className="h3 fw-bold text-dark mb-1">
                          {formData.featuredDestinations.length}
                        </h2>

                        <p className="text-secondary mb-0">
                          Preferred destinations used when results have equal
                          scores.
                        </p>
                      </div>

                      <span
                        className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 flex-shrink-0"
                        style={{
                          width: "3rem",
                          height: "3rem",
                        }}
                        aria-hidden="true"
                      >
                        <FaStar />
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`card h-100 ${styles.handoverCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className="small text-secondary fw-bold text-uppercase mb-2">
                          Result count
                        </p>

                        <h2 className="h3 fw-bold text-dark mb-1">
                          {formData.minimumRecommendationCount}
                        </h2>

                        <p className="text-secondary mb-0">
                          Number of personalised destinations to display.
                        </p>
                      </div>

                      <span
                        className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 flex-shrink-0"
                        style={{
                          width: "3rem",
                          height: "3rem",
                        }}
                        aria-hidden="true"
                      >
                        <FaListOl />
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12">
                <section className={`card ${styles.handoverCard}`}>
                  <div className="card-body p-4 p-lg-5">
                    <div className="mb-4">
                      <p className="small text-secondary fw-bold text-uppercase mb-2">
                        Ranking priorities
                      </p>

                      <h2 className="h4 fw-bold text-dark mb-2">
                        Recommendation weights
                      </h2>

                      <p className="text-secondary mb-0">
                        Set how strongly each criterion influences the final
                        destination ranking.
                      </p>
                    </div>

                    <div className="row g-4">
                      {weightFields.map((field) => (
                        <div key={field.name} className="col-12 col-md-6">
                          <div className={`h-100 p-4 ${styles.infoBlock}`}>
                            <label
                              className="form-label fw-bold text-dark"
                              htmlFor={field.name}
                            >
                              {field.label}
                            </label>

                            <p className="small text-secondary mb-3">
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
                      className={`alert ${
                        totalWeight === 100 ? "alert-success" : "alert-warning"
                      } mt-4 mb-0`}
                      role="status"
                    >
                      Current weight total: <strong>{totalWeight}%</strong>.
                      {totalWeight === 100
                        ? " The distribution is valid."
                        : " Adjust the values until the total equals 100%."}
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12">
                <section className={`card ${styles.handoverCard}`}>
                  <div className="card-body p-4 p-lg-5">
                    <div className="mb-4">
                      <p className="small text-secondary fw-bold text-uppercase mb-2">
                        Destination priority
                      </p>

                      <h2 className="h4 fw-bold text-dark mb-2">
                        Featured destinations
                      </h2>

                      <p className="text-secondary mb-0">
                        Featured destinations receive priority when two results
                        have the same calculated recommendation score.
                      </p>
                    </div>

                    <div className="row g-3">
                      {mockDestinations.map((destination) => {
                        const inputId = `featured-${destination.destinationId}`;

                        return (
                          <div
                            key={destination.destinationId}
                            className="col-12 col-md-6 col-xl-4"
                          >
                            <div className={`h-100 p-3 ${styles.infoBlock}`}>
                              <div className="form-check">
                                <input
                                  id={inputId}
                                  type="checkbox"
                                  className="form-check-input"
                                  value={destination.destinationId}
                                  checked={formData.featuredDestinations.includes(
                                    destination.destinationId,
                                  )}
                                  onChange={handleFeaturedDestinationChange}
                                  disabled={isSaving}
                                />

                                <label
                                  className="form-check-label fw-bold"
                                  htmlFor={inputId}
                                >
                                  {destination.city}, {destination.country}
                                </label>
                              </div>

                              <p className="small text-secondary mt-2 mb-0">
                                {destination.shortDescription}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12">
                <section className={`card ${styles.handoverCard}`}>
                  <div className="card-body p-4 p-lg-5">
                    <div className="row g-4 align-items-end">
                      <div className="col-12 col-lg-7">
                        <label
                          className="form-label fw-bold text-dark"
                          htmlFor="minimumRecommendationCount"
                        >
                          Number of recommendations
                        </label>

                        <p className="text-secondary mb-3">
                          Choose how many top-ranked destinations Traveller will
                          see after completing the Trip Planner.
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

                        <p className="form-text mb-0">
                          Available range: 1–{mockDestinations.length}.
                        </p>
                      </div>

                      <div className="col-12 col-lg-5 text-lg-end">
                        <button
                          type="submit"
                          className="btn btn-dark px-4"
                          disabled={isSaving || totalWeight !== 100}
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
                              <FaFloppyDisk className="me-2" />
                              Save recommendation rules
                            </>
                          )}
                        </button>
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
