import { NextResponse } from "next/server";
import { checkXPlaneConnection } from "@/lib/xplane/udp";
import { createExtremeWeatherPayload, sendWeatherToXPlane } from "@/lib/xplane/weather";

export const runtime = "nodejs";

export async function POST() {
  const payload = createExtremeWeatherPayload();
  try {
    await checkXPlaneConnection();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "X-Plane antwortet nicht. Extremwetter wurde nicht gesendet.",
      },
      { status: 503 },
    );
  }

  const result = await sendWeatherToXPlane(payload);

  return NextResponse.json({
    ok: true,
    message: `Extremwetter wurde an ${result.target.host}:${result.target.port} gesendet.`,
    details: {
      sent: payload,
      target: result.target,
      datarefs: result.sent,
    },
  });
}
