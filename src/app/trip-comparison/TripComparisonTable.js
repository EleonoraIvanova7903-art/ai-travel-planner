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
    success: "text-bg-success",
    primary: "text-bg-primary",
    warning: "text-bg-warning",
    danger: "text-bg-danger",
  };

  return badgeClasses[type] || "text-bg-secondary";
}

export default function TripComparisonTable({ trips, onSelectDestination }) {
  return (
    <section className={`card ${styles.comparisonCard}`}>
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3 mb-4">
          <div>
            <p className={`${styles.eyebrow} mb-2`}>Detailed comparison</p>

            <h2 className={`${styles.sectionTitle} mb-2`}>
              Compare destination costs and suitability
            </h2>

            <p className={`${styles.sectionText} mb-0`}>
              Review calculated costs, budget status and recommendation scores
              before choosing a destination.
            </p>
          </div>

          <span
            className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
          >
            <FaCompass />
          </span>
        </div>

        <div className="table-responsive">
          <table
            className={`table table-hover align-middle mb-0 ${styles.comparisonTable}`}
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
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
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
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
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
                      className={`badge ${getBudgetBadgeClass(
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
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
                    >
                      <FaStar />
                    </span>

                    <span>Interest match</span>
                  </div>
                </th>

                {trips.map((trip) => (
                  <td key={trip.id}>
                    <div
                      className="progress"
                      role="progressbar"
                      aria-label={`${trip.city} interest match`}
                      aria-valuenow={trip.interestMatch}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className={`progress-bar ${styles.matchProgressBar}`}
                        style={{ width: `${trip.interestMatch}%` }}
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
                    <strong>{trip.overallScore}%</strong>
                  </td>
                ))}
              </tr>

              {costRows.map((row) => (
                <tr key={row.field}>
                  <th scope="row">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`${styles.metricIcon} d-inline-flex align-items-center justify-content-center`}
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
                          <span
                            className={`badge ${styles.interestBadge}`}
                            key={interest}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-secondary">No direct match</span>
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
                      className={`btn btn-sm ${styles.tableButton} d-inline-flex align-items-center gap-2`}
                      onClick={() => onSelectDestination?.(trip.destinationId)}
                    >
                      Select
                      <FaArrowRight />
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
