/**
 * Dates of meaningful, visible copy changes made in application source.
 * Database-driven content dates are combined with these values in sitemap.ts.
 *
 * Keep the dynamic route patterns below; callers resolve them for concrete
 * URLs. Do not bump dates for styling, dependency, or infrastructure changes.
 */
export const STATIC_PAGE_UPDATED_AT = {
  "/": "2026-07-02T18:30:55.000Z",
  "/regulamin": "2026-07-25T14:38:01.000Z",
  "/baza-wiedzy": "2026-07-22T07:27:49.000Z",
  "/baza-wiedzy/[slug]": "2026-08-07T18:33:34.000Z",
  "/baza-pytan/[question_id]": "2026-08-08T10:29:01.000Z",
  "/[license]": "2026-08-18T00:00:00.000Z",
  "/[license]/nauka": "2026-07-02T18:29:08.000Z",
  "/[license]/egzamin": "2026-05-19T10:33:13.000Z",
  "/[license]/baza-pytan": "2026-08-08T10:07:45.000Z",
} as const;

export type StaticPagePattern = keyof typeof STATIC_PAGE_UPDATED_AT;

export function staticPageUpdatedAt(pattern: StaticPagePattern) {
  return new Date(STATIC_PAGE_UPDATED_AT[pattern]);
}
