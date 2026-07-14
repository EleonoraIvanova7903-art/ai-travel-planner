"use client";

import { useEffect, useState } from "react";
import { mockDestinations } from "@/data/mockDestinations";
import { mockCostRules } from "@/data/mockCostRules";
import { watchAuthState } from "@/firebase/authService";
import { getAdminDashboardData } from "@/firebase/adminService";
import AdminLayout from "../../../shared/layout/AdminLayout";
import styles from "./dashboard.module.css";

/*
  These imports keep the Admin Dashboard connected to Firebase Authentication,
  Firestore dashboard statistics and the shared mock destination and cost data.
  They are intentionally left ready so the Admin participant can create the
  final Dashboard with their own Bootstrap cards, tables, sections and layout
  without rebuilding the project connections or changing src/firebase and src/data.
*/

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
    return "The Admin profile could not be found in Firestore.";
  }

  if (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied"
  ) {
    return "Firestore access was denied. Check the published Firestore rules.";
  }

  return error?.message || "Dashboard data could not be loaded.";
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
        setErrorMessage("Sign in with an Admin account to open this page.");

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getAdminDashboardData();

        if (isActive) {
          setDashboardData(data);
        }
      } catch (error) {
        if (isActive) {
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

  const costTiersCount = Object.keys(
    mockCostRules.foodCostPerDayPerTraveller,
  ).length;

  return (
    <AdminLayout
      pageTitle="Dashboard"
      pageDescription="Build the Admin overview using the prepared Firebase and mock data connections."
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
            Loading dashboard data...
          </div>
        )}

        {!isLoading && !errorMessage && (
          <div className="row g-4">
            <div className="col-12">
              <section className={`card ${styles.handoverCard}`}>
                <div className="card-body p-4 p-lg-5">
                  <span className="badge bg-dark mb-3">
                    Admin development foundation
                  </span>

                  <h2 className="h3 fw-bold text-dark mb-3">
                    Dashboard connections are ready
                  </h2>

                  <p className="text-secondary mb-4">
                    Firebase Authentication, Firestore dashboard statistics and
                    the shared mock travel data are already connected. You can
                    now create the Admin Dashboard in your own design using
                    Bootstrap.
                  </p>

                  <div className="row g-4">
                    <div className="col-12 col-lg-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <h3 className="h5 fw-bold text-dark mb-3">
                          Available Firebase data
                        </h3>

                        <p className="text-secondary mb-3">
                          The following values are loaded through
                          <code className="ms-1">getAdminDashboardData()</code>.
                        </p>

                        <div className="table-responsive">
                          <table className="table table-sm align-middle mb-0">
                            <tbody>
                              <tr>
                                <th scope="row">Saved trips</th>
                                <td className="text-end">
                                  {dashboardData.savedTripsCount}
                                </td>
                              </tr>

                              <tr>
                                <th scope="row">Traveller accounts</th>
                                <td className="text-end">
                                  {dashboardData.travellersCount}
                                </td>
                              </tr>

                              <tr>
                                <th scope="row">Admin accounts</th>
                                <td className="text-end">
                                  {dashboardData.adminAccountsCount}
                                </td>
                              </tr>

                              <tr>
                                <th scope="row">Active accounts</th>
                                <td className="text-end">
                                  {dashboardData.activeAccountsCount}
                                </td>
                              </tr>

                              <tr>
                                <th scope="row">Total users</th>
                                <td className="text-end">
                                  {dashboardData.totalUsersCount}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-6">
                      <div className={`h-100 p-4 ${styles.infoBlock}`}>
                        <h3 className="h5 fw-bold text-dark mb-3">
                          Available mock data
                        </h3>

                        <p className="text-secondary mb-3">
                          The Dashboard can use the prepared destination and
                          cost reference data without importing or duplicating
                          it again.
                        </p>

                        <div className="table-responsive">
                          <table className="table table-sm align-middle mb-0">
                            <tbody>
                              <tr>
                                <th scope="row">Destination profiles</th>
                                <td className="text-end">
                                  {mockDestinations.length}
                                </td>
                              </tr>

                              <tr>
                                <th scope="row">Spending tiers</th>
                                <td className="text-end">{costTiersCount}</td>
                              </tr>

                              <tr>
                                <th scope="row">Destination source</th>
                                <td className="text-end">
                                  <code>mockDestinations</code>
                                </td>
                              </tr>

                              <tr>
                                <th scope="row">Cost source</th>
                                <td className="text-end">
                                  <code>mockCostRules</code>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-primary mt-4 mb-0" role="note">
                    You are free to create the final Dashboard layout, statistic
                    cards, recent activity, tables, charts and navigation
                    shortcuts. Bootstrap should remain the main UI library. Do
                    not change the shared files inside
                    <code className="mx-1">src/firebase</code>
                    or
                    <code className="ms-1">src/data</code>.
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
