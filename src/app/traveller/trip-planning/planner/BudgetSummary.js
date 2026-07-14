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
      badgeClass: "text-bg-success",
      progressClass: "bg-success",
      alertClass: "alert-success",
      icon: <FaCircleCheck />,
    };
  }

  if (status === "close-to-budget") {
    return {
      badgeClass: "text-bg-warning",
      progressClass: "bg-warning",
      alertClass: "alert-warning",
      icon: <FaTriangleExclamation />,
    };
  }

  if (status === "over-budget") {
    return {
      badgeClass: "text-bg-danger",
      progressClass: "bg-danger",
      alertClass: "alert-danger",
      icon: <FaTriangleExclamation />,
    };
  }

  return {
    badgeClass: "text-bg-secondary",
    progressClass: "bg-secondary",
    alertClass: "alert-secondary",
    icon: <FaCircleInfo />,
  };
}

function BudgetCategoryCard({ icon, label, value, description }) {
  return (
    <div className="col-12 col-sm-6 col-xl">
      <div className="card h-100 border">
        <div className="card-body p-3">
          <div className="d-flex align-items-start gap-3">
            <span
              className="d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-dark text-white rounded-3"
              style={{
                width: "2.5rem",
                height: "2.5rem",
              }}
              aria-hidden="true"
            >
              {icon}
            </span>

            <div className="min-w-0">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                {label}
              </p>

              <p className="h5 fw-bold text-dark mb-1">
                {formatCurrency(value)}
              </p>

              {description && (
                <p className="small text-secondary mb-0">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
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
      <section className="card border-0 shadow-sm">
        <div className="card-body p-4" role="status">
          <div className="d-flex align-items-center">
            <span
              className="spinner-border spinner-border-sm me-3"
              aria-hidden="true"
            />

            <div>
              <h2 className="h5 fw-bold text-dark mb-1">
                Calculating your trip budget
              </h2>

              <p className="text-secondary mb-0">
                Preparing the flight, accommodation, food, transport and
                activity estimates.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!tripCost || !budgetStatus) {
    return (
      <section className="card border-0 shadow-sm">
        <div className="card-body p-4 p-lg-5 text-center">
          <span
            className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-4 mb-3"
            style={{
              width: "3.5rem",
              height: "3.5rem",
            }}
          >
            <FaWallet />
          </span>

          <h2 className="h4 fw-bold text-dark mb-3">
            Budget estimate not available yet
          </h2>

          <p className="text-secondary mb-0">
            Complete the destination, departure airport, month, duration and
            Traveller details to calculate the estimated trip cost.
          </p>
        </div>
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
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-3 mb-4">
          <div>
            <span className="badge bg-dark mb-3">Estimated trip cost</span>

            <h2 className="h3 fw-bold text-dark mb-2">Budget summary</h2>

            <p className="text-secondary mb-0">
              Review the estimated cost before generating your final itinerary.
            </p>
          </div>

          <span className={`badge ${statusPresentation.badgeClass} px-3 py-2`}>
            <span className="me-2" aria-hidden="true">
              {statusPresentation.icon}
            </span>

            {budgetStatus.label}
          </span>
        </div>

        {Array.isArray(tripCost.missingData) &&
          tripCost.missingData.length > 0 && (
            <div className="alert alert-warning" role="alert">
              Some cost information is incomplete:{" "}
              {tripCost.missingData.join(", ")}. The current result is a partial
              estimate.
            </div>
          )}

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="h-100 p-4 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Available budget
              </p>

              <p className="h3 fw-bold text-dark mb-0">
                {formatCurrency(budgetStatus.budget)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="h-100 p-4 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Estimated total
              </p>

              <p className="h3 fw-bold text-dark mb-0">
                {formatCurrency(budgetStatus.estimatedCost)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="h-100 p-4 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                {budgetStatus.isOverBudget || budgetStatus.isCloseToBudget
                  ? "Amount over budget"
                  : "Remaining budget"}
              </p>

              <p className="h3 fw-bold text-dark mb-0">
                {formatCurrency(
                  budgetStatus.isOverBudget || budgetStatus.isCloseToBudget
                    ? budgetStatus.overAmount
                    : budgetStatus.remainingAmount,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
            <span className="fw-semibold text-dark">Budget used</span>

            <span className="fw-bold text-dark">
              {usagePercentage.toFixed(1)}%
            </span>
          </div>

          <div
            className="progress"
            role="progressbar"
            aria-label="Budget usage"
            aria-valuenow={progressWidth}
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ height: "0.8rem" }}
          >
            <div
              className={`progress-bar ${statusPresentation.progressClass}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div
          className={`alert ${statusPresentation.alertClass} d-flex align-items-start gap-3`}
          role="status"
        >
          <span className="mt-1" aria-hidden="true">
            {statusPresentation.icon}
          </span>

          <div>
            <h3 className="h6 fw-bold mb-1">{budgetStatus.label}</h3>

            <p className="mb-0">{budgetStatus.description}</p>
          </div>
        </div>

        <hr className="my-4" />

        <h3 className="h5 fw-bold text-dark mb-3">Cost breakdown</h3>

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
            <div className="h-100 p-3 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Travel period
              </p>

              <p className="fw-bold text-dark mb-0">
                {tripCost.travelMonth} ·{" "}
                {tripCost.season
                  ? `${tripCost.season} season`
                  : "Standard season"}
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="h-100 p-3 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Seasonal adjustment
              </p>

              <p className="fw-bold text-dark mb-0">
                ×{Number(tripCost.seasonalMultiplier || 1).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <p className="small text-secondary mt-4 mb-0">
          These values are demonstration estimates calculated from the prepared
          TravelMind AI mock flight, hotel, activity, weather and cost-rule
          data. They are not live booking prices.
        </p>
      </div>
    </section>
  );
}
