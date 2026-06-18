export type TimeZoneOption = {
  label: string;
  offsetMinutes: number;
  region: string;
};

export const timeZoneOptions: TimeZoneOption[] = [
  { label: "UTC-10", offsetMinutes: -600, region: "Hawaii" },
  { label: "UTC-9", offsetMinutes: -540, region: "Alaska" },
  { label: "UTC-8", offsetMinutes: -480, region: "USA Westküste" },
  { label: "UTC-7", offsetMinutes: -420, region: "USA Mountain" },
  { label: "UTC-6", offsetMinutes: -360, region: "USA Central" },
  { label: "UTC-5", offsetMinutes: -300, region: "USA Ostküste" },
  { label: "UTC-4", offsetMinutes: -240, region: "Karibik, Ostkanada" },
  { label: "UTC-3", offsetMinutes: -180, region: "Brasilien, Argentinien" },
  { label: "UTC-2", offsetMinutes: -120, region: "Mittelatlantik" },
  { label: "UTC-1", offsetMinutes: -60, region: "Azoren" },
  { label: "UTC+0", offsetMinutes: 0, region: "London, Portugal" },
  { label: "UTC+1", offsetMinutes: 60, region: "Deutschland, Österreich, Schweiz" },
  { label: "UTC+2", offsetMinutes: 120, region: "Griechenland, Finnland" },
  { label: "UTC+3", offsetMinutes: 180, region: "Türkei, Saudi-Arabien" },
  { label: "UTC+4", offsetMinutes: 240, region: "Dubai, Oman" },
  { label: "UTC+5", offsetMinutes: 300, region: "Pakistan, Usbekistan" },
  { label: "UTC+5:30", offsetMinutes: 330, region: "Indien" },
  { label: "UTC+6", offsetMinutes: 360, region: "Bangladesch" },
  { label: "UTC+7", offsetMinutes: 420, region: "Thailand, Vietnam" },
  { label: "UTC+8", offsetMinutes: 480, region: "China, Singapur" },
  { label: "UTC+9", offsetMinutes: 540, region: "Japan, Südkorea" },
  { label: "UTC+10", offsetMinutes: 600, region: "Sydney, Brisbane" },
  { label: "UTC+11", offsetMinutes: 660, region: "Salomonen" },
  { label: "UTC+12", offsetMinutes: 720, region: "Neuseeland" },
].sort((first, second) => first.offsetMinutes - second.offsetMinutes);
