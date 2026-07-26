"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRight,
  FaBookmark,
  FaCalendarDays,
  FaCompass,
  FaLocationDot,
  FaRoute,
  FaSuitcaseRolling,
  FaUser,
  FaUsers,
} from "react-icons/fa6";
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

function getTravellerName(profile, currentUser) {
  const firstName = String(profile?.firstName || "").trim();
  const lastName = String(profile?.lastName || "").trim();

  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  return (
    profile?.fullName ||
    profile?.displayName ||
    currentUser?.displayName ||
    "Traveller"
  );
}

function getTravellerInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "T";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getSavedTripDestination(trip) {
  const storedDestination =
    trip?.destination && typeof trip.destination === "object"
      ? trip.destination
      : null;

  const destinationId =
    trip?.destinationId ||
    storedDestination?.destinationId ||
    storedDestination?.id ||
    "";

  const city =
    storedDestination?.city ||
    (typeof trip?.destination === "string" ? trip.destination : "") ||
    trip?.city ||
    "";

  const destinationRecord = mockDestinations.find(
    (destination) =>
      destination.destinationId === destinationId ||
      destination.city.toLowerCase() === city.toLowerCase(),
  );

  return {
    destinationId: destinationRecord?.destinationId || destinationId,

    city:
      destinationRecord?.city ||
      storedDestination?.city ||
      city ||
      "Saved trip",

    country:
      destinationRecord?.country ||
      storedDestination?.country ||
      trip?.country ||
      "",

    image: destinationRecord?.image || storedDestination?.image || "",

    shortDescription:
      destinationRecord?.shortDescription ||
      storedDestination?.shortDescription ||
      "Saved TravelMind AI journey.",
  };
}

function getTripTotalCost(trip) {
  return (
    trip?.costBreakdown?.total ??
    trip?.costBreakdown?.breakdown?.total ??
    trip?.budget?.estimatedCost ??
    trip?.estimatedCost ??
    trip?.totalCost ??
    null
  );
}

function formatCurrency(value, currency = "GBP") {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "Not calculated";
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(numericValue);
  } catch {
    return `£${Math.round(numericValue)}`;
  }
}

function formatSavedDate(value) {
  if (!value) {
    return "Recently saved";
  }

  let preparedDate;

  if (typeof value?.toDate === "function") {
    preparedDate = value.toDate();
  } else if (typeof value?.seconds === "number") {
    preparedDate = new Date(value.seconds * 1000);
  } else {
    preparedDate = new Date(value);
  }

  if (Number.isNaN(preparedDate.getTime())) {
    return "Recently saved";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(preparedDate);
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

          setSavedTrips(
            Array.isArray(travellerSavedTrips) ? travellerSavedTrips : [],
          );
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

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const travellerName = getTravellerName(profile, currentUser);
  const travellerInitials = getTravellerInitials(travellerName);

  const completedTrips = useMemo(
    () =>
      savedTrips.filter(
        (trip) =>
          String(trip?.status || "").toLowerCase() === "saved" ||
          String(trip?.status || "").toLowerCase() === "completed" ||
          Boolean(trip?.itinerary),
      ),
    [savedTrips],
  );

  const draftTrips = useMemo(
    () =>
      savedTrips.filter(
        (trip) => String(trip?.status || "").toLowerCase() === "draft",
      ),
    [savedTrips],
  );

  const exploredDestinations = useMemo(() => {
    const destinationIds = new Set();

    savedTrips.forEach((trip) => {
      const destination = getSavedTripDestination(trip);

      if (destination.destinationId || destination.city) {
        destinationIds.add(destination.destinationId || destination.city);
      }
    });

    return destinationIds.size;
  }, [savedTrips]);

  const recentTrips = useMemo(() => savedTrips.slice(0, 3), [savedTrips]);

  const featuredDestinations = useMemo(() => {
    const savedDestinationIds = new Set(
      savedTrips
        .map((trip) => getSavedTripDestination(trip).destinationId)
        .filter(Boolean),
    );

    const unsavedDestinations = mockDestinations.filter(
      (destination) => !savedDestinationIds.has(destination.destinationId),
    );

    const source =
      unsavedDestinations.length >= 3 ? unsavedDestinations : mockDestinations;

    return source.slice(0, 3);
  }, [savedTrips]);

  const heroDestination = featuredDestinations[0] || mockDestinations[0];

  return (
    <TravellerLayout
      pageTitle="Dashboard"
      pageDescription="View your saved trips, account details and available travel destinations."
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
            Loading Traveller Dashboard...
          </div>
        )}

        {!isLoading && !errorMessage && currentUser && (
          <div className="row g-4">
            <div className="col-12">
              <section className={styles.heroCard}>
                {heroDestination?.image && (
                  <Image
                    src={heroDestination.image}
                    alt={`${heroDestination.city}, ${heroDestination.country}`}
                    fill
                    priority
                    sizes="(max-width: 991px) 100vw, 80vw"
                    className={styles.heroImage}
                  />
                )}

                <div className={styles.heroOverlay} />

                <div className={styles.heroContent}>
                  <span className={styles.heroLabel}>
                    <FaCompass />
                    Traveller dashboard
                  </span>

                  <h1 className={styles.heroTitle}>
                    Welcome back, {travellerName}
                  </h1>

                  <p className={styles.heroText}>
                    Continue planning your next journey or review the trips
                    already saved in your account.
                  </p>

                  <div className={styles.heroActions}>
                    <Link
                      href="/traveller/trip-planning/planner"
                      className={styles.heroPrimaryButton}
                    >
                      <FaCompass />
                      Plan a new trip
                    </Link>

                    <Link
                      href="/traveller/account/saved-trips"
                      className={styles.heroSecondaryButton}
                    >
                      <FaBookmark />
                      Saved trips
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <section className={styles.statCard}>
                <span className={styles.statIcon}>
                  <FaBookmark />
                </span>

                <div>
                  <p className={styles.statLabel}>Saved trips</p>
                  <p className={styles.statValue}>{savedTrips.length}</p>
                  <p className={styles.statText}>Firestore travel records</p>
                </div>
              </section>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <section className={styles.statCard}>
                <span className={styles.statIcon}>
                  <FaRoute />
                </span>

                <div>
                  <p className={styles.statLabel}>Completed plans</p>
                  <p className={styles.statValue}>{completedTrips.length}</p>
                  <p className={styles.statText}>Saved itineraries</p>
                </div>
              </section>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <section className={styles.statCard}>
                <span className={styles.statIcon}>
                  <FaLocationDot />
                </span>

                <div>
                  <p className={styles.statLabel}>Destinations</p>
                  <p className={styles.statValue}>{exploredDestinations}</p>
                  <p className={styles.statText}>Different saved places</p>
                </div>
              </section>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <section className={styles.statCard}>
                <span className={styles.statIcon}>
                  <FaCalendarDays />
                </span>

                <div>
                  <p className={styles.statLabel}>Draft trips</p>
                  <p className={styles.statValue}>{draftTrips.length}</p>
                  <p className={styles.statText}>Plans to continue</p>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-8">
              <section className={styles.contentCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Travel activity</p>

                    <h2 className={styles.sectionTitle}>Recent saved trips</h2>

                    <p className={styles.sectionDescription}>
                      Your latest trips loaded from Firestore.
                    </p>
                  </div>

                  <Link
                    href="/traveller/account/saved-trips"
                    className={styles.textLink}
                  >
                    View all
                    <FaArrowRight />
                  </Link>
                </div>

                {recentTrips.length > 0 ? (
                  <div className={styles.tripList}>
                    {recentTrips.map((trip, index) => {
                      const destination = getSavedTripDestination(trip);

                      return (
                        <article
                          className={styles.tripCard}
                          key={trip?.id || `${destination.city}-${index}`}
                        >
                          <div className={styles.tripImageWrapper}>
                            {destination.image ? (
                              <Image
                                src={destination.image}
                                alt={`${destination.city}, ${destination.country}`}
                                fill
                                sizes="110px"
                                className={styles.tripImage}
                              />
                            ) : (
                              <span className={styles.tripImageFallback}>
                                <FaLocationDot />
                              </span>
                            )}
                          </div>

                          <div className={styles.tripInformation}>
                            <h3 className={styles.tripTitle}>
                              {trip?.tripName ||
                                `${destination.city} Travel Plan`}
                            </h3>

                            <p className={styles.tripDestination}>
                              <FaLocationDot />
                              {destination.city}
                              {destination.country
                                ? `, ${destination.country}`
                                : ""}
                            </p>

                            <div className={styles.tripMeta}>
                              <span>
                                <FaCalendarDays />
                                {trip?.travelMonth ||
                                  trip?.startDate ||
                                  "Date not set"}
                              </span>

                              <span>
                                <FaUsers />
                                {Number(
                                  trip?.numberOfTravellers ||
                                    trip?.travellers ||
                                    1,
                                )}{" "}
                                traveller
                                {Number(
                                  trip?.numberOfTravellers ||
                                    trip?.travellers ||
                                    1,
                                ) === 1
                                  ? ""
                                  : "s"}
                              </span>
                            </div>

                            <p className={styles.tripSavedDate}>
                              Saved {formatSavedDate(trip?.createdAt)}
                            </p>
                          </div>

                          <div className={styles.tripSummary}>
                            <span className={styles.tripStatus}>
                              {trip?.status || "Saved"}
                            </span>

                            <strong className={styles.tripCost}>
                              {formatCurrency(
                                getTripTotalCost(trip),
                                trip?.currency || "GBP",
                              )}
                            </strong>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>
                      <FaSuitcaseRolling />
                    </span>

                    <h3>No saved trips yet</h3>

                    <p>
                      Create a travel plan and save the itinerary to display it
                      on your dashboard.
                    </p>

                    <Link
                      href="/traveller/trip-planning/planner"
                      className={styles.darkButton}
                    >
                      Start planning
                      <FaArrowRight />
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="col-12 col-xl-4">
              <section className={styles.contentCard}>
                <div className={styles.profileHeader}>
                  <span className={styles.profileAvatar}>
                    {travellerInitials}
                  </span>

                  <p className={styles.sectionLabel}>Traveller account</p>

                  <h2 className={styles.profileName}>{travellerName}</h2>

                  <p className={styles.profileEmail}>
                    {profile?.email || currentUser.email}
                  </p>
                </div>

                <div className={styles.profileDetails}>
                  <div>
                    <span>Account role</span>
                    <strong>{profile?.role || "Traveller"}</strong>
                  </div>

                  <div>
                    <span>Saved trips</span>
                    <strong>{savedTrips.length}</strong>
                  </div>

                  <div>
                    <span>Available destinations</span>
                    <strong>{mockDestinations.length}</strong>
                  </div>
                </div>

                <Link
                  href="/traveller/account/profile"
                  className={styles.darkButton}
                >
                  <FaUser />
                  Open profile
                </Link>
              </section>
            </div>

            <div className="col-12">
              <section className={styles.contentCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Travel inspiration</p>

                    <h2 className={styles.sectionTitle}>
                      Explore another destination
                    </h2>

                    <p className={styles.sectionDescription}>
                      Destination images and information are loaded directly
                      from mockDestinations.
                    </p>
                  </div>

                  <Link
                    href="/traveller/trip-planning/recommendations"
                    className={styles.textLink}
                  >
                    Recommendations
                    <FaArrowRight />
                  </Link>
                </div>

                <div className={styles.destinationGrid}>
                  {featuredDestinations.map((destination) => (
                    <article
                      className={styles.destinationCard}
                      key={destination.destinationId}
                    >
                      <div className={styles.destinationImageWrapper}>
                        <Image
                          src={destination.image}
                          alt={`${destination.city}, ${destination.country}`}
                          fill
                          sizes="(max-width: 767px) 100vw, 33vw"
                          className={styles.destinationImage}
                        />

                        <div className={styles.destinationOverlay} />

                        <div className={styles.destinationHeading}>
                          <p>{destination.country}</p>
                          <h3>{destination.city}</h3>
                        </div>
                      </div>

                      <div className={styles.destinationBody}>
                        <p>{destination.shortDescription}</p>

                        <div className={styles.destinationTags}>
                          {(destination.interests || [])
                            .slice(0, 3)
                            .map((interest) => (
                              <span key={interest}>{interest}</span>
                            ))}
                        </div>

                        <Link
                          href="/traveller/trip-planning/planner"
                          className={styles.destinationButton}
                        >
                          Plan this trip
                          <FaArrowRight />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </TravellerLayout>
  );
}
