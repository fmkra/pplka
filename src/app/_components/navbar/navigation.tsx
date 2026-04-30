"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "~/lib/utils";
import Link from "next/link";
import { Select, type SelectOption } from "~/components/ui/select";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Database,
  GraduationCap,
  Home,
  Menu,
  FileCheck,
  X,
  Plane,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { clearLicense } from "~/app/actions";
import { usePwaContext } from "../pwa-context";
import {
  EXAM,
  LEARN,
  nonLicenseUrls,
  QUESTIONS,
  KNOWLEDGE_BASE,
} from "~/app/links";

const navigation = [
  { name: "Start", href: "", icon: Home, disabledInOffline: false },
  {
    name: "Baza wiedzy",
    href: KNOWLEDGE_BASE,
    icon: BookOpen,
    disabledInOffline: true,
  },
  { name: "Nauka", href: LEARN, icon: GraduationCap, disabledInOffline: true },
  {
    name: "Baza pytań",
    href: QUESTIONS,
    icon: Database,
    disabledInOffline: false,
  },
  { name: "Egzamin", href: EXAM, icon: FileCheck, disabledInOffline: true },
];

export default function Navigation({ options }: { options: SelectOption[] }) {
  const router = useRouter();
  const { isOnline } = usePwaContext();
  const selectLicense = (license: string) => router.push(`/${license}`);
  const pathname = usePathname().split("/");
  const license =
    pathname[1] === "" || (pathname[1] && nonLicenseUrls.includes(pathname[1]))
      ? undefined
      : pathname[1];
  const page = pathname[2] ?? "";

  if (!license)
    return (
      <div className="flex items-center gap-2">
        <button
          className="flex cursor-pointer items-center"
          onClick={clearLicense}
          aria-label="Strona główna - wybór licencji"
        >
          <Plane className="h-6 w-6" />
        </button>
        <Select
          className="w-42"
          placeholder="Wybierz licencję"
          aria-label="Wybierz licencję"
          options={options}
          value={license}
          onValueChange={selectLicense}
        />
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-1 md:flex">
        <button
          className="flex cursor-pointer items-center"
          onClick={clearLicense}
          aria-label="Strona główna - wybór licencji"
        >
          <Plane className="h-6 w-6" />
        </button>

        <Select
          className="mr-4 ml-1 w-24"
          placeholder="Wybierz licencję"
          aria-label="Wybierz licencję"
          options={options}
          value={license}
          onValueChange={selectLicense}
        />

        {navigation.map((item) => {
          const Icon = item.icon;
          const isDisabledInOffline = !isOnline && item.disabledInOffline;
          return (
            <Link
              key={item.name}
              href={`/${license}/${item.href}`}
              onClick={
                isDisabledInOffline
                  ? (event) => {
                      event.preventDefault();
                    }
                  : undefined
              }
              title={
                isDisabledInOffline
                  ? "Zakładka niedostępna w trybie offline"
                  : undefined
              }
              aria-disabled={isDisabledInOffline}
              className={cn(
                "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isDisabledInOffline
                  ? "text-muted-foreground/50 hover:text-muted-foreground/50 cursor-not-allowed hover:bg-transparent"
                  : page === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <MobileSidebar
        license={license}
        page={page}
        isOnline={isOnline}
        options={options}
        selectLicense={selectLicense}
      />
    </div>
  );
}

function MobileSidebar({
  license,
  page,
  isOnline,
  options,
  selectLicense,
}: {
  license: string;
  page: string;
  isOnline: boolean;
  options: SelectOption[];
  selectLicense: (license: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Otwórz menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-full max-w-72 flex-col bg-white transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <button
            className="flex cursor-pointer items-center gap-2"
            aria-label="Strona główna - wybór licencji"
            onClick={() => {
              void clearLicense();
              close();
            }}
          >
            <Plane className="h-6 w-6" />
            <span className="text-sm font-medium">Wybór licencji</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Zamknij menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto p-4">
          <Select
            className="mb-3 w-full"
            placeholder="Wybierz licencję"
            aria-label="Wybierz licencję"
            options={options}
            value={license}
            onValueChange={selectLicense}
          />

          {navigation.map((item) => {
            const Icon = item.icon;
            const href = `/${license}/${item.href}`;
            const active = page === item.href;
            const isDisabledInOffline = !isOnline && item.disabledInOffline;
            return (
              <Link
                key={item.name}
                href={href}
                onClick={
                  isDisabledInOffline
                    ? (event) => {
                        event.preventDefault();
                      }
                    : close
                }
                title={
                  isDisabledInOffline
                    ? "Zakładka niedostępna w trybie offline"
                    : undefined
                }
                aria-disabled={isDisabledInOffline}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isDisabledInOffline
                    ? "text-muted-foreground/50 hover:text-muted-foreground/50 cursor-not-allowed hover:bg-transparent"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
