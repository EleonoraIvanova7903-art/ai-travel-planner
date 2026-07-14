import { mockActivities } from "@/data/mockActivities";
import { mockCostRules } from "@/data/mockCostRules";
import { mockFlights } from "@/data/mockFlights";
import { mockHotels } from "@/data/mockHotels";
import { mockWeather } from "@/data/mockWeather";

function normaliseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalisePercentage(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function applyPercentageAdjustment(value, percentage) {
  const numericValue = Number(value);
  const numericPercentage = normalisePercentage(percentage);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const adjustedValue = numericValue * (1 + numericPercentage / 100);

  return roundCurrency(Math.max(adjustedValue, 0));
}

function getFlightOriginAirportCode(flight) {
  return (
    flight?.origin?.airportCode ||
    flight?.originAirportCode ||
    flight?.originAirport?.airportCode ||
    ""
  );
}

function getHotelNightlyPrice(hotel) {
  return Number(
    hotel?.nightlyPricePerRoom ??
      hotel?.nightlyPrice ??
      hotel?.pricePerNight ??
      0,
  );
}

function getHotelRoomCapacity(hotel) {
  return Number(
    hotel?.maximumGuestsPerRoom ??
      hotel?.maximumRoomCapacity ??
      hotel?.roomCapacity ??
      2,
  );
}

function getActivityPrice(activity) {
  return Number(
    activity?.estimatedCostPerTraveller ??
      activity?.estimatedCost ??
      activity?.costPerTraveller ??
      0,
  );
}

function getTierRule(ruleGroup, spendingTier) {
  if (!ruleGroup || typeof ruleGroup !== "object") {
    return 0;
  }

  const exactTierValue = ruleGroup[spendingTier];

  if (Number.isFinite(Number(exactTierValue))) {
    return Number(exactTierValue);
  }

  const normalisedTier = normaliseValue(spendingTier);

  const matchedEntry = Object.entries(ruleGroup).find(
    ([tier]) => normaliseValue(tier) === normalisedTier,
  );

  return Number(matchedEntry?.[1] || 0);
}

function getSelectedFlight({ destinationId, departureAirportCode, flights }) {
  return flights.find(
    (flight) =>
      flight.destinationId === destinationId &&
      normaliseValue(getFlightOriginAirportCode(flight)) ===
        normaliseValue(departureAirportCode),
  );
}

function getSelectedHotel({ destinationId, spendingTier, hotels }) {
  const destinationHotels = hotels.filter(
    (hotel) => hotel.destinationId === destinationId,
  );

  const exactTierHotel = destinationHotels.find(
    (hotel) => normaliseValue(hotel.tier) === normaliseValue(spendingTier),
  );

  if (exactTierHotel) {
    return exactTierHotel;
  }

  return destinationHotels
    .filter((hotel) => getHotelNightlyPrice(hotel) > 0)
    .sort(
      (firstHotel, secondHotel) =>
        getHotelNightlyPrice(firstHotel) - getHotelNightlyPrice(secondHotel),
    )[0];
}

function getWeatherDetails({
  destinationId,
  travelMonth,
  weatherProfiles,
  costRules,
  enableSeasonalAdjustment,
}) {
  const destinationWeather = weatherProfiles.find(
    (weather) => weather.destinationId === destinationId,
  );

  const monthWeather =
    destinationWeather?.monthlyWeather?.[travelMonth] || null;

  const season = normaliseValue(monthWeather?.season) || "shoulder";

  const configuredSeasonalMultiplier = Number(
    costRules?.seasonalPriceMultipliers?.[season] ?? 1,
  );

  const safeSeasonalMultiplier =
    Number.isFinite(configuredSeasonalMultiplier) &&
    configuredSeasonalMultiplier > 0
      ? configuredSeasonalMultiplier
      : 1;

  return {
    season,

    seasonalMultiplier: enableSeasonalAdjustment ? safeSeasonalMultiplier : 1,

    averageTemperatureC: monthWeather?.averageTemperatureC ?? null,

    weatherSummary: monthWeather?.weatherSummary || "",
  };
}

function getActivityDailyEstimate({
  destinationId,
  interests,
  spendingTier,
  activities,
  costRules,
}) {
  const destinationActivities = activities.filter(
    (activity) => activity.destinationId === destinationId,
  );

  const selectedInterests = Array.isArray(interests)
    ? interests.map(normaliseValue)
    : [];

  const matchingActivities =
    selectedInterests.length > 0
      ? destinationActivities.filter((activity) =>
          activity.interests?.some((interest) =>
            selectedInterests.includes(normaliseValue(interest)),
          ),
        )
      : destinationActivities;

  const activitiesForEstimate =
    matchingActivities.length > 0 ? matchingActivities : destinationActivities;

  const activityPrices = activitiesForEstimate
    .map(getActivityPrice)
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (activityPrices.length > 0) {
    const averageActivityPrice =
      activityPrices.reduce((total, price) => total + price, 0) /
      activityPrices.length;

    return roundCurrency(averageActivityPrice);
  }

  return getTierRule(
    costRules.activityEstimatePerDayPerTraveller,
    spendingTier,
  );
}

export function calculateTripCost({
  destinationId = "",
  departureAirportCode = "",
  travelMonth = "",
  duration = 0,
  travellers = 0,
  spendingTier = "Moderate",
  interests = [],
  flights = mockFlights,
  hotels = mockHotels,
  activities = mockActivities,
  weatherProfiles = mockWeather,
  costRules = mockCostRules,
  costSettings = null,
} = {}) {
  const durationDays = Number(duration);
  const travellerCount = Number(travellers);

  const hasRequiredInput =
    destinationId &&
    departureAirportCode &&
    travelMonth &&
    Number.isFinite(durationDays) &&
    durationDays > 0 &&
    Number.isFinite(travellerCount) &&
    travellerCount > 0;

  if (!hasRequiredInput) {
    return null;
  }

  const currency =
    typeof costSettings?.defaultCurrency === "string" &&
    costSettings.defaultCurrency.trim()
      ? costSettings.defaultCurrency.trim().toUpperCase()
      : "GBP";

  const enableSeasonalAdjustment =
    typeof costSettings?.enableSeasonalAdjustment === "boolean"
      ? costSettings.enableSeasonalAdjustment
      : true;

  const adjustmentPercentages = {
    general: normalisePercentage(costSettings?.costAdjustmentPercentage),

    flight: normalisePercentage(costSettings?.flightCostAdjustmentPercentage),

    accommodation: normalisePercentage(
      costSettings?.accommodationCostAdjustmentPercentage,
    ),

    food: normalisePercentage(costSettings?.foodCostAdjustmentPercentage),

    localTransport: normalisePercentage(
      costSettings?.localTransportCostAdjustmentPercentage,
    ),

    activities: normalisePercentage(
      costSettings?.activityCostAdjustmentPercentage,
    ),
  };

  const selectedFlight = getSelectedFlight({
    destinationId,
    departureAirportCode,
    flights,
  });

  const selectedHotel = getSelectedHotel({
    destinationId,
    spendingTier,
    hotels,
  });

  const weatherDetails = getWeatherDetails({
    destinationId,
    travelMonth,
    weatherProfiles,
    costRules,
    enableSeasonalAdjustment,
  });

  const missingData = [];

  if (!selectedFlight) {
    missingData.push("flight");
  }

  if (!selectedHotel) {
    missingData.push("accommodation");
  }

  const nights = Math.max(durationDays - 1, 1);

  const roomCapacity = Math.max(getHotelRoomCapacity(selectedHotel), 1);

  const rooms = Math.ceil(travellerCount / roomCapacity);

  const flightPricePerTraveller = Number(
    selectedFlight?.returnPricePerTraveller ??
      selectedFlight?.baseReturnPrice ??
      0,
  );

  const nightlyRoomPrice = getHotelNightlyPrice(selectedHotel);

  const baseFlightCost = roundCurrency(
    flightPricePerTraveller * travellerCount,
  );

  const baseAccommodationCost = roundCurrency(
    nightlyRoomPrice * nights * rooms,
  );

  const seasonalFlightCost = roundCurrency(
    baseFlightCost * weatherDetails.seasonalMultiplier,
  );

  const seasonalAccommodationCost = roundCurrency(
    baseAccommodationCost * weatherDetails.seasonalMultiplier,
  );

  const foodDailyRate = getTierRule(
    costRules.foodCostPerDayPerTraveller,
    spendingTier,
  );

  const localTransportDailyRate = getTierRule(
    costRules.localTransportCostPerDayPerTraveller,
    spendingTier,
  );

  const activityDailyEstimate = getActivityDailyEstimate({
    destinationId,
    interests,
    spendingTier,
    activities,
    costRules,
  });

  const baseFoodCost = roundCurrency(
    foodDailyRate * durationDays * travellerCount,
  );

  const baseLocalTransportCost = roundCurrency(
    localTransportDailyRate * durationDays * travellerCount,
  );

  const baseActivitiesCost = roundCurrency(
    activityDailyEstimate * durationDays * travellerCount,
  );

  const flightCost = applyPercentageAdjustment(
    seasonalFlightCost,
    adjustmentPercentages.flight,
  );

  const accommodationCost = applyPercentageAdjustment(
    seasonalAccommodationCost,
    adjustmentPercentages.accommodation,
  );

  const foodCost = applyPercentageAdjustment(
    baseFoodCost,
    adjustmentPercentages.food,
  );

  const localTransportCost = applyPercentageAdjustment(
    baseLocalTransportCost,
    adjustmentPercentages.localTransport,
  );

  const activitiesCost = applyPercentageAdjustment(
    baseActivitiesCost,
    adjustmentPercentages.activities,
  );

  const adjustedSubtotal = roundCurrency(
    flightCost +
      accommodationCost +
      foodCost +
      localTransportCost +
      activitiesCost,
  );

  const totalCost = applyPercentageAdjustment(
    adjustedSubtotal,
    adjustmentPercentages.general,
  );

  const generalAdjustmentAmount = roundCurrency(totalCost - adjustedSubtotal);

  return {
    currency,
    destinationId,
    departureAirportCode,
    travelMonth,
    durationDays,
    travellerCount,
    spendingTier,

    season: weatherDetails.season,
    seasonalMultiplier: weatherDetails.seasonalMultiplier,
    seasonalAdjustmentEnabled: enableSeasonalAdjustment,

    averageTemperatureC: weatherDetails.averageTemperatureC,
    weatherSummary: weatherDetails.weatherSummary,

    selectedFlight: selectedFlight || null,
    selectedHotel: selectedHotel || null,

    nights,
    rooms,
    roomCapacity,

    rates: {
      flightPricePerTraveller: roundCurrency(flightPricePerTraveller),
      nightlyRoomPrice: roundCurrency(nightlyRoomPrice),
      foodPerDayPerTraveller: roundCurrency(foodDailyRate),
      localTransportPerDayPerTraveller: roundCurrency(localTransportDailyRate),
      activitiesPerDayPerTraveller: roundCurrency(activityDailyEstimate),
    },

    adjustmentPercentages,

    breakdown: {
      flight: flightCost,
      accommodation: accommodationCost,
      food: foodCost,
      localTransport: localTransportCost,
      activities: activitiesCost,
      subtotal: adjustedSubtotal,
      generalAdjustment: generalAdjustmentAmount,
      total: totalCost,
    },

    total: totalCost,
    missingData,
    isComplete: missingData.length === 0,
  };
}

export default calculateTripCost;
