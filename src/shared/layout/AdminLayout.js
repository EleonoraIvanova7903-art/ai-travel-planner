import Link from "next/link";
import AdminSidebar from "../navigation/AdminSidebar";
import styles from "../shared.module.css";

export default function AdminLayout({ pageTitle, pageDescription, children }) {
  return (
    <div className={styles.adminShell}>
      <AdminSidebar />

      <main className={styles.adminMain}>
        <header className={styles.adminTopbar}>
          <div>
            <p className={styles.adminTopbarLabel}>Admin area</p>
            <h1 className={styles.adminTopbarTitle}>{pageTitle}</h1>

            {pageDescription ? (
              <p className={styles.adminTopbarText}>{pageDescription}</p>
            ) : null}
          </div>

          <div className={styles.adminTopbarActions}>
            <span className={styles.adminWelcome}>Admin access</span>

            <Link href="/admin/dashboard" className={styles.adminTopbarLink}>
              Overview
            </Link>

            <Link href="/login" className={styles.adminLogoutButton}>
              Sign out
            </Link>
          </div>
        </header>

        <section className={styles.adminContent}>{children}</section>
      </main>
    </div>
  );
}
