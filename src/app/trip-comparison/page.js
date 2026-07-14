import Link from "next/link";
import {
  FaArrowLeft,
  FaCompass,
  FaPenToSquare,
  FaScaleBalanced,
} from "react-icons/fa6";
import TravellerLayout from "../../shared/layout/TravellerLayout";
import TripComparisonSummary from "./TripComparisonSummary";
import TripComparisonTable from "./TripComparisonTable";
import { tripComparisonData } from "./comparisonData";
import styles from "./trip-comparison.module.css";

export default function TripComparisonPage() {
  return (
    <TravellerLayout
      pageTitle="Trip Comparison"
      pageDescription="Compare destination costs, budget suitability and travel preference scores."
    >
      <div className="container-fluid p-0">
        {/* Page introduction */}
        <section className={`card mb-4 ${styles.pageIntroCard}`}>
          <div className="card-body p-4 p-lg-5">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-8">
                <div className="d-flex align-items-start gap-3">
                  <span
                    className={`${styles.pageIcon} d-inline-flex align-items-center justify-content-center`}
                  >
                    <FaScaleBalanced />
                  </span>

                  <div>
                    <p className={`${styles.eyebrow} mb-2`}>
                      Destination comparison
                    </p>

                    <h1 className={`${styles.pageTitle} mb-3`}>
                      Choose the trip that fits you best
                    </h1>

                    <p className={`${styles.pageText} mb-0`}>
                      Compare estimated costs, budget status, matching interests
                      and destination scores before continuing to your
                      itinerary.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="d-grid gap-2">
                  <Link
                    href="/traveller/trip-planning/recommendations"
                    className={`btn ${styles.primaryButton} d-flex align-items-center justify-content-center gap-2`}
                  >
                    <FaArrowLeft />
                    Back to recommendations
                  </Link>

                  <Link
                    href="/traveller/trip-planning/planner"
                    className={`btn ${styles.secondaryButton} d-flex align-items-center justify-content-center gap-2`}
                  >
                    <FaPenToSquare />
                    Edit trip details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TripComparisonSummary trips={tripComparisonData} />

        <TripComparisonTable trips={tripComparisonData} />

        {/* Page footer action */}
        <div className="d-flex justify-content-center mt-4">
          <Link
            href="/traveller/trip-planning/recommendations"
            className={`${styles.textLink} d-inline-flex align-items-center gap-2`}
          >
            <FaCompass />
            Review destination recommendations
          </Link>
        </div>
      </div>
    </TravellerLayout>
  );
}
