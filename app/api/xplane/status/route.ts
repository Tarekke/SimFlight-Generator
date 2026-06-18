import { NextResponse } from "next/server";
import { getXPlaneTarget } from "@/lib/xplane/udp";

export const runtime = "nodejs";

export async function GET() {
  const target = getXPlaneTarget();

  return NextResponse.json({
    ok: true,
    message: `Lokale X-Plane-Adresse ist ${target.host}:${target.port}.`,
    details: {
      host: target.host,
      port: target.port,
      note: "UDP hat keine sichere Antwort wie HTTP. Ob X-Plane die Daten annimmt, prüfen wir mit einem echten Testflug.",
    },
  });
}
