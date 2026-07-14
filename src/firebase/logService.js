import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { FIRESTORE_COLLECTIONS } from "./firestoreCollections";
import { getUserProfile } from "./userService";

function createServiceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requireAuthenticatedUser() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw createServiceError(
      "auth/required",
      "You must be signed in to record AI activity.",
    );
  }

  return currentUser;
}

async function requireAdminUser() {
  const currentUser = requireAuthenticatedUser();

  const profile = await getUserProfile(currentUser.uid);

  if (!profile) {
    throw createServiceError(
      "profile/not-found",
      "No Firestore profile was found for this account.",
    );
  }

  if (profile.role !== "admin" || profile.accountStatus !== "active") {
    throw createServiceError(
      "admin/access-denied",
      "This account does not have active Admin access.",
    );
  }

  return currentUser;
}

function normaliseMaximumResults(maximumResults) {
  const parsedValue = Number(maximumResults);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 50;
  }

  return Math.min(parsedValue, 200);
}

export async function createAiLog(logData) {
  const currentUser = requireAuthenticatedUser();

  if (!logData || typeof logData !== "object" || Array.isArray(logData)) {
    throw new Error("AI log data must be provided as an object.");
  }

  if (!logData.promptType) {
    throw new Error("AI log promptType is required.");
  }

  const logReference = await addDoc(
    collection(db, FIRESTORE_COLLECTIONS.AI_LOGS),
    {
      userId: currentUser.uid,
      tripId: logData.tripId || null,
      promptType: logData.promptType,
      selectedDestination: logData.selectedDestination || null,
      requestSummary: logData.requestSummary || "",
      generatedContentType: logData.generatedContentType || "",
      status: logData.status || "completed",
      createdAt: serverTimestamp(),
    },
  );

  return {
    id: logReference.id,
  };
}

export async function getAiLogs(maximumResults = 50) {
  await requireAdminUser();

  const aiLogsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.AI_LOGS),
    orderBy("createdAt", "desc"),
    limit(normaliseMaximumResults(maximumResults)),
  );

  const aiLogsSnapshot = await getDocs(aiLogsQuery);

  return aiLogsSnapshot.docs.map((logDoc) => ({
    id: logDoc.id,
    ...logDoc.data(),
  }));
}

export async function getAiLogsOverview(maximumResults = 200) {
  const logs = await getAiLogs(maximumResults);

  return {
    totalRequests: logs.length,
    completedRequests: logs.filter((log) => log.status === "completed").length,
    failedRequests: logs.filter((log) => log.status === "failed").length,
    uniqueUsers: new Set(logs.map((log) => log.userId).filter(Boolean)).size,
  };
}
