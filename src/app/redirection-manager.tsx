"use client";

import Cookies from "js-cookie";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { KNOWLEDGE_BASE, KNOWLEDGE_BASE_LICENSE, LICENSES } from "./links";

export default function RedirectionManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const firstPathSegment = pathname.split("/")[1];
    const license =
      firstPathSegment === KNOWLEDGE_BASE
        ? searchParams.get(KNOWLEDGE_BASE_LICENSE)
        : firstPathSegment;
    if (license && LICENSES.includes(license)) {
      Cookies.set("selected-license", license, {
        expires: 365,
        path: "/",
      });
    }
  }, [pathname, searchParams]);

  return null;
}
