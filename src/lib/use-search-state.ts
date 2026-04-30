"use client";

import { parseAsString, useQueryState } from "nuqs";

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
  const [state, setStateInternal] = useQueryState(name, parseAsString.withOptions({
    history: "replace",
    shallow: true,
  }));

  if (mode === "empty") {
    const setState = (value: string) =>
      void setStateInternal(value === "" ? null : value);
    return [state ?? "", setState] as const;
  }

  const setState = (value: string | null) =>
    void setStateInternal(mode === "empty-is-null" && value === "" ? null : value);
  const parsedState = mode === "empty-is-null" && state === "" ? null : state;
  return [parsedState, setState] as const;
}
