export type WeatherPayload = {
  location: string;
  temperatureC: number;
  windDirectionDeg: number;
  windSpeedKt: number;
  pressureHpa: number;
  visibilityM: number;
  cloudCoverage: number;
  rainPercent?: number;
  turbulence?: number;
  timeOfDay?: string;
  timeZoneOffsetMinutes?: number;
  weatherRadiusKm?: number;
};
