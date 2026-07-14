import { getGeminiClient } from "./aiClient";

export async function generateRecommendationExplanation({
  destination,
  budget,
  duration,
  travellers,
  interests = [],
}) {
  const ai = getGeminiClient();

  const interestsText =
    Array.isArray(interests) && interests.length > 0
      ? interests.join(", ")
      : "general sightseeing";

  const prompt = `
You are TravelMind AI, a travel planning assistant.

Explain why the following destination is suitable for the traveller.

Destination: ${destination}
Available budget: £${budget}
Trip duration: ${duration} days
Number of travellers: ${travellers}
Traveller interests: ${interestsText}

Write a clear and friendly explanation in English.
Use 2 or 3 short sentences.
Do not invent exact prices or information that was not provided.
`;

  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash",
    input: prompt,
    store: false,
  });

  return interaction.output_text.trim();
}
