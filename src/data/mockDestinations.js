// Destination profiles and the shared planner option values.
// QHO635 TravelMind AI student MVP.
// All image paths point to public/images/destinations.
// All prices used by the project are in GBP.

export const travelInterestOptions = [
  "Beach",
  "Nature",
  "Culture",
  "Food",
  "Shopping",
  "Nightlife",
  "History",
  "Adventure",
  "Sightseeing",
];

export const spendingTierOptions = ["Budget", "Moderate", "Luxury"];

export const mockDestinations = [
  {
    destinationId: "lisbon-portugal",
    city: "Lisbon",
    country: "Portugal",
    airportCode: "LIS",
    supportedSpendingTiers: ["Budget", "Moderate", "Luxury"],
    interests: ["Culture", "Food", "History", "Sightseeing"],
    shortDescription:
      "A balanced city break with culture, food, history and riverside sightseeing.",
    bestMonths: ["April", "May", "June", "September", "October"],
    minimumDurationDays: 3,
    maximumDurationDays: 7,
    image: "/images/destinations/lisbon.jpg",
  },
  {
    destinationId: "malaga-spain",
    city: "Malaga",
    country: "Spain",
    airportCode: "AGP",
    supportedSpendingTiers: ["Budget", "Moderate"],
    interests: ["Beach", "Nature", "Food", "Adventure", "Sightseeing"],
    shortDescription:
      "An affordable sun destination with beaches, food and a compact historic centre.",
    bestMonths: ["March", "April", "May", "June", "September", "October"],
    minimumDurationDays: 3,
    maximumDurationDays: 7,
    image: "/images/destinations/malaga.jpg",
  },
  {
    destinationId: "prague-czech-republic",
    city: "Prague",
    country: "Czech Republic",
    airportCode: "PRG",
    supportedSpendingTiers: ["Budget", "Moderate"],
    interests: ["History", "Culture", "Sightseeing"],
    shortDescription:
      "A good-value city break with historic streets, architecture and a walkable centre.",
    bestMonths: ["April", "May", "June", "September", "October"],
    minimumDurationDays: 3,
    maximumDurationDays: 6,
    image: "/images/destinations/prague.jpg",
  },
  {
    destinationId: "budapest-hungary",
    city: "Budapest",
    country: "Hungary",
    airportCode: "BUD",
    supportedSpendingTiers: ["Budget", "Moderate"],
    interests: ["Culture", "Nightlife", "Food", "History", "Sightseeing"],
    shortDescription:
      "A budget-friendly city with thermal baths, food, nightlife and river views.",
    bestMonths: ["April", "May", "June", "September", "October"],
    minimumDurationDays: 3,
    maximumDurationDays: 7,
    image: "/images/destinations/budapest.jpg",
  },
  {
    destinationId: "istanbul-turkey",
    city: "Istanbul",
    country: "Turkey",
    airportCode: "IST",
    supportedSpendingTiers: ["Budget", "Moderate"],
    interests: ["Culture", "Food", "Shopping", "History", "Sightseeing"],
    shortDescription:
      "A culturally distinctive destination with food, shopping and major historic attractions.",
    bestMonths: ["April", "May", "June", "September", "October"],
    minimumDurationDays: 4,
    maximumDurationDays: 8,
    image: "/images/destinations/istanbul.jpg",
  },
  {
    destinationId: "paris-france",
    city: "Paris",
    country: "France",
    airportCode: "CDG",
    supportedSpendingTiers: ["Moderate", "Luxury"],
    interests: ["Culture", "Shopping", "Food", "History", "Sightseeing"],
    shortDescription:
      "A higher-cost city break with museums, food, shopping and iconic landmarks.",
    bestMonths: ["April", "May", "June", "September", "October"],
    minimumDurationDays: 3,
    maximumDurationDays: 7,
    image: "/images/destinations/paris.jpg",
  },
];

export default mockDestinations;
