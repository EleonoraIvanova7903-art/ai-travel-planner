import { getGeminiClient } from "./aiClient";

export async function generateBudgetAdvice({
  destination,
  budget,
  estimatedCost,
  budgetStatus,
  optimisationSuggestions = [],
}) {
  const ai = getGeminiClient();

  const suggestionsText =
    Array.isArray(optimisationSuggestions) && optimisationSuggestions.length > 0
      ? optimisationSuggestions.join("; ")
      : "No existing optimisation suggestions were provided.";

  const prompt = `
Destination: ${destination}
Available budget: £${budget}
Estimated trip cost: £${estimatedCost}
Budget status: ${budgetStatus}
Existing optimisation suggestions: ${suggestionsText}

Provide three short and practical budget recommendations in English.

Requirements:
- Use only the supplied budget and estimated cost.
- Do not invent additional prices.
- Keep the recommendations suitable for a student travel-planning project.
- Write each recommendation on a separate line.
- Do not include a title or introduction.
`;

  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash",
    system_instruction:
      "You are TravelMind AI, a helpful travel budget planning assistant.",
    input: prompt,
    store: false,
  });

  return interaction.output_text.trim();
}
