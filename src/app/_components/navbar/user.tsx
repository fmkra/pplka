"use client";

import { User } from "lucide-react";
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
import { ADMIN } from "~/app/links";

export default function NavbarUser() {
  const session = useSession();

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
            {session.data.user.isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href={`/${ADMIN}`}>Admin</Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer"
            >
              Wyloguj się
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
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
              <DropdownMenuItem
                onClick={() => signIn("google")}
                className="cursor-pointer"
              >
                Zaloguj się z Google
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
