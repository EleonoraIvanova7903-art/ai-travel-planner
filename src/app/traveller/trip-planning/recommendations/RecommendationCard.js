"use client";

import Image from "next/image";
import {
  FaArrowRight,
  FaCalendarDays,
  FaCheck,
  FaCloudSun,
  FaClock,
  FaCompass,
  FaLocationDot,
  FaStar,
  FaWallet,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import styles from "./recommendations.module.css";

function getMatchBadgeClass(matchPercentage) {
  if (matchPercentage >= 80) {
    return "text-bg-success";
  }

  if (matchPercentage >= 60) {
    return "text-bg-primary";
  }

  return "text-bg-secondary";
}

export default function RecommendationCard({
  mode = "personalised",
  destination,
  explanation = "",
  explanationError = "",
  isExplanationLoading = false,
  isExplanationCached = false,
  isAiExplanationEnabled = true,
  isSelected = false,
  isCompared = false,
  isCompareDisabled = false,
  isSaving = false,
  onSelect,
  onCompare,
  onSave,
}) {
  const isInspiration = mode === "inspiration";

  const {
    recommendationRank,
    city,
    country,
    image,
    shortDescription,
    matchPercentage,
    interests = [],
    matchedInterests = [],
    matchReasons = [],
    bestMonths = [],
    minimumDurationDays,
    maximumDurationDays,
    supportedSpendingTiers = [],
    isBestMonth,
    isDurationSuitable,
    isSpendingTierSupported,
  } = destination;

  function handleSelect() {
    if (typeof onSelect === "function") {
      onSelect(destination);
    }
  }

  function handleCompare() {
    if (typeof onCompare === "function") {
      onCompare(destination);
    }
  }

  function handleSave() {
    if (typeof onSave === "function") {
      onSave(destination);
    }
  }

  return (
    <article
      className={`card h-100 ${styles.recommendationCard} ${
        isInspiration ? styles.inspirationCard : ""
      } ${isSelected ? styles.selectedCard : ""}`}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={image}
          alt={`${city}, ${country}`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
          className={styles.destinationImage}
        />

        <div className={styles.imageOverlay} />

        {isInspiration ? (
          <span className={`badge ${styles.inspirationBadge}`}>
            <FaCompass className="me-1" />
            Travel inspiration
          </span>
        ) : (
          <>
            <span className={`badge ${styles.rankBadge}`}>
              #{recommendationRank}
            </span>

            <span
              className={`badge ${getMatchBadgeClass(
                matchPercentage,
              )} ${styles.matchBadge}`}
            >
              {matchPercentage}% match
            </span>
          </>
        )}

        {isSelected && (
          <span className={`badge text-bg-dark ${styles.selectedBadge}`}>
            <FaCheck className="me-1" />
            Selected
          </span>
        )}

        <div className={styles.destinationHeading}>
          <p className="mb-1">
            <FaLocationDot className="me-2" />
            {country}
          </p>

          <h2 className="h3 fw-bold mb-0">{city}</h2>
        </div>
      </div>

      <div className="card-body d-flex flex-column p-4">
        <p className="text-secondary mb-4">{shortDescription}</p>

        <div className="row g-2 mb-4">
          <div className="col-6">
            <div className={`h-100 p-3 ${styles.detailItem}`}>
              <FaClock className={styles.detailIcon} />

              <p className={styles.detailLabel}>Recommended stay</p>

              <p className={styles.detailValue}>
                {minimumDurationDays}–{maximumDurationDays} days
              </p>
            </div>
          </div>

          <div className="col-6">
            <div className={`h-100 p-3 ${styles.detailItem}`}>
              <FaWallet className={styles.detailIcon} />

              <p className={styles.detailLabel}>Spending styles</p>

              <p className={styles.detailValue}>
                {supportedSpendingTiers.join(", ")}
              </p>
            </div>
          </div>
        </div>

        {isInspiration ? (
          <>
            <section className="mb-4">
              <h3 className={styles.sectionTitle}>
                <FaStar className="me-2" />
                Best for
              </h3>

              <div className="d-flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className={`badge rounded-pill ${styles.interestBadge}`}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </section>

            <section className={`mb-4 p-3 ${styles.inspirationSummary}`}>
              <div className="d-flex align-items-start gap-3">
                <FaCalendarDays className={styles.inspirationSummaryIcon} />

                <div>
                  <p className="small text-uppercase fw-bold mb-1">
                    Recommended travel months
                  </p>

                  <p className="mb-0">
                    {bestMonths.length > 0
                      ? bestMonths.slice(0, 5).join(", ")
                      : "Flexible throughout the year"}
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="mb-4">
              <h3 className={styles.sectionTitle}>
                <FaCompass className="me-2" />
                Why it matches
              </h3>

              <ul className={`mb-0 ${styles.reasonList}`}>
                {matchReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>

            {matchedInterests.length > 0 && (
              <section className="mb-4">
                <h3 className={styles.sectionTitle}>
                  <FaStar className="me-2" />
                  Matching interests
                </h3>

                <div className="d-flex flex-wrap gap-2">
                  {matchedInterests.map((interest) => (
                    <span
                      key={interest}
                      className={`badge rounded-pill ${styles.interestBadge}`}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className={`mb-4 p-3 ${styles.matchSummary}`}>
              <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                <span>
                  <FaCloudSun className="me-2" />
                  Travel month
                </span>

                <strong>
                  {isBestMonth ? "Recommended" : "Alternative period"}
                </strong>
              </div>

              <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                <span>
                  <FaClock className="me-2" />
                  Trip duration
                </span>

                <strong>
                  {isDurationSuitable ? "Suitable" : "Needs adjustment"}
                </strong>
              </div>

              <div className="d-flex justify-content-between align-items-center gap-3">
                <span>
                  <FaWallet className="me-2" />
                  Spending style
                </span>

                <strong>
                  {isSpendingTierSupported
                    ? "Supported"
                    : "Not the closest match"}
                </strong>
              </div>
            </section>

            {isAiExplanationEnabled ? (
              <section className={`mb-4 p-3 ${styles.aiExplanation}`}>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <h3 className={`${styles.sectionTitle} mb-0`}>
                    <FaWandMagicSparkles className="me-2" />
                    TravelMind AI explanation
                  </h3>

                  {isExplanationCached &&
                    explanation &&
                    !isExplanationLoading && (
                      <span className="badge text-bg-light border text-secondary">
                        Previously generated
                      </span>
                    )}
                </div>

                {isExplanationLoading && (
                  <div
                    className="d-flex align-items-center text-secondary"
                    role="status"
                  >
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Generating personalised explanation...
                  </div>
                )}

                {!isExplanationLoading && explanationError && (
                  <p className="text-danger mb-0">{explanationError}</p>
                )}

                {!isExplanationLoading && !explanationError && explanation && (
                  <p className="text-secondary mb-0">{explanation}</p>
                )}

                {!isExplanationLoading && !explanationError && !explanation && (
                  <p className="text-secondary mb-0">
                    The personalised explanation will appear here.
                  </p>
                )}
              </section>
            ) : (
              <section className={`mb-4 p-3 ${styles.aiExplanation}`}>
                <h3 className={`${styles.sectionTitle} mb-2`}>
                  <FaCompass className="me-2" />
                  Recommendation summary
                </h3>

                <p className="text-secondary mb-0">
                  This destination was ranked using your budget, interests,
                  travel month and calculated value-for-money score.
                </p>
              </section>
            )}
          </>
        )}

        <div className="mt-auto">
          <button
            type="button"
            className="btn btn-dark w-100"
            onClick={handleSelect}
            disabled={isSelected}
          >
            {isSelected ? (
              <>
                <FaCheck className="me-2" />

                {isInspiration
                  ? "Destination added to planner"
                  : "Destination selected"}
              </>
            ) : (
              <>
                {isInspiration
                  ? "Plan a trip to this destination"
                  : "Choose this destination"}

                <FaArrowRight className="ms-2" />
              </>
            )}
          </button>

          {(typeof onCompare === "function" ||
            typeof onSave === "function") && (
            <div className="row g-2 mt-1">
              {typeof onCompare === "function" && (
                <div
                  className={typeof onSave === "function" ? "col-6" : "col-12"}
                >
                  <button
                    type="button"
                    className={`btn w-100 ${
                      isCompared ? "btn-secondary" : "btn-outline-secondary"
                    }`}
                    onClick={handleCompare}
                    aria-pressed={isCompared}
                    disabled={isCompareDisabled}
                  >
                    {isCompared
                      ? "Remove"
                      : isCompareDisabled
                        ? "Limit reached"
                        : "Compare"}
                  </button>
                </div>
              )}

              {typeof onSave === "function" && (
                <div
                  className={
                    typeof onCompare === "function" ? "col-6" : "col-12"
                  }
                >
                  <button
                    type="button"
                    className="btn btn-outline-dark w-100"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
