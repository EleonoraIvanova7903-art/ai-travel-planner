"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBrain,
  FaCircleCheck,
  FaFileLines,
  FaListCheck,
  FaRotate,
  FaTriangleExclamation,
  FaUserGroup,
  FaWandSparkles,
} from "react-icons/fa6";
import { watchAuthState } from "@/firebase/authService";
import { getAiLogs } from "@/firebase/logService";
import AdminLayout from "../../../shared/layout/AdminLayout";
import AiLogsTable from "./AiLogsTable";
import styles from "./ai-logs.module.css";

function getAiLogsErrorMessage(error) {
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
    return "Access to the AI activity records was denied.";
  }

  return error?.message || "AI activity records could not be loaded.";
}

export default function AiLogsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      if (!authUser) {
        setLogs([]);
        setErrorMessage("Sign in with an Admin account to open this page.");
        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const loadedLogs = await getAiLogs(100);

        if (isActive) {
          setLogs(Array.isArray(loadedLogs) ? loadedLogs : []);
        }
      } catch (error) {
        if (isActive) {
          setLogs([]);
          setErrorMessage(getAiLogsErrorMessage(error));
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

  const overview = useMemo(() => {
    const completedRequests = logs.filter(
      (log) => String(log.status || "").toLowerCase() === "completed",
    ).length;

    const failedRequests = logs.filter(
      (log) => String(log.status || "").toLowerCase() === "failed",
    ).length;

    const uniqueUsers = new Set(logs.map((log) => log.userId).filter(Boolean))
      .size;

    return {
      totalRequests: logs.length,
      completedRequests,
      failedRequests,
      uniqueUsers,
    };
  }, [logs]);

  const summaryCards = [
    {
      id: "total-activity",
      label: "Total activity",
      value: overview.totalRequests,
      description: "Recorded AI-supported requests",
      icon: FaBrain,
    },
    {
      id: "completed-activity",
      label: "Completed",
      value: overview.completedRequests,
      description: "Successfully completed requests",
      icon: FaCircleCheck,
    },
    {
      id: "failed-activity",
      label: "Failed",
      value: overview.failedRequests,
      description: "Requests that were not completed",
      icon: FaTriangleExclamation,
    },
    {
      id: "active-users",
      label: "Users",
      value: overview.uniqueUsers,
      description: "Users represented in the activity",
      icon: FaUserGroup,
    },
  ];

  async function handleRefresh() {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      setErrorMessage("");

      const loadedLogs = await getAiLogs(100);

      setLogs(Array.isArray(loadedLogs) ? loadedLogs : []);
    } catch (error) {
      setErrorMessage(getAiLogsErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <AdminLayout
      pageTitle="AI Logs"
      pageDescription="Review AI-supported recommendation, itinerary and budget activity."
    >
      <div className={`container-fluid p-0 ${styles.pageRoot}`}>
        {errorMessage && (
          <div className={`${styles.errorMessage} mb-4`} role="alert">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div
            className={`${styles.loadingMessage} d-flex align-items-center gap-3 mb-4`}
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>Loading AI activity records...</span>
          </div>
        )}

        {!isLoading && (
          <>
            <section className={`${styles.pageIntro} mb-4`}>
              <div className="row g-4 align-items-center">
                <div className="col-12 col-xl-8">
                  <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                    <span
                      className={`${styles.pageIntroIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                      aria-hidden="true"
                    >
                      <FaBrain />
                    </span>

                    <div>
                      <p className={`${styles.pageIntroLabel} mb-2`}>
                        AI activity monitoring
                      </p>

                      <h2 className={`${styles.pageIntroTitle} mb-3`}>
                        Review TravelMind AI activity
                      </h2>

                      <p className={`${styles.pageIntroText} mb-0`}>
                        Review recommendation explanations, itinerary
                        generation, itinerary refinement and budget advice
                        activity from one administrative page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-4">
                  <div className={styles.pageIntroSummary}>
                    <span>Current activity overview</span>

                    <strong>
                      {overview.completedRequests} of {overview.totalRequests}
                    </strong>

                    <p>
                      Recorded requests that completed successfully within the
                      available activity list.
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

                          <p className={styles.summaryText}>
                            {card.description}
                          </p>
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

            <div className="row g-4">
              <div className="col-12 col-xl-8">
                <section className={`${styles.logsCard} h-100`}>
                  <div className={styles.logsHeader}>
                    <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-4">
                      <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                        <span
                          className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center flex-shrink-0`}
                          aria-hidden="true"
                        >
                          <FaFileLines />
                        </span>

                        <div>
                          <p className={`${styles.cardLabel} mb-2`}>
                            Activity records
                          </p>

                          <h2 className={`${styles.sectionTitle} mb-2`}>
                            AI request overview
                          </h2>

                          <p className={`${styles.sectionText} mb-0`}>
                            Review the requested AI function, selected
                            destination and completion status.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`${styles.refreshButton} btn flex-shrink-0`}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <FaRotate className="me-2" aria-hidden="true" />
                            Refresh records
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={styles.logsBody}>
                    <AiLogsTable logs={logs} />
                  </div>
                </section>
              </div>

              <div className="col-12 col-xl-4">
                <aside className={`${styles.informationCard} h-100`}>
                  <span
                    className={`${styles.informationIcon} d-inline-flex align-items-center justify-content-center mb-4`}
                    aria-hidden="true"
                  >
                    <FaWandSparkles />
                  </span>

                  <p className={`${styles.informationLabel} mb-2`}>
                    Activity categories
                  </p>

                  <h2 className={`${styles.informationTitle} mb-3`}>
                    Supported AI functions
                  </h2>

                  <p className={`${styles.informationText} mb-4`}>
                    The activity records identify the TravelMind AI function
                    requested by a Traveller and whether the request completed
                    successfully.
                  </p>

                  <div className={styles.informationList}>
                    <div className={styles.informationItem}>
                      <span
                        className={`${styles.listIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        <FaListCheck />
                      </span>

                      <div>
                        <strong>Recommendation explanations</strong>
                        <p>Personalised destination guidance</p>
                      </div>
                    </div>

                    <div className={styles.informationItem}>
                      <span
                        className={`${styles.listIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        <FaWandSparkles />
                      </span>

                      <div>
                        <strong>Itinerary planning</strong>
                        <p>Generation and Traveller-requested refinement</p>
                      </div>
                    </div>

                    <div className={styles.informationItem}>
                      <span
                        className={`${styles.listIcon} d-inline-flex align-items-center justify-content-center`}
                        aria-hidden="true"
                      >
                        <FaBrain />
                      </span>

                      <div>
                        <strong>Budget advice</strong>
                        <p>Practical trip budget recommendations</p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
