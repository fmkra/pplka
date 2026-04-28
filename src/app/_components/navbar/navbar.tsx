import { db } from "~/server/db";
import { licenses } from "~/server/db/license";
import { asc } from "drizzle-orm";
import Navigation from "./navigation";
import NavbarUser from "./user";

export default async function Navbar() {
  const licenseList = await db
    .select()
    .from(licenses)
    .orderBy(asc(licenses.id));

  const options = licenseList.map((license) => ({
    value: license.url,
    label: license.name,
  }));

  return (
    <nav className="relative border-b">
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 absolute inset-0 -z-10 backdrop-blur" />
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Navigation options={options} />
          <NavbarUser />
        </div>
      </div>
    </nav>
  );
}
