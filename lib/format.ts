const dateFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Dates are stored as plain "YYYY-MM-DD"; pin them to UTC so the day never
// shifts with the server's or the visitor's time zone.
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export function formatDate(iso: string): string {
  return dateFormat.format(toDate(iso));
}

export function formatDateRange(from: string, to: string): string {
  return from === to
    ? formatDate(from)
    : dateFormat.formatRange(toDate(from), toDate(to));
}
