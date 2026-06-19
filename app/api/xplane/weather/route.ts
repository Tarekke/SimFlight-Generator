import { NextRequest, NextResponse } from "next/server";
import type { WeatherPayload } from "@/lib/weather/types";
import { checkXPlaneConnection } from "@/lib/xplane/udp";
import { sendWeatherToXPlane } from "@/lib/xplane/weather";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as WeatherPayload;
  const error = validateWeather(payload);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error,
      },
      { status: 400 },
    );
  }

  try {
    await checkXPlaneConnection();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "X-Plane antwortet nicht. Wetter wurde nicht gesendet. Starte X-Plane und drücke danach zuerst auf X-Plane prüfen.",
      },
      { status: 503 },
    );
  }

  const result = await sendWeatherToXPlane(payload);

  return NextResponse.json({
    ok: true,
    message: `Wetterdaten für ${payload.location} wurden an ${result.target.host}:${result.target.port} gesendet.`,
    details: {
      sent: payload,
      target: result.target,
      datarefs: result.sent,
    },
  });
}

function validateWeather(payload: WeatherPayload) {
  if (!payload.location || typeof payload.location !== "string") {
    return "Der Ort fehlt.";
  }

  const numbers = [
    payload.temperatureC,
    payload.windDirectionDeg,
    payload.windSpeedKt,
    payload.pressureHpa,
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
