"use client";

import { useEffect, useState } from "react";
import { FaLocationDot, FaSuitcaseRolling, FaUser } from "react-icons/fa6";
import {
  spendingTierOptions,
  travelInterestOptions,
} from "@/data/mockDestinations";
import { mockDepartureAirports } from "@/data/mockFlights";
import { watchAuthState } from "@/firebase/authService";
import { getUserProfile, updateUserProfile } from "@/firebase/userService";
import TravellerLayout from "../../../../shared/layout/TravellerLayout";
import styles from "./profile.module.css";

const EMPTY_PROFILE_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  preferredDepartureAirportCode: "",
  preferredSpendingTier: "",
  travelInterests: [],
};

const validAirportCodes = mockDepartureAirports.map(
  (airport) => airport.airportCode,
);

function createFormData(profile, authUser) {
  return {
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    email: profile?.email || authUser?.email || "",
    preferredDepartureAirportCode: profile?.preferredDepartureAirportCode || "",
    preferredSpendingTier: profile?.preferredSpendingTier || "",
    travelInterests: Array.isArray(profile?.travelInterests)
      ? profile.travelInterests
      : [],
  };
}

function getProfileErrorMessage(error) {
  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  if (error?.code === "profile/not-found") {
    return "No Firestore profile was found for this account.";
  }

  if (error?.code === "profile/invalid-name") {
    return "First name and last name are required.";
  }

  if (error?.code === "not-found") {
    return "The Firestore profile document could not be found.";
  }

  return error?.message || "The profile could not be loaded or updated.";
}

export default function TravellerProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(EMPTY_PROFILE_FORM);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      setErrorMessage("");
      setSuccessMessage("");

      if (!authUser) {
        setCurrentUser(null);
        setProfile(null);
        setFormData(EMPTY_PROFILE_FORM);
        setErrorMessage("Sign in to open the Traveller Profile page.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setCurrentUser(authUser);

        const userProfile = await getUserProfile(authUser.uid);

        if (!userProfile) {
          const profileError = new Error(
            "No Firestore profile was found for this account.",
          );

          profileError.code = "profile/not-found";
          throw profileError;
        }

        if (isActive) {
          setProfile(userProfile);
          setFormData(createFormData(userProfile, authUser));
        }
      } catch (error) {
        if (isActive) {
          setProfile(null);
          setFormData(EMPTY_PROFILE_FORM);
          setErrorMessage(getProfileErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const clearMessages = () => {
    if (errorMessage) {
      setErrorMessage("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    clearMessages();

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleInterestChange = (event) => {
    const { value, checked } = event.target;

    clearMessages();

    setFormData((previousData) => {
      const currentInterests = previousData.travelInterests;

      const updatedInterests = checked
        ? [...new Set([...currentInterests, value])]
        : currentInterests.filter((interest) => interest !== value);

      return {
        ...previousData,
        travelInterests: updatedInterests,
      };
    });
  };

  const validateProfile = () => {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    if (!firstName || !lastName) {
      return "First name and last name are required.";
    }

    if (
      formData.preferredDepartureAirportCode &&
      !validAirportCodes.includes(formData.preferredDepartureAirportCode)
    ) {
      return "Please select a valid departure airport.";
    }

    if (
      formData.preferredSpendingTier &&
      !spendingTierOptions.includes(formData.preferredSpendingTier)
    ) {
      return "Please select a valid spending tier.";
    }

    const hasInvalidInterest = formData.travelInterests.some(
      (interest) => !travelInterestOptions.includes(interest),
    );

    if (hasInvalidInterest) {
      return "One or more selected travel interests are invalid.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.uid) {
      setErrorMessage("Sign in before updating your profile.");
      return;
    }

    const validationMessage = validateProfile();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage("");
      return;
    }

    const profileUpdates = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      preferredDepartureAirportCode: formData.preferredDepartureAirportCode,
      preferredSpendingTier: formData.preferredSpendingTier,
      travelInterests: formData.travelInterests,
    };

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedProfile = await updateUserProfile(
        currentUser.uid,
        profileUpdates,
      );

      setProfile((previousProfile) => ({
        ...previousProfile,
        ...updatedProfile,
      }));

      setFormData((previousData) => ({
        ...previousData,
        ...updatedProfile,
        email: previousData.email,
      }));

      setSuccessMessage("Your profile and travel preferences have been saved.");
    } catch (error) {
      setErrorMessage(getProfileErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TravellerLayout
      pageTitle="Profile"
      pageDescription="Manage your personal details and travel preferences."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div
            className="alert alert-danger mb-4"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className="alert alert-success mb-4"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        {isLoading && (
          <div className="alert alert-light border mb-4" role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Loading your profile...
          </div>
        )}

        {!isLoading && currentUser && profile && (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Personal details */}
              <div className="col-12 col-xl-6">
                <section className={`card h-100 ${styles.profileCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 mb-4">
                      <span
                        className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaUser />
                      </span>

                      <div>
                        <h2 className="h4 fw-bold text-dark mb-1">
                          Personal details
                        </h2>

                        <p className="text-secondary mb-0">
                          Update the name displayed in your Traveller account.
                        </p>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label
                          htmlFor="firstName"
                          className="form-label fw-semibold"
                        >
                          First name
                        </label>

                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          className="form-control"
                          value={formData.firstName}
                          onChange={handleFieldChange}
                          disabled={isSaving}
                          autoComplete="given-name"
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label
                          htmlFor="lastName"
                          className="form-label fw-semibold"
                        >
                          Last name
                        </label>

                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          className="form-control"
                          value={formData.lastName}
                          onChange={handleFieldChange}
                          disabled={isSaving}
                          autoComplete="family-name"
                        />
                      </div>

                      <div className="col-12">
                        <label
                          htmlFor="email"
                          className="form-label fw-semibold"
                        >
                          Email address
                        </label>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          className={`form-control ${styles.readOnlyInput}`}
                          value={formData.email}
                          readOnly
                          disabled
                        />

                        <p className="form-text mb-0">
                          The email address is managed by Firebase
                          Authentication.
                        </p>
                      </div>
                    </div>

                    <div className="d-flex gap-2 flex-wrap mt-4">
                      <span className="badge text-bg-dark">
                        Traveller account
                      </span>

                      <span className="badge text-bg-success">Active</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Travel preferences */}
              <div className="col-12 col-xl-6">
                <section className={`card h-100 ${styles.profileCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 mb-4">
                      <span
                        className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaSuitcaseRolling />
                      </span>

                      <div>
                        <h2 className="h4 fw-bold text-dark mb-1">
                          Travel preferences
                        </h2>

                        <p className="text-secondary mb-0">
                          Save preferences that can support future trip
                          planning.
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="preferredDepartureAirportCode"
                        className="form-label fw-semibold"
                      >
                        Preferred departure airport
                      </label>

                      <select
                        id="preferredDepartureAirportCode"
                        name="preferredDepartureAirportCode"
                        className="form-select"
                        value={formData.preferredDepartureAirportCode}
                        onChange={handleFieldChange}
                        disabled={isSaving}
                      >
                        <option value="">No preferred airport selected</option>

                        {mockDepartureAirports.map((airport) => (
                          <option
                            key={airport.airportCode}
                            value={airport.airportCode}
                          >
                            {airport.city} — {airport.airportName} (
                            {airport.airportCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-0">
                      <label
                        htmlFor="preferredSpendingTier"
                        className="form-label fw-semibold"
                      >
                        Preferred spending tier
                      </label>

                      <select
                        id="preferredSpendingTier"
                        name="preferredSpendingTier"
                        className="form-select"
                        value={formData.preferredSpendingTier}
                        onChange={handleFieldChange}
                        disabled={isSaving}
                      >
                        <option value="">No spending tier selected</option>

                        {spendingTierOptions.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </div>

              {/* Travel interests */}
              <div className="col-12">
                <section className={`card ${styles.profileCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 mb-4">
                      <span
                        className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaLocationDot />
                      </span>

                      <div>
                        <h2 className="h4 fw-bold text-dark mb-1">
                          Travel interests
                        </h2>

                        <p className="text-secondary mb-0">
                          Select the activities and experiences that interest
                          you.
                        </p>
                      </div>
                    </div>

                    <div className="row g-2">
                      {travelInterestOptions.map((interest) => {
                        const isSelected =
                          formData.travelInterests.includes(interest);

                        return (
                          <div
                            key={interest}
                            className="col-12 col-sm-6 col-lg-4"
                          >
                            <label
                              className={`${styles.interestOption} ${
                                isSelected ? styles.interestOptionSelected : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="form-check-input"
                                value={interest}
                                checked={isSelected}
                                onChange={handleInterestChange}
                                disabled={isSaving}
                              />

                              <span>{interest}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>

              {/* Save action */}
              <div className="col-12">
                <div
                  className={`${styles.saveBar} d-flex align-items-center justify-content-between gap-3 flex-wrap`}
                >
                  <p className="text-secondary mb-0">
                    Your changes will be saved to your Firestore Traveller
                    profile.
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
                        Saving changes...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </TravellerLayout>
  );
}
