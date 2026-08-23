"use client";

import { HardDriveDownload, LogOut, Shield, User, WifiOff } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "~/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { ADMIN, OFFLINE_DOWNLOADS } from "~/app/links";
import { usePwaContext } from "../pwa-context";

export default function NavbarUser() {
  const session = useSession();
  const { isOnline, isConnectivityKnown, isPwa } = usePwaContext();
  const showOfflineDownloads = isPwa === true;

  const userIcon =
    session.status == "loading" ? (
      <Skeleton className="size-6 rounded-full" />
    ) : session.data?.user.image ? (
      <Image
        src={session.data.user.image}
        alt="User"
        width={24}
        height={24}
        className="size-6 rounded-full"
      />
    ) : (
      <User className="size-4" />
    );

  if (!isConnectivityKnown) {
    return <Skeleton className="h-9 w-9 rounded-md lg:w-36" />;
  }

  if (!isOnline) {
    return (
      <div
        className="text-muted-foreground flex h-9 items-center gap-2 px-2 text-sm"
        aria-label="Brak połączenia z internetem"
        title="Brak połączenia z internetem"
      >
        <WifiOff className="size-5" />
        <span className="hidden sm:inline">Brak połączenia</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {session.status === "loading" ? (
        <Skeleton className="h-9 w-9 rounded-md lg:w-36" />
      ) : session.data?.user.name !== undefined ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="px-2 lg:w-auto lg:px-3"
              aria-label="Menu użytkownika"
            >
              {userIcon}
              <span className="hidden max-w-40 truncate lg:inline">
                {session.data.user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" align="end">
            <DropdownMenuLabel className="font-normal lg:hidden">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">
                  Zalogowano jako
                </span>
                <span className="text-foreground max-w-48 truncate text-sm font-medium">
                  {session.data.user.name}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="lg:hidden" />
            {showOfflineDownloads ? (
              <DropdownMenuItem asChild>
                <Link href={`/${OFFLINE_DOWNLOADS}`} prefetch={false}>
                  <HardDriveDownload className="size-4" />
                  Pobrane materiały
                </Link>
              </DropdownMenuItem>
            ) : null}
            {session.data.user.isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href={`/${ADMIN}`}>
                  <Shield className="size-4" />
                  Admin
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer"
            >
              <LogOut className="size-4" />
              Wyloguj się
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          {showOfflineDownloads ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              asChild
            >
              <Link
                href={`/${OFFLINE_DOWNLOADS}`}
                prefetch={false}
                aria-label="Zarządzaj pobranymi materiałami"
              >
                <HardDriveDownload className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Button
            className="hidden w-28 lg:inline-flex"
            onClick={() => signIn("google")}
          >
            Zaloguj się
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Menu użytkownika"
              >
                {userIcon}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56" align="end">
              {showOfflineDownloads ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/${OFFLINE_DOWNLOADS}`} prefetch={false}>
                      <HardDriveDownload className="size-4" />
                      Pobrane materiały
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                onClick={() => signIn("google")}
                className="cursor-pointer"
              >
                <User className="size-4" />
                Zaloguj się z Google
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
