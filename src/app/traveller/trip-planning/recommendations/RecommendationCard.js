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
    return styles.matchStrong;
  }

  if (matchPercentage >= 60) {
    return styles.matchGood;
  }

  return styles.matchStandard;
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
      className={`${styles.recommendationCard} ${
        isInspiration ? styles.inspirationCard : ""
      } ${isSelected ? styles.selectedCard : ""} h-100`}
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
          <span className={styles.inspirationBadge}>
            <FaCompass className="me-1" aria-hidden="true" />
            Travel inspiration
          </span>
        ) : (
          <>
            <span className={styles.rankBadge}>#{recommendationRank}</span>

            <span
              className={`${styles.matchBadge} ${getMatchBadgeClass(
                matchPercentage,
              )}`}
            >
              {matchPercentage}% match
            </span>
          </>
        )}

        {isSelected && (
          <span className={styles.selectedBadge}>
            <FaCheck className="me-1" aria-hidden="true" />
            Selected
          </span>
        )}

        <div className={styles.destinationHeading}>
          <p className="mb-1">
            <FaLocationDot className="me-2" aria-hidden="true" />
            {country}
          </p>

          <h2 className="mb-0">{city}</h2>
        </div>
      </div>

      <div className={`${styles.cardBody} d-flex flex-column`}>
        <p className={`${styles.destinationDescription} mb-4`}>
          {shortDescription}
        </p>

        <div className="row g-2 mb-4">
          <div className="col-6">
            <div className={`${styles.detailItem} h-100`}>
              <FaClock className={styles.detailIcon} aria-hidden="true" />

              <p className={styles.detailLabel}>Recommended stay</p>

              <p className={styles.detailValue}>
                {minimumDurationDays}–{maximumDurationDays} days
              </p>
            </div>
          </div>

          <div className="col-6">
            <div className={`${styles.detailItem} h-100`}>
              <FaWallet className={styles.detailIcon} aria-hidden="true" />

              <p className={styles.detailLabel}>Spending styles</p>

              <p className={styles.detailValue}>
                {supportedSpendingTiers.length > 0
                  ? supportedSpendingTiers.join(", ")
                  : "Flexible"}
              </p>
            </div>
          </div>
        </div>

        {isInspiration ? (
          <>
            <section className="mb-4">
              <h3 className={styles.sectionTitle}>
                <FaStar className="me-2" aria-hidden="true" />
                Best for
              </h3>

              <div className="d-flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span key={interest} className={styles.interestBadge}>
                    {interest}
                  </span>
                ))}
              </div>
            </section>

            <section className={`${styles.inspirationSummary} mb-4`}>
              <div className="d-flex align-items-start gap-3">
                <span
                  className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                  aria-hidden="true"
                >
                  <FaCalendarDays />
                </span>

                <div>
                  <p className={`${styles.summaryLabel} mb-1`}>
                    Recommended travel months
                  </p>

                  <p className={`${styles.summaryValue} mb-0`}>
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
                <FaCompass className="me-2" aria-hidden="true" />
                Why it matches
              </h3>

              <ul className={`${styles.reasonList} mb-0`}>
                {matchReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>

            {matchedInterests.length > 0 && (
              <section className="mb-4">
                <h3 className={styles.sectionTitle}>
                  <FaStar className="me-2" aria-hidden="true" />
                  Matching interests
                </h3>

                <div className="d-flex flex-wrap gap-2">
                  {matchedInterests.map((interest) => (
                    <span key={interest} className={styles.interestBadge}>
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className={`${styles.matchSummary} mb-4`}>
              <div className={styles.matchSummaryRow}>
                <span>
                  <FaCloudSun className="me-2" aria-hidden="true" />
                  Travel month
                </span>

                <strong
                  className={
                    isBestMonth ? styles.positiveStatus : styles.neutralStatus
                  }
                >
                  {isBestMonth ? "Recommended" : "Alternative period"}
                </strong>
              </div>

              <div className={styles.matchSummaryRow}>
                <span>
                  <FaClock className="me-2" aria-hidden="true" />
                  Trip duration
                </span>

                <strong
                  className={
                    isDurationSuitable
                      ? styles.positiveStatus
                      : styles.warningStatus
                  }
                >
                  {isDurationSuitable ? "Suitable" : "Needs adjustment"}
                </strong>
              </div>

              <div className={`${styles.matchSummaryRow} mb-0`}>
                <span>
                  <FaWallet className="me-2" aria-hidden="true" />
                  Spending style
                </span>

                <strong
                  className={
                    isSpendingTierSupported
                      ? styles.positiveStatus
                      : styles.neutralStatus
                  }
                >
                  {isSpendingTierSupported ? "Suitable" : "Alternative match"}
                </strong>
              </div>
            </section>

            {isAiExplanationEnabled ? (
              <section className={`${styles.aiExplanation} mb-4`}>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <h3 className={`${styles.sectionTitle} mb-0`}>
                    <FaWandMagicSparkles className="me-2" aria-hidden="true" />
                    TravelMind AI insight
                  </h3>

                  {isExplanationCached &&
                    explanation &&
                    !isExplanationLoading && (
                      <span className={styles.explanationReadyBadge}>
                        Ready
                      </span>
                    )}
                </div>

                {isExplanationLoading && (
                  <div
                    className={`${styles.explanationLoading} d-flex align-items-center`}
                    role="status"
                  >
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Preparing your personalised insight...
                  </div>
                )}

                {!isExplanationLoading && explanationError && (
                  <div className={styles.explanationError} role="alert">
                    {explanationError}
                  </div>
                )}

                {!isExplanationLoading && !explanationError && explanation && (
                  <p className={`${styles.explanationText} mb-0`}>
                    {explanation}
                  </p>
                )}

                {!isExplanationLoading && !explanationError && !explanation && (
                  <p className={`${styles.explanationText} mb-0`}>
                    A personalised insight will appear here when available.
                  </p>
                )}
              </section>
            ) : (
              <section className={`${styles.recommendationSummary} mb-4`}>
                <h3 className={`${styles.sectionTitle} mb-2`}>
                  <FaCompass className="me-2" aria-hidden="true" />
                  Recommendation summary
                </h3>

                <p className="mb-0">
                  This destination suits several of your selected travel
                  preferences and offers a suitable overall balance.
                </p>
              </section>
            )}
          </>
        )}

        <div className="mt-auto">
          <button
            type="button"
            className={`${styles.cardPrimaryButton} btn w-100`}
            onClick={handleSelect}
            disabled={isSelected}
          >
            {isSelected ? (
              <>
                <FaCheck className="me-2" aria-hidden="true" />

                {isInspiration
                  ? "Destination added to planner"
                  : "Destination selected"}
              </>
            ) : (
              <>
                {isInspiration
                  ? "Plan a trip to this destination"
                  : "Choose this destination"}

                <FaArrowRight className="ms-2" aria-hidden="true" />
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
                    className={`${styles.cardSecondaryButton} ${
                      isCompared ? styles.comparedButton : ""
                    } btn w-100`}
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
                    className={`${styles.cardSecondaryButton} btn w-100`}
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
