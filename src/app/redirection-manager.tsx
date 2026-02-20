"use client";

import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LICENSES = ["ppla", "pplh", "spl", "bpl"];

export default function RedirectionManager() {
  const pathname = usePathname();

  useEffect(() => {
    const license = pathname.split("/")[1];
    if (license && LICENSES.includes(license)) {
      Cookies.set("selected-license", license, {
        expires: 365,
        path: "/",
      });
    }
  }, [pathname]);

  return null;
}
