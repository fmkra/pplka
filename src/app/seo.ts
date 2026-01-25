import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const licenseNames: Record<string, {short: string, long: string}> = {
  ppla: {short: "PPL(A)", long: "pilota turystycznego samolotowego"},
  spl: {short: "SPL", long: "pilota szybowcowego"},
  bpl: {short: "BPL", long: "pilota balonowego"},
  pplh: {short: "PPL(H)", long: "pilota śmigłowcowego"},
};

export const metadataBuilder = (builder: (url: string, name: {short: string, long: string}) => {title: string, description: string, image?: string}) => {

  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ license: string }>;
  }): Promise<Metadata> {
    const { license } = await params;
    const name = licenseNames[license];
    if (!name) notFound();

    const {title, description, image} = builder(license, name);

    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        title: `${title} | PPLka.pl`,
        description,
      },
    };
    if(image) metadata.openGraph!.images = [image];
    return metadata;
  }
}
