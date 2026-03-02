import { db } from "~/server/db";

export default function Page() {
  return null;
}

export async function generateStaticParams() {
  const licensesData = await db.query.licenses.findMany({
    columns: {
      url: true,
    },
  });
  return licensesData.map((license) => ({
    license: license.url,
  }));
}
