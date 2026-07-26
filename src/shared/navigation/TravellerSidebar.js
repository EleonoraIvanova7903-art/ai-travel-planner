"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaChartLine,
  FaCompass,
  FaLocationDot,
  FaRoute,
  FaScaleBalanced,
  FaSuitcaseRolling,
  FaUser,
} from "react-icons/fa6";
import styles from "../shared.module.css";

export default function TravellerSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/traveller/account/dashboard",
      icon: <FaChartLine />,
    },
    {
      label: "Trip Planner",
      href: "/traveller/trip-planning/planner",
      icon: <FaCompass />,
    },
    {
      label: "Recommendations",
      href: "/traveller/trip-planning/recommendations",
      icon: <FaLocationDot />,
    },
    {
      label: "Trip Comparison",
      href: "/trip-comparison",
      icon: <FaScaleBalanced />,
    },
    {
      label: "Itinerary",
      href: "/traveller/trip-planning/itinerary",
      icon: <FaRoute />,
    },
    {
      label: "Saved Trips",
      href: "/traveller/account/saved-trips",
      icon: <FaSuitcaseRolling />,
    },
    {
      label: "Profile",
      href: "/traveller/account/profile",
      icon: <FaUser />,
    },
  ];

  return (
    <aside className={styles.travellerSidebar}>
      <div className={styles.travellerSidebarBrand}>
        <div className={styles.travellerLogo}>
          <FaCompass />
        </div>

        <div>
          <p className={styles.travellerBrandTitle}>TravelMind AI</p>
          <p className={styles.travellerBrandText}>Traveller area</p>
        </div>
      </div>

      <nav
        className={styles.travellerSidebarNav}
        aria-label="Traveller navigation"
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? styles.travellerNavLinkActive
                  : styles.travellerNavLink
              }
            >
              <span className={styles.travellerNavIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
