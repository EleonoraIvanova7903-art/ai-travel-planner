"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const TRIP_PLANNER_STORAGE_KEY = "travelmind-trip-planner-state-v2";

const MAX_COMPARISON_DESTINATIONS = 3;

const initialTripPlannerData = {
  destination: "",
  budget: "",
  duration: 3,
  travellers: 1,
  travelMonth: "",
  departureAirportCode: "",
  spendingTier: "Moderate",
  interests: [],
};

const initialTripPlannerResults = {
  tripCost: null,
  budgetStatus: null,
  optimisationData: null,
  aiAdvice: [],
};

const TripPlannerContext = createContext(null);

function normaliseTripPlannerData(value) {
  if (!value || typeof value !== "object") {
    return { ...initialTripPlannerData };
  }

  return {
    ...initialTripPlannerData,
    ...value,

    interests: Array.isArray(value.interests) ? value.interests : [],
  };
}

function normaliseTripPlannerResults(value) {
  if (!value || typeof value !== "object") {
    return { ...initialTripPlannerResults };
  }

  return {
    ...initialTripPlannerResults,
    ...value,

    aiAdvice: Array.isArray(value.aiAdvice) ? value.aiAdvice : [],
  };
}

function normaliseComparisonDestinationIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((destinationId) => String(destinationId || "").trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_COMPARISON_DESTINATIONS);
}

export function TripPlannerProvider({ children }) {
  const [tripPlannerData, setTripPlannerData] = useState(
    initialTripPlannerData,
  );

  const [tripPlannerResults, setTripPlannerResults] = useState(
    initialTripPlannerResults,
  );

  const [comparisonDestinationIds, setComparisonDestinationIds] = useState([]);

  const [isTripPlannerHydrated, setIsTripPlannerHydrated] = useState(false);

  /*
    Loads the last Trip Planner state from the browser.
    This prevents the information from disappearing when
    the Traveller opens another page or refreshes the browser.
  */
  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(TRIP_PLANNER_STORAGE_KEY);

      if (!storedValue) {
        return;
      }

      const storedState = JSON.parse(storedValue);

      setTripPlannerData(normaliseTripPlannerData(storedState.tripPlannerData));

      setTripPlannerResults(
        normaliseTripPlannerResults(storedState.tripPlannerResults),
      );

      setComparisonDestinationIds(
        normaliseComparisonDestinationIds(storedState.comparisonDestinationIds),
      );
    } catch (error) {
      console.warn(
        "The saved Trip Planner information could not be loaded:",
        error,
      );

      window.localStorage.removeItem(TRIP_PLANNER_STORAGE_KEY);
    } finally {
      setIsTripPlannerHydrated(true);
    }
  }, []);

  /*
    Saves every change after the initial browser state
    has finished loading.
  */
  useEffect(() => {
    if (!isTripPlannerHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        TRIP_PLANNER_STORAGE_KEY,
        JSON.stringify({
          tripPlannerData,
          tripPlannerResults,
          comparisonDestinationIds,
        }),
      );
    } catch (error) {
      console.warn("The Trip Planner information could not be saved:", error);
    }
  }, [
    comparisonDestinationIds,
    isTripPlannerHydrated,
    tripPlannerData,
    tripPlannerResults,
  ]);

  function updateTripPlannerField(field, value) {
    setTripPlannerData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  function toggleTripInterest(interest) {
    setTripPlannerData((currentData) => {
      const currentInterests = Array.isArray(currentData.interests)
        ? currentData.interests
        : [];

      const interestIsSelected = currentInterests.includes(interest);

      return {
        ...currentData,

        interests: interestIsSelected
          ? currentInterests.filter(
              (selectedInterest) => selectedInterest !== interest,
            )
          : [...currentInterests, interest],
      };
    });
  }

  function toggleComparisonDestination(destinationId) {
    const preparedDestinationId = String(destinationId || "").trim();

    if (!preparedDestinationId) {
      return;
    }

    setComparisonDestinationIds((currentIds) => {
      const preparedCurrentIds = Array.isArray(currentIds) ? currentIds : [];

      const destinationAlreadyIncluded = preparedCurrentIds.includes(
        preparedDestinationId,
      );

      if (destinationAlreadyIncluded) {
        return preparedCurrentIds.filter(
          (currentId) => currentId !== preparedDestinationId,
        );
      }

      if (preparedCurrentIds.length >= MAX_COMPARISON_DESTINATIONS) {
        return preparedCurrentIds;
      }

      return [...preparedCurrentIds, preparedDestinationId];
    });
  }

  function addComparisonDestination(destinationId) {
    const preparedDestinationId = String(destinationId || "").trim();

    if (!preparedDestinationId) {
      return;
    }

    setComparisonDestinationIds((currentIds) => {
      const preparedCurrentIds = Array.isArray(currentIds) ? currentIds : [];

      if (preparedCurrentIds.includes(preparedDestinationId)) {
        return preparedCurrentIds;
      }

      if (preparedCurrentIds.length >= MAX_COMPARISON_DESTINATIONS) {
        return preparedCurrentIds;
      }

      return [...preparedCurrentIds, preparedDestinationId];
    });
  }

  function removeComparisonDestination(destinationId) {
    const preparedDestinationId = String(destinationId || "").trim();

    setComparisonDestinationIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== preparedDestinationId),
    );
  }

  function clearComparisonDestinations() {
    setComparisonDestinationIds([]);
  }

  function resetTripPlannerResults() {
    setTripPlannerResults({
      tripCost: null,
      budgetStatus: null,
      optimisationData: null,
      aiAdvice: [],
    });
  }

  function resetTripPlannerData() {
    setTripPlannerData({
      destination: "",
      budget: "",
      duration: 3,
      travellers: 1,
      travelMonth: "",
      departureAirportCode: "",
      spendingTier: "Moderate",
      interests: [],
    });

    setTripPlannerResults({
      tripCost: null,
      budgetStatus: null,
      optimisationData: null,
      aiAdvice: [],
    });

    setComparisonDestinationIds([]);
  }

  const contextValue = useMemo(
    () => ({
      tripPlannerData,
      tripPlannerResults,
      comparisonDestinationIds,
      isTripPlannerHydrated,

      setTripPlannerData,
      setTripPlannerResults,
      setComparisonDestinationIds,

      updateTripPlannerField,
      toggleTripInterest,

      toggleComparisonDestination,
      addComparisonDestination,
      removeComparisonDestination,
      clearComparisonDestinations,

      resetTripPlannerResults,
      resetTripPlannerData,
    }),
    [
      comparisonDestinationIds,
      isTripPlannerHydrated,
      tripPlannerData,
      tripPlannerResults,
    ],
  );

  return (
    <TripPlannerContext.Provider value={contextValue}>
      {children}
    </TripPlannerContext.Provider>
  );
}

export function useTripPlanner() {
  const context = useContext(TripPlannerContext);

  if (!context) {
    throw new Error("useTripPlanner must be used inside TripPlannerProvider.");
  }

  return context;
}
