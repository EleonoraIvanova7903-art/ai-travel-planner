import Link from "next/link";
import {
  FaArrowRight,
  FaCalendarDays,
  FaChartLine,
  FaCompass,
  FaLocationDot,
  FaRoute,
  FaShieldHalved,
  FaWallet,
  FaWandSparkles,
} from "react-icons/fa6";

const planningSteps = [
  {
    number: "01",
    title: "Add your travel details",
    text: "Enter your budget, travel month, duration, departure point and interests.",
  },
  {
    number: "02",
    title: "Compare suitable options",
    text: "Review destinations that match your budget, timing and travel style.",
  },
  {
    number: "03",
    title: "Build your trip plan",
    text: "Generate a clearer itinerary and save the final plan in your account.",
  },
];

const featureCards = [
  {
    icon: <FaWallet />,
    title: "Budget clarity",
    text: "See estimated costs before you commit to a destination.",
  },
  {
    icon: <FaLocationDot />,
    title: "Destination fit",
    text: "Find places that match your interests, season and available time.",
  },
  {
    icon: <FaWandSparkles />,
    title: "AI guidance",
    text: "Get simple explanations and itinerary ideas for better decisions.",
  },
];

export default function HomePage() {
  return (
    <main className="travel-page">
      {/* Navigation */}
      <nav className="navbar sticky-top travel-navbar">
        <div className="container-xl py-2">
          <div className="d-flex w-100 align-items-center justify-content-between gap-3 flex-wrap">
            <Link
              href="/"
              className="navbar-brand travel-brand d-inline-flex align-items-center gap-3 m-0"
            >
              <span className="travel-brand-icon d-inline-flex align-items-center justify-content-center">
                <FaCompass />
              </span>

              <span>
                <strong className="d-block">TravelMind AI</strong>
                <small className="d-block">
                  Travel Planner &amp; Budget Optimizer
                </small>
              </span>
            </Link>

            <div className="d-none d-lg-flex align-items-center gap-4 travel-nav-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#start">Start</a>
            </div>

            <div className="d-flex align-items-center gap-2 ms-auto">
              <Link
                href="/login"
                className="btn btn-link travel-login-link px-2"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="btn travel-nav-button rounded-pill px-4"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section className="travel-hero">
        <div className="container-xl">
          <div className="travel-hero-panel">
            <div className="row g-5 align-items-center">
              <div className="col-12 col-lg-7">
                <div className="travel-hero-copy">
                  <span className="badge rounded-pill travel-eyebrow">
                    Smart travel planning
                  </span>

                  <h1 className="display-5 fw-bold">
                    Plan a trip that fits your budget before you book.
                  </h1>

                  <p className="lead">
                    TravelMind AI helps you compare destinations, understand
                    trip costs and create a clearer itinerary based on your
                    budget, timing and travel style.
                  </p>

                  <div className="d-flex flex-column flex-sm-row gap-3 mt-4">
                    <Link
                      href="/login"
                      className="btn travel-primary-button rounded-pill px-4"
                    >
                      <span className="d-inline-flex align-items-center gap-2">
                        Start planning
                        <FaArrowRight />
                      </span>
                    </Link>

                    <a
                      href="#how-it-works"
                      className="btn travel-secondary-button rounded-pill px-4"
                    >
                      See how it works
                    </a>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <aside className="card travel-trip-card">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3">
                      <span className="travel-preview-icon d-inline-flex align-items-center justify-content-center">
                        <FaChartLine />
                      </span>

                      <div>
                        <p className="travel-preview-label mb-1">
                          Planning preview
                        </p>

                        <h2 className="travel-preview-title mb-0">
                          Budget-focused trip
                        </h2>
                      </div>
                    </div>

                    <div className="travel-budget-box my-4">
                      <span>Estimated plan</span>

                      <strong>Clearer before booking</strong>

                      <p>
                        Compare destination cost, trip length and travel style
                        before choosing.
                      </p>
                    </div>

                    <div className="d-grid gap-3">
                      <div className="travel-trip-item d-flex align-items-center gap-3">
                        <span className="travel-trip-icon d-inline-flex align-items-center justify-content-center">
                          <FaWallet />
                        </span>

                        <div>
                          <strong className="d-block">Budget fit</strong>
                          <small className="d-block">
                            Understand total cost
                          </small>
                        </div>
                      </div>

                      <div className="travel-trip-item d-flex align-items-center gap-3">
                        <span className="travel-trip-icon d-inline-flex align-items-center justify-content-center">
                          <FaCalendarDays />
                        </span>

                        <div>
                          <strong className="d-block">Trip timing</strong>
                          <small className="d-block">
                            Plan around dates and duration
                          </small>
                        </div>
                      </div>

                      <div className="travel-trip-item d-flex align-items-center gap-3">
                        <span className="travel-trip-icon d-inline-flex align-items-center justify-content-center">
                          <FaRoute />
                        </span>

                        <div>
                          <strong className="d-block">Itinerary</strong>
                          <small className="d-block">
                            Shape a practical travel plan
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="travel-section">
        <div className="container-xl">
          <div className="travel-section-heading text-center mx-auto">
            <span className="badge rounded-pill travel-section-badge">
              Core features
            </span>

            <h2>Focused tools for better travel decisions.</h2>

            <p>
              The platform supports the planning stage with budget estimates,
              destination matching and clear AI-supported guidance.
            </p>
          </div>

          <div className="row g-4">
            {featureCards.map((feature) => (
              <div className="col-12 col-md-6 col-lg-4" key={feature.title}>
                <article className="card h-100 travel-feature-card">
                  <div className="card-body p-4">
                    <div className="travel-feature-icon d-inline-flex align-items-center justify-content-center">
                      {feature.icon}
                    </div>

                    <h3 className="card-title">{feature.title}</h3>

                    <p className="card-text">{feature.text}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process section */}
      <section
        id="how-it-works"
        className="travel-section travel-process-section"
      >
        <div className="container-xl">
          <div className="travel-section-heading text-center mx-auto">
            <span className="badge rounded-pill travel-section-badge">
              How it works
            </span>

            <h2>From first idea to a structured trip plan.</h2>
          </div>

          <div className="row g-4">
            {planningSteps.map((step) => (
              <div className="col-12 col-md-6 col-lg-4" key={step.number}>
                <article className="card h-100 travel-step-card">
                  <div className="card-body p-4">
                    <span className="travel-step-number">{step.number}</span>

                    <h3 className="card-title">{step.title}</h3>

                    <p className="card-text">{step.text}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section id="start" className="travel-cta-section">
        <div className="container-xl">
          <div className="card travel-cta-card">
            <div className="card-body p-4 p-md-5">
              <div className="row align-items-center g-4">
                <div className="col-12 col-lg-8">
                  <span className="travel-cta-label d-inline-flex align-items-center gap-2">
                    <FaShieldHalved />
                    Plan with more confidence
                  </span>

                  <h2>
                    Start with your budget, then build the trip around it.
                  </h2>

                  <p>
                    Sign in to continue planning, or create an account if you
                    are new to TravelMind AI.
                  </p>
                </div>

                <div className="col-12 col-lg-4 text-lg-end">
                  <Link
                    href="/login"
                    className="btn travel-dark-button rounded-pill px-4"
                  >
                    <span className="d-inline-flex align-items-center gap-2">
                      Start planning
                      <FaArrowRight />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="travel-footer">
        <div className="container-xl">
          <div className="row g-4 align-items-start pb-4">
            <div className="col-12 col-lg-8">
              <h3>TravelMind AI</h3>

              <p>
                Smarter travel planning for clearer choices, realistic budgets
                and better trip decisions.
              </p>
            </div>

            <div className="col-12 col-lg-4">
              <div className="d-flex gap-3 justify-content-lg-end">
                <Link href="/login">Login</Link>
                <Link href="/register">Create account</Link>
              </div>
            </div>
          </div>

          <div className="travel-footer-bottom d-flex flex-column flex-md-row justify-content-between gap-2 pt-4">
            <span>© 2026 TravelMind AI. All rights reserved.</span>
            <span>Plan smarter. Travel better.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
