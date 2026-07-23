export function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null) return '–';
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}
