"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { majorCities } from "@/lib/locations/major-cities";
import {
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

type ChallengeMode = "Eigenständig" | "Zur Route";

type ChallengeForm = {
  durationMinutes: string;
  difficulty: AirportDifficulty;
  mode: ChallengeMode;
};

type ScenarioForm = {
  durationMinutes: string;
  difficulty: AirportDifficulty;
};

type GeneratedRoute = {
  from: Airport;
  to: Airport;
  distanceNm: number;
  estimatedMinutes: number;
  targetMinutes: number;
  requestedMinutes?: number;
  wasAdjusted?: boolean;
  difficulty: AirportDifficulty;
  aircraftCategory: AircraftCategory;
};

type GeneratedChallenge = {
  title: string;
  mode: ChallengeMode;
  durationMinutes: number;
  difficulty: AirportDifficulty;
  summary: string;
  aircraft: string;
  weather: string;
  time: string;
  location: string;
  goals: string[];
  rules: string[];
  success: string[];
  routeNote?: string;
};

type GeneratedScenario = {
  title: string;
  type: string;
  durationMinutes: number;
  difficulty: AirportDifficulty;
  story: string;
  from: Airport;
  to: Airport;
  distanceNm: number;
  aircraft: string[];
  conditions: string[];
  goals: string[];
  specialRules: string[];
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

const initialChallengeForm: ChallengeForm = {
  durationMinutes: "45",
  difficulty: "Mittel",
  mode: "Eigenständig",
};

const initialScenarioForm: ScenarioForm = {
  durationMinutes: "90",
  difficulty: "Mittel",
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
  const [challengeForm, setChallengeForm] = useState<ChallengeForm>(initialChallengeForm);
  const [scenarioForm, setScenarioForm] = useState<ScenarioForm>(initialScenarioForm);
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
  const [generatedChallenge, setGeneratedChallenge] = useState<GeneratedChallenge | null>(null);
  const [generatedScenario, setGeneratedScenario] = useState<GeneratedScenario | null>(null);
  const [status, setStatus] = useState<ApiResult | null>(null);
  const [sendResult, setSendResult] = useState<ApiResult | null>(null);
  const [routeApplyResult, setRouteApplyResult] = useState<ApiResult | null>(null);
  const [challengeApplyResult, setChallengeApplyResult] = useState<ApiResult | null>(null);
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

  function generateChallenge() {
    setGeneratedChallenge(createChallenge(challengeForm, generatedRoute));
  }

  function generateScenario() {
    setGeneratedScenario(createScenario(scenarioForm));
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

  async function applyRouteAndChallengeToXPlane() {
    if (!generatedRoute || !generatedChallenge) {
      return;
    }

    setIsApplyingRoute(true);
    setChallengeApplyResult(null);

    const response = await fetch("/api/xplane/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(generatedRoute),
    });
    const data = (await response.json()) as ApiResult;

    setChallengeApplyResult({
      ...data,
      message: data.ok
        ? `Route ${generatedRoute.from.icao} nach ${generatedRoute.to.icao} wurde gesendet. Challenge: ${generatedChallenge.title}.`
        : data.message,
    });
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
            <strong>Zufällige Flugaufgaben erstellen</strong>
          </button>
          <button className="menuTile scenarioTile" type="button" onClick={() => setActiveView("scenario")}>
            <span className="menuTileTitle">Szenario</span>
            <strong>Flugmission mit Auftrag erstellen</strong>
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
                onOpenChallenge={() => {
                  setChallengeForm({ ...challengeForm, mode: "Zur Route" });
                  setActiveView("challenge");
                }}
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

  if (activeView === "challenge") {
    const usesRouteDuration = challengeForm.mode === "Zur Route" && generatedRoute;
    const challengeDuration = usesRouteDuration
      ? generatedRoute.estimatedMinutes
      : Number(challengeForm.durationMinutes);
    return (
      <main className="shell" data-theme={theme}>
        <section className="topline">
          <div>
            <p className="eyebrow">SimFlight Generator</p>
            <h1>Challenge</h1>
          </div>
          <div className="topActions">
            <button className="secondaryButton" type="button" onClick={toggleTheme}>
              {themeButtonLabel}
            </button>
            <button className="secondaryButton" type="button" onClick={() => setActiveView("route")}>
              Zur Route
            </button>
            <button className="secondaryButton" type="button" onClick={() => setActiveView("menu")}>
              Zum Menü
            </button>
          </div>
        </section>

        <section className="routeWorkspace">
          <form className="panel routePanel" onSubmit={(event) => event.preventDefault()}>
            <div className="panelHeader">
              <h2>Challenge generieren</h2>
              <p>Wähle Schwierigkeit und ob die Aufgabe allein oder mit deiner Route läuft.</p>
            </div>

            {challengeForm.mode === "Eigenständig" ? (
              <Slider
                label="Dauer"
                unit=""
                min="10"
                max="180"
                step="5"
                value={challengeForm.durationMinutes}
                displayValue={formatMinutes(challengeDuration)}
                color={durationColor(challengeDuration * 5)}
                onChange={(value) => setChallengeForm({ ...challengeForm, durationMinutes: value })}
              />
            ) : (
              <div className="routeDurationBox">
                <span>Dauer</span>
                <strong>
                  {generatedRoute ? formatMinutes(generatedRoute.estimatedMinutes) : "Keine Route vorhanden"}
                </strong>
                <p>
                  {generatedRoute
                    ? "Die Challenge nutzt automatisch die Flugzeit deiner Route."
                    : "Erstelle zuerst eine Route oder nutze den Modus Eigenständig."}
                </p>
              </div>
            )}

            <div className="routeControls">
              <label>
                Schwierigkeit
                <select
                  value={challengeForm.difficulty}
                  onChange={(event) =>
                    setChallengeForm({
                      ...challengeForm,
                      difficulty: event.target.value as AirportDifficulty,
                    })
                  }
                >
                  <option>Einfach</option>
                  <option>Mittel</option>
                  <option>Schwer</option>
                  <option>Extrem</option>
                </select>
              </label>

              <label>
                Modus
                <select
                  value={challengeForm.mode}
                  onChange={(event) =>
                    setChallengeForm({ ...challengeForm, mode: event.target.value as ChallengeMode })
                  }
                >
                  <option>Eigenständig</option>
                  <option>Zur Route</option>
                </select>
              </label>
            </div>

            {challengeForm.mode === "Zur Route" && !generatedRoute ? (
              <div className="note">
                Es gibt noch keine Route. Die Challenge wird trotzdem erstellt. Sie kann später mit
                einer Route kombiniert werden.
              </div>
            ) : null}

            <button className="primaryButton" type="button" onClick={generateChallenge}>
              Challenge generieren
            </button>
          </form>

          <aside className="panel routeResultPanel">
            <h2>Aufgabe</h2>
            {generatedChallenge ? (
              <ChallengeResult
                applyResult={challengeApplyResult}
                challenge={generatedChallenge}
                hasRoute={Boolean(generatedRoute)}
                isApplying={isApplyingRoute}
                onApplyRouteAndChallenge={applyRouteAndChallengeToXPlane}
              />
            ) : (
              <p className="muted">Noch keine Challenge generiert.</p>
            )}
          </aside>
        </section>
      </main>
    );
  }

  if (activeView === "scenario") {
    const scenarioDuration = Number(scenarioForm.durationMinutes);

    return (
      <main className="shell" data-theme={theme}>
        <section className="topline">
          <div>
            <p className="eyebrow">SimFlight Generator</p>
            <h1>Szenario</h1>
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
              <h2>Szenario generieren</h2>
              <p>Wähle Dauer und Schwierigkeit. Danach erstellt die App einen passenden Flugauftrag.</p>
            </div>

            <Slider
              label="Flugdauer"
              unit=""
              min="20"
              max="900"
              step="10"
              value={scenarioForm.durationMinutes}
              displayValue={formatMinutes(scenarioDuration)}
              color={durationColor(scenarioDuration)}
              onChange={(value) => setScenarioForm({ ...scenarioForm, durationMinutes: value })}
            />

            <div className="routeControls">
              <label>
                Schwierigkeit
                <select
                  value={scenarioForm.difficulty}
                  onChange={(event) =>
                    setScenarioForm({
                      ...scenarioForm,
                      difficulty: event.target.value as AirportDifficulty,
                    })
                  }
                >
                  <option>Einfach</option>
                  <option>Mittel</option>
                  <option>Schwer</option>
                  <option>Extrem</option>
                </select>
              </label>
            </div>

            <button className="primaryButton" type="button" onClick={generateScenario}>
              Szenario generieren
            </button>
          </form>

          <aside className="panel routeResultPanel">
            <h2>Mission</h2>
            {generatedScenario ? (
              <ScenarioResult scenario={generatedScenario} />
            ) : (
              <p className="muted">Noch kein Szenario generiert.</p>
            )}
          </aside>
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
  onOpenChallenge,
  result,
  route,
}: {
  isApplying: boolean;
  onApply: () => void;
  onOpenChallenge: () => void;
  result: ApiResult | null;
  route: GeneratedRoute;
}) {
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
          <span>Schwierigkeit</span>
          <strong>{route.difficulty}</strong>
        </div>
      </div>

      <p className="muted">
        Flugzeug: {route.aircraftCategory}. Die Route wird nach Entfernung, Flugzeit und
        Schwierigkeit passend ausgewählt.
      </p>

      <button className="secondaryActionButton" type="button" onClick={onOpenChallenge}>
        Challenge zu dieser Route erstellen
      </button>

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

function ChallengeResult({
  applyResult,
  challenge,
  hasRoute,
  isApplying,
  onApplyRouteAndChallenge,
}: {
  applyResult: ApiResult | null;
  challenge: GeneratedChallenge;
  hasRoute: boolean;
  isApplying: boolean;
  onApplyRouteAndChallenge: () => void;
}) {
  return (
    <div className="challengeResult">
      <div className="challengeHero">
        <span>{challenge.mode}</span>
        <h2>{challenge.title}</h2>
        <p>{challenge.summary}</p>
      </div>

      <div className="routeStats">
        <div>
          <span>Dauer</span>
          <strong>{formatMinutes(challenge.durationMinutes)}</strong>
        </div>
        <div>
          <span>Schwierigkeit</span>
          <strong>{challenge.difficulty}</strong>
        </div>
        <div>
          <span>Flugzeug</span>
          <strong>{challenge.aircraft}</strong>
        </div>
        <div>
          <span>Ort</span>
          <strong>{challenge.location}</strong>
        </div>
      </div>

      {challenge.routeNote ? <p className="routeNote">{challenge.routeNote}</p> : null}

      <div className="challengeInfoGrid">
        <ChallengeList title="Ziele" items={challenge.goals} />
        <ChallengeList title="Regeln" items={challenge.rules} />
        <ChallengeList title="Erfolg" items={challenge.success} />
        <div className="challengeBox">
          <h3>Bedingungen</h3>
          <p>
            <strong>Wetter:</strong> {challenge.weather}
          </p>
          <p>
            <strong>Zeit:</strong> {challenge.time}
          </p>
        </div>
      </div>

      {hasRoute ? (
        <button
          className="primaryButton"
          disabled={isApplying}
          type="button"
          onClick={onApplyRouteAndChallenge}
        >
          {isApplying ? "Wird an X-Plane gesendet..." : "Route und Challenge übernehmen"}
        </button>
      ) : (
        <div className="note">
          Diese Challenge ist eigenständig. Ohne Route gibt es nichts Sinnvolles, was X-Plane
          automatisch laden muss.
        </div>
      )}

      {applyResult ? (
        <div className={applyResult.ok ? "routeApplyMessage successBox" : "routeApplyMessage warningBox"}>
          <strong>{applyResult.ok ? "Gesendet" : "Fehler"}</strong>
          <p>{applyResult.message}</p>
          {applyResult.ok ? (
            <small>
              Die Challenge-Regeln stehen hier in der App. X-Plane bekommt die Route, Position,
              Uhrzeit und Wetter.
            </small>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ChallengeList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="challengeBox">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioResult({ scenario }: { scenario: GeneratedScenario }) {
  return (
    <div className="challengeResult">
      <div className="challengeHero">
        <span>{scenario.type}</span>
        <h2>{scenario.title}</h2>
        <p>{scenario.story}</p>
      </div>

      <div className="routeAirports">
        <AirportCard label="Start" airport={scenario.from} />
        <AirportCard label="Ziel" airport={scenario.to} />
      </div>

      <div className="routeStats">
        <div>
          <span>Dauer</span>
          <strong>{formatMinutes(scenario.durationMinutes)}</strong>
        </div>
        <div>
          <span>Entfernung</span>
          <strong>{Math.round(scenario.distanceNm)} NM</strong>
        </div>
        <div>
          <span>Schwierigkeit</span>
          <strong>{scenario.difficulty}</strong>
        </div>
        <div>
          <span>Flugzeug</span>
          <strong>{scenario.aircraft[0]}</strong>
        </div>
      </div>

      <div className="challengeInfoGrid">
        <ChallengeList title="Missionsziele" items={scenario.goals} />
        <ChallengeList title="Bedingungen" items={scenario.conditions} />
        <ChallengeList title="Besondere Regeln" items={scenario.specialRules} />
        <ChallengeList title="Empfohlene Flugzeuge" items={scenario.aircraft} />
      </div>
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

function createChallenge(form: ChallengeForm, route: GeneratedRoute | null): GeneratedChallenge {
  const durationMinutes =
    form.mode === "Zur Route" && route ? route.estimatedMinutes : Number(form.durationMinutes);
  const pool = challengeTemplates.filter((template) =>
    airportDifficultyRank[template.minDifficulty] <= airportDifficultyRank[form.difficulty],
  );
  const template = pickRandom(pool);
  const weather = pickByDifficulty(challengeWeather, form.difficulty);
  const aircraft = pickByDifficulty(challengeAircraft, form.difficulty);
  const extraRule = pickByDifficulty(challengeRules, form.difficulty);
  const extraGoal = pickByDifficulty(challengeGoals, form.difficulty);
  const location =
    form.mode === "Zur Route" && route
      ? `${route.from.icao} nach ${route.to.icao}`
      : pickRandom(challengeLocations);
  const routeNote =
    form.mode === "Zur Route" && route
      ? `Zusatzaufgabe für deine Route ${route.from.icao} nach ${route.to.icao}.`
      : form.mode === "Zur Route"
        ? "Noch keine Route vorhanden. Diese Aufgabe kann später zu einer Route gelegt werden."
        : undefined;

  return {
    title: template.title,
    mode: form.mode,
    durationMinutes,
    difficulty: form.difficulty,
    summary: template.summary,
    aircraft,
    weather,
    time: pickByDifficulty(challengeTimes, form.difficulty),
    location,
    goals: [template.goal, extraGoal, durationGoal(durationMinutes)],
    rules: [template.rule, extraRule],
    success: [template.success, "Flug stabil beenden und nicht neu laden.", "Nach dem Flug kurz bewerten: geschafft, knapp oder gescheitert."],
    routeNote,
  };
}

const challengeTemplates: {
  title: string;
  minDifficulty: AirportDifficulty;
  summary: string;
  goal: string;
  rule: string;
  success: string;
}[] = [
  {
    title: "Präzisionslandung",
    minDifficulty: "Einfach",
    summary: "Lande so genau wie möglich auf dem Zielpunkt der Bahn.",
    goal: "Setze im ersten Drittel der Landebahn auf.",
    rule: "Kein Durchstarten, außer der Anflug ist klar unsicher.",
    success: "Landung bleibt auf der Bahn und unter Kontrolle.",
  },
  {
    title: "Ohne Autopilot",
    minDifficulty: "Einfach",
    summary: "Fliege die ganze Aufgabe von Hand.",
    goal: "Halte Höhe, Kurs und Geschwindigkeit ruhig.",
    rule: "Autopilot bleibt während der ganzen Challenge aus.",
    success: "Anflug und Landung werden ohne Autopilot geschafft.",
  },
  {
    title: "Kurzer Frachtauftrag",
    minDifficulty: "Einfach",
    summary: "Eine kleine Fracht muss pünktlich und sicher ankommen.",
    goal: "Fliege sauber und vermeide harte Manöver.",
    rule: "Sinkrate bei der Landung möglichst niedrig halten.",
    success: "Fracht kommt ohne harte Landung an.",
  },
  {
    title: "Passagierkomfort",
    minDifficulty: "Einfach",
    summary: "Der Flug soll ruhig und angenehm bleiben.",
    goal: "Vermeide starke Kurven und große Höhenwechsel.",
    rule: "Keine Manöver über 30 Grad Schräglage.",
    success: "Der Flug bleibt ruhig bis zur Landung.",
  },
  {
    title: "VFR-Sichtflug",
    minDifficulty: "Mittel",
    summary: "Navigiere mit Sicht nach draußen und ohne wilde Abkürzungen.",
    goal: "Folge Küste, Fluss, Straße oder Tal.",
    rule: "GPS nur zur Kontrolle nutzen.",
    success: "Zielgebiet ohne große Umwege erreichen.",
  },
  {
    title: "Seitenwind-Training",
    minDifficulty: "Mittel",
    summary: "Trainiere Start und Landung bei spürbarem Seitenwind.",
    goal: "Halte die Mittellinie beim Start und bei der Landung.",
    rule: "Nicht auf eine andere Bahn wechseln.",
    success: "Flugzeug bleibt nach dem Aufsetzen sauber auf der Bahn.",
  },
  {
    title: "Zeitdruck",
    minDifficulty: "Mittel",
    summary: "Du hast ein enges Zeitfenster und musst trotzdem sauber fliegen.",
    goal: "Komme innerhalb von 5 Minuten um die Zielzeit an.",
    rule: "Keine unrealistischen Sturzflüge zum Aufholen.",
    success: "Zielzeit erreicht und sichere Landung gemacht.",
  },
  {
    title: "Schlechte Sicht",
    minDifficulty: "Schwer",
    summary: "Der Anflug ist durch Dunst, Wolken oder Regen schwerer.",
    goal: "Bleibe ruhig und fliege einen stabilen Endanflug.",
    rule: "Unter 500 ft keine großen Kurskorrekturen mehr.",
    success: "Sichtanflug oder Instrumentenanflug wird stabil beendet.",
  },
  {
    title: "Treibstoff knapp",
    minDifficulty: "Schwer",
    summary: "Plane sparsam. Du hast keine großen Reserven.",
    goal: "Fliege ohne unnötige Umwege.",
    rule: "Maximal ein Fehlanflug ist erlaubt.",
    success: "Landung vor Ablauf der Challenge-Zeit.",
  },
  {
    title: "Bergtal-Anflug",
    minDifficulty: "Schwer",
    summary: "Fliege in schwierigem Gelände mit wenig Platz.",
    goal: "Folge dem Gelände und halte sichere Höhe.",
    rule: "Keine tiefen Kurven in engen Tälern.",
    success: "Landung ohne Terrain-Warnung oder Kontrollverlust.",
  },
  {
    title: "Notfall: Motorproblem",
    minDifficulty: "Extrem",
    summary: "Ein Triebwerk liefert nur noch begrenzte Leistung.",
    goal: "Fliege sparsam und wähle einen sicheren Anflug.",
    rule: "Steigflüge nur wenn wirklich nötig.",
    success: "Sichere Landung trotz Leistungsproblem.",
  },
  {
    title: "Sturmfront",
    minDifficulty: "Extrem",
    summary: "Wetter und Wind machen den Flug sehr anspruchsvoll.",
    goal: "Bleibe kontrolliert und brich zu riskante Anflüge ab.",
    rule: "Nur ein Durchstarten ist erlaubt.",
    success: "Landung ohne Kontrollverlust.",
  },
];

const challengeWeather = {
  Einfach: ["Klar, gute Sicht, leichter Wind", "Hohe Wolken, ruhige Luft", "Sommerliches Wetter mit 8 kt Wind"],
  Mittel: ["Leichter Regen, 15 kt Wind", "Dunst, mittlere Wolken, etwas Turbulenz", "Windig mit 20 kt Seitenwind"],
  Schwer: ["Schlechte Sicht, tiefe Wolken, 28 kt Wind", "Regen und Turbulenz im Anflug", "Wechselhaftes Wetter mit Böen"],
  Extrem: ["Sturm, starke Böen und sehr schlechte Sicht", "Tiefe Wolken, Regen, Turbulenz und Seitenwind", "Morgendämmerung mit Sturmfront"],
};

const challengeAircraft = {
  Einfach: ["Cessna 172", "kleiner Propellerflieger", "leichter Trainer"],
  Mittel: ["King Air", "Turboprop", "kleiner Businessjet"],
  Schwer: ["Regionaljet", "Turboprop mit voller Beladung", "kleiner Jet"],
  Extrem: ["schwer beladener Jet", "einmotoriger Flieger im Grenzbereich", "Businessjet bei schlechtem Wetter"],
};

const challengeRules = {
  Einfach: ["Nutze normale Checklisten.", "Fliege mit ruhigen Steuerbewegungen.", "Keine Pause während Start und Landung."],
  Mittel: ["Autopilot erst über 3000 ft erlaubt.", "Fliege den Endanflug komplett von Hand.", "Keine Außenansicht im Endanflug."],
  Schwer: ["Ein Fehlanflug ist erlaubt.", "Kein Autopilot unter 5000 ft.", "Landeklappen erst setzen, wenn der Anflug stabil ist."],
  Extrem: ["Kein Autopilot während der ganzen Mission.", "Keine zweite Chance nach Kontrollverlust.", "Bei unstabilem Anflug sofort durchstarten."],
};

const challengeGoals = {
  Einfach: ["Halte die Zielhöhe mit maximal 300 ft Abweichung.", "Lande weich und mittig.", "Bleibe die ganze Zeit unter Kontrolle."],
  Mittel: ["Halte Geschwindigkeit im Endanflug sauber.", "Plane einen klaren Sinkflug.", "Vermeide unnötige Kurswechsel."],
  Schwer: ["Halte den Anflug ab 1000 ft stabil.", "Triff den Sinkpfad ohne hektische Korrektur.", "Nutze Wind und Gelände bewusst."],
  Extrem: ["Treffe harte Entscheidungen früh.", "Rette den Flug ohne unrealistische Manöver.", "Behalte auch bei Stress klare Prioritäten."],
};

const challengeTimes = {
  Einfach: ["Mittag", "Vormittag", "später Nachmittag"],
  Mittel: ["früher Morgen", "Sonnenuntergang", "bewölkter Nachmittag"],
  Schwer: ["Dämmerung", "später Abend", "grauer Morgen"],
  Extrem: ["Nacht", "Morgendämmerung", "Sturm kurz vor Sonnenuntergang"],
};

const challengeLocations = [
  "Alpenregion",
  "Küste",
  "Insel-Flughafen",
  "Großstadt-Flughafen",
  "kurze Landebahn",
  "Bergflugplatz",
  "abgelegene Region",
  "enger Talflug",
  "nordische Küste",
  "Wüstenregion",
];

function pickByDifficulty(options: Record<AirportDifficulty, string[]>, difficulty: AirportDifficulty) {
  return pickRandom(options[difficulty]);
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function durationGoal(durationMinutes: number) {
  if (durationMinutes <= 30) {
    return "Kurze Aufgabe: schnell vorbereiten und ohne Hektik fliegen.";
  }

  if (durationMinutes <= 90) {
    return "Mittlere Aufgabe: Flug sauber planen und konzentriert bleiben.";
  }

  return "Lange Aufgabe: Energie, Wetter und Anflug früh planen.";
}

function createScenario(form: ScenarioForm): GeneratedScenario {
  const requestedMinutes = Number(form.durationMinutes);
  const templatePool = scenarioTemplates.filter(
    (template) => airportDifficultyRank[template.minDifficulty] <= airportDifficultyRank[form.difficulty],
  );
  const template = pickRandom(templatePool);
  const route = pickScenarioRoute(requestedMinutes, form.difficulty, template.aircraftCategory);
  const conditions = [
    pickByDifficulty(scenarioWeather, form.difficulty),
    pickByDifficulty(scenarioPressure, form.difficulty),
    scenarioTimeText(requestedMinutes, form.difficulty),
  ];

  return {
    title: template.title,
    type: template.type,
    durationMinutes: route.estimatedMinutes,
    difficulty: form.difficulty,
    story: template.story(route.from, route.to),
    from: route.from,
    to: route.to,
    distanceNm: route.distanceNm,
    aircraft: template.aircraft,
    conditions,
    goals: template.goals(route.from, route.to),
    specialRules: [
      template.rule,
      pickByDifficulty(scenarioRules, form.difficulty),
      `Plane den Flug für ungefähr ${formatMinutes(route.estimatedMinutes)}.`,
    ],
  };
}

const scenarioTemplates: {
  title: string;
  type: string;
  minDifficulty: AirportDifficulty;
  aircraftCategory: AircraftCategory;
  aircraft: string[];
  rule: string;
  story: (from: Airport, to: Airport) => string;
  goals: (from: Airport, to: Airport) => string[];
}[] = [
  {
    title: "Morgenflug zwischen Großstädten",
    type: "Passagierflug",
    minDifficulty: "Einfach",
    aircraftCategory: "Jet",
    aircraft: ["Airbus A320", "Boeing 737", "Embraer E-Jet"],
    rule: "Halte den Flug ruhig und komfortabel.",
    story: (from, to) =>
      `Eine volle Maschine wartet in ${from.city}. Die Passagiere müssen pünktlich nach ${to.city}, weil viele dort Anschlussflüge haben.`,
    goals: (from, to) => [
      `Starte sicher in ${from.icao}.`,
      `Fliege eine stabile Reiseflugphase nach ${to.icao}.`,
      "Lande weich und möglichst pünktlich.",
    ],
  },
  {
    title: "Eilige Ersatzteile",
    type: "Frachttransport",
    minDifficulty: "Mittel",
    aircraftCategory: "Turboprop",
    aircraft: ["Beechcraft King Air", "DHC-6 Twin Otter", "ATR 72 Cargo"],
    rule: "Die Fracht darf nicht durch harte Manöver beschädigt werden.",
    story: (from, to) =>
      `In ${to.city} steht ein Flugzeug wegen eines Defekts. Von ${from.city} müssen Ersatzteile schnell geliefert werden.`,
    goals: (from, to) => [
      `Belade die Fracht in ${from.icao}.`,
      "Fliege ohne unnötige Umwege.",
      `Rolle nach der Landung in ${to.icao} sicher aus.`,
    ],
  },
  {
    title: "Inselhüpfen mit Zeitplan",
    type: "Inselauftrag",
    minDifficulty: "Mittel",
    aircraftCategory: "Turboprop",
    aircraft: ["DHC-6 Twin Otter", "Cessna Caravan", "King Air"],
    rule: "Bleibe unter der Wolkendecke, wenn es sicher möglich ist.",
    story: (from, to) =>
      `Zwischen ${from.city} und ${to.city} müssen Passagiere und Post transportiert werden. Das Wetter kann über dem Wasser schnell wechseln.`,
    goals: (from, to) => [
      "Halte genug Abstand zu Wolken und Wasser.",
      `Finde ${to.icao} ohne lange Suche.`,
      "Lande kontrolliert auch bei Seitenwind.",
    ],
  },
  {
    title: "Geschäftsreise unter Druck",
    type: "Businessflug",
    minDifficulty: "Einfach",
    aircraftCategory: "Jet",
    aircraft: ["Citation CJ4", "Phenom 300", "Learjet"],
    rule: "Der Flug soll schnell sein, aber nicht hektisch.",
    story: (from, to) =>
      `Ein Team muss von ${from.city} nach ${to.city}. Vor Ort startet direkt nach der Landung ein wichtiger Termin.`,
    goals: (from, to) => [
      "Starte ohne Verzögerung.",
      "Halte den Sinkflug früh geplant.",
      `Komme sicher in ${to.icao} an.`,
    ],
  },
  {
    title: "Suchflug nach vermisstem Boot",
    type: "Rettungsflug",
    minDifficulty: "Schwer",
    aircraftCategory: "Propeller",
    aircraft: ["Cessna 172", "Cessna 208 Caravan", "Kodiak 100"],
    rule: "Fliege niedrig genug zum Suchen, aber immer mit sicherer Reserve.",
    story: (from, to) =>
      `Nahe ${to.city} wird ein kleines Boot vermisst. Du startest in ${from.city} und suchst das Gebiet aus der Luft ab.`,
    goals: () => [
      "Fliege ein ruhiges Suchmuster.",
      "Halte Sichtkontakt zum Gelände oder Wasser.",
      "Kehre mit genug Treibstoff sicher zurück oder lande am Ziel.",
    ],
  },
  {
    title: "Versorgung in abgelegene Region",
    type: "Versorgungsflug",
    minDifficulty: "Schwer",
    aircraftCategory: "Turboprop",
    aircraft: ["Cessna Caravan", "Pilatus PC-12", "DHC-6 Twin Otter"],
    rule: "Die Landung muss sicher sein. Kein unnötiges Risiko wegen Zeitdruck.",
    story: (from, to) =>
      `In ${to.city} werden Medikamente und Lebensmittel gebraucht. Die Strecke ab ${from.city} führt in schwierigeres Gebiet.`,
    goals: (from, to) => [
      `Starte mit der Versorgungsladung in ${from.icao}.`,
      "Achte auf Wetter und Gelände.",
      `Liefere die Ladung in ${to.icao} ab.`,
    ],
  },
  {
    title: "VIP-Flug bei schlechtem Wetter",
    type: "VIP-Transport",
    minDifficulty: "Extrem",
    aircraftCategory: "Jet",
    aircraft: ["Businessjet", "Citation X", "Gulfstream"],
    rule: "Sicherheit geht vor. Brich einen unstabilen Anflug sofort ab.",
    story: (from, to) =>
      `Ein VIP muss von ${from.city} nach ${to.city}. Das Wetter ist schlecht und der Zeitplan eng.`,
    goals: () => [
      "Fliege professionell und ohne harte Manöver.",
      "Halte den Anflug ab 1000 ft stabil.",
      "Lande sicher oder starte rechtzeitig durch.",
    ],
  },
  {
    title: "Buschflug mit knapper Piste",
    type: "Buschflug",
    minDifficulty: "Extrem",
    aircraftCategory: "Propeller",
    aircraft: ["Cessna 208 Caravan", "Kodiak 100", "DHC-2 Beaver"],
    rule: "Nutze kurze Start- und Landetechnik.",
    story: (from, to) =>
      `Von ${from.city} geht es zu einer kleinen Piste nahe ${to.city}. Die Menschen dort warten auf Werkzeug und Ersatzteile.`,
    goals: () => [
      "Plane den Anflug sehr früh.",
      "Halte die Geschwindigkeit exakt.",
      "Setze kurz und kontrolliert auf.",
    ],
  },
];

const scenarioWeather = {
  Einfach: ["Gutes Wetter mit klarer Sicht", "Leichte Wolken und ruhiger Wind", "Normales Reisewetter"],
  Mittel: ["Leichter Seitenwind", "Wechselnde Wolken und etwas Dunst", "Leichter Regen im Zielgebiet"],
  Schwer: ["Böiger Wind und tiefe Wolken", "Schlechte Sicht im Anflug", "Regen und spürbare Turbulenz"],
  Extrem: ["Starker Seitenwind und schlechte Sicht", "Sturmfront nahe dem Ziel", "Tiefe Wolken mit starkem Regen"],
};

const scenarioPressure = {
  Einfach: ["Kein besonderer Zeitdruck", "Normale Beladung", "Ruhiger Ablauf"],
  Mittel: ["Leichter Zeitdruck", "Volle Kabine oder wichtige Fracht", "ATC gibt eine enge Ankunftszeit vor"],
  Schwer: ["Knappe Reserve und schwieriges Ziel", "Hohe Beladung und anspruchsvoller Anflug", "Wetterfenster ist begrenzt"],
  Extrem: ["Sehr enger Zeitplan", "Notfallauftrag mit Risiko", "Nur ein sicherer Anflugversuch empfohlen"],
};

const scenarioRules = {
  Einfach: ["Nutze normale Verfahren.", "Fliege den Anflug sauber und ruhig.", "Halte genug Abstand zu schlechtem Wetter."],
  Mittel: ["Autopilot ist erlaubt, aber der Endanflug soll von Hand sein.", "Plane Treibstoff und Sinkflug früh.", "Bleibe innerhalb sicherer Geschwindigkeiten."],
  Schwer: ["Ein Durchstarten ist erlaubt.", "Kein hektischer Sinkflug kurz vor dem Ziel.", "Unter 1000 ft muss der Anflug stabil sein."],
  Extrem: ["Bei unstabilem Anflug sofort durchstarten.", "Kein Autopilot im Endanflug.", "Sicherheit ist wichtiger als der Auftrag."],
};

function pickScenarioRoute(
  requestedMinutes: number,
  difficulty: AirportDifficulty,
  aircraftCategory: AircraftCategory,
) {
  const routeForm: RouteForm = {
    targetMinutes: String(requestedMinutes),
    difficulty,
    region: "Alle",
    rules: "Alle",
    aircraftCategory,
    startAirport: "",
    endAirport: "",
    startAirportSearch: "",
    endAirportSearch: "",
  };

  return createRoute(routeForm);
}

function scenarioTimeText(requestedMinutes: number, difficulty: AirportDifficulty) {
  const time = requestedMinutes > 240 ? "längerer Flug" : requestedMinutes > 90 ? "mittlerer Flug" : "kurzer Flug";
  const pressure = difficulty === "Extrem" || difficulty === "Schwer" ? "mit genauer Planung" : "mit normaler Vorbereitung";
  return `${time} ${pressure}`;
}

function createRoute(form: RouteForm): GeneratedRoute {
  const requestedMinutes = Number(form.targetMinutes);
  const candidates = airports.filter((airport) => airportMatchesFilters(airport, form));
  const fixedStart = airports.find((airport) => airport.icao === form.startAirport);
  const fixedEnd = airports.find((airport) => airport.icao === form.endAirport);
  const usableAirports = candidates.length >= 2 ? candidates : airports;
  const routeCandidates: GeneratedRoute[] = [];

  const startAirports = fixedStart ? [fixedStart] : usableAirports;
  const endAirports = fixedEnd ? [fixedEnd] : usableAirports;
  const maxRangeNm = realisticMaxRangeNm(form.aircraftCategory);

  for (const from of startAirports) {
    for (const to of endAirports) {
      if (from.icao === to.icao) {
        continue;
      }

      const distanceNm = distanceBetweenAirports(from, to);

      if (distanceNm > maxRangeNm) {
        continue;
      }

      const estimatedMinutes = estimateFlightMinutes(distanceNm, form.aircraftCategory, from, to);

      routeCandidates.push({
        from,
        to,
        distanceNm,
        estimatedMinutes,
        targetMinutes: requestedMinutes,
        requestedMinutes,
        difficulty: form.difficulty,
        aircraftCategory: form.aircraftCategory,
      });
    }
  }

  const possibleRoutes = routeCandidates.filter((route) => route.distanceNm > 20);
  const bestTargetMinutes = closestPossibleTargetMinutes(possibleRoutes, requestedMinutes);
  let targetMinutes = bestTargetMinutes ?? requestedMinutes;
  let maxTimeDiff = routeTimeTolerance(targetMinutes);
  let wasAdjusted = bestTargetMinutes !== null && Math.abs(bestTargetMinutes - requestedMinutes) > maxTimeDiff;
  let scoredRoutes = scoreRoutes(possibleRoutes, form, targetMinutes, requestedMinutes, wasAdjusted);
  let strictRoutes = scoredRoutes.filter((route) => route.timeDiff <= maxTimeDiff);

  if (strictRoutes.length === 0 && scoredRoutes.length > 0) {
    const nearestRoute = scoredRoutes.reduce((bestRoute, route) =>
      route.timeDiff < bestRoute.timeDiff ? route : bestRoute,
    );
    targetMinutes = nearestRoute.estimatedMinutes;
    maxTimeDiff = routeTimeTolerance(targetMinutes);
    wasAdjusted = true;
    scoredRoutes = scoreRoutes(possibleRoutes, form, targetMinutes, requestedMinutes, wasAdjusted);
    strictRoutes = scoredRoutes.filter((route) => route.timeDiff <= maxTimeDiff);
  }

  const sortedRoutes = scoredRoutes
    .sort((first, second) => {
      const firstScore = (first as GeneratedRoute & { score: number }).score;
      const secondScore = (second as GeneratedRoute & { score: number }).score;
      return firstScore - secondScore;
    })
    .slice(0, 80);

  const sortedStrictRoutes = strictRoutes
    .sort((first, second) => first.score - second.score)
    .slice(0, 60);
  const selectableRoutes = sortedStrictRoutes.length > 0 ? sortedStrictRoutes : sortedRoutes;
  const pickedRoute =
    selectableRoutes[Math.floor(Math.random() * Math.max(selectableRoutes.length, 1))];

  return pickedRoute ?? {
    from: airports[0],
    to: airports[1],
    distanceNm: distanceBetweenAirports(airports[0], airports[1]),
    estimatedMinutes: estimateFlightMinutes(
      distanceBetweenAirports(airports[0], airports[1]),
      form.aircraftCategory,
      airports[0],
      airports[1],
    ),
    targetMinutes: requestedMinutes,
    requestedMinutes,
    difficulty: form.difficulty,
    aircraftCategory: form.aircraftCategory,
  };
}

function scoreRoutes(
  routes: GeneratedRoute[],
  form: RouteForm,
  targetMinutes: number,
  requestedMinutes: number,
  wasAdjusted: boolean,
) {
  return routes.map((route) => {
    const timeDiff = Math.abs(route.estimatedMinutes - targetMinutes);
    const score =
      timeDiff * 12 +
      difficultyPenalty(route.from, form.difficulty) +
      difficultyPenalty(route.to, form.difficulty);

    return {
      ...route,
      targetMinutes,
      requestedMinutes,
      wasAdjusted,
      timeDiff,
      score,
    } as GeneratedRoute & { score: number; timeDiff: number };
  });
}

function realisticMaxRangeNm(aircraftCategory: AircraftCategory) {
  if (aircraftCategory === "Jet") {
    return 3200;
  }

  if (aircraftCategory === "Turboprop") {
    return 1200;
  }

  return 550;
}

function closestPossibleTargetMinutes(routes: GeneratedRoute[], requestedMinutes: number) {
  if (routes.length === 0) {
    return null;
  }

  const sortedMinutes = routes
    .map((route) => route.estimatedMinutes)
    .sort((first, second) => first - second);
  const minMinutes = sortedMinutes[0];
  const maxMinutes = sortedMinutes[sortedMinutes.length - 1];

  if (requestedMinutes < minMinutes) {
    return minMinutes;
  }

  if (requestedMinutes > maxMinutes) {
    return maxMinutes;
  }

  return requestedMinutes;
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

function estimateFlightMinutes(
  distanceNm: number,
  aircraftCategory: AircraftCategory,
  from: Airport,
  to: Airport,
) {
  const routeFactor = routeDistanceFactor(distanceNm, aircraftCategory);
  const plannedDistanceNm = distanceNm * routeFactor;
  const cruiseSpeedKt = realisticCruiseSpeed(distanceNm, aircraftCategory);
  const fixedMinutes = fixedFlightMinutes(distanceNm, aircraftCategory, from, to);
  const cruiseMinutes = (plannedDistanceNm / cruiseSpeedKt) * 60;

  return Math.max(10, Math.round(fixedMinutes + cruiseMinutes));
}

function routeDistanceFactor(distanceNm: number, aircraftCategory: AircraftCategory) {
  if (aircraftCategory === "Jet") {
    return distanceNm < 250 ? 1.16 : distanceNm < 900 ? 1.1 : 1.06;
  }

  if (aircraftCategory === "Turboprop") {
    return distanceNm < 150 ? 1.12 : 1.07;
  }

  return distanceNm < 80 ? 1.08 : 1.04;
}

function realisticCruiseSpeed(distanceNm: number, aircraftCategory: AircraftCategory) {
  if (aircraftCategory === "Jet") {
    if (distanceNm < 250) {
      return 285;
    }

    if (distanceNm < 900) {
      return 385;
    }

    return 455;
  }

  if (aircraftCategory === "Turboprop") {
    return distanceNm < 120 ? 205 : 255;
  }

  return distanceNm < 60 ? 95 : 118;
}

function fixedFlightMinutes(
  distanceNm: number,
  aircraftCategory: AircraftCategory,
  from: Airport,
  to: Airport,
) {
  const airportDelay =
    airportComplexityMinutes(from, aircraftCategory) + airportComplexityMinutes(to, aircraftCategory);
  const internationalDelay = from.country === to.country ? 0 : aircraftCategory === "Jet" ? 8 : 4;
  const longRouteDelay = distanceNm > 1800 ? 12 : distanceNm > 900 ? 7 : 0;

  if (aircraftCategory === "Jet") {
    return (distanceNm < 250 ? 24 : 34) + airportDelay + internationalDelay + longRouteDelay;
  }

  if (aircraftCategory === "Turboprop") {
    return (distanceNm < 120 ? 14 : 20) + airportDelay + internationalDelay + longRouteDelay;
  }

  return (distanceNm < 60 ? 8 : 12) + airportDelay + internationalDelay;
}

function airportComplexityMinutes(airport: Airport, aircraftCategory: AircraftCategory) {
  const base =
    airport.difficulty === "Extrem"
      ? 7
      : airport.difficulty === "Schwer"
        ? 5
        : airport.difficulty === "Mittel"
          ? 3
          : 1;

  if (aircraftCategory === "Jet" && airport.runwayM >= 3000) {
    return base + 3;
  }

  return base;
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
