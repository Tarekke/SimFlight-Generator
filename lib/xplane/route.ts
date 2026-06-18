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
};

export async function sendRouteToXPlane(route: XPlaneRoutePayload) {
  const weather = createRouteWeather(route);
  const headingDeg = bearingBetweenAirports(route.from, route.to);
  const routeResult = await sendDatarefs([
    {
      path: "sim/flightmodel/position/latitude",
      value: route.from.lat,
    },
    {
      path: "sim/flightmodel/position/longitude",
      value: route.from.lon,
    },
    {
      path: "sim/flightmodel/position/elevation",
      value: 180,
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
      value: 0,
    },
    {
      path: "sim/flightmodel/controls/parkbrake",
      value: 1,
    },
  ]);

  const weatherResult = await sendWeatherToXPlane(weather);

  return {
    target: routeResult.target,
    routeDatarefs: routeResult.sent,
    weatherDatarefs: weatherResult.sent,
    weather,
    headingDeg,
    note:
      "X-Plane UDP kann Position, Wetter und Uhrzeit setzen. Eine echte Parkposition, Startbahn-Auswahl und ein anderes Flugzeug kann die Demo per UDP nicht zuverlässig laden.",
  };
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
      pressureHpa: 990,
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
      pressureHpa: 1002,
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
      pressureHpa: 1010,
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
    pressureHpa: 1013,
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
