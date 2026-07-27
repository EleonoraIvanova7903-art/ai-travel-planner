"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import {
  FaCalendarDays,
  FaChevronDown,
  FaChevronUp,
  FaCircleInfo,
  FaClock,
  FaCompass,
  FaImage,
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
      <section className={styles.tableCard}>
        <div className={styles.tableBody}>
          <div className={styles.emptyState}>
            <span
              className={`${styles.emptyStateIcon} d-inline-flex align-items-center justify-content-center mb-3`}
              aria-hidden="true"
            >
              <FaCompass />
            </span>

            <h2 className={`${styles.emptyStateTitle} mb-2`}>
              No matching destinations
            </h2>

            <p className={`${styles.emptyStateText} mb-4`}>
              No destination records match the current search and filter
              options.
            </p>

            {typeof onClearFilters === "function" && (
              <button
                type="button"
                className={`${styles.resetButton} btn`}
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
    <section className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3">
          <div>
            <p className={`${styles.tableEyebrow} mb-2`}>
              Destination catalogue
            </p>

            <h2 className={`${styles.tableTitle} mb-2`}>
              Available destination records
            </h2>

            <p className={`${styles.tableText} mb-0`}>
              Review the destination information available to the Traveller
              Planner and recommendation pages.
            </p>
          </div>

          <span
            className={`${styles.tableHeaderIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            <FaCompass />
          </span>
        </div>
      </div>

      <div className="table-responsive">
        <table className={`table align-middle mb-0 ${styles.destinationTable}`}>
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

              const spendingTiers = getList(destination.supportedSpendingTiers);

              const interests = getList(destination.interests);
              const bestMonths = getList(destination.bestMonths);

              const isExpanded = expandedDestinationId === destinationId;

              const hasImage = Boolean(destination.image);

              return (
                <Fragment key={destinationId}>
                  <tr className={styles.destinationRow}>
                    <td>
                      <div className={styles.destinationIdentity}>
                        <div className={styles.destinationThumbnail}>
                          {hasImage ? (
                            <Image
                              src={destination.image}
                              alt={`${destination.city}, ${destination.country}`}
                              fill
                              sizes="68px"
                              className={styles.destinationThumbnailImage}
                            />
                          ) : (
                            <span
                              className={styles.destinationThumbnailFallback}
                            >
                              <FaLocationDot aria-hidden="true" />
                            </span>
                          )}

                          <div className={styles.destinationThumbnailOverlay} />
                        </div>

                        <div>
                          <div className={styles.destinationName}>
                            {destination.city}
                          </div>

                          <div className={styles.destinationCountry}>
                            {destination.country}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={styles.airportBadge}>
                        <FaPlane className="me-1" aria-hidden="true" />
                        {destination.airportCode || "Not available"}
                      </span>
                    </td>

                    <td className="text-nowrap">
                      <span className={styles.durationValue}>
                        <FaClock className="me-2" aria-hidden="true" />
                        {getDurationText(destination)}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {spendingTiers.length > 0 ? (
                          spendingTiers.map((tier) => (
                            <span key={tier} className={styles.tierBadge}>
                              {tier}
                            </span>
                          ))
                        ) : (
                          <span className={styles.mutedText}>
                            Not specified
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {interests.slice(0, 3).map((interest) => (
                          <span key={interest} className={styles.interestBadge}>
                            {interest}
                          </span>
                        ))}

                        {interests.length > 3 && (
                          <span
                            className={styles.moreBadge}
                            title={interests.join(", ")}
                          >
                            +{interests.length - 3}
                          </span>
                        )}

                        {interests.length === 0 && (
                          <span className={styles.mutedText}>
                            Not specified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className={`${styles.detailsButton} btn btn-sm`}
                        onClick={() => handleToggleDetails(destinationId)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <>
                            Hide
                            <FaChevronUp className="ms-2" aria-hidden="true" />
                          </>
                        ) : (
                          <>
                            View
                            <FaChevronDown
                              className="ms-2"
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className={styles.expandedRow}>
                      <td colSpan="6">
                        <div className={styles.expandedContent}>
                          <div className="row g-4">
                            <div className="col-12 col-xl-4">
                              <div className={styles.expandedImageWrapper}>
                                {hasImage ? (
                                  <Image
                                    src={destination.image}
                                    alt={`${destination.city}, ${destination.country}`}
                                    fill
                                    sizes="(max-width: 1199px) 100vw, 34vw"
                                    className={styles.expandedImage}
                                  />
                                ) : (
                                  <div className={styles.expandedImageFallback}>
                                    <FaImage aria-hidden="true" />

                                    <span>No destination image</span>
                                  </div>
                                )}

                                <div className={styles.expandedImageOverlay} />

                                <div className={styles.expandedImageHeading}>
                                  <span>{destination.country}</span>

                                  <h3>{destination.city}</h3>
                                </div>
                              </div>
                            </div>

                            <div className="col-12 col-xl-8">
                              <div className="row g-3 h-100">
                                <div className="col-12">
                                  <div
                                    className={`${styles.detailBlock} h-100`}
                                  >
                                    <div className="d-flex align-items-start gap-3">
                                      <span
                                        className={`${styles.detailBlockIconWrapper} d-inline-flex align-items-center justify-content-center`}
                                        aria-hidden="true"
                                      >
                                        <FaCircleInfo />
                                      </span>

                                      <div>
                                        <p className={styles.detailBlockLabel}>
                                          Destination description
                                        </p>

                                        <p className={styles.detailBlockText}>
                                          {destination.shortDescription ||
                                            "No description is available."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-12 col-md-6">
                                  <div
                                    className={`${styles.detailBlock} h-100`}
                                  >
                                    <div className="d-flex align-items-start gap-3">
                                      <span
                                        className={`${styles.detailBlockIconWrapper} d-inline-flex align-items-center justify-content-center`}
                                        aria-hidden="true"
                                      >
                                        <FaCalendarDays />
                                      </span>

                                      <div>
                                        <p className={styles.detailBlockLabel}>
                                          Best travel months
                                        </p>

                                        <p className={styles.detailBlockValue}>
                                          {bestMonths.length > 0
                                            ? bestMonths.join(", ")
                                            : "Not specified"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-12 col-md-6">
                                  <div
                                    className={`${styles.detailBlock} h-100`}
                                  >
                                    <div className="d-flex align-items-start gap-3">
                                      <span
                                        className={`${styles.detailBlockIconWrapper} d-inline-flex align-items-center justify-content-center`}
                                        aria-hidden="true"
                                      >
                                        <FaWallet />
                                      </span>

                                      <div>
                                        <p className={styles.detailBlockLabel}>
                                          Spending coverage
                                        </p>

                                        <div
                                          className={styles.expandedBadgeList}
                                        >
                                          {spendingTiers.length > 0 ? (
                                            spendingTiers.map((tier) => (
                                              <span
                                                key={tier}
                                                className={styles.tierBadge}
                                              >
                                                {tier}
                                              </span>
                                            ))
                                          ) : (
                                            <span className={styles.mutedText}>
                                              Not specified
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-12 col-md-6">
                                  <div
                                    className={`${styles.detailBlock} h-100`}
                                  >
                                    <p className={styles.detailBlockLabel}>
                                      Travel interests
                                    </p>

                                    <div className={styles.expandedBadgeList}>
                                      {interests.length > 0 ? (
                                        interests.map((interest) => (
                                          <span
                                            key={interest}
                                            className={styles.interestBadge}
                                          >
                                            {interest}
                                          </span>
                                        ))
                                      ) : (
                                        <span className={styles.mutedText}>
                                          Not specified
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-12 col-md-6">
                                  <div
                                    className={`${styles.detailBlock} h-100`}
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
    </section>
  );
}
