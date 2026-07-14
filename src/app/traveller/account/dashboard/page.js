"use client";

import { useEffect, useState } from "react";
import { FaBookmark, FaLocationDot, FaUser } from "react-icons/fa6";
import { mockDestinations } from "@/data/mockDestinations";
import { watchAuthState } from "@/firebase/authService";
import { getSavedTrips } from "@/firebase/tripService";
import { getUserProfile } from "@/firebase/userService";
import TravellerLayout from "../../../../shared/layout/TravellerLayout";
import styles from "./dashboard.module.css";

function getDashboardErrorMessage(error) {
  if (error?.code === "auth/required") {
    return "Sign in to open the Traveller Dashboard.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return error?.message || "The Traveller Dashboard data could not be loaded.";
}

export default function TravellerDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      if (!authUser) {
        setCurrentUser(null);
        setProfile(null);
        setSavedTrips([]);
        setErrorMessage("Sign in to open the Traveller Dashboard.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        setCurrentUser(authUser);

        const [travellerProfile, travellerSavedTrips] = await Promise.all([
          getUserProfile(authUser.uid),
          getSavedTrips(authUser.uid),
        ]);

        if (isActive) {
          setProfile(travellerProfile);
          setSavedTrips(travellerSavedTrips);
        }
      } catch (error) {
        if (isActive) {
          setProfile(null);
          setSavedTrips([]);
          setErrorMessage(getDashboardErrorMessage(error));
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

  return (
    <TravellerLayout
      pageTitle="Dashboard"
      pageDescription="Build the Traveller overview for travel planning activity, account information and saved trips."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div className="alert alert-danger mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="alert alert-light border mb-4" role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Loading Traveller Dashboard data...
          </div>
        )}

        {!isLoading && !errorMessage && currentUser && (
          <div className="row g-4">
            <div className="col-12">
              <section className={`card ${styles.handoverCard}`}>
                <div className="card-body p-4 p-lg-5">
                  <span className="badge bg-dark mb-3">
                    Traveller development foundation
                  </span>

                  <h2 className="h3 fw-bold text-dark mb-3">
                    Dashboard connections are ready
                  </h2>

                  <p className="text-secondary mb-4">
                    Firebase authentication, the Traveller profile, saved trips
                    and prepared destination data are already connected. You can
                    now create the final Dashboard interface using Bootstrap
                    without changing the shared Firebase or mock data files.
                  </p>

                  <div className="row g-4">
                    <div className="col-12 col-lg-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaUser />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available Traveller account data
                            </h3>

                            <p className="text-secondary mb-0">
                              The signed-in Firebase user is available through
                              <code className="ms-1">currentUser</code>. The
                              Firestore profile is available through
                              <code className="ms-1">profile</code>.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>
                            <code>currentUser.uid</code> contains the Firebase
                            user ID
                          </li>
                          <li>
                            <code>currentUser.email</code> contains the
                            authenticated email
                          </li>
                          <li>
                            <code>profile</code> contains the Firestore user
                            document
                          </li>
                          <li>
                            Profile fields can be used in the Dashboard greeting
                            and account summary
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-12 col-lg-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaBookmark />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available saved trips
                            </h3>

                            <p className="text-secondary mb-0">
                              The page already reads the signed-in
                              Traveller&apos;s records from the
                              <code className="ms-1">savedTrips</code>{" "}
                              collection.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>
                            <code>savedTrips</code> contains all loaded trips
                          </li>
                          <li>
                            <code>savedTrips.length</code> provides the total
                            number of trips
                          </li>
                          <li>
                            The records can be used for statistics and recent
                            trip previews
                          </li>
                          <li>
                            <code>isLoading</code> controls the loading state
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className={`p-4 ${styles.infoBlock}`}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <span
                            className={`${styles.infoIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaLocationDot />
                          </span>

                          <div>
                            <h3 className="h5 fw-bold text-dark mb-2">
                              Available mock destination data
                            </h3>

                            <p className="text-secondary mb-0">
                              Use <code>mockDestinations</code> for destination
                              previews, supported interests, travel months,
                              spending tiers and destination images.
                            </p>
                          </div>
                        </div>

                        <ul className="mb-0 text-secondary">
                          <li>Destination city and country</li>
                          <li>Supported spending tiers</li>
                          <li>Travel interests and descriptions</li>
                          <li>Best travel months and duration limits</li>
                          <li>Prepared destination image paths</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-primary mt-4 mb-0" role="note">
                    Create the final Dashboard cards, statistics, recent trip
                    section, navigation actions and responsive design below this
                    foundation. Bootstrap should remain the main UI library. Do
                    not change files inside
                    <code className="mx-1">src/firebase</code>
                    or
                    <code className="ms-1">src/data</code>.
                  </div>

                  <div className="mt-4 text-secondary">
                    Available records:
                    <strong className="ms-1">{savedTrips.length}</strong> saved
                    trips and
                    <strong className="mx-1">{mockDestinations.length}</strong>
                    mock destinations.
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
