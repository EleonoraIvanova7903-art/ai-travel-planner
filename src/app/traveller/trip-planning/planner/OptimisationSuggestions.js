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
    <article className={`${styles.suggestionCard} h-100`}>
      <div className="d-flex flex-column h-100">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <span
            className={`${styles.suggestionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            {getSuggestionIcon(suggestion.type)}
          </span>

          <div className="d-flex flex-wrap justify-content-end gap-2">
            <span className={`${styles.softBadge} badge`}>
              {getSuggestionBadge(suggestion.type)}
            </span>

            {isBestSuggestion && (
              <span className={`${styles.bestBadge} badge`}>
                Best saving option
              </span>
            )}

            {suggestion.reachesBudget && (
              <span className={`${styles.budgetBadge} badge`}>
                Reaches budget
              </span>
            )}
          </div>
        </div>

        <h3 className={`${styles.suggestionTitle} mb-2`}>{suggestion.title}</h3>

        <p className={`${styles.suggestionDescription} mb-4`}>
          {suggestion.description}
        </p>

        <div className="row g-2 mb-4">
          <div className="col-6">
            <div className={`${styles.savingCard} h-100`}>
              <p className={`${styles.savingLabel} mb-1`}>Expected saving</p>

              <p
                className={`${styles.savingValue} ${styles.savingValuePositive} mb-0`}
              >
                {formatCurrency(suggestion.estimatedSaving)}
              </p>
            </div>
          </div>

          <div className="col-6">
            <div className={`${styles.savingCard} h-100`}>
              <p className={`${styles.savingLabel} mb-1`}>Updated total</p>

              <p className={`${styles.savingValue} mb-0`}>
                {formatCurrency(suggestion.updatedTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {canApply ? (
            <button
              type="button"
              className={`${styles.applySuggestionButton} btn w-100`}
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
            <div
              className={`${styles.suggestionInfo} d-flex align-items-start gap-2`}
            >
              <FaCircleInfo className="flex-shrink-0 mt-1" aria-hidden="true" />

              <p className="mb-0">
                This option shows how the estimated total could change.
              </p>
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
      <section className={`${styles.stateCard} text-center`}>
        <span
          className={`${styles.largeStateIcon} d-inline-flex align-items-center justify-content-center mb-3`}
          aria-hidden="true"
        >
          <FaPiggyBank />
        </span>

        <h2 className={`${styles.stateTitle} mb-3`}>
          Saving suggestions will appear here
        </h2>

        <p className={`${styles.stateText} mx-auto mb-0`}>
          Calculate the estimated trip cost to see practical ways to adjust the
          plan.
        </p>
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
      <section className={styles.successPanel}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-4">
          <span
            className={`${styles.successPanelIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
            aria-hidden="true"
          >
            <FaCheck />
          </span>

          <div>
            <span className={`${styles.successBadge} badge mb-2`}>
              No changes required
            </span>

            <h2 className={`${styles.successTitle} mb-2`}>
              Your estimated trip is within budget
            </h2>

            <p className={`${styles.successText} mb-0`}>
              The estimated total is {formatCurrency(currentTotal)} from an
              available budget of {formatCurrency(budget)}. You can continue
              with the current travel plan.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.resultCard}>
      <div
        className={`${styles.sectionHeader} d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-4`}
      >
        <div>
          <p className={`${styles.sectionEyebrow} mb-2`}>Budget optimisation</p>

          <h2 className={`${styles.sectionTitle} mb-2`}>
            Reduce the estimated trip cost
          </h2>

          <p className={`${styles.sectionDescription} mb-0`}>
            Review practical changes that may help bring the trip closer to your
            available budget.
          </p>
        </div>

        <span
          className={`${styles.requiredSavingBadge} d-inline-flex align-items-center align-self-start`}
        >
          <FaTriangleExclamation className="me-2" />
          Save {formatCurrency(amountToSave)}
        </span>
      </div>

      <div className={styles.resultBody}>
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className={`${styles.metricCard} h-100`}>
              <p className={`${styles.metricLabel} mb-1`}>Current estimate</p>

              <p className={`${styles.metricValue} mb-0`}>
                {formatCurrency(currentTotal)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className={`${styles.metricCard} h-100`}>
              <p className={`${styles.metricLabel} mb-1`}>Available budget</p>

              <p
                className={`${styles.metricValue} ${styles.metricValueAccent} mb-0`}
              >
                {formatCurrency(budget)}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className={`${styles.metricCard} h-100`}>
              <p className={`${styles.metricLabel} mb-1`}>Required reduction</p>

              <p
                className={`${styles.metricValue} ${styles.metricValueDanger} mb-0`}
              >
                {formatCurrency(amountToSave)}
              </p>
            </div>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <>
            <h3 className={`${styles.breakdownTitle} mb-3`}>
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
          <div
            className={`${styles.softWarning} d-flex align-items-start gap-3`}
            role="alert"
          >
            <FaTriangleExclamation
              className="flex-shrink-0 mt-1"
              aria-hidden="true"
            />

            <p className="mb-0">
              No suitable saving option is available for the current trip
              details.
            </p>
          </div>
        )}

        {combinedPlan && combinedPlan.suggestionIds?.length > 1 && (
          <div className={`${styles.combinedCard} mt-4`}>
            <div className="d-flex align-items-start gap-3">
              <span
                className={`${styles.combinedIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                aria-hidden="true"
              >
                <FaCompass />
              </span>

              <div className="flex-grow-1">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-2">
                  <h3 className={`${styles.combinedTitle} mb-0`}>
                    Combined saving plan
                  </h3>

                  {combinedPlan.reachesBudget && (
                    <span
                      className={`${styles.budgetBadge} badge align-self-start`}
                    >
                      Reaches budget
                    </span>
                  )}
                </div>

                <p className={`${styles.combinedText} mb-3`}>
                  Combining several suitable changes could provide a stronger
                  overall reduction.
                </p>

                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <div className={styles.combinedMetric}>
                      <p className={`${styles.savingLabel} mb-1`}>
                        Combined saving
                      </p>

                      <p
                        className={`${styles.savingValue} ${styles.savingValuePositive} mb-0`}
                      >
                        {formatCurrency(combinedPlan.estimatedSaving)}
                      </p>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <div className={styles.combinedMetric}>
                      <p className={`${styles.savingLabel} mb-1`}>
                        Combined total
                      </p>

                      <p className={`${styles.savingValue} mb-0`}>
                        {formatCurrency(combinedPlan.updatedTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.contentDivider} />

        <section className={styles.aiAdvicePanel}>
          <div className="d-flex align-items-start gap-3">
            <span
              className={`${styles.aiAdviceIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
              aria-hidden="true"
            >
              <FaWandMagicSparkles />
            </span>

            <div className="flex-grow-1">
              <h3 className={`${styles.aiAdviceTitle} mb-2`}>
                TravelMind AI budget advice
              </h3>

              {isAdviceLoading && (
                <div
                  className={`${styles.aiAdviceText} d-flex align-items-center`}
                  role="status"
                >
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Preparing additional budget advice...
                </div>
              )}

              {!isAdviceLoading && adviceError && (
                <div className={styles.aiAdviceWarning} role="alert">
                  {adviceError}
                </div>
              )}

              {!isAdviceLoading && !adviceError && adviceItems.length > 0 && (
                <ul className={`${styles.adviceList} mb-0`}>
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
                <p className={`${styles.aiAdviceText} mb-0`}>
                  Additional advice will appear when it is available for the
                  current travel plan.
                </p>
              )}
            </div>
          </div>
        </section>

        <p className={`${styles.planningNote} mt-4 mb-0`}>
          Saving amounts are planning estimates and may vary when travel dates,
          availability or preferences change.
        </p>
      </div>
    </section>
  );
}
