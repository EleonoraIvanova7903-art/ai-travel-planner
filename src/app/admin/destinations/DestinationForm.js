"use client";

import {
  FaFilter,
  FaMagnifyingGlass,
  FaRotateLeft,
  FaSliders,
} from "react-icons/fa6";
import styles from "./destinations.module.css";

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DestinationForm({
  filters,
  interestOptions = [],
  spendingTierOptions = [],
  resultCount = 0,
  totalCount = 0,
  onFilterChange,
  onReset,
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    if (typeof onFilterChange === "function") {
      onFilterChange({
        ...filters,
        [name]: value,
      });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
  }

  function handleReset() {
    if (typeof onReset === "function") {
      onReset();
    }
  }

  return (
    <section className={styles.filtersCard}>
      <div className={styles.filtersHeader}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-4">
          <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
            <span
              className={`${styles.filtersHeaderIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
              aria-hidden="true"
            >
              <FaSliders />
            </span>

            <div>
              <p className={`${styles.sectionLabel} mb-2`}>
                Catalogue controls
              </p>

              <h2 className={`${styles.filtersTitle} mb-2`}>
                Search and filter destinations
              </h2>

              <p className={`${styles.filtersText} mb-0`}>
                Find destinations by city, country, airport, interest, spending
                style or recommended travel month.
              </p>
            </div>
          </div>

          <span className={styles.resultBadge}>
            <FaFilter aria-hidden="true" />
            {resultCount} of {totalCount} destinations
          </span>
        </div>
      </div>

      <div className={styles.filtersBody}>
        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-xl-4">
              <div className={`${styles.filterGroup} h-100`}>
                <label
                  htmlFor="destination-search"
                  className={styles.filterLabel}
                >
                  Search catalogue
                </label>

                <div className="input-group">
                  <span className="input-group-text">
                    <FaMagnifyingGlass aria-hidden="true" />
                  </span>

                  <input
                    id="destination-search"
                    name="search"
                    type="search"
                    className="form-control"
                    placeholder="City, country, airport or ID"
                    value={filters.search}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-2">
              <div className={`${styles.filterGroup} h-100`}>
                <label
                  htmlFor="destination-interest"
                  className={styles.filterLabel}
                >
                  Interest
                </label>

                <select
                  id="destination-interest"
                  name="interest"
                  className="form-select"
                  value={filters.interest}
                  onChange={handleChange}
                >
                  <option value="">All interests</option>

                  {interestOptions.map((interest) => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-2">
              <div className={`${styles.filterGroup} h-100`}>
                <label
                  htmlFor="destination-spending-tier"
                  className={styles.filterLabel}
                >
                  Spending style
                </label>

                <select
                  id="destination-spending-tier"
                  name="spendingTier"
                  className="form-select"
                  value={filters.spendingTier}
                  onChange={handleChange}
                >
                  <option value="">All styles</option>

                  {spendingTierOptions.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-2">
              <div className={`${styles.filterGroup} h-100`}>
                <label
                  htmlFor="destination-month"
                  className={styles.filterLabel}
                >
                  Travel month
                </label>

                <select
                  id="destination-month"
                  name="month"
                  className="form-select"
                  value={filters.month}
                  onChange={handleChange}
                >
                  <option value="">All months</option>

                  {MONTH_OPTIONS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-2">
              <button
                type="button"
                className={`${styles.resetButton} btn w-100`}
                onClick={handleReset}
              >
                <FaRotateLeft className="me-2" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
