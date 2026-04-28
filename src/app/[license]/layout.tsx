import { notFound } from "next/navigation";
import { Footer } from "~/app/_components/footer";
import { db } from "~/server/db";
import { LicenseContextProvider } from "./license-context";

export default async function LicenseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ license: string }>;
}) {
  const { license: licenseUrl } = await params;
  const license = await db.query.licenses.findFirst({
    where: (licenses, { eq }) => eq(licenses.url, licenseUrl),
  });

  if (!license) {
    notFound();
  }

  return (
    <LicenseContextProvider license={license}>
      {children}
      <Footer license={license.url} />
    </LicenseContextProvider>
  );
}

export function generateStaticParams() {
  return db.query.licenses
    .findMany()
    .then((licenses) => licenses.map((license) => ({ license: license.url })));
}
