import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { FIRESTORE_COLLECTIONS } from "./firestoreCollections";

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

function requireAuthenticatedUser(expectedUserId) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw createServiceError(
      "auth/required",
      "You must be signed in to manage saved trips.",
    );
  }

  if (expectedUserId && currentUser.uid !== expectedUserId) {
    throw createServiceError(
      "trip/access-denied",
      "You cannot access another Traveller's saved trips.",
    );
  }

  return currentUser;
}

async function getOwnedTripSnapshot(tripId, userId) {
  if (!tripId) {
    throw new Error("A saved trip ID is required.");
  }

  const currentUser = requireAuthenticatedUser(userId);

  const tripReference = doc(db, FIRESTORE_COLLECTIONS.SAVED_TRIPS, tripId);

  const tripSnapshot = await getDoc(tripReference);

  if (!tripSnapshot.exists()) {
    return {
      currentUser,
      tripReference,
      tripSnapshot: null,
    };
  }

  if (tripSnapshot.data().userId !== currentUser.uid) {
    throw createServiceError(
      "trip/access-denied",
      "You cannot access another Traveller's saved trip.",
    );
  }

  return {
    currentUser,
    tripReference,
    tripSnapshot,
  };
}

export async function getSavedTrips(userId) {
  const currentUser = requireAuthenticatedUser(userId);

  const savedTripsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.SAVED_TRIPS),
    where("userId", "==", currentUser.uid),
  );

  const savedTripsSnapshot = await getDocs(savedTripsQuery);

  return savedTripsSnapshot.docs
    .map((tripDoc) => ({
      id: tripDoc.id,
      ...tripDoc.data(),
    }))
    .sort(
      (firstTrip, secondTrip) =>
        getTimestampMilliseconds(secondTrip.createdAt) -
        getTimestampMilliseconds(firstTrip.createdAt),
    );
}

export async function getSavedTripById(tripId, userId) {
  const { tripSnapshot } = await getOwnedTripSnapshot(tripId, userId);

  if (!tripSnapshot) {
    return null;
  }

  return {
    id: tripSnapshot.id,
    ...tripSnapshot.data(),
  };
}

export async function createSavedTrip(tripData) {
  const currentUser = requireAuthenticatedUser();

  if (!tripData || typeof tripData !== "object" || Array.isArray(tripData)) {
    throw new Error("Saved trip data must be provided as an object.");
  }

  const savedTripReference = await addDoc(
    collection(db, FIRESTORE_COLLECTIONS.SAVED_TRIPS),
    {
      ...tripData,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  const savedTripSnapshot = await getDoc(savedTripReference);

  return {
    id: savedTripSnapshot.id,
    ...savedTripSnapshot.data(),
  };
}

export async function updateSavedTrip(tripId, updates, userId) {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new Error("Saved trip updates must be provided as an object.");
  }

  const { tripReference, tripSnapshot } = await getOwnedTripSnapshot(
    tripId,
    userId,
  );

  if (!tripSnapshot) {
    throw createServiceError(
      "trip/not-found",
      "The saved trip could not be found.",
    );
  }

  const safeUpdates = { ...updates };

  delete safeUpdates.id;
  delete safeUpdates.userId;
  delete safeUpdates.createdAt;

  await updateDoc(tripReference, {
    ...safeUpdates,
    updatedAt: serverTimestamp(),
  });

  const updatedSnapshot = await getDoc(tripReference);

  return {
    id: updatedSnapshot.id,
    ...updatedSnapshot.data(),
  };
}

export async function deleteSavedTrip(tripId, userId) {
  const { tripReference, tripSnapshot } = await getOwnedTripSnapshot(
    tripId,
    userId,
  );

  if (!tripSnapshot) {
    return false;
  }

  await deleteDoc(tripReference);

  return true;
}
