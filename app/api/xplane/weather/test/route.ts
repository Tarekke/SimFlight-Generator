import { corsJson, corsOptions } from "@/lib/http/cors";
import { createExtremeWeatherPayload, sendWeatherToXPlane } from "@/lib/xplane/weather";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsOptions();
}

export async function POST() {
  const payload = createExtremeWeatherPayload();
  const result = await sendWeatherToXPlane(payload);

  return corsJson({
    ok: true,
    message: `Extremwetter wurde an ${result.target.host}:${result.target.port} gesendet.`,
    details: {
      sent: payload,
      target: result.target,
      datarefs: result.sent,
    },
  });
}
