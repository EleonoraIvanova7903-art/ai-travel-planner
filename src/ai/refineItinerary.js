import { getGeminiClient } from "./aiClient";

export async function refineItinerary({
  existingItinerary,
  refinementRequest,
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
        description: "A short overview of the refined itinerary.",
      },
      days: {
        type: "array",
        description: "The complete refined day-by-day itinerary.",
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
Refine the existing travel itinerary according to the Traveller's instruction.

Destination: ${destination}
Trip duration: ${duration} days
Number of travellers: ${travellers}
Available budget: £${budget}
Traveller interests: ${interestsText}

Traveller refinement instruction:
${refinementRequest}

Existing itinerary:
${JSON.stringify(existingItinerary, null, 2)}

Requirements:
- Return the complete updated itinerary.
- Keep exactly ${duration} itinerary days.
- Keep a morning, afternoon and evening activity for every day.
- Apply the Traveller's instruction where appropriate.
- Preserve suitable parts of the existing itinerary.
- Keep all suggestions realistic for the supplied budget.
- Do not invent exact prices.
- Write all content in clear English.
- Avoid duplicate activities.
`;

  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash",
    system_instruction:
      "You are TravelMind AI, a practical travel itinerary refinement assistant.",
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
