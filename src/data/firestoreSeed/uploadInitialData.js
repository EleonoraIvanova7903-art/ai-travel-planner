const fs = require("fs");
const path = require("path");

const { savedTripsData } = require("./savedTripsData.js");

const { adminSettingsData } = require("./adminSettingsData.js");

const { aiLogsData } = require("./aiLogsData.js");

// Load Firebase values from .env.local
function loadEnvironmentVariables() {
  const environmentFilePath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(environmentFilePath)) {
    throw new Error(".env.local was not found in the main project folder.");
  }

  const environmentFile = fs.readFileSync(environmentFilePath, "utf8");

  const environmentLines = environmentFile.split(/\r?\n/);

  environmentLines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorPosition = trimmedLine.indexOf("=");

    if (separatorPosition === -1) {
      return;
    }

    const key = trimmedLine
      .slice(0, separatorPosition)
      .trim()
      .replace(/^\uFEFF/, "");

    let value = trimmedLine.slice(separatorPosition + 1).trim();

    const hasDoubleQuotes = value.startsWith('"') && value.endsWith('"');

    const hasSingleQuotes = value.startsWith("'") && value.endsWith("'");

    if (hasDoubleQuotes || hasSingleQuotes) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

// Prepare the Firebase configuration
function getFirebaseConfiguration() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,

    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,

    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missingValues = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingValues.length > 0) {
    throw new Error(
      `Missing Firebase configuration values: ${missingValues.join(", ")}`,
    );
  }

  return firebaseConfig;
}

// Upload all prepared documents to Firestore
async function uploadInitialData() {
  loadEnvironmentVariables();

  const { initializeApp, getApp, getApps } = await import("firebase/app");

  const { getFirestore, doc, setDoc, terminate } =
    await import("firebase/firestore");

  const firebaseConfig = getFirebaseConfiguration();

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  const db = getFirestore(app);

  try {
    console.log("Starting Firestore upload...");

    // Upload savedTrips collection
    for (const savedTrip of savedTripsData) {
      const savedTripReference = doc(db, "savedTrips", savedTrip.documentId);

      await setDoc(savedTripReference, savedTrip.data);

      console.log(`Uploaded savedTrips document: ${savedTrip.documentId}`);
    }

    // Upload adminSettings collection
    for (const adminSetting of adminSettingsData) {
      const adminSettingReference = doc(
        db,
        "adminSettings",
        adminSetting.documentId,
      );

      await setDoc(adminSettingReference, adminSetting.data);

      console.log(
        `Uploaded adminSettings document: ${adminSetting.documentId}`,
      );
    }

    // Upload aiLogs collection
    for (const aiLog of aiLogsData) {
      const aiLogReference = doc(db, "aiLogs", aiLog.documentId);

      await setDoc(aiLogReference, aiLog.data);

      console.log(`Uploaded aiLogs document: ${aiLog.documentId}`);
    }

    console.log("All initial Firestore data was uploaded successfully.");
  } catch (error) {
    console.error("Firestore upload failed:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await terminate(db);
  }
}

uploadInitialData();
