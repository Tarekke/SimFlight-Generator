"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { majorCities } from "@/lib/locations/major-cities";
import {
  aircraftSpeedsKt,
  airportDifficultyRank,
  airports,
  type AircraftCategory,
  type Airport,
  type AirportDifficulty,
  type FlightRegion,
  type FlightRules,
} from "@/lib/routes/airports";
import { timeZoneOptions } from "@/lib/time/time-zones";

type WeatherForm = {
  location: string;
  temperatureC: string;
  windDirectionDeg: string;
  windSpeedKt: string;
  pressureHpa: string;
  visibilityM: string;
  cloudCoverage: string;
  rainPercent: string;
  turbulence: string;
  timeOfDay: string;
  timeZoneOffsetMinutes: string;
  weatherRadiusKm: string;
};

type ApiResult = {
  ok: boolean;
  message: string;
  details?: unknown;
};

type ActiveView = "menu" | "weather" | "route" | "challenge" | "scenario";
type ThemeMode = "light" | "dark";

type RouteForm = {
  targetMinutes: string;
  difficulty: AirportDifficulty;
  region: FlightRegion;
  rules: FlightRules;
  aircraftCategory: AircraftCategory;
  startAirport: string;
  endAirport: string;
  startAirportSearch: string;
  endAirportSearch: string;
};

type GeneratedRoute = {
  from: Airport;
  to: Airport;
  distanceNm: number;
  estimatedMinutes: number;
  targetMinutes: number;
  difficulty: AirportDifficulty;
  aircraftCategory: AircraftCategory;
};

const initialForm: WeatherForm = {
  location: "Berlin",
  temperatureC: "15",
  windDirectionDeg: "270",
  windSpeedKt: "8",
  pressureHpa: "1013",
  visibilityM: "10000",
  cloudCoverage: "30",
  rainPercent: "0",
  turbulence: "0",
  timeOfDay: "12:00",
  timeZoneOffsetMinutes: "60",
  weatherRadiusKm: "30",
};

const initialRouteForm: RouteForm = {
  targetMinutes: "90",
  difficulty: "Einfach",
  region: "Alle",
  rules: "Alle",
  aircraftCategory: "Turboprop",
  startAirport: "",
  endAirport: "",
  startAirportSearch: "",
  endAirportSearch: "",
};

const presets: { name: string; tone: "clear" | "windy" | "bad"; values: WeatherForm }[] = [
  {
    name: "Klar",
    tone: "clear",
    values: {
      location: "Klares Wetter",
      temperatureC: "18",
      windDirectionDeg: "270",
      windSpeedKt: "5",
      pressureHpa: "1013",
      visibilityM: "20000",
      cloudCoverage: "5",
      rainPercent: "0",
      turbulence: "0",
      timeOfDay: "12:00",
      timeZoneOffsetMinutes: "60",
      weatherRadiusKm: "40",
    },
  },
  {
    name: "Windig",
    tone: "windy",
    values: {
      location: "Windiges Wetter",
      temperatureC: "15",
      windDirectionDeg: "183",
      windSpeedKt: "60",
      pressureHpa: "1013",
      visibilityM: "20000",
      cloudCoverage: "10",
      rainPercent: "0",
      turbulence: "2",
      timeOfDay: "15:00",
      timeZoneOffsetMinutes: "60",
      weatherRadiusKm: "35",
    },
  },
  {
    name: "Schlecht",
    tone: "bad",
    values: {
      location: "Schlechtes Wetter",
      temperatureC: "8",
      windDirectionDeg: "90",
      windSpeedKt: "35",
      pressureHpa: "990",
      visibilityM: "900",
      cloudCoverage: "95",
      rainPercent: "100",
      turbulence: "7",
      timeOfDay: "18:30",
      timeZoneOffsetMinutes: "60",
      weatherRadiusKm: "25",
    },
  },
];

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("menu");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [form, setForm] = useState<WeatherForm>(initialForm);
  const [routeForm, setRouteForm] = useState<RouteForm>(initialRouteForm);
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
  const [status, setStatus] = useState<ApiResult | null>(null);
  const [sendResult, setSendResult] = useState<ApiResult | null>(null);
  const [routeApplyResult, setRouteApplyResult] = useState<ApiResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isApplyingRoute, setIsApplyingRoute] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [openAirportPicker, setOpenAirportPicker] = useState<"start" | "end" | null>(null);
  const [liveState, setLiveState] = useState("Live ist aus.");

  const cityOptions = majorCities;
  const locationSearch = normalizeSearch(form.location.trim());
  const matchingCities = cityOptions
    .filter((city) => normalizeSearch(city).startsWith(locationSearch))
    .slice(0, 500);
  const matchingStartAirports = airportSearchOptions(routeForm.startAirportSearch).slice(0, 30);
  const matchingEndAirports = airportSearchOptions(routeForm.endAirportSearch).slice(0, 30);
  const themeButtonLabel = theme === "light" ? "Dark Mode" : "White Mode";

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  useEffect(() => {
    if (!isLive) {
      setLiveState("Live ist aus.");
      return;
    }

    setLiveState("Änderung wird gleich gesendet...");
    const timeout = window.setTimeout(async () => {
      const data = await postWeather();
      setSendResult(data);
      setLiveState(data.ok ? "Live gesendet." : "Live Fehler.");
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [form, isLive]);

  async function checkXPlane() {
    setIsChecking(true);
    setStatus(null);

    const response = await fetch("/api/xplane/status");
    const data = (await response.json()) as ApiResult;

    setStatus(data);
    setIsChecking(false);
  }

  async function sendWeather(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setSendResult(null);

    const data = await postWeather();

    setSendResult(data);
    setIsSending(false);
  }

  async function postWeather() {
    const response = await fetch("/api/xplane/weather", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toPayload(form)),
    });
    return (await response.json()) as ApiResult;
  }

  async function sendExtremeWeather() {
    setIsSendingTest(true);
    setSendResult(null);

    const response = await fetch("/api/xplane/weather/test", {
      method: "POST",
    });
    const data = (await response.json()) as ApiResult;

    setSendResult(data);
    setIsSendingTest(false);
  }

  function generateRoute() {
    setGeneratedRoute(createRoute(routeForm));
    setRouteApplyResult(null);
  }

  async function applyRouteToXPlane() {
    if (!generatedRoute) {
      return;
    }

    setIsApplyingRoute(true);
    setRouteApplyResult(null);

    const response = await fetch("/api/xplane/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(generatedRoute),
    });
    const data = (await response.json()) as ApiResult;

    setRouteApplyResult(data);
    setIsApplyingRoute(false);
  }

  if (activeView === "menu") {
    return (
      <main className="shell" data-theme={theme}>
        <section className="topline">
          <div>
            <p className="eyebrow">X-Plane 12 Demo</p>
            <h1>SimFlight Generator</h1>
          </div>
          <button className="secondaryButton" type="button" onClick={toggleTheme}>
            {themeButtonLabel}
          </button>
        </section>

        <section className="homeMenu">
          <button className="menuTile weatherTile" type="button" onClick={() => setActiveView("weather")}>
            <span className="menuTileTitle">Wetter</span>
            <strong>Wetter und Tageszeit steuern</strong>
          </button>
          <button className="menuTile routeTile" type="button" onClick={() => setActiveView("route")}>
            <span className="menuTileTitle">Route</span>
            <strong>Zufällige Flugroute generieren</strong>
          </button>
          <button className="menuTile challengeTile" type="button" onClick={() => setActiveView("challenge")}>
            <span className="menuTileTitle">Challenge</span>
            <strong>Kommt später</strong>
          </button>
          <button className="menuTile scenarioTile" type="button" onClick={() => setActiveView("scenario")}>
            <span className="menuTileTitle">Szenario</span>
            <strong>Kommt später</strong>
          </button>
        </section>
      </main>
    );
  }

  if (activeView === "route") {
    const targetMinutes = Number(routeForm.targetMinutes);

    return (
      <main className="shell" data-theme={theme}>
        <section className="topline">
          <div>
            <p className="eyebrow">SimFlight Generator</p>
            <h1>Route</h1>
          </div>
          <div className="topActions">
            <button className="secondaryButton" type="button" onClick={toggleTheme}>
              {themeButtonLabel}
            </button>
            <button className="secondaryButton" type="button" onClick={() => setActiveView("menu")}>
              Zum Menü
            </button>
          </div>
        </section>

        <section className="routeWorkspace">
          <form className="panel routePanel" onSubmit={(event) => event.preventDefault()}>
            <div className="panelHeader">
              <h2>Route generieren</h2>
              <p>Wähle Zeit, Schwierigkeit und Filter. Danach sucht die App passende Flughäfen.</p>
            </div>

            <Slider
              label="Flugzeit"
              unit=""
              min="20"
              max="900"
              step="10"
              value={routeForm.targetMinutes}
              displayValue={formatMinutes(targetMinutes)}
              color={durationColor(targetMinutes)}
              onChange={(value) => setRouteForm({ ...routeForm, targetMinutes: value })}
            />

            <div className="airportPickerGrid">
              <AirportPicker
                airports={matchingStartAirports}
                isOpen={openAirportPicker === "start"}
                label="Startflughafen"
                placeholder="Zufällig oder ICAO/Ort suchen"
                searchValue={routeForm.startAirportSearch}
                selectedIcao={routeForm.startAirport}
                onBlur={() => window.setTimeout(() => setOpenAirportPicker(null), 120)}
                onChange={(value) => {
                  setRouteForm({ ...routeForm, startAirportSearch: value, startAirport: "" });
                  setOpenAirportPicker("start");
                }}
                onClear={() =>
                  setRouteForm({ ...routeForm, startAirportSearch: "", startAirport: "" })
                }
                onFocus={() => setOpenAirportPicker("start")}
                onSelect={(airport) => {
                  setRouteForm({
                    ...routeForm,
                    startAirport: airport.icao,
                    startAirportSearch: formatAirportOption(airport),
                  });
                  setOpenAirportPicker(null);
                }}
              />

              <AirportPicker
                airports={matchingEndAirports}
                isOpen={openAirportPicker === "end"}
                label="Zielflughafen"
                placeholder="Zufällig oder ICAO/Ort suchen"
                searchValue={routeForm.endAirportSearch}
                selectedIcao={routeForm.endAirport}
                onBlur={() => window.setTimeout(() => setOpenAirportPicker(null), 120)}
                onChange={(value) => {
                  setRouteForm({ ...routeForm, endAirportSearch: value, endAirport: "" });
                  setOpenAirportPicker("end");
                }}
                onClear={() => setRouteForm({ ...routeForm, endAirportSearch: "", endAirport: "" })}
                onFocus={() => setOpenAirportPicker("end")}
                onSelect={(airport) => {
                  setRouteForm({
                    ...routeForm,
                    endAirport: airport.icao,
                    endAirportSearch: formatAirportOption(airport),
                  });
                  setOpenAirportPicker(null);
                }}
              />
            </div>

            <div className="routeControls">
              <label>
                Schwierigkeit
                <select
                  value={routeForm.difficulty}
                  onChange={(event) =>
                    setRouteForm({ ...routeForm, difficulty: event.target.value as AirportDifficulty })
                  }
                >
                  <option>Einfach</option>
                  <option>Mittel</option>
                  <option>Schwer</option>
                  <option>Extrem</option>
                </select>
              </label>

              <label>
                Region
                <select
                  value={routeForm.region}
                  onChange={(event) =>
                    setRouteForm({ ...routeForm, region: event.target.value as FlightRegion })
                  }
                >
                  <option>Alle</option>
                  <option>Europa</option>
                  <option>Nordamerika</option>
                  <option>Alpen</option>
                  <option>Inseln</option>
                  <option>Abgelegen</option>
                </select>
              </label>

              <label>
                Flugart
                <select
                  value={routeForm.rules}
                  onChange={(event) =>
                    setRouteForm({ ...routeForm, rules: event.target.value as FlightRules })
                  }
                >
                  <option>Alle</option>
                  <option>VFR</option>
                  <option>IFR</option>
                </select>
              </label>

              <label>
                Flugzeug
                <select
                  value={routeForm.aircraftCategory}
                  onChange={(event) =>
                    setRouteForm({
                      ...routeForm,
                      aircraftCategory: event.target.value as AircraftCategory,
                    })
                  }
                >
                  <option>Propeller</option>
                  <option>Turboprop</option>
                  <option>Jet</option>
                </select>
              </label>
            </div>

            <button className="primaryButton" type="button" onClick={generateRoute}>
              Route generieren
            </button>
          </form>

          <aside className="panel routeResultPanel">
            <h2>Ergebnis</h2>
            {generatedRoute ? (
              <RouteResult
                isApplying={isApplyingRoute}
                onApply={applyRouteToXPlane}
                result={routeApplyResult}
                route={generatedRoute}
              />
            ) : (
              <p className="muted">Noch keine Route generiert.</p>
            )}
          </aside>
        </section>
      </main>
    );
  }

  if (activeView === "challenge" || activeView === "scenario") {
    const title = activeView === "challenge" ? "Challenge" : "Szenario";

    return (
      <main className="shell" data-theme={theme}>
        <section className="topline">
          <div>
            <p className="eyebrow">SimFlight Generator</p>
            <h1>{title}</h1>
          </div>
          <div className="topActions">
            <button className="secondaryButton" type="button" onClick={toggleTheme}>
              {themeButtonLabel}
            </button>
            <button className="secondaryButton" type="button" onClick={() => setActiveView("menu")}>
              Zum Menü
            </button>
          </div>
        </section>

        <section className="panel placeholderPanel">
          <h2>{title} kommt später</h2>
          <p className="muted">Diese Ansicht ist schon klickbar. Den Inhalt bauen wir später.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell" data-theme={theme}>
      <section className="topline">
        <div>
          <p className="eyebrow">X-Plane 12 Demo</p>
          <h1>SimFlight Generator</h1>
        </div>
        <div className="topActions">
          <button className="secondaryButton" type="button" onClick={toggleTheme}>
            {themeButtonLabel}
          </button>
          <button className="secondaryButton" type="button" onClick={() => setActiveView("menu")}>
            Zum Menü
          </button>
          <button className="secondaryButton" onClick={checkXPlane} disabled={isChecking}>
            {isChecking ? "Prüfe..." : "X-Plane prüfen"}
          </button>
        </div>
      </section>

      <section className="workspace">
        <form className="panel" onSubmit={sendWeather}>
          <div className="panelHeader">
            <h2>Wettersteuerung</h2>
            <p>Werte einstellen und direkt lokal an X-Plane senden.</p>
          </div>

          <div className="presetRow">
            {presets.map((preset) => (
              <button
                className={`presetButton ${preset.tone}`}
                key={preset.name}
                type="button"
                onClick={() =>
                  setForm({
                    ...preset.values,
                    location: form.location,
                    timeOfDay: form.timeOfDay,
                    timeZoneOffsetMinutes: form.timeZoneOffsetMinutes,
                    weatherRadiusKm: form.weatherRadiusKm,
                  })
                }
              >
                {preset.name}
              </button>
            ))}
          </div>

          <label className="locationField">
            Ort
            <input
              value={form.location}
              onBlur={() => window.setTimeout(() => setIsLocationOpen(false), 120)}
              onChange={(event) => {
                setForm({ ...form, location: event.target.value });
                setIsLocationOpen(true);
              }}
              onFocus={() => setIsLocationOpen(true)}
            />
            {isLocationOpen && matchingCities.length > 0 ? (
              <div className="cityList">
                {matchingCities.map((city) => (
                  <button
                    className="cityOption"
                    key={city}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, location: city });
                      setIsLocationOpen(false);
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            ) : null}
          </label>

          <div className="timeGrid">
            <label>
              Tageszeit
              <input
                type="time"
                value={form.timeOfDay}
                onChange={(event) => setForm({ ...form, timeOfDay: event.target.value })}
              />
            </label>
            <label>
              Zeitzone
              <select
                value={form.timeZoneOffsetMinutes}
                onChange={(event) =>
                  setForm({ ...form, timeZoneOffsetMinutes: event.target.value })
                }
              >
                {timeZoneOptions.map((zone) => (
                  <option key={zone.label} value={zone.offsetMinutes}>
                    {zone.label} - {zone.region}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="sliderGrid">
            <Slider
              label="Temperatur"
              unit="C"
              min="-30"
              max="45"
              value={form.temperatureC}
              color={temperatureColor(Number(form.temperatureC))}
              onChange={(value) => setForm({ ...form, temperatureC: value })}
            />
            <Slider
              label="Windrichtung"
              unit="Grad"
              min="0"
              max="360"
              value={form.windDirectionDeg}
              color={directionColor(Number(form.windDirectionDeg))}
              onChange={(value) => setForm({ ...form, windDirectionDeg: value })}
            />
            <Slider
              label="Wind"
              unit="kt"
              min="0"
              max="100"
              value={form.windSpeedKt}
              color={dangerColor(Number(form.windSpeedKt), 100)}
              onChange={(value) => setForm({ ...form, windSpeedKt: value })}
            />
            <Slider
              label="Luftdruck"
              unit="hPa"
              min="950"
              max="1050"
              value={form.pressureHpa}
              color={pressureColor(Number(form.pressureHpa))}
              onChange={(value) => setForm({ ...form, pressureHpa: value })}
            />
            <Slider
              label="Sicht"
              unit="m"
              min="200"
              max="30000"
              step="100"
              value={form.visibilityM}
              color={visibilityColor(Number(form.visibilityM))}
              onChange={(value) => setForm({ ...form, visibilityM: value })}
            />
            <Slider
              label="Wolken"
              unit="%"
              min="0"
              max="100"
              value={form.cloudCoverage}
              color={dangerColor(Number(form.cloudCoverage), 100)}
              onChange={(value) => setForm({ ...form, cloudCoverage: value })}
            />
            <Slider
              label="Regen"
              unit="%"
              min="0"
              max="100"
              value={form.rainPercent}
              color={dangerColor(Number(form.rainPercent), 100)}
              onChange={(value) => setForm({ ...form, rainPercent: value })}
            />
            <Slider
              label="Turbulenz"
              unit="/10"
              min="0"
              max="10"
              value={form.turbulence}
              color={dangerColor(Number(form.turbulence), 10)}
              onChange={(value) => setForm({ ...form, turbulence: value })}
            />
            <Slider
              label="Wetterbereich"
              unit="km"
              min="5"
              max="50"
              value={form.weatherRadiusKm}
              color={regionColor(Number(form.weatherRadiusKm))}
              onChange={(value) => setForm({ ...form, weatherRadiusKm: value })}
            />
          </div>

          <button className="primaryButton" disabled={isSending}>
            {isSending ? "Sende..." : "An X-Plane senden"}
          </button>
        </form>

        <aside className="panel statusPanel">
          <h2>Status</h2>

          <label className="switchRow">
            <input
              checked={isLive}
              type="checkbox"
              onChange={(event) => setIsLive(event.target.checked)}
            />
            <span>Live an</span>
            <span className={isLive ? "liveDot active" : "liveDot"} />
          </label>

          <p className="muted">{liveState}</p>

          <StatusBlock title="Verbindung" result={status} empty="Noch nicht geprüft." />
          <StatusBlock title="Letztes Senden" result={sendResult} empty="Noch nichts gesendet." />

          <button className="testButton" onClick={sendExtremeWeather} disabled={isSendingTest}>
            {isSendingTest ? "Sende Test..." : "Extremwetter testen"}
          </button>

          <div className="note">
            <strong>Testwerte:</strong> 55 kt Wind aus Osten, 700 m Sicht, starker Regen, tiefe
            Wolken und niedriger Luftdruck. Das sollte in X-Plane klar auffallen.
          </div>

          <div className="note">
            <strong>Wetterbereich:</strong> In diesem Umkreis bleibt das Wetter ähnlich. Weiter weg
            darf es sich langsam ändern, aber nicht sprunghaft.
          </div>
        </aside>
      </section>
    </main>
  );
}

function Slider({
  label,
  unit,
  min,
  max,
  step = "1",
  value,
  displayValue,
  color,
  onChange,
}: {
  label: string;
  unit: string;
  min: string;
  max: string;
  step?: string;
  value: string;
  displayValue?: string;
  color: string;
  onChange: (value: string) => void;
}) {
  const minValue = Number(min);
  const maxValue = Number(max);
  const currentValue = Number(value);
  const fill = ((currentValue - minValue) / (maxValue - minValue)) * 100;

  return (
    <label className="sliderField" style={{ "--slider-color": color } as CSSProperties}>
      <span>
        {label}
        <strong>
          {displayValue ?? `${value} ${unit}`}
        </strong>
      </span>
      <input
        max={max}
        min={min}
        step={step}
        style={{
          background: `linear-gradient(90deg, ${color} ${fill}%, #d9e7f7 ${fill}%)`,
        }}
        type="range"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusBlock({
  title,
  result,
  empty,
}: {
  title: string;
  result: ApiResult | null;
  empty: string;
}) {
  return (
    <div className="statusBlock">
      <h3>{title}</h3>
      {result ? (
        <p className={result.ok ? "success" : "warning"}>{result.message}</p>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}

function RouteResult({
  isApplying,
  onApply,
  result,
  route,
}: {
  isApplying: boolean;
  onApply: () => void;
  result: ApiResult | null;
  route: GeneratedRoute;
}) {
  const diff = Math.abs(route.estimatedMinutes - route.targetMinutes);

  return (
    <div className="routeResult">
      <div className="routeAirports">
        <AirportCard label="Start" airport={route.from} />
        <AirportCard label="Ziel" airport={route.to} />
      </div>

      <div className="routeStats">
        <div>
          <span>Entfernung</span>
          <strong>{Math.round(route.distanceNm)} NM</strong>
        </div>
        <div>
          <span>Geschätzte Flugzeit</span>
          <strong>{formatMinutes(route.estimatedMinutes)}</strong>
        </div>
        <div>
          <span>Abweichung</span>
          <strong>{formatMinutes(diff)}</strong>
        </div>
        <div>
          <span>Schwierigkeit</span>
          <strong>{route.difficulty}</strong>
        </div>
      </div>

      <p className="muted">
        Flugzeug: {route.aircraftCategory}. Die Route wird nach Entfernung, Flugzeit und
        Schwierigkeit passend ausgewählt.
      </p>

      <button className="primaryButton" disabled={isApplying} type="button" onClick={onApply}>
        {isApplying ? "Wird an X-Plane gesendet..." : "In X-Plane übernehmen"}
      </button>

      {result ? (
        <div className={result.ok ? "routeApplyMessage successBox" : "routeApplyMessage warningBox"}>
          <strong>{result.ok ? "Gesendet" : "Fehler"}</strong>
          <p>{result.message}</p>
          {result.ok ? (
            <small>
              X-Plane kann per UDP Wetter, Uhrzeit und Position setzen. Eine echte Parkposition,
              Startbahn-Auswahl oder ein anderes Flugzeug kann die Demo nicht sicher per UDP laden.
            </small>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AirportCard({ label, airport }: { label: string; airport: Airport }) {
  return (
    <div className="airportCard">
      <span>{label}</span>
      <strong>{airport.icao}</strong>
      <p>{airport.name}</p>
      <small>
        {airport.city}, {airport.country}
      </small>
      <small>{airport.runwayM} m Bahn</small>
      <small>{airport.notes}</small>
    </div>
  );
}

function AirportPicker({
  airports,
  isOpen,
  label,
  placeholder,
  searchValue,
  selectedIcao,
  onBlur,
  onChange,
  onClear,
  onFocus,
  onSelect,
}: {
  airports: Airport[];
  isOpen: boolean;
  label: string;
  placeholder: string;
  searchValue: string;
  selectedIcao: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onSelect: (airport: Airport) => void;
}) {
  return (
    <label className="airportPicker">
      {label}
      <div className="airportInputRow">
        <input
          placeholder={placeholder}
          value={searchValue}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
        />
        {selectedIcao ? (
          <button className="clearButton" type="button" onClick={onClear}>
            X
          </button>
        ) : null}
      </div>
      {isOpen && airports.length > 0 ? (
        <div className="airportList">
          {airports.map((airport) => (
            <button
              className="airportOption"
              key={airport.icao}
              type="button"
              onClick={() => onSelect(airport)}
            >
              <strong>{airport.icao}</strong>
              <span>{airport.name}</span>
              <small>
                {airport.city}, {airport.country}
              </small>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

function toPayload(form: WeatherForm) {
  return {
    location: form.location,
    temperatureC: Number(form.temperatureC),
    windDirectionDeg: Number(form.windDirectionDeg),
    windSpeedKt: Number(form.windSpeedKt),
    pressureHpa: Number(form.pressureHpa),
    visibilityM: Number(form.visibilityM),
    cloudCoverage: Number(form.cloudCoverage),
    rainPercent: Number(form.rainPercent),
    turbulence: Number(form.turbulence),
    timeOfDay: form.timeOfDay,
    timeZoneOffsetMinutes: Number(form.timeZoneOffsetMinutes),
    weatherRadiusKm: Number(form.weatherRadiusKm),
  };
}

function temperatureColor(value: number) {
  return colorScale(value, -30, 45, [
    "#0b3a75",
    "#0ea5e9",
    "#7dd3fc",
    "#fef08a",
    "#f59e0b",
    "#ef4444",
    "#7f1d1d",
  ]);
}

function directionColor(value: number) {
  return colorScale(value, 0, 360, ["#1d4ed8", "#06b6d4", "#14b8a6", "#2563eb", "#1d4ed8"]);
}

function dangerColor(value: number, max: number) {
  return colorScale(value, 0, max, ["#16a34a", "#84cc16", "#eab308", "#f97316", "#ef4444", "#991b1b"]);
}

function pressureColor(value: number) {
  return colorScale(value, 950, 1050, ["#b91c1c", "#f97316", "#eab308", "#16a34a", "#0ea5e9", "#1d4ed8"]);
}

function visibilityColor(value: number) {
  return colorScale(value, 200, 30000, ["#991b1b", "#ef4444", "#f97316", "#eab308", "#84cc16", "#16a34a"]);
}

function regionColor(value: number) {
  return colorScale(value, 5, 50, ["#2563eb", "#06b6d4", "#14b8a6", "#16a34a"]);
}

function durationColor(value: number) {
  return colorScale(value, 20, 900, ["#16a34a", "#0ea5e9", "#6366f1", "#a855f7", "#ef4444"]);
}

function createRoute(form: RouteForm): GeneratedRoute {
  const targetMinutes = Number(form.targetMinutes);
  const speedKt = aircraftSpeedsKt[form.aircraftCategory];
  const targetDistance = (speedKt * targetMinutes) / 60;
  const maxTimeDiff = routeTimeTolerance(targetMinutes);
  const candidates = airports.filter((airport) => airportMatchesFilters(airport, form));
  const fixedStart = airports.find((airport) => airport.icao === form.startAirport);
  const fixedEnd = airports.find((airport) => airport.icao === form.endAirport);
  const usableAirports = candidates.length >= 2 ? candidates : airports;
  const routeCandidates: GeneratedRoute[] = [];

  const startAirports = fixedStart ? [fixedStart] : usableAirports;
  const endAirports = fixedEnd ? [fixedEnd] : usableAirports;

  for (const from of startAirports) {
    for (const to of endAirports) {
      if (from.icao === to.icao) {
        continue;
      }

      const distanceNm = distanceBetweenAirports(from, to);
      const estimatedMinutes = Math.round((distanceNm / speedKt) * 60);
      const timeDiff = Math.abs(estimatedMinutes - targetMinutes);
      const distanceDiff = Math.abs(distanceNm - targetDistance);
      const score =
        distanceDiff +
        difficultyPenalty(from, form.difficulty) +
        difficultyPenalty(to, form.difficulty);

      routeCandidates.push({
        from,
        to,
        distanceNm,
        estimatedMinutes,
        targetMinutes,
        difficulty: form.difficulty,
        aircraftCategory: form.aircraftCategory,
        timeDiff,
        score,
      } as GeneratedRoute & { score: number; timeDiff: number });
    }
  }

  const strictRoutes = routeCandidates.filter((route) => {
    const timeDiff = (route as GeneratedRoute & { timeDiff: number }).timeDiff;
    return route.distanceNm > 20 && timeDiff <= maxTimeDiff;
  });

  const sortedRoutes = routeCandidates
    .filter((route) => route.distanceNm > 20)
    .sort((first, second) => {
      const firstScore = (first as GeneratedRoute & { score: number }).score;
      const secondScore = (second as GeneratedRoute & { score: number }).score;
      return firstScore - secondScore;
    })
    .slice(0, 18);

  const sortedStrictRoutes = strictRoutes
    .sort((first, second) => {
      const firstScore = (first as GeneratedRoute & { score: number }).score;
      const secondScore = (second as GeneratedRoute & { score: number }).score;
      return firstScore - secondScore;
    })
    .slice(0, 18);
  const selectableRoutes = sortedStrictRoutes.length > 0 ? sortedStrictRoutes : sortedRoutes;
  const pickedRoute =
    selectableRoutes[Math.floor(Math.random() * Math.max(selectableRoutes.length, 1))];

  return pickedRoute ?? {
    from: airports[0],
    to: airports[1],
    distanceNm: distanceBetweenAirports(airports[0], airports[1]),
    estimatedMinutes: Math.round((distanceBetweenAirports(airports[0], airports[1]) / speedKt) * 60),
    targetMinutes,
    difficulty: form.difficulty,
    aircraftCategory: form.aircraftCategory,
  };
}

function routeTimeTolerance(targetMinutes: number) {
  if (targetMinutes <= 60) {
    return 10;
  }

  if (targetMinutes < 120) {
    return 15;
  }

  if (targetMinutes <= 300) {
    return 20;
  }

  return 30;
}

function airportMatchesFilters(airport: Airport, form: RouteForm) {
  if (airport.icao === form.startAirport || airport.icao === form.endAirport) {
    return true;
  }

  const airportRank = airportDifficultyRank[airport.difficulty];
  const difficultyMatch =
    form.difficulty === "Einfach"
      ? airportRank === 1
      : form.difficulty === "Mittel"
        ? airportRank <= 2
        : form.difficulty === "Schwer"
          ? airportRank >= 2 && airportRank <= 3
          : airportRank >= 3;
  const regionMatch = form.region === "Alle" || airport.regions.includes(form.region);
  const rulesMatch = form.rules === "Alle" || airport.rules.includes(form.rules);
  const aircraftMatch =
    form.aircraftCategory !== "Jet" ||
    airport.runwayM >= (form.difficulty === "Extrem" ? 1800 : 2400);

  return difficultyMatch && regionMatch && rulesMatch && aircraftMatch;
}

function airportSearchOptions(searchValue: string) {
  const search = normalizeSearch(searchValue.trim());

  if (!search) {
    return airports;
  }

  return airports.filter((airport) => {
    const icao = normalizeSearch(airport.icao);
    const city = normalizeSearch(airport.city);
    const name = normalizeSearch(airport.name);
    const country = normalizeSearch(airport.country);
    return (
      icao.startsWith(search) ||
      city.startsWith(search) ||
      name.startsWith(search) ||
      country.startsWith(search)
    );
  });
}

function formatAirportOption(airport: Airport) {
  return `${airport.icao} - ${airport.name}`;
}

function difficultyPenalty(airport: Airport, difficulty: AirportDifficulty) {
  const rankDiff = Math.abs(airportDifficultyRank[airport.difficulty] - airportDifficultyRank[difficulty]);
  return rankDiff * 35;
}

function distanceBetweenAirports(first: Airport, second: Airport) {
  const earthRadiusNm = 3440.065;
  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);
  const latDiff = toRadians(second.lat - first.lat);
  const lonDiff = toRadians(second.lon - first.lon);
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusNm * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function formatMinutes(minutes: number) {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  return `${hours} h ${rest.toString().padStart(2, "0")} min`;
}

function colorScale(value: number, min: number, max: number, stops: string[]) {
  const ratio = clamp((value - min) / (max - min), 0, 1);
  const scaled = ratio * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  const localRatio = scaled - index;
  return mixHex(stops[index], stops[index + 1], localRatio);
}

function mixHex(from: string, to: string, amount: number) {
  const first = hexToRgb(from);
  const second = hexToRgb(to);
  const mixed = first.map((channel, index) =>
    Math.round(channel + (second[index] - channel) * amount),
  );
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((start) => parseInt(clean.slice(start, start + 2), 16));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
