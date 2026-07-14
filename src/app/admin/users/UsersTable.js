"use client";

import { useMemo, useState } from "react";
import {
  FaCalendarDays,
  FaCircleCheck,
  FaEnvelope,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaSuitcaseRolling,
  FaUser,
  FaUsers,
} from "react-icons/fa6";
import styles from "./users.module.css";

function normaliseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getUserName(user) {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unnamed account";
}

function getUserInitial(user) {
  const name = getUserName(user);

  if (name === "Unnamed account") {
    return "U";
  }

  return name.charAt(0).toUpperCase();
}

function getCreatedDate(createdAt) {
  if (!createdAt) {
    return null;
  }

  if (typeof createdAt.toDate === "function") {
    return createdAt.toDate();
  }

  if (Number.isFinite(Number(createdAt.seconds))) {
    return new Date(Number(createdAt.seconds) * 1000);
  }

  if (createdAt instanceof Date) {
    return createdAt;
  }

  const parsedDate = new Date(createdAt);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatCreatedAt(createdAt) {
  const createdDate = getCreatedDate(createdAt);

  if (!createdDate) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(createdDate);
}

function getRoleDetails(role) {
  const normalisedRole = normaliseValue(role);

  if (normalisedRole === "admin") {
    return {
      label: "Admin",
      className: styles.roleAdmin,
    };
  }

  if (normalisedRole === "traveller") {
    return {
      label: "Traveller",
      className: styles.roleTraveller,
    };
  }

  return {
    label: role || "Unknown role",
    className: styles.roleDefault,
  };
}

function getStatusDetails(status) {
  const normalisedStatus = normaliseValue(status);

  if (normalisedStatus === "active") {
    return {
      label: "Active",
      className: styles.statusActive,
    };
  }

  if (normalisedStatus === "inactive") {
    return {
      label: "Inactive",
      className: styles.statusInactive,
    };
  }

  if (normalisedStatus === "suspended" || normalisedStatus === "blocked") {
    return {
      label: normalisedStatus === "blocked" ? "Blocked" : "Suspended",
      className: styles.statusSuspended,
    };
  }

  return {
    label: status || "Unknown status",
    className: styles.statusDefault,
  };
}

export default function UsersTable({ users = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const availableRoles = useMemo(
    () =>
      [
        ...new Set(
          users.map((user) => normaliseValue(user.role)).filter(Boolean),
        ),
      ].sort(),
    [users],
  );

  const availableStatuses = useMemo(
    () =>
      [
        ...new Set(
          users
            .map((user) => normaliseValue(user.accountStatus))
            .filter(Boolean),
        ),
      ].sort(),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalisedSearchTerm = normaliseValue(searchTerm);

    return users.filter((user) => {
      const userName = normaliseValue(getUserName(user));
      const userEmail = normaliseValue(user.email);
      const userRole = normaliseValue(user.role);
      const userStatus = normaliseValue(user.accountStatus);

      const matchesSearch =
        !normalisedSearchTerm ||
        userName.includes(normalisedSearchTerm) ||
        userEmail.includes(normalisedSearchTerm);

      const matchesRole = roleFilter === "all" || userRole === roleFilter;

      const matchesStatus =
        statusFilter === "all" || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  function handleClearFilters() {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  return (
    <section className={`card ${styles.usersSection}`}>
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-xl-row align-items-xl-start justify-content-between gap-3 mb-4">
          <div>
            <p className={styles.sectionLabel}>Registered accounts</p>

            <h2 className="h4 fw-bold text-dark mb-2">User directory</h2>

            <p className="text-secondary mb-0">
              Review Traveller and Admin accounts, account status and saved-trip
              activity.
            </p>
          </div>

          <span className={`badge rounded-pill ${styles.resultBadge}`}>
            <FaUsers className="me-2" />
            {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        <div className={`p-3 p-lg-4 mb-4 ${styles.filterPanel}`}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-6">
              <label htmlFor="users-search" className={styles.filterLabel}>
                Search accounts
              </label>

              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaMagnifyingGlass />
                </span>

                <input
                  id="users-search"
                  type="search"
                  className="form-control"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-5 col-lg-2">
              <label htmlFor="users-role-filter" className={styles.filterLabel}>
                Role
              </label>

              <select
                id="users-role-filter"
                className="form-select"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="all">All roles</option>

                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-5 col-lg-2">
              <label
                htmlFor="users-status-filter"
                className={styles.filterLabel}
              >
                Status
              </label>

              <select
                id="users-status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>

                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2 col-lg-2">
              <button
                type="button"
                className="btn btn-outline-dark w-100"
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div
            className={`d-flex flex-column align-items-center justify-content-center text-center p-5 ${styles.emptyState}`}
          >
            <span
              className={`d-inline-flex align-items-center justify-content-center mb-3 ${styles.emptyStateIcon}`}
            >
              <FaUser />
            </span>

            <h3 className="h5 fw-bold text-dark mb-2">No matching accounts</h3>

            <p className="text-secondary mb-3">
              No user records match the current search and filter options.
            </p>

            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredUsers.map((user) => {
              const roleDetails = getRoleDetails(user.role);

              const statusDetails = getStatusDetails(user.accountStatus);

              const savedTripsCount = Number(user.savedTripsCount || 0);

              return (
                <div
                  key={user.id || user.email}
                  className="col-12 col-md-6 col-xxl-4"
                >
                  <article className={`card h-100 ${styles.userCard}`}>
                    <div className="card-body d-flex flex-column p-4">
                      <div className="d-flex align-items-start gap-3 mb-4">
                        <span
                          className={`d-inline-flex align-items-center justify-content-center flex-shrink-0 ${styles.userAvatar}`}
                        >
                          {getUserInitial(user)}
                        </span>

                        <div className="min-w-0 flex-grow-1">
                          <h3 className={`h5 fw-bold mb-1 ${styles.userName}`}>
                            {getUserName(user)}
                          </h3>

                          <p className={`small mb-0 ${styles.userEmail}`}>
                            <FaEnvelope className="me-2" />
                            {user.email || "No email available"}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mb-4">
                        <span
                          className={`badge rounded-pill ${styles.roleBadge} ${roleDetails.className}`}
                        >
                          <FaShieldHalved className="me-1" />
                          {roleDetails.label}
                        </span>

                        <span
                          className={`badge rounded-pill ${styles.statusBadge} ${statusDetails.className}`}
                        >
                          <FaCircleCheck className="me-1" />
                          {statusDetails.label}
                        </span>
                      </div>

                      <div className={styles.userDetails}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>
                            <FaSuitcaseRolling />
                          </span>

                          <div>
                            <p className={styles.detailLabel}>Saved trips</p>

                            <p className={styles.detailValue}>
                              {savedTripsCount}
                            </p>
                          </div>
                        </div>

                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>
                            <FaCalendarDays />
                          </span>

                          <div>
                            <p className={styles.detailLabel}>Registered</p>

                            <p className={styles.detailValue}>
                              {formatCreatedAt(user.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
