const adminSettingsData = [
  {
    documentId: "cost-settings",

    data: {
      defaultCurrency: "GBP",

      costAdjustmentPercentage: 5,

      flightCostAdjustmentPercentage: 3,
      accommodationCostAdjustmentPercentage: 5,
      foodCostAdjustmentPercentage: 2,
      localTransportCostAdjustmentPercentage: 0,
      activityCostAdjustmentPercentage: 4,

      budgetWarningThresholdPercentage: 90,

      enableSeasonalAdjustment: true,

      updatedBy: "system-seed",

      updatedAt: new Date("2026-07-10T12:00:00.000Z"),
    },
  },

  {
    documentId: "recommendation-rules",

    data: {
      interestMatchWeight: 35,
      budgetFitWeight: 35,
      seasonMatchWeight: 20,
      valueForMoneyWeight: 10,

      featuredDestinations: [
        "lisbon-portugal",
        "malaga-spain",
        "prague-czech-republic",
      ],

      minimumRecommendationCount: 3,

      updatedBy: "system-seed",

      updatedAt: new Date("2026-07-10T12:00:00.000Z"),
    },
  },
];

module.exports = {
  adminSettingsData,
};
