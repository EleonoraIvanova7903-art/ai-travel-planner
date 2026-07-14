const aiLogsData = [
  {
    documentId: "demo-ai-log-001",

    data: {
      userId: "demo-user-001",
      tripId: "demo-lisbon-trip-001",

      promptType: "itinerary-generation",

      selectedDestination: {
        destinationId: "lisbon-portugal",
        city: "Lisbon",
        country: "Portugal",
      },

      requestSummary:
        "Generate a five-day itinerary focused on culture, food, history and sightseeing.",

      generatedContentType: "day-by-day-itinerary",

      status: "completed",

      createdAt: new Date("2026-07-10T12:05:00.000Z"),
    },
  },
];

module.exports = {
  aiLogsData,
};
