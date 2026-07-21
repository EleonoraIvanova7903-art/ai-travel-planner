import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { TripPlannerProvider } from "@/context/TripPlannerContext";

export const metadata = {
  title: "AI Travel Planner & Budget Optimizer",
  description:
    "AI-supported travel planning platform for destination recommendations, budget optimisation and itinerary generation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TripPlannerProvider>{children}</TripPlannerProvider>
      </body>
    </html>
  );
}
