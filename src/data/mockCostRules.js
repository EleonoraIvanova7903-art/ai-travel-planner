// Static calculation assumptions required by the MVP.
// The project currency is read from Firestore adminSettings/cost-settings and is GBP.
// Editable admin percentages and recommendation weights are not duplicated here.

export const mockCostRules = {
  foodCostPerDayPerTraveller: {
    Budget: 18,
    Moderate: 25,
    Luxury: 45,
  },
  localTransportCostPerDayPerTraveller: {
    Budget: 6,
    Moderate: 10,
    Luxury: 22,
  },
  activityEstimatePerDayPerTraveller: {
    Budget: 10,
    Moderate: 18,
    Luxury: 35,
  },
  seasonalPriceMultipliers: {
    low: 0.9,
    shoulder: 1.0,
    high: 1.15,
  },
  optimisationRules: {
    accommodation: {
      type: "accommodation",
      estimatedSavingPercentage: 20,
    },
    activities: {
      type: "activities",
      estimatedSavingPercentage: 60,
    },
    travelMonth: {
      type: "travel-month",
      estimatedSavingPercentage: 15,
    },
    alternativeDestination: {
      type: "alternative-destination",
      minimumSavingPercentage: 15,
    },
  },
};

export default mockCostRules;
