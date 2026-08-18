import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "~/env";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { KNOWLEDGE_BASE } from "../links";
import { recordContentRevisions } from "~/server/content-revisions";

export async function POST(request: Request) {
  const revalidateKey = env.REVALIDATE_TOKEN;

  const body = (await request.json()) as unknown;
  const parsed = z
    .object({
      key: z.string(),
      slugs: z.array(z.string()),
      questionIds: z.array(z.string()).default([]),
      questionListingLicenses: z.array(z.string()).default([]),
      navigation: z.boolean(),
      sourceRevision: z.string().min(1).max(128).optional(),
      updatedAt: z.string().datetime().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request " + parsed.error.message, {
      status: 400,
    });
  }

  const suppliedKey = new TextEncoder().encode(parsed.data.key);
  const expectedKey = new TextEncoder().encode(revalidateKey);
  if (
    suppliedKey.length !== expectedKey.length ||
    !timingSafeEqual(suppliedKey, expectedKey)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const revisionPaths = new Set<string>();
  for (const slug of parsed.data.slugs) {
    revisionPaths.add(`/${KNOWLEDGE_BASE}/${encodeURIComponent(slug)}`);
  }
  for (const questionId of parsed.data.questionIds) {
    revisionPaths.add(`/baza-pytan/${encodeURIComponent(questionId)}`);
  }
  for (const license of parsed.data.questionListingLicenses) {
    revisionPaths.add(`/${encodeURIComponent(license)}/baza-pytan`);
  }
  if (parsed.data.navigation) revisionPaths.add(`/${KNOWLEDGE_BASE}`);

  const { sourceRevision, updatedAt } = parsed.data;
  if (sourceRevision && updatedAt) {
    await recordContentRevisions(
      [...revisionPaths].map((path) => ({
        path,
        source: "explanations",
        revision: sourceRevision,
        updatedAt: new Date(updatedAt),
      })),
    );
  }

  if (parsed.data.navigation) {
    revalidateTag("knowledge_base_tree", "max");
  }
  for (const slug of parsed.data.slugs) {
    revalidatePath(`/${KNOWLEDGE_BASE}/${encodeURIComponent(slug)}`);
  }
  if (parsed.data.navigation) {
    revalidatePath(`/${KNOWLEDGE_BASE}`);
  }
  if (revisionPaths.size > 0) revalidatePath("/sitemap.xml");
  return new Response("OK");
}
