"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaChartLine,
  FaCoins,
  FaCompass,
  FaDatabase,
  FaGear,
  FaRobot,
  FaUsers,
} from "react-icons/fa6";
import styles from "../shared.module.css";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <FaChartLine />,
    },
    {
      label: "Destinations",
      href: "/admin/destinations",
      icon: <FaDatabase />,
    },
    {
      label: "Cost Settings",
      href: "/admin/cost-settings",
      icon: <FaCoins />,
    },
    {
      label: "Recommendation Rules",
      href: "/admin/recommendation-rules",
      icon: <FaGear />,
    },
    {
      label: "AI Logs",
      href: "/admin/ai-logs",
      icon: <FaRobot />,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: <FaUsers />,
    },
  ];

  return (
    <aside className={styles.adminSidebar}>
      <div className={styles.adminSidebarBrand}>
        <div className={styles.adminLogo}>
          <FaCompass />
        </div>

        <div>
          <p className={styles.adminBrandTitle}>TravelMind AI</p>
          <p className={styles.adminBrandText}>Admin area</p>
        </div>
      </div>

      <nav className={styles.adminSidebarNav} aria-label="Admin navigation">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive ? styles.adminNavLinkActive : styles.adminNavLink
              }
            >
              <span className={styles.adminNavIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
