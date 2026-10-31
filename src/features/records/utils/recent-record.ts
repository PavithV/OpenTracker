const RECENT_RECORD_DAYS = 7;

// "Neu" badge on the records screen (PRODUCT_AUDIT.md roadmap #39): a record set within the last
// week. achievedAt is the newer of the exercise's max_weight / estimated_1rm timestamps.
export function isRecentRecord(achievedAt: string, now: Date = new Date()): boolean {
  const ageMs = now.getTime() - new Date(achievedAt).getTime();
  return ageMs >= 0 && ageMs <= RECENT_RECORD_DAYS * 24 * 60 * 60 * 1000;
}
