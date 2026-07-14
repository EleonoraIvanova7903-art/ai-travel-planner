"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TravellerSidebar from "../navigation/TravellerSidebar";
import { watchAuthState } from "../../firebase/authService";
import { getUserProfile } from "../../firebase/userService";
import styles from "../shared.module.css";

export default function TravellerLayout({
  pageTitle,
  pageDescription,
  children,
}) {
  const [travellerName, setTravellerName] = useState("Traveller");

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = watchAuthState(async (authUser) => {
      if (!authUser) {
        if (isMounted) {
          setTravellerName("Traveller");
        }

        return;
      }

      try {
        const profile = await getUserProfile(authUser.uid);

        if (!isMounted) {
          return;
        }

        if (!profile) {
          setTravellerName("Traveller");
          return;
        }

        const fullName = [profile.firstName, profile.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        setTravellerName(fullName || "Traveller");
      } catch (error) {
        console.error("Unable to load Traveller profile:", error);

        if (isMounted) {
          setTravellerName("Traveller");
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className={styles.travellerShell}>
      <TravellerSidebar />

      <main className={styles.travellerMain}>
        <header className={styles.travellerTopbar}>
          <div>
            <p className={styles.travellerTopbarLabel}>Traveller area</p>

            <h1 className={styles.travellerTopbarTitle}>{pageTitle}</h1>

            {pageDescription ? (
              <p className={styles.travellerTopbarText}>{pageDescription}</p>
            ) : null}
          </div>

          <div className={styles.travellerTopbarActions}>
            <span className={styles.travellerWelcome}>
              Welcome, {travellerName}
            </span>

            <Link
              href="/traveller/account/profile"
              className={styles.travellerTopbarLink}
            >
              Profile
            </Link>

            <Link href="/login" className={styles.travellerLogoutButton}>
              Sign out
            </Link>
          </div>
        </header>

        <section className={styles.travellerContent}>{children}</section>
      </main>
    </div>
  );
}
