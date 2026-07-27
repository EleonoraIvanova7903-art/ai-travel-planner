"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowsRotate,
  FaCalendarDays,
  FaCircleInfo,
  FaCompass,
  FaLocationDot,
  FaScaleBalanced,
  FaUsers,
  FaWallet,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { useTripPlanner } from "@/context/TripPlannerContext";
import { mockDestinations } from "@/data/mockDestinations";
import {
  getPlanningCostSettings,
  getPlanningRecommendationRules,
} from "@/firebase/adminService";
import { watchAuthState } from "@/firebase/authService";
import { getDestinationRecommendations } from "@/logic/getDestinationRecommendations";
import TravellerLayout from "../../../../shared/layout/TravellerLayout";
import RecommendationCard from "./RecommendationCard";
import styles from "./recommendations.module.css";

const EXPLANATION_CACHE_PREFIX = "travelmind-recommendation-explanation-v1";

const EXPLANATION_CACHE_DURATION = 24 * 60 * 60 * 1000;

const INSPIRATION_ROTATION_STORAGE_KEY = "travelmind-inspiration-rotation-v1";

const INSPIRATION_ROTATION_DURATION = 24 * 60 * 60 * 1000;

const INSPIRATION_DESTINATION_LIMIT = 3;

const AI_EXPLANATION_LIMIT = 2;

const activeExplanationRequests = new Map();

function getRecommendationsErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in to view destination recommendations.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Your destination recommendations could not be accessed. Please try again.";
  }

  return (
    error?.message || "The destination recommendations could not be loaded."
  );
}

function normaliseRotationIndex(index, destinationCount) {
  if (!destinationCount) {
    return 0;
  }

  const numericIndex = Number(index);

  if (!Number.isFinite(numericIndex)) {
    return 0;
  }

  return (
    ((numericIndex % destinationCount) + destinationCount) % destinationCount
  );
}

function saveInspirationRotation(rotationIndex) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      INSPIRATION_ROTATION_STORAGE_KEY,
      JSON.stringify({
        rotationIndex,
        expiresAt: Date.now() + INSPIRATION_ROTATION_DURATION,
      }),
    );
  } catch (error) {
    console.warn("Travel inspiration rotation could not be saved:", error);
  }
}

function readInspirationRotation() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const storedValue = window.localStorage.getItem(
      INSPIRATION_ROTATION_STORAGE_KEY,
    );

    if (!storedValue) {
      saveInspirationRotation(0);
      return 0;
    }

    const storedRotation = JSON.parse(storedValue);

    const currentRotationIndex = Number(storedRotation?.rotationIndex);

    const expiresAt = Number(storedRotation?.expiresAt);

    if (
      Number.isFinite(currentRotationIndex) &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now()
    ) {
      return currentRotationIndex;
    }

    const nextRotationIndex =
      (Number.isFinite(currentRotationIndex) ? currentRotationIndex : 0) +
      INSPIRATION_DESTINATION_LIMIT;

    saveInspirationRotation(nextRotationIndex);

    return nextRotationIndex;
  } catch (error) {
    console.warn("Travel inspiration rotation could not be read:", error);

    saveInspirationRotation(0);

    return 0;
  }
}

function getRotatedDestinations({
  destinations,
  rotationIndex,
  selectedDestinationId,
  limit,
}) {
  if (!Array.isArray(destinations) || destinations.length === 0) {
    return [];
  }

  const normalisedIndex = normaliseRotationIndex(
    rotationIndex,
    destinations.length,
  );

  const rotatedDestinations = [];

  for (
    let offset = 0;
    offset < destinations.length && rotatedDestinations.length < limit;
    offset += 1
  ) {
    const destinationIndex = (normalisedIndex + offset) % destinations.length;

    rotatedDestinations.push(destinations[destinationIndex]);
  }

  if (!selectedDestinationId) {
    return rotatedDestinations;
  }

  const selectedDestination = destinations.find(
    (destination) => destination.destinationId === selectedDestinationId,
  );

  if (!selectedDestination) {
    return rotatedDestinations;
  }

  const selectedDestinationIndex = rotatedDestinations.findIndex(
    (destination) => destination.destinationId === selectedDestinationId,
  );

  if (selectedDestinationIndex === 0) {
    return rotatedDestinations;
  }

  if (selectedDestinationIndex > 0) {
    return [
      selectedDestination,
      ...rotatedDestinations.filter(
        (destination) => destination.destinationId !== selectedDestinationId,
      ),
    ].slice(0, limit);
  }

  return [selectedDestination, ...rotatedDestinations].slice(0, limit);
}

function createExplanationCacheKey({
  destination,
  budget,
  duration,
  travellers,
  travelMonth,
  spendingTier,
  interests,
}) {
  const normalisedInterests = Array.isArray(interests)
    ? [...interests]
        .map((interest) => String(interest).trim())
        .filter(Boolean)
        .sort((firstInterest, secondInterest) =>
          firstInterest.localeCompare(secondInterest),
        )
    : [];

  const cacheData = {
    destinationId: destination.destinationId,
    budget: Number(budget),
    duration: Number(duration),
    travellers: Number(travellers),
    travelMonth: String(travelMonth || ""),
    spendingTier: String(spendingTier || ""),
    interests: normalisedInterests,
  };

  return `${EXPLANATION_CACHE_PREFIX}:${encodeURIComponent(
    JSON.stringify(cacheData),
  )}`;
}

function readCachedExplanation(cacheKey) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(cacheKey);

    if (!storedValue) {
      return null;
    }

    const cachedData = JSON.parse(storedValue);

    const hasValidExplanation =
      typeof cachedData?.explanation === "string" &&
      cachedData.explanation.trim();

    const hasValidExpiry =
      Number.isFinite(Number(cachedData?.expiresAt)) &&
      Number(cachedData.expiresAt) > Date.now();

    if (!hasValidExplanation || !hasValidExpiry) {
      window.localStorage.removeItem(cacheKey);
      return null;
    }

    return cachedData.explanation.trim();
  } catch (error) {
    console.warn("Recommendation explanation cache could not be read:", error);

    return null;
  }
}

function saveCachedExplanation(cacheKey, explanation) {
  if (
    typeof window === "undefined" ||
    typeof explanation !== "string" ||
    !explanation.trim()
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        explanation: explanation.trim(),
        createdAt: Date.now(),
        expiresAt: Date.now() + EXPLANATION_CACHE_DURATION,
      }),
    );
  } catch (error) {
    console.warn("Recommendation explanation could not be cached:", error);
  }
}

async function requestRecommendationExplanation({
  destination,
  budget,
  duration,
  travellers,
  interests,
}) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestType: "recommendation-explanation",
      destination: `${destination.city}, ${destination.country}`,
      budget,
      duration,
      travellers,
      interests,
    }),
  });

  const responseText = await response.text();

  let responseData = {};

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error(
        "The travel advice service returned an invalid response.",
      );
    }
  }

  if (!response.ok || !responseData.success) {
    const requestError = new Error(
      responseData.message ||
        "The personalised explanation could not be generated.",
    );

    requestError.code =
      responseData.errorCode || "RECOMMENDATION_EXPLANATION_FAILED";

    throw requestError;
  }

  return responseData.explanation;
}

async function generateAndCacheExplanation({
  cacheKey,
  destination,
  budget,
  duration,
  travellers,
  interests,
}) {
  const existingRequest = activeExplanationRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const explanationRequest = requestRecommendationExplanation({
    destination,
    budget,
    duration,
    travellers,
    interests,
  })
    .then((explanation) => {
      saveCachedExplanation(cacheKey, explanation);

      return explanation;
    })
    .finally(() => {
      activeExplanationRequests.delete(cacheKey);
    });

  activeExplanationRequests.set(cacheKey, explanationRequest);

  return explanationRequest;
}

export default function RecommendationsPage() {
  const router = useRouter();

  const {
    tripPlannerData,
    comparisonDestinationIds,
    updateTripPlannerField,
    toggleComparisonDestination,
  } = useTripPlanner();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoadingAuthentication, setIsLoadingAuthentication] = useState(true);

  const [costSettings, setCostSettings] = useState(null);

  const [recommendationRules, setRecommendationRules] = useState(null);

  const [pageErrorMessage, setPageErrorMessage] = useState("");

  const [explanations, setExplanations] = useState({});

  const [explanationErrors, setExplanationErrors] = useState({});

  const [explanationLoading, setExplanationLoading] = useState({});

  const [cachedExplanations, setCachedExplanations] = useState({});

  const [inspirationRotationIndex, setInspirationRotationIndex] = useState(0);

  const budget = Number(tripPlannerData.budget);

  const duration = Number(tripPlannerData.duration);

  const travellers = Number(tripPlannerData.travellers);

  const departureAirportCode = String(
    tripPlannerData.departureAirportCode || "",
  ).trim();

  const travelMonth = String(tripPlannerData.travelMonth || "").trim();

  const hasRequiredPlannerData =
    Number.isFinite(budget) &&
    budget > 0 &&
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(travellers) &&
    travellers > 0 &&
    Boolean(departureAirportCode) &&
    Boolean(travelMonth);

  const recommendations = useMemo(() => {
    if (!hasRequiredPlannerData) {
      return [];
    }

    return getDestinationRecommendations({
      destinations: mockDestinations,
      budget,
      interests: tripPlannerData.interests,
      travelMonth,
      duration,
      travellers,
      departureAirportCode,
      spendingTier: tripPlannerData.spendingTier,
      costSettings,
      recommendationRules,
    });
  }, [
    budget,
    costSettings,
    departureAirportCode,
    duration,
    hasRequiredPlannerData,
    recommendationRules,
    travellers,
    travelMonth,
    tripPlannerData.interests,
    tripPlannerData.spendingTier,
  ]);

  const inspirationDestinations = useMemo(
    () =>
      getRotatedDestinations({
        destinations: mockDestinations,
        rotationIndex: inspirationRotationIndex,
        selectedDestinationId: tripPlannerData.destination,
        limit: INSPIRATION_DESTINATION_LIMIT,
      }),
    [inspirationRotationIndex, tripPlannerData.destination],
  );

  useEffect(() => {
    setInspirationRotationIndex(readInspirationRotation());
  }, []);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      try {
        setIsLoadingAuthentication(true);
        setPageErrorMessage("");

        if (!authUser) {
          setIsAuthenticated(false);
          setCostSettings(null);
          setRecommendationRules(null);

          setPageErrorMessage("Sign in to view destination recommendations.");

          return;
        }

        const [loadedCostSettings, loadedRecommendationRules] =
          await Promise.all([
            getPlanningCostSettings(),
            getPlanningRecommendationRules(),
          ]);

        if (!isActive) {
          return;
        }

        setCostSettings(loadedCostSettings);

        setRecommendationRules(loadedRecommendationRules);

        setIsAuthenticated(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setIsAuthenticated(false);
        setCostSettings(null);
        setRecommendationRules(null);

        setPageErrorMessage(getRecommendationsErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoadingAuthentication(false);
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

  useEffect(() => {
    if (
      !isAuthenticated ||
      isLoadingAuthentication ||
      !hasRequiredPlannerData ||
      recommendations.length === 0
    ) {
      return undefined;
    }

    let isActive = true;

    const initialExplanations = {};
    const initialLoadingState = {};
    const initialCachedState = {};
    const destinationsToGenerate = [];

    const destinationsWithAiExplanations = recommendations.slice(
      0,
      AI_EXPLANATION_LIMIT,
    );

    destinationsWithAiExplanations.forEach((destination) => {
      const cacheKey = createExplanationCacheKey({
        destination,
        budget,
        duration,
        travellers,
        travelMonth,
        spendingTier: tripPlannerData.spendingTier,
        interests: tripPlannerData.interests,
      });

      const cachedExplanation = readCachedExplanation(cacheKey);

      if (cachedExplanation) {
        initialExplanations[destination.destinationId] = cachedExplanation;

        initialLoadingState[destination.destinationId] = false;

        initialCachedState[destination.destinationId] = true;
      } else {
        initialLoadingState[destination.destinationId] = true;

        initialCachedState[destination.destinationId] = false;

        destinationsToGenerate.push({
          destination,
          cacheKey,
        });
      }
    });

    setExplanations(initialExplanations);
    setExplanationErrors({});
    setExplanationLoading(initialLoadingState);
    setCachedExplanations(initialCachedState);

    async function loadMissingExplanations() {
      await Promise.all(
        destinationsToGenerate.map(async ({ destination, cacheKey }) => {
          try {
            const explanation = await generateAndCacheExplanation({
              cacheKey,
              destination,
              budget,
              duration,
              travellers,
              interests: tripPlannerData.interests,
            });

            if (!isActive) {
              return;
            }

            setExplanations((currentExplanations) => ({
              ...currentExplanations,
              [destination.destinationId]: explanation,
            }));

            setCachedExplanations((currentCachedState) => ({
              ...currentCachedState,
              [destination.destinationId]: false,
            }));
          } catch (error) {
            if (!isActive) {
              return;
            }

            setExplanationErrors((currentErrors) => ({
              ...currentErrors,
              [destination.destinationId]:
                error?.message ||
                "The additional explanation is temporarily unavailable. You can still use the recommendation.",
            }));
          } finally {
            if (isActive) {
              setExplanationLoading((currentLoadingState) => ({
                ...currentLoadingState,
                [destination.destinationId]: false,
              }));
            }
          }
        }),
      );
    }

    loadMissingExplanations();

    return () => {
      isActive = false;
    };
  }, [
    budget,
    duration,
    travellers,
    travelMonth,
    hasRequiredPlannerData,
    isAuthenticated,
    isLoadingAuthentication,
    recommendations,
    tripPlannerData.interests,
    tripPlannerData.spendingTier,
  ]);

  function handleOpenPlanner() {
    router.push("/traveller/trip-planning/planner");
  }

  function handleSignIn() {
    router.push("/login");
  }

  function handleSelectRecommendation(destination) {
    updateTripPlannerField("destination", destination.destinationId);

    router.push("/traveller/trip-planning/itinerary");
  }

  function handleCompareRecommendations(destination) {
    toggleComparisonDestination(destination.destinationId);
  }

  function handleOpenComparison() {
    router.push("/trip-comparison");
  }

  function handlePlanInspiredDestination(destination) {
    updateTripPlannerField("destination", destination.destinationId);

    router.push("/traveller/trip-planning/planner");
  }

  function handleShowDifferentDestinations() {
    setInspirationRotationIndex((currentRotationIndex) => {
      const nextRotationIndex =
        currentRotationIndex + INSPIRATION_DESTINATION_LIMIT;

      saveInspirationRotation(nextRotationIndex);

      return nextRotationIndex;
    });
  }

  return (
    <TravellerLayout
      pageTitle="Recommendations"
      pageDescription="Explore destination ideas and compare places matched to your travel preferences."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {isLoadingAuthentication && (
          <div
            className={`${styles.loadingPanel} d-flex align-items-center gap-3 mb-4`}
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>Preparing your destination recommendations...</span>
          </div>
        )}

        {!isLoadingAuthentication && pageErrorMessage && !isAuthenticated && (
          <section className={`${styles.authCard} text-center`}>
            <span
              className={`${styles.authIcon} d-inline-flex align-items-center justify-content-center mb-3`}
              aria-hidden="true"
            >
              <FaCompass />
            </span>

            <h2 className={`${styles.authTitle} mb-3`}>Sign in required</h2>

            <p className={`${styles.authText} mx-auto mb-4`}>
              {pageErrorMessage}
            </p>

            <button
              type="button"
              className={`${styles.primaryButton} btn px-4`}
              onClick={handleSignIn}
            >
              Sign in
            </button>
          </section>
        )}

        {!isLoadingAuthentication && isAuthenticated && pageErrorMessage && (
          <div className={`${styles.pageError} mb-4`} role="alert">
            {pageErrorMessage}
          </div>
        )}

        {!isLoadingAuthentication && isAuthenticated && !pageErrorMessage && (
          <div className="row g-4">
            {!hasRequiredPlannerData && (
              <div className="col-12">
                <section className={styles.plannerPrompt}>
                  <div className="row g-4 align-items-center">
                    <div className="col-12 col-xl-8">
                      <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                        <span
                          className={`${styles.promptIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                          aria-hidden="true"
                        >
                          <FaCircleInfo />
                        </span>

                        <div>
                          <p className={`${styles.promptEyebrow} mb-2`}>
                            Personalised travel planning
                          </p>

                          <h2 className={`${styles.promptTitle} mb-3`}>
                            Find destinations that suit your trip
                          </h2>

                          <p className={`${styles.promptText} mb-0`}>
                            Complete the Trip Planner to receive destination
                            suggestions based on your budget, departure airport,
                            travel month, duration, interests and spending
                            preference.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-xl-4 text-xl-end">
                      <button
                        type="button"
                        className={`${styles.lightButton} btn px-4`}
                        onClick={handleOpenPlanner}
                      >
                        Open Trip Planner
                        <FaArrowRight className="ms-2" />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {hasRequiredPlannerData && (
              <>
                <div className="col-12">
                  <section className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                      <div className="row g-4 align-items-center">
                        <div className="col-12 col-xl-7">
                          <p className={`${styles.summaryEyebrow} mb-2`}>
                            Personalised destination matching
                          </p>

                          <h2 className={`${styles.summaryTitle} mb-3`}>
                            Your top destination recommendations
                          </h2>

                          <p className={`${styles.summaryDescription} mb-0`}>
                            Explore places matched to your travel interests,
                            available budget, selected month, duration and
                            preferred spending style.
                          </p>
                        </div>

                        <div className="col-12 col-xl-5">
                          <div className="row g-2">
                            <div className="col-6">
                              <div className={`${styles.headerMetric} h-100`}>
                                <FaWallet
                                  className={styles.headerMetricIcon}
                                  aria-hidden="true"
                                />

                                <p
                                  className={`${styles.headerMetricLabel} mb-1`}
                                >
                                  Budget
                                </p>

                                <p
                                  className={`${styles.headerMetricValue} mb-0`}
                                >
                                  £{budget.toLocaleString("en-GB")}
                                </p>
                              </div>
                            </div>

                            <div className="col-6">
                              <div className={`${styles.headerMetric} h-100`}>
                                <FaUsers
                                  className={styles.headerMetricIcon}
                                  aria-hidden="true"
                                />

                                <p
                                  className={`${styles.headerMetricLabel} mb-1`}
                                >
                                  Travellers
                                </p>

                                <p
                                  className={`${styles.headerMetricValue} mb-0`}
                                >
                                  {travellers}
                                </p>
                              </div>
                            </div>

                            <div className="col-6">
                              <div className={`${styles.headerMetric} h-100`}>
                                <FaCalendarDays
                                  className={styles.headerMetricIcon}
                                  aria-hidden="true"
                                />

                                <p
                                  className={`${styles.headerMetricLabel} mb-1`}
                                >
                                  Duration
                                </p>

                                <p
                                  className={`${styles.headerMetricValue} mb-0`}
                                >
                                  {duration} days
                                </p>
                              </div>
                            </div>

                            <div className="col-6">
                              <div className={`${styles.headerMetric} h-100`}>
                                <FaCompass
                                  className={styles.headerMetricIcon}
                                  aria-hidden="true"
                                />

                                <p
                                  className={`${styles.headerMetricLabel} mb-1`}
                                >
                                  Spending style
                                </p>

                                <p
                                  className={`${styles.headerMetricValue} ${styles.headerMetricValueSmall} mb-0`}
                                >
                                  {tripPlannerData.spendingTier}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.summaryFooter}>
                      <div className="d-flex flex-wrap gap-2 gap-lg-3">
                        <span className={styles.summaryDetail}>
                          <FaCalendarDays aria-hidden="true" />
                          {travelMonth}
                        </span>

                        <span className={styles.summaryDetail}>
                          <FaUsers aria-hidden="true" />
                          {travellers}{" "}
                          {travellers === 1 ? "traveller" : "travellers"}
                        </span>

                        <span className={styles.summaryDetail}>
                          <FaWallet aria-hidden="true" />
                          {tripPlannerData.spendingTier} spending
                        </span>

                        <span className={styles.summaryDetail}>
                          <FaLocationDot aria-hidden="true" />
                          {recommendations.length} ranked destinations
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                {tripPlannerData.interests.length > 0 && (
                  <div className="col-12">
                    <section className={styles.interestsPanel}>
                      <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
                        <div className="d-flex align-items-center gap-3 flex-shrink-0">
                          <span
                            className={`${styles.panelIcon} d-inline-flex align-items-center justify-content-center`}
                            aria-hidden="true"
                          >
                            <FaCompass />
                          </span>

                          <div>
                            <p className={`${styles.panelEyebrow} mb-1`}>
                              Your preferences
                            </p>

                            <h2 className={`${styles.panelTitle} mb-0`}>
                              Selected interests
                            </h2>
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 ms-lg-auto">
                          {tripPlannerData.interests.map((interest) => (
                            <span
                              key={interest}
                              className={styles.selectedInterest}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                <div className="col-12">
                  <section className={styles.comparisonPanel}>
                    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
                      <div className="d-flex align-items-start gap-3">
                        <span
                          className={`${styles.comparisonIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                          aria-hidden="true"
                        >
                          <FaScaleBalanced />
                        </span>

                        <div>
                          <h2 className={`${styles.comparisonTitle} mb-2`}>
                            Compare your favourites
                          </h2>

                          <p className={`${styles.comparisonText} mb-0`}>
                            {comparisonDestinationIds.length === 0
                              ? "Select two or three destinations to compare their costs and suitability."
                              : `${comparisonDestinationIds.length} of 3 destinations selected for comparison.`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`${styles.comparisonButton} btn flex-shrink-0`}
                        onClick={handleOpenComparison}
                        disabled={comparisonDestinationIds.length < 2}
                      >
                        <FaScaleBalanced className="me-2" />
                        {comparisonDestinationIds.length < 2
                          ? "Select at least two"
                          : `Compare selected (${comparisonDestinationIds.length})`}
                      </button>
                    </div>
                  </section>
                </div>

                {recommendations.length === 0 && (
                  <div className="col-12">
                    <div className={styles.warningPanel} role="alert">
                      No destination recommendations could be created from the
                      current travel preferences.
                    </div>
                  </div>
                )}

                {recommendations.map((destination, index) => {
                  const isAiExplanationEnabled = index < AI_EXPLANATION_LIMIT;

                  return (
                    <div
                      key={`personalised-${destination.destinationId}`}
                      className="col-12 col-xl-4"
                    >
                      <RecommendationCard
                        mode="personalised"
                        destination={destination}
                        isAiExplanationEnabled={isAiExplanationEnabled}
                        explanation={
                          isAiExplanationEnabled
                            ? explanations[destination.destinationId] || ""
                            : ""
                        }
                        explanationError={
                          isAiExplanationEnabled
                            ? explanationErrors[destination.destinationId] || ""
                            : ""
                        }
                        isExplanationLoading={
                          isAiExplanationEnabled
                            ? explanationLoading[destination.destinationId] ||
                              false
                            : false
                        }
                        isExplanationCached={
                          isAiExplanationEnabled
                            ? cachedExplanations[destination.destinationId] ||
                              false
                            : false
                        }
                        isSelected={
                          tripPlannerData.destination ===
                          destination.destinationId
                        }
                        isCompared={comparisonDestinationIds.includes(
                          destination.destinationId,
                        )}
                        isCompareDisabled={
                          comparisonDestinationIds.length >= 3 &&
                          !comparisonDestinationIds.includes(
                            destination.destinationId,
                          )
                        }
                        onSelect={handleSelectRecommendation}
                        onCompare={handleCompareRecommendations}
                      />
                    </div>
                  );
                })}

                <div className="col-12">
                  <section className={styles.editPreferencesPanel}>
                    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                      <div>
                        <h2 className={`${styles.editPreferencesTitle} mb-2`}>
                          Need to change your preferences?
                        </h2>

                        <p className={`${styles.editPreferencesText} mb-0`}>
                          Return to the Trip Planner to update your budget,
                          month, duration, interests or spending preference.
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`${styles.secondaryButton} btn flex-shrink-0`}
                        onClick={handleOpenPlanner}
                      >
                        <FaArrowLeft className="me-2" />
                        Edit trip preferences
                      </button>
                    </div>
                  </section>
                </div>
              </>
            )}

            <div className="col-12">
              <section className={styles.inspirationHeader}>
                <div className="row g-4 align-items-center">
                  <div className="col-12 col-xl-8">
                    <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                      <span
                        className={`${styles.inspirationHeaderIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                        aria-hidden="true"
                      >
                        <FaWandMagicSparkles />
                      </span>

                      <div>
                        <p className={`${styles.inspirationEyebrow} mb-2`}>
                          Fresh destination ideas
                        </p>

                        <h2 className={`${styles.inspirationTitle} mb-3`}>
                          {hasRequiredPlannerData
                            ? "More travel inspiration"
                            : "Travel inspiration"}
                        </h2>

                        <p className={`${styles.inspirationText} mb-0`}>
                          Explore a changing selection of destinations and
                          choose one to begin planning your next trip.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-xl-4 text-xl-end">
                    <button
                      type="button"
                      className={`${styles.inspirationButton} btn`}
                      onClick={handleShowDifferentDestinations}
                    >
                      <FaArrowsRotate className="me-2" />
                      Show different destinations
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {inspirationDestinations.map((destination) => (
              <div
                key={`inspiration-${destination.destinationId}`}
                className="col-12 col-xl-4"
              >
                <RecommendationCard
                  mode="inspiration"
                  destination={destination}
                  isSelected={
                    tripPlannerData.destination === destination.destinationId
                  }
                  onSelect={handlePlanInspiredDestination}
                />
              </div>
            ))}

            <div className="col-12">
              <div
                className={`${styles.pageNote} d-flex align-items-start gap-3`}
                role="note"
              >
                <FaWandMagicSparkles
                  className="flex-shrink-0 mt-1"
                  aria-hidden="true"
                />

                <p className="mb-0">
                  {hasRequiredPlannerData
                    ? "Choose a recommended destination to continue with your itinerary, or select several options for comparison."
                    : "Choose an inspiration destination to add it to the Trip Planner, then complete your travel preferences."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
