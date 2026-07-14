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
    return "Firestore access was denied. Check the published Firestore rules.";
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
              "The rule-based saving suggestions are available, but the additional AI advice could not be generated.",
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
          <div className="alert alert-danger mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="alert alert-light border mb-4" role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Loading Trip Planner...
          </div>
        )}

        {!isLoading && !errorMessage && isAuthenticated && (
          <div className="row g-4">
            <div className="col-12">
              <section className={`card ${styles.workspaceCard}`}>
                <div className="card-body p-4 p-lg-5">
                  <div className="text-center mb-5">
                    <span
                      className={`${styles.workspaceIcon} d-inline-flex align-items-center justify-content-center mb-3`}
                    >
                      <FaCalendarDays />
                    </span>

                    <p className={`${styles.workspaceLabel} mb-2`}>
                      TravelMind AI Trip Planner
                    </p>

                    <h2 className="h3 fw-bold text-dark mb-3">
                      Plan a trip around your budget
                    </h2>

                    <p className="text-secondary mb-0">
                      Enter your travel preferences to calculate the estimated
                      cost before creating the final itinerary.
                    </p>
                  </div>

                  <TripPlannerForm
                    onSubmit={handlePlannerSubmit}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </section>
            </div>

            {calculationError && (
              <div className="col-12">
                <div className="alert alert-danger mb-0" role="alert">
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
                <section className="card border-0 shadow-sm">
                  <div className="card-body p-4 p-lg-5">
                    <div className="row g-4 align-items-center">
                      <div className="col-12 col-xl-7">
                        <span className="badge bg-dark mb-3">
                          Recommended next step
                        </span>

                        <div className="mb-3">
                          <span
                            className="d-inline-flex align-items-center justify-content-center bg-light border text-dark rounded-4"
                            style={{
                              width: "3.25rem",
                              height: "3.25rem",
                            }}
                          >
                            <FaCompass />
                          </span>
                        </div>

                        <h2 className="h4 fw-bold text-dark mb-2">
                          Your trip preferences are ready
                        </h2>

                        <p className="text-secondary mb-0">
                          Compare personalised destination recommendations based
                          on your budget, travel month, duration, interests and
                          spending style. You can also continue directly with
                          the destination already selected in your planner.
                        </p>
                      </div>

                      <div className="col-12 col-xl-5">
                        <div className="d-flex flex-column gap-3">
                          <button
                            type="button"
                            className="btn btn-dark"
                            onClick={handleOpenRecommendations}
                          >
                            <FaWandMagicSparkles className="me-2" />
                            View personalised recommendations
                            <FaArrowRight className="ms-2" />
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={handleOpenItinerary}
                          >
                            <FaRoute className="me-2" />
                            Continue with selected destination
                          </button>
                        </div>
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
