"use client";

import { useState } from "react";
import {
  FaCalendarDays,
  FaChevronDown,
  FaChevronUp,
  FaLocationDot,
  FaSuitcaseRolling,
  FaUsers,
  FaWallet,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { mockDestinations } from "@/data/mockDestinations";

function formatSavedDate(value) {
  if (!value) {
    return "Recently saved";
  }

  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently saved";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusClass(status) {
  const normalisedStatus = String(status || "").toLowerCase();

  if (normalisedStatus === "saved" || normalisedStatus === "confirmed") {
    return "text-bg-success";
  }

  if (normalisedStatus === "draft") {
    return "text-bg-warning";
  }

  return "text-bg-secondary";
}

export default function SavedTripsList({
  savedTrips = [],
  onGenerateItinerary,
  generatingTripId = "",
  generationMessages = {},
}) {
  const [expandedTripId, setExpandedTripId] = useState("");

  function toggleTripDetails(tripId) {
    setExpandedTripId((currentTripId) =>
      currentTripId === tripId ? "" : tripId,
    );
  }

  async function handleGenerateItinerary(trip) {
    if (typeof onGenerateItinerary !== "function") {
      return;
    }

    const updatedTrip = await onGenerateItinerary(trip);

    const generatedDays = Array.isArray(updatedTrip?.itinerary?.days)
      ? updatedTrip.itinerary.days
      : [];

    if (generatedDays.length > 0) {
      setExpandedTripId(trip.id);
    }
  }

  if (!Array.isArray(savedTrips) || savedTrips.length === 0) {
    return (
      <section className="card border-0 shadow-sm">
        <div className="card-body p-4 p-lg-5 text-center">
          <span className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-4 mb-3">
            <FaSuitcaseRolling
              className="fs-2 text-secondary"
              aria-hidden="true"
            />
          </span>

          <h2 className="h4 fw-bold text-dark mb-2">No saved trips yet</h2>

          <p className="text-secondary mb-0">
            Save a trip plan or an AI itinerary to see it in this section.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="row g-4">
      {savedTrips.map((trip) => {
        const destinationData = mockDestinations.find(
          (destination) => destination.destinationId === trip.destinationId,
        );

        const itineraryDays = Array.isArray(trip.itinerary?.days)
          ? trip.itinerary.days
          : [];

        const hasItinerary = itineraryDays.length > 0;
        const isExpanded = expandedTripId === trip.id;
        const isGenerating = generatingTripId === trip.id;
        const generationMessage = generationMessages[trip.id];

        const destinationName =
          trip.destination || destinationData?.city || "Saved destination";

        const countryName = trip.country || destinationData?.country || "";

        return (
          <div className="col-12" key={trip.id}>
            <article className="card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5">
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-4">
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                      <span className={`badge ${getStatusClass(trip.status)}`}>
                        {trip.status || "Saved"}
                      </span>

                      {trip.aiGenerated && (
                        <span className="badge text-bg-dark">AI-generated</span>
                      )}
                    </div>

                    <h2 className="h4 fw-bold text-dark mb-2">
                      {trip.tripName || `${destinationName} Travel Plan`}
                    </h2>

                    <p className="text-secondary mb-0">
                      <FaLocationDot className="me-2" />
                      {destinationName}
                      {countryName ? `, ${countryName}` : ""}
                    </p>
                  </div>

                  <div className="text-lg-end">
                    <p className="text-secondary small mb-1">Saved on</p>

                    <p className="fw-semibold text-dark mb-0">
                      {formatSavedDate(trip.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="row g-3 mt-3">
                  <div className="col-6 col-md-3">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-secondary small mb-1">
                        <FaWallet className="me-2" />
                        Budget
                      </p>

                      <p className="fw-bold text-dark mb-0">
                        {trip.currency === "GBP" ? "£" : ""}
                        {trip.budget ?? "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-secondary small mb-1">
                        <FaCalendarDays className="me-2" />
                        Duration
                      </p>

                      <p className="fw-bold text-dark mb-0">
                        {trip.durationDays || itineraryDays.length || 0} days
                      </p>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-secondary small mb-1">
                        <FaUsers className="me-2" />
                        Travellers
                      </p>

                      <p className="fw-bold text-dark mb-0">
                        {trip.numberOfTravellers || 1}
                      </p>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded-3 p-3 h-100">
                      <p className="text-secondary small mb-1">Travel month</p>

                      <p className="fw-bold text-dark mb-0">
                        {trip.travelMonth || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4">
                  {Array.isArray(trip.interests) &&
                    trip.interests.map((interest) => (
                      <span
                        className="badge rounded-pill text-bg-light border text-dark"
                        key={`${trip.id}-${interest}`}
                      >
                        {interest}
                      </span>
                    ))}
                </div>

                <div className="border-top mt-4 pt-4">
                  <div className="d-flex flex-wrap gap-2">
                    {hasItinerary ? (
                      <button
                        type="button"
                        className="btn btn-outline-dark"
                        onClick={() => toggleTripDetails(trip.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <>
                            <FaChevronUp className="me-2" />
                            Hide itinerary
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="me-2" />
                            View itinerary
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleGenerateItinerary(trip)}
                        disabled={isGenerating}
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
                            <FaWandMagicSparkles className="me-2" />
                            Generate AI itinerary
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {!hasItinerary && !isGenerating && (
                    <p className="text-secondary small mt-3 mb-0">
                      This draft contains the saved trip information but does
                      not yet contain a day-by-day itinerary.
                    </p>
                  )}

                  {generationMessage?.text && (
                    <div
                      className={`alert ${
                        generationMessage.type === "success"
                          ? "alert-success"
                          : "alert-danger"
                      } mt-3 mb-0`}
                      role={
                        generationMessage.type === "success"
                          ? "status"
                          : "alert"
                      }
                      aria-live="polite"
                    >
                      {generationMessage.text}
                    </div>
                  )}
                </div>

                {isExpanded && hasItinerary && (
                  <div className="mt-4">
                    {trip.itinerary?.summary && (
                      <div className="alert alert-light border">
                        {trip.itinerary.summary}
                      </div>
                    )}

                    <div className="row g-3">
                      {itineraryDays.map((day) => (
                        <div className="col-12" key={day.day}>
                          <div className="border rounded-3 p-4">
                            <p className="text-primary fw-semibold mb-1">
                              Day {day.day}
                            </p>

                            <h3 className="h5 fw-bold text-dark mb-3">
                              {day.title}
                            </h3>

                            <div className="row g-3">
                              <div className="col-12 col-lg-4">
                                <p className="fw-semibold mb-1">Morning</p>

                                <p className="text-secondary mb-0">
                                  {day.morning}
                                </p>
                              </div>

                              <div className="col-12 col-lg-4">
                                <p className="fw-semibold mb-1">Afternoon</p>

                                <p className="text-secondary mb-0">
                                  {day.afternoon}
                                </p>
                              </div>

                              <div className="col-12 col-lg-4">
                                <p className="fw-semibold mb-1">Evening</p>

                                <p className="text-secondary mb-0">
                                  {day.evening}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
