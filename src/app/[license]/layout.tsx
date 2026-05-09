import { Footer } from "~/app/_components/footer";

export default async function LicenseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ license: string }>;
}) {
  const { license } = await params;
  return (
    <>
      {children}
      <Footer license={license} />
    </>
  );
}
