import { mockCostRules } from "@/data/mockCostRules";

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getPercentageValue(value, percentage) {
  const numericValue = Number(value);
  const numericPercentage = Number(percentage);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0 ||
    !Number.isFinite(numericPercentage) ||
    numericPercentage <= 0
  ) {
    return 0;
  }

  return roundCurrency(numericValue * (numericPercentage / 100));
}

function createSuggestion({
  id,
  type,
  title,
  description,
  estimatedSaving,
  currentTotal,
  budget,
  actionLabel,
  priority,
  metadata = {},
}) {
  const safeSaving = Math.min(
    roundCurrency(estimatedSaving),
    roundCurrency(currentTotal),
  );

  const updatedTotal = roundCurrency(Math.max(currentTotal - safeSaving, 0));

  return {
    id,
    type,
    title,
    description,
    actionLabel,
    priority,

    estimatedSaving: safeSaving,
    updatedTotal,

    reachesBudget:
      Number.isFinite(Number(budget)) &&
      Number(budget) > 0 &&
      updatedTotal <= Number(budget),

    metadata,
  };
}

function getAlternativeDestinationSuggestion({
  currentDestinationId,
  currentTotal,
  budget,
  alternativeTrips,
  minimumSavingPercentage,
}) {
  if (!Array.isArray(alternativeTrips)) {
    return null;
  }

  const minimumSaving = getPercentageValue(
    currentTotal,
    minimumSavingPercentage,
  );

  const suitableAlternatives = alternativeTrips
    .map((alternative) => {
      const estimatedCost = Number(
        alternative.estimatedCost ??
          alternative.total ??
          alternative.tripCost?.total ??
          alternative.tripCost?.breakdown?.total,
      );

      const matchedInterests = Array.isArray(alternative.matchedInterests)
        ? alternative.matchedInterests
        : [];

      return {
        ...alternative,
        estimatedCost,
        matchedInterests,
        estimatedSaving: roundCurrency(currentTotal - estimatedCost),
      };
    })
    .filter(
      (alternative) =>
        alternative.destinationId &&
        alternative.destinationId !== currentDestinationId &&
        Number.isFinite(alternative.estimatedCost) &&
        alternative.estimatedCost > 0 &&
        alternative.estimatedCost < currentTotal &&
        alternative.estimatedSaving >= minimumSaving,
    )
    .sort(
      (firstAlternative, secondAlternative) =>
        secondAlternative.estimatedSaving - firstAlternative.estimatedSaving,
    );

  const bestAlternative = suitableAlternatives[0];

  if (!bestAlternative) {
    return null;
  }

  const destinationName = bestAlternative.city
    ? `${bestAlternative.city}${
        bestAlternative.country ? `, ${bestAlternative.country}` : ""
      }`
    : "the alternative destination";

  const interestsText =
    bestAlternative.matchedInterests.length > 0
      ? ` It also matches ${bestAlternative.matchedInterests.join(", ")}.`
      : "";

  return createSuggestion({
    id: "alternative-destination",
    type: "alternative-destination",
    title: "Choose a lower-cost destination",
    description:
      `Consider ${destinationName}, with an estimated total cost of ` +
      `£${bestAlternative.estimatedCost.toLocaleString("en-GB")}.` +
      interestsText,
    estimatedSaving: bestAlternative.estimatedSaving,
    currentTotal,
    budget,
    actionLabel: "View alternative",
    priority: 4,
    metadata: {
      destinationId: bestAlternative.destinationId,
      city: bestAlternative.city || "",
      country: bestAlternative.country || "",
      matchedInterests: bestAlternative.matchedInterests,
      alternativeTotal: bestAlternative.estimatedCost,
    },
  });
}

function createCombinedPlan({ suggestions, currentTotal, budget }) {
  const applicableSuggestions = suggestions
    .filter((suggestion) => suggestion.type !== "alternative-destination")
    .sort(
      (firstSuggestion, secondSuggestion) =>
        firstSuggestion.priority - secondSuggestion.priority,
    );

  const selectedSuggestions = [];
  let estimatedSaving = 0;
  let updatedTotal = currentTotal;

  for (const suggestion of applicableSuggestions) {
    if (updatedTotal <= budget) {
      break;
    }

    selectedSuggestions.push(suggestion);
    estimatedSaving += suggestion.estimatedSaving;
    updatedTotal = Math.max(currentTotal - estimatedSaving, 0);
  }

  return {
    suggestionIds: selectedSuggestions.map((suggestion) => suggestion.id),

    estimatedSaving: roundCurrency(estimatedSaving),
    updatedTotal: roundCurrency(updatedTotal),

    reachesBudget:
      Number.isFinite(Number(budget)) &&
      Number(budget) > 0 &&
      updatedTotal <= Number(budget),
  };
}

export function getOptimisationSuggestions({
  tripCost = null,
  budgetStatus = null,
  budget = 0,
  destinationId = "",
  alternativeTrips = [],
  includeSuggestionsWithinBudget = false,
  costRules = mockCostRules,
} = {}) {
  const currentTotal = Number(tripCost?.total ?? tripCost?.breakdown?.total);

  const numericBudget = Number(budgetStatus?.budget ?? budget);

  const breakdown = tripCost?.breakdown || {};

  const hasValidData =
    Number.isFinite(currentTotal) &&
    currentTotal > 0 &&
    Number.isFinite(numericBudget) &&
    numericBudget > 0;

  if (!hasValidData) {
    return {
      shouldOptimise: false,
      currentTotal: 0,
      budget: 0,
      amountToSave: 0,
      suggestions: [],
      bestSuggestion: null,
      combinedPlan: {
        suggestionIds: [],
        estimatedSaving: 0,
        updatedTotal: 0,
        reachesBudget: false,
      },
    };
  }

  const amountToSave = roundCurrency(Math.max(currentTotal - numericBudget, 0));

  const shouldOptimise =
    includeSuggestionsWithinBudget || currentTotal > numericBudget;

  if (!shouldOptimise) {
    return {
      shouldOptimise: false,
      currentTotal: roundCurrency(currentTotal),
      budget: roundCurrency(numericBudget),
      amountToSave: 0,
      suggestions: [],
      bestSuggestion: null,
      combinedPlan: {
        suggestionIds: [],
        estimatedSaving: 0,
        updatedTotal: roundCurrency(currentTotal),
        reachesBudget: true,
      },
    };
  }

  const optimisationRules = costRules?.optimisationRules || {};

  const suggestions = [];

  const accommodationPercentage = Number(
    optimisationRules.accommodation?.estimatedSavingPercentage ?? 0,
  );

  const accommodationSaving = getPercentageValue(
    breakdown.accommodation,
    accommodationPercentage,
  );

  if (accommodationSaving > 0) {
    suggestions.push(
      createSuggestion({
        id: "cheaper-accommodation",
        type: "accommodation",
        title: "Choose a cheaper accommodation option",
        description:
          `Moving to a lower-cost accommodation option could reduce ` +
          `the accommodation cost by approximately ${accommodationPercentage}%.`,
        estimatedSaving: accommodationSaving,
        currentTotal,
        budget: numericBudget,
        actionLabel: "Use cheaper accommodation",
        priority: 1,
        metadata: {
          savingPercentage: accommodationPercentage,
          originalCategoryCost: roundCurrency(breakdown.accommodation),
        },
      }),
    );
  }

  const activitiesPercentage = Number(
    optimisationRules.activities?.estimatedSavingPercentage ?? 0,
  );

  const activitiesSaving = getPercentageValue(
    breakdown.activities,
    activitiesPercentage,
  );

  if (activitiesSaving > 0) {
    suggestions.push(
      createSuggestion({
        id: "free-activities",
        type: "activities",
        title: "Replace paid activities with free alternatives",
        description:
          `Using more free attractions, walking routes and public spaces ` +
          `could reduce the estimated activity cost by approximately ` +
          `${activitiesPercentage}%.`,
        estimatedSaving: activitiesSaving,
        currentTotal,
        budget: numericBudget,
        actionLabel: "Use more free activities",
        priority: 2,
        metadata: {
          savingPercentage: activitiesPercentage,
          originalCategoryCost: roundCurrency(breakdown.activities),
        },
      }),
    );
  }

  const travelMonthPercentage = Number(
    optimisationRules.travelMonth?.estimatedSavingPercentage ?? 0,
  );

  const seasonalMultiplier = Number(tripCost?.seasonalMultiplier ?? 1);

  const seasonSensitiveCost =
    Number(breakdown.flight || 0) + Number(breakdown.accommodation || 0);

  const travelMonthSaving =
    seasonalMultiplier > 1
      ? getPercentageValue(seasonSensitiveCost, travelMonthPercentage)
      : 0;

  if (travelMonthSaving > 0) {
    suggestions.push(
      createSuggestion({
        id: "different-travel-month",
        type: "travel-month",
        title: "Travel during a lower-cost month",
        description:
          `Your selected period uses a higher seasonal price level. ` +
          `Choosing a shoulder or low-season month could reduce flight ` +
          `and accommodation costs by approximately ` +
          `${travelMonthPercentage}%.`,
        estimatedSaving: travelMonthSaving,
        currentTotal,
        budget: numericBudget,
        actionLabel: "Change travel month",
        priority: 3,
        metadata: {
          savingPercentage: travelMonthPercentage,
          currentSeason: tripCost?.season || "",
          currentSeasonalMultiplier: seasonalMultiplier,
          affectedCategoryCost: roundCurrency(seasonSensitiveCost),
        },
      }),
    );
  }

  const minimumAlternativeSavingPercentage = Number(
    optimisationRules.alternativeDestination?.minimumSavingPercentage ?? 0,
  );

  const alternativeDestinationSuggestion = getAlternativeDestinationSuggestion({
    currentDestinationId: destinationId || tripCost?.destinationId || "",
    currentTotal,
    budget: numericBudget,
    alternativeTrips,
    minimumSavingPercentage: minimumAlternativeSavingPercentage,
  });

  if (alternativeDestinationSuggestion) {
    suggestions.push(alternativeDestinationSuggestion);
  }

  const sortedSuggestions = suggestions.sort(
    (firstSuggestion, secondSuggestion) =>
      firstSuggestion.priority - secondSuggestion.priority,
  );

  const bestSuggestion =
    [...sortedSuggestions].sort((firstSuggestion, secondSuggestion) => {
      if (firstSuggestion.reachesBudget !== secondSuggestion.reachesBudget) {
        return firstSuggestion.reachesBudget ? -1 : 1;
      }

      return secondSuggestion.estimatedSaving - firstSuggestion.estimatedSaving;
    })[0] || null;

  const combinedPlan = createCombinedPlan({
    suggestions: sortedSuggestions,
    currentTotal,
    budget: numericBudget,
  });

  return {
    shouldOptimise,
    currentTotal: roundCurrency(currentTotal),
    budget: roundCurrency(numericBudget),
    amountToSave,

    suggestions: sortedSuggestions,
    bestSuggestion,
    combinedPlan,
  };
}

export default getOptimisationSuggestions;
