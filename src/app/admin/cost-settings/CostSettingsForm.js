"use client";

import {
  FaBed,
  FaBus,
  FaCalendarDays,
  FaCoins,
  FaFloppyDisk,
  FaPlane,
  FaTicket,
  FaUtensils,
  FaWallet,
} from "react-icons/fa6";
import styles from "./cost-settings.module.css";

const adjustmentFields = [
  {
    name: "flightCostAdjustmentPercentage",
    label: "Flight adjustment",
    description: "Percentage correction for estimated return flight costs.",
    icon: FaPlane,
  },
  {
    name: "accommodationCostAdjustmentPercentage",
    label: "Accommodation adjustment",
    description: "Percentage correction for estimated accommodation costs.",
    icon: FaBed,
  },
  {
    name: "foodCostAdjustmentPercentage",
    label: "Food adjustment",
    description: "Percentage correction for estimated food and dining costs.",
    icon: FaUtensils,
  },
  {
    name: "localTransportCostAdjustmentPercentage",
    label: "Local transport adjustment",
    description: "Percentage correction for local travel and transport costs.",
    icon: FaBus,
  },
  {
    name: "activityCostAdjustmentPercentage",
    label: "Activity adjustment",
    description: "Percentage correction for attractions and activity costs.",
    icon: FaTicket,
  },
];

export default function CostSettingsForm({
  formData,
  setFormData,
  isSaving,
  onSubmit,
}) {
  function handleNumberChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value === "" ? "" : Number(value),
    }));
  }

  function handleCurrencyChange(event) {
    setFormData((currentData) => ({
      ...currentData,
      defaultCurrency: event.target.value,
    }));
  }

  function handleSeasonalAdjustmentChange(event) {
    setFormData((currentData) => ({
      ...currentData,
      enableSeasonalAdjustment: event.target.checked,
    }));
  }

  return (
    <form onSubmit={onSubmit} aria-busy={isSaving}>
      <div className="row g-4">
        <div className="col-12">
          <section className={`card ${styles.formCard}`}>
            <div className="card-body p-4 p-lg-5">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <p className={`${styles.sectionLabel} mb-2`}>
                    General settings
                  </p>

                  <h2 className={`${styles.sectionTitle} mb-2`}>
                    Budget calculation defaults
                  </h2>

                  <p className={`${styles.sectionText} mb-0`}>
                    Set the default currency, overall cost adjustment and budget
                    warning level.
                  </p>
                </div>

                <span
                  className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
                  aria-hidden="true"
                >
                  <FaWallet />
                </span>
              </div>

              <div className="row g-4">
                <div className="col-12 col-lg-4">
                  <label
                    className={`${styles.fieldLabel} form-label`}
                    htmlFor="defaultCurrency"
                  >
                    Default currency
                  </label>

                  <select
                    id="defaultCurrency"
                    name="defaultCurrency"
                    className="form-select"
                    value={formData.defaultCurrency}
                    onChange={handleCurrencyChange}
                    disabled={isSaving}
                  >
                    <option value="GBP">GBP — British pound</option>
                  </select>

                  <p className={`${styles.helpText} mt-2 mb-0`}>
                    Travel cost data is currently maintained in GBP.
                  </p>
                </div>

                <div className="col-12 col-lg-4">
                  <label
                    className={`${styles.fieldLabel} form-label`}
                    htmlFor="costAdjustmentPercentage"
                  >
                    General cost adjustment
                  </label>

                  <div className="input-group">
                    <input
                      id="costAdjustmentPercentage"
                      name="costAdjustmentPercentage"
                      type="number"
                      className="form-control"
                      min="-100"
                      max="100"
                      step="1"
                      value={formData.costAdjustmentPercentage}
                      onChange={handleNumberChange}
                      disabled={isSaving}
                      required
                    />

                    <span className="input-group-text">%</span>
                  </div>

                  <p className={`${styles.helpText} mt-2 mb-0`}>
                    Sets an overall percentage correction for the final
                    estimated trip cost.
                  </p>
                </div>

                <div className="col-12 col-lg-4">
                  <label
                    className={`${styles.fieldLabel} form-label`}
                    htmlFor="budgetWarningThresholdPercentage"
                  >
                    Budget warning threshold
                  </label>

                  <div className="input-group">
                    <input
                      id="budgetWarningThresholdPercentage"
                      name="budgetWarningThresholdPercentage"
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.budgetWarningThresholdPercentage}
                      onChange={handleNumberChange}
                      disabled={isSaving}
                      required
                    />

                    <span className="input-group-text">%</span>
                  </div>

                  <p className={`${styles.helpText} mt-2 mb-0`}>
                    Sets the point at which a trip is treated as close to the
                    available budget.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="col-12">
          <section className={`card ${styles.formCard}`}>
            <div className="card-body p-4 p-lg-5">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <p className={`${styles.sectionLabel} mb-2`}>
                    Cost categories
                  </p>

                  <h2 className={`${styles.sectionTitle} mb-2`}>
                    Category adjustments
                  </h2>

                  <p className={`${styles.sectionText} mb-0`}>
                    Set an independent percentage correction for each travel
                    cost category.
                  </p>
                </div>

                <span
                  className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
                  aria-hidden="true"
                >
                  <FaCoins />
                </span>
              </div>

              <div className="row g-4">
                {adjustmentFields.map((field) => {
                  const FieldIcon = field.icon;

                  return (
                    <div key={field.name} className="col-12 col-md-6 col-xl-4">
                      <div className={`h-100 p-4 ${styles.settingCard}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.settingIcon} d-inline-flex align-items-center justify-content-center`}
                            aria-hidden="true"
                          >
                            <FieldIcon />
                          </span>

                          <div>
                            <label
                              className={`${styles.settingTitle} form-label mb-1`}
                              htmlFor={field.name}
                            >
                              {field.label}
                            </label>

                            <p className={`${styles.settingText} mb-0`}>
                              {field.description}
                            </p>
                          </div>
                        </div>

                        <div className="input-group">
                          <input
                            id={field.name}
                            name={field.name}
                            type="number"
                            className="form-control"
                            min="-100"
                            max="100"
                            step="1"
                            value={formData[field.name]}
                            onChange={handleNumberChange}
                            disabled={isSaving}
                            required
                          />

                          <span className="input-group-text">%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className="col-12">
          <section className={`card ${styles.formCard}`}>
            <div className="card-body p-4 p-lg-5">
              <div className={`p-4 ${styles.seasonalCard}`}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
                  <div className="d-flex align-items-start gap-3">
                    <span
                      className={`${styles.settingIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <FaCalendarDays />
                    </span>

                    <div>
                      <h2 className={`${styles.settingTitle} mb-2`}>
                        Seasonal price adjustment
                      </h2>

                      <p className={`${styles.settingText} mb-0`}>
                        Enable or disable the seasonal pricing rules used in
                        travel cost settings.
                      </p>
                    </div>
                  </div>

                  <div className="form-check form-switch m-0">
                    <input
                      id="enableSeasonalAdjustment"
                      name="enableSeasonalAdjustment"
                      type="checkbox"
                      className={`form-check-input ${styles.seasonalSwitch}`}
                      checked={formData.enableSeasonalAdjustment}
                      onChange={handleSeasonalAdjustmentChange}
                      disabled={isSaving}
                      role="switch"
                    />

                    <label
                      className="form-check-label fw-semibold ms-2"
                      htmlFor="enableSeasonalAdjustment"
                    >
                      {formData.enableSeasonalAdjustment
                        ? "Enabled"
                        : "Disabled"}
                    </label>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.formActions} d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mt-4`}
              >
                <p className={`${styles.saveNote} mb-0`}>
                  Saving updates the Cost Settings configuration.
                </p>

                <button
                  type="submit"
                  className="btn btn-dark px-4"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Saving settings...
                    </>
                  ) : (
                    <>
                      <FaFloppyDisk className="me-2" />
                      Save cost settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
