"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRight,
  FaBookmark,
  FaChartLine,
  FaCircleCheck,
  FaCompass,
  FaGear,
  FaLocationDot,
  FaRobot,
  FaScaleBalanced,
  FaUserShield,
  FaUsers,
} from "react-icons/fa6";
import { mockDestinations } from "@/data/mockDestinations";
import { mockCostRules } from "@/data/mockCostRules";
import { watchAuthState } from "@/firebase/authService";
import { getAdminDashboardData } from "@/firebase/adminService";
import AdminLayout from "../../../shared/layout/AdminLayout";
import styles from "./dashboard.module.css";

const initialDashboardData = {
  savedTripsCount: 0,
  travellersCount: 0,
  adminAccountsCount: 0,
  activeAccountsCount: 0,
  totalUsersCount: 0,
};

function getDashboardErrorMessage(error) {
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
    return "Access to the dashboard information was denied.";
  }

  return error?.message || "Dashboard information could not be loaded.";
}

function calculatePercentage(value, total) {
  const numericValue = Number(value);
  const numericTotal = Number(total);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isFinite(numericTotal) ||
    numericTotal <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((numericValue / numericTotal) * 100)),
  );
}

function getTripsPerTraveller(savedTripsCount, travellersCount) {
  const trips = Number(savedTripsCount);
  const travellers = Number(travellersCount);

  if (
    !Number.isFinite(trips) ||
    !Number.isFinite(travellers) ||
    travellers <= 0
  ) {
    return "0.0";
  }

  return (trips / travellers).toFixed(1);
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      if (!authUser) {
        setDashboardData(initialDashboardData);
        setErrorMessage("Sign in with an Admin account to open this page.");
        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getAdminDashboardData();

        if (isActive) {
          setDashboardData({
            ...initialDashboardData,
            ...(data || {}),
          });
        }
      } catch (error) {
        if (isActive) {
          setDashboardData(initialDashboardData);
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

  const costTierNames = useMemo(
    () => Object.keys(mockCostRules?.foodCostPerDayPerTraveller || {}),
    [],
  );

  const activeAccountPercentage = calculatePercentage(
    dashboardData.activeAccountsCount,
    dashboardData.totalUsersCount,
  );

  const travellerPercentage = calculatePercentage(
    dashboardData.travellersCount,
    dashboardData.totalUsersCount,
  );

  const adminPercentage = calculatePercentage(
    dashboardData.adminAccountsCount,
    dashboardData.totalUsersCount,
  );

  const tripsPerTraveller = getTripsPerTraveller(
    dashboardData.savedTripsCount,
    dashboardData.travellersCount,
  );

  const featuredDestinations = useMemo(() => mockDestinations.slice(0, 4), []);

  const heroDestination =
    mockDestinations.find(
      (destination) =>
        String(destination.city || "").toLowerCase() === "lisbon",
    ) || mockDestinations[0];

  const statisticCards = [
    {
      label: "Total users",
      value: dashboardData.totalUsersCount,
      description: "All registered platform accounts",
      icon: <FaUsers />,
    },
    {
      label: "Active accounts",
      value: dashboardData.activeAccountsCount,
      description: `${activeAccountPercentage}% of registered accounts`,
      icon: <FaCircleCheck />,
    },
    {
      label: "Traveller accounts",
      value: dashboardData.travellersCount,
      description: "Users with Traveller access",
      icon: <FaCompass />,
    },
    {
      label: "Saved trips",
      value: dashboardData.savedTripsCount,
      description: "Travel plans saved by Travellers",
      icon: <FaBookmark />,
    },
  ];

  const managementLinks = [
    {
      title: "Destinations",
      description:
        "Review the destinations available to Travellers and recommendation results.",
      href: "/admin/destinations",
      icon: <FaLocationDot />,
    },
    {
      title: "Cost Settings",
      description:
        "Manage shared cost values and adjustments used for trip estimates.",
      href: "/admin/cost-settings",
      icon: <FaGear />,
    },
    {
      title: "Recommendation Rules",
      description:
        "Adjust budget, interest and seasonal destination matching priorities.",
      href: "/admin/recommendation-rules",
      icon: <FaScaleBalanced />,
    },
    {
      title: "Users",
      description:
        "Review Traveller and Admin accounts, access roles and account status.",
      href: "/admin/users",
      icon: <FaUsers />,
    },
    {
      title: "AI Logs",
      description:
        "Review AI activity, request outcomes and recent usage information.",
      href: "/admin/ai-logs",
      icon: <FaRobot />,
    },
  ];

  const platformOverviewItems = [
    {
      title: "User accounts",
      description: `${dashboardData.totalUsersCount} registered accounts`,
      badge: "Live data",
      badgeClass: styles.overviewBadge,
      icon: <FaUsers />,
    },
    {
      title: "Saved travel plans",
      description: `${dashboardData.savedTripsCount} saved Traveller trips`,
      badge: "Live data",
      badgeClass: styles.overviewBadge,
      icon: <FaBookmark />,
    },
    {
      title: "Destination catalogue",
      description: `${mockDestinations.length} available destination profiles`,
      badge: "Configured",
      badgeClass: styles.overviewReferenceBadge,
      icon: <FaLocationDot />,
    },
    {
      title: "Spending preferences",
      description: `${costTierNames.length} supported spending tiers`,
      badge: "Configured",
      badgeClass: styles.overviewReferenceBadge,
      icon: <FaGear />,
    },
  ];

  return (
    <AdminLayout
      pageTitle="Dashboard"
      pageDescription="Platform activity, account statistics and travel management overview."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div className={`${styles.pageError} mb-4`} role="alert">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div
            className={`${styles.loadingPanel} d-flex align-items-center gap-3 mb-4`}
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>Loading Admin Dashboard...</span>
          </div>
        )}

        {!isLoading && !errorMessage && (
          <div className="row g-4">
            <div className="col-12">
              <section className={styles.heroCard}>
                {heroDestination?.image && (
                  <Image
                    src={heroDestination.image}
                    alt={`${heroDestination.city}, ${heroDestination.country}`}
                    fill
                    priority
                    sizes="(max-width: 991px) 100vw, 82vw"
                    className={styles.heroImage}
                  />
                )}

                <div className={styles.heroOverlay} />

                <div className={styles.heroContent}>
                  <span className={styles.heroLabel}>
                    <FaUserShield aria-hidden="true" />
                    Admin control centre
                  </span>

                  <h1 className={styles.heroTitle}>
                    TravelMind AI platform overview
                  </h1>

                  <p className={styles.heroText}>
                    Review account activity, manage travel settings and open the
                    main administrative sections from one place.
                  </p>

                  <div className={styles.heroActions}>
                    <Link
                      href="/admin/users"
                      className={styles.heroPrimaryButton}
                    >
                      <FaUsers aria-hidden="true" />
                      Manage users
                    </Link>

                    <Link
                      href="/admin/destinations"
                      className={styles.heroSecondaryButton}
                    >
                      <FaLocationDot aria-hidden="true" />
                      View destinations
                    </Link>
                  </div>
                </div>

                <div className={styles.heroSummary}>
                  <span>Platform overview</span>

                  <strong>
                    <FaCircleCheck aria-hidden="true" />
                    Ready for management
                  </strong>

                  <p>
                    {dashboardData.activeAccountsCount} active accounts and{" "}
                    {dashboardData.savedTripsCount} saved trips
                  </p>
                </div>
              </section>
            </div>

            {statisticCards.map((card) => (
              <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
                <section className={styles.statCard}>
                  <span className={styles.statIcon} aria-hidden="true">
                    {card.icon}
                  </span>

                  <div>
                    <p className={styles.statLabel}>{card.label}</p>

                    <p className={styles.statValue}>{card.value}</p>

                    <p className={styles.statDescription}>{card.description}</p>
                  </div>
                </section>
              </div>
            ))}

            <div className="col-12 col-xl-7">
              <section className={styles.contentCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Account analytics</p>

                    <h2 className={styles.sectionTitle}>
                      Platform account distribution
                    </h2>

                    <p className={styles.sectionDescription}>
                      Review the current balance between active, Traveller and
                      Admin accounts.
                    </p>
                  </div>

                  <span className={styles.sectionIcon} aria-hidden="true">
                    <FaChartLine />
                  </span>
                </div>

                <div className={styles.analyticsList}>
                  <div className={styles.analyticsItem}>
                    <div className={styles.analyticsHeading}>
                      <div>
                        <strong>Active accounts</strong>

                        <span>
                          {dashboardData.activeAccountsCount} of{" "}
                          {dashboardData.totalUsersCount} registered accounts
                        </span>
                      </div>

                      <strong>{activeAccountPercentage}%</strong>
                    </div>

                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label="Active account percentage"
                      aria-valuenow={activeAccountPercentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span
                        className={styles.progressBar}
                        style={{
                          width: `${activeAccountPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.analyticsItem}>
                    <div className={styles.analyticsHeading}>
                      <div>
                        <strong>Traveller accounts</strong>

                        <span>
                          {dashboardData.travellersCount} registered Travellers
                        </span>
                      </div>

                      <strong>{travellerPercentage}%</strong>
                    </div>

                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label="Traveller account percentage"
                      aria-valuenow={travellerPercentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span
                        className={styles.progressBar}
                        style={{
                          width: `${travellerPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.analyticsItem}>
                    <div className={styles.analyticsHeading}>
                      <div>
                        <strong>Admin accounts</strong>

                        <span>
                          {dashboardData.adminAccountsCount} management accounts
                        </span>
                      </div>

                      <strong>{adminPercentage}%</strong>
                    </div>

                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label="Admin account percentage"
                      aria-valuenow={adminPercentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span
                        className={styles.progressBar}
                        style={{
                          width: `${adminPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.analyticsSummary}>
                  <div>
                    <span>Trips per Traveller</span>
                    <strong>{tripsPerTraveller}</strong>
                  </div>

                  <div>
                    <span>Destination profiles</span>
                    <strong>{mockDestinations.length}</strong>
                  </div>

                  <div>
                    <span>Spending tiers</span>
                    <strong>{costTierNames.length}</strong>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-5">
              <section className={styles.contentCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Platform coverage</p>

                    <h2 className={styles.sectionTitle}>
                      Current information overview
                    </h2>

                    <p className={styles.sectionDescription}>
                      A summary of the main information available to the
                      administrative area.
                    </p>
                  </div>

                  <span className={styles.sectionIcon} aria-hidden="true">
                    <FaCompass />
                  </span>
                </div>

                <div className={styles.overviewList}>
                  {platformOverviewItems.map((item) => (
                    <div className={styles.overviewItem} key={item.title}>
                      <span className={styles.overviewIcon} aria-hidden="true">
                        {item.icon}
                      </span>

                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>

                      <span className={item.badgeClass}>{item.badge}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12">
              <section className={styles.contentCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Administration</p>

                    <h2 className={styles.sectionTitle}>
                      Management shortcuts
                    </h2>

                    <p className={styles.sectionDescription}>
                      Open the main Admin sections directly from the dashboard.
                    </p>
                  </div>
                </div>

                <div className={styles.managementGrid}>
                  {managementLinks.map((item) => (
                    <Link
                      href={item.href}
                      className={styles.managementCard}
                      key={item.href}
                    >
                      <span
                        className={styles.managementIcon}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>

                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>

                      <span
                        className={styles.managementArrow}
                        aria-hidden="true"
                      >
                        <FaArrowRight />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12">
              <section className={styles.contentCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Destination catalogue</p>

                    <h2 className={styles.sectionTitle}>
                      Available travel profiles
                    </h2>

                    <p className={styles.sectionDescription}>
                      Preview the destinations currently available for travel
                      planning and personalised recommendations.
                    </p>
                  </div>

                  <Link href="/admin/destinations" className={styles.textLink}>
                    View all destinations
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                </div>

                <div className={styles.destinationGrid}>
                  {featuredDestinations.map((destination) => (
                    <article
                      className={styles.destinationCard}
                      key={destination.destinationId}
                    >
                      <div className={styles.destinationImageWrapper}>
                        {destination.image ? (
                          <Image
                            src={destination.image}
                            alt={`${destination.city}, ${destination.country}`}
                            fill
                            sizes="(max-width: 767px) 100vw, 25vw"
                            className={styles.destinationImage}
                          />
                        ) : (
                          <div className={styles.imageFallback}>
                            <FaLocationDot aria-hidden="true" />
                          </div>
                        )}

                        <div className={styles.destinationOverlay} />

                        <div className={styles.destinationHeading}>
                          <p>{destination.country}</p>
                          <h3>{destination.city}</h3>
                        </div>
                      </div>

                      <div className={styles.destinationBody}>
                        <p>
                          {destination.shortDescription ||
                            "Travel destination available for planning and recommendations."}
                        </p>

                        <div className={styles.destinationMeta}>
                          <span>
                            {(destination.interests || []).length} interests
                          </span>

                          <span>
                            {(destination.bestMonths || []).length} best months
                          </span>
                        </div>

                        <Link
                          href="/admin/destinations"
                          className={styles.destinationLink}
                        >
                          Review destination
                          <FaArrowRight aria-hidden="true" />
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
    </AdminLayout>
  );
}
