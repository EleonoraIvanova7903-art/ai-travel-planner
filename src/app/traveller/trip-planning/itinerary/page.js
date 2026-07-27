"use client";

import { useEffect, useState } from "react";
import {
  FaBookmark,
  FaCalendarDays,
  FaCloudSun,
  FaFloppyDisk,
  FaLocationDot,
  FaMoon,
  FaRoute,
  FaSun,
  FaUsers,
  FaWallet,
  FaWandSparkles,
} from "react-icons/fa6";
import { mockActivities } from "@/data/mockActivities";
import { mockDestinations } from "@/data/mockDestinations";
import { mockWeather } from "@/data/mockWeather";
import { watchAuthState } from "@/firebase/authService";
import { createAiLog } from "@/firebase/logService";
import {
  createSavedTrip,
  getSavedTrips,
  updateSavedTrip,
} from "@/firebase/tripService";
import { useTripPlanner } from "@/context/TripPlannerContext";
import TravellerLayout from "../../../../shared/layout/TravellerLayout";
import ItineraryPreview from "./ItineraryPreview";
import AIRefinementBox from "./AIRefinementBox";
import styles from "./itinerary.module.css";

const activityPeriodTotals = {
  morning: mockActivities.filter((activity) => activity.timeOfDay === "Morning")
    .length,
  afternoon: mockActivities.filter(
    (activity) => activity.timeOfDay === "Afternoon",
  ).length,
  evening: mockActivities.filter((activity) => activity.timeOfDay === "Evening")
    .length,
};

const workflowSteps = [
  {
    number: "01",
    title: "Trip details",
    text: "Review the destination, budget and travel duration.",
  },
  {
    number: "02",
    title: "Generate",
    text: "Create a personalised day-by-day itinerary.",
  },
  {
    number: "03",
    title: "Refine",
    text: "Adjust activities with a written instruction.",
  },
  {
    number: "04",
    title: "Save",
    text: "Store the completed travel plan in your account.",
  },
];

function getItineraryErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in to open the Itinerary page.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Access was denied. Please try again or contact support.";
  }

  return error?.message || "The Itinerary page could not be loaded.";
}

function getSaveErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "You must be signed in before saving a trip.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "The trip could not be saved because access was denied.";
  }

  return error?.message || "The trip could not be saved.";
}

function getWeatherSummary(weatherDetails) {
  return (
    weatherDetails?.weatherSummary ||
    weatherDetails?.weatherLabel ||
    "Weather information available"
  );
}

function getTemperatureLabel(weatherDetails) {
  const averageTemperature = Number(weatherDetails?.averageTemperatureC);
  const averageHigh = Number(weatherDetails?.averageHighC);
  const averageLow = Number(weatherDetails?.averageLowC);

  if (Number.isFinite(averageTemperature)) {
    return `${averageTemperature}°C average`;
  }

  if (Number.isFinite(averageHigh) && Number.isFinite(averageLow)) {
    return `${averageLow}°C to ${averageHigh}°C`;
  }

  if (Number.isFinite(averageHigh)) {
    return `Up to ${averageHigh}°C`;
  }

  return "Temperature unavailable";
}

function formatSeasonLabel(value) {
  const season = String(value || "").trim();

  if (!season) {
    return "";
  }

  return `${season.charAt(0).toUpperCase()}${season.slice(1)} season`;
}

async function recordAiActivity(logData) {
  try {
    await createAiLog(logData);
  } catch (logError) {
    console.warn("AI activity log could not be saved:", logError);
  }
}

export default function ItineraryPage() {
  const { tripPlannerData, tripPlannerResults } = useTripPlanner();

  const [savedTrips, setSavedTrips] = useState([]);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [savedTripId, setSavedTripId] = useState("");
  const [savedTripStatus, setSavedTripStatus] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [aiErrorMessage, setAiErrorMessage] = useState("");
  const [refinementErrorMessage, setRefinementErrorMessage] = useState("");
  const [refinementSuccessMessage, setRefinementSuccessMessage] = useState("");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  const selectedDestination = mockDestinations.find(
    (destination) => destination.destinationId === tripPlannerData.destination,
  );

  const destinationActivities = selectedDestination
    ? mockActivities.filter(
        (activity) =>
          activity.destinationId === selectedDestination.destinationId,
      )
    : [];

  const destinationWeatherProfile = selectedDestination
    ? mockWeather.find(
        (weatherProfile) =>
          weatherProfile.destinationId === selectedDestination.destinationId,
      )
    : null;

  const selectedMonthWeather =
    destinationWeatherProfile?.monthlyWeather?.[tripPlannerData.travelMonth] ||
    null;

  const destinationActivityTotals = {
    morning: selectedDestination
      ? destinationActivities.filter(
          (activity) => activity.timeOfDay === "Morning",
        ).length
      : activityPeriodTotals.morning,

    afternoon: selectedDestination
      ? destinationActivities.filter(
          (activity) => activity.timeOfDay === "Afternoon",
        ).length
      : activityPeriodTotals.afternoon,

    evening: selectedDestination
      ? destinationActivities.filter(
          (activity) => activity.timeOfDay === "Evening",
        ).length
      : activityPeriodTotals.evening,
  };

  const hasRequiredPlannerData = Boolean(
    selectedDestination &&
    Number(tripPlannerData.budget) > 0 &&
    Number(tripPlannerData.duration) > 0 &&
    Number(tripPlannerData.travellers) > 0,
  );

  const canGenerateItinerary = Boolean(
    hasRequiredPlannerData && !isGenerating && !isRefining && !isSaving,
  );

  const canRefineItinerary = Boolean(
    generatedItinerary &&
    selectedDestination &&
    savedTripStatus !== "Saved" &&
    !isRefining &&
    !isSaving,
  );

  const canSaveTripPlan = Boolean(
    hasRequiredPlannerData && !isSaving && !isRefining,
  );

  const workflowStage =
    savedTripStatus === "Saved"
      ? 4
      : generatedItinerary
        ? 3
        : hasRequiredPlannerData
          ? 2
          : 1;

  const workspaceTitle = selectedDestination
    ? `Build your ${selectedDestination.city} itinerary`
    : "Build your personalised itinerary";

  const workspaceStatus = generatedItinerary
    ? "Itinerary ready"
    : hasRequiredPlannerData
      ? "Ready to generate"
      : "Trip details required";

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      if (!authUser) {
        setIsAuthenticated(false);
        setSavedTrips([]);
        setErrorMessage("Sign in to open the Itinerary page.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        setIsAuthenticated(true);

        const travellerSavedTrips = await getSavedTrips(authUser.uid);

        if (isActive) {
          setSavedTrips(travellerSavedTrips);
        }
      } catch (error) {
        if (isActive) {
          setSavedTrips([]);
          setErrorMessage(getItineraryErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  async function handleGenerateItinerary() {
    if (!hasRequiredPlannerData) {
      setAiErrorMessage(
        "Complete the Trip Planner form before generating an itinerary.",
      );
      return;
    }

    try {
      setIsGenerating(true);
      setAiErrorMessage("");
      setRefinementErrorMessage("");
      setRefinementSuccessMessage("");
      setSaveErrorMessage("");
      setSaveSuccessMessage("");
      setGeneratedItinerary(null);

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType: "itinerary",
          destination: selectedDestination.city,
          duration: Number(tripPlannerData.duration),
          travellers: Number(tripPlannerData.travellers),
          budget: Number(tripPlannerData.budget),
          interests: tripPlannerData.interests,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success || !responseData.itinerary) {
        throw new Error(
          responseData.message || "The itinerary could not be generated.",
        );
      }

      setGeneratedItinerary(responseData.itinerary);

      void recordAiActivity({
        promptType: "itinerary-generation",
        tripId: savedTripId || null,
        selectedDestination: selectedDestination.city,
        requestSummary: `Generated a ${Number(
          tripPlannerData.duration,
        )}-day itinerary for ${Number(
          tripPlannerData.travellers,
        )} traveller(s) with a budget of £${Number(tripPlannerData.budget)}.`,
        generatedContentType: "itinerary",
        status: "completed",
      });
    } catch (error) {
      setGeneratedItinerary(null);

      const generationErrorMessage =
        error?.message || "The itinerary could not be generated.";

      setAiErrorMessage(generationErrorMessage);

      void recordAiActivity({
        promptType: "itinerary-generation",
        tripId: savedTripId || null,
        selectedDestination: selectedDestination?.city || null,
        requestSummary: generationErrorMessage,
        generatedContentType: "itinerary",
        status: "failed",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefineItinerary(refinementRequest) {
    if (!generatedItinerary || !selectedDestination) {
      setRefinementErrorMessage(
        "Generate an itinerary before trying to refine it.",
      );
      return;
    }

    if (savedTripStatus === "Saved") {
      setRefinementErrorMessage(
        "This itinerary has already been saved. Update the trip plan before making further changes.",
      );
      return;
    }

    try {
      setIsRefining(true);
      setRefinementErrorMessage("");
      setRefinementSuccessMessage("");
      setSaveErrorMessage("");
      setSaveSuccessMessage("");

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType: "itinerary-refinement",
          existingItinerary: generatedItinerary,
          refinementRequest,
          destination: selectedDestination.city,
          duration: Number(tripPlannerData.duration),
          travellers: Number(tripPlannerData.travellers),
          budget: Number(tripPlannerData.budget),
          interests: tripPlannerData.interests,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success || !responseData.itinerary) {
        throw new Error(
          responseData.message || "The itinerary could not be refined.",
        );
      }

      setGeneratedItinerary(responseData.itinerary);

      setRefinementSuccessMessage(
        "The itinerary was updated successfully. Review the activities before saving.",
      );

      void recordAiActivity({
        promptType: "itinerary-refinement",
        tripId: savedTripId || null,
        selectedDestination: selectedDestination.city,
        requestSummary: refinementRequest,
        generatedContentType: "itinerary",
        status: "completed",
      });
    } catch (error) {
      const refinementFailureMessage =
        error?.message || "The itinerary could not be refined.";

      setRefinementErrorMessage(refinementFailureMessage);

      void recordAiActivity({
        promptType: "itinerary-refinement",
        tripId: savedTripId || null,
        selectedDestination: selectedDestination?.city || null,
        requestSummary: refinementFailureMessage,
        generatedContentType: "itinerary",
        status: "failed",
      });
    } finally {
      setIsRefining(false);
    }
  }

  async function handleSaveTripPlan() {
    if (!selectedDestination || !hasRequiredPlannerData) {
      setSaveErrorMessage(
        "Complete the Trip Planner before trying to save this trip.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setSaveErrorMessage("");
      setSaveSuccessMessage("");

      const optimisationSuggestions = Array.isArray(
        tripPlannerResults?.optimisationData?.suggestions,
      )
        ? tripPlannerResults.optimisationData.suggestions
        : [];

      const aiBudgetAdvice = Array.isArray(tripPlannerResults?.aiAdvice)
        ? tripPlannerResults.aiAdvice
        : [];

      const tripStatus = generatedItinerary ? "Saved" : "Draft";

      const savedTripData = {
        tripName: `${selectedDestination.city} Travel Plan`,
        origin: tripPlannerData.departureAirportCode || "",
        destination: selectedDestination.city,
        country: selectedDestination.country,
        destinationId: selectedDestination.destinationId,
        travelMonth: tripPlannerData.travelMonth || "",
        durationDays: Number(tripPlannerData.duration),
        numberOfTravellers: Number(tripPlannerData.travellers),
        spendingTier: tripPlannerData.spendingTier || "Moderate",
        interests: Array.isArray(tripPlannerData.interests)
          ? tripPlannerData.interests
          : [],
        budget: Number(tripPlannerData.budget),
        currency: "GBP",
        costBreakdown: tripPlannerResults?.tripCost || null,
        budgetStatus: tripPlannerResults?.budgetStatus || null,
        optimisationData: tripPlannerResults?.optimisationData || null,
        optimisationSuggestions,
        aiBudgetAdvice,
        itinerary: generatedItinerary || null,
        aiGenerated: Boolean(generatedItinerary),
        status: tripStatus,
      };

      let savedTrip;

      if (savedTripId) {
        savedTrip = await updateSavedTrip(savedTripId, savedTripData);

        setSavedTrips((currentTrips) =>
          currentTrips.map((trip) =>
            trip.id === savedTrip.id ? savedTrip : trip,
          ),
        );
      } else {
        savedTrip = await createSavedTrip(savedTripData);

        setSavedTrips((currentTrips) => [savedTrip, ...currentTrips]);
      }

      setSavedTripId(savedTrip.id);
      setSavedTripStatus(tripStatus);

      if (generatedItinerary) {
        setSaveSuccessMessage(
          `${selectedDestination.city} itinerary was saved successfully.`,
        );
      } else {
        setSaveSuccessMessage(
          `${selectedDestination.city} trip plan was saved as a draft. You can add the itinerary later.`,
        );
      }
    } catch (error) {
      setSaveErrorMessage(getSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TravellerLayout
      pageTitle="Itinerary"
      pageDescription="Create, refine and save your day-by-day travel plan."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div
            className={`alert alert-danger mb-4 ${styles.standardAlert}`}
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className={`alert mb-4 ${styles.loadingAlert}`} role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Loading your itinerary...
          </div>
        )}

        {!isLoading && !errorMessage && isAuthenticated && (
          <div className="row g-4">
            <div className="col-12">
              <section className={styles.pageHero}>
                <div className="row align-items-center g-4">
                  <div className="col-12 col-lg-8">
                    <div className="d-flex align-items-start gap-3">
                      <span
                        className={`${styles.heroIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaRoute />
                      </span>

                      <div>
                        <p className={styles.heroLabel}>
                          AI itinerary workspace
                        </p>

                        <h2 className={styles.heroTitle}>{workspaceTitle}</h2>

                        <p className={styles.heroText}>
                          Review your trip, generate a day-by-day itinerary,
                          adjust the activities and save the completed plan to
                          your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-4">
                    <div className={styles.heroStatusPanel}>
                      <span
                        className={`${styles.heroStatusIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaBookmark />
                      </span>

                      <div>
                        <p className={styles.heroStatusLabel}>
                          Itinerary status
                        </p>

                        <p className={styles.heroStatusValue}>
                          {workspaceStatus}
                        </p>

                        <p className={styles.heroStatusText}>
                          {savedTrips.length} saved{" "}
                          {savedTrips.length === 1 ? "trip" : "trips"} in your
                          account
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12">
              <section className={styles.workflowCard}>
                <div className="row g-3">
                  {workflowSteps.map((step, index) => {
                    const isActive = index + 1 <= workflowStage;

                    return (
                      <div
                        className="col-12 col-sm-6 col-xl-3"
                        key={step.number}
                      >
                        <div
                          className={`${styles.workflowStep} ${
                            isActive ? styles.workflowStepActive : ""
                          }`}
                        >
                          <span className={styles.workflowNumber}>
                            {step.number}
                          </span>

                          <div>
                            <h3 className={styles.workflowTitle}>
                              {step.title}
                            </h3>

                            <p className={styles.workflowText}>{step.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="col-12">
              <section className={`card ${styles.generationCard}`}>
                <div className={styles.cardAccent} />

                <div className="card-body p-4 p-lg-5">
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-4 mb-4">
                    <div>
                      <span className={styles.sectionBadge}>
                        <FaWandSparkles />
                        Personalised travel plan
                      </span>

                      <h2 className={styles.sectionTitle}>
                        Review and generate your itinerary
                      </h2>

                      <p className={styles.sectionText}>
                        Check the selected trip details before creating your
                        personalised day-by-day schedule.
                      </p>
                    </div>

                    {hasRequiredPlannerData && (
                      <span className={styles.readyBadge}>
                        Ready to generate
                      </span>
                    )}
                  </div>

                  {hasRequiredPlannerData ? (
                    <>
                      <div className="row g-3">
                        <div className="col-12 col-sm-6 col-xl">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaLocationDot />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Destination
                              </p>

                              <p className={styles.planMetricValue}>
                                {selectedDestination.city},{" "}
                                {selectedDestination.country}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaWallet />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>Budget</p>

                              <p className={styles.planMetricValue}>
                                £{tripPlannerData.budget}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaCalendarDays />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>Duration</p>

                              <p className={styles.planMetricValue}>
                                {tripPlannerData.duration} days
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaUsers />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Travellers
                              </p>

                              <p className={styles.planMetricValue}>
                                {tripPlannerData.travellers}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaCalendarDays />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Travel month
                              </p>

                              <p className={styles.planMetricValue}>
                                {tripPlannerData.travelMonth || "Not selected"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-12 col-lg-6">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaCloudSun />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Expected weather
                              </p>

                              <p className={styles.planMetricValue}>
                                {selectedMonthWeather
                                  ? `${getWeatherSummary(
                                      selectedMonthWeather,
                                    )} · ${getTemperatureLabel(
                                      selectedMonthWeather,
                                    )}`
                                  : "Select a travel month to view the expected weather"}
                              </p>

                              {selectedMonthWeather?.season && (
                                <p className={styles.planMetricLabel}>
                                  {formatSeasonLabel(
                                    selectedMonthWeather.season,
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-lg-6">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaRoute />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Activity choices
                              </p>

                              <p className={styles.planMetricValue}>
                                {destinationActivities.length} activities
                                available for {selectedDestination.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mt-1 mb-4">
                        <div className="col-12 col-md-4">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaSun />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Morning options
                              </p>

                              <p className={styles.planMetricValue}>
                                {destinationActivityTotals.morning}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-4">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaCloudSun />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Afternoon options
                              </p>

                              <p className={styles.planMetricValue}>
                                {destinationActivityTotals.afternoon}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-4">
                          <div className={styles.planMetric}>
                            <span className={styles.planMetricIcon}>
                              <FaMoon />
                            </span>

                            <div>
                              <p className={styles.planMetricLabel}>
                                Evening options
                              </p>

                              <p className={styles.planMetricValue}>
                                {destinationActivityTotals.evening}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.warningPanel} role="alert">
                      <FaRoute />

                      <div>
                        <strong>Trip information is incomplete</strong>

                        <p>
                          Return to the Trip Planner and complete the
                          destination, budget, duration and traveller details.
                        </p>
                      </div>
                    </div>
                  )}

                  {aiErrorMessage && (
                    <div
                      className={`${styles.messageBox} ${styles.messageError} mb-4`}
                      role="alert"
                    >
                      {aiErrorMessage}
                    </div>
                  )}

                  <div className="d-flex justify-content-center">
                    <button
                      type="button"
                      className={`btn px-4 ${styles.generateButton}`}
                      onClick={handleGenerateItinerary}
                      disabled={!canGenerateItinerary}
                    >
                      {isGenerating ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />
                          Generating itinerary...
                        </>
                      ) : (
                        <>
                          <FaWandSparkles className="me-2" />

                          {generatedItinerary
                            ? "Regenerate itinerary"
                            : "Generate itinerary"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12">
              <ItineraryPreview itinerary={generatedItinerary} />
            </div>

            {generatedItinerary && (
              <div className="col-12">
                <AIRefinementBox
                  onRefine={handleRefineItinerary}
                  isRefining={isRefining}
                  disabled={!canRefineItinerary}
                />

                {refinementSuccessMessage && (
                  <div
                    className={`${styles.messageBox} ${styles.messageSuccess} mt-4`}
                    role="status"
                  >
                    {refinementSuccessMessage}
                  </div>
                )}

                {refinementErrorMessage && (
                  <div
                    className={`${styles.messageBox} ${styles.messageError} mt-4`}
                    role="alert"
                  >
                    {refinementErrorMessage}
                  </div>
                )}

                {savedTripStatus === "Saved" && (
                  <div className={`${styles.savedNotice} mt-4`}>
                    This itinerary has already been saved to your account.
                  </div>
                )}
              </div>
            )}

            {hasRequiredPlannerData && (
              <div className="col-12">
                <section className={styles.saveCard}>
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
                    <div className="d-flex align-items-start gap-3">
                      <span
                        className={`${styles.saveIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaFloppyDisk />
                      </span>

                      <div>
                        <p className={styles.saveLabel}>
                          Save your travel plan
                        </p>

                        <h2 className={styles.saveTitle}>
                          {generatedItinerary
                            ? "Save this completed itinerary"
                            : "Save this trip plan as a draft"}
                        </h2>

                        <p className={styles.saveText}>
                          {generatedItinerary
                            ? "Keep the complete itinerary and trip details in your account."
                            : "Save the current trip details now and complete the itinerary later."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn px-4 ${styles.saveButton}`}
                      onClick={handleSaveTripPlan}
                      disabled={!canSaveTripPlan}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />
                          Saving trip...
                        </>
                      ) : (
                        <>
                          <FaFloppyDisk className="me-2" />

                          {generatedItinerary
                            ? savedTripId
                              ? "Update saved itinerary"
                              : "Save itinerary"
                            : savedTripId
                              ? "Update draft"
                              : "Save trip as draft"}
                        </>
                      )}
                    </button>
                  </div>

                  {!generatedItinerary && (
                    <div className={styles.optionalNotice}>
                      The trip can be saved as a draft and completed later.
                    </div>
                  )}

                  {saveSuccessMessage && (
                    <div
                      className={`${styles.messageBox} ${styles.messageSuccess} mt-4`}
                      role="status"
                    >
                      {saveSuccessMessage}
                    </div>
                  )}

                  {saveErrorMessage && (
                    <div
                      className={`${styles.messageBox} ${styles.messageError} mt-4`}
                      role="alert"
                    >
                      {saveErrorMessage}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
