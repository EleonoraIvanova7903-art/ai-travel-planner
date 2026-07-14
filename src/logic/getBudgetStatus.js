const CLOSE_TO_BUDGET_PERCENTAGE = 10;

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function getBudgetStatus({
  budget = 0,
  estimatedCost = 0,
  closeToBudgetPercentage = CLOSE_TO_BUDGET_PERCENTAGE,
  budgetWarningThresholdPercentage = null,
} = {}) {
  const numericBudget = Number(budget);
  const numericEstimatedCost = Number(estimatedCost);
  const numericClosePercentage = Number(closeToBudgetPercentage);
  const numericWarningThreshold = Number(budgetWarningThresholdPercentage);

  const hasValidValues =
    Number.isFinite(numericBudget) &&
    numericBudget > 0 &&
    Number.isFinite(numericEstimatedCost) &&
    numericEstimatedCost >= 0;

  if (!hasValidValues) {
    return {
      status: "unavailable",
      label: "Budget status unavailable",
      description:
        "Enter a valid budget and generate a complete cost estimate.",

      budget: Number.isFinite(numericBudget) ? numericBudget : 0,

      estimatedCost: Number.isFinite(numericEstimatedCost)
        ? numericEstimatedCost
        : 0,

      difference: 0,
      remainingAmount: 0,
      overAmount: 0,
      usagePercentage: 0,
      closeToBudgetLimit: 0,
      warningThresholdAmount: 0,

      isWithinBudget: false,
      isCloseToBudget: false,
      isOverBudget: false,
    };
  }

  const difference = roundCurrency(numericBudget - numericEstimatedCost);

  const remainingAmount = difference > 0 ? roundCurrency(difference) : 0;

  const overAmount = difference < 0 ? roundCurrency(Math.abs(difference)) : 0;

  const usagePercentage = roundCurrency(
    (numericEstimatedCost / numericBudget) * 100,
  );

  const hasValidWarningThreshold =
    Number.isFinite(numericWarningThreshold) &&
    numericWarningThreshold >= 0 &&
    numericWarningThreshold <= 100;

  if (hasValidWarningThreshold) {
    const warningThresholdAmount = roundCurrency(
      numericBudget * (numericWarningThreshold / 100),
    );

    let status = "within-budget";
    let label = "Within budget";

    let description =
      remainingAmount > 0
        ? `The estimated trip cost is £${remainingAmount.toLocaleString(
            "en-GB",
          )} below your budget.`
        : "The estimated trip cost matches your available budget.";

    if (
      numericEstimatedCost >= warningThresholdAmount &&
      numericEstimatedCost <= numericBudget
    ) {
      status = "close-to-budget";
      label = "Close to budget";

      description =
        remainingAmount > 0
          ? `The estimated trip uses ${usagePercentage}% of the available budget and leaves £${remainingAmount.toLocaleString(
              "en-GB",
            )} remaining.`
          : "The estimated trip cost matches your available budget.";
    }

    if (numericEstimatedCost > numericBudget) {
      status = "over-budget";
      label = "Over budget";

      description = `The estimated trip cost is £${overAmount.toLocaleString(
        "en-GB",
      )} above your available budget.`;
    }

    return {
      status,
      label,
      description,

      budget: roundCurrency(numericBudget),
      estimatedCost: roundCurrency(numericEstimatedCost),
      difference,

      remainingAmount,
      overAmount,
      usagePercentage,

      budgetWarningThresholdPercentage: numericWarningThreshold,
      warningThresholdAmount,

      closeToBudgetLimit: roundCurrency(numericBudget),

      isWithinBudget: status === "within-budget",
      isCloseToBudget: status === "close-to-budget",
      isOverBudget: status === "over-budget",
    };
  }

  const safeClosePercentage =
    Number.isFinite(numericClosePercentage) && numericClosePercentage >= 0
      ? numericClosePercentage
      : CLOSE_TO_BUDGET_PERCENTAGE;

  const closeToBudgetLimit = roundCurrency(
    numericBudget * (1 + safeClosePercentage / 100),
  );

  let status = "within-budget";
  let label = "Within budget";

  let description =
    remainingAmount > 0
      ? `The estimated trip cost is £${remainingAmount.toLocaleString(
          "en-GB",
        )} below your budget.`
      : "The estimated trip cost matches your available budget.";

  if (
    numericEstimatedCost > numericBudget &&
    numericEstimatedCost <= closeToBudgetLimit
  ) {
    status = "close-to-budget";
    label = "Close to budget";

    description = `The estimated trip cost is £${overAmount.toLocaleString(
      "en-GB",
    )} above your budget, but remains within the ${safeClosePercentage}% tolerance range.`;
  }

  if (numericEstimatedCost > closeToBudgetLimit) {
    status = "over-budget";
    label = "Over budget";

    description = `The estimated trip cost is £${overAmount.toLocaleString(
      "en-GB",
    )} above your available budget.`;
  }

  return {
    status,
    label,
    description,

    budget: roundCurrency(numericBudget),
    estimatedCost: roundCurrency(numericEstimatedCost),
    difference,

    remainingAmount,
    overAmount,
    usagePercentage,
    closeToBudgetLimit,
    warningThresholdAmount: 0,

    isWithinBudget: status === "within-budget",
    isCloseToBudget: status === "close-to-budget",
    isOverBudget: status === "over-budget",
  };
}

export default getBudgetStatus;
