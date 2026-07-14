import { NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/aiClient";
import { generateRecommendationExplanation } from "@/ai/generateRecommendationExplanation";
import { generateBudgetAdvice } from "@/ai/generateBudgetAdvice";
import { generateItinerary } from "@/ai/generateItinerary";
import { refineItinerary } from "@/ai/refineItinerary";

function getGeminiErrorText(error) {
  return [
    error?.message,
    error?.body,
    error?.error?.message,
    error?.cause?.message,
    error?.cause?.error?.message,
  ]
    .filter(Boolean)
    .join(" ");
}

function getGeminiErrorStatus(error) {
  return Number(
    error?.status ||
      error?.statusCode ||
      error?.cause?.status ||
      error?.cause?.statusCode ||
      error?.error?.httpMeta?.response?.status ||
      500,
  );
}

function isGeminiRateLimitError(error) {
  const status = getGeminiErrorStatus(error);
  const errorText = getGeminiErrorText(error).toLowerCase();

  return (
    status === 429 ||
    errorText.includes("too_many_requests") ||
    errorText.includes("quota exceeded") ||
    errorText.includes("rate limit")
  );
}

function getGeminiRetrySeconds(error) {
  const errorText = getGeminiErrorText(error);
  const retryMatch = errorText.match(/retry in\s+([\d.]+)s/i);

  if (!retryMatch) {
    return null;
  }

  const retrySeconds = Math.ceil(Number(retryMatch[1]));

  return Number.isFinite(retrySeconds) && retrySeconds > 0
    ? retrySeconds
    : null;
}

function createGeminiErrorResponse(error, defaultMessage) {
  const errorText = getGeminiErrorText(error).toLowerCase();

  const isFreeTierQuotaExhausted =
    errorText.includes(
      "generativelanguage.googleapis.com/generate_content_free_tier_requests",
    ) ||
    (errorText.includes("quota exceeded") && errorText.includes("free tier"));

  if (isFreeTierQuotaExhausted) {
    return NextResponse.json(
      {
        success: false,
        errorCode: "GEMINI_DAILY_QUOTA_EXHAUSTED",
        message:
          "The Gemini free-tier daily request limit has been reached. AI generation is temporarily unavailable. Please try again after the next daily quota reset.",
      },
      { status: 429 },
    );
  }

  if (isGeminiRateLimitError(error)) {
    const retryAfterSeconds = getGeminiRetrySeconds(error);

    const message = retryAfterSeconds
      ? `Gemini is receiving too many requests at the moment. Please wait approximately ${retryAfterSeconds} seconds and try again.`
      : "Gemini is receiving too many requests at the moment. Please wait and try again.";

    const responseOptions = {
      status: 429,
    };

    if (retryAfterSeconds) {
      responseOptions.headers = {
        "Retry-After": String(retryAfterSeconds),
      };
    }

    return NextResponse.json(
      {
        success: false,
        errorCode: "GEMINI_RATE_LIMIT",
        message,
        retryAfterSeconds,
      },
      responseOptions,
    );
  }

  return NextResponse.json(
    {
      success: false,
      errorCode: "GEMINI_REQUEST_FAILED",
      message: defaultMessage,
    },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const ai = getGeminiClient();

    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input:
        "Reply with exactly this sentence: TravelMind AI Gemini connection works.",
      store: false,
    });

    return NextResponse.json({
      success: true,
      message: interaction.output_text,
    });
  } catch (error) {
    console.error("Gemini connection test failed:", error);

    return createGeminiErrorResponse(
      error,
      "The Gemini connection test failed.",
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const requestType = body.requestType || "recommendation-explanation";

    if (requestType === "itinerary-refinement") {
      const {
        existingItinerary,
        refinementRequest,
        destination,
        duration,
        travellers,
        budget,
        interests = [],
      } = body;

      if (
        !existingItinerary ||
        typeof existingItinerary !== "object" ||
        Array.isArray(existingItinerary) ||
        typeof refinementRequest !== "string" ||
        !refinementRequest.trim() ||
        !destination ||
        !duration ||
        !travellers ||
        budget === undefined ||
        budget === null ||
        budget === ""
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Existing itinerary, refinement instruction, destination, duration, number of travellers and budget are required.",
          },
          { status: 400 },
        );
      }

      const refinedItinerary = await refineItinerary({
        existingItinerary,
        refinementRequest: refinementRequest.trim(),
        destination,
        duration,
        travellers,
        budget,
        interests,
      });

      return NextResponse.json({
        success: true,
        itinerary: refinedItinerary,
      });
    }

    if (requestType === "itinerary") {
      const {
        destination,
        duration,
        travellers,
        budget,
        interests = [],
      } = body;

      if (
        !destination ||
        !duration ||
        !travellers ||
        budget === undefined ||
        budget === null ||
        budget === ""
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Destination, duration, number of travellers and budget are required.",
          },
          { status: 400 },
        );
      }

      const itinerary = await generateItinerary({
        destination,
        duration,
        travellers,
        budget,
        interests,
      });

      return NextResponse.json({
        success: true,
        itinerary,
      });
    }

    if (requestType === "budget-advice") {
      const {
        destination,
        budget,
        estimatedCost,
        budgetStatus,
        optimisationSuggestions = [],
      } = body;

      if (
        !destination ||
        budget === undefined ||
        budget === null ||
        budget === "" ||
        estimatedCost === undefined ||
        estimatedCost === null ||
        estimatedCost === "" ||
        !budgetStatus
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Destination, budget, estimated cost and budget status are required.",
          },
          { status: 400 },
        );
      }

      const advice = await generateBudgetAdvice({
        destination,
        budget,
        estimatedCost,
        budgetStatus,
        optimisationSuggestions,
      });

      return NextResponse.json({
        success: true,
        advice,
      });
    }

    if (requestType === "recommendation-explanation") {
      const {
        destination,
        budget,
        duration,
        travellers,
        interests = [],
      } = body;

      if (
        !destination ||
        budget === undefined ||
        budget === null ||
        budget === "" ||
        !duration ||
        !travellers
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Destination, budget, duration and number of travellers are required.",
          },
          { status: 400 },
        );
      }

      const explanation = await generateRecommendationExplanation({
        destination,
        budget,
        duration,
        travellers,
        interests,
      });

      return NextResponse.json({
        success: true,
        explanation,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unsupported Gemini request type.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Gemini request failed:", error);

    return createGeminiErrorResponse(
      error,
      "The Gemini response could not be generated.",
    );
  }
}
