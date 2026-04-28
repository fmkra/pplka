"use client";

import { useRouter, useSearchParams } from "next/navigation";

export const MODE = {
  empty: "empty",
  emptyIsNull: "empty-is-null",
  nullable: "nullable",
} as const;

type SearchStateMode = (typeof MODE)[keyof typeof MODE];

export function useSearchState(
  name: string,
  mode: "empty",
): readonly [string, (value: string) => void];
export function useSearchState(
  name: string,
  mode: "empty-is-null" | "nullable",
): readonly [string | null, (value: string | null) => void];
export function useSearchState(
  name: string,
  mode: SearchStateMode,
):
  | readonly [string, (value: string) => void]
  | readonly [string | null, (value: string | null) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawState = searchParams.get(name);
  if (mode === "empty") {
    const state = rawState ?? "";
    const setState = (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === "") {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      router.replace(`?${params.toString()}`);
    };
    return [state, setState] as const;
  }

  const setState = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (mode === "empty-is-null" && value === "") value = null;
    if (value === null) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    router.replace(`?${params.toString()}`);
  };
  return [rawState, setState] as const;
}
