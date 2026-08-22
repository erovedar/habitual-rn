// Local-date arithmetic on plain "YYYY-MM-DD" strings, deliberately never
// touching wall-clock time or the runtime's local timezone. A LocalDate is
// the calendar day a habit was completed on, as reported by the device —
// not a timestamp to be re-derived from one. Every function here is pure
// and timezone-naive by construction: it treats the string as UTC midnight
// purely as a stable integer encoding, never as "the actual time."

export type LocalDate = string; // "YYYY-MM-DD"

const MS_PER_DAY = 86_400_000;

function toEpochDay(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function fromEpochDay(epochDay: number): LocalDate {
  const dt = new Date(epochDay * MS_PER_DAY);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidLocalDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(date: LocalDate, n: number): LocalDate {
  return fromEpochDay(toEpochDay(date) + n);
}

// a - b, in whole days. Positive when a is after b.
export function diffDays(a: LocalDate, b: LocalDate): number {
  return toEpochDay(a) - toEpochDay(b);
}

export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return toEpochDay(a) - toEpochDay(b);
}
