import { getGeminiClient } from "./aiClient";

export async function generateItinerary({
  destination,
  duration,
  travellers,
  budget,
  interests = [],
}) {
  const ai = getGeminiClient();

  const interestsText =
    Array.isArray(interests) && interests.length > 0
      ? interests.join(", ")
      : "general sightseeing";

  const itinerarySchema = {
    type: "object",
    properties: {
      destination: {
        type: "string",
        description: "The destination of the trip.",
      },
      summary: {
        type: "string",
        description: "A short overview of the travel itinerary.",
      },
      days: {
        type: "array",
        description: "The complete day-by-day travel itinerary.",
        items: {
          type: "object",
          properties: {
            day: {
              type: "integer",
              description: "The itinerary day number.",
            },
            title: {
              type: "string",
              description: "A short title describing the day.",
            },
            morning: {
              type: "string",
              description: "The suggested morning activity.",
            },
            afternoon: {
              type: "string",
              description: "The suggested afternoon activity.",
            },
            evening: {
              type: "string",
              description: "The suggested evening activity.",
            },
          },
          required: ["day", "title", "morning", "afternoon", "evening"],
        },
      },
    },
    required: ["destination", "summary", "days"],
  };

  const prompt = `
Create a ${duration}-day travel itinerary for the following trip.

Destination: ${destination}
Number of travellers: ${travellers}
Available budget: £${budget}
Traveller interests: ${interestsText}

Requirements:
- Create exactly ${duration} itinerary days.
- Include a morning, afternoon and evening activity for every day.
- Keep the suggestions realistic and suitable for the available budget.
- Do not invent exact prices.
- Write all content in clear English.
- Avoid repeating the same activities.
`;

  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash",
    system_instruction:
      "You are TravelMind AI, a practical travel itinerary planning assistant.",
    input: prompt,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: itinerarySchema,
    },
    store: false,
  });

  return JSON.parse(interaction.output_text);
}
