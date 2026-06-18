import { sendDatarefs } from "@/lib/xplane/udp";
import type { WeatherPayload } from "@/lib/weather/types";

export function createExtremeWeatherPayload(): WeatherPayload {
  return {
    location: "X-Plane Extremtest",
    temperatureC: -5,
    windDirectionDeg: 90,
    windSpeedKt: 55,
    pressureHpa: 985,
    visibilityM: 700,
    cloudCoverage: 95,
    rainPercent: 100,
    turbulence: 8,
  };
}

export async function sendWeatherToXPlane(payload: WeatherPayload) {
  const windSpeedMsc = payload.windSpeedKt * 0.514444;
  const pressurePas = payload.pressureHpa * 100;
  const visibilitySm = payload.visibilityM / 1609.344;
  const cloudCoverageRatio = payload.cloudCoverage / 100;
  const rainRatio = (payload.rainPercent ?? 0) / 100;
  const turbulence = payload.turbulence ?? 0;
  const variability = weatherRadiusToVariability(payload.weatherRadiusKm ?? 30);
  const timeDatarefs = createTimeDatarefs(payload);

  return sendDatarefs([
    ...timeDatarefs,
    {
      path: "sim/weather/region/update_immediately",
      value: 1,
    },
    {
      path: "sim/weather/region/variability_pct",
      value: variability,
    },
    {
      path: "sim/weather/region/sealevel_temperature_c",
      value: payload.temperatureC,
    },
    {
      path: "sim/weather/region/qnh_pas",
      value: pressurePas,
    },
    {
      path: "sim/weather/region/sealevel_pressure_pas",
      value: pressurePas,
    },
    {
      path: "sim/weather/region/visibility_reported_sm",
      value: visibilitySm,
    },
    {
      path: "sim/weather/region/rain_percent",
      value: rainRatio,
    },
    {
      path: "sim/weather/region/wind_altitude_msl_m[0]",
      value: 0,
    },
    {
      path: "sim/weather/region/wind_speed_msc[0]",
      value: windSpeedMsc,
    },
    {
      path: "sim/weather/region/wind_direction_degt[0]",
      value: payload.windDirectionDeg,
    },
    {
      path: "sim/weather/region/turbulence[0]",
      value: turbulence,
    },
    {
      path: "sim/weather/region/cloud_type[0]",
      value: cloudCoverageRatio > 0.7 ? 3 : 2,
    },
    {
      path: "sim/weather/region/cloud_coverage_percent[0]",
      value: cloudCoverageRatio,
    },
    {
      path: "sim/weather/region/cloud_base_msl_m[0]",
      value: 350,
    },
    {
      path: "sim/weather/region/cloud_tops_msl_m[0]",
      value: 2200,
    },
  ]);
}

function weatherRadiusToVariability(radiusKm: number) {
  const clampedRadius = Math.min(Math.max(radiusKm, 5), 50);
  const ratio = (clampedRadius - 5) / 45;
  return 0.06 + ratio * 0.18;
}

function createTimeDatarefs(payload: WeatherPayload) {
  if (!payload.timeOfDay) {
    return [];
  }

  const [hours, minutes] = payload.timeOfDay.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return [];
  }

  const localSeconds = hours * 3600 + minutes * 60;
  const offsetSeconds = (payload.timeZoneOffsetMinutes ?? 0) * 60;
  const zuluSeconds = positiveModulo(localSeconds - offsetSeconds, 86400);

  return [
    {
      path: "sim/time/use_system_time",
      value: 0,
    },
    {
      path: "sim/time/zulu_time_sec",
      value: zuluSeconds,
    },
  ];
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
