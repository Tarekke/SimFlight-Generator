import { corsJson, corsOptions } from "@/lib/http/cors";
import { createExtremeWeatherPayload, sendWeatherToXPlane } from "@/lib/xplane/weather";
import { checkXPlaneConnection, getXPlaneTarget } from "@/lib/xplane/udp";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function POST() {
  const payload = createExtremeWeatherPayload();
  const target = getXPlaneTarget();

  try {
    const connection = await checkXPlaneConnection();
    const result = await sendWeatherToXPlane(payload);

    return corsJson({
      ok: true,
      message: `Extremwetter wurde an ${result.target.host}:${result.target.port} gesendet.`,
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
        message: `X-Plane wurde auf ${target.host}:${target.port} nicht erreicht. Extremwetter wurde nicht als gesendet bestätigt.`,
        details: target,
      },
      { status: 502 },
    );
  }
}
