import type { AircraftCategory, Airport, AirportDifficulty } from "@/lib/routes/airports";
import { sendDatarefs } from "@/lib/xplane/udp";
import { sendWeatherToXPlane } from "@/lib/xplane/weather";

export type XPlaneRoutePayload = {
  from: Airport;
  to: Airport;
  difficulty: AirportDifficulty;
  aircraftCategory: AircraftCategory;
  estimatedMinutes: number;
  distanceNm: number;
  targetMinutes: number;
  aircraftLabel?: string;
  missionType?: string;
  startMode?: "ground" | "air";
};

export async function sendRouteToXPlane(route: XPlaneRoutePayload) {
  const weather = createRouteWeather(route);
  const headingDeg = bearingBetweenAirports(route.from, route.to);
  const loadout = createAircraftLoadout(route);
  const startProfile = createStartProfile(route, headingDeg);
  const routeResult = await sendDatarefs([
    {
      path: "sim/flightmodel/position/latitude",
      value: startProfile.lat,
    },
    {
      path: "sim/flightmodel/position/longitude",
      value: startProfile.lon,
    },
    {
      path: "sim/flightmodel/position/elevation",
      value: startProfile.elevationM,
    },
    {
      path: "sim/flightmodel/position/psi",
      value: headingDeg,
    },
    {
      path: "sim/flightmodel/position/theta",
      value: 0,
    },
    {
      path: "sim/flightmodel/position/phi",
      value: 0,
    },
    {
      path: "sim/flightmodel/position/groundspeed",
      value: startProfile.groundspeedMps,
    },
    {
      path: "sim/flightmodel/controls/parkbrake",
      value: startProfile.parkBrake,
    },
    {
      path: "sim/flightmodel/weight/m_fuel[0]",
      value: loadout.fuelPerTankKg,
    },
    {
      path: "sim/flightmodel/weight/m_fuel[1]",
      value: loadout.fuelPerTankKg,
    },
    {
      path: "sim/flightmodel/weight/m_fixed",
      value: loadout.payloadKg,
    },
  ]);

  const weatherResult = await sendWeatherToXPlane(weather);

  return {
    target: routeResult.target,
    routeDatarefs: routeResult.sent,
    weatherDatarefs: weatherResult.sent,
    weather,
    loadout,
    startProfile,
    headingDeg,
    note:
      "X-Plane UDP setzt Position, Wetter, Uhrzeit, Treibstoff und Beladung. Eine echte Parkposition, Startbahn-Auswahl oder ein anderes Flugzeug kann die Demo per UDP nicht zuverlässig laden.",
  };
}

function createStartProfile(route: XPlaneRoutePayload, headingDeg: number) {
  if (route.startMode === "air") {
    const offsetNm = route.aircraftCategory === "Jet" ? 18 : route.aircraftCategory === "Turboprop" ? 12 : 7;
    const start = pointFromAirport(route.from, headingDeg, offsetNm);

    return {
      lat: start.lat,
      lon: start.lon,
      elevationM: route.aircraftCategory === "Jet" ? 1800 : route.aircraftCategory === "Turboprop" ? 1200 : 750,
      groundspeedMps: route.aircraftCategory === "Jet" ? 135 : route.aircraftCategory === "Turboprop" ? 95 : 50,
      parkBrake: 0,
    };
  }

  return {
    lat: route.from.lat,
    lon: route.from.lon,
    elevationM: 180,
    groundspeedMps: 0,
    parkBrake: 1,
  };
}

function createAircraftLoadout(route: XPlaneRoutePayload) {
  const reserveMinutes = route.difficulty === "Einfach" ? 55 : route.difficulty === "Mittel" ? 45 : 35;
  const plannedMinutes = Math.min(Math.max(route.estimatedMinutes + reserveMinutes, 30), 660);
  const loadFactor = routeLoadFactor(route);

  if (route.aircraftCategory === "Jet") {
    const fuelKg = clamp(
      2200 + route.estimatedMinutes * 78 + reserveMinutes * 18 + route.distanceNm * 0.8 + loadFactor * 1200,
      2200,
      56000,
    );
    const passengers = clamp(Math.round(180 * loadFactor), 42, 186);
    const cargoKg = clamp(Math.round((450 + route.distanceNm * 2.6) * (0.75 + loadFactor * 0.45)), 300, 5600);

    return {
      aircraft: route.aircraftLabel ?? "Jet",
      fuelKg: Math.round(fuelKg),
      fuelPerTankKg: Math.round(fuelKg / 2),
      passengers,
      cargoKg,
      payloadKg: Math.round(passengers * 92 + cargoKg),
    };
  }

  if (route.aircraftCategory === "Turboprop") {
    const fuelKg = clamp(420 + plannedMinutes * 16 + route.distanceNm * 0.9, 520, 7600);
    const passengers = clamp(Math.round(72 * loadFactor), 7, 76);
    const cargoKg = clamp(Math.round((140 + route.distanceNm * 1.5) * (0.7 + loadFactor * 0.5)), 90, 2400);

    return {
      aircraft: route.aircraftLabel ?? "Turboprop",
      fuelKg: Math.round(fuelKg),
      fuelPerTankKg: Math.round(fuelKg / 2),
      passengers,
      cargoKg,
      payloadKg: Math.round(passengers * 88 + cargoKg),
    };
  }

  const fuelKg = clamp(80 + plannedMinutes * 3.4 + route.distanceNm * 0.35, 95, 1450);
  const passengers = clamp(Math.round(9 * loadFactor), 1, 9);
  const cargoKg = clamp(Math.round((35 + route.distanceNm * 0.5) * (0.65 + loadFactor * 0.45)), 20, 620);

  return {
    aircraft: route.aircraftLabel ?? "Propellerflugzeug",
    fuelKg: Math.round(fuelKg),
    fuelPerTankKg: Math.round(fuelKg / 2),
    passengers,
    cargoKg,
    payloadKg: Math.round(passengers * 86 + cargoKg),
  };
}

function routeLoadFactor(route: XPlaneRoutePayload) {
  const seed = `${route.from.icao}-${route.to.icao}-${Math.round(route.estimatedMinutes)}-${route.aircraftCategory}`;
  const hash = hashString(seed);
  const timeFactor = clamp(route.estimatedMinutes / 600, 0, 1);
  const base = 0.42 + timeFactor * 0.26;
  const variation = (hash / 1000) * 0.34;
  return clamp(base + variation, 0.32, 0.98);
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000;
  }

  return hash;
}

function pointFromAirport(airport: Airport, headingDeg: number, distanceNm: number) {
  const distanceRad = distanceNm / 3440.065;
  const bearing = toRad(headingDeg);
  const lat1 = toRad(airport.lat);
  const lon1 = toRad(airport.lon);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceRad) +
      Math.cos(lat1) * Math.sin(distanceRad) * Math.cos(bearing),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distanceRad) * Math.cos(lat1),
      Math.cos(distanceRad) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: toDeg(lat2),
    lon: ((toDeg(lon2) + 540) % 360) - 180,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createRouteWeather(route: XPlaneRoutePayload) {
  const bearing = bearingBetweenAirports(route.from, route.to);
  const windDirectionDeg = Math.round((bearing + 65) % 360);
  const base = {
    location: route.from.city,
    windDirectionDeg,
    timeOfDay: route.difficulty === "Extrem" ? "06:20" : route.difficulty === "Schwer" ? "17:40" : "12:00",
    timeZoneOffsetMinutes: 0,
    weatherRadiusKm: route.difficulty === "Einfach" ? 45 : route.difficulty === "Mittel" ? 35 : 25,
  };

  if (route.difficulty === "Extrem") {
    return {
      ...base,
      temperatureC: 4,
      windSpeedKt: 42,
      qnh: 990,
      visibilityM: 2500,
      cloudCoverage: 90,
      rainPercent: 70,
      turbulence: 7,
    };
  }

  if (route.difficulty === "Schwer") {
    return {
      ...base,
      temperatureC: 8,
      windSpeedKt: 28,
      qnh: 1002,
      visibilityM: 6000,
      cloudCoverage: 65,
      rainPercent: 35,
      turbulence: 4,
    };
  }

  if (route.difficulty === "Mittel") {
    return {
      ...base,
      temperatureC: 14,
      windSpeedKt: 16,
      qnh: 1010,
      visibilityM: 12000,
      cloudCoverage: 35,
      rainPercent: 10,
      turbulence: 2,
    };
  }

  return {
    ...base,
    temperatureC: 18,
    windSpeedKt: 8,
    qnh: 1013,
    visibilityM: 20000,
    cloudCoverage: 10,
    rainPercent: 0,
    turbulence: 0,
  };
}

function bearingBetweenAirports(from: Airport, to: Airport) {
  const fromLat = toRad(from.lat);
  const toLat = toRad(to.lat);
  const deltaLon = toRad(to.lon - from.lon);
  const y = Math.sin(deltaLon) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function toDeg(value: number) {
  return (value * 180) / Math.PI;
}
