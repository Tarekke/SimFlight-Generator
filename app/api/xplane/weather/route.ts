import { NextRequest } from "next/server";
import { corsJson, corsOptions } from "@/lib/http/cors";
import type { WeatherPayload } from "@/lib/weather/types";
import { sendWeatherToXPlane } from "@/lib/xplane/weather";
import { checkXPlaneConnection, getXPlaneTarget } from "@/lib/xplane/udp";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as WeatherPayload;
  const error = validateWeather(payload);

  if (error) {
    return corsJson(
      {
        ok: false,
        message: error,
      },
      { status: 400 },
    );
  }

  const target = getXPlaneTarget();

  try {
    const connection = await checkXPlaneConnection();
    const result = await sendWeatherToXPlane(payload);

    return corsJson({
      ok: true,
      message: `Wetterdaten für ${payload.location} wurden an ${result.target.host}:${result.target.port} gesendet.`,
      details: {
        sent: payload,
        target: result.target,
        connection,
        datarefs: result.sent,
      },
    });
  } catch {
    return corsJson(
      {
        ok: false,
        message: `X-Plane wurde auf ${target.host}:${target.port} nicht erreicht. Wetter wurde nicht als gesendet bestätigt.`,
        details: target,
      },
      { status: 502 },
    );
  }
}

function validateWeather(payload: WeatherPayload) {
  if (!payload.location || typeof payload.location !== "string") {
    return "Der Ort fehlt.";
  }

  const numbers = [
    payload.temperatureC,
    payload.windDirectionDeg,
    payload.windSpeedKt,
    payload.qnh ?? payload.pressureHpa,
    payload.visibilityM,
    payload.cloudCoverage,
    payload.rainPercent ?? 0,
    payload.turbulence ?? 0,
  ];

  if (numbers.some((value) => !Number.isFinite(value))) {
    return "Alle Wetterwerte müssen Zahlen sein.";
  }

  if (payload.windDirectionDeg < 0 || payload.windDirectionDeg > 360) {
    return "Die Windrichtung muss zwischen 0 und 360 liegen.";
  }

  const qnh = payload.qnh ?? payload.pressureHpa;

  if (qnh < 870 || qnh > 1085) {
    return "Das QNH muss zwischen 870 und 1085 liegen.";
  }

  if (payload.cloudCoverage < 0 || payload.cloudCoverage > 100) {
    return "Die Wolkenmenge muss zwischen 0 und 100 liegen.";
  }

  if (payload.rainPercent !== undefined && (payload.rainPercent < 0 || payload.rainPercent > 100)) {
    return "Der Regen muss zwischen 0 und 100 liegen.";
  }

  if (payload.turbulence !== undefined && (payload.turbulence < 0 || payload.turbulence > 10)) {
    return "Die Turbulenz muss zwischen 0 und 10 liegen.";
  }

  return null;
}
