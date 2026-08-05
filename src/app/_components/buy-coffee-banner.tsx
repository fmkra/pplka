"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isBuyCoffeeBannerPathname } from "~/lib/buy-coffee-banner";
import { api } from "~/trpc/react";
import deploymentContent from "~/deployment_content.json";

const BUY_COFFEE_URL = "https://buycoffee.to/filip-krawczyk";
const SHOW_AFTER_MS = 3 * 60 * 1000;
const SNOOZE_FOR_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_DISMISSAL_COUNT = 2_147_483_647;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STORAGE = {
  firstVisitedAt: "buyCoffee.firstVisitedAt",
  snoozedUntil: "buyCoffee.snoozedUntil",
  neverShow: "buyCoffee.neverShow",
  activeDisplayId: "buyCoffee.activeDisplayId",
  dismissalCount: "buyCoffee.dismissalCount",
} as const;

function normalizePathname(pathname: string) {
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function createDisplayId() {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return null;
  }
}

function getDismissalCount(storage: Storage) {
  const value = Number(storage.getItem(STORAGE.dismissalCount));
  return Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_DISMISSAL_COUNT
    ? value
    : 0;
}

export function BuyCoffeeBanner() {
  const pathname = normalizePathname(usePathname());
  const [visible, setVisible] = useState(false);
  const { mutate: recordImpression } =
    api.buyCoffeeBanner.recordImpression.useMutation();

  useEffect(() => {
    setVisible(false);

    if (!isBuyCoffeeBannerPathname(pathname)) return;

    let storage: Storage;
    try {
      storage = window.localStorage;
      storage.removeItem("buyCoffee.clientId");
      if (storage.getItem(STORAGE.neverShow) === "true") return;

      // Writing the normalized counter verifies that storage is writable.
      // Some privacy modes expose localStorage but throw on every write.
      storage.setItem(
        STORAGE.dismissalCount,
        String(getDismissalCount(storage)),
      );

      const existingDisplayId = storage.getItem(STORAGE.activeDisplayId);
      if (existingDisplayId && UUID_PATTERN.test(existingDisplayId)) {
        setVisible(true);
        return;
      }
      if (existingDisplayId) storage.removeItem(STORAGE.activeDisplayId);

      const now = Date.now();
      let firstVisitedAt = Number(storage.getItem(STORAGE.firstVisitedAt));
      if (!Number.isFinite(firstVisitedAt) || firstVisitedAt <= 0) {
        firstVisitedAt = now;
        storage.setItem(STORAGE.firstVisitedAt, String(firstVisitedAt));
      }

      const snoozedUntil = Number(storage.getItem(STORAGE.snoozedUntil)) || 0;
      const showAt = Math.max(firstVisitedAt + SHOW_AFTER_MS, snoozedUntil);

      const showBanner = () => {
        try {
          if (storage.getItem(STORAGE.neverShow) === "true") return;
          if (storage.getItem(STORAGE.activeDisplayId)) {
            setVisible(true);
            return;
          }

          const currentSnoozedUntil =
            Number(storage.getItem(STORAGE.snoozedUntil)) || 0;
          if (currentSnoozedUntil > Date.now()) return;

          const displayId = createDisplayId();
          if (!displayId) return;

          // Persisting the display first makes the tracking request one-shot.
          // If storage throws, the banner stays hidden.
          storage.setItem(STORAGE.activeDisplayId, displayId);
          setVisible(true);

          recordImpression({
            displayId,
            dismissalCount: getDismissalCount(storage),
            pathname,
          });
        } catch {
          setVisible(false);
        }
      };

      if (showAt <= now) {
        showBanner();
        return;
      }

      const timeout = window.setTimeout(showBanner, showAt - now);
      return () => window.clearTimeout(timeout);
    } catch {
      setVisible(false);
      return;
    }
  }, [pathname, recordImpression]);

  const dismissTemporarily = () => {
    try {
      localStorage.setItem(
        STORAGE.dismissalCount,
        String(
          Math.min(getDismissalCount(localStorage) + 1, MAX_DISMISSAL_COUNT),
        ),
      );
      localStorage.setItem(
        STORAGE.snoozedUntil,
        String(Date.now() + SNOOZE_FOR_MS),
      );
      localStorage.removeItem(STORAGE.activeDisplayId);
    } catch {
      // Storage failure must never make the banner remain visible.
    } finally {
      setVisible(false);
    }
  };

  const dismissPermanently = () => {
    try {
      localStorage.setItem(STORAGE.neverShow, "true");
      localStorage.removeItem(STORAGE.activeDisplayId);
    } catch {
      // Storage failure must never make the banner remain visible.
    } finally {
      setVisible(false);
    }
  };

  if (!visible || !isBuyCoffeeBannerPathname(pathname)) return null;

  return (
    <aside
      className="container mx-auto mt-2 px-4"
      aria-label="Wesprzyj PPLka.pl"
    >
      <div className="bg-primary/5 border-primary/20 mx-auto mb-4 grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 rounded-xl border p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="min-w-0">
          <p className="font-medium">Pomóż nam utrzymać PPLka.pl</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Chcemy, żeby wiedza lotnicza była dostępna za darmo, ale serwery
            niestety nie są :( <br /> Jeśli PPLka.pl Ci pomaga, możesz postawić
            nam kawę.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Możesz też pomóc, współtworząc wyjaśnienia do pytań. Napisz do nas:{" "}
            <a
              href={`mailto:${deploymentContent.contact}`}
              className="text-foreground underline underline-offset-2 hover:no-underline"
            >
              {deploymentContent.contact}
            </a>
            .
          </p>
        </div>

        <div className="col-span-2 row-start-2 justify-self-center text-center md:col-span-1 md:col-start-2 md:row-start-1">
          <a
            href={BUY_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {/* Local copy of the share image supplied by buycoffee.to. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/buycoffee-share-button-primary.png"
              width={500}
              height={131}
              className="h-auto w-[190px] max-w-full"
              alt="Postaw kawę dla Filip Krawczyk na buycoffee.to"
            />
          </a>
          <button
            type="button"
            onClick={dismissPermanently}
            className="text-muted-foreground hover:text-foreground mt-2 cursor-pointer text-xs underline underline-offset-2 transition-colors"
          >
            Nie pokazuj ponownie
          </button>
        </div>

        <button
          type="button"
          onClick={dismissTemporarily}
          className="hover:bg-muted col-start-2 row-start-1 flex size-8 cursor-pointer items-center justify-center self-start rounded-full transition-colors md:col-start-3"
          aria-label="Zamknij na 3 dni"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
