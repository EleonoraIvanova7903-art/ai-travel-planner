"use client";

import { useState } from "react";
import { FaWandSparkles } from "react-icons/fa6";
import styles from "./itinerary.module.css";

const exampleChanges = [
  "Replace paid attractions with free alternatives.",
  "Make Day 2 more relaxing.",
  "Include more food and cultural experiences.",
  "Remove nightlife activities and add more beach time.",
];

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
    <section className={`card ${styles.refinementCard}`}>
      <div className={styles.refinementAccent} />

      <div className="card-body p-4 p-lg-5">
        <div className="d-flex align-items-start gap-3 mb-4">
          <span
            className={`${styles.refinementIcon} d-inline-flex align-items-center justify-content-center`}
          >
            <FaWandSparkles />
          </span>

          <div>
            <p className={styles.refinementLabel}>TravelMind AI refinement</p>

            <h2 className={styles.refinementTitle}>
              Adjust your itinerary activities
            </h2>

            <p className={styles.refinementText}>
              Describe the changes you would like Gemini to make. The existing
              number of travel days will remain unchanged.
            </p>
          </div>
        </div>

        <div className={styles.refinementNotice} role="note">
          <strong>Need a different trip duration?</strong>

          <p>
            Return to the Trip Planner, change the number of days and generate a
            new itinerary.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            className={styles.refinementFormLabel}
            htmlFor="itinerary-refinement-request"
          >
            Activity adjustment instruction
          </label>

          <textarea
            id="itinerary-refinement-request"
            className={`form-control ${styles.refinementTextarea} ${
              validationMessage ? "is-invalid" : ""
            }`}
            rows="5"
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
            <p className={styles.characterCounter}>
              {refinementRequest.length}/500 characters
            </p>

            <button
              type="submit"
              className={`btn px-4 ${styles.refineButton}`}
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

        <div className={styles.examplesPanel}>
          <p className={styles.examplesTitle}>Example activity changes</p>

          <div className={styles.exampleGrid}>
            {exampleChanges.map((example) => (
              <div className={styles.exampleItem} key={example}>
                <span />
                <p>{example}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
