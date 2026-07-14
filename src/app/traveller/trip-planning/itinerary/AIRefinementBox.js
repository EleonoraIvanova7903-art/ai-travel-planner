"use client";

import { useState } from "react";
import { FaWandSparkles } from "react-icons/fa6";

export default function AIRefinementBox({
  onRefine,
  isRefining = false,
  disabled = false,
}) {
  const [refinementRequest, setRefinementRequest] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedRequest = refinementRequest.trim();

    if (!trimmedRequest) {
      setValidationMessage(
        "Enter an instruction describing which activities should be changed.",
      );
      return;
    }

    setValidationMessage("");

    if (typeof onRefine === "function") {
      onRefine(trimmedRequest);
    }
  }

  function handleRequestChange(event) {
    setRefinementRequest(event.target.value);

    if (validationMessage) {
      setValidationMessage("");
    }
  }

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex align-items-start gap-3 mb-4">
          <span className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 p-3">
            <FaWandSparkles className="fs-5" aria-hidden="true" />
          </span>

          <div>
            <p className="text-primary fw-semibold mb-1">
              TravelMind AI refinement
            </p>

            <h2 className="h4 fw-bold text-dark mb-2">
              Adjust your itinerary activities
            </h2>

            <p className="text-secondary mb-0">
              Ask Gemini to change activities within the existing itinerary
              days. The number of travel days will remain the same.
            </p>
          </div>
        </div>

        <div className="alert alert-info mb-4" role="note">
          To change the number of days, return to the Trip Planner, update the
          trip duration and generate a new itinerary.
        </div>

        <form onSubmit={handleSubmit}>
          <label
            className="form-label fw-semibold"
            htmlFor="itinerary-refinement-request"
          >
            Activity adjustment instruction
          </label>

          <textarea
            id="itinerary-refinement-request"
            className={`form-control ${validationMessage ? "is-invalid" : ""}`}
            rows="4"
            value={refinementRequest}
            onChange={handleRequestChange}
            placeholder="For example: Replace expensive activities with free alternatives and make Day 2 more relaxing."
            disabled={disabled || isRefining}
            maxLength={500}
          />

          {validationMessage && (
            <div className="invalid-feedback">{validationMessage}</div>
          )}

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mt-3">
            <p className="text-secondary small mb-0">
              {refinementRequest.length}/500 characters
            </p>

            <button
              type="submit"
              className="btn btn-dark px-4"
              disabled={disabled || isRefining}
            >
              {isRefining ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Updating activities...
                </>
              ) : (
                <>
                  <FaWandSparkles className="me-2" />
                  Update itinerary activities
                </>
              )}
            </button>
          </div>
        </form>

        <div className="alert alert-light border mt-4 mb-0">
          <p className="fw-semibold text-dark mb-2">Example activity changes</p>

          <p className="text-secondary small mb-1">
            Replace paid attractions with free alternatives.
          </p>

          <p className="text-secondary small mb-1">Make Day 2 more relaxing.</p>

          <p className="text-secondary small mb-1">
            Include more food and cultural experiences.
          </p>

          <p className="text-secondary small mb-0">
            Remove nightlife activities and add more beach time.
          </p>
        </div>
      </div>
    </section>
  );
}
