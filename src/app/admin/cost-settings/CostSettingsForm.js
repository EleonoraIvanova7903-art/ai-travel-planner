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
          <section className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                <span
                  className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                  aria-hidden="true"
                >
                  <FaWallet />
                </span>

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
              </div>
            </div>

            <div className={styles.formCardBody}>
              <div className="row g-4">
                <div className="col-12 col-lg-4">
                  <div className={`${styles.fieldGroup} h-100`}>
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
                      All travel cost information is currently maintained in
                      GBP.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className={`${styles.fieldGroup} h-100`}>
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
                      Applies a final percentage correction to the complete
                      estimated trip cost.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className={`${styles.fieldGroup} h-100`}>
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
                      Determines when a trip is shown as approaching the
                      available Traveller budget.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="col-12">
          <section className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                <span
                  className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                  aria-hidden="true"
                >
                  <FaCoins />
                </span>

                <div>
                  <p className={`${styles.sectionLabel} mb-2`}>
                    Cost categories
                  </p>

                  <h2 className={`${styles.sectionTitle} mb-2`}>
                    Category adjustments
                  </h2>

                  <p className={`${styles.sectionText} mb-0`}>
                    Apply an independent percentage correction to each travel
                    cost category.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.formCardBody}>
              <div className="row g-4">
                {adjustmentFields.map((field) => {
                  const FieldIcon = field.icon;

                  return (
                    <div key={field.name} className="col-12 col-md-6 col-xl-4">
                      <div className={`${styles.settingCard} h-100`}>
                        <div className="d-flex align-items-start gap-3 mb-4">
                          <span
                            className={`${styles.settingIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
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

                        <div className="input-group mt-auto">
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
          <section className={styles.formCard}>
            <div className={styles.formCardBody}>
              <div className={styles.seasonalCard}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
                  <div className="d-flex align-items-start gap-3">
                    <span
                      className={`${styles.seasonalIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                      aria-hidden="true"
                    >
                      <FaCalendarDays />
                    </span>

                    <div>
                      <p className={`${styles.sectionLabel} mb-2`}>
                        Seasonal calculation
                      </p>

                      <h2 className={`${styles.settingTitle} mb-2`}>
                        Seasonal price adjustment
                      </h2>

                      <p className={`${styles.settingText} mb-0`}>
                        Enable or disable seasonal pricing adjustments when
                        estimating travel costs.
                      </p>
                    </div>
                  </div>

                  <div className={styles.switchArea}>
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
                        className={styles.switchLabel}
                        htmlFor="enableSeasonalAdjustment"
                      >
                        {formData.enableSeasonalAdjustment
                          ? "Enabled"
                          : "Disabled"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.formActions} d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3`}
              >
                <div>
                  <p className={`${styles.saveTitle} mb-1`}>
                    Save configuration
                  </p>

                  <p className={`${styles.saveNote} mb-0`}>
                    The updated values will be used for future trip cost
                    calculations.
                  </p>
                </div>

                <button
                  type="submit"
                  className={`${styles.saveButton} btn px-4`}
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
                      <FaFloppyDisk className="me-2" aria-hidden="true" />
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
