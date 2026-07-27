"use client";

import {
  FaArrowRight,
  FaCircleCheck,
  FaStar,
  FaTrophy,
  FaWallet,
} from "react-icons/fa6";
import styles from "./trip-comparison.module.css";

function findHighest(trips, field) {
  return trips.reduce((bestTrip, currentTrip) =>
    currentTrip[field] > bestTrip[field] ? currentTrip : bestTrip,
  );
}

function findLowest(trips, field) {
  return trips.reduce((bestTrip, currentTrip) =>
    currentTrip[field] < bestTrip[field] ? currentTrip : bestTrip,
  );
}

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TripComparisonSummary({ trips, onSelectDestination }) {
  if (!trips || trips.length === 0) {
    return null;
  }

  const bestOverall = findHighest(trips, "overallScore");
  const bestInterestMatch = findHighest(trips, "interestMatch");
  const lowestCost = findLowest(trips, "totalCost");

  const summaryItems = [
    {
      label: "Recommended choice",
      destination: `${bestOverall.city}, ${bestOverall.country}`,
      value: `${bestOverall.overallScore}% overall score`,
      icon: <FaTrophy />,
    },
    {
      label: "Lowest estimated cost",
      destination: `${lowestCost.city}, ${lowestCost.country}`,
      value: formatCurrency(lowestCost.totalCost, lowestCost.currency),
      icon: <FaWallet />,
    },
    {
      label: "Best interest match",
      destination: `${bestInterestMatch.city}, ${bestInterestMatch.country}`,
      value: `${bestInterestMatch.interestMatch}% match`,
      icon: <FaStar />,
    },
  ];

  return (
    <>
      <div className="row g-4 mb-4">
        {summaryItems.map((item) => (
          <div className="col-12 col-md-4" key={item.label}>
            <section className={`${styles.summaryCard} h-100`}>
              <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
                <span
                  className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <span className={styles.summaryBadge}>Trip comparison</span>
              </div>

              <p className={`${styles.summaryLabel} mb-2`}>{item.label}</p>

              <h2 className={`${styles.summaryTitle} mb-2`}>
                {item.destination}
              </h2>

              <p className={`${styles.summaryValue} mb-0`}>{item.value}</p>
            </section>
          </div>
        ))}
      </div>

      <section className={`${styles.recommendationCard} mb-4`}>
        <div className="row g-4 align-items-center">
          <div className="col-12 col-xl-8">
            <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
              <span
                className={`${styles.recommendationIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                aria-hidden="true"
              >
                <FaTrophy />
              </span>

              <div>
                <p className={`${styles.recommendationEyebrow} mb-2`}>
                  Best overall option
                </p>

                <h2 className={`${styles.recommendationTitle} mb-3`}>
                  {bestOverall.city}, {bestOverall.country}
                </h2>

                <p className={`${styles.recommendationText} mb-4`}>
                  {bestOverall.recommendation}
                </p>

                <div className="row g-3">
                  {bestOverall.highlights.map((highlight) => (
                    <div className="col-12 col-sm-6" key={highlight}>
                      <div className={styles.highlightItem}>
                        <FaCircleCheck
                          className={styles.checkIcon}
                          aria-hidden="true"
                        />

                        <span className={styles.highlightText}>
                          {highlight}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <button
              type="button"
              className={`${styles.primaryButton} btn w-100 d-flex align-items-center justify-content-center gap-2`}
              onClick={() => onSelectDestination?.(bestOverall.destinationId)}
            >
              Choose this destination
              <FaArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
