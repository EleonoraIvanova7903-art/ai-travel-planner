"use client";

import { useEffect, useState } from "react";
import {
  FaCalendarCheck,
  FaCoins,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { watchAuthState } from "@/firebase/authService";
import { getCostSettings, updateCostSettings } from "@/firebase/adminService";
import AdminLayout from "../../../shared/layout/AdminLayout";
import CostSettingsForm from "./CostSettingsForm";
import styles from "./cost-settings.module.css";

const defaultCostSettings = Object.freeze({
  defaultCurrency: "GBP",
  costAdjustmentPercentage: 5,
  flightCostAdjustmentPercentage: 3,
  accommodationCostAdjustmentPercentage: 5,
  foodCostAdjustmentPercentage: 2,
  localTransportCostAdjustmentPercentage: 0,
  activityCostAdjustmentPercentage: 4,
  budgetWarningThresholdPercentage: 90,
  enableSeasonalAdjustment: true,
});

const adjustmentFieldNames = [
  "costAdjustmentPercentage",
  "flightCostAdjustmentPercentage",
  "accommodationCostAdjustmentPercentage",
  "foodCostAdjustmentPercentage",
  "localTransportCostAdjustmentPercentage",
  "activityCostAdjustmentPercentage",
];

const adjustmentFieldLabels = {
  costAdjustmentPercentage: "General cost adjustment",
  flightCostAdjustmentPercentage: "Flight adjustment",
  accommodationCostAdjustmentPercentage: "Accommodation adjustment",
  foodCostAdjustmentPercentage: "Food adjustment",
  localTransportCostAdjustmentPercentage: "Local transport adjustment",
  activityCostAdjustmentPercentage: "Activity adjustment",
};

function getValidNumber(value, fallbackValue) {
  if (value === "" || value === null || value === undefined) {
    return fallbackValue;
  }

  const convertedValue = Number(value);

  return Number.isFinite(convertedValue) ? convertedValue : fallbackValue;
}

function normaliseCostSettings(data) {
  return {
    defaultCurrency:
      typeof data?.defaultCurrency === "string" &&
      data.defaultCurrency.trim() !== ""
        ? data.defaultCurrency.trim().toUpperCase()
        : defaultCostSettings.defaultCurrency,

    costAdjustmentPercentage: getValidNumber(
      data?.costAdjustmentPercentage,
      defaultCostSettings.costAdjustmentPercentage,
    ),

    flightCostAdjustmentPercentage: getValidNumber(
      data?.flightCostAdjustmentPercentage,
      defaultCostSettings.flightCostAdjustmentPercentage,
    ),

    accommodationCostAdjustmentPercentage: getValidNumber(
      data?.accommodationCostAdjustmentPercentage,
      defaultCostSettings.accommodationCostAdjustmentPercentage,
    ),

    foodCostAdjustmentPercentage: getValidNumber(
      data?.foodCostAdjustmentPercentage,
      defaultCostSettings.foodCostAdjustmentPercentage,
    ),

    localTransportCostAdjustmentPercentage: getValidNumber(
      data?.localTransportCostAdjustmentPercentage,
      defaultCostSettings.localTransportCostAdjustmentPercentage,
    ),

    activityCostAdjustmentPercentage: getValidNumber(
      data?.activityCostAdjustmentPercentage,
      defaultCostSettings.activityCostAdjustmentPercentage,
    ),

    budgetWarningThresholdPercentage: getValidNumber(
      data?.budgetWarningThresholdPercentage,
      defaultCostSettings.budgetWarningThresholdPercentage,
    ),

    enableSeasonalAdjustment:
      typeof data?.enableSeasonalAdjustment === "boolean"
        ? data.enableSeasonalAdjustment
        : defaultCostSettings.enableSeasonalAdjustment,
  };
}

function prepareCostSettingsForSave(data) {
  const defaultCurrency =
    typeof data?.defaultCurrency === "string"
      ? data.defaultCurrency.trim().toUpperCase()
      : "";

  if (defaultCurrency !== "GBP") {
    throw new Error("The default currency must be GBP.");
  }

  const preparedSettings = {
    defaultCurrency,
    enableSeasonalAdjustment: Boolean(data?.enableSeasonalAdjustment),
  };

  adjustmentFieldNames.forEach((fieldName) => {
    const fieldValue = data?.[fieldName];

    if (fieldValue === "" || fieldValue === null || fieldValue === undefined) {
      throw new Error(`${adjustmentFieldLabels[fieldName]} is required.`);
    }

    const numericValue = Number(fieldValue);

    if (!Number.isFinite(numericValue)) {
      throw new Error(
        `${adjustmentFieldLabels[fieldName]} must be a valid number.`,
      );
    }

    if (numericValue < -100 || numericValue > 100) {
      throw new Error(
        `${adjustmentFieldLabels[fieldName]} must be between -100% and 100%.`,
      );
    }

    preparedSettings[fieldName] = numericValue;
  });

  const budgetWarningThreshold = Number(data?.budgetWarningThresholdPercentage);

  if (
    data?.budgetWarningThresholdPercentage === "" ||
    data?.budgetWarningThresholdPercentage === null ||
    data?.budgetWarningThresholdPercentage === undefined
  ) {
    throw new Error("The budget warning threshold is required.");
  }

  if (!Number.isFinite(budgetWarningThreshold)) {
    throw new Error("The budget warning threshold must be a valid number.");
  }

  if (budgetWarningThreshold < 0 || budgetWarningThreshold > 100) {
    throw new Error(
      "The budget warning threshold must be between 0% and 100%.",
    );
  }

  preparedSettings.budgetWarningThresholdPercentage = budgetWarningThreshold;

  return preparedSettings;
}

function getCostSettingsErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in with an Admin account to open this page.";
  }

  if (error?.code === "admin/access-denied") {
    return "This account does not have active Admin access.";
  }

  if (error?.code === "profile/not-found") {
    return "The Admin profile could not be found.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return error?.message || "Cost settings could not be processed.";
}

function scrollToPageTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

export default function CostSettingsPage() {
  const [formData, setFormData] = useState(defaultCostSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      setStatusMessage("");
      setErrorMessage("");

      if (!authUser) {
        setErrorMessage("Sign in with an Admin account to open this page.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const savedSettings = await getCostSettings();

        if (isActive) {
          setFormData(normaliseCostSettings(savedSettings));
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getCostSettingsErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");
      setErrorMessage("");

      const preparedSettings = prepareCostSettingsForSave(formData);

      const updatedSettings = await updateCostSettings(preparedSettings);

      setFormData(normaliseCostSettings(updatedSettings || preparedSettings));

      setStatusMessage("Cost settings were saved successfully.");
      scrollToPageTop();
    } catch (error) {
      setErrorMessage(getCostSettingsErrorMessage(error));
      scrollToPageTop();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout
      pageTitle="Cost Settings"
      pageDescription="Review and maintain the travel cost configuration."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div className="alert alert-danger mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="alert alert-success mb-4" role="status">
            {statusMessage}
          </div>
        )}

        {isLoading && (
          <div className="alert alert-light border mb-4" role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Loading cost settings...
          </div>
        )}

        {!isLoading && !errorMessage && (
          <>
            <div className="row g-4 mb-4">
              <div className="col-12 col-md-4">
                <section className={`card h-100 ${styles.summaryCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className={`${styles.summaryLabel} mb-2`}>
                          Currency
                        </p>

                        <h2 className={`${styles.summaryValue} mb-1`}>
                          {formData.defaultCurrency}
                        </h2>

                        <p className={`${styles.summaryText} mb-0`}>
                          Default cost configuration currency
                        </p>
                      </div>

                      <span
                        className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        <FaCoins />
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`card h-100 ${styles.summaryCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className={`${styles.summaryLabel} mb-2`}>
                          Warning threshold
                        </p>

                        <h2 className={`${styles.summaryValue} mb-1`}>
                          {formData.budgetWarningThresholdPercentage}%
                        </h2>

                        <p className={`${styles.summaryText} mb-0`}>
                          Configured close-to-budget level
                        </p>
                      </div>

                      <span
                        className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        <FaTriangleExclamation />
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-4">
                <section className={`card h-100 ${styles.summaryCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className={`${styles.summaryLabel} mb-2`}>
                          Seasonal adjustment
                        </p>

                        <h2 className={`${styles.summaryValue} mb-1`}>
                          {formData.enableSeasonalAdjustment
                            ? "Enabled"
                            : "Disabled"}
                        </h2>

                        <p className={`${styles.summaryText} mb-0`}>
                          Seasonal configuration status
                        </p>
                      </div>

                      <span
                        className={`${styles.summaryIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        <FaCalendarCheck />
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <CostSettingsForm
              formData={formData}
              setFormData={setFormData}
              isSaving={isSaving}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
