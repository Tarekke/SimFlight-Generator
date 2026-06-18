import { supplementalAirports } from "./supplemental-airports";

export type AirportDifficulty = "Einfach" | "Mittel" | "Schwer" | "Extrem";
export type FlightRegion = "Alle" | "Europa" | "Nordamerika" | "Alpen" | "Inseln" | "Abgelegen";
export type FlightRules = "Alle" | "VFR" | "IFR";
export type AircraftCategory = "Propeller" | "Turboprop" | "Jet";

export type Airport = {
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  runwayM: number;
  difficulty: AirportDifficulty;
  regions: FlightRegion[];
  rules: FlightRules[];
  notes: string;
};

export const aircraftSpeedsKt: Record<AircraftCategory, number> = {
  Propeller: 125,
  Turboprop: 250,
  Jet: 430,
};

export const airportDifficultyRank: Record<AirportDifficulty, number> = {
  Einfach: 1,
  Mittel: 2,
  Schwer: 3,
  Extrem: 4,
};

const baseAirports: Airport[] = [
  { icao: "EDDF", name: "Frankfurt Main", city: "Frankfurt", country: "Deutschland", lat: 50.0379, lon: 8.5622, runwayM: 4000, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Großer Flughafen mit langen Bahnen." },
  { icao: "EDDM", name: "Munich", city: "München", country: "Deutschland", lat: 48.3538, lon: 11.7861, runwayM: 4000, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Lange Bahnen und klare Verfahren." },
  { icao: "EDDB", name: "Berlin Brandenburg", city: "Berlin", country: "Deutschland", lat: 52.3667, lon: 13.5033, runwayM: 4000, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Großer Flughafen, gut für einfache Routen." },
  { icao: "EDDH", name: "Hamburg", city: "Hamburg", country: "Deutschland", lat: 53.6304, lon: 9.9882, runwayM: 3666, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Große Bahn, norddeutsche Region." },
  { icao: "EDDK", name: "Cologne Bonn", city: "Köln", country: "Deutschland", lat: 50.8659, lon: 7.1427, runwayM: 3815, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Lange Bahn, viele Anflüge." },
  { icao: "EDDL", name: "Düsseldorf", city: "Düsseldorf", country: "Deutschland", lat: 51.2895, lon: 6.7668, runwayM: 3000, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Großer Flughafen im Westen." },
  { icao: "EDDS", name: "Stuttgart", city: "Stuttgart", country: "Deutschland", lat: 48.6899, lon: 9.2219, runwayM: 3345, difficulty: "Mittel", regions: ["Europa"], rules: ["IFR"], notes: "Gelände und Verkehr machen es etwas anspruchsvoller." },
  { icao: "EDDV", name: "Hannover", city: "Hannover", country: "Deutschland", lat: 52.4602, lon: 9.6835, runwayM: 3800, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Lange Bahn und flaches Gelände." },
  { icao: "EDDP", name: "Leipzig Halle", city: "Leipzig", country: "Deutschland", lat: 51.4239, lon: 12.2364, runwayM: 3600, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Gute IFR-Route möglich." },
  { icao: "EDNY", name: "Friedrichshafen", city: "Friedrichshafen", country: "Deutschland", lat: 47.6713, lon: 9.5115, runwayM: 2356, difficulty: "Mittel", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Alpennähe, guter Übergang zu schwereren Routen." },
  { icao: "EDJA", name: "Memmingen", city: "Memmingen", country: "Deutschland", lat: 47.9888, lon: 10.2395, runwayM: 2981, difficulty: "Mittel", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Süddeutschland, Alpennähe." },
  { icao: "EDXW", name: "Sylt", city: "Westerland", country: "Deutschland", lat: 54.9132, lon: 8.3405, runwayM: 2120, difficulty: "Mittel", regions: ["Europa", "Inseln"], rules: ["VFR", "IFR"], notes: "Inselroute, Wind kann fordernd sein." },

  { icao: "LOWW", name: "Vienna", city: "Wien", country: "Österreich", lat: 48.1103, lon: 16.5697, runwayM: 3600, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Großer Flughafen mit langen Bahnen." },
  { icao: "LOWI", name: "Innsbruck", city: "Innsbruck", country: "Österreich", lat: 47.2602, lon: 11.344, runwayM: 2000, difficulty: "Extrem", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Berge und anspruchsvolle Anflüge." },
  { icao: "LOWS", name: "Salzburg", city: "Salzburg", country: "Österreich", lat: 47.7933, lon: 13.0043, runwayM: 2750, difficulty: "Schwer", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Alpenrand und Wetter können schwierig sein." },
  { icao: "LOWG", name: "Graz", city: "Graz", country: "Österreich", lat: 46.9911, lon: 15.4396, runwayM: 3000, difficulty: "Mittel", regions: ["Europa"], rules: ["IFR"], notes: "Mittlere Schwierigkeit." },
  { icao: "LOWL", name: "Linz", city: "Linz", country: "Österreich", lat: 48.2332, lon: 14.1875, runwayM: 3000, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Lange Bahn, klare Verfahren." },

  { icao: "LSZH", name: "Zurich", city: "Zürich", country: "Schweiz", lat: 47.4582, lon: 8.5555, runwayM: 3700, difficulty: "Mittel", regions: ["Europa", "Alpen"], rules: ["IFR"], notes: "Großer Flughafen, nah an Alpenregion." },
  { icao: "LSGG", name: "Geneva", city: "Genf", country: "Schweiz", lat: 46.2381, lon: 6.1089, runwayM: 3900, difficulty: "Mittel", regions: ["Europa", "Alpen"], rules: ["IFR"], notes: "Alpennähe und See." },
  { icao: "LSZB", name: "Bern", city: "Bern", country: "Schweiz", lat: 46.9141, lon: 7.4972, runwayM: 1730, difficulty: "Schwer", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Kürzere Bahn und Gelände." },
  { icao: "LSZA", name: "Lugano", city: "Lugano", country: "Schweiz", lat: 46.0043, lon: 8.9106, runwayM: 1350, difficulty: "Extrem", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Sehr anspruchsvoll, Berge und kurze Bahn." },
  { icao: "LSZS", name: "Samedan", city: "St. Moritz", country: "Schweiz", lat: 46.5341, lon: 9.8841, runwayM: 1800, difficulty: "Extrem", regions: ["Europa", "Alpen"], rules: ["VFR"], notes: "Hoch gelegen und bergig." },
  { icao: "LSGS", name: "Sion", city: "Sion", country: "Schweiz", lat: 46.2196, lon: 7.3268, runwayM: 2000, difficulty: "Schwer", regions: ["Europa", "Alpen"], rules: ["VFR", "IFR"], notes: "Talflug und Alpenwetter." },

  { icao: "EGLL", name: "Heathrow", city: "London", country: "Vereinigtes Königreich", lat: 51.47, lon: -0.4543, runwayM: 3902, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Sehr großer Flughafen." },
  { icao: "LFPG", name: "Charles de Gaulle", city: "Paris", country: "Frankreich", lat: 49.0097, lon: 2.5479, runwayM: 4215, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Großer Hub." },
  { icao: "EHAM", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Niederlande", lat: 52.3086, lon: 4.7639, runwayM: 3800, difficulty: "Einfach", regions: ["Europa"], rules: ["IFR"], notes: "Viele lange Bahnen." },
  { icao: "LEBL", name: "Barcelona", city: "Barcelona", country: "Spanien", lat: 41.2974, lon: 2.0833, runwayM: 3352, difficulty: "Mittel", regions: ["Europa"], rules: ["IFR"], notes: "Küstenanflüge." },
  { icao: "LPMA", name: "Madeira", city: "Funchal", country: "Portugal", lat: 32.6979, lon: -16.7745, runwayM: 2781, difficulty: "Extrem", regions: ["Europa", "Inseln"], rules: ["VFR", "IFR"], notes: "Wind, Meer und schwieriger Anflug." },
  { icao: "BIKF", name: "Keflavik", city: "Reykjavik", country: "Island", lat: 63.985, lon: -22.6056, runwayM: 3054, difficulty: "Schwer", regions: ["Europa", "Inseln", "Abgelegen"], rules: ["IFR"], notes: "Nordische Wetterlage." },

  { icao: "KJFK", name: "John F. Kennedy", city: "New York", country: "USA", lat: 40.6413, lon: -73.7781, runwayM: 4442, difficulty: "Einfach", regions: ["Nordamerika"], rules: ["IFR"], notes: "Großer Flughafen mit langen Bahnen." },
  { icao: "KLAX", name: "Los Angeles", city: "Los Angeles", country: "USA", lat: 33.9416, lon: -118.4085, runwayM: 3685, difficulty: "Einfach", regions: ["Nordamerika"], rules: ["IFR"], notes: "Großer Flughafen." },
  { icao: "KDEN", name: "Denver", city: "Denver", country: "USA", lat: 39.8561, lon: -104.6737, runwayM: 4877, difficulty: "Mittel", regions: ["Nordamerika"], rules: ["IFR"], notes: "Hoch gelegen, Wetter kann wechseln." },
  { icao: "KSEA", name: "Seattle Tacoma", city: "Seattle", country: "USA", lat: 47.4502, lon: -122.3088, runwayM: 3627, difficulty: "Mittel", regions: ["Nordamerika"], rules: ["IFR"], notes: "Wetter und Berge in der Nähe." },
  { icao: "KORD", name: "Chicago O'Hare", city: "Chicago", country: "USA", lat: 41.9742, lon: -87.9073, runwayM: 3962, difficulty: "Einfach", regions: ["Nordamerika"], rules: ["IFR"], notes: "Großer Hub mit vielen Bahnen." },
  { icao: "KATL", name: "Atlanta", city: "Atlanta", country: "USA", lat: 33.6407, lon: -84.4277, runwayM: 3776, difficulty: "Einfach", regions: ["Nordamerika"], rules: ["IFR"], notes: "Sehr großer Flughafen." },
  { icao: "KMIA", name: "Miami", city: "Miami", country: "USA", lat: 25.7959, lon: -80.287, runwayM: 3962, difficulty: "Einfach", regions: ["Nordamerika"], rules: ["IFR"], notes: "Küstenroute und große Bahnen." },
  { icao: "KLAS", name: "Las Vegas", city: "Las Vegas", country: "USA", lat: 36.084, lon: -115.1537, runwayM: 4423, difficulty: "Mittel", regions: ["Nordamerika"], rules: ["IFR"], notes: "Wüste, Berge und Hitze." },
  { icao: "KSFO", name: "San Francisco", city: "San Francisco", country: "USA", lat: 37.6213, lon: -122.379, runwayM: 3618, difficulty: "Mittel", regions: ["Nordamerika"], rules: ["IFR"], notes: "Küste und Nebel möglich." },
  { icao: "KDCA", name: "Reagan National", city: "Washington", country: "USA", lat: 38.8512, lon: -77.0402, runwayM: 2094, difficulty: "Schwer", regions: ["Nordamerika"], rules: ["IFR"], notes: "Kurvenanflug und Luftraum." },
  { icao: "KEYW", name: "Key West", city: "Key West", country: "USA", lat: 24.5561, lon: -81.7596, runwayM: 1547, difficulty: "Schwer", regions: ["Nordamerika", "Inseln"], rules: ["VFR", "IFR"], notes: "Kurze Bahn auf Insel." },
  { icao: "KASE", name: "Aspen Pitkin County", city: "Aspen", country: "USA", lat: 39.2232, lon: -106.8688, runwayM: 2440, difficulty: "Extrem", regions: ["Nordamerika"], rules: ["VFR", "IFR"], notes: "Berge, Höhe und anspruchsvoller Anflug." },
  { icao: "KTEX", name: "Telluride", city: "Telluride", country: "USA", lat: 37.9538, lon: -107.9085, runwayM: 2134, difficulty: "Extrem", regions: ["Nordamerika", "Abgelegen"], rules: ["VFR"], notes: "Hoch gelegen und schwer." },
  { icao: "PAJN", name: "Juneau", city: "Juneau", country: "USA", lat: 58.3549, lon: -134.5763, runwayM: 2570, difficulty: "Schwer", regions: ["Nordamerika", "Abgelegen"], rules: ["VFR", "IFR"], notes: "Berge, Wasser und Wetter." },
  { icao: "PANC", name: "Anchorage", city: "Anchorage", country: "USA", lat: 61.1744, lon: -149.9964, runwayM: 3531, difficulty: "Mittel", regions: ["Nordamerika", "Abgelegen"], rules: ["IFR"], notes: "Alaska und lange Distanzen." },
  { icao: "PHNL", name: "Honolulu", city: "Honolulu", country: "USA", lat: 21.3187, lon: -157.9225, runwayM: 3760, difficulty: "Mittel", regions: ["Nordamerika", "Inseln"], rules: ["IFR"], notes: "Inselroute im Pazifik." },
];

export const airports: Airport[] = [...baseAirports, ...supplementalAirports];
