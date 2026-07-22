export const TOS = "regulamin";
export const ADMIN = "admin";
export const FEEDBACK = "feedback";
export const COMMENTS = "comments";
export const KNOWLEDGE_BASE = "baza-wiedzy";
export const LICENSE_SEARCH_PARAM = "licencja";
export const nonLicenseUrls = [TOS, ADMIN, KNOWLEDGE_BASE];
export const LEARN = "nauka";
export const QUESTIONS = "baza-pytan";
export const EXAM = "egzamin";
export const LICENSES = ["ppla", "pplh", "spl", "bpl"];

export function knowledgeBaseHref(license?: string, slug?: string) {
  const pathname = `/${KNOWLEDGE_BASE}${slug ? `/${encodeURIComponent(slug)}` : ""}`;
  return license
    ? `${pathname}?${LICENSE_SEARCH_PARAM}=${encodeURIComponent(license)}`
    : pathname;
}

export const QUESTIONS_KNOWLEDGE_BASE_ID = "wyjasnienie";
export const QUESTIONS_SEARCH = "wyszukiwanie";
export const QUESTIONS_CATEGORIES = "przedmioty";
