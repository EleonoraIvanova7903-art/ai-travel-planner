import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { FIRESTORE_COLLECTIONS } from "./firestoreCollections";
import { getUserProfile } from "./userService";

export const ADMIN_SETTINGS_DOCUMENTS = Object.freeze({
  COST_SETTINGS: "cost-settings",
  RECOMMENDATION_RULES: "recommendation-rules",
});

function createServiceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getTimestampMilliseconds(value) {
  if (value?.toMillis) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsedValue = Date.parse(value);

  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function requireAuthenticatedUser() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw createServiceError(
      "auth/required",
      "You must be signed in to access the planning settings.",
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

  return {
    authUser: currentUser,
    profile,
  };
}

async function readAdminSetting(documentId) {
  const settingReference = doc(
    db,
    FIRESTORE_COLLECTIONS.ADMIN_SETTINGS,
    documentId,
  );

  const settingSnapshot = await getDoc(settingReference);

  if (!settingSnapshot.exists()) {
    return null;
  }

  return {
    id: settingSnapshot.id,
    ...settingSnapshot.data(),
  };
}

async function getAdminSetting(documentId) {
  await requireAdminUser();

  return readAdminSetting(documentId);
}

async function getPlanningSetting(documentId) {
  requireAuthenticatedUser();

  return readAdminSetting(documentId);
}

async function updateAdminSetting(documentId, settings) {
  const { authUser } = await requireAdminUser();

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error("Admin settings must be provided as an object.");
  }

  const settingReference = doc(
    db,
    FIRESTORE_COLLECTIONS.ADMIN_SETTINGS,
    documentId,
  );

  await setDoc(
    settingReference,
    {
      ...settings,
      updatedBy: authUser.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const updatedSnapshot = await getDoc(settingReference);

  return {
    id: updatedSnapshot.id,
    ...updatedSnapshot.data(),
  };
}

export function getCostSettings() {
  return getAdminSetting(ADMIN_SETTINGS_DOCUMENTS.COST_SETTINGS);
}

export function updateCostSettings(settings) {
  return updateAdminSetting(ADMIN_SETTINGS_DOCUMENTS.COST_SETTINGS, settings);
}

export function getRecommendationRules() {
  return getAdminSetting(ADMIN_SETTINGS_DOCUMENTS.RECOMMENDATION_RULES);
}

export function updateRecommendationRules(settings) {
  return updateAdminSetting(
    ADMIN_SETTINGS_DOCUMENTS.RECOMMENDATION_RULES,
    settings,
  );
}

export function getPlanningCostSettings() {
  return getPlanningSetting(ADMIN_SETTINGS_DOCUMENTS.COST_SETTINGS);
}

export function getPlanningRecommendationRules() {
  return getPlanningSetting(ADMIN_SETTINGS_DOCUMENTS.RECOMMENDATION_RULES);
}

export async function getAllUsers() {
  await requireAdminUser();

  const [usersSnapshot, savedTripsSnapshot] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.USERS)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.SAVED_TRIPS)),
  ]);

  const savedTripTotals = savedTripsSnapshot.docs.reduce(
    (totals, tripDocument) => {
      const userId = tripDocument.data().userId;

      if (userId) {
        totals[userId] = (totals[userId] || 0) + 1;
      }

      return totals;
    },
    {},
  );

  return usersSnapshot.docs
    .map((userDocument) => ({
      id: userDocument.id,
      ...userDocument.data(),
      savedTripsCount: savedTripTotals[userDocument.id] || 0,
    }))
    .sort(
      (firstUser, secondUser) =>
        getTimestampMilliseconds(secondUser.createdAt) -
        getTimestampMilliseconds(firstUser.createdAt),
    );
}

export async function getAdminDashboardData() {
  await requireAdminUser();

  const [usersSnapshot, savedTripsSnapshot] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.USERS)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.SAVED_TRIPS)),
  ]);

  const users = usersSnapshot.docs.map((userDocument) => userDocument.data());

  return {
    savedTripsCount: savedTripsSnapshot.size,

    travellersCount: users.filter((user) => user.role === "traveller").length,

    adminAccountsCount: users.filter((user) => user.role === "admin").length,

    activeAccountsCount: users.filter((user) => user.accountStatus === "active")
      .length,

    totalUsersCount: usersSnapshot.size,
  };
}
