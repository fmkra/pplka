import { z } from "zod";

const catalogEntrySchema = z.object({
  version: z.string(),
  sha256: z.string(),
  bytes: z.number().int().nonnegative(),
  url: z.string(),
});

export const catalogManifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  questions: z.record(z.string(), catalogEntrySchema),
  knowledgeBase: catalogEntrySchema,
});

export const questionCatalogSchema = z.object({
  v: z.literal(1),
  l: z.tuple([z.number(), z.string(), z.string(), z.number()]),
  c: z.array(
    z.tuple([
      z.number(),
      z.string(),
      z.string(),
      z.string().nullable(),
      z.string().nullable(),
      z.string().nullable(),
      z.array(z.string()).nullable(),
      z.number(),
      z.number(),
    ]),
  ),
  q: z.array(
    z.tuple([
      z.string(),
      z.string().nullable(),
      z.string(),
      z.string(),
      z.string(),
      z.string(),
      z.string(),
      z.boolean(),
      z.array(z.string()),
    ]),
  ),
  i: z.array(z.tuple([z.string(), z.number(), z.number()])),
});

export const knowledgeBaseCatalogSchema = z.object({
  v: z.literal(1),
  n: z.array(
    z.tuple([
      z.string(),
      z.string(),
      z.string().nullable(),
      z.enum(["folder", "file"]),
      z.string().nullable(),
      z.number(),
    ]),
  ),
  e: z.array(z.tuple([z.string(), z.enum(["text", "image"]), z.string()])),
  ne: z.array(z.tuple([z.string(), z.string(), z.number()])),
  qe: z.array(
    z.tuple([z.string(), z.string(), z.string(), z.number(), z.boolean()]),
  ),
  qc: z.array(z.tuple([z.string(), z.string(), z.number()])),
  a: z.array(z.string().url()),
});

export type CatalogManifest = z.infer<typeof catalogManifestSchema>;
export type QuestionCatalog = z.infer<typeof questionCatalogSchema>;
export type KnowledgeBaseCatalog = z.infer<typeof knowledgeBaseCatalogSchema>;

export function expandCatalogId(value: string): string;
export function expandCatalogId(value: null): null;
export function expandCatalogId(value: string | null): string | null;
export function expandCatalogId(value: string | null) {
  if (value === null || !/^~[A-Za-z0-9_-]{22}$/.test(value)) return value;
  const binary = atob(
    `${value.slice(1).replaceAll("-", "+").replaceAll("_", "/")}==`,
  );
  const hex = Array.from(binary, (character) =>
    character.charCodeAt(0).toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
