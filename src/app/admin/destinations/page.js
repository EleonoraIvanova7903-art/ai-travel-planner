"use client";

import { useMemo, useState } from "react";
import {
  FaEarthEurope,
  FaLocationDot,
  FaPlane,
  FaTags,
  FaWallet,
} from "react-icons/fa6";
import { mockDestinations } from "@/data/mockDestinations";
import AdminLayout from "../../../shared/layout/AdminLayout";
import DestinationForm from "./DestinationForm";
import DestinationTable from "./DestinationTable";
import styles from "./destinations.module.css";

const DEFAULT_FILTERS = Object.freeze({
  search: "",
  interest: "",
  spendingTier: "",
  month: "",
});

function normaliseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getUniqueSortedValues(values) {
  return [...new Set(values.filter(Boolean))].sort((firstValue, secondValue) =>
    firstValue.localeCompare(secondValue),
  );
}

export default function AdminDestinationsPage() {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
  });

  const interestOptions = useMemo(
    () =>
      getUniqueSortedValues(
        mockDestinations.flatMap((destination) =>
          Array.isArray(destination.interests) ? destination.interests : [],
        ),
      ),
    [],
  );

  const spendingTierOptions = useMemo(
    () =>
      getUniqueSortedValues(
        mockDestinations.flatMap((destination) =>
          Array.isArray(destination.supportedSpendingTiers)
            ? destination.supportedSpendingTiers
            : [],
        ),
      ),
    [],
  );

  const filteredDestinations = useMemo(() => {
    const searchTerm = normaliseValue(filters.search);

    return mockDestinations
      .filter((destination) => {
        const destinationText = [
          destination.destinationId,
          destination.city,
          destination.country,
          destination.airportCode,
          destination.shortDescription,
        ]
          .map(normaliseValue)
          .join(" ");

        const interests = Array.isArray(destination.interests)
          ? destination.interests.map(normaliseValue)
          : [];

        const spendingTiers = Array.isArray(destination.supportedSpendingTiers)
          ? destination.supportedSpendingTiers.map(normaliseValue)
          : [];

        const bestMonths = Array.isArray(destination.bestMonths)
          ? destination.bestMonths.map(normaliseValue)
          : [];

        const matchesSearch =
          !searchTerm || destinationText.includes(searchTerm);

        const matchesInterest =
          !filters.interest ||
          interests.includes(normaliseValue(filters.interest));

        const matchesSpendingTier =
          !filters.spendingTier ||
          spendingTiers.includes(normaliseValue(filters.spendingTier));

        const matchesMonth =
          !filters.month || bestMonths.includes(normaliseValue(filters.month));

        return (
          matchesSearch &&
          matchesInterest &&
          matchesSpendingTier &&
          matchesMonth
        );
      })
      .sort((firstDestination, secondDestination) =>
        firstDestination.city.localeCompare(secondDestination.city),
      );
  }, [filters]);

  const airportCount = useMemo(
    () =>
      new Set(
        mockDestinations
          .map((destination) => String(destination.airportCode || "").trim())
          .filter(Boolean),
      ).size,
    [],
  );

  const summaryCards = [
    {
      id: "destinations",
      label: "Destinations",
      value: mockDestinations.length,
      description: "Available travel profiles",
      icon: FaEarthEurope,
    },
    {
      id: "airports",
      label: "Airports",
      value: airportCount,
      description: "Destination airport codes",
      icon: FaPlane,
    },
    {
      id: "interests",
      label: "Interest categories",
      value: interestOptions.length,
      description: "Available matching interests",
      icon: FaTags,
    },
    {
      id: "spending-tiers",
      label: "Spending styles",
      value: spendingTierOptions.length,
      description: "Supported travel budgets",
      icon: FaWallet,
    },
  ];

  function handleFilterChange(nextFilters) {
    setFilters(nextFilters);
  }

  function handleResetFilters() {
    setFilters({
      ...DEFAULT_FILTERS,
    });
  }

  return (
    <AdminLayout
      pageTitle="Destinations"
      pageDescription="Review and filter the destination catalogue available across TravelMind AI."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        <section className={`${styles.pageIntro} mb-4`}>
          <div className="row g-4 align-items-center">
            <div className="col-12 col-xl-8">
              <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                <span
                  className={`${styles.pageIntroIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                  aria-hidden="true"
                >
                  <FaLocationDot />
                </span>

                <div>
                  <p className={`${styles.pageIntroLabel} mb-2`}>
                    Destination catalogue
                  </p>

                  <h2 className={`${styles.pageIntroTitle} mb-3`}>
                    Manage the available travel profiles
                  </h2>

                  <p className={`${styles.pageIntroText} mb-0`}>
                    Review destination information, airport codes, travel
                    interests, preferred months and supported spending styles
                    available to Travellers.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className={styles.pageIntroSummary}>
                <span>Catalogue coverage</span>

                <strong>{mockDestinations.length} destinations</strong>

                <p>
                  Profiles can be searched and filtered without changing the
                  underlying destination information.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="row g-4 mb-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.id} className="col-12 col-sm-6 col-xl-3">
                <section className={`${styles.summaryCard} h-100`}>
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <p className={styles.summaryLabel}>{card.label}</p>

                      <h2 className={styles.summaryValue}>{card.value}</h2>

                      <p className={styles.summaryText}>{card.description}</p>
                    </div>

                    <span
                      className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                  </div>
                </section>
              </div>
            );
          })}
        </div>

        <div className="mb-4">
          <DestinationForm
            filters={filters}
            interestOptions={interestOptions}
            spendingTierOptions={spendingTierOptions}
            resultCount={filteredDestinations.length}
            totalCount={mockDestinations.length}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        <DestinationTable
          destinations={filteredDestinations}
          onClearFilters={handleResetFilters}
        />
      </div>
    </AdminLayout>
  );
}
