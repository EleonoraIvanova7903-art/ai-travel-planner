"use client";

import {
  FaCalendarDays,
  FaLocationDot,
  FaPlane,
  FaUsers,
  FaWallet,
} from "react-icons/fa6";
import {
  mockDestinations,
  spendingTierOptions,
  travelInterestOptions,
} from "@/data/mockDestinations";
import { mockDepartureAirports } from "@/data/mockFlights";
import { useTripPlanner } from "@/context/TripPlannerContext";

const travelMonthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TripPlannerForm({ onSubmit, isSubmitting = false }) {
  const {
    tripPlannerData,
    updateTripPlannerField,
    toggleTripInterest,
    resetTripPlannerData,
  } = useTripPlanner();

  const selectedDestination = mockDestinations.find(
    (destination) => destination.destinationId === tripPlannerData.destination,
  );

  function handleDestinationChange(event) {
    const destinationId = event.target.value;

    const destination = mockDestinations.find(
      (item) => item.destinationId === destinationId,
    );

    updateTripPlannerField("destination", destinationId);

    if (destination) {
      const currentDuration = Number(tripPlannerData.duration);

      if (
        currentDuration < destination.minimumDurationDays ||
        currentDuration > destination.maximumDurationDays
      ) {
        updateTripPlannerField("duration", destination.minimumDurationDays);
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (typeof onSubmit === "function") {
      onSubmit(tripPlannerData);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <label
            className="form-label fw-semibold"
            htmlFor="planner-destination"
          >
            <FaLocationDot className="me-2" />
            Destination
          </label>

          <select
            id="planner-destination"
            className="form-select"
            value={tripPlannerData.destination}
            onChange={handleDestinationChange}
            required
          >
            <option value="">Select a destination</option>

            {mockDestinations.map((destination) => (
              <option
                key={destination.destinationId}
                value={destination.destinationId}
              >
                {destination.city}, {destination.country}
              </option>
            ))}
          </select>

          {selectedDestination && (
            <div className="form-text">
              Recommended stay: {selectedDestination.minimumDurationDays}–
              {selectedDestination.maximumDurationDays} days
            </div>
          )}
        </div>

        <div className="col-12 col-lg-6">
          <label className="form-label fw-semibold" htmlFor="planner-airport">
            <FaPlane className="me-2" />
            Departure airport
          </label>

          <select
            id="planner-airport"
            className="form-select"
            value={tripPlannerData.departureAirportCode}
            onChange={(event) =>
              updateTripPlannerField("departureAirportCode", event.target.value)
            }
            required
          >
            <option value="">Select a departure airport</option>

            {mockDepartureAirports.map((airport) => (
              <option key={airport.airportCode} value={airport.airportCode}>
                {airport.city} — {airport.airportName} ({airport.airportCode})
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" htmlFor="planner-budget">
            <FaWallet className="me-2" />
            Total budget
          </label>

          <div className="input-group">
            <span className="input-group-text">£</span>

            <input
              id="planner-budget"
              type="number"
              className="form-control"
              min="100"
              step="10"
              value={tripPlannerData.budget}
              onChange={(event) =>
                updateTripPlannerField(
                  "budget",
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
              placeholder="1200"
              required
            />
          </div>
        </div>

        <div className="col-12 col-md-6">
          <label
            className="form-label fw-semibold"
            htmlFor="planner-travellers"
          >
            <FaUsers className="me-2" />
            Number of travellers
          </label>

          <input
            id="planner-travellers"
            type="number"
            className="form-control"
            min="1"
            max="10"
            value={tripPlannerData.travellers}
            onChange={(event) =>
              updateTripPlannerField("travellers", Number(event.target.value))
            }
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" htmlFor="planner-month">
            <FaCalendarDays className="me-2" />
            Travel month
          </label>

          <select
            id="planner-month"
            className="form-select"
            value={tripPlannerData.travelMonth}
            onChange={(event) =>
              updateTripPlannerField("travelMonth", event.target.value)
            }
            required
          >
            <option value="">Select a month</option>

            {travelMonthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" htmlFor="planner-duration">
            Trip duration
          </label>

          <input
            id="planner-duration"
            type="number"
            className="form-control"
            min={selectedDestination?.minimumDurationDays || 1}
            max={selectedDestination?.maximumDurationDays || 14}
            value={tripPlannerData.duration}
            onChange={(event) =>
              updateTripPlannerField("duration", Number(event.target.value))
            }
            required
          />
        </div>

        <div className="col-12">
          <label
            className="form-label fw-semibold"
            htmlFor="planner-spending-tier"
          >
            Spending preference
          </label>

          <select
            id="planner-spending-tier"
            className="form-select"
            value={tripPlannerData.spendingTier}
            onChange={(event) =>
              updateTripPlannerField("spendingTier", event.target.value)
            }
            required
          >
            {spendingTierOptions.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <fieldset>
            <legend className="form-label fw-semibold">Travel interests</legend>

            <p className="text-secondary small mb-3">
              Select one or more interests for personalised recommendations.
            </p>

            <div className="row g-3">
              {travelInterestOptions.map((interest) => {
                const inputId = `planner-interest-${interest
                  .toLowerCase()
                  .replaceAll(" ", "-")}`;

                return (
                  <div className="col-6 col-md-4 col-xl-3" key={interest}>
                    <div className="form-check border rounded-3 p-3 ps-5 h-100">
                      <input
                        id={inputId}
                        type="checkbox"
                        className="form-check-input"
                        checked={tripPlannerData.interests.includes(interest)}
                        onChange={() => toggleTripInterest(interest)}
                      />

                      <label
                        className="form-check-label fw-medium"
                        htmlFor={inputId}
                      >
                        {interest}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="col-12">
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-end border-top pt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={resetTripPlannerData}
              disabled={isSubmitting}
            >
              Reset form
            </button>

            <button
              type="submit"
              className="btn btn-dark px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Preparing trip...
                </>
              ) : (
                "Create travel plan"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
