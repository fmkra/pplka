import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "~/env";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { db } from "~/server/db";
import { KNOWLEDGE_BASE } from "../links";

export async function POST(request: Request) {
  const revalidateKey = env.REVALIDATE_TOKEN;

  const body = (await request.json()) as unknown;
  const parsed = z
    .object({
      key: z.string(),
      slugs: z.array(z.string()),
      navigation: z.boolean(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request " + parsed.error.message, {
      status: 400,
    });
  }

  if (
    !timingSafeEqual(
      new TextEncoder().encode(parsed.data.key),
      new TextEncoder().encode(revalidateKey),
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const licenses = await db.query.licenses.findMany({
    columns: {
      url: true,
    },
  });

  revalidateTag("knowledge_base_tree", "max");
  for (const license of licenses) {
    for (const slug of parsed.data.slugs) {
      revalidatePath(
        `/${license.url}/${KNOWLEDGE_BASE}/${encodeURIComponent(slug)}`,
      );
    }
    if (parsed.data.navigation) {
      revalidatePath(`/${license.url}/${KNOWLEDGE_BASE}`);
    }
  }
  return new Response("OK");
}
