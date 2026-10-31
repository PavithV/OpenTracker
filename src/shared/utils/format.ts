// dayjs läuft in dieser App ohne 'de'-Locale (nirgends per `dayjs.locale('de')` konfiguriert --
// alle bestehenden `.format(...)`-Aufrufe verwenden rein numerische Formate wie 'DD.MM.YYYY',
// die davon unabhängig sind). Ein eigenes globales Locale-Setup wäre Scope-Creep -- daher hier
// ein eigenes Array statt `.format('MMMM')`.
export const GERMAN_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

// Short forms for tight spots like chart axes, where six full month names overlap on a phone.
export const GERMAN_MONTHS_SHORT = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null) return '–';
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export function capitalize(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
