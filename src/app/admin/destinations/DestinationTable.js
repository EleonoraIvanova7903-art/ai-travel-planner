"use client";

import { Fragment, useState } from "react";
import {
  FaCalendarDays,
  FaChevronDown,
  FaChevronUp,
  FaCircleInfo,
  FaClock,
  FaCompass,
  FaLocationDot,
  FaPlane,
  FaWallet,
} from "react-icons/fa6";
import styles from "./destinations.module.css";

function getDurationText(destination) {
  const minimumDuration = Number(destination?.minimumDurationDays);

  const maximumDuration = Number(destination?.maximumDurationDays);

  if (Number.isFinite(minimumDuration) && Number.isFinite(maximumDuration)) {
    return `${minimumDuration}–${maximumDuration} days`;
  }

  return "Not specified";
}

function getList(value) {
  return Array.isArray(value) ? value : [];
}

export default function DestinationTable({
  destinations = [],
  onClearFilters,
}) {
  const [expandedDestinationId, setExpandedDestinationId] = useState("");

  function handleToggleDetails(destinationId) {
    setExpandedDestinationId((currentId) =>
      currentId === destinationId ? "" : destinationId,
    );
  }

  if (!Array.isArray(destinations) || destinations.length === 0) {
    return (
      <section className={`card ${styles.tableCard}`}>
        <div className="card-body p-4 p-lg-5">
          <div
            className={`d-flex flex-column align-items-center justify-content-center text-center p-4 p-md-5 ${styles.emptyState}`}
          >
            <span
              className={`d-inline-flex align-items-center justify-content-center mb-3 ${styles.emptyStateIcon}`}
            >
              <FaCompass />
            </span>

            <h2 className="h5 fw-bold text-dark mb-2">
              No matching destinations
            </h2>

            <p className="text-secondary mb-3">
              No destination records match the current search and filter
              options.
            </p>

            {typeof onClearFilters === "function" && (
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={onClearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`card ${styles.tableCard}`}>
      <div className="card-body p-0">
        <div className="p-4 p-lg-5 pb-3">
          <p className={styles.sectionLabel}>Destination catalogue</p>

          <h2 className="h4 fw-bold text-dark mb-2">
            Available destination records
          </h2>

          <p className="text-secondary mb-0">
            Review the destination information used by the Traveller Planner and
            recommendation system.
          </p>
        </div>

        <div className="table-responsive">
          <table
            className={`table align-middle mb-0 ${styles.destinationTable}`}
          >
            <thead>
              <tr>
                <th scope="col">Destination</th>
                <th scope="col">Airport</th>
                <th scope="col">Recommended stay</th>
                <th scope="col">Spending styles</th>
                <th scope="col">Interests</th>
                <th scope="col" className="text-end">
                  Details
                </th>
              </tr>
            </thead>

            <tbody>
              {destinations.map((destination) => {
                const destinationId = destination.destinationId;

                const spendingTiers = getList(
                  destination.supportedSpendingTiers,
                );

                const interests = getList(destination.interests);

                const bestMonths = getList(destination.bestMonths);

                const isExpanded = expandedDestinationId === destinationId;

                return (
                  <Fragment key={destinationId}>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className={`d-inline-flex align-items-center justify-content-center flex-shrink-0 ${styles.destinationIcon}`}
                          >
                            <FaLocationDot />
                          </span>

                          <div>
                            <div className={styles.destinationName}>
                              {destination.city}
                            </div>

                            <div className="small text-secondary">
                              {destination.country}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge rounded-pill ${styles.airportBadge}`}
                        >
                          <FaPlane className="me-1" />
                          {destination.airportCode || "Not available"}
                        </span>
                      </td>

                      <td className="text-nowrap">
                        <FaClock className="me-2 text-secondary" />
                        {getDurationText(destination)}
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {spendingTiers.length > 0 ? (
                            spendingTiers.map((tier) => (
                              <span
                                key={tier}
                                className={`badge rounded-pill ${styles.tierBadge}`}
                              >
                                {tier}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary">
                              Not specified
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {interests.slice(0, 3).map((interest) => (
                            <span
                              key={interest}
                              className={`badge rounded-pill ${styles.interestBadge}`}
                            >
                              {interest}
                            </span>
                          ))}

                          {interests.length > 3 && (
                            <span
                              className={`badge rounded-pill ${styles.moreBadge}`}
                              title={interests.join(", ")}
                            >
                              +{interests.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="text-end">
                        <button
                          type="button"
                          className={`btn btn-sm btn-outline-dark ${styles.detailsButton}`}
                          onClick={() => handleToggleDetails(destinationId)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <>
                              Hide
                              <FaChevronUp className="ms-2" />
                            </>
                          ) : (
                            <>
                              View
                              <FaChevronDown className="ms-2" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan="6">
                          <div className="p-3 p-lg-4">
                            <div className="row g-3">
                              <div className="col-12 col-xl-5">
                                <div
                                  className={`h-100 p-3 ${styles.detailBlock}`}
                                >
                                  <div className="d-flex align-items-start gap-3">
                                    <FaCircleInfo
                                      className={styles.detailBlockIcon}
                                    />

                                    <div>
                                      <p className={styles.detailBlockLabel}>
                                        Destination description
                                      </p>

                                      <p className="text-secondary mb-0">
                                        {destination.shortDescription ||
                                          "No description is available."}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="col-12 col-md-6 col-xl-3">
                                <div
                                  className={`h-100 p-3 ${styles.detailBlock}`}
                                >
                                  <div className="d-flex align-items-start gap-3">
                                    <FaCalendarDays
                                      className={styles.detailBlockIcon}
                                    />

                                    <div>
                                      <p className={styles.detailBlockLabel}>
                                        Best months
                                      </p>

                                      <p className="text-dark fw-semibold mb-0">
                                        {bestMonths.length > 0
                                          ? bestMonths.join(", ")
                                          : "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="col-12 col-md-6 col-xl-2">
                                <div
                                  className={`h-100 p-3 ${styles.detailBlock}`}
                                >
                                  <div className="d-flex align-items-start gap-3">
                                    <FaWallet
                                      className={styles.detailBlockIcon}
                                    />

                                    <div>
                                      <p className={styles.detailBlockLabel}>
                                        Spending coverage
                                      </p>

                                      <p className="text-dark fw-semibold mb-0">
                                        {spendingTiers.length}{" "}
                                        {spendingTiers.length === 1
                                          ? "tier"
                                          : "tiers"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="col-12 col-xl-2">
                                <div
                                  className={`h-100 p-3 ${styles.detailBlock}`}
                                >
                                  <p className={styles.detailBlockLabel}>
                                    Destination ID
                                  </p>

                                  <code className={styles.destinationId}>
                                    {destinationId}
                                  </code>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
