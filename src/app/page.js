import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRight,
  FaCalendarDays,
  FaCompass,
  FaLocationDot,
  FaRoute,
  FaWallet,
  FaWandSparkles,
} from "react-icons/fa6";

const destinations = [
  {
    name: "Budapest",
    tag: "Culture and architecture",
    image: "/images/destinations/budapest.jpg",
    featured: true,
  },
  {
    name: "Istanbul",
    tag: "History and city discovery",
    image: "/images/destinations/istanbul.jpg",
    featured: true,
  },
  {
    name: "Lisbon",
    tag: "City views and culture",
    image: "/images/destinations/lisbon.jpg",
    featured: false,
  },
  {
    name: "Paris",
    tag: "Classic city break",
    image: "/images/destinations/paris.jpg",
    featured: false,
  },
  {
    name: "Prague",
    tag: "Historic destination",
    image: "/images/destinations/prague.jpg",
    featured: false,
  },
  {
    name: "Malaga",
    tag: "Coastal escape",
    image: "/images/destinations/malaga.jpg",
    featured: false,
  },
];

const featureCards = [
  {
    icon: <FaWallet />,
    title: "Budget clarity",
    text: "Review estimated trip costs and understand whether a destination fits your available budget.",
  },
  {
    icon: <FaLocationDot />,
    title: "Destination matching",
    text: "Discover destinations based on your interests, preferred travel month and available time.",
  },
  {
    icon: <FaWandSparkles />,
    title: "AI-supported guidance",
    text: "Receive personalised recommendations, itinerary ideas and practical budget suggestions.",
  },
];

const planningSteps = [
  {
    number: "01",
    title: "Add your travel details",
    text: "Enter your budget, departure point, preferred month, trip duration and interests.",
  },
  {
    number: "02",
    title: "Compare suitable options",
    text: "Review destinations that match your budget, timing and preferred travel style.",
  },
  {
    number: "03",
    title: "Build and save your plan",
    text: "Create a structured itinerary and save the completed trip plan in your account.",
  },
];

export default function HomePage() {
  return (
    <main className="travel-page">
      {/* Navigation */}
      <nav className="navbar sticky-top travel-navbar">
        <div className="container-xl py-2">
          <div className="d-flex w-100 align-items-center justify-content-between gap-3">
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
              <a href="#destinations">Destinations</a>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
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

      {/* Hero */}
      <section className="travel-hero">
        <div className="container-xl">
          <div className="travel-hero-card">
            <Image
              src="/images/destinations/lisbon.jpg"
              alt="Evening city view of Lisbon"
              fill
              priority
              sizes="(max-width: 1400px) 100vw, 1320px"
              className="travel-hero-image"
            />

            <div className="travel-hero-overlay" />

            <div className="travel-hero-inner">
              <div className="travel-hero-copy">
                <span className="travel-eyebrow">
                  AI-supported travel planning
                </span>

                <h1>
                  Plan smarter.
                  <span> Travel further.</span>
                </h1>

                <p>
                  Create a personalised travel plan based on your budget,
                  interests, preferred dates and available time.
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

              <div className="travel-hero-highlights">
                <div className="travel-highlight-item">
                  <span className="travel-highlight-icon">
                    <FaWallet />
                  </span>

                  <div>
                    <strong>Budget-aware</strong>
                    <small>Plan around realistic costs</small>
                  </div>
                </div>

                <div className="travel-highlight-item">
                  <span className="travel-highlight-icon">
                    <FaLocationDot />
                  </span>

                  <div>
                    <strong>Personalised</strong>
                    <small>Match destinations to your interests</small>
                  </div>
                </div>

                <div className="travel-highlight-item">
                  <span className="travel-highlight-icon">
                    <FaRoute />
                  </span>

                  <div>
                    <strong>Structured</strong>
                    <small>Build a clearer itinerary</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="travel-section">
        <div className="container-xl">
          <div className="travel-section-heading">
            <div>
              <span className="travel-section-label">
                Destination inspiration
              </span>

              <h2>Discover places worth planning for.</h2>
            </div>

            <p>
              Explore different types of destinations before creating a travel
              plan that matches your budget, interests and available time.
            </p>
          </div>

          <div className="row g-4">
            {destinations.map((destination) => (
              <div
                className={
                  destination.featured
                    ? "col-12 col-md-6 col-lg-6"
                    : "col-12 col-md-6 col-lg-3"
                }
                key={destination.name}
              >
                <article
                  className={`travel-destination-card ${
                    destination.featured
                      ? "travel-destination-card-featured"
                      : ""
                  }`}
                >
                  <Image
                    src={destination.image}
                    alt={`${destination.name} travel destination`}
                    fill
                    sizes={
                      destination.featured
                        ? "(max-width: 768px) 100vw, 50vw"
                        : "(max-width: 768px) 100vw, 25vw"
                    }
                    className="travel-destination-image"
                  />

                  <div className="travel-destination-overlay" />

                  <div className="travel-destination-content">
                    <span>{destination.tag}</span>
                    <h3>{destination.name}</h3>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="travel-section travel-features-section">
        <div className="container-xl">
          <div className="travel-centered-heading text-center mx-auto">
            <span className="travel-section-label">Core features</span>

            <h2>Useful tools for clearer travel decisions.</h2>

            <p>
              TravelMind AI supports the planning process through budget
              estimates, destination matching and personalised AI guidance.
            </p>
          </div>

          <div className="row g-4">
            {featureCards.map((feature) => (
              <div className="col-12 col-md-6 col-lg-4" key={feature.title}>
                <article className="travel-feature-card h-100">
                  <div className="travel-feature-icon">{feature.icon}</div>

                  <h3>{feature.title}</h3>

                  <p>{feature.text}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="travel-section travel-process-section"
      >
        <div className="container-xl">
          <div className="travel-centered-heading text-center mx-auto">
            <span className="travel-section-label">How it works</span>

            <h2>From an initial idea to a structured trip plan.</h2>

            <p>
              Complete three simple stages to receive suitable destinations,
              budget guidance and a personalised itinerary.
            </p>
          </div>

          <div className="row g-4 travel-steps-row">
            {planningSteps.map((step) => (
              <div className="col-12 col-md-6 col-lg-4" key={step.number}>
                <article className="travel-step-card h-100">
                  <span className="travel-step-number">{step.number}</span>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="travel-cta-section">
        <div className="container-xl">
          <div className="travel-cta-card">
            <div className="row align-items-center g-4">
              <div className="col-12 col-lg-8">
                <span className="travel-cta-label">
                  <FaCalendarDays />
                  Your next trip starts here
                </span>

                <h2>Start with your budget and build the journey around it.</h2>

                <p>
                  Sign in to begin planning or create an account to save your
                  recommendations and completed itineraries.
                </p>
              </div>

              <div className="col-12 col-lg-4 text-lg-end">
                <Link
                  href="/register"
                  className="btn travel-cta-button rounded-pill px-4"
                >
                  <span className="d-inline-flex align-items-center gap-2">
                    Create account
                    <FaArrowRight />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="travel-footer">
        <div className="container-xl">
          <div className="row g-4 align-items-start pb-4">
            <div className="col-12 col-lg-7">
              <Link
                href="/"
                className="travel-footer-brand d-inline-flex align-items-center gap-3"
              >
                <span className="travel-footer-icon">
                  <FaCompass />
                </span>

                <span>
                  <strong className="d-block">TravelMind AI</strong>
                  <small>Travel Planner &amp; Budget Optimizer</small>
                </span>
              </Link>

              <p>
                Smarter travel planning for realistic budgets, personalised
                destinations and clearer trip decisions.
              </p>
            </div>

            <div className="col-12 col-lg-5">
              <div className="travel-footer-links d-flex flex-wrap gap-4 justify-content-lg-end">
                <a href="#destinations">Destinations</a>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <Link href="/login">Login</Link>
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
