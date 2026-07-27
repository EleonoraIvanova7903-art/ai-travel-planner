"use client";

import {
  FaArrowRight,
  FaBus,
  FaCalendarDays,
  FaCompass,
  FaHotel,
  FaPlane,
  FaStar,
  FaTicket,
  FaUtensils,
  FaWallet,
} from "react-icons/fa6";
import styles from "./trip-comparison.module.css";

const costRows = [
  {
    label: "Return flights",
    field: "flightCost",
    icon: <FaPlane />,
  },
  {
    label: "Accommodation",
    field: "accommodationCost",
    icon: <FaHotel />,
  },
  {
    label: "Food",
    field: "foodCost",
    icon: <FaUtensils />,
  },
  {
    label: "Local transport",
    field: "transportCost",
    icon: <FaBus />,
  },
  {
    label: "Activities",
    field: "activitiesCost",
    icon: <FaTicket />,
  },
];

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getBudgetBadgeClass(type) {
  const badgeClasses = {
    success: styles.budgetSuccess,
    primary: styles.budgetPrimary,
    warning: styles.budgetWarning,
    danger: styles.budgetDanger,
  };

  return badgeClasses[type] || styles.budgetNeutral;
}

export default function TripComparisonTable({ trips, onSelectDestination }) {
  return (
    <section className={styles.comparisonCard}>
      <div
        className={`${styles.comparisonHeader} d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3`}
      >
        <div>
          <p className={`${styles.comparisonEyebrow} mb-2`}>
            Detailed comparison
          </p>

          <h2 className={`${styles.sectionTitle} mb-2`}>
            Compare costs and travel suitability
          </h2>

          <p className={`${styles.sectionText} mb-0`}>
            Review each destination across the same travel preferences before
            making your final choice.
          </p>
        </div>

        <span
          className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
          aria-hidden="true"
        >
          <FaCompass />
        </span>
      </div>

      <div className={styles.comparisonBody}>
        <div className="table-responsive">
          <table
            className={`table align-middle mb-0 ${styles.comparisonTable}`}
          >
            <thead>
              <tr>
                <th scope="col">Comparison factor</th>

                {trips.map((trip) => (
                  <th scope="col" key={trip.id}>
                    <div>
                      <p className={`${styles.destinationName} mb-1`}>
                        {trip.city}
                      </p>

                      <p className={`${styles.destinationCountry} mb-0`}>
                        {trip.country}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <th scope="row">
                  <div className={styles.metricHeading}>
                    <span
                      className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaWallet />
                    </span>

                    <span>Total estimated cost</span>
                  </div>
                </th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    <strong className={styles.costValue}>
                      {formatCurrency(trip.totalCost, trip.currency)}
                    </strong>
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row">
                  <div className={styles.metricHeading}>
                    <span
                      className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaCalendarDays />
                    </span>

                    <span>Average daily cost</span>
                  </div>
                </th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    {formatCurrency(trip.dailyCost, trip.currency)}
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row">Trip duration</th>

                {trips.map((trip) => (
                  <td key={trip.id}>{trip.duration} days</td>
                ))}
              </tr>

              <tr>
                <th scope="row">Budget status</th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    <span
                      className={`${styles.budgetBadge} ${getBudgetBadgeClass(
                        trip.budgetType,
                      )}`}
                    >
                      {trip.budgetStatus}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row">
                  <div className={styles.metricHeading}>
                    <span
                      className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaStar />
                    </span>

                    <span>Interest match</span>
                  </div>
                </th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    <div
                      className={styles.matchProgress}
                      role="progressbar"
                      aria-label={`${trip.city} interest match`}
                      aria-valuenow={trip.interestMatch}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className={styles.matchProgressBar}
                        style={{
                          width: `${Math.min(
                            Math.max(trip.interestMatch, 0),
                            100,
                          )}%`,
                        }}
                      >
                        {trip.interestMatch}%
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row">Travel month match</th>

                {trips.map((trip) => (
                  <td key={trip.id}>{trip.monthSuitability}</td>
                ))}
              </tr>

              <tr>
                <th scope="row">Overall recommendation score</th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    <strong className={styles.scoreValue}>
                      {trip.overallScore}%
                    </strong>
                  </td>
                ))}
              </tr>

              {costRows.map((row) => (
                <tr key={row.field}>
                  <th scope="row">
                    <div className={styles.metricHeading}>
                      <span
                        className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        {row.icon}
                      </span>

                      <span>{row.label}</span>
                    </div>
                  </th>

                  {trips.map((trip) => (
                    <td key={trip.id}>
                      {formatCurrency(trip[row.field], trip.currency)}
                    </td>
                  ))}
                </tr>
              ))}

              <tr>
                <th scope="row">Supported spending styles</th>

                {trips.map((trip) => (
                  <td key={trip.id}>{trip.travelStyle}</td>
                ))}
              </tr>

              <tr>
                <th scope="row">Matching interests</th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    {trip.interests.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {trip.interests.map((interest) => (
                          <span className={styles.interestBadge} key={interest}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.mutedText}>No direct match</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row">Destination action</th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    <button
                      type="button"
                      className={`${styles.tableButton} btn btn-sm d-inline-flex align-items-center gap-2`}
                      onClick={() => onSelectDestination?.(trip.destinationId)}
                    >
                      Select
                      <FaArrowRight aria-hidden="true" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
