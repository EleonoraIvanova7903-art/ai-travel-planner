import {
  FaBrain,
  FaCircleCheck,
  FaCircleQuestion,
  FaCompass,
  FaLightbulb,
  FaLocationDot,
  FaRoute,
  FaTriangleExclamation,
  FaWandSparkles,
} from "react-icons/fa6";
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

function getPromptTypeDetails(promptType) {
  if (promptType === "recommendation-explanation") {
    return {
      icon: FaCompass,
      description: "Destination recommendation guidance",
    };
  }

  if (promptType === "budget-advice") {
    return {
      icon: FaLightbulb,
      description: "Trip budget recommendations",
    };
  }

  if (promptType === "itinerary") {
    return {
      icon: FaRoute,
      description: "Day-by-day itinerary planning",
    };
  }

  if (promptType === "itinerary-refinement") {
    return {
      icon: FaWandSparkles,
      description: "Traveller-requested itinerary changes",
    };
  }

  return {
    icon: FaBrain,
    description: "TravelMind AI activity",
  };
}

function getStatusDetails(status) {
  const normalisedStatus = String(status || "").toLowerCase();

  if (normalisedStatus === "completed") {
    return {
      label: "Completed",
      className: styles.statusCompleted,
      icon: FaCircleCheck,
    };
  }

  if (normalisedStatus === "failed") {
    return {
      label: "Failed",
      className: styles.statusFailed,
      icon: FaTriangleExclamation,
    };
  }

  if (normalisedStatus === "pending") {
    return {
      label: "Pending",
      className: styles.statusPending,
      icon: FaCircleQuestion,
    };
  }

  return {
    label: status ? String(status) : "Unknown",
    className: styles.statusDefault,
    icon: FaCircleQuestion,
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
      <div className={styles.emptyState}>
        <span
          className={`${styles.emptyStateIcon} d-inline-flex align-items-center justify-content-center mb-3`}
          aria-hidden="true"
        >
          <FaBrain />
        </span>

        <h3 className={`${styles.emptyStateTitle} mb-2`}>
          No AI activity available
        </h3>

        <p className={`${styles.emptyStateText} mb-0`}>
          Activity records will appear after Travellers use recommendation,
          itinerary or budget-support functions.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className={`table align-middle mb-0 ${styles.logsTable}`}>
        <thead>
          <tr>
            <th scope="col">AI function</th>
            <th scope="col">Destination</th>
            <th scope="col">Status</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log, index) => {
            const statusDetails = getStatusDetails(log.status);
            const promptTypeDetails = getPromptTypeDetails(log.promptType);
            const PromptTypeIcon = promptTypeDetails.icon;
            const StatusIcon = statusDetails.icon;

            const destinationDetails = getDestinationDetails(
              log.selectedDestination,
            );

            return (
              <tr key={log.id || `${log.promptType || "activity"}-${index}`}>
                <td>
                  <div className={styles.logTypeCell}>
                    <span
                      className={`${styles.logTypeIcon} d-inline-flex align-items-center justify-content-center`}
                      aria-hidden="true"
                    >
                      <PromptTypeIcon />
                    </span>

                    <div>
                      <strong className={styles.logTypeTitle}>
                        {formatPromptType(log.promptType)}
                      </strong>

                      <p className={styles.logTypeDescription}>
                        {promptTypeDetails.description}
                      </p>
                    </div>
                  </div>
                </td>

                <td>
                  {destinationDetails ? (
                    <span
                      className={styles.destinationValue}
                      title={destinationDetails.title}
                    >
                      <FaLocationDot aria-hidden="true" />
                      {destinationDetails.label}
                    </span>
                  ) : (
                    <span className={styles.notAvailable}>
                      No destination selected
                    </span>
                  )}
                </td>

                <td>
                  <span
                    className={`${styles.statusBadge} ${statusDetails.className}`}
                  >
                    <StatusIcon aria-hidden="true" />
                    {statusDetails.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
