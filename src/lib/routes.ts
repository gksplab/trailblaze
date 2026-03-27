export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  distanceFromStart: number;
  funFact: string;
  streetViewHeading: number;
}

export interface Route {
  id: string;
  name: string;
  country: string;
  totalDistance: number;
  description: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  estimatedDays: string;
  postcardsCount: number;
  waypoints: Waypoint[];
}

export const routes: Route[] = [
  {
    id: "athens",
    name: "Athens on Foot",
    country: "Greece 🇬🇷",
    totalDistance: 35,
    description: "Walk through 3,000 years of history — from the ancient Agora to the marble of the Parthenon, down through Plaka's winding streets to the sea at Piraeus.",
    difficulty: "Moderate",
    estimatedDays: "7–14 days",
    postcardsCount: 5,
    waypoints: [
      { lat: 37.9715, lng: 23.7267, name: "Syntagma Square", distanceFromStart: 0, funFact: "Syntagma means 'constitution' in Greek. The square was named after the Constitution of 1843, which King Otto was forced to grant following a military uprising.", streetViewHeading: 90 },
      { lat: 37.9755, lng: 23.7222, name: "Ancient Agora", distanceFromStart: 7, funFact: "The Agora was the beating heart of ancient Athenian democracy. Socrates walked these very stones, engaging citizens in philosophical debate around 400 BC.", streetViewHeading: 180 },
      { lat: 37.9715, lng: 23.7257, name: "The Acropolis", distanceFromStart: 14, funFact: "The Parthenon was completed in 438 BC and dedicated to Athena. Its columns are slightly curved — an ancient optical illusion to make them appear perfectly straight.", streetViewHeading: 270 },
      { lat: 37.9678, lng: 23.7308, name: "Plaka District", distanceFromStart: 21, funFact: "Plaka is Athens' oldest neighborhood, nicknamed 'the neighborhood of the gods'. Its neoclassical houses and Byzantine churches date back over 400 years.", streetViewHeading: 45 },
      { lat: 37.9483, lng: 23.6441, name: "Piraeus Port", distanceFromStart: 35, funFact: "Piraeus has been Athens' main port for 2,500 years. In ancient times it was the largest port in the Mediterranean, home to over 400 warships.", streetViewHeading: 0 }
    ]
  },
  {
    id: "amsterdam",
    name: "Amsterdam Canal Loop",
    country: "Netherlands 🇳🇱",
    totalDistance: 42,
    description: "Follow the legendary canal ring from the old harbor through the Golden Age merchant houses, cycling past tulip markets, windmills and the world's most famous cycle paths.",
    difficulty: "Easy",
    estimatedDays: "7–10 days",
    postcardsCount: 5,
    waypoints: [
      { lat: 52.3764, lng: 4.9020, name: "Amsterdam Centraal", distanceFromStart: 0, funFact: "Amsterdam Centraal opened in 1889 and was deliberately built to block the city's view of the IJ waterfront — a controversial decision still debated today.", streetViewHeading: 180 },
      { lat: 52.3738, lng: 4.8910, name: "Anne Frank House", distanceFromStart: 8, funFact: "Anne Frank and her family hid in the Secret Annex for 761 days between 1942 and 1944. The house on Prinsengracht 263 now welcomes over 1 million visitors a year.", streetViewHeading: 90 },
      { lat: 52.3600, lng: 4.8852, name: "Rijksmuseum", distanceFromStart: 16, funFact: "The Rijksmuseum holds Rembrandt's 'The Night Watch' — a painting so large at 3.6 x 4.4m that when it was moved in 1715, a wall had to be demolished to fit it through.", streetViewHeading: 270 },
      { lat: 52.3667, lng: 4.9041, name: "Bloemenmarkt", distanceFromStart: 26, funFact: "The Bloemenmarkt is the world's only floating flower market, built on houseboats on the Singel canal since 1862. It sells over 20 million bulbs a year.", streetViewHeading: 135 },
      { lat: 52.3784, lng: 4.9009, name: "Jordaan District", distanceFromStart: 42, funFact: "Jordaan was built in the 1600s as a working-class neighborhood for immigrants and craftsmen. Today it's one of the most expensive areas in the Netherlands.", streetViewHeading: 45 }
    ]
  },
  {
    id: "cairo",
    name: "Cairo & Giza Explorer",
    country: "Egypt 🇪🇬",
    totalDistance: 48,
    description: "Journey through one of the world's oldest civilizations — from the medieval Islamic heart of Cairo through the Nile corniche, past ancient mosques and bazaars, all the way to the last surviving Wonder of the Ancient World at Giza.",
    difficulty: "Challenging",
    estimatedDays: "10–21 days",
    postcardsCount: 6,
    waypoints: [
      { lat: 30.0444, lng: 31.2357, name: "Tahrir Square", distanceFromStart: 0, funFact: "Tahrir means 'liberation' in Arabic. The square was built in the 19th century under Khedive Ismail, who wanted Cairo to resemble Paris.", streetViewHeading: 0 },
      { lat: 30.0459, lng: 31.2624, name: "Khan el-Khalili Bazaar", distanceFromStart: 8, funFact: "Khan el-Khalili has been a trading hub since 1382. Its labyrinthine alleys sell everything from spices to gold, and the coffeehouse Fishawi's has been open non-stop for 200 years.", streetViewHeading: 90 },
      { lat: 30.0280, lng: 31.2590, name: "Al-Azhar Mosque", distanceFromStart: 16, funFact: "Al-Azhar was founded in 970 AD and is considered the world's second oldest continuously operating university, predating Oxford by over 100 years.", streetViewHeading: 180 },
      { lat: 30.0131, lng: 31.2089, name: "Old Cairo (Coptic Quarter)", distanceFromStart: 24, funFact: "Old Cairo is home to the Hanging Church, built over a Roman fortress gatehouse in the 3rd century. According to tradition, the Holy Family sheltered here during their flight to Egypt.", streetViewHeading: 270 },
      { lat: 29.9792, lng: 31.1342, name: "The Great Sphinx", distanceFromStart: 38, funFact: "The Sphinx is the world's largest monolith statue at 73m long. Its nose was not shot off by Napoleon — historical records show it was already missing by the 14th century.", streetViewHeading: 45 },
      { lat: 29.9792, lng: 31.1320, name: "Great Pyramid of Giza", distanceFromStart: 48, funFact: "The Great Pyramid was the tallest man-made structure on Earth for 3,800 years. It contains an estimated 2.3 million stone blocks, some weighing up to 80 tonnes.", streetViewHeading: 90 }
    ]
  }
];
