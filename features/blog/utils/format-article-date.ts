// Formats an article's ISO date (e.g. "2026-09-20") into a localized,
// Gregorian-calendar string for display in the blog UI.
export function formatArticleDate(iso: string, locale: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  }).format(date);
}
