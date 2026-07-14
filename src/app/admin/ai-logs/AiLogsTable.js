import { FaBrain } from "react-icons/fa6";
import styles from "./ai-logs.module.css";

function formatPromptType(promptType) {
  const promptTypeLabels = {
    "recommendation-explanation": "Recommendation explanation",
    "budget-advice": "Budget advice",
    itinerary: "Itinerary generation",
    "itinerary-refinement": "Itinerary refinement",
  };

  if (promptTypeLabels[promptType]) {
    return promptTypeLabels[promptType];
  }

  return String(promptType || "Unknown request")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(createdDate);
}

function getStatusDetails(status) {
  const normalisedStatus = String(status || "").toLowerCase();

  if (normalisedStatus === "completed") {
    return {
      label: "Completed",
      className: "bg-success",
    };
  }

  if (normalisedStatus === "failed") {
    return {
      label: "Failed",
      className: "bg-danger",
    };
  }

  if (normalisedStatus === "pending") {
    return {
      label: "Pending",
      className: "bg-warning text-dark",
    };
  }

  return {
    label: status ? String(status) : "Unknown",
    className: "bg-secondary",
  };
}

function getDestinationDetails(selectedDestination) {
  if (!selectedDestination) {
    return null;
  }

  if (typeof selectedDestination === "string") {
    return {
      label: selectedDestination,
      title: selectedDestination,
    };
  }

  if (
    typeof selectedDestination === "object" &&
    !Array.isArray(selectedDestination)
  ) {
    const city =
      typeof selectedDestination.city === "string"
        ? selectedDestination.city.trim()
        : "";

    const country =
      typeof selectedDestination.country === "string"
        ? selectedDestination.country.trim()
        : "";

    const destinationId =
      typeof selectedDestination.destinationId === "string"
        ? selectedDestination.destinationId.trim()
        : "";

    let label = "";

    if (city && country) {
      label = `${city}, ${country}`;
    } else if (city) {
      label = city;
    } else if (country) {
      label = country;
    } else if (destinationId) {
      label = destinationId;
    }

    if (!label) {
      return null;
    }

    return {
      label,
      title: destinationId || label,
    };
  }

  return {
    label: String(selectedDestination),
    title: String(selectedDestination),
  };
}

export default function AiLogsTable({ logs = [] }) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return (
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan="3">
                <div
                  className={`${styles.emptyState} d-flex flex-column align-items-center justify-content-center text-center p-4 p-md-5`}
                >
                  <span
                    className={`${styles.emptyStateIcon} d-inline-flex align-items-center justify-content-center mb-3`}
                  >
                    <FaBrain />
                  </span>

                  <h3 className={`${styles.emptyStateTitle} mb-2`}>
                    No AI logs available
                  </h3>

                  <p className={`${styles.emptyStateText} mb-0`}>
                    AI request records will appear here after travellers use the
                    recommendation, itinerary and budget AI functions.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => {
            const statusDetails = getStatusDetails(log.status);

            const destinationDetails = getDestinationDetails(
              log.selectedDestination,
            );

            return (
              <tr key={log.id}>
                <td>
                  <div className="fw-semibold text-dark">
                    {formatPromptType(log.promptType)}
                  </div>

                  {destinationDetails && (
                    <div
                      className="small text-secondary mt-1"
                      title={destinationDetails.title}
                    >
                      {destinationDetails.label}
                    </div>
                  )}
                </td>

                <td>
                  <span className={`badge ${statusDetails.className}`}>
                    {statusDetails.label}
                  </span>
                </td>

                <td className="text-nowrap">
                  {formatCreatedAt(log.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
