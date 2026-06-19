import { NextRequest, NextResponse } from "next/server";
import type { XPlaneRoutePayload } from "@/lib/xplane/route";
import { sendRouteToXPlane } from "@/lib/xplane/route";
import { checkXPlaneConnection } from "@/lib/xplane/udp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as XPlaneRoutePayload;
  const error = validateRoute(payload);

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
    const result = await sendRouteToXPlane(payload);

    return NextResponse.json({
      ok: true,
      message: `Route ${payload.from.icao} nach ${payload.to.icao} wurde an X-Plane gesendet.`,
      details: {
        route: payload,
        target: result.target,
        headingDeg: result.headingDeg,
        weather: result.weather,
        note: result.note,
        routeDatarefs: result.routeDatarefs,
        weatherDatarefs: result.weatherDatarefs,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "X-Plane konnte nicht erreicht werden. Starte X-Plane 12 und prüfe, ob die App auf 127.0.0.1:49000 senden darf.",
      },
      { status: 502 },
    );
  }
}

function validateRoute(payload: XPlaneRoutePayload) {
  if (!payload.from?.icao || !payload.to?.icao) {
    return "Startflughafen oder Zielflughafen fehlt.";
  }

  if (payload.from.icao === payload.to.icao) {
    return "Start und Ziel dürfen nicht gleich sein.";
  }

  if (!Number.isFinite(payload.from.lat) || !Number.isFinite(payload.from.lon)) {
    return "Die Koordinaten vom Startflughafen fehlen.";
  }

  if (!Number.isFinite(payload.to.lat) || !Number.isFinite(payload.to.lon)) {
    return "Die Koordinaten vom Zielflughafen fehlen.";
  }

  return null;
}
