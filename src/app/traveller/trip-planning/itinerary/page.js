"use client";

import { useEffect, useState } from "react";
import {
  FaCalendarDays,
  FaCloudSun,
  FaDatabase,
  FaFloppyDisk,
  FaLocationDot,
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

function getItineraryErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in to open the Itinerary page.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return (
    error?.message || "The Itinerary page connections could not be loaded."
  );
}

function getSaveErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "You must be signed in before saving a trip.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return error?.message || "The trip could not be saved.";
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
        "The itinerary was refined successfully. Review the updated days before saving.",
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
          `${selectedDestination.city} trip plan was saved as a draft. You can add the AI itinerary later.`,
        );
      }
    } catch (error) {
      setSaveErrorMessage(getSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const firebaseActions = {
    createTrip: createSavedTrip.name,
    updateTrip: updateSavedTrip.name,
    createLog: createAiLog.name,
  };

  return (
    <TravellerLayout
      pageTitle="Itinerary"
      pageDescription="Build the day-by-day itinerary and AI refinement interface."
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
            Loading Itinerary page connections...
          </div>
        )}

        {!isLoading && !errorMessage && isAuthenticated && (
          <div className="row g-4">
            <div className="col-12">
              <section className={`card ${styles.handoverCard}`}>
                <div className="card-body p-4 p-lg-5">
                  <span className="badge bg-dark mb-3">
                    Traveller development foundation
                  </span>

                  <h2 className="h3 fw-bold text-dark mb-3">
                    Itinerary connections are ready
                  </h2>

                  <p className="text-secondary mb-4">
                    Firebase authentication, saved trips, AI activity logging,
                    destinations, activities and weather data are already
                    connected. The final Itinerary interface can use these
                    prepared data sources without changing the shared Firebase
                    or mock data files.
                  </p>

                  <div className="row g-4">
                    <div className="col-12 col-xl-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaCalendarDays />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available itinerary activities
                            </h3>

                            <p className="text-secondary mb-0">
                              Use <code>mockActivities</code> to build the
                              day-by-day programme and divide activities by
                              destination and time of day.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>
                            <code>destinationId</code> connects each activity to
                            a destination
                          </li>

                          <li>
                            <code>timeOfDay</code> separates Morning, Afternoon
                            and Evening activities
                          </li>

                          <li>
                            <code>estimatedCostPerTraveller</code> provides the
                            activity cost
                          </li>

                          <li>
                            <code>durationHours</code> provides the estimated
                            duration
                          </li>

                          <li>
                            <code>interests</code> supports personalised
                            activity selection
                          </li>

                          <li>
                            <code>freeActivity</code> identifies free activities
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-12 col-xl-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaLocationDot />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available destination and weather data
                            </h3>

                            <p className="text-secondary mb-0">
                              Use <code>mockDestinations</code> and{" "}
                              <code>mockWeather</code> to display the selected
                              destination and suitable monthly weather
                              information.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>Destination city, country and description</li>
                          <li>Destination image and supported interests</li>
                          <li>Best travel months and duration limits</li>
                          <li>Monthly average temperature</li>
                          <li>Monthly weather summary</li>
                          <li>Low, shoulder and high travel seasons</li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-12 col-xl-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaDatabase />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available Firebase saved trips
                            </h3>

                            <p className="text-secondary mb-0">
                              The authenticated Traveller&apos;s saved trips are
                              already loaded from Firestore.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>
                            <code>savedTrips</code> contains the
                            Traveller&apos;s existing trip records
                          </li>

                          <li>
                            <code>getSavedTrips</code> loads the Firestore
                            records
                          </li>

                          <li>
                            <code>{firebaseActions.createTrip}</code> saves a
                            newly generated trip plan
                          </li>

                          <li>
                            <code>{firebaseActions.updateTrip}</code> updates an
                            existing saved trip
                          </li>

                          <li>
                            <code>isSaving</code> controls the saving state
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-12 col-xl-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaWandSparkles />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available AI connection
                            </h3>

                            <p className="text-secondary mb-0">
                              Gemini can generate and refine the day-by-day
                              itinerary before it is saved to Firestore.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>Initial itinerary generation</li>
                          <li>Natural-language refinement instructions</li>
                          <li>Structured itinerary data</li>
                          <li>Morning, Afternoon and Evening activities</li>
                          <li>
                            AI generation and refinement actions are recorded
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 p-4 ${styles.connectionStatus}`}>
                    <h3 className="h5 fw-bold text-dark mb-4">
                      Connected data summary
                    </h3>

                    <div className="row g-3">
                      <div className="col-6 col-lg-3">
                        <div className={`h-100 p-3 ${styles.statusItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Activities
                          </p>

                          <p className={`${styles.statusValue} mb-0`}>
                            {mockActivities.length}
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-lg-3">
                        <div className={`h-100 p-3 ${styles.statusItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Destinations
                          </p>

                          <p className={`${styles.statusValue} mb-0`}>
                            {mockDestinations.length}
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-lg-3">
                        <div className={`h-100 p-3 ${styles.statusItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Weather profiles
                          </p>

                          <p className={`${styles.statusValue} mb-0`}>
                            {mockWeather.length}
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-lg-3">
                        <div className={`h-100 p-3 ${styles.statusItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Saved trips
                          </p>

                          <p className={`${styles.statusValue} mb-0`}>
                            {savedTrips.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-12 col-md-4">
                        <div className={`h-100 p-3 ${styles.periodItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Morning activities
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {activityPeriodTotals.morning}
                          </p>
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <div className={`h-100 p-3 ${styles.periodItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Afternoon activities
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {activityPeriodTotals.afternoon}
                          </p>
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <div className={`h-100 p-3 ${styles.periodItem}`}>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Evening activities
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {activityPeriodTotals.evening}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12">
              <section className={`card ${styles.workspaceCard}`}>
                <div className="card-body p-4 p-lg-5">
                  <div className="text-center mb-4">
                    <span
                      className={`${styles.workspaceIcon} d-inline-flex align-items-center justify-content-center mb-3`}
                    >
                      <FaCloudSun />
                    </span>

                    <p className={`${styles.workspaceLabel} mb-2`}>
                      TravelMind AI itinerary
                    </p>

                    <h2 className="h3 fw-bold text-dark mb-3">
                      Generate your personalised itinerary
                    </h2>

                    <p className="text-secondary mb-0">
                      Gemini will use the information entered in the Trip
                      Planner to prepare the day-by-day travel plan.
                    </p>
                  </div>

                  {hasRequiredPlannerData ? (
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6 col-xl-3">
                        <div className="border rounded-3 p-3 h-100">
                          <p className="text-secondary small mb-1">
                            Destination
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {selectedDestination.city},{" "}
                            {selectedDestination.country}
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-md-3 col-xl-2">
                        <div className="border rounded-3 p-3 h-100">
                          <p className="text-secondary small mb-1">Budget</p>

                          <p className="fw-bold text-dark mb-0">
                            £{tripPlannerData.budget}
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-md-3 col-xl-2">
                        <div className="border rounded-3 p-3 h-100">
                          <p className="text-secondary small mb-1">Duration</p>

                          <p className="fw-bold text-dark mb-0">
                            {tripPlannerData.duration} days
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-md-3 col-xl-2">
                        <div className="border rounded-3 p-3 h-100">
                          <p className="text-secondary small mb-1">
                            Travellers
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {tripPlannerData.travellers}
                          </p>
                        </div>
                      </div>

                      <div className="col-6 col-md-9 col-xl-3">
                        <div className="border rounded-3 p-3 h-100">
                          <p className="text-secondary small mb-1">
                            Travel month
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {tripPlannerData.travelMonth || "Not selected"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-warning mb-4" role="alert">
                      Complete the Trip Planner form before generating or saving
                      a trip.
                    </div>
                  )}

                  {aiErrorMessage && (
                    <div className="alert alert-danger mb-4" role="alert">
                      {aiErrorMessage}
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-dark px-4"
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
                          Generate itinerary
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
                  <div className="alert alert-success mt-4 mb-0" role="status">
                    {refinementSuccessMessage}
                  </div>
                )}

                {refinementErrorMessage && (
                  <div className="alert alert-danger mt-4 mb-0" role="alert">
                    {refinementErrorMessage}
                  </div>
                )}

                {savedTripStatus === "Saved" && (
                  <div className="alert alert-light border mt-4 mb-0">
                    This itinerary has already been saved.
                  </div>
                )}
              </div>
            )}

            {hasRequiredPlannerData && (
              <div className="col-12">
                <section className="card border-0 shadow-sm">
                  <div className="card-body p-4 p-lg-5">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
                      <div>
                        <h2 className="h4 fw-bold text-dark mb-2">
                          {generatedItinerary
                            ? "Save this itinerary"
                            : "Save this trip plan"}
                        </h2>

                        <p className="text-secondary mb-0">
                          {generatedItinerary
                            ? "Save the generated itinerary and the complete budget results to your Traveller account."
                            : "Save the destination, budget calculation and optimisation results as a draft without waiting for the AI itinerary."}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary px-4"
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
                      <div className="alert alert-light border mt-4 mb-0">
                        The AI itinerary is optional. The trip can be saved now
                        and completed later when Gemini is available.
                      </div>
                    )}

                    {saveSuccessMessage && (
                      <div
                        className="alert alert-success mt-4 mb-0"
                        role="status"
                      >
                        {saveSuccessMessage}
                      </div>
                    )}

                    {saveErrorMessage && (
                      <div
                        className="alert alert-danger mt-4 mb-0"
                        role="alert"
                      >
                        {saveErrorMessage}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
