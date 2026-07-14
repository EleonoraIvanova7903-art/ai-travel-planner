import Link from "next/link";
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

export default function TripComparisonSummary({ trips }) {
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
      value: `£${lowestCost.totalCost.toLocaleString("en-GB")}`,
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
      {/* Comparison summary cards */}
      <div className="row g-4 mb-4">
        {summaryItems.map((item) => (
          <div className="col-12 col-md-4" key={item.label}>
            <section className={`card h-100 ${styles.summaryCard}`}>
              <div className="card-body p-4">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
                  <span
                    className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                  >
                    {item.icon}
                  </span>

                  <span className={`badge ${styles.summaryBadge}`}>
                    Comparison
                  </span>
                </div>

                <p className={`${styles.summaryLabel} mb-2`}>{item.label}</p>

                <h2 className={`${styles.summaryTitle} mb-2`}>
                  {item.destination}
                </h2>

                <p className={`${styles.summaryValue} mb-0`}>{item.value}</p>
              </div>
            </section>
          </div>
        ))}
      </div>

      {/* Recommended destination */}
      <section className={`card mb-4 ${styles.recommendationCard}`}>
        <div className="card-body p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-8">
              <div className="d-flex align-items-start gap-3">
                <span
                  className={`${styles.recommendationIcon} d-inline-flex align-items-center justify-content-center`}
                >
                  <FaTrophy />
                </span>

                <div>
                  <p className={`${styles.eyebrow} mb-2`}>
                    Best overall option
                  </p>

                  <h2 className={`${styles.recommendationTitle} mb-3`}>
                    {bestOverall.city}, {bestOverall.country}
                  </h2>

                  <p className={`${styles.recommendationText} mb-4`}>
                    {bestOverall.recommendation}
                  </p>

                  <div className="row g-2">
                    {bestOverall.highlights.slice(0, 3).map((highlight) => (
                      <div className="col-12 col-sm-6" key={highlight}>
                        <div className="d-flex align-items-center gap-2">
                          <FaCircleCheck className={styles.checkIcon} />

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

            <div className="col-12 col-lg-4">
              <div className="d-grid gap-2">
                <Link
                  href={`/traveller/trip-planning/itinerary?destination=${bestOverall.slug}`}
                  className={`btn ${styles.primaryButton} d-flex align-items-center justify-content-center gap-2`}
                >
                  Choose this destination
                  <FaArrowRight />
                </Link>

                <Link
                  href="/traveller/trip-planning/recommendations"
                  className={`btn ${styles.secondaryButton}`}
                >
                  Back to recommendations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
