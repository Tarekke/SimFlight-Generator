# SimFlight Generator

Lokale Next.js-App für X-Plane 12 Demo.

Die App soll Wetterdaten laden und sie später an X-Plane 12 schicken.
Der erste Stand hat eine Wettermaske und lokale API-Routen für X-Plane.

## Start

```bash
npm install
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:3000
```

## X-Plane Ziel

Standard:

```text
Host: 127.0.0.1
Port: 49000
```

Andere Werte können in `.env.local` gesetzt werden:

```bash
XPLANE_HOST=127.0.0.1
XPLANE_PORT=49000
```

## Aktueller Stand

- Next.js-App ist vorbereitet.
- Wetterwerte können eingegeben werden.
- Wetterwerte können per Regler eingestellt werden.
- Mit `Live an` werden Änderungen automatisch an X-Plane gesendet.
- Eine lokale API sendet UDP-Pakete an X-Plane.
- Die App hat einen Extremwetter-Test.
- Die API nutzt X-Plane-12-DataRefs aus `sim/weather/region/...`.
- In X-Plane muss sichtbar geprüft werden, ob die Demo alle Werte übernimmt.

## Test

In der App auf `Extremwetter testen` klicken.

Gesendet wird:

- 55 kt Wind
- 700 m Sicht
- starker Regen
- tiefe Wolken
- niedriger Luftdruck
