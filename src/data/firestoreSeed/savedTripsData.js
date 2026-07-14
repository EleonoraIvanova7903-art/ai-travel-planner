const savedTripsData = [
  {
    documentId: "demo-lisbon-trip-001",

    data: {
      userId: "demo-user-001",

      tripName: "Lisbon Culture and Food Escape",

      origin: {
        city: "Manchester",
        country: "United Kingdom",
        airportCode: "MAN",
      },

      destination: {
        destinationId: "lisbon-portugal",
        city: "Lisbon",
        country: "Portugal",
      },

      startDate: new Date("2026-09-14T00:00:00.000Z"),
      endDate: new Date("2026-09-18T00:00:00.000Z"),

      durationDays: 5,
      travelMonth: "September",
      numberOfTravellers: 2,
      spendingTier: "Moderate",

      interests: ["Culture", "Food", "History", "Sightseeing"],

      optionalPreferences: {
        accommodationType: "Hotel",
        dietaryPreferences: "No special requirements",
        accessibilityNeeds: "None",
      },

      budget: {
        currency: "GBP",
        maximumTotal: 1800,
      },

      costBreakdown: {
        flights: 320,
        accommodation: 600,
        food: 250,
        localTransport: 100,
        activities: 180,
        total: 1450,
      },

      budgetStatus: "within-budget",
      remainingBudget: 350,

      optimisationSuggestions: [
        {
          type: "accommodation",
          title: "Choose a three-star hotel",
          description:
            "A three-star hotel outside the city centre could reduce the accommodation cost.",
          estimatedSaving: 120,
        },
        {
          type: "activities",
          title: "Include more free attractions",
          description:
            "Replace one paid activity with free viewpoints and walking routes.",
          estimatedSaving: 35,
        },
      ],

      itinerary: [
        {
          dayNumber: 1,
          morning: "Arrival and hotel check-in",
          afternoon: "Walk through Baixa and Praca do Comercio",
          evening: "Traditional Portuguese dinner",
          estimatedDailyCost: 80,
        },
        {
          dayNumber: 2,
          morning: "Visit Belem Tower",
          afternoon: "Explore Jeronimos Monastery",
          evening: "Riverside walk in Belem",
          estimatedDailyCost: 70,
        },
        {
          dayNumber: 3,
          morning: "Explore Alfama",
          afternoon: "Visit Sao Jorge Castle",
          evening: "Attend a traditional music performance",
          estimatedDailyCost: 95,
        },
        {
          dayNumber: 4,
          morning: "Day trip to Sintra",
          afternoon: "Visit Pena Palace",
          evening: "Return to Lisbon",
          estimatedDailyCost: 120,
        },
        {
          dayNumber: 5,
          morning: "Visit the city food market",
          afternoon: "Final city walk and departure",
          evening: "Return flight",
          estimatedDailyCost: 65,
        },
      ],

      aiExplanation:
        "Lisbon is a strong match because it combines culture, history and food experiences while remaining within the selected budget. September also offers suitable weather and good value for a five-day trip.",

      createdAt: new Date("2026-07-10T12:00:00.000Z"),
      updatedAt: new Date("2026-07-10T12:00:00.000Z"),
    },
  },
];

module.exports = {
  savedTripsData,
};
