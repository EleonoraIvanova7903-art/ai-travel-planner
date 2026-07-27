"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowRight,
  FaCalendarDays,
  FaCompass,
  FaRoute,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { useTripPlanner } from "@/context/TripPlannerContext";
import { mockDestinations } from "@/data/mockDestinations";
import { getPlanningCostSettings } from "@/firebase/adminService";
import { watchAuthState } from "@/firebase/authService";
import { calculateTripCost } from "@/logic/calculateTripCost";
import { getBudgetStatus } from "@/logic/getBudgetStatus";
import { getOptimisationSuggestions } from "@/logic/getOptimisationSuggestions";
import TravellerLayout from "../../../../shared/layout/TravellerLayout";
import BudgetSummary from "./BudgetSummary";
import OptimisationSuggestions from "./OptimisationSuggestions";
import TripPlannerForm from "./TripPlannerForm";
import styles from "./planner.module.css";

function getPlannerErrorMessage(error) {
  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "The Trip Planner information could not be accessed. Please try again.";
  }

  return error?.message || "The Trip Planner could not be loaded.";
}

function normaliseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getMatchedInterests(destinationInterests, selectedInterests) {
  const normalisedDestinationInterests = Array.isArray(destinationInterests)
    ? destinationInterests.map(normaliseValue)
    : [];

  return Array.isArray(selectedInterests)
    ? selectedInterests.filter((interest) =>
        normalisedDestinationInterests.includes(normaliseValue(interest)),
      )
    : [];
}

function prepareAlternativeTrips(plannerData, costSettings) {
  return mockDestinations
    .filter(
      (destination) => destination.destinationId !== plannerData.destination,
    )
    .map((destination) => {
      const alternativeTripCost = calculateTripCost({
        destinationId: destination.destinationId,
        departureAirportCode: plannerData.departureAirportCode,
        travelMonth: plannerData.travelMonth,
        duration: plannerData.duration,
        travellers: plannerData.travellers,
        spendingTier: plannerData.spendingTier,
        interests: plannerData.interests,
        costSettings,
      });

      if (!alternativeTripCost) {
        return null;
      }

      return {
        destinationId: destination.destinationId,
        city: destination.city,
        country: destination.country,
        estimatedCost: alternativeTripCost.total,
        tripCost: alternativeTripCost,
        matchedInterests: getMatchedInterests(
          destination.interests,
          plannerData.interests,
        ),
      };
    })
    .filter(Boolean);
}

async function requestBudgetAdvice({
  destination,
  budget,
  estimatedCost,
  budgetStatus,
  optimisationSuggestions,
}) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestType: "budget-advice",
      destination,
      budget,
      estimatedCost,
      budgetStatus,
      optimisationSuggestions,
    }),
  });

  const responseData = await response.json();

  if (!response.ok || !responseData.success) {
    throw new Error(
      responseData.message || "The AI budget advice could not be generated.",
    );
  }

  return responseData.advice;
}

export default function TripPlannerPage() {
  const router = useRouter();

  const { setTripPlannerResults } = useTripPlanner();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [costSettings, setCostSettings] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [calculationError, setCalculationError] = useState("");

  const [tripCost, setTripCost] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [optimisationData, setOptimisationData] = useState(null);

  const [aiAdvice, setAiAdvice] = useState([]);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        if (!authUser) {
          setIsAuthenticated(false);
          setCostSettings(null);
          setErrorMessage("Sign in to open the Trip Planner page.");
          return;
        }

        const loadedCostSettings = await getPlanningCostSettings();

        if (!isActive) {
          return;
        }

        setCostSettings(loadedCostSettings);
        setIsAuthenticated(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setIsAuthenticated(false);
        setCostSettings(null);
        setErrorMessage(getPlannerErrorMessage(error));
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

  async function handlePlannerSubmit(plannerData) {
    setIsSubmitting(true);
    setCalculationError("");
    setAdviceError("");
    setAiAdvice([]);
    setIsAdviceLoading(false);

    setTripPlannerResults({
      tripCost: null,
      budgetStatus: null,
      optimisationData: null,
      aiAdvice: [],
    });

    try {
      const selectedDestination = mockDestinations.find(
        (destination) => destination.destinationId === plannerData.destination,
      );

      if (!selectedDestination) {
        throw new Error(
          "Select a valid destination before calculating the trip cost.",
        );
      }

      const calculatedTripCost = calculateTripCost({
        destinationId: plannerData.destination,
        departureAirportCode: plannerData.departureAirportCode,
        travelMonth: plannerData.travelMonth,
        duration: plannerData.duration,
        travellers: plannerData.travellers,
        spendingTier: plannerData.spendingTier,
        interests: plannerData.interests,
        costSettings,
      });

      if (!calculatedTripCost) {
        throw new Error(
          "The trip cost could not be calculated from the current planner information.",
        );
      }

      const calculatedBudgetStatus = getBudgetStatus({
        budget: plannerData.budget,
        estimatedCost: calculatedTripCost.total,
        budgetWarningThresholdPercentage:
          costSettings?.budgetWarningThresholdPercentage,
      });

      const alternativeTrips = prepareAlternativeTrips(
        plannerData,
        costSettings,
      );

      const calculatedOptimisationData = getOptimisationSuggestions({
        tripCost: calculatedTripCost,
        budgetStatus: calculatedBudgetStatus,
        budget: plannerData.budget,
        destinationId: plannerData.destination,
        alternativeTrips,
      });

      setTripCost(calculatedTripCost);
      setBudgetStatus(calculatedBudgetStatus);
      setOptimisationData(calculatedOptimisationData);

      setTripPlannerResults({
        tripCost: calculatedTripCost,
        budgetStatus: calculatedBudgetStatus,
        optimisationData: calculatedOptimisationData,
        aiAdvice: [],
      });

      window.setTimeout(() => {
        document.getElementById("planner-next-steps")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);

      if (
        calculatedTripCost.isComplete &&
        calculatedOptimisationData.shouldOptimise
      ) {
        setIsAdviceLoading(true);

        try {
          const preparedSuggestions =
            calculatedOptimisationData.suggestions.map(
              (suggestion) =>
                `${suggestion.title}: estimated saving £${suggestion.estimatedSaving.toFixed(
                  2,
                )}, updated total £${suggestion.updatedTotal.toFixed(2)}.`,
            );

          const advice = await requestBudgetAdvice({
            destination: `${selectedDestination.city}, ${selectedDestination.country}`,
            budget: Number(plannerData.budget),
            estimatedCost: calculatedTripCost.total,
            budgetStatus: calculatedBudgetStatus.label,
            optimisationSuggestions: preparedSuggestions,
          });

          const preparedAdvice = Array.isArray(advice)
            ? advice
            : advice
              ? [advice]
              : [];

          setAiAdvice(preparedAdvice);

          setTripPlannerResults((currentResults) => ({
            ...currentResults,
            aiAdvice: preparedAdvice,
          }));
        } catch (error) {
          setAdviceError(
            error?.message ||
              "The saving suggestions are available, but additional advice could not be prepared.",
          );
        } finally {
          setIsAdviceLoading(false);
        }
      }
    } catch (error) {
      setTripCost(null);
      setBudgetStatus(null);
      setOptimisationData(null);

      setTripPlannerResults({
        tripCost: null,
        budgetStatus: null,
        optimisationData: null,
        aiAdvice: [],
      });

      setCalculationError(
        error?.message || "The trip budget could not be calculated.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenRecommendations() {
    router.push("/traveller/trip-planning/recommendations");
  }

  function handleOpenItinerary() {
    router.push("/traveller/trip-planning/itinerary");
  }

  return (
    <TravellerLayout
      pageTitle="Trip Planner"
      pageDescription="Plan a trip, review its estimated cost and find practical ways to stay within budget."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div className={`${styles.pageError} mb-4`} role="alert">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div
            className={`${styles.loadingPanel} d-flex align-items-center gap-3 mb-4`}
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>Loading your Trip Planner...</span>
          </div>
        )}

        {!isLoading && !errorMessage && isAuthenticated && (
          <div className="row g-4">
            <div className="col-12">
              <section className={styles.workspaceCard}>
                <div className={styles.workspaceHeader}>
                  <div className="row g-4 align-items-center">
                    <div className="col-12 col-lg-8">
                      <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                        <span
                          className={`${styles.workspaceIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                          aria-hidden="true"
                        >
                          <FaCalendarDays />
                        </span>

                        <div>
                          <p className={`${styles.workspaceLabel} mb-2`}>
                            TravelMind AI Trip Planner
                          </p>

                          <h2 className={`${styles.workspaceTitle} mb-2`}>
                            Plan a trip around your budget
                          </h2>

                          <p className={`${styles.workspaceDescription} mb-0`}>
                            Choose your destination, travel period and
                            preferences to create a personalised cost estimate.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-4">
                      <div className={styles.workspaceSummary}>
                        <p className={`${styles.workspaceSummaryLabel} mb-1`}>
                          Start with your preferences
                        </p>

                        <p className={`${styles.workspaceSummaryText} mb-0`}>
                          You can review costs, possible savings and your next
                          travel steps on the same page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.workspaceBody}>
                  <TripPlannerForm
                    onSubmit={handlePlannerSubmit}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </section>
            </div>

            {calculationError && (
              <div className="col-12">
                <div className={styles.pageError} role="alert">
                  {calculationError}
                </div>
              </div>
            )}

            {(tripCost || isSubmitting) && (
              <div className="col-12" id="planner-results">
                <BudgetSummary
                  tripCost={tripCost}
                  budgetStatus={budgetStatus}
                  isCalculating={isSubmitting}
                />
              </div>
            )}

            {tripCost && budgetStatus && (
              <div className="col-12" id="planner-next-steps">
                <section className={styles.nextStepCard}>
                  <div className="row g-4 align-items-center">
                    <div className="col-12 col-xl-7">
                      <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                        <span
                          className={`${styles.nextStepIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                          aria-hidden="true"
                        >
                          <FaCompass />
                        </span>

                        <div>
                          <p className={`${styles.nextStepEyebrow} mb-2`}>
                            Recommended next step
                          </p>

                          <h2 className={`${styles.nextStepTitle} mb-2`}>
                            Your travel preferences are ready
                          </h2>

                          <p className={`${styles.nextStepText} mb-0`}>
                            Explore personalised destination recommendations or
                            continue directly with the destination already
                            selected in your plan.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-xl-5">
                      <div className="d-flex flex-column gap-3">
                        <button
                          type="button"
                          className={`${styles.nextStepPrimaryButton} btn`}
                          onClick={handleOpenRecommendations}
                        >
                          <FaWandMagicSparkles className="me-2" />
                          View personalised recommendations
                          <FaArrowRight className="ms-2" />
                        </button>

                        <button
                          type="button"
                          className={`${styles.nextStepSecondaryButton} btn`}
                          onClick={handleOpenItinerary}
                        >
                          <FaRoute className="me-2" />
                          Continue with selected destination
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tripCost && budgetStatus && optimisationData && (
              <div className="col-12">
                <OptimisationSuggestions
                  optimisationData={optimisationData}
                  aiAdvice={aiAdvice}
                  isAdviceLoading={isAdviceLoading}
                  adviceError={adviceError}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
