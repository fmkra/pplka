"use client";

import { User } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, variants as buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "~/components/ui/dropdown-menu";
import { Spinner } from "~/components/ui/spinner";
import Image from "next/image";

export default function NavbarUser() {
  const session = useSession();

  const userIcon =
    session.status == "loading" ? (
      <Skeleton className="h-5 w-5 rounded-full" />
    ) : session.data?.user.image ? (
      <Image
        src={session.data.user.image}
        alt="User"
        width={24}
        height={24}
        className="rounded-full"
      />
    ) : (
      <User className="h-5 w-5" />
    );

  return (
    <div className="flex items-center">
      <div className="hidden items-center space-x-2 lg:flex">
        {session.status === "loading" ? (
          <Skeleton
            className={cn("h-9 w-28", buttonVariants.variant.default)}
          />
        ) : session.data?.user.name !== undefined ? (
          <>
            {userIcon}
            <span>{session.data?.user.name}</span>
            <Button className="w-28" onClick={() => signOut()}>
              Wyloguj się
            </Button>
          </>
        ) : (
          <Button className="w-28" onClick={() => signIn("google")}>
            Zaloguj się
          </Button>
        )}
      </div>

      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu użytkownika">
              {userIcon}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" align="end">
            {session.status === "loading" ? (
              <Spinner className="mx-auto size-6" />
            ) : session.data?.user.name !== undefined ? (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">
                      Zalogowano jako
                    </span>
                    <span className="text-foreground max-w-48 truncate text-sm font-medium">
                      {session.data.user.name}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer"
                >
                  Wyloguj się
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onClick={() => signIn("google")}
                className="cursor-pointer"
              >
                Zaloguj się z Google
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
