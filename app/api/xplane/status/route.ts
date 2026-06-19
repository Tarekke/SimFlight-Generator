import { NextResponse } from "next/server";
import { checkXPlaneConnection, getXPlaneTarget } from "@/lib/xplane/udp";

export const runtime = "nodejs";

export async function GET() {
  const target = getXPlaneTarget();

  try {
    const result = await checkXPlaneConnection();

    return NextResponse.json({
      ok: true,
      message: `X-Plane antwortet auf ${result.target.host}:${result.target.port}. Verbindung ist aktiv.`,
      details: {
        host: result.target.host,
        port: result.target.port,
        dataref: result.dataref,
        value: result.value,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: `X-Plane gibt keine Rückantwort auf ${target.host}:${target.port}. Starte X-Plane und prüfe UDP/Netzwerkdaten. Wetter senden kann trotzdem funktionieren, wenn X-Plane Daten annimmt, aber keine Rückantwort sendet.`,
        details: {
          host: target.host,
          port: target.port,
        },
      },
      { status: 503 },
    );
  }
}
