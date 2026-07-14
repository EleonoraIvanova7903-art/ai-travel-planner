import { mockDestinations } from "@/data/mockDestinations";
import { calculateTripCost } from "@/logic/calculateTripCost";

const DEFAULT_RECOMMENDATION_RULES = Object.freeze({
  interestMatchWeight: 35,
  budgetFitWeight: 35,
  seasonMatchWeight: 20,
  valueForMoneyWeight: 10,
  featuredDestinations: [],
  minimumRecommendationCount: 3,
});

function normaliseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(Number(value), minimum), maximum);
}

function getValidNumber(value, fallbackValue) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallbackValue;
}

function formatCurrency(value, currency = "GBP") {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toLocaleString("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normaliseRecommendationRules(rules) {
  const preparedWeights = {
    interestMatchWeight: clamp(
      getValidNumber(
        rules?.interestMatchWeight,
        DEFAULT_RECOMMENDATION_RULES.interestMatchWeight,
      ),
      0,
      100,
    ),

    budgetFitWeight: clamp(
      getValidNumber(
        rules?.budgetFitWeight,
        DEFAULT_RECOMMENDATION_RULES.budgetFitWeight,
      ),
      0,
      100,
    ),

    seasonMatchWeight: clamp(
      getValidNumber(
        rules?.seasonMatchWeight,
        DEFAULT_RECOMMENDATION_RULES.seasonMatchWeight,
      ),
      0,
      100,
    ),

    valueForMoneyWeight: clamp(
      getValidNumber(
        rules?.valueForMoneyWeight,
        DEFAULT_RECOMMENDATION_RULES.valueForMoneyWeight,
      ),
      0,
      100,
    ),
  };

  const currentWeightTotal =
    preparedWeights.interestMatchWeight +
    preparedWeights.budgetFitWeight +
    preparedWeights.seasonMatchWeight +
    preparedWeights.valueForMoneyWeight;

  const fallbackWeightTotal =
    DEFAULT_RECOMMENDATION_RULES.interestMatchWeight +
    DEFAULT_RECOMMENDATION_RULES.budgetFitWeight +
    DEFAULT_RECOMMENDATION_RULES.seasonMatchWeight +
    DEFAULT_RECOMMENDATION_RULES.valueForMoneyWeight;

  const weights =
    currentWeightTotal > 0
      ? {
          interestMatchWeight:
            (preparedWeights.interestMatchWeight / currentWeightTotal) * 100,

          budgetFitWeight:
            (preparedWeights.budgetFitWeight / currentWeightTotal) * 100,

          seasonMatchWeight:
            (preparedWeights.seasonMatchWeight / currentWeightTotal) * 100,

          valueForMoneyWeight:
            (preparedWeights.valueForMoneyWeight / currentWeightTotal) * 100,
        }
      : {
          interestMatchWeight:
            (DEFAULT_RECOMMENDATION_RULES.interestMatchWeight /
              fallbackWeightTotal) *
            100,

          budgetFitWeight:
            (DEFAULT_RECOMMENDATION_RULES.budgetFitWeight /
              fallbackWeightTotal) *
            100,

          seasonMatchWeight:
            (DEFAULT_RECOMMENDATION_RULES.seasonMatchWeight /
              fallbackWeightTotal) *
            100,

          valueForMoneyWeight:
            (DEFAULT_RECOMMENDATION_RULES.valueForMoneyWeight /
              fallbackWeightTotal) *
            100,
        };

  const featuredDestinations = Array.isArray(rules?.featuredDestinations)
    ? [...new Set(rules.featuredDestinations)]
    : DEFAULT_RECOMMENDATION_RULES.featuredDestinations;

  const minimumRecommendationCount = Math.max(
    1,
    Math.round(
      getValidNumber(
        rules?.minimumRecommendationCount,
        DEFAULT_RECOMMENDATION_RULES.minimumRecommendationCount,
      ),
    ),
  );

  return {
    ...weights,
    featuredDestinations,
    minimumRecommendationCount,
  };
}

function getMatchedInterests(destinationInterests, selectedInterests) {
  const normalisedDestinationInterests = Array.isArray(destinationInterests)
    ? destinationInterests.map(normaliseValue)
    : [];

  return Array.isArray(selectedInterests)
    ? selectedInterests.filter((interest) =>
        normalisedDestinationInterests.includes(normaliseValue(interest)),
      )
    : [];
}

function getDurationCompatibility(destination, duration) {
  const minimumDuration = Number(destination.minimumDurationDays);
  const maximumDuration = Number(destination.maximumDurationDays);
  const selectedDuration = Number(duration);

  if (
    !Number.isFinite(selectedDuration) ||
    !Number.isFinite(minimumDuration) ||
    !Number.isFinite(maximumDuration)
  ) {
    return {
      isSuitable: false,
      compatibilityScore: 0,
    };
  }

  if (
    selectedDuration >= minimumDuration &&
    selectedDuration <= maximumDuration
  ) {
    return {
      isSuitable: true,
      compatibilityScore: 1,
    };
  }

  const isOneDayOutsideRange =
    selectedDuration === minimumDuration - 1 ||
    selectedDuration === maximumDuration + 1;

  return {
    isSuitable: false,
    compatibilityScore: isOneDayOutsideRange ? 0.5 : 0,
  };
}

function getBudgetFitRatio({ budget, estimatedCost, isComplete }) {
  const numericBudget = Number(budget);
  const numericEstimatedCost = Number(estimatedCost);

  if (
    !isComplete ||
    !Number.isFinite(numericBudget) ||
    numericBudget <= 0 ||
    !Number.isFinite(numericEstimatedCost) ||
    numericEstimatedCost < 0
  ) {
    return 0;
  }

  if (numericEstimatedCost <= numericBudget) {
    return 1;
  }

  return clamp(numericBudget / numericEstimatedCost, 0, 1);
}

function getValueForMoneyRatio({
  estimatedCost,
  minimumCompleteEstimatedCost,
  isComplete,
}) {
  const numericEstimatedCost = Number(estimatedCost);
  const numericMinimumCost = Number(minimumCompleteEstimatedCost);

  if (
    !isComplete ||
    !Number.isFinite(numericEstimatedCost) ||
    numericEstimatedCost <= 0 ||
    !Number.isFinite(numericMinimumCost) ||
    numericMinimumCost <= 0
  ) {
    return 0;
  }

  return clamp(numericMinimumCost / numericEstimatedCost, 0, 1);
}

function createMatchReasons({
  destination,
  matchedInterests,
  selectedInterests,
  travelMonth,
  duration,
  spendingTier,
  isBestMonth,
  isDurationSuitable,
  isSpendingTierSupported,
  estimatedCost,
  currency,
  budget,
  budgetFitRatio,
  valueForMoneyRatio,
  isCompleteEstimate,
}) {
  const reasons = [];

  if (selectedInterests.length > 0 && matchedInterests.length > 0) {
    reasons.push(
      `Matches ${matchedInterests.length} of your selected interests: ${matchedInterests.join(
        ", ",
      )}.`,
    );
  }

  if (travelMonth && isBestMonth) {
    reasons.push(`${travelMonth} is one of the recommended months to visit.`);
  }

  if (
    isCompleteEstimate &&
    Number.isFinite(Number(estimatedCost)) &&
    Number.isFinite(Number(budget))
  ) {
    if (budgetFitRatio === 1) {
      reasons.push(
        `The estimated trip cost of ${formatCurrency(
          estimatedCost,
          currency,
        )} is within your available budget.`,
      );
    } else {
      reasons.push(
        `The estimated trip cost is above the current budget, but it remains part of the comparison.`,
      );
    }
  }

  if (valueForMoneyRatio >= 0.8) {
    reasons.push(
      "Offers strong value compared with the other available destinations.",
    );
  }

  if (isDurationSuitable) {
    reasons.push(`Suitable for your planned ${duration}-day trip.`);
  }

  if (spendingTier && isSpendingTierSupported) {
    reasons.push(`Supports your selected ${spendingTier} spending style.`);
  }

  if (reasons.length === 0) {
    reasons.push(destination.shortDescription);
  }

  return reasons;
}

export function getDestinationRecommendations({
  destinations = mockDestinations,
  budget = "",
  interests = [],
  travelMonth = "",
  duration = 3,
  travellers = 1,
  departureAirportCode = "",
  spendingTier = "Moderate",
  costSettings = null,
  recommendationRules = null,
  limit = null,
} = {}) {
  const selectedInterests = Array.isArray(interests) ? interests : [];

  const numericBudget = Number(budget);
  const numericDuration = Number(duration);
  const numericTravellers = Number(travellers);

  const normalisedTravelMonth = normaliseValue(travelMonth);
  const normalisedSpendingTier = normaliseValue(spendingTier);

  const preparedRules = normaliseRecommendationRules(recommendationRules);

  const featuredDestinationIds = new Set(preparedRules.featuredDestinations);

  const preparedDestinations = destinations.map((destination) => {
    const destinationInterests = Array.isArray(destination.interests)
      ? destination.interests
      : [];

    const bestMonths = Array.isArray(destination.bestMonths)
      ? destination.bestMonths
      : [];

    const supportedSpendingTiers = Array.isArray(
      destination.supportedSpendingTiers,
    )
      ? destination.supportedSpendingTiers
      : [];

    const matchedInterests = getMatchedInterests(
      destinationInterests,
      selectedInterests,
    );

    const interestMatchRatio =
      selectedInterests.length > 0
        ? matchedInterests.length / selectedInterests.length
        : 0;

    const isBestMonth =
      Boolean(normalisedTravelMonth) &&
      bestMonths.some(
        (month) => normaliseValue(month) === normalisedTravelMonth,
      );

    const { isSuitable: isDurationSuitable, compatibilityScore } =
      getDurationCompatibility(destination, numericDuration);

    const isSpendingTierSupported =
      Boolean(normalisedSpendingTier) &&
      supportedSpendingTiers.some(
        (tier) => normaliseValue(tier) === normalisedSpendingTier,
      );

    const tripCost = calculateTripCost({
      destinationId: destination.destinationId,
      departureAirportCode,
      travelMonth,
      duration: numericDuration,
      travellers: numericTravellers,
      spendingTier,
      interests: selectedInterests,
      costSettings,
    });

    const estimatedCost = Number(tripCost?.total);

    const isCompleteEstimate =
      Boolean(tripCost?.isComplete) &&
      Number.isFinite(estimatedCost) &&
      estimatedCost >= 0;

    return {
      destination,
      matchedInterests,
      interestMatchRatio,
      isBestMonth,
      isDurationSuitable,
      durationCompatibilityScore: compatibilityScore,
      isSpendingTierSupported,
      tripCost,
      estimatedCost: isCompleteEstimate ? estimatedCost : null,
      isCompleteEstimate,
      isFeatured: featuredDestinationIds.has(destination.destinationId),
    };
  });

  const completeEstimatedCosts = preparedDestinations
    .filter((item) => item.isCompleteEstimate)
    .map((item) => item.estimatedCost)
    .filter((estimatedCost) => Number.isFinite(estimatedCost));

  const minimumCompleteEstimatedCost =
    completeEstimatedCosts.length > 0
      ? Math.min(...completeEstimatedCosts)
      : null;

  const rankedDestinations = preparedDestinations.map((item) => {
    const budgetFitRatio = getBudgetFitRatio({
      budget: numericBudget,
      estimatedCost: item.estimatedCost,
      isComplete: item.isCompleteEstimate,
    });

    const valueForMoneyRatio = getValueForMoneyRatio({
      estimatedCost: item.estimatedCost,
      minimumCompleteEstimatedCost,
      isComplete: item.isCompleteEstimate,
    });

    const seasonMatchRatio = item.isBestMonth ? 1 : 0;

    const weightedInterestScore =
      item.interestMatchRatio * preparedRules.interestMatchWeight;

    const weightedBudgetFitScore =
      budgetFitRatio * preparedRules.budgetFitWeight;

    const weightedSeasonScore =
      seasonMatchRatio * preparedRules.seasonMatchWeight;

    const weightedValueForMoneyScore =
      valueForMoneyRatio * preparedRules.valueForMoneyWeight;

    const earnedScore =
      weightedInterestScore +
      weightedBudgetFitScore +
      weightedSeasonScore +
      weightedValueForMoneyScore;

    const matchPercentage = Math.round(clamp(earnedScore, 0, 100));

    const currency = item.tripCost?.currency || "GBP";

    const matchReasons = createMatchReasons({
      destination: item.destination,
      matchedInterests: item.matchedInterests,
      selectedInterests,
      travelMonth,
      duration: numericDuration,
      spendingTier,
      isBestMonth: item.isBestMonth,
      isDurationSuitable: item.isDurationSuitable,
      isSpendingTierSupported: item.isSpendingTierSupported,
      estimatedCost: item.estimatedCost,
      currency,
      budget: numericBudget,
      budgetFitRatio,
      valueForMoneyRatio,
      isCompleteEstimate: item.isCompleteEstimate,
    });

    return {
      ...item.destination,

      matchScore: Number(earnedScore.toFixed(2)),
      matchPercentage,

      matchedInterests: item.matchedInterests,
      matchReasons,

      isBestMonth: item.isBestMonth,
      isDurationSuitable: item.isDurationSuitable,
      isSpendingTierSupported: item.isSpendingTierSupported,

      isFeatured: item.isFeatured,

      estimatedCost: item.estimatedCost,
      estimatedTripCost: item.tripCost,

      budgetFitPercentage: Math.round(budgetFitRatio * 100),
      valueForMoneyPercentage: Math.round(valueForMoneyRatio * 100),

      isWithinBudget:
        item.isCompleteEstimate &&
        Number.isFinite(numericBudget) &&
        numericBudget > 0 &&
        item.estimatedCost <= numericBudget,

      scoreBreakdown: {
        interestMatchPercentage: Math.round(item.interestMatchRatio * 100),

        budgetFitPercentage: Math.round(budgetFitRatio * 100),

        seasonMatchPercentage: Math.round(seasonMatchRatio * 100),

        valueForMoneyPercentage: Math.round(valueForMoneyRatio * 100),

        weightedInterestScore: Number(weightedInterestScore.toFixed(2)),

        weightedBudgetFitScore: Number(weightedBudgetFitScore.toFixed(2)),

        weightedSeasonScore: Number(weightedSeasonScore.toFixed(2)),

        weightedValueForMoneyScore: Number(
          weightedValueForMoneyScore.toFixed(2),
        ),
      },

      recommendationContext: {
        budget:
          Number.isFinite(numericBudget) && numericBudget > 0
            ? numericBudget
            : null,

        duration: numericDuration,
        travellers: numericTravellers,
        departureAirportCode,
        travelMonth,
        spendingTier,
        interests: selectedInterests,
        currency,
      },
    };
  });

  const requestedLimit = Number(limit);

  const recommendationLimit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : preparedRules.minimumRecommendationCount;

  return rankedDestinations
    .sort((firstDestination, secondDestination) => {
      if (secondDestination.matchScore !== firstDestination.matchScore) {
        return secondDestination.matchScore - firstDestination.matchScore;
      }

      if (secondDestination.isFeatured !== firstDestination.isFeatured) {
        return (
          Number(secondDestination.isFeatured) -
          Number(firstDestination.isFeatured)
        );
      }

      if (
        secondDestination.isDurationSuitable !==
        firstDestination.isDurationSuitable
      ) {
        return (
          Number(secondDestination.isDurationSuitable) -
          Number(firstDestination.isDurationSuitable)
        );
      }

      if (
        secondDestination.isSpendingTierSupported !==
        firstDestination.isSpendingTierSupported
      ) {
        return (
          Number(secondDestination.isSpendingTierSupported) -
          Number(firstDestination.isSpendingTierSupported)
        );
      }

      if (
        secondDestination.budgetFitPercentage !==
        firstDestination.budgetFitPercentage
      ) {
        return (
          secondDestination.budgetFitPercentage -
          firstDestination.budgetFitPercentage
        );
      }

      const firstEstimatedCost = Number(firstDestination.estimatedCost);
      const secondEstimatedCost = Number(secondDestination.estimatedCost);

      if (
        Number.isFinite(firstEstimatedCost) &&
        Number.isFinite(secondEstimatedCost) &&
        firstEstimatedCost !== secondEstimatedCost
      ) {
        return firstEstimatedCost - secondEstimatedCost;
      }

      if (
        secondDestination.matchedInterests.length !==
        firstDestination.matchedInterests.length
      ) {
        return (
          secondDestination.matchedInterests.length -
          firstDestination.matchedInterests.length
        );
      }

      return firstDestination.city.localeCompare(secondDestination.city);
    })
    .slice(0, Math.min(recommendationLimit, destinations.length))
    .map((destination, index) => ({
      ...destination,
      recommendationRank: index + 1,
    }));
}

export default getDestinationRecommendations;
