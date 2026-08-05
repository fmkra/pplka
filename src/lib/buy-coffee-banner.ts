const supportedSections = [
  "baza-wiedzy",
  "baza-pytan",
  "nauka",
  "egzamin",
] as const;

const excludedTopLevelRoutes = new Set(["admin", "regulamin", "~offline"]);

export function isBuyCoffeeBannerPathname(pathname: string) {
  if (pathname === "/") return true;
  if (!pathname.startsWith("/")) return false;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) {
    return !excludedTopLevelRoutes.has(segments[0] ?? "");
  }
  if (segments.length !== 2) return false;

  return (supportedSections as readonly string[]).includes(segments[1] ?? "");
}
