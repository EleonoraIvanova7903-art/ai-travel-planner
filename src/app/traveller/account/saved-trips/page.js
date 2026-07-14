"use client";

import { useEffect, useState } from "react";
import { FaBookmark, FaDatabase, FaLocationDot } from "react-icons/fa6";
import { watchAuthState } from "@/firebase/authService";
import { createAiLog } from "@/firebase/logService";
import { getSavedTrips, updateSavedTrip } from "@/firebase/tripService";
import TravellerLayout from "../../../../shared/layout/TravellerLayout";
import SavedTripsList from "./SavedTripsList";
import styles from "./saved-trips.module.css";

function getSavedTripsErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in to open the Saved Trips page.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return error?.message || "The saved trips could not be loaded.";
}

function getItineraryGenerationErrorMessage(error) {
  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return (
    error?.message ||
    "The AI itinerary could not be generated for this saved trip."
  );
}

async function recordAiActivity(logData) {
  try {
    await createAiLog(logData);
  } catch (logError) {
    console.warn("AI activity log could not be saved:", logError);
  }
}

export default function SavedTripsPage() {
  const [savedTrips, setSavedTrips] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [generatingTripId, setGeneratingTripId] = useState("");
  const [generationMessages, setGenerationMessages] = useState({});

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      if (!authUser) {
        setIsAuthenticated(false);
        setSavedTrips([]);
        setErrorMessage("Sign in to open the Saved Trips page.");
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
          setErrorMessage(getSavedTripsErrorMessage(error));
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

  async function handleGenerateItinerary(trip) {
    if (!trip?.id) {
      return null;
    }

    const destination = String(trip.destination || "").trim();
    const country = String(trip.country || "").trim();
    const duration = Number(trip.durationDays);
    const travellers = Number(trip.numberOfTravellers);
    const budget = Number(trip.budget);

    if (!destination) {
      setGenerationMessages((currentMessages) => ({
        ...currentMessages,
        [trip.id]: {
          type: "error",
          text: "This saved trip does not contain a valid destination.",
        },
      }));

      return null;
    }

    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(travellers) ||
      travellers <= 0 ||
      !Number.isFinite(budget) ||
      budget <= 0
    ) {
      setGenerationMessages((currentMessages) => ({
        ...currentMessages,
        [trip.id]: {
          type: "error",
          text: "This saved trip does not contain all information required for AI itinerary generation.",
        },
      }));

      return null;
    }

    const destinationLabel = country
      ? `${destination}, ${country}`
      : destination;

    try {
      setGeneratingTripId(trip.id);

      setGenerationMessages((currentMessages) => ({
        ...currentMessages,
        [trip.id]: null,
      }));

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType: "itinerary",
          destination: destinationLabel,
          duration,
          travellers,
          budget,
          interests: Array.isArray(trip.interests) ? trip.interests : [],
        }),
      });

      const responseText = await response.text();

      let responseData = {};

      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          throw new Error("The Gemini service returned an invalid response.");
        }
      }

      if (!response.ok || !responseData.success || !responseData.itinerary) {
        const generationError = new Error(
          responseData.message || "The AI itinerary could not be generated.",
        );

        generationError.code =
          responseData.errorCode || "ITINERARY_GENERATION_FAILED";

        throw generationError;
      }

      const updatedTrip = await updateSavedTrip(trip.id, {
        itinerary: responseData.itinerary,
        aiGenerated: true,
        status: "Saved",
      });

      setSavedTrips((currentTrips) =>
        currentTrips.map((currentTrip) =>
          currentTrip.id === updatedTrip.id ? updatedTrip : currentTrip,
        ),
      );

      setGenerationMessages((currentMessages) => ({
        ...currentMessages,
        [trip.id]: {
          type: "success",
          text: "The AI itinerary was generated and added to this saved trip.",
        },
      }));

      void recordAiActivity({
        promptType: "itinerary-generation",
        tripId: trip.id,
        selectedDestination: destination,
        requestSummary: `Generated a ${duration}-day itinerary for ${travellers} traveller(s) with a budget of £${budget}.`,
        generatedContentType: "itinerary",
        status: "completed",
      });

      return updatedTrip;
    } catch (error) {
      const generationErrorMessage = getItineraryGenerationErrorMessage(error);

      setGenerationMessages((currentMessages) => ({
        ...currentMessages,
        [trip.id]: {
          type: "error",
          text: generationErrorMessage,
        },
      }));

      void recordAiActivity({
        promptType: "itinerary-generation",
        tripId: trip.id,
        selectedDestination: destination,
        requestSummary: generationErrorMessage,
        generatedContentType: "itinerary",
        status: "failed",
      });

      return null;
    } finally {
      setGeneratingTripId("");
    }
  }

  return (
    <TravellerLayout
      pageTitle="Saved Trips"
      pageDescription="Review and manage your saved travel plans."
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
            Loading saved trips...
          </div>
        )}

        {!isLoading && !errorMessage && isAuthenticated && (
          <div className="row g-4">
            <div className="col-12">
              <section className={`card ${styles.handoverCard}`}>
                <div className="card-body p-4 p-lg-5">
                  <span className="badge bg-dark mb-3">Saved travel plans</span>

                  <h2 className="h3 fw-bold text-dark mb-3">
                    Your saved trips
                  </h2>

                  <p className="text-secondary mb-4">
                    Review completed itineraries and draft travel plans saved to
                    your Traveller account. Draft plans can receive an AI
                    itinerary later when Gemini is available.
                  </p>

                  <div className="row g-4">
                    <div className="col-12 col-lg-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaDatabase />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Firestore saved trips
                            </h3>

                            <p className="text-secondary mb-0">
                              The page loads only the travel plans belonging to
                              the currently authenticated Traveller.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaLocationDot />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Destination details
                            </h3>

                            <p className="text-secondary mb-0">
                              Draft travel plans can be completed with an AI
                              itinerary without creating a second Firestore
                              record.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 p-4 ${styles.connectionStatus}`}>
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <span
                          className={`${styles.statusIcon} d-inline-flex align-items-center justify-content-center`}
                        >
                          <FaBookmark />
                        </span>

                        <div>
                          <p className={`${styles.statusLabel} mb-1`}>
                            Saved travel plans
                          </p>

                          <p className="fw-bold text-dark mb-0">
                            {savedTrips.length} saved{" "}
                            {savedTrips.length === 1 ? "trip" : "trips"} loaded.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge ${
                          savedTrips.length > 0
                            ? "text-bg-success"
                            : "text-bg-secondary"
                        } ${styles.statusBadge}`}
                      >
                        {savedTrips.length > 0
                          ? "Saved trips available"
                          : "No saved trips found"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12">
              <SavedTripsList
                savedTrips={savedTrips}
                onGenerateItinerary={handleGenerateItinerary}
                generatingTripId={generatingTripId}
                generationMessages={generationMessages}
              />
            </div>
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
