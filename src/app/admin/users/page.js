"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaCircleCheck,
  FaShieldHalved,
  FaSuitcaseRolling,
  FaUserGroup,
} from "react-icons/fa6";
import { watchAuthState } from "@/firebase/authService";
import { getAllUsers } from "@/firebase/adminService";
import AdminLayout from "../../../shared/layout/AdminLayout";
import UsersTable from "./UsersTable";
import styles from "./users.module.css";

function getUsersErrorMessage(error) {
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

  return error?.message || "User records could not be loaded.";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!isActive) {
        return;
      }

      if (!authUser) {
        setUsers([]);
        setErrorMessage("Sign in with an Admin account to open this page.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const userRecords = await getAllUsers();

        if (isActive) {
          setUsers(userRecords);
        }
      } catch (error) {
        if (isActive) {
          setUsers([]);
          setErrorMessage(getUsersErrorMessage(error));
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

  const accountTotals = useMemo(() => {
    const travellers = users.filter(
      (user) => String(user.role || "").toLowerCase() === "traveller",
    ).length;

    const admins = users.filter(
      (user) => String(user.role || "").toLowerCase() === "admin",
    ).length;

    const active = users.filter(
      (user) => String(user.accountStatus || "").toLowerCase() === "active",
    ).length;

    const savedTrips = users.reduce(
      (total, user) => total + Number(user.savedTripsCount || 0),
      0,
    );

    return {
      total: users.length,
      travellers,
      admins,
      active,
      savedTrips,
    };
  }, [users]);

  const summaryCards = [
    {
      id: "total-accounts",
      label: "Total accounts",
      value: accountTotals.total,
      description: `${accountTotals.active} active accounts`,
      icon: FaUserGroup,
    },
    {
      id: "traveller-accounts",
      label: "Traveller accounts",
      value: accountTotals.travellers,
      description: "Registered travel planners",
      icon: FaCircleCheck,
    },
    {
      id: "admin-accounts",
      label: "Admin accounts",
      value: accountTotals.admins,
      description: "Accounts with Admin access",
      icon: FaShieldHalved,
    },
    {
      id: "saved-trips",
      label: "Saved trips",
      value: accountTotals.savedTrips,
      description: "Trips saved by all users",
      icon: FaSuitcaseRolling,
    },
  ];

  return (
    <AdminLayout
      pageTitle="Users"
      pageDescription="Review registered accounts, roles, account status and saved-trip activity."
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
            Loading user records...
          </div>
        )}

        {!isLoading && !errorMessage && (
          <>
            <div className="row g-4 mb-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div key={card.id} className="col-12 col-sm-6 col-xl-3">
                    <section className={`card h-100 ${styles.summaryCard}`}>
                      <div className="card-body p-4">
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div>
                            <p className={styles.summaryLabel}>{card.label}</p>

                            <h2 className={styles.summaryValue}>
                              {card.value}
                            </h2>

                            <p className={styles.summaryText}>
                              {card.description}
                            </p>
                          </div>

                          <span
                            className={`d-inline-flex align-items-center justify-content-center flex-shrink-0 ${styles.summaryIcon}`}
                          >
                            <Icon />
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>

            <UsersTable users={users} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
