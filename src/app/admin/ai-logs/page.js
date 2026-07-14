"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBrain,
  FaClockRotateLeft,
  FaFileLines,
  FaListCheck,
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
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return error?.message || "AI logs could not be loaded.";
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
          setLogs(loadedLogs);
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
      unsubscribe();
    };
  }, []);

  const overview = useMemo(() => {
    const completedRequests = logs.filter(
      (log) => log.status === "completed",
    ).length;

    const failedRequests = logs.filter((log) => log.status === "failed").length;

    const uniqueUsers = new Set(logs.map((log) => log.userId).filter(Boolean))
      .size;

    return {
      totalRequests: logs.length,
      completedRequests,
      failedRequests,
      uniqueUsers,
    };
  }, [logs]);

  async function handleRefresh() {
    try {
      setIsRefreshing(true);
      setErrorMessage("");

      const loadedLogs = await getAiLogs(100);

      setLogs(loadedLogs);
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
      <div className="container-fluid p-0">
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
            Loading AI request records...
          </div>
        )}

        {!isLoading && (
          <>
            <div className="row g-4 mb-4">
              <div className="col-12 col-md-6">
                <section className={`card h-100 ${styles.overviewCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className={`${styles.cardLabel} mb-2`}>
                          AI activity
                        </p>

                        <h2 className={`${styles.cardTitle} mb-2`}>
                          {overview.totalRequests} requests
                        </h2>

                        <p className={`${styles.cardText} mb-0`}>
                          AI recommendation, itinerary and budget requests
                          recorded in Firestore.
                        </p>
                      </div>

                      <span
                        className={`${styles.cardIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaBrain />
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-12 col-md-6">
                <section className={`card h-100 ${styles.overviewCard}`}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <p className={`${styles.cardLabel} mb-2`}>
                          Monitoring overview
                        </p>

                        <h2 className={`${styles.cardTitle} mb-2`}>
                          {overview.completedRequests} completed
                        </h2>

                        <p className={`${styles.cardText} mb-0`}>
                          {overview.failedRequests} failed requests from{" "}
                          {overview.uniqueUsers} unique users.
                        </p>
                      </div>

                      <span
                        className={`${styles.cardIcon} d-inline-flex align-items-center justify-content-center`}
                      >
                        <FaClockRotateLeft />
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-12 col-xl-8">
                <section className={`card h-100 ${styles.logsCard}`}>
                  <div className="card-body p-4 p-lg-5">
                    <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3 mb-4">
                      <div>
                        <p className={`${styles.cardLabel} mb-2`}>
                          Activity log
                        </p>

                        <h2 className={`${styles.sectionTitle} mb-0`}>
                          AI request records
                        </h2>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
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
                            "Refresh"
                          )}
                        </button>

                        <span
                          className={`${styles.sectionIcon} d-inline-flex align-items-center justify-content-center`}
                        >
                          <FaFileLines />
                        </span>
                      </div>
                    </div>

                    <AiLogsTable logs={logs} />
                  </div>
                </section>
              </div>

              <div className="col-12 col-xl-4">
                <aside className={`card h-100 ${styles.informationCard}`}>
                  <div className="card-body p-4 p-lg-5">
                    <span
                      className={`${styles.informationIcon} d-inline-flex align-items-center justify-content-center mb-4`}
                    >
                      <FaWandSparkles />
                    </span>

                    <p className={`${styles.cardLabel} mb-2`}>
                      Tracked functions
                    </p>

                    <h2 className={`${styles.informationTitle} mb-3`}>
                      AI activity categories
                    </h2>

                    <p className={`${styles.informationText} mb-4`}>
                      Each record identifies which AI-supported function was
                      requested and whether it completed successfully.
                    </p>

                    <div className="list-group list-group-flush">
                      <div
                        className={`list-group-item px-0 py-3 ${styles.informationItem}`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className={`${styles.listIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaListCheck />
                          </span>

                          <span>Recommendation explanations</span>
                        </div>
                      </div>

                      <div
                        className={`list-group-item px-0 py-3 ${styles.informationItem}`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className={`${styles.listIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaWandSparkles />
                          </span>

                          <span>Itinerary generation and refinement</span>
                        </div>
                      </div>

                      <div
                        className={`list-group-item px-0 py-3 ${styles.informationItem}`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className={`${styles.listIcon} d-inline-flex align-items-center justify-content-center`}
                          >
                            <FaBrain />
                          </span>

                          <span>Budget-saving advice</span>
                        </div>
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
