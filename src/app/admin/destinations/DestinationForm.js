"use client";

import { FaFilter, FaMagnifyingGlass, FaRotateLeft } from "react-icons/fa6";
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
    <section className={`card ${styles.filtersCard}`}>
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-3 mb-4">
          <div>
            <p className={styles.sectionLabel}>Catalogue controls</p>

            <h2 className="h4 fw-bold text-dark mb-2">
              Search and filter destinations
            </h2>

            <p className="text-secondary mb-0">
              Find destinations by location, airport, interest, spending style
              or recommended travel month.
            </p>
          </div>

          <span className={`badge rounded-pill ${styles.resultBadge}`}>
            <FaFilter className="me-2" />
            {resultCount} of {totalCount} destinations
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-xl-4">
              <label
                htmlFor="destination-search"
                className={styles.filterLabel}
              >
                Search
              </label>

              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaMagnifyingGlass />
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

            <div className="col-12 col-md-6 col-xl-2">
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

            <div className="col-12 col-md-6 col-xl-2">
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

            <div className="col-12 col-md-6 col-xl-2">
              <label htmlFor="destination-month" className={styles.filterLabel}>
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

            <div className="col-12 col-md-6 col-xl-2">
              <button
                type="button"
                className="btn btn-outline-dark w-100"
                onClick={handleReset}
              >
                <FaRotateLeft className="me-2" />
                Clear filters
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
