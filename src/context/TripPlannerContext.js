"use client";

import { createContext, useContext, useMemo, useState } from "react";

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

export function TripPlannerProvider({ children }) {
  const [tripPlannerData, setTripPlannerData] = useState(
    initialTripPlannerData,
  );

  const [tripPlannerResults, setTripPlannerResults] = useState(
    initialTripPlannerResults,
  );

  function updateTripPlannerField(field, value) {
    setTripPlannerData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  function toggleTripInterest(interest) {
    setTripPlannerData((currentData) => {
      const interestIsSelected = currentData.interests.includes(interest);

      return {
        ...currentData,
        interests: interestIsSelected
          ? currentData.interests.filter(
              (selectedInterest) => selectedInterest !== interest,
            )
          : [...currentData.interests, interest],
      };
    });
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

    resetTripPlannerResults();
  }

  const contextValue = useMemo(
    () => ({
      tripPlannerData,
      tripPlannerResults,
      setTripPlannerData,
      setTripPlannerResults,
      updateTripPlannerField,
      toggleTripInterest,
      resetTripPlannerResults,
      resetTripPlannerData,
    }),
    [tripPlannerData, tripPlannerResults],
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
