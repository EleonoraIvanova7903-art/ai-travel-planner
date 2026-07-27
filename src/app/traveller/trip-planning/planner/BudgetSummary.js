"use client";

import {
  FaBus,
  FaCircleCheck,
  FaCircleInfo,
  FaHotel,
  FaPlane,
  FaTicketSimple,
  FaTriangleExclamation,
  FaUtensils,
  FaWallet,
} from "react-icons/fa6";
import styles from "./planner.module.css";

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "£0.00";
  }

  return numericValue.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusPresentation(status) {
  if (status === "within-budget") {
    return {
      badgeClass: styles.statusSuccess,
      progressClass: styles.progressSuccess,
      noticeClass: styles.noticeSuccess,
      icon: <FaCircleCheck />,
    };
  }

  if (status === "close-to-budget") {
    return {
      badgeClass: styles.statusWarning,
      progressClass: styles.progressWarning,
      noticeClass: styles.noticeWarning,
      icon: <FaTriangleExclamation />,
    };
  }

  if (status === "over-budget") {
    return {
      badgeClass: styles.statusDanger,
      progressClass: styles.progressDanger,
      noticeClass: styles.noticeDanger,
      icon: <FaTriangleExclamation />,
    };
  }

  return {
    badgeClass: styles.statusNeutral,
    progressClass: styles.progressNeutral,
    noticeClass: styles.noticeNeutral,
    icon: <FaCircleInfo />,
  };
}

function BudgetCategoryCard({ icon, label, value, description }) {
  return (
    <div className="col-12 col-sm-6 col-xl">
      <article className={`${styles.categoryCard} h-100`}>
        <div className="d-flex align-items-start gap-3">
          <span
            className={`${styles.categoryIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            {icon}
          </span>

          <div className="min-w-0">
            <p className={`${styles.categoryLabel} mb-1`}>{label}</p>

            <p className={`${styles.categoryValue} mb-1`}>
              {formatCurrency(value)}
            </p>

            {description && (
              <p className={`${styles.categoryDescription} mb-0`}>
                {description}
              </p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function BudgetSummary({
  tripCost = null,
  budgetStatus = null,
  isCalculating = false,
}) {
  if (isCalculating) {
    return (
      <section className={styles.stateCard}>
        <div
          className="d-flex flex-column flex-sm-row align-items-sm-center gap-3"
          role="status"
        >
          <span
            className={`${styles.stateIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
          </span>

          <div>
            <h2 className={`${styles.stateTitle} mb-1`}>
              Calculating your trip budget
            </h2>

            <p className={`${styles.stateText} mb-0`}>
              Preparing estimated costs for travel, accommodation, food,
              transport and activities.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!tripCost || !budgetStatus) {
    return (
      <section className={`${styles.stateCard} text-center`}>
        <span
          className={`${styles.largeStateIcon} d-inline-flex align-items-center justify-content-center mb-3`}
          aria-hidden="true"
        >
          <FaWallet />
        </span>

        <h2 className={`${styles.stateTitle} mb-3`}>
          Your budget estimate will appear here
        </h2>

        <p className={`${styles.stateText} mx-auto mb-0`}>
          Complete the travel details above to review the expected cost of your
          trip.
        </p>
      </section>
    );
  }

  const breakdown = tripCost.breakdown || {};

  const statusPresentation = getStatusPresentation(budgetStatus.status);

  const usagePercentage = Number(budgetStatus.usagePercentage || 0);

  const progressWidth = Math.min(Math.max(usagePercentage, 0), 100);

  const travellerLabel =
    tripCost.travellerCount === 1
      ? "1 traveller"
      : `${tripCost.travellerCount} travellers`;

  const roomLabel = tripCost.rooms === 1 ? "1 room" : `${tripCost.rooms} rooms`;

  const nightLabel =
    tripCost.nights === 1 ? "1 night" : `${tripCost.nights} nights`;

  const flightDescription =
    tripCost.selectedFlight?.airline ||
    tripCost.selectedFlight?.airlineName ||
    travellerLabel;

  const hotelDescription =
    tripCost.selectedHotel?.hotelName ||
    tripCost.selectedHotel?.name ||
    `${nightLabel}, ${roomLabel}`;

  return (
    <section className={styles.resultCard}>
      <div
        className={`${styles.sectionHeader} d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-4`}
      >
        <div>
          <p className={`${styles.sectionEyebrow} mb-2`}>Estimated trip cost</p>

          <h2 className={`${styles.sectionTitle} mb-2`}>Budget summary</h2>

          <p className={`${styles.sectionDescription} mb-0`}>
            Review the expected cost of your trip before continuing with
            recommendations or creating an itinerary.
          </p>
        </div>

        <span
          className={`${styles.statusBadge} ${statusPresentation.badgeClass} d-inline-flex align-items-center align-self-start`}
        >
          <span className="me-2" aria-hidden="true">
            {statusPresentation.icon}
          </span>

          {budgetStatus.label}
        </span>
      </div>

      <div className={styles.resultBody}>
        {Array.isArray(tripCost.missingData) &&
          tripCost.missingData.length > 0 && (
            <div
              className={`${styles.softWarning} d-flex align-items-start gap-3 mb-4`}
              role="alert"
            >
              <FaTriangleExclamation
                className="flex-shrink-0 mt-1"
                aria-hidden="true"
              />

              <p className="mb-0">
                Some prices are currently unavailable:{" "}
                {tripCost.missingData.join(", ")}. The displayed total is a
                partial estimate.
              </p>
            </div>
          )}

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className={`${styles.metricCard} h-100`}>
              <p className={`${styles.metricLabel} mb-1`}>Available budget</p>

              <p className={`${styles.metricValue} mb-0`}>
                {formatCurrency(budgetStatus.budget)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className={`${styles.metricCard} h-100`}>
              <p className={`${styles.metricLabel} mb-1`}>Estimated total</p>

              <p className={`${styles.metricValue} mb-0`}>
                {formatCurrency(budgetStatus.estimatedCost)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className={`${styles.metricCard} h-100`}>
              <p className={`${styles.metricLabel} mb-1`}>
                {budgetStatus.isOverBudget || budgetStatus.isCloseToBudget
                  ? "Amount over budget"
                  : "Remaining budget"}
              </p>

              <p
                className={`${styles.metricValue} ${
                  budgetStatus.isOverBudget
                    ? styles.metricValueDanger
                    : styles.metricValueAccent
                } mb-0`}
              >
                {formatCurrency(
                  budgetStatus.isOverBudget || budgetStatus.isCloseToBudget
                    ? budgetStatus.overAmount
                    : budgetStatus.remainingAmount,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className={`${styles.budgetProgressSection} mb-4`}>
          <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
            <span className={styles.progressLabel}>Budget used</span>

            <span className={styles.progressValue}>
              {usagePercentage.toFixed(1)}%
            </span>
          </div>

          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Budget usage"
            aria-valuenow={progressWidth}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className={`${styles.progressBar} ${statusPresentation.progressClass}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div
          className={`${styles.statusNotice} ${statusPresentation.noticeClass} d-flex align-items-start gap-3 mb-4`}
          role="status"
        >
          <span className="mt-1 flex-shrink-0" aria-hidden="true">
            {statusPresentation.icon}
          </span>

          <div>
            <h3 className={`${styles.noticeTitle} mb-1`}>
              {budgetStatus.label}
            </h3>

            <p className="mb-0">{budgetStatus.description}</p>
          </div>
        </div>

        <div className={styles.contentDivider} />

        <h3 className={`${styles.breakdownTitle} mb-3`}>Cost breakdown</h3>

        <div className="row g-3">
          <BudgetCategoryCard
            icon={<FaPlane />}
            label="Return flights"
            value={breakdown.flight}
            description={flightDescription}
          />

          <BudgetCategoryCard
            icon={<FaHotel />}
            label="Accommodation"
            value={breakdown.accommodation}
            description={hotelDescription}
          />

          <BudgetCategoryCard
            icon={<FaUtensils />}
            label="Food"
            value={breakdown.food}
            description={`${tripCost.durationDays} days, ${travellerLabel}`}
          />

          <BudgetCategoryCard
            icon={<FaBus />}
            label="Local transport"
            value={breakdown.localTransport}
            description={`${tripCost.durationDays} days`}
          />

          <BudgetCategoryCard
            icon={<FaTicketSimple />}
            label="Activities"
            value={breakdown.activities}
            description="Estimated paid activities"
          />
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12 col-lg-6">
            <div className={`${styles.detailCard} h-100`}>
              <p className={`${styles.detailLabel} mb-1`}>Travel period</p>

              <p className={`${styles.detailValue} mb-0`}>
                {tripCost.travelMonth} ·{" "}
                {tripCost.season
                  ? `${tripCost.season} season`
                  : "Standard season"}
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className={`${styles.detailCard} h-100`}>
              <p className={`${styles.detailLabel} mb-1`}>
                Seasonal adjustment
              </p>

              <p className={`${styles.detailValue} mb-0`}>
                ×{Number(tripCost.seasonalMultiplier || 1).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <p className={`${styles.planningNote} mt-4 mb-0`}>
          Prices are planning estimates and may change depending on
          availability, season and the travel options selected.
        </p>
      </div>
    </section>
  );
}
