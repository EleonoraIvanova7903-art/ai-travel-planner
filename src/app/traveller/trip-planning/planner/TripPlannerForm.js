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
import styles from "./planner.module.css";

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
      <section className={styles.formSection}>
        <div className="d-flex align-items-start gap-3 mb-4">
          <span
            className={`${styles.formSectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            <FaLocationDot />
          </span>

          <div>
            <h3 className={`${styles.formSectionTitle} mb-1`}>
              Destination and journey
            </h3>

            <p className={`${styles.formSectionText} mb-0`}>
              Select where you want to travel and where your journey will begin.
            </p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <label
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-destination"
            >
              <FaLocationDot
                className={`${styles.fieldIcon} me-2`}
                aria-hidden="true"
              />
              Destination
            </label>

            <select
              id="planner-destination"
              className={`${styles.formControl} form-select`}
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
              <div className={styles.formHint}>
                Recommended stay: {selectedDestination.minimumDurationDays}–
                {selectedDestination.maximumDurationDays} days
              </div>
            )}
          </div>

          <div className="col-12 col-lg-6">
            <label
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-airport"
            >
              <FaPlane
                className={`${styles.fieldIcon} me-2`}
                aria-hidden="true"
              />
              Departure airport
            </label>

            <select
              id="planner-airport"
              className={`${styles.formControl} form-select`}
              value={tripPlannerData.departureAirportCode}
              onChange={(event) =>
                updateTripPlannerField(
                  "departureAirportCode",
                  event.target.value,
                )
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
            <label
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-month"
            >
              <FaCalendarDays
                className={`${styles.fieldIcon} me-2`}
                aria-hidden="true"
              />
              Travel month
            </label>

            <select
              id="planner-month"
              className={`${styles.formControl} form-select`}
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
            <label
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-duration"
            >
              Trip duration
            </label>

            <input
              id="planner-duration"
              type="number"
              className={`${styles.formControl} form-control`}
              min={selectedDestination?.minimumDurationDays || 1}
              max={selectedDestination?.maximumDurationDays || 14}
              value={tripPlannerData.duration}
              onChange={(event) =>
                updateTripPlannerField("duration", Number(event.target.value))
              }
              required
            />
          </div>
        </div>
      </section>

      <section className={`${styles.formSection} mt-4`}>
        <div className="d-flex align-items-start gap-3 mb-4">
          <span
            className={`${styles.formSectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            <FaWallet />
          </span>

          <div>
            <h3 className={`${styles.formSectionTitle} mb-1`}>
              Budget and travellers
            </h3>

            <p className={`${styles.formSectionText} mb-0`}>
              Set the available budget and the number of people travelling.
            </p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <label
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-budget"
            >
              <FaWallet
                className={`${styles.fieldIcon} me-2`}
                aria-hidden="true"
              />
              Total budget
            </label>

            <div className="input-group">
              <span className={`${styles.inputGroupText} input-group-text`}>
                £
              </span>

              <input
                id="planner-budget"
                type="number"
                className={`${styles.formControl} form-control`}
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
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-travellers"
            >
              <FaUsers
                className={`${styles.fieldIcon} me-2`}
                aria-hidden="true"
              />
              Number of travellers
            </label>

            <input
              id="planner-travellers"
              type="number"
              className={`${styles.formControl} form-control`}
              min="1"
              max="10"
              value={tripPlannerData.travellers}
              onChange={(event) =>
                updateTripPlannerField("travellers", Number(event.target.value))
              }
              required
            />
          </div>
        </div>
      </section>

      <section className={`${styles.formSection} mt-4`}>
        <div className="d-flex align-items-start gap-3 mb-4">
          <span
            className={`${styles.formSectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            <FaCalendarDays />
          </span>

          <div>
            <h3 className={`${styles.formSectionTitle} mb-1`}>
              Travel preferences
            </h3>

            <p className={`${styles.formSectionText} mb-0`}>
              Choose the spending style and interests that best match your trip.
            </p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12">
            <label
              className={`${styles.fieldLabel} form-label`}
              htmlFor="planner-spending-tier"
            >
              Spending preference
            </label>

            <select
              id="planner-spending-tier"
              className={`${styles.formControl} form-select`}
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
              <legend className={`${styles.fieldLabel} mb-1`}>
                Travel interests
              </legend>

              <p className={`${styles.formHint} mt-0 mb-3`}>
                Select one or more interests for personalised recommendations.
              </p>

              <div className="row g-3">
                {travelInterestOptions.map((interest) => {
                  const inputId = `planner-interest-${interest
                    .toLowerCase()
                    .replaceAll(" ", "-")}`;

                  const isSelected =
                    tripPlannerData.interests.includes(interest);

                  return (
                    <div className="col-6 col-md-4 col-xl-3" key={interest}>
                      <div
                        className={`${styles.interestOption} ${
                          isSelected ? styles.interestOptionSelected : ""
                        } h-100`}
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          className={`${styles.interestCheckbox} form-check-input`}
                          checked={isSelected}
                          onChange={() => toggleTripInterest(interest)}
                        />

                        <label
                          className={`${styles.interestLabel} form-check-label`}
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
        </div>
      </section>

      <div
        className={`${styles.formActions} d-flex flex-column flex-sm-row gap-3 justify-content-end mt-4`}
      >
        <button
          type="button"
          className={`${styles.secondaryButton} btn`}
          onClick={resetTripPlannerData}
          disabled={isSubmitting}
        >
          Reset form
        </button>

        <button
          type="submit"
          className={`${styles.primaryButton} btn px-4`}
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
    </form>
  );
}
