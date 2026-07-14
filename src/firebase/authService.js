import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { createTravellerProfile, getUserProfile } from "./userService";

function createServiceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function registerTraveller({ fullName, email, password }) {
  const normalisedEmail = email.trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    normalisedEmail,
    password,
  );

  try {
    const profile = await createTravellerProfile(userCredential.user, fullName);

    return {
      authUser: userCredential.user,
      profile,
    };
  } catch (error) {
    try {
      await deleteUser(userCredential.user);
    } catch {
      // Preserve the original Firestore error for the interface.
    }

    throw error;
  }
}

export async function loginUser(email, password) {
  const normalisedEmail = email.trim().toLowerCase();

  const userCredential = await signInWithEmailAndPassword(
    auth,
    normalisedEmail,
    password,
  );

  const profile = await getUserProfile(userCredential.user.uid);

  if (!profile) {
    await signOut(auth);

    throw createServiceError(
      "profile/not-found",
      "No Firestore profile was found for this account.",
    );
  }

  if (profile.accountStatus !== "active") {
    await signOut(auth);

    throw createServiceError("profile/inactive", "This account is not active.");
  }

  if (!["admin", "traveller"].includes(profile.role)) {
    await signOut(auth);

    throw createServiceError(
      "profile/invalid-role",
      "This account does not have a valid application role.",
    );
  }

  return {
    authUser: userCredential.user,
    profile,
  };
}

export function logoutUser() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getAuthErrorMessage(error) {
  const errorCode = error?.code || "";

  if (errorCode === "auth/email-already-in-use") {
    return "This email address is already registered.";
  }

  if (errorCode === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (errorCode === "auth/weak-password") {
    return "Password must be at least 6 characters long.";
  }

  if (
    errorCode === "auth/invalid-credential" ||
    errorCode === "auth/user-not-found" ||
    errorCode === "auth/wrong-password"
  ) {
    return "Invalid email address or password.";
  }

  if (errorCode === "auth/too-many-requests") {
    return "Too many attempts. Please try again later.";
  }

  if (errorCode === "profile/not-found") {
    return "The account exists in Authentication, but its Firestore profile is missing.";
  }

  if (errorCode === "profile/inactive") {
    return "This account is not active.";
  }

  if (errorCode === "profile/invalid-role") {
    return "This account does not have a valid Traveller or Admin role.";
  }

  if (
    errorCode === "permission-denied" ||
    errorCode === "firestore/permission-denied"
  ) {
    return "Firestore access is blocked. Publish the provided Firestore rules.";
  }

  return "Something went wrong. Please try again.";
}
