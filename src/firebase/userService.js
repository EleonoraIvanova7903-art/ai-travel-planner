import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { FIRESTORE_COLLECTIONS } from "./firestoreCollections";

function splitFullName(fullName) {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" "),
  };
}

export async function createTravellerProfile(authUser, fullName) {
  if (!authUser?.uid || !authUser?.email) {
    throw new Error("Authenticated user data is missing.");
  }

  const { firstName, lastName } = splitFullName(fullName);

  const userReference = doc(db, FIRESTORE_COLLECTIONS.USERS, authUser.uid);

  const profileData = {
    email: authUser.email,
    firstName,
    lastName,
    role: "traveller",
    accountStatus: "active",
    preferredDepartureAirportCode: "",
    preferredSpendingTier: "",
    travelInterests: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userReference, profileData);

  return {
    id: authUser.uid,
    ...profileData,
  };
}

export async function getUserProfile(userId) {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const userReference = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);

  const userSnapshot = await getDoc(userReference);

  if (!userSnapshot.exists()) {
    return null;
  }

  return {
    id: userSnapshot.id,
    ...userSnapshot.data(),
  };
}

export async function updateUserProfile(userId, profileUpdates) {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const firstName = String(profileUpdates?.firstName || "").trim();
  const lastName = String(profileUpdates?.lastName || "").trim();

  if (!firstName || !lastName) {
    const error = new Error("First name and last name are required.");
    error.code = "profile/invalid-name";
    throw error;
  }

  const preferredDepartureAirportCode = String(
    profileUpdates?.preferredDepartureAirportCode || "",
  )
    .trim()
    .toUpperCase();

  const preferredSpendingTier = String(
    profileUpdates?.preferredSpendingTier || "",
  ).trim();

  const travelInterests = Array.isArray(profileUpdates?.travelInterests)
    ? [
        ...new Set(
          profileUpdates.travelInterests
            .map((interest) => String(interest).trim())
            .filter(Boolean),
        ),
      ]
    : [];

  const userReference = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);

  const updatedProfileData = {
    firstName,
    lastName,
    preferredDepartureAirportCode,
    preferredSpendingTier,
    travelInterests,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userReference, updatedProfileData);

  return {
    id: userId,
    firstName,
    lastName,
    preferredDepartureAirportCode,
    preferredSpendingTier,
    travelInterests,
  };
}
