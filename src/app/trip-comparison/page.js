"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaCircleInfo,
  FaCompass,
  FaPenToSquare,
  FaScaleBalanced,
  FaTrashCan,
} from "react-icons/fa6";
import { useTripPlanner } from "@/context/TripPlannerContext";
import { mockDestinations } from "@/data/mockDestinations";
import {
  getPlanningCostSettings,
  getPlanningRecommendationRules,
} from "@/firebase/adminService";
import { watchAuthState } from "@/firebase/authService";
import { calculateTripCost } from "@/logic/calculateTripCost";
import { getBudgetStatus } from "@/logic/getBudgetStatus";
import { getDestinationRecommendations } from "@/logic/getDestinationRecommendations";
import TravellerLayout from "../../shared/layout/TravellerLayout";
import TripComparisonSummary from "./TripComparisonSummary";
import TripComparisonTable from "./TripComparisonTable";
import styles from "./trip-comparison.module.css";

const COMPARISON_DESTINATION_LIMIT = 3;

function getBudgetType(status) {
  const statusTypes = {
    "within-budget": "success",
    "close-to-budget": "warning",
    "over-budget": "danger",
  };

  return statusTypes[status] || "secondary";
}

function getInterestMatchPercentage(matchedInterests, selectedInterests) {
  if (!Array.isArray(selectedInterests) || selectedInterests.length === 0) {
    return 0;
  }

  const matchCount = Array.isArray(matchedInterests)
    ? matchedInterests.length
    : 0;

  return Math.round((matchCount / selectedInterests.length) * 100);
}

function prepareComparisonTrip({ destination, plannerData, costSettings }) {
  const tripCost = calculateTripCost({
    destinationId: destination.destinationId,
    departureAirportCode: plannerData.departureAirportCode,
    travelMonth: plannerData.travelMonth,
    duration: plannerData.duration,
    travellers: plannerData.travellers,
    spendingTier: plannerData.spendingTier,
    interests: plannerData.interests,
    costSettings,
  });

  if (!tripCost) {
    return null;
  }

  const budgetStatus = getBudgetStatus({
    budget: plannerData.budget,
    estimatedCost: tripCost.total,
    budgetWarningThresholdPercentage:
      costSettings?.budgetWarningThresholdPercentage,
  });

  const duration = Number(plannerData.duration);

  const matchedInterests = Array.isArray(destination.matchedInterests)
    ? destination.matchedInterests
    : [];

  const fallbackInterests = Array.isArray(destination.interests)
    ? destination.interests.slice(0, 3)
    : [];

  const matchReasons = Array.isArray(destination.matchReasons)
    ? destination.matchReasons.filter(Boolean)
    : [];

  const highlights =
    matchReasons.length > 0
      ? matchReasons.slice(0, 3)
      : [
          destination.shortDescription ||
            `${destination.city} matches the current travel preferences.`,
        ];

  const supportedSpendingTiers = Array.isArray(
    destination.supportedSpendingTiers,
  )
    ? destination.supportedSpendingTiers
    : [];

  return {
    id: destination.destinationId,
    destinationId: destination.destinationId,
    city: destination.city,
    country: destination.country,
    currency: tripCost.currency || "GBP",
    duration,
    totalCost: Number(tripCost.total || 0),
    dailyCost:
      duration > 0 ? Math.round(Number(tripCost.total || 0) / duration) : 0,
    flightCost: Number(tripCost.breakdown?.flight || 0),
    accommodationCost: Number(tripCost.breakdown?.accommodation || 0),
    foodCost: Number(tripCost.breakdown?.food || 0),
    transportCost: Number(tripCost.breakdown?.localTransport || 0),
    activitiesCost: Number(tripCost.breakdown?.activities || 0),
    budgetStatus: budgetStatus.label,
    budgetDescription: budgetStatus.description,
    budgetDifference: Number(budgetStatus.difference || 0),
    remainingBudget: Number(budgetStatus.remainingAmount || 0),
    overBudgetAmount: Number(budgetStatus.overAmount || 0),
    budgetUsagePercentage: Number(budgetStatus.usagePercentage || 0),
    budgetType: getBudgetType(budgetStatus.status),
    interestMatch: getInterestMatchPercentage(
      matchedInterests,
      plannerData.interests,
    ),
    monthSuitability: destination.isBestMonth
      ? "Recommended month"
      : "Alternative period",
    overallScore: Number(destination.matchPercentage || 0),
    travelStyle:
      supportedSpendingTiers.length > 0
        ? supportedSpendingTiers.join(", ")
        : plannerData.spendingTier,
    interests:
      matchedInterests.length > 0 ? matchedInterests : fallbackInterests,
    highlights,
    recommendation:
      matchReasons.join(" ") ||
      destination.shortDescription ||
      `${destination.city} is one of the strongest options for the current trip.`,
    isComplete: Boolean(tripCost.isComplete),
    missingData: Array.isArray(tripCost.missingData)
      ? tripCost.missingData
      : [],
  };
}

export default function TripComparisonPage() {
  const router = useRouter();

  const {
    tripPlannerData,
    comparisonDestinationIds,
    isTripPlannerHydrated,
    updateTripPlannerField,
    clearComparisonDestinations,
  } = useTripPlanner();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [costSettings, setCostSettings] = useState(null);
  const [recommendationRules, setRecommendationRules] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const budget = Number(tripPlannerData.budget);
  const duration = Number(tripPlannerData.duration);
  const travellers = Number(tripPlannerData.travellers);

  const departureAirportCode = String(
    tripPlannerData.departureAirportCode || "",
  ).trim();

  const travelMonth = String(tripPlannerData.travelMonth || "").trim();

  const selectedDestinationId = String(
    tripPlannerData.destination || "",
  ).trim();

  const hasRequiredPlannerData =
    Number.isFinite(budget) &&
    budget > 0 &&
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(travellers) &&
    travellers > 0 &&
    Boolean(departureAirportCode) &&
    Boolean(travelMonth);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      setIsLoadingConnections(true);
      setErrorMessage("");
      setWarningMessage("");

      if (!authUser) {
        setIsAuthenticated(false);
        setCostSettings(null);
        setRecommendationRules(null);
        setErrorMessage("Sign in to open Trip Comparison.");
        setIsLoadingConnections(false);

        return;
      }

      setIsAuthenticated(true);

      try {
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
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.warn("Planning settings could not be loaded:", error);

        setCostSettings(null);
        setRecommendationRules(null);

        setWarningMessage(
          "Some travel preferences could not be loaded. The comparison is using the available trip information.",
        );
      } finally {
        if (isActive) {
          setIsLoadingConnections(false);
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

  const rankedDestinations = useMemo(() => {
    if (!isTripPlannerHydrated || !hasRequiredPlannerData) {
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
      limit: mockDestinations.length,
    });
  }, [
    budget,
    costSettings,
    departureAirportCode,
    duration,
    hasRequiredPlannerData,
    isTripPlannerHydrated,
    recommendationRules,
    travellers,
    travelMonth,
    tripPlannerData.interests,
    tripPlannerData.spendingTier,
  ]);

  const destinationsToCompare = useMemo(() => {
    if (rankedDestinations.length === 0) {
      return [];
    }

    const preparedDestinations = [];

    function addDestinationById(destinationId) {
      const preparedId = String(destinationId || "").trim();

      if (!preparedId) {
        return;
      }

      const destination = rankedDestinations.find(
        (item) => item.destinationId === preparedId,
      );

      if (!destination) {
        return;
      }

      const destinationAlreadyAdded = preparedDestinations.some(
        (item) => item.destinationId === destination.destinationId,
      );

      if (!destinationAlreadyAdded) {
        preparedDestinations.push(destination);
      }
    }

    comparisonDestinationIds.forEach(addDestinationById);

    addDestinationById(selectedDestinationId);

    rankedDestinations.forEach((destination) => {
      if (preparedDestinations.length >= COMPARISON_DESTINATION_LIMIT) {
        return;
      }

      addDestinationById(destination.destinationId);
    });

    return preparedDestinations.slice(0, COMPARISON_DESTINATION_LIMIT);
  }, [comparisonDestinationIds, rankedDestinations, selectedDestinationId]);

  const comparisonTrips = useMemo(() => {
    if (!hasRequiredPlannerData || destinationsToCompare.length === 0) {
      return [];
    }

    return destinationsToCompare
      .map((destination) =>
        prepareComparisonTrip({
          destination,
          plannerData: tripPlannerData,
          costSettings,
        }),
      )
      .filter(Boolean);
  }, [
    costSettings,
    destinationsToCompare,
    hasRequiredPlannerData,
    tripPlannerData,
  ]);

  function handleSelectDestination(destinationId) {
    updateTripPlannerField("destination", destinationId);

    router.push("/traveller/trip-planning/itinerary");
  }

  const isPageLoading = !isTripPlannerHydrated || isLoadingConnections;

  return (
    <TravellerLayout
      pageTitle="Trip Comparison"
      pageDescription="Compare destination costs, budget suitability and travel preference scores."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        <section className={`${styles.pageIntroCard} mb-4`}>
          <div className="row g-4 align-items-center">
            <div className="col-12 col-xl-8">
              <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                <span
                  className={`${styles.pageIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                  aria-hidden="true"
                >
                  <FaScaleBalanced />
                </span>

                <div>
                  <p className={`${styles.eyebrow} mb-2`}>
                    Destination comparison
                  </p>

                  <h1 className={`${styles.pageTitle} mb-3`}>
                    Compare your selected trips side by side
                  </h1>

                  <p className={`${styles.pageText} mb-0`}>
                    Review estimated costs, budget suitability, interests and
                    recommendation scores before choosing the destination for
                    your itinerary.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="d-grid gap-2">
                <Link
                  href="/traveller/trip-planning/recommendations"
                  className={`${styles.lightButton} btn d-flex align-items-center justify-content-center gap-2`}
                >
                  <FaArrowLeft aria-hidden="true" />
                  Back to recommendations
                </Link>

                <Link
                  href="/traveller/trip-planning/planner"
                  className={`${styles.introSecondaryButton} btn d-flex align-items-center justify-content-center gap-2`}
                >
                  <FaPenToSquare aria-hidden="true" />
                  Edit trip details
                </Link>

                {comparisonDestinationIds.length > 0 && (
                  <button
                    type="button"
                    className={`${styles.clearButton} btn d-flex align-items-center justify-content-center gap-2`}
                    onClick={clearComparisonDestinations}
                  >
                    <FaTrashCan aria-hidden="true" />
                    Clear selected destinations
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {isPageLoading && (
          <div
            className={`${styles.loadingPanel} d-flex align-items-center gap-3 mb-4`}
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>Preparing your trip comparison...</span>
          </div>
        )}

        {!isPageLoading && errorMessage && (
          <div className={`${styles.errorPanel} mb-4`} role="alert">
            {errorMessage}
          </div>
        )}

        {!isPageLoading && warningMessage && (
          <div className={`${styles.warningPanel} mb-4`} role="alert">
            {warningMessage}
          </div>
        )}

        {!isPageLoading &&
          isAuthenticated &&
          !errorMessage &&
          !hasRequiredPlannerData && (
            <section className={`${styles.emptyStateCard} mb-4 text-center`}>
              <span
                className={`${styles.emptyStateIcon} d-inline-flex align-items-center justify-content-center mb-3`}
                aria-hidden="true"
              >
                <FaCircleInfo />
              </span>

              <h2 className={`${styles.emptyStateTitle} mb-3`}>
                Complete the Trip Planner first
              </h2>

              <p className={`${styles.emptyStateText} mx-auto mb-4`}>
                Add your budget, departure airport, travel month, duration and
                number of travellers before comparing destinations.
              </p>

              <Link
                href="/traveller/trip-planning/planner"
                className={`${styles.primaryButton} btn px-4`}
              >
                Open Trip Planner
              </Link>
            </section>
          )}

        {!isPageLoading &&
          isAuthenticated &&
          !errorMessage &&
          hasRequiredPlannerData &&
          comparisonTrips.length < 2 && (
            <div className={`${styles.warningPanel} mb-4`} role="alert">
              At least two destination estimates are required. Return to
              Recommendations and select another destination to compare.
            </div>
          )}

        {!isPageLoading &&
          isAuthenticated &&
          !errorMessage &&
          comparisonTrips.length >= 2 && (
            <>
              <TripComparisonSummary
                trips={comparisonTrips}
                onSelectDestination={handleSelectDestination}
              />

              <TripComparisonTable
                trips={comparisonTrips}
                onSelectDestination={handleSelectDestination}
              />

              <div className="d-flex justify-content-center mt-4">
                <Link
                  href="/traveller/trip-planning/recommendations"
                  className={`${styles.textLink} d-inline-flex align-items-center gap-2`}
                >
                  <FaCompass aria-hidden="true" />
                  Change compared destinations
                </Link>
              </div>
            </>
          )}
      </div>
    </TravellerLayout>
  );
}
