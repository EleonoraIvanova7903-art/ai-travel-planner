"use client";

import {
  FaArrowRight,
  FaBed,
  FaCalendarDays,
  FaCheck,
  FaCircleInfo,
  FaCompass,
  FaLightbulb,
  FaLocationDot,
  FaPiggyBank,
  FaTicketSimple,
  FaTriangleExclamation,
  FaWandMagicSparkles,
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

function getSuggestionIcon(type) {
  if (type === "accommodation") {
    return <FaBed />;
  }

  if (type === "activities") {
    return <FaTicketSimple />;
  }

  if (type === "travel-month") {
    return <FaCalendarDays />;
  }

  if (type === "alternative-destination") {
    return <FaLocationDot />;
  }

  return <FaLightbulb />;
}

function getSuggestionBadge(type) {
  if (type === "accommodation") {
    return "Accommodation";
  }

  if (type === "activities") {
    return "Activities";
  }

  if (type === "travel-month") {
    return "Travel period";
  }

  if (type === "alternative-destination") {
    return "Destination";
  }

  return "Saving option";
}

function normaliseAiAdvice(aiAdvice) {
  if (Array.isArray(aiAdvice)) {
    return aiAdvice.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof aiAdvice !== "string" || !aiAdvice.trim()) {
    return [];
  }

  return aiAdvice
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

function SuggestionCard({ suggestion, isBestSuggestion, isApplying, onApply }) {
  const canApply = typeof onApply === "function";

  function handleApply() {
    if (canApply) {
      onApply(suggestion);
    }
  }

  return (
    <article className="card h-100 border shadow-sm">
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <span
            className="d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-dark text-white rounded-3"
            style={{
              width: "2.75rem",
              height: "2.75rem",
            }}
            aria-hidden="true"
          >
            {getSuggestionIcon(suggestion.type)}
          </span>

          <div className="d-flex flex-wrap justify-content-end gap-2">
            <span className="badge text-bg-light border text-dark">
              {getSuggestionBadge(suggestion.type)}
            </span>

            {isBestSuggestion && (
              <span className="badge text-bg-success">Best saving option</span>
            )}

            {suggestion.reachesBudget && (
              <span className="badge text-bg-primary">Reaches budget</span>
            )}
          </div>
        </div>

        <h3 className="h5 fw-bold text-dark mb-2">{suggestion.title}</h3>

        <p className="text-secondary mb-4">{suggestion.description}</p>

        <div className="row g-2 mb-4">
          <div className="col-6">
            <div className="h-100 p-3 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Expected saving
              </p>

              <p className="h5 fw-bold text-success mb-0">
                {formatCurrency(suggestion.estimatedSaving)}
              </p>
            </div>
          </div>

          <div className="col-6">
            <div className="h-100 p-3 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Updated total
              </p>

              <p className="h5 fw-bold text-dark mb-0">
                {formatCurrency(suggestion.updatedTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {canApply ? (
            <button
              type="button"
              className="btn btn-outline-dark w-100"
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Applying option...
                </>
              ) : (
                <>
                  {suggestion.actionLabel || "Apply suggestion"}
                  <FaArrowRight className="ms-2" />
                </>
              )}
            </button>
          ) : (
            <div className="alert alert-light border small mb-0">
              <FaCircleInfo className="me-2" />
              This is a simulated saving estimate for the MVP.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function OptimisationSuggestions({
  optimisationData = null,
  aiAdvice = [],
  isAdviceLoading = false,
  adviceError = "",
  applyingSuggestionId = "",
  onApplySuggestion,
}) {
  const adviceItems = normaliseAiAdvice(aiAdvice);

  if (!optimisationData) {
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
            <FaPiggyBank />
          </span>

          <h2 className="h4 fw-bold text-dark mb-3">
            Optimisation suggestions are not available yet
          </h2>

          <p className="text-secondary mb-0">
            Complete the trip information and calculate the estimated cost to
            view possible savings.
          </p>
        </div>
      </section>
    );
  }

  const {
    shouldOptimise,
    currentTotal,
    budget,
    amountToSave,
    suggestions = [],
    bestSuggestion,
    combinedPlan,
  } = optimisationData;

  if (!shouldOptimise) {
    return (
      <section className="card border-0 shadow-sm">
        <div className="card-body p-4 p-lg-5">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-4">
            <span
              className="d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-success text-white rounded-4"
              style={{
                width: "3.5rem",
                height: "3.5rem",
              }}
            >
              <FaCheck />
            </span>

            <div>
              <span className="badge text-bg-success mb-2">
                No optimisation required
              </span>

              <h2 className="h4 fw-bold text-dark mb-2">
                Your estimated trip is within budget
              </h2>

              <p className="text-secondary mb-0">
                The estimated total is {formatCurrency(currentTotal)} from an
                available budget of {formatCurrency(budget)}. You can continue
                with the current travel plan.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-3 mb-4">
          <div>
            <span className="badge text-bg-warning mb-3">
              Budget optimisation
            </span>

            <h2 className="h3 fw-bold text-dark mb-2">
              Reduce the estimated trip cost
            </h2>

            <p className="text-secondary mb-0">
              Review practical changes based on the calculated travel costs and
              prepared TravelMind AI saving rules.
            </p>
          </div>

          <span className="badge text-bg-danger px-3 py-2">
            <FaTriangleExclamation className="me-2" />
            Save {formatCurrency(amountToSave)}
          </span>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="h-100 p-4 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Current estimate
              </p>

              <p className="h3 fw-bold text-dark mb-0">
                {formatCurrency(currentTotal)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="h-100 p-4 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Available budget
              </p>

              <p className="h3 fw-bold text-dark mb-0">
                {formatCurrency(budget)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="h-100 p-4 bg-light border rounded-4">
              <p className="small text-secondary fw-bold text-uppercase mb-1">
                Required reduction
              </p>

              <p className="h3 fw-bold text-danger mb-0">
                {formatCurrency(amountToSave)}
              </p>
            </div>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <>
            <h3 className="h5 fw-bold text-dark mb-3">
              Available saving options
            </h3>

            <div className="row g-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="col-12 col-lg-6">
                  <SuggestionCard
                    suggestion={suggestion}
                    isBestSuggestion={bestSuggestion?.id === suggestion.id}
                    isApplying={applyingSuggestionId === suggestion.id}
                    onApply={onApplySuggestion}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="alert alert-warning" role="alert">
            No rule-based saving option is available for the current cost
            breakdown.
          </div>
        )}

        {combinedPlan && combinedPlan.suggestionIds?.length > 1 && (
          <div className="card bg-light border mt-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-dark text-white rounded-3"
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                  }}
                >
                  <FaCompass />
                </span>

                <div className="flex-grow-1">
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-2">
                    <h3 className="h5 fw-bold text-dark mb-0">
                      Combined saving plan
                    </h3>

                    {combinedPlan.reachesBudget && (
                      <span className="badge text-bg-success align-self-start">
                        Reaches budget
                      </span>
                    )}
                  </div>

                  <p className="text-secondary mb-3">
                    Applying several compatible options could provide a stronger
                    overall reduction.
                  </p>

                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <div className="p-3 bg-white border rounded-4">
                        <p className="small text-secondary fw-bold text-uppercase mb-1">
                          Combined saving
                        </p>

                        <p className="h5 fw-bold text-success mb-0">
                          {formatCurrency(combinedPlan.estimatedSaving)}
                        </p>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="p-3 bg-white border rounded-4">
                        <p className="small text-secondary fw-bold text-uppercase mb-1">
                          Combined total
                        </p>

                        <p className="h5 fw-bold text-dark mb-0">
                          {formatCurrency(combinedPlan.updatedTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="my-4" />

        <section className="p-4 bg-light border rounded-4">
          <div className="d-flex align-items-start gap-3">
            <span
              className="d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-dark text-white rounded-3"
              style={{
                width: "2.75rem",
                height: "2.75rem",
              }}
            >
              <FaWandMagicSparkles />
            </span>

            <div className="flex-grow-1">
              <h3 className="h5 fw-bold text-dark mb-2">
                TravelMind AI budget advice
              </h3>

              {isAdviceLoading && (
                <div
                  className="d-flex align-items-center text-secondary"
                  role="status"
                >
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Generating additional budget advice...
                </div>
              )}

              {!isAdviceLoading && adviceError && (
                <div className="alert alert-warning mb-0" role="alert">
                  {adviceError}
                </div>
              )}

              {!isAdviceLoading && !adviceError && adviceItems.length > 0 && (
                <ul className="text-secondary mb-0">
                  {adviceItems.map((advice, index) => (
                    <li
                      key={`${index}-${advice}`}
                      className={index < adviceItems.length - 1 ? "mb-2" : ""}
                    >
                      {advice}
                    </li>
                  ))}
                </ul>
              )}

              {!isAdviceLoading && !adviceError && adviceItems.length === 0 && (
                <p className="text-secondary mb-0">
                  Additional AI advice will appear after the cost estimate is
                  connected to the Planner page.
                </p>
              )}
            </div>
          </div>
        </section>

        <p className="small text-secondary mt-4 mb-0">
          Saving values are demonstration estimates based on the prepared mock
          travel data and optimisation rules. They do not represent live travel
          prices.
        </p>
      </div>
    </section>
  );
}
